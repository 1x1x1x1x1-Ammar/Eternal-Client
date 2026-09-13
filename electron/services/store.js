import Store from 'electron-store';
import { app, safeStorage } from 'electron';
import crypto from 'node:crypto';

const defaults = {
  settings: {
    dataDir: '',
    javaPath: '',
    ramMb: 6144,
    closeOnLaunch: false,
    reducedMotion: false,
    resolution: { width: 1280, height: 720 },
    azureClientId: process.env.ETERNAL_AZURE_CLIENT_ID || '',
    discordRpc: true,
    discordInvite: '',
    downloadConcurrency: 4
  },
  accounts: [],
  activeAccountId: null,
  servers: []
};

export const store = new Store({ name: 'eternal', defaults });

export function dataRoot() {
  return store.get('settings.dataDir') || app.getPath('userData');
}

export function encryptSecret(value) {
  if (!value) return '';
  const text = Buffer.from(JSON.stringify(value));
  if (safeStorage.isEncryptionAvailable()) {
    return `safe:${safeStorage.encryptString(text.toString('utf8')).toString('base64')}`;
  }
  const key = crypto.createHash('sha256').update(`${app.getPath('userData')}|eternal-local-fallback`).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `aes:${Buffer.concat([iv, tag, encrypted]).toString('base64')}`;
}

export function decryptSecret(value) {
  if (!value) return null;
  try {
    if (value.startsWith('safe:')) {
      return JSON.parse(safeStorage.decryptString(Buffer.from(value.slice(5), 'base64')));
    }
    if (value.startsWith('aes:')) {
      const raw = Buffer.from(value.slice(4), 'base64');
      const iv = raw.subarray(0, 12);
      const tag = raw.subarray(12, 28);
      const body = raw.subarray(28);
      const key = crypto.createHash('sha256').update(`${app.getPath('userData')}|eternal-local-fallback`).digest();
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      return JSON.parse(Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8'));
    }
  } catch {}
  return null;
}
