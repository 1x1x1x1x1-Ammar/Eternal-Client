import crypto from 'node:crypto';
import { PublicClientApplication } from '@azure/msal-node';
import { store, encryptSecret, decryptSecret } from './store.js';
import { readSkinFile, removeLocalSkin, saveLocalSkin, skinPreviewData } from './skinService.js';

const MICROSOFT_SCOPES = ['XboxLive.signin', 'offline_access'];
const MINECRAFT_PROFILE = 'https://api.minecraftservices.com/minecraft/profile';
const MINECRAFT_SKINS = `${MINECRAFT_PROFILE}/skins`;

function offlineUuid(username){
  const data=Buffer.from(`OfflinePlayer:${username}`,'utf8');
  const bytes=crypto.createHash('md5').update(data).digest();
  bytes[6]=(bytes[6]&0x0f)|0x30;
  bytes[8]=(bytes[8]&0x3f)|0x80;
  const h=bytes.toString('hex');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

function activeSkin(profile){
  return profile?.skins?.find(s=>s.state==='ACTIVE')||profile?.skins?.[0]||null;
}
function activeCape(profile){
  return profile?.capes?.find(c=>c.state==='ACTIVE')||profile?.capes?.[0]||null;
}
function variantFromProfile(profile, fallback='classic'){
  return String(activeSkin(profile)?.variant||fallback||'classic').toLowerCase()==='slim'?'slim':'classic';
}
function publicAccount(a){
  const {secret,localSkinPath,...rest}=a;
  return {...rest,localSkin:Boolean(localSkinPath)};
}
function saveAccount(account){
  const all=store.get('accounts').filter(a=>a.id!==account.id);
  all.push(account);
  store.set('accounts',all);
  return account;
}
function microsoftApp(clientId){
  return new PublicClientApplication({auth:{clientId,authority:'https://login.microsoftonline.com/consumers'}});
}
function findAccount(id){
  const account=store.get('accounts').find(x=>x.id===id);
  if(!account) throw new Error('Account not found.');
  return account;
}

export function listAccounts(){return store.get('accounts').map(publicAccount);}
export function activeAccount(){const id=store.get('activeAccountId');return store.get('accounts').find(x=>x.id===id)||null;}

export function addOffline(username){
  username=String(username||'').trim();
  if(!/^[A-Za-z0-9_]{3,16}$/.test(username)) throw new Error('Offline username must be 3–16 letters, numbers, or underscore.');
  const uuid=offlineUuid(username);
  const existing=store.get('accounts').find(a=>a.id===`offline:${uuid}`);
  const account={
    ...(existing||{}),
    id:`offline:${uuid}`,
    type:'offline',
    username,
    uuid,
    skinVariant:existing?.skinVariant||'classic',
    createdAt:existing?.createdAt||new Date().toISOString()
  };
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

  const profileRes=await fetch(MINECRAFT_PROFILE,{headers});
  const profile=await readJson(profileRes,'Minecraft profile request');
  if(!profile?.id||!profile?.name) throw new Error('Minecraft profile response was incomplete.');
  return {mc,profile,xuid:xsts.DisplayClaims?.xui?.[0]?.xid||''};
}

function accountFromProfile(base, profile){
  const skin=activeSkin(profile);
  const cape=activeCape(profile);
  return {
    ...base,
    username:profile?.name||base.username,
    uuid:profile?.id||base.uuid,
    skinUrl:skin?.url||'',
    skinVariant:variantFromProfile(profile,base.skinVariant),
    capeUrl:cape?.url||'',
    capeName:cape?.alias||''
  };
}

export async function loginMicrosoft(deviceCodeCallback){
  const clientId=store.get('settings.azureClientId')||process.env.ETERNAL_AZURE_CLIENT_ID;
  if(!clientId) throw new Error('Set your own Microsoft Entra/Azure Client ID in Settings first.');
  const pca=microsoftApp(clientId);
  const token=await pca.acquireTokenByDeviceCode({scopes:MICROSOFT_SCOPES,deviceCodeCallback});
  if(!token?.accessToken||!token?.account?.homeAccountId) throw new Error('Microsoft sign-in did not return a reusable account session.');
  const {mc,profile,xuid}=await xboxExchange(token.accessToken);
  const id=`msa:${profile.id}`;
  const previous=store.get('accounts').find(a=>a.id===id)||{};
  const account=accountFromProfile({
    ...previous,
    id,
    type:'microsoft',
    createdAt:previous.createdAt||new Date().toISOString(),
    secret:encryptSecret({
      mcAccessToken:mc.access_token,
      mcExpiresAt:Date.now()+((mc.expires_in||86400)*1000),
      xuid,
      clientId,
      homeAccountId:token.account.homeAccountId,
      msalCache:pca.getTokenCache().serialize()
    })
  },profile);
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
  const refreshed=accountFromProfile({
    ...account,
    secret:encryptSecret({
      ...secret,
      mcAccessToken:mc.access_token,
      mcExpiresAt:Date.now()+((mc.expires_in||86400)*1000),
      xuid,
      clientId,
      homeAccountId:token.account?.homeAccountId||secret.homeAccountId,
      msalCache:pca.getTokenCache().serialize()
    })
  },profile);
  saveAccount(refreshed);
  return {account:refreshed,secret:decryptSecret(refreshed.secret)};
}

async function microsoftSession(account){
  if(account.type!=='microsoft') throw new Error('This action requires a Microsoft Minecraft account.');
  let currentAccount=account;
  let secret=decryptSecret(account.secret);
  if(!secret?.mcAccessToken) throw new Error('Microsoft session is missing. Sign in again.');
  if(!secret.mcExpiresAt||secret.mcExpiresAt<Date.now()+5*60*1000) {
    const refreshed=await refreshMicrosoftAccount(account,secret);
    currentAccount=refreshed.account;
    secret=refreshed.secret;
  }
  return {account:currentAccount,secret};
}

async function minecraftProfile(accessToken){
  const response=await fetch(MINECRAFT_PROFILE,{headers:{Authorization:`Bearer ${accessToken}`}});
  return readJson(response,'Minecraft profile request');
}

export async function refreshAccountProfile(id){
  const account=findAccount(id);
  if(account.type==='offline') return publicAccount(account);
  const session=await microsoftSession(account);
  const profile=await minecraftProfile(session.secret.mcAccessToken);
  const updated=accountFromProfile(session.account,profile);
  saveAccount(updated);
  return publicAccount(updated);
}

export async function accountSkinPreview(id){
  const account=findAccount(id);
  return {
    account:publicAccount(account),
    ...(await skinPreviewData({localPath:account.localSkinPath||'',remoteUrl:account.skinUrl||''}))
  };
}

export async function setAccountSkin({id,filePath,variant='classic'}){
  const account=findAccount(id);
  variant=String(variant||'classic').toLowerCase()==='slim'?'slim':'classic';
  if(account.type==='offline') {
    const saved=await saveLocalSkin(account.uuid,filePath);
    const updated={...account,localSkinPath:saved.path,skinVariant:variant};
    saveAccount(updated);
    return {account:publicAccount(updated),preview:await accountSkinPreview(id),scope:'local'};
  }

  const session=await microsoftSession(account);
  const {buffer,width,height}=await readSkinFile(filePath);
  const form=new FormData();
  form.append('variant',variant);
  form.append('file',new Blob([buffer],{type:'image/png'}),'skin.png');
  const response=await fetch(MINECRAFT_SKINS,{method:'POST',headers:{Authorization:`Bearer ${session.secret.mcAccessToken}`},body:form});
  if(!response.ok) await readJson(response,'Minecraft skin upload');
  const profile=await minecraftProfile(session.secret.mcAccessToken);
  const updated=accountFromProfile({...session.account,skinVariant:variant},profile);
  saveAccount(updated);
  return {account:publicAccount(updated),preview:await accountSkinPreview(id),scope:'minecraft',width,height};
}

export async function resetAccountSkin(id){
  const account=findAccount(id);
  if(account.type==='offline') {
    await removeLocalSkin(account.localSkinPath);
    const updated={...account,localSkinPath:'',skinVariant:'classic'};
    saveAccount(updated);
    return {account:publicAccount(updated),preview:{dataUrl:'',source:'none'},scope:'local'};
  }

  const session=await microsoftSession(account);
  const response=await fetch(`${MINECRAFT_SKINS}/active`,{method:'DELETE',headers:{Authorization:`Bearer ${session.secret.mcAccessToken}`}});
  if(!response.ok) await readJson(response,'Minecraft skin reset');
  const profile=await minecraftProfile(session.secret.mcAccessToken);
  const updated=accountFromProfile(session.account,profile);
  saveAccount(updated);
  return {account:publicAccount(updated),preview:await accountSkinPreview(id),scope:'minecraft'};
}

export async function launcherAuthorization(account){
  if(!account) throw new Error('Select an account first.');
  if(account.type==='offline') return {access_token:'',client_token:account.uuid,uuid:account.uuid.replaceAll('-',''),name:account.username,user_properties:'{}',meta:{type:'mojang',demo:false}};
  const session=await microsoftSession(account);
  return {access_token:session.secret.mcAccessToken,client_token:session.account.uuid,uuid:session.account.uuid,name:session.account.username,user_properties:'{}',meta:{type:'msa',demo:false,xuid:session.secret.xuid||'',clientId:session.secret.clientId||''}};
}

export async function removeAccount(id){
  const account=findAccount(id);
  if(account.localSkinPath) await removeLocalSkin(account.localSkinPath);
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
export {offlineUuid};
