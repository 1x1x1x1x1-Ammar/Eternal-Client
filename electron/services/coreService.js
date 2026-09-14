import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import { getInstance, instanceDir } from './instanceService.js';
import { ensureDir } from './fsService.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const staged = path.resolve(here, '../../assets/eternal-core.jar');

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
