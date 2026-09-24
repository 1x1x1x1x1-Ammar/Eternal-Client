import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import { getInstance, instanceDir } from './instanceService.js';
import { ensureDir } from './fsService.js';
import { createSerialQueue } from '../../shared/serialQueue.js';

const configWrites = createSerialQueue();

const here = path.dirname(fileURLToPath(import.meta.url));
const staged = path.resolve(here, '../../assets/eternal-core.jar');

export const CORE_MODULES = [
  'Watermark', 'FPS', 'CPS', 'Keystrokes', 'Coordinates', 'Ping',
  'Speed', 'Direction', 'Health', 'Armor', 'Food', 'Server',
  'Memory', 'Session', 'Clock', 'Zoom', 'Crosshair', 'Fullbright',
  'ToggleSprint', 'ToggleSneak', 'Perspective', 'AttackCooldown', 'HeldItem',
  'ArmorDurability', 'Offhand', 'Movement', 'CombatSupplies'
];

const DEFAULT_CROSSHAIR = Object.freeze({
  color: -1,
  hitColor: -53192,
  gap: 3,
  length: 5,
  thickness: 1,
  dot: false,
  outline: true
});

function clamp(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.round(number))) : fallback;
}
function argb(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? (number | 0) : fallback;
}
function defaultCoreConfig() {
  return {
    enabled: Object.fromEntries(CORE_MODULES.map(name => [name, false])),
    positions: {},
    accentColor: -53192,
    hudAlpha: 196,
    zoomFov: 30,
    snap: 4,
    notifications: true,
    openKey: 344,
    hudEditorKey: 72,
    zoomKey: 67,
    perspectiveKey: 86,
    textShadow: true,
    gradientHud: false,
    smoothZoom: true,
    zoomSpeed: 5,
    combatPreset: 'sword',
    crosshair: { ...DEFAULT_CROSSHAIR }
  };
}
function normalizeKey(value, fallback) {
  const key = Math.round(Number(value));
  return Number.isFinite(key) && key >= 32 && key <= 348 ? key : fallback;
}
function sanitizeCoreConfig(input = {}) {
  const defaults = defaultCoreConfig();
  const enabled = { ...defaults.enabled };
  if (input.enabled && typeof input.enabled === 'object') {
    for (const name of CORE_MODULES) if (name in input.enabled) enabled[name] = Boolean(input.enabled[name]);
  }

  const positions = {};
  if (input.positions && typeof input.positions === 'object') {
    for (const [name, value] of Object.entries(input.positions)) {
      if (!CORE_MODULES.includes(name) || !Array.isArray(value) || value.length < 2) continue;
      const x = Number(value[0]);
      const y = Number(value[1]);
      if (Number.isFinite(x) && Number.isFinite(y)) positions[name] = [Math.round(x), Math.round(y)];
    }
  }

  const crosshairInput = input.crosshair && typeof input.crosshair === 'object' ? input.crosshair : {};
  return {
    enabled,
    positions,
    accentColor: argb(input.accentColor, defaults.accentColor),
    hudAlpha: clamp(input.hudAlpha, 80, 245, defaults.hudAlpha),
    zoomFov: clamp(input.zoomFov, 10, 60, defaults.zoomFov),
    snap: [2, 4, 8].includes(Number(input.snap)) ? Number(input.snap) : defaults.snap,
    notifications: input.notifications === undefined ? defaults.notifications : Boolean(input.notifications),
    openKey: normalizeKey(input.openKey, defaults.openKey),
    hudEditorKey: normalizeKey(input.hudEditorKey, defaults.hudEditorKey),
    zoomKey: normalizeKey(input.zoomKey, defaults.zoomKey),
    perspectiveKey: normalizeKey(input.perspectiveKey, defaults.perspectiveKey),
    textShadow: input.textShadow === undefined ? defaults.textShadow : Boolean(input.textShadow),
    gradientHud: input.gradientHud === undefined ? defaults.gradientHud : Boolean(input.gradientHud),
    smoothZoom: input.smoothZoom === undefined ? defaults.smoothZoom : Boolean(input.smoothZoom),
    zoomSpeed: clamp(input.zoomSpeed, 1, 10, defaults.zoomSpeed),
    combatPreset: ['sword', 'mace', 'spear', 'crystal', 'cart'].includes(input.combatPreset) ? input.combatPreset : defaults.combatPreset,
    crosshair: {
      color: argb(crosshairInput.color, defaults.crosshair.color),
      hitColor: argb(crosshairInput.hitColor, defaults.crosshair.hitColor),
      gap: clamp(crosshairInput.gap, 0, 12, defaults.crosshair.gap),
      length: clamp(crosshairInput.length, 2, 14, defaults.crosshair.length),
      thickness: clamp(crosshairInput.thickness, 1, 4, defaults.crosshair.thickness),
      dot: crosshairInput.dot === undefined ? defaults.crosshair.dot : Boolean(crosshairInput.dot),
      outline: crosshairInput.outline === undefined ? defaults.crosshair.outline : Boolean(crosshairInput.outline)
    }
  };
}

