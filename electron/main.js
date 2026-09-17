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
import {
  coreStatus, exportStandalone, readCoreConfig, patchCoreConfig, listCoreProfiles,
  saveCoreProfile, applyCoreProfile, deleteCoreProfile, listCoreScreenshots,
  deleteCoreScreenshot, coreScreenshotsDir
} from './services/coreService.js';

const { autoUpdater } = updaterPackage;
if (!autoUpdater) throw new Error('electron-updater did not expose autoUpdater through its CommonJS default export.');
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

app.setName('Eternal Client');
if (process.platform === 'win32') app.setAppUserModelId('gg.eternal.client');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const smokeTest = process.argv.includes('--smoke-test');
const singleInstance = smokeTest || app.requestSingleInstanceLock();
let mainWindow;
let operationSequence = 0;

const tracedOperations = new Set([
  'accounts:addOffline', 'accounts:loginMicrosoft', 'accounts:remove', 'accounts:activate',
  'instances:create', 'instances:patch', 'instances:duplicate', 'instances:remove', 'instances:openFolder', 'instances:launch', 'instances:stop',
  'mods:add', 'mods:remove', 'mods:toggle', 'mods:install',
  'servers:save', 'servers:remove', 'servers:ping', 'servers:join',
  'core:exportStandalone', 'core:patchConfig', 'core:saveProfile', 'core:applyProfile', 'core:deleteProfile', 'core:deleteScreenshot',
  'settings:patch', 'updater:check', 'updater:download', 'updater:install'
]);

if (!singleInstance) app.quit();

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
function instanceRunning(id) {
  return launcher.runningState().some(row => row.instanceId === id && Number(row.count || row.pids?.length || 0) > 0);
}
function operationCopy(channel, payload, result, success = false) {
  switch (channel) {
    case 'instances:create': return success ? `Created ${result?.name || 'Minecraft instance'}.` : `Creating ${payload?.name || 'Minecraft instance'} · ${payload?.minecraftVersion || '?'} ${payload?.loader || ''}`;
    case 'instances:patch': return success ? `Saved ${result?.name || 'instance'} settings.` : 'Saving instance settings';
    case 'instances:duplicate': return success ? `Duplicated profile as ${result?.name || 'copy'}.` : 'Duplicating isolated instance files';
    case 'instances:remove': return success ? 'Instance removed.' : 'Removing instance and managed files';
    case 'instances:openFolder': return success ? 'Instance folder opened.' : 'Opening instance folder';
    case 'instances:launch': return success ? 'Launch request accepted; Minecraft pipeline is running.' : 'Starting Minecraft launch pipeline';
    case 'instances:stop': return success ? 'Minecraft processes stopped.' : 'Stopping Minecraft processes';
    case 'mods:add': return success ? 'Local mod files added.' : 'Adding local mod files';
    case 'mods:remove': return success ? 'Mod removed.' : 'Removing mod';
    case 'mods:toggle': return success ? `Mod ${payload?.enabled ? 'enabled' : 'disabled'}.` : 'Changing mod state';
    case 'mods:install': return success ? 'Modrinth install verified.' : 'Resolving and installing Modrinth project';
    case 'servers:ping': return success ? 'Minecraft server status received.' : 'Pinging Minecraft server';
    case 'servers:join': return success ? 'Server launch request accepted.' : 'Preparing server quick-join';
    case 'servers:save': return success ? 'Server saved.' : 'Saving server';
    case 'servers:remove': return success ? 'Server removed.' : 'Removing server';
    case 'accounts:addOffline': return success ? 'Offline account added.' : 'Creating offline account';
    case 'accounts:loginMicrosoft': return success ? 'Microsoft account authenticated.' : 'Starting Microsoft device-code authentication';
    case 'accounts:activate': return success ? 'Active account changed.' : 'Switching active account';
    case 'accounts:remove': return success ? 'Account removed.' : 'Removing account';
    case 'core:exportStandalone': return success ? 'Standalone Eternal Core exported and verified.' : 'Exporting standalone Eternal Core';
    case 'core:patchConfig': return success ? 'Eternal Core settings synced.' : 'Syncing Eternal Core settings';
    case 'core:saveProfile': return success ? `Saved Core profile ${result?.name || ''}.`.trim() : 'Saving Eternal Core profile';
    case 'core:applyProfile': return success ? 'Core profile applied.' : 'Applying Eternal Core profile';
    case 'core:deleteProfile': return success ? 'Core profile deleted.' : 'Deleting Eternal Core profile';
    case 'core:deleteScreenshot': return success ? 'Screenshot deleted.' : 'Deleting Minecraft screenshot';
    case 'settings:patch': return success ? 'Launcher settings saved.' : 'Saving launcher settings';
    case 'updater:check': return success ? 'Update check completed.' : 'Checking stable update channel';
    case 'updater:download': return success ? 'Update download started.' : 'Starting update download';
    case 'updater:install': return success ? 'Restarting into update installer.' : 'Preparing update restart';
    default: return success ? 'Operation completed.' : 'Working…';
  }
}

