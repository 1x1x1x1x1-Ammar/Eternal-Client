import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { dataRoot } from './store.js';
import { ensureDir, readJson, writeJson, safeName, assertInside } from './fsService.js';
import { assertMinecraftVersion } from './versionService.js';

export function instancesRoot() { return path.join(dataRoot(), 'instances'); }
export function instanceDir(id) { return assertInside(instancesRoot(), path.join(instancesRoot(), id)); }

function instanceId(name, loader, version) {
  const base = safeName(name || `${loader}-${version}`).toLowerCase().replace(/\s+/g, '-');
  return `${base}-${crypto.randomBytes(3).toString('hex')}`;
}

async function ensureInstanceLayout(root) {
  const game = path.join(root, '.minecraft');
  await Promise.all([
    game,
    path.join(game, 'mods'),
    path.join(game, 'config'),
    path.join(game, 'saves'),
    path.join(game, 'resourcepacks'),
    path.join(game, 'shaderpacks'),
    path.join(game, 'screenshots'),
    path.join(game, 'logs')
  ].map(ensureDir));
}

export async function listInstances() {
  await ensureDir(instancesRoot());
  const out = [];
  for (const d of await fs.readdir(instancesRoot(), { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const value = await readJson(path.join(instancesRoot(), d.name, 'instance.json'));
    if (value) out.push(value);
  }
  return out.sort((a, b) => new Date(b.lastPlayedAt || 0) - new Date(a.lastPlayedAt || 0));
}

export async function getInstance(id) {
  const value = await readJson(path.join(instanceDir(id), 'instance.json'));
  if (!value) throw new Error('Instance not found.');
  return value;
}

export async function createInstance(data) {
  const loader = ['vanilla','fabric'].includes(data.loader) ? data.loader : 'vanilla';
  const version = String(data.minecraftVersion || '').trim();
  if (!version) throw new Error('Minecraft version is required.');
  const versionMeta = await assertMinecraftVersion(version);
  const name = safeName(data.name || `${version} ${loader}`);
  const id = instanceId(name, loader, version);
  const dir = instanceDir(id);
  await ensureInstanceLayout(dir);
  const value = {
    id,
    name,
    minecraftVersion: version,
    versionType: versionMeta.type || 'release',
    loader,
    loaderVersion: data.loaderVersion || '',
    ramMb: Math.max(1024, Math.min(32768, Number(data.ramMb) || 6144)),
    icon: data.icon || 'grass',
    createdAt: new Date().toISOString(),
    lastPlayedAt: null,
    playtimeSeconds: 0
  };
  await writeJson(path.join(dir, 'instance.json'), value);
  return value;
}

export async function removeInstance(id) {
  await getInstance(id);
  await fs.rm(instanceDir(id), { recursive: true, force: true });
  return true;
}

export async function patchInstance(id, patch = {}) {
  const value = await getInstance(id);
  if ('name' in patch) value.name = safeName(String(patch.name || value.name));
  if ('ramMb' in patch) value.ramMb = Math.max(1024, Math.min(32768, Number(patch.ramMb) || value.ramMb || 6144));
  if ('icon' in patch) value.icon = safeName(String(patch.icon || value.icon || 'grass'));
  await writeJson(path.join(instanceDir(id), 'instance.json'), value);
  return value;
}

export async function duplicateInstance(id, requestedName = '') {
  const source = await getInstance(id);
  const name = safeName(requestedName || `${source.name} Copy`);
  const nextId = instanceId(name, source.loader, source.minecraftVersion);
  const sourceDir = instanceDir(id);
  const targetDir = instanceDir(nextId);
  await fs.cp(sourceDir, targetDir, { recursive: true, force: false, errorOnExist: true });
  const next = {
    ...source,
    id: nextId,
    name,
    createdAt: new Date().toISOString(),
    lastPlayedAt: null,
    playtimeSeconds: 0
  };
  await ensureInstanceLayout(targetDir);
  await writeJson(path.join(targetDir, 'instance.json'), next);
  return next;
}