async function readCoreMetadata(file) {
  await fs.access(file);
  const zip = new AdmZip(file);
  const mod = zip.getEntry('fabric.mod.json');
  if (!mod) throw new Error('fabric.mod.json missing.');
  const meta = JSON.parse(mod.getData().toString('utf8'));
  if (meta.id !== 'eternal-core') throw new Error('JAR is not Eternal Core.');
  return meta;
}

async function sha256(file) {
  const buffer = await fs.readFile(file);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function readStagedMetadata() {
  try { return await readCoreMetadata(staged); }
  catch (error) { throw new Error(`Staged Eternal Core JAR is invalid: ${error.message}`); }
}

function minecraftDir(instanceId) {
  return path.join(instanceDir(instanceId), '.minecraft');
}
function configFile(instanceId) {
  return path.join(minecraftDir(instanceId), 'config', 'eternal-core.json');
}
function profilesDir(instanceId) {
  return path.join(minecraftDir(instanceId), 'config', 'eternal-profiles');
}
export function coreScreenshotsDir(instanceId) {
  return path.join(minecraftDir(instanceId), 'screenshots');
}
async function validateInstance(instanceId) {
  if (!instanceId) throw new Error('Select a Minecraft instance first.');
  return getInstance(instanceId);
}
async function readJson(file, fallback = null) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
}
async function writeJsonAtomic(file, value) {
  await ensureDir(path.dirname(file));
  const temp = `${file}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  try {
    await fs.rename(temp, file);
  } catch (error) {
    if (process.platform === 'win32') {
      await fs.rm(file, { force: true });
      await fs.rename(temp, file);
    } else {
      await fs.rm(temp, { force: true });
      throw error;
    }
  }
}

export async function readCoreConfig(instanceId) {
  await validateInstance(instanceId);
  const current = await readJson(configFile(instanceId), {});
  return sanitizeCoreConfig(current || {});
}

export async function patchCoreConfig(instanceId, patch = {}) {
  return configWrites(instanceId, () => patchCoreConfigNow(instanceId, patch));
}

async function patchCoreConfigNow(instanceId, patch = {}) {
  await validateInstance(instanceId);
  const current = await readCoreConfig(instanceId);
  const merged = {
    ...current,
    ...(patch && typeof patch === 'object' ? patch : {}),
    enabled: { ...current.enabled, ...(patch?.enabled || {}) },
    positions: patch?.positions ? { ...current.positions, ...patch.positions } : current.positions,
    crosshair: { ...current.crosshair, ...(patch?.crosshair || {}) }
  };
  const clean = sanitizeCoreConfig(merged);
  await writeJsonAtomic(configFile(instanceId), clean);
  return clean;
}

export async function listCoreProfiles(instanceId) {
  await validateInstance(instanceId);
  const dir = profilesDir(instanceId);
  let names = [];
  try { names = await fs.readdir(dir); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
  const profiles = [];
  for (const filename of names.filter(name => name.endsWith('.json'))) {
    try {
      const row = await readJson(path.join(dir, filename));
      if (!row?.id || !row?.name || !row?.config) continue;
      profiles.push({ id: String(row.id), name: String(row.name), createdAt: Number(row.createdAt || 0) });
    } catch {}
  }
  return profiles.sort((a, b) => b.createdAt - a.createdAt);
}

function assertProfileId(id) {
  const value = String(id || '');
  if (!/^[a-f0-9-]{16,}$/i.test(value)) throw new Error('Invalid Eternal profile id.');
  return value;
}
export async function saveCoreProfile(instanceId, name) {
  await validateInstance(instanceId);
  const cleanName = String(name || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  if (cleanName.length < 2) throw new Error('Profile name must be at least 2 characters.');
  const id = crypto.randomUUID();
  const row = { id, name: cleanName, createdAt: Date.now(), config: await readCoreConfig(instanceId) };
  await writeJsonAtomic(path.join(profilesDir(instanceId), `${id}.json`), row);
  return { id, name: row.name, createdAt: row.createdAt };
}
export async function applyCoreProfile(instanceId, profileId) {
  return configWrites(instanceId, () => applyCoreProfileNow(instanceId, profileId));
}

async function applyCoreProfileNow(instanceId, profileId) {
  await validateInstance(instanceId);
  const id = assertProfileId(profileId);
  const row = await readJson(path.join(profilesDir(instanceId), `${id}.json`));
  if (!row?.config) throw new Error('Eternal profile not found.');
  const clean = sanitizeCoreConfig(row.config);
  await writeJsonAtomic(configFile(instanceId), clean);
  return clean;
}
export async function deleteCoreProfile(instanceId, profileId) {
  await validateInstance(instanceId);
  const id = assertProfileId(profileId);
  await fs.rm(path.join(profilesDir(instanceId), `${id}.json`), { force: true });
  return true;
}

export async function listCoreScreenshots(instanceId) {
  await validateInstance(instanceId);
  const dir = coreScreenshotsDir(instanceId);
  let names = [];
  try { names = await fs.readdir(dir); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
  const rows = [];
  for (const name of names.filter(value => /\.(png|jpe?g)$/i.test(value))) {
    try {
      const stat = await fs.stat(path.join(dir, name));
      if (!stat.isFile()) continue;
      rows.push({ name, size: stat.size, modifiedAt: stat.mtimeMs });
    } catch {}
  }
  return rows.sort((a, b) => b.modifiedAt - a.modifiedAt).slice(0, 200);
}
export async function deleteCoreScreenshot(instanceId, filename) {
  await validateInstance(instanceId);
  const name = String(filename || '');
  if (!name || name !== path.basename(name) || !/\.(png|jpe?g)$/i.test(name)) throw new Error('Invalid screenshot filename.');
  await fs.rm(path.join(coreScreenshotsDir(instanceId), name), { force: true });
  return true;
}

export async function coreStatus(instanceId) {
  const instance = await getInstance(instanceId);
  const supported = instance.loader === 'fabric' && instance.minecraftVersion === '1.21.11';
  const dest = path.join(instanceDir(instanceId), '.minecraft', 'mods', 'eternal-core.jar');
  let stagedExists = false;
  let installed = false;
  let stagedVersion = null;
  let installedVersion = null;
  let installedValid = false;
  let stagedHash = null;
  let installedHash = null;

  try {
    const meta = await readStagedMetadata();
    stagedExists = true;
    stagedVersion = meta.version || null;
    stagedHash = await sha256(staged);
  } catch {}
  try {
    const meta = await readCoreMetadata(dest);
    installed = true;
    installedValid = true;
    installedVersion = meta.version || null;
    installedHash = await sha256(dest);
  } catch {
    try { await fs.access(dest); installed = true; } catch {}
  }

  const exactMatch = Boolean(stagedExists && installedValid && stagedHash && installedHash && stagedHash === installedHash);
  return {
    supported,
    stagedExists,
    installed,
    installedValid,
    exactMatch,
    version: stagedVersion,
    stagedVersion,
    installedVersion,
    stagedHash,
    installedHash,
    needsUpdate: Boolean(stagedExists && (!installedValid || !exactMatch)),
    target: 'Minecraft 1.21.11 + Fabric',
    standalone: true
  };
}

export async function prepareCore(instanceId) {
  const status = await coreStatus(instanceId);
  if (!status.supported) return { installed: false, reason: `Eternal Core beta currently certifies ${status.target}.` };
  if (!status.stagedExists) return { installed: false, reason: 'Eternal Core JAR is not staged. Build eternal-core first, then stage the JAR.' };

  const meta = await readStagedMetadata();
  const dir = path.join(instanceDir(instanceId), '.minecraft', 'mods');
  await ensureDir(dir);
  const destination = path.join(dir, 'eternal-core.jar');
  if (status.exactMatch) {
    return { installed: true, version: meta.version || 'unknown', changed: false, sha256: status.stagedHash };
  }

  const temp = `${destination}.tmp`;
  await fs.copyFile(staged, temp);
  const verified = await readCoreMetadata(temp);
  const stagedHash = await sha256(staged);
  const copiedHash = await sha256(temp);
  if (stagedHash !== copiedHash) {
    await fs.rm(temp, { force: true });
    throw new Error('Eternal Core verification failed after copying the staged JAR.');
  }
  await fs.rm(destination, { force: true });
  await fs.rename(temp, destination);
  return { installed: true, version: verified.version || 'unknown', changed: true, sha256: copiedHash };
}

export async function exportStandalone(destination) {
  if (!destination) return { canceled: true };
  const meta = await readStagedMetadata();
  await ensureDir(path.dirname(destination));
  const temp = `${destination}.tmp`;
  await fs.copyFile(staged, temp);
  const verified = await readCoreMetadata(temp);
  const stagedHash = await sha256(staged);
  const exportedHash = await sha256(temp);
  if (stagedHash !== exportedHash) {
    await fs.rm(temp, { force: true });
    throw new Error('Standalone Core export verification failed.');
  }
  await fs.rm(destination, { force: true });
  await fs.rename(temp, destination);
  return {
    canceled: false,
    path: destination,
    version: verified.version || meta.version || 'unknown',
    sha256: exportedHash,
    target: 'Minecraft 1.21.11 + Fabric + Java 21'
  };
}
