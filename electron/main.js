import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { autoUpdater } from 'electron-updater';
import { store, dataRoot } from './services/store.js';
import * as accounts from './services/accountService.js';
import * as instances from './services/instanceService.js';
import * as java from './services/javaService.js';
import * as mods from './services/modService.js';
import * as servers from './services/serverService.js';
import * as launcher from './services/launcherService.js';
import { coreStatus } from './services/coreService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let mainWindow;

function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 820,
    minWidth: 1040,
    minHeight: 650,
    frame: false,
    backgroundColor: '#070708',
    show: false,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  mainWindow.once('ready-to-show', () => mainWindow.show());
  if (process.env.VITE_DEV_SERVER_URL) mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  else mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

const handle = (name, fn) => ipcMain.handle(name, async (_event, payload) => {
  try { return { ok: true, data: await fn(payload) }; }
  catch (error) {
    console.error(`[${name}]`, error);
    return { ok: false, error: error?.message || String(error) };
  }
});

handle('app:state', async () => ({ version: app.getVersion(), running: launcher.runningState() }));
handle('app:diagnostics', async () => ({
  appVersion: app.getVersion(),
  electron: process.versions.electron,
  chromium: process.versions.chrome,
  node: process.versions.node,
  v8: process.versions.v8,
  platform: `${process.platform} ${os.release()}`,
  arch: process.arch,
  packaged: app.isPackaged,
  appPath: app.getAppPath(),
  userData: app.getPath('userData'),
  dataRoot: dataRoot()
}));
handle('app:openExternal', url => shell.openExternal(String(url)));
handle('app:openDataFolder', async () => shell.openPath(dataRoot()));

handle('window:minimize', () => mainWindow.minimize());
handle('window:maximize', () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
handle('window:close', () => mainWindow.close());

handle('settings:get', () => store.get('settings'));
handle('settings:patch', patch => {
  store.set('settings', { ...store.get('settings'), ...patch });
  return store.get('settings');
});

handle('dialog:folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory', 'createDirectory'] });
  return result.canceled ? '' : result.filePaths[0];
});
handle('dialog:jars', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile', 'multiSelections'], filters: [{ name: 'Java mods', extensions: ['jar'] }] });
  return result.canceled ? [] : result.filePaths;
});

handle('accounts:list', () => ({ accounts: accounts.listAccounts(), activeId: store.get('activeAccountId') }));
handle('accounts:addOffline', username => accounts.addOffline(username));
handle('accounts:remove', id => accounts.removeAccount(id));
handle('accounts:activate', id => accounts.activateAccount(id));
handle('accounts:loginMicrosoft', () => accounts.loginMicrosoft(code => send('account:event', { type: 'device-code', message: code.message, userCode: code.userCode, verificationUri: code.verificationUri })));

handle('instances:list', () => instances.listInstances());
handle('instances:create', data => instances.createInstance(data));
handle('instances:remove', id => instances.removeInstance(id));
handle('instances:openFolder', async id => shell.openPath(instances.instanceDir(id)));
handle('instances:launch', data => launcher.launchInstance({ ...data, emit: event => send('launch:event', event) }));
handle('instances:stop', id => launcher.stopInstance(id));

handle('java:detect', () => java.detectJava());
handle('mods:list', id => mods.listMods(id));
handle('mods:add', data => mods.addMods(data.instanceId, data.files));
handle('mods:remove', data => mods.removeMod(data.instanceId, data.filename));
handle('mods:toggle', data => mods.toggleMod(data.instanceId, data.filename, data.enabled));
handle('mods:search', data => mods.searchModrinth(data));
handle('mods:install', data => mods.installModrinth(data));

handle('servers:list', () => servers.listServers());
handle('servers:save', server => servers.saveServer(server));
handle('servers:remove', id => servers.removeServer(id));
handle('servers:ping', server => servers.pingServer(server));
handle('servers:join', data => launcher.launchInstance({ instanceId: data.instanceId, server: data.server, emit: event => send('launch:event', event) }));
handle('core:status', id => coreStatus(id));

handle('updater:check', async () => {
  if (!app.isPackaged) return { available: false, reason: 'Updater is disabled in development builds.' };
  return autoUpdater.checkForUpdates();
});
autoUpdater.on('update-available', info => send('update:event', { type: 'available', version: info.version }));
autoUpdater.on('download-progress', progress => send('update:event', { type: 'progress', percent: progress.percent }));
autoUpdater.on('update-downloaded', info => send('update:event', { type: 'ready', version: info.version }));