function createWindow() {
  const iconPath = path.join(__dirname, '../assets/icon.png');
  mainWindow = new BrowserWindow({
    width: 1460,
    height: 900,
    minWidth: 760,
    minHeight: 560,
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
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url).catch(error => send('app:event', { type: 'external-error', message: error.message }));
    return { action: 'deny' };
  });
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

if (singleInstance) {
  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
}
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

const handle = (name, fn) => ipcMain.handle(name, async (_event, payload) => {
  const trace = tracedOperations.has(name);
  const operationId = trace ? `${Date.now().toString(36)}-${(++operationSequence).toString(36)}` : '';
  if (trace) send('operation:event', {
    id: operationId,
    channel: name,
    state: 'STARTED',
    message: operationCopy(name, payload, null, false),
    timestamp: Date.now()
  });
  try {
    const data = await fn(payload);
    if (trace) send('operation:event', {
      id: operationId,
      channel: name,
      state: 'SUCCESS',
      message: operationCopy(name, payload, data, true),
      timestamp: Date.now()
    });
    return { ok: true, data };
  } catch (error) {
    console.error(`[${name}]`, error);
    if (trace) send('operation:event', {
      id: operationId,
      channel: name,
      state: 'ERROR',
      message: error?.message || String(error),
      timestamp: Date.now()
    });
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
handle('instances:patch', data => instances.patchInstance(data?.instanceId, data?.patch || {}));
handle('instances:duplicate', async data => {
  if (instanceRunning(data?.instanceId)) throw new Error('Stop this instance before duplicating it so its files are copied consistently.');
  return instances.duplicateInstance(data?.instanceId, data?.name || '');
});
handle('instances:remove', async id => {
  if (instanceRunning(id)) throw new Error('Stop this instance before deleting it.');
  return instances.removeInstance(id);
});
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
handle('core:config', id => readCoreConfig(id));
handle('core:patchConfig', data => patchCoreConfig(data?.instanceId, data?.patch || {}));
handle('core:profiles', id => listCoreProfiles(id));
handle('core:saveProfile', data => saveCoreProfile(data?.instanceId, data?.name));
handle('core:applyProfile', data => applyCoreProfile(data?.instanceId, data?.profileId));
handle('core:deleteProfile', data => deleteCoreProfile(data?.instanceId, data?.profileId));
handle('core:screenshots', id => listCoreScreenshots(id));
handle('core:deleteScreenshot', data => deleteCoreScreenshot(data?.instanceId, data?.filename));
handle('core:openScreenshots', async id => {
  await instances.getInstance(id);
  return openFolder(coreScreenshotsDir(id));
});
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
  if (!app.isPackaged) return { available: false, currentVersion: app.getVersion(), reason: 'Updater is disabled in development builds.' };
  const result = await autoUpdater.checkForUpdates();
  const info = result?.updateInfo || null;
  const available = Boolean(info?.version && info.version !== app.getVersion());
  return { available, currentVersion: app.getVersion(), version: info?.version || app.getVersion(), releaseDate: info?.releaseDate || null };
});
handle('updater:download', async () => {
  if (!app.isPackaged) throw new Error('Updater is disabled in development builds.');
  await autoUpdater.downloadUpdate();
  return { downloading: true };
});
handle('updater:install', () => {
  if (!app.isPackaged) throw new Error('Updater is disabled in development builds.');
  setImmediate(() => autoUpdater.quitAndInstall(false, true));
  return { restarting: true };
});

autoUpdater.on('checking-for-update', () => send('update:event', { type: 'checking' }));
autoUpdater.on('update-not-available', info => send('update:event', { type: 'current', version: info?.version || app.getVersion() }));
autoUpdater.on('update-available', info => send('update:event', { type: 'available', version: info.version }));
autoUpdater.on('download-progress', progress => send('update:event', { type: 'progress', percent: progress.percent, transferred: progress.transferred, total: progress.total, bytesPerSecond: progress.bytesPerSecond }));
autoUpdater.on('update-downloaded', info => send('update:event', { type: 'ready', version: info.version }));
autoUpdater.on('error', error => send('update:event', { type: 'error', message: error?.message || String(error) }));
