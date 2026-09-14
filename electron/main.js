import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import updaterPackage from 'electron-updater';
import { store, dataRoot } from './services/store.js';
import * as accounts from './services/accountService.js';
import * as instances from './services/instanceService.js';
import * as java from './services/javaService.js';
import * as mods from './services/modService.js';
import * as servers from './services/serverService.js';
import * as launcher from './services/launcherService.js';
import * as versions from './services/versionService.js';
import { coreStatus, exportStandalone } from './services/coreService.js';

const { autoUpdater } = updaterPackage;
if (!autoUpdater) throw new Error('electron-updater did not expose autoUpdater through its CommonJS default export.');

app.setName('Eternal Client');
if (process.platform === 'win32') app.setAppUserModelId('gg.eternal.client');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const smokeTest = process.argv.includes('--smoke-test');
let mainWindow;

function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload);
}
function clamp(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}
function sanitizeSettingsPatch(patch = {}) {
  const allowed = {};
  if ('dataDir' in patch) allowed.dataDir = String(patch.dataDir || '');
  if ('javaPath' in patch) allowed.javaPath = String(patch.javaPath || '');
  if ('azureClientId' in patch) allowed.azureClientId = String(patch.azureClientId || '').trim();
  if ('discordInvite' in patch) allowed.discordInvite = String(patch.discordInvite || '').trim();
  if ('ramMb' in patch) allowed.ramMb = Math.round(clamp(patch.ramMb, 1024, 32768, 6144));
  if ('reducedMotion' in patch) allowed.reducedMotion = Boolean(patch.reducedMotion);
  if ('resolution' in patch) {
    const current = store.get('settings.resolution') || { width: 1280, height: 720 };
    allowed.resolution = {
      width: Math.round(clamp(patch.resolution?.width, 640, 7680, current.width)),
      height: Math.round(clamp(patch.resolution?.height, 360, 4320, current.height))
    };
  }
  return allowed;
}
async function openExternal(urlValue) {
  const url = new URL(String(urlValue || ''));
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Eternal only opens http/https links.');
  await shell.openExternal(url.toString());
  return true;
}
async function openFolder(folder) {
  const error = await shell.openPath(folder);
  if (error) throw new Error(error);
  return true;
}

function createWindow() {
  const iconPath = path.join(__dirname, '../assets/icon.png');
  mainWindow = new BrowserWindow({
    width: 1460,
    height: 900,
    minWidth: 980,
    minHeight: 650,
    frame: false,
    backgroundColor: '#050506',
    show: false,
    icon: iconPath,
    title: 'Eternal Client',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.setTitle('Eternal Client');
  mainWindow.once('ready-to-show', () => { if (!smokeTest) mainWindow.show(); });
  mainWindow.webContents.once('did-finish-load', () => {
    if (smokeTest) setTimeout(() => app.exit(0), 750);
  });
  mainWindow.webContents.once('did-fail-load', (_event, code, description) => {
    console.error(`[renderer] load failed ${code}: ${description}`);
    if (smokeTest) app.exit(91);
  });
  mainWindow.on('unresponsive', () => send('app:event', { type: 'unresponsive', message: 'The launcher window stopped responding.' }));

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
handle('app:openExternal', openExternal);
handle('app:openDataFolder', async () => openFolder(dataRoot()));

handle('window:minimize', () => mainWindow?.minimize());
handle('window:maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
handle('window:close', () => mainWindow?.close());

handle('settings:get', () => store.get('settings'));
handle('settings:patch', patch => {
  store.set('settings', { ...store.get('settings'), ...sanitizeSettingsPatch(patch) });
  return store.get('settings');
});

handle('dialog:folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory', 'createDirectory'] });
  return result.canceled ? '' : result.filePaths[0];
});
handle('dialog:java', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: process.platform === 'win32' ? [{ name: 'Java runtime', extensions: ['exe'] }] : undefined
  });
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
handle('instances:versions', options => versions.listMinecraftVersions(options));
handle('instances:create', async data => {
  await versions.assertMinecraftVersion(data?.minecraftVersion);
  return instances.createInstance(data);
});
handle('instances:remove', id => instances.removeInstance(id));
handle('instances:openFolder', async id => openFolder(instances.instanceDir(id)));
handle('instances:launch', data => launcher.launchInstance({ ...data, emit: event => send('launch:event', event) }));
handle('instances:stop', id => launcher.stopInstance(id));

handle('java:detect', () => java.detectJava());
handle('java:validate', value => java.validateJava(value));
handle('mods:list', id => mods.listMods(id));
handle('mods:add', data => mods.addMods(data.instanceId, data.files));
handle('mods:remove', data => mods.removeMod(data.instanceId, data.filename));
handle('mods:toggle', data => mods.toggleMod(data.instanceId, data.filename, data.enabled));
handle('mods:search', data => mods.searchModrinth(data));
handle('mods:install', data => mods.installModrinth({ ...data, emit: event => send('download:event', event) }));

handle('servers:list', () => servers.listServers());
handle('servers:save', server => servers.saveServer(server));
handle('servers:remove', id => servers.removeServer(id));
handle('servers:ping', server => servers.pingServer(server));
handle('servers:join', data => launcher.launchInstance({ instanceId: data.instanceId, server: data.server, emit: event => send('launch:event', event) }));

handle('core:status', id => coreStatus(id));
handle('core:exportStandalone', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Eternal Core standalone mod',
    defaultPath: path.join(app.getPath('downloads'), `Eternal-Core-Standalone-${app.getVersion()}.jar`),
    filters: [{ name: 'Fabric mod JAR', extensions: ['jar'] }]
  });
  if (result.canceled || !result.filePath) return { canceled: true };
  return exportStandalone(result.filePath);
});

handle('updater:check', async () => {
  if (!app.isPackaged) return { available: false, reason: 'Updater is disabled in development builds.' };
  return autoUpdater.checkForUpdates();
});
autoUpdater.on('update-available', info => send('update:event', { type: 'available', version: info.version }));
autoUpdater.on('download-progress', progress => send('update:event', { type: 'progress', percent: progress.percent }));
autoUpdater.on('update-downloaded', info => send('update:event', { type: 'ready', version: info.version }));
