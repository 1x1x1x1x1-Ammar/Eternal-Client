import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { autoUpdater } from 'electron-updater';
import { store } from './services/store.js';
import * as accounts from './services/accountService.js';
import * as instances from './services/instanceService.js';
import * as java from './services/javaService.js';
import * as mods from './services/modService.js';
import * as servers from './services/serverService.js';
import * as launcher from './services/launcherService.js';
import { coreStatus } from './services/coreService.js';

const __dirname=path.dirname(fileURLToPath(import.meta.url)); let mainWindow;
function send(channel,payload){ if(mainWindow&&!mainWindow.isDestroyed())mainWindow.webContents.send(channel,payload); }
function createWindow(){ mainWindow=new BrowserWindow({width:1320,height:820,minWidth:1040,minHeight:650,frame:false,backgroundColor:'#070708',show:false,icon:path.join(__dirname,'../assets/icon.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}}); mainWindow.once('ready-to-show',()=>mainWindow.show()); if(process.env.VITE_DEV_SERVER_URL) mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL); else mainWindow.loadFile(path.join(__dirname,'../dist/renderer/index.html')); }
app.whenReady().then(()=>{ createWindow(); app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();}); }); app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});

const handle=(name,fn)=>ipcMain.handle(name,async(_e,p)=>{try{return {ok:true,data:await fn(p)}}catch(error){console.error(`[${name}]`,error);return {ok:false,error:error?.message||String(error)}}});
handle('app:state',async()=>({version:app.getVersion(),running:launcher.runningState()})); handle('app:openExternal',u=>shell.openExternal(String(u)));
handle('window:minimize',()=>mainWindow.minimize()); handle('window:maximize',()=>mainWindow.isMaximized()?mainWindow.unmaximize():mainWindow.maximize()); handle('window:close',()=>mainWindow.close());
handle('settings:get',()=>store.get('settings')); handle('settings:patch',p=>{store.set('settings',{...store.get('settings'),...p});return store.get('settings')});
handle('dialog:folder',async()=>{const r=await dialog.showOpenDialog(mainWindow,{properties:['openDirectory','createDirectory']});return r.canceled?'':r.filePaths[0]}); handle('dialog:jars',async()=>{const r=await dialog.showOpenDialog(mainWindow,{properties:['openFile','multiSelections'],filters:[{name:'Java mods',extensions:['jar']}]});return r.canceled?[]:r.filePaths});
handle('accounts:list',()=>({accounts:accounts.listAccounts(),activeId:store.get('activeAccountId')})); handle('accounts:addOffline',u=>accounts.addOffline(u)); handle('accounts:remove',id=>accounts.removeAccount(id)); handle('accounts:activate',id=>accounts.activateAccount(id)); handle('accounts:loginMicrosoft',()=>accounts.loginMicrosoft(code=>send('account:event',{type:'device-code',message:code.message,userCode:code.userCode,verificationUri:code.verificationUri})));
handle('instances:list',()=>instances.listInstances()); handle('instances:create',d=>instances.createInstance(d)); handle('instances:remove',id=>instances.removeInstance(id)); handle('instances:openFolder',async id=>shell.openPath(instances.instanceDir(id))); handle('instances:launch',d=>launcher.launchInstance({...d,emit:e=>send('launch:event',e)})); handle('instances:stop',id=>launcher.stopInstance(id));
handle('java:detect',()=>java.detectJava()); handle('mods:list',id=>mods.listMods(id)); handle('mods:add',d=>mods.addMods(d.instanceId,d.files)); handle('mods:remove',d=>mods.removeMod(d.instanceId,d.filename)); handle('mods:toggle',d=>mods.toggleMod(d.instanceId,d.filename,d.enabled)); handle('mods:search',d=>mods.searchModrinth(d)); handle('mods:install',d=>mods.installModrinth(d));
handle('servers:list',()=>servers.listServers()); handle('servers:save',s=>servers.saveServer(s)); handle('servers:remove',id=>servers.removeServer(id)); handle('servers:ping',s=>servers.pingServer(s)); handle('servers:join',d=>launcher.launchInstance({instanceId:d.instanceId,server:d.server,emit:e=>send('launch:event',e)})); handle('core:status',id=>coreStatus(id));
handle('updater:check',async()=>{if(!app.isPackaged)return {available:false,reason:'Updater is disabled in development builds.'};return autoUpdater.checkForUpdates()}); autoUpdater.on('update-available',i=>send('update:event',{type:'available',version:i.version})); autoUpdater.on('download-progress',p=>send('update:event',{type:'progress',percent:p.percent})); autoUpdater.on('update-downloaded',i=>send('update:event',{type:'ready',version:i.version}));
