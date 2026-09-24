import crypto from 'node:crypto';
import { PublicClientApplication } from '@azure/msal-node';
import { store, encryptSecret, decryptSecret } from './store.js';
import { changeSkin } from './skinService.js';
import { createSerialQueue } from '../../shared/serialQueue.js';

const skinWrites = createSerialQueue();

const MICROSOFT_SCOPES = ['XboxLive.signin', 'offline_access'];

function offlineUuid(username){
  const data=Buffer.from(`OfflinePlayer:${username}`,'utf8');
  const bytes=crypto.createHash('md5').update(data).digest();
  bytes[6]=(bytes[6]&0x0f)|0x30;
  bytes[8]=(bytes[8]&0x3f)|0x80;
  const h=bytes.toString('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
function publicAccount(a){const {secret,...rest}=a;return rest;}
function saveAccount(account){
  const all=store.get('accounts').filter(a=>a.id!==account.id);
  all.push(account);
  store.set('accounts',all);
  return account;
}
function microsoftApp(clientId){
  return new PublicClientApplication({auth:{clientId,authority:'https://login.microsoftonline.com/consumers'}});
}

export function listAccounts(){return store.get('accounts').map(publicAccount);}
export function activeAccount(){const id=store.get('activeAccountId');return store.get('accounts').find(x=>x.id===id)||null;}

export function addOffline(username){
  username=String(username||'').trim();
  if(!/^[A-Za-z0-9_]{3,16}$/.test(username)) throw new Error('Offline username must be 3–16 letters, numbers, or underscore.');
  const uuid=offlineUuid(username);
  const account={id:`offline:${uuid}`,type:'offline',username,uuid,createdAt:new Date().toISOString()};
  saveAccount(account);
  store.set('activeAccountId',account.id);
  return publicAccount(account);
}

async function readJson(response, label){
  const body=await response.json().catch(()=>null);
  if(!response.ok) {
    const detail=body?.errorMessage||body?.message||body?.error_description||'';
    throw new Error(`${label} failed (${response.status})${detail?`: ${detail}`:''}.`);
  }
  return body;
}

async function xboxExchange(msToken){
  const xblRes=await fetch('https://user.auth.xboxlive.com/user/authenticate',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({Properties:{AuthMethod:'RPS',SiteName:'user.auth.xboxlive.com',RpsTicket:`d=${msToken}`},RelyingParty:'http://auth.xboxlive.com',TokenType:'JWT'})});
  const xbl=await readJson(xblRes,'Xbox Live authentication');
  const uhs=xbl.DisplayClaims?.xui?.[0]?.uhs;
  if(!uhs||!xbl.Token) throw new Error('Xbox Live authentication returned an incomplete token.');

  const xstsRes=await fetch('https://xsts.auth.xboxlive.com/xsts/authorize',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({Properties:{SandboxId:'RETAIL',UserTokens:[xbl.Token]},RelyingParty:'rp://api.minecraftservices.com/',TokenType:'JWT'})});
  const xsts=await readJson(xstsRes,'XSTS authentication');
  if(!xsts.Token) throw new Error('XSTS authentication returned an incomplete token.');

  const mcRes=await fetch('https://api.minecraftservices.com/authentication/login_with_xbox',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({identityToken:`XBL3.0 x=${uhs};${xsts.Token}`})});
  const mc=await readJson(mcRes,'Minecraft Services login');
  if(!mc?.access_token) throw new Error('Minecraft Services did not return an access token.');

  const headers={Authorization:`Bearer ${mc.access_token}`};
  const entRes=await fetch('https://api.minecraftservices.com/entitlements/mcstore',{headers});
  const ent=await readJson(entRes,'Minecraft ownership check');
  if(!Array.isArray(ent?.items)||ent.items.length===0) throw new Error('This Microsoft account does not own Minecraft Java Edition.');

  const profileRes=await fetch('https://api.minecraftservices.com/minecraft/profile',{headers});
  const profile=await readJson(profileRes,'Minecraft profile request');
  if(!profile?.id||!profile?.name) throw new Error('Minecraft profile response was incomplete.');
  return {mc,profile,xuid:xsts.DisplayClaims?.xui?.[0]?.xid||''};
}

