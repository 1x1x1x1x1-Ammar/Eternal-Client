import { createRequire } from 'node:module';
import updaterPackage from 'electron-updater';

const requireCjs = createRequire(import.meta.url);

if (!updaterPackage || typeof updaterPackage !== 'object' || !('autoUpdater' in updaterPackage)) {
  throw new Error('electron-updater autoUpdater export unavailable');
}

let launcherPackage;
try {
  launcherPackage = requireCjs('minecraft-launcher-core');
} catch (error) {
  throw new Error(`minecraft-launcher-core could not be required through CommonJS: ${error?.message || error}`);
}

const Client = launcherPackage?.Client || launcherPackage?.default?.Client || (typeof launcherPackage?.default === 'function' ? launcherPackage.default : null);
if (typeof Client !== 'function') {
  const keys = launcherPackage && typeof launcherPackage === 'object' ? Object.keys(launcherPackage).join(', ') : typeof launcherPackage;
  throw new Error(`minecraft-launcher-core Client export unavailable (exports: ${keys || 'none'})`);
}

const client = new Client();
if (!client || typeof client.launch !== 'function' || typeof client.on !== 'function') {
  throw new Error('minecraft-launcher-core Client constructor did not produce a usable launcher client');
}

console.log('Runtime smoke PASS: electron-updater + minecraft-launcher-core Client are loadable.');
