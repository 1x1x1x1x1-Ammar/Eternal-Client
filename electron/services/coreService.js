import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import { getInstance, instanceDir } from './instanceService.js';
import { ensureDir } from './fsService.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const staged = path.resolve(here, '../../assets/eternal-core.jar');

async function readStagedMetadata() {
  await fs.access(staged);
  const zip = new AdmZip(staged);
  const mod = zip.getEntry('fabric.mod.json');
  if (!mod) throw new Error('Staged Eternal Core JAR is invalid: fabric.mod.json missing.');
  const meta = JSON.parse(mod.getData().toString('utf8'));
  if (meta.id !== 'eternal-core') throw new Error('Staged JAR is not Eternal Core.');
  return meta;
}

export async function coreStatus(instanceId) {
  const instance = await getInstance(instanceId);
  const supported = instance.loader === 'fabric' && instance.minecraftVersion === '1.21.11';
  const dest = path.join(instanceDir(instanceId), '.minecraft', 'mods', 'eternal-core.jar');
  let stagedExists = false;
  let installed = false;
  let version = null;

  try {
    const meta = await readStagedMetadata();
    stagedExists = true;
    version = meta.version || null;
  } catch {}
  try { await fs.access(dest); installed = true; } catch {}

  return {
    supported,
    stagedExists,
    installed,
    version,
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
  await fs.copyFile(staged, path.join(dir, 'eternal-core.jar'));
  return { installed: true, version: meta.version || 'unknown' };
}

export async function exportStandalone(destination) {
  if (!destination) return { canceled: true };
  const meta = await readStagedMetadata();
  await ensureDir(path.dirname(destination));
  await fs.copyFile(staged, destination);
  return {
    canceled: false,
    path: destination,
    version: meta.version || 'unknown',
    target: 'Minecraft 1.21.11 + Fabric + Java 21'
  };
}