export async function loginMicrosoft(deviceCodeCallback){
  const clientId=store.get('settings.azureClientId')||process.env.ETERNAL_AZURE_CLIENT_ID;
  if(!clientId) throw new Error('Set your own Microsoft Entra/Azure Client ID in Settings first.');
  const pca=microsoftApp(clientId);
  const token=await pca.acquireTokenByDeviceCode({scopes:MICROSOFT_SCOPES,deviceCodeCallback});
  if(!token?.accessToken||!token?.account?.homeAccountId) throw new Error('Microsoft sign-in did not return a reusable account session.');
  const {mc,profile,xuid}=await xboxExchange(token.accessToken);
  const id=`msa:${profile.id}`;
  const account={
    id,
    type:'microsoft',
    username:profile.name,
    uuid:profile.id,
    skinUrl:profile.skins?.[0]?.url||'',
    createdAt:new Date().toISOString(),
    secret:encryptSecret({
      mcAccessToken:mc.access_token,
      mcExpiresAt:Date.now()+((mc.expires_in||86400)*1000),
      xuid,
      clientId,
      homeAccountId:token.account.homeAccountId,
      msalCache:pca.getTokenCache().serialize()
    })
  };
  saveAccount(account);
  store.set('activeAccountId',id);
  return publicAccount(account);
}

async function refreshMicrosoftAccount(account, secret){
  const clientId=secret.clientId||store.get('settings.azureClientId')||process.env.ETERNAL_AZURE_CLIENT_ID;
  if(!clientId||!secret.msalCache||!secret.homeAccountId) {
    throw new Error('Microsoft session expired and cannot be refreshed. Sign in with Microsoft again.');
  }
  const pca=microsoftApp(clientId);
  pca.getTokenCache().deserialize(secret.msalCache);
  const cached=await pca.getTokenCache().getAccountByHomeId(secret.homeAccountId);
  if(!cached) throw new Error('Microsoft cached account is unavailable. Sign in again.');
  let token;
  try {
    token=await pca.acquireTokenSilent({account:cached,scopes:MICROSOFT_SCOPES});
  } catch {
    throw new Error('Microsoft session expired and silent renewal failed. Sign in again.');
  }
  if(!token?.accessToken) throw new Error('Microsoft silent renewal returned no access token. Sign in again.');
  const {mc,profile,xuid}=await xboxExchange(token.accessToken);
  const refreshed={
    ...account,
    username:profile.name||account.username,
    uuid:profile.id||account.uuid,
    skinUrl:profile.skins?.[0]?.url||account.skinUrl||'',
    secret:encryptSecret({
      ...secret,
      mcAccessToken:mc.access_token,
      mcExpiresAt:Date.now()+((mc.expires_in||86400)*1000),
      xuid,
      clientId,
      homeAccountId:token.account?.homeAccountId||secret.homeAccountId,
      msalCache:pca.getTokenCache().serialize()
    })
  };
  saveAccount(refreshed);
  return {account:refreshed,secret:decryptSecret(refreshed.secret)};
}

export async function launcherAuthorization(account){
  if(!account) throw new Error('Select an account first.');
  if(account.type==='offline') return {access_token:'',client_token:account.uuid,uuid:account.uuid.replaceAll('-',''),name:account.username,user_properties:'{}',meta:{type:'mojang',demo:false}};
  let currentAccount=account;
  let sec=decryptSecret(account.secret);
  if(!sec?.mcAccessToken) throw new Error('Microsoft session is missing. Sign in again.');
  if(!sec.mcExpiresAt||sec.mcExpiresAt<Date.now()+5*60*1000) {
    const refreshed=await refreshMicrosoftAccount(account,sec);
    currentAccount=refreshed.account;
    sec=refreshed.secret;
  }
  return {access_token:sec.mcAccessToken,client_token:currentAccount.uuid,uuid:currentAccount.uuid,name:currentAccount.username,user_properties:'{}',meta:{type:'msa',demo:false,xuid:sec.xuid||'',clientId:sec.clientId||''}};
}

export function removeAccount(id){
  const all=store.get('accounts').filter(a=>a.id!==id);
  store.set('accounts',all);
  if(store.get('activeAccountId')===id) store.set('activeAccountId',all[0]?.id||null);
  return true;
}
export function activateAccount(id){
  if(!store.get('accounts').some(a=>a.id===id)) throw new Error('Account not found.');
  store.set('activeAccountId',id);
  return true;
}
export async function updateSkin({ accountId, dataUrl, variant = 'classic', reset = false }) {
  return skinWrites(accountId, async () => {
    const account = store.get('accounts').find(item => item.id === accountId);
    if (!account) throw new Error('Account not found.');
    const patch = await changeSkin({ account, dataUrl, variant, reset, authorize: launcherAuthorization });
    // Refresh may have replaced the encrypted session while uploading.
    const current = store.get('accounts').find(item => item.id === accountId);
    if (!current) throw new Error('Account was removed while the skin was being updated.');
    return publicAccount(saveAccount({ ...current, ...patch }));
  });
}
export {offlineUuid};
