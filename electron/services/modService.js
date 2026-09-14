import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';
import { getInstance, instanceDir } from './instanceService.js';
import { ensureDir, assertInside } from './fsService.js';

const USER_AGENT = 'EternalClient/1.0.0';
function modsDir(id) { return path.join(instanceDir(id), '.minecraft', 'mods'); }
function isManagedCoreFilename(filename) { return path.basename(String(filename || '')).toLowerCase() === 'eternal-core.jar'; }

async function metadata(file) {
  const base = path.basename(file);
  const enabled = !base.endsWith('.disabled');
  const actual = enabled ? base : base.slice(0, -9);
  let name = actual.replace(/\.jar$/i, ''), version = '', loader = 'unknown', id = '';
  try {
    const zip = new AdmZip(file);
    const entry = zip.getEntry('fabric.mod.json');
    if (entry) {
      const json = JSON.parse(entry.getData().toString('utf8'));
      name = json.name || json.id || name;
      id = json.id || '';
      version = json.version || '';
      loader = 'fabric';
    }
  } catch {}
  return { filename: base, id, name, version, loader, enabled, managed: isManagedCoreFilename(base), path: file };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`Modrinth request failed (${response.status}).`);
  return response.json();
}

async function compatibleVersion(instance, { projectId, versionId }) {
  if (versionId) {
    const version = await fetchJson(`https://api.modrinth.com/v2/version/${encodeURIComponent(versionId)}`);
    if (!version.game_versions?.includes(instance.minecraftVersion) || !version.loaders?.includes(instance.loader)) {
      throw new Error(`Required dependency ${version.name || version.id} is not compatible with ${instance.minecraftVersion} ${instance.loader}.`);
    }
    return version;
  }
  const url = new URL(`https://api.modrinth.com/v2/project/${encodeURIComponent(projectId)}/version`);
  url.searchParams.set('game_versions', JSON.stringify([instance.minecraftVersion]));
  url.searchParams.set('loaders', JSON.stringify([instance.loader]));
  const versions = await fetchJson(url);
  return versions.find(v => v.version_type === 'release') || versions[0] || null;
}

function verifyBuffer(buffer, hashes = {}) {
  for (const algorithm of ['sha512', 'sha1']) {
    const expected = String(hashes?.[algorithm] || '').toLowerCase();
    if (!expected) continue;
    const actual = crypto.createHash(algorithm).update(buffer).digest('hex').toLowerCase();
    if (actual !== expected) throw new Error(`Downloaded mod failed ${algorithm.toUpperCase()} verification.`);
    return { algorithm, digest: actual };
  }
  return null;
}

async function existingMatches(file, hashes = {}) {
  const algorithm = hashes.sha512 ? 'sha512' : hashes.sha1 ? 'sha1' : null;
  if (!algorithm) return false;
  try {
    const data = await fs.readFile(file);
    return crypto.createHash(algorithm).update(data).digest('hex').toLowerCase() === String(hashes[algorithm]).toLowerCase();
  } catch {
    return false;
  }
}

async function downloadFile(file, destination, emit, projectName) {
  const temp = `${destination}.part`;
  await fs.rm(temp, { force: true });
  try {
    const response = await fetch(file.url, { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) throw new Error(`Mod download failed (${response.status}).`);
    const total = Number(response.headers.get('content-length') || 0);
    let current = 0;
    const chunks = [];
    for await (const chunk of response.body) {
      const buffer = Buffer.from(chunk);
      chunks.push(buffer);
      current += buffer.length;
      emit?.({
        type: 'download',
        id: file.hashes?.sha1 || file.filename,
        name: projectName || file.filename,
        message: `Downloading ${file.filename}`,
        progress: { current, total, type: 'mod' }
      });
    }
    const data = Buffer.concat(chunks);
    verifyBuffer(data, file.hashes || {});
    await fs.writeFile(temp, data);
    await fs.rm(destination, { force: true });
    await fs.rename(temp, destination);
    emit?.({
      type: 'download',
      id: file.hashes?.sha1 || file.filename,
      name: projectName || file.filename,
      message: `Installed ${file.filename}`,
      state: 'INSTALLED',
      progress: { current: current || total || 1, total: total || current || 1, type: 'mod' }
    });
  } catch (error) {
    await fs.rm(temp, { force: true });
    throw error;
  }
}

export async function listMods(id) {
  await getInstance(id);
  await ensureDir(modsDir(id));
  const out = [];
  for (const file of await fs.readdir(modsDir(id))) {
    if (file.endsWith('.jar') || file.endsWith('.jar.disabled')) out.push(await metadata(path.join(modsDir(id), file)));
  }
  return out.sort((a, b) => Number(b.managed) - Number(a.managed) || a.name.localeCompare(b.name));
}

export async function addMods(id, files) {
  const instance = await getInstance(id);
  if (instance.loader === 'vanilla') throw new Error('Local mod JARs require a mod-loader profile. Select or create a Fabric instance.');
  await ensureDir(modsDir(id));
  const added = [];
  for (const src of files || []) {
    if (!String(src).toLowerCase().endsWith('.jar')) continue;
    const sourceMeta = await metadata(src);
    if (sourceMeta.id === 'eternal-core') throw new Error('Eternal Core is launcher-managed. Use the Eternal Core page or the standalone JAR in a separate Fabric profile.');
    const dest = assertInside(modsDir(id), path.join(modsDir(id), path.basename(src)));
    if (isManagedCoreFilename(dest)) throw new Error('eternal-core.jar is reserved for Eternal launcher management.');
    await fs.copyFile(src, dest);
    added.push(await metadata(dest));
  }
  return added;
}

export async function removeMod(id, filename) {
  await getInstance(id);
  if (isManagedCoreFilename(filename)) throw new Error('Eternal Core is managed by the launcher and cannot be removed from Mod Hub.');
  await fs.rm(assertInside(modsDir(id), path.join(modsDir(id), path.basename(filename))), { force: true });
  return true;
}

export async function toggleMod(id, filename, enabled) {
  await getInstance(id);
  if (isManagedCoreFilename(filename)) throw new Error('Eternal Core is managed by the launcher and cannot be disabled from Mod Hub.');
  const src = assertInside(modsDir(id), path.join(modsDir(id), path.basename(filename)));
  const currently = !src.endsWith('.disabled');
  if (currently === enabled) return true;
  const dest = enabled ? src.replace(/\.disabled$/i, '') : `${src}.disabled`;
  if (await fs.stat(dest).catch(() => null)) throw new Error(`Cannot toggle mod because ${path.basename(dest)} already exists.`);
  await fs.rename(src, dest);
  return true;
}

export async function searchModrinth({ query = '', mcVersion = '', loader = 'fabric', category = '', index = 'relevance', limit = 24, offset = 0 }) {
  const facets = [];
  if (mcVersion) facets.push([`versions:${mcVersion}`]);
  if (loader && loader !== 'vanilla') facets.push([`categories:${loader}`]);
  if (category) facets.push([`categories:${String(category).trim()}`]);
  facets.push(['project_type:mod']);
  const allowedIndex = new Set(['relevance', 'downloads', 'follows', 'newest', 'updated']);
  const url = new URL('https://api.modrinth.com/v2/search');
  url.searchParams.set('query', String(query || '').trim());
  url.searchParams.set('limit', String(Math.min(Math.max(Number(limit) || 24, 1), 50)));
  url.searchParams.set('offset', String(Math.max(0, Number(offset) || 0)));
  url.searchParams.set('index', allowedIndex.has(index) ? index : 'relevance');
  url.searchParams.set('facets', JSON.stringify(facets));
  return fetchJson(url);
}

export async function installModrinth({ instanceId, projectId, emit = () => {} }) {
  const instance = await getInstance(instanceId);
  if (instance.loader === 'vanilla') throw new Error('Modrinth mod installation requires a mod-loader profile. Create/select a Fabric profile.');
  await ensureDir(modsDir(instanceId));

  const visited = new Set();
  const installed = [];

  async function installTarget(target, requiredBy = '') {
    const key = target.versionId ? `version:${target.versionId}` : `project:${target.projectId}`;
    if (visited.has(key)) return;
    visited.add(key);

    const version = await compatibleVersion(instance, target);
    if (!version) throw new Error(`No compatible Modrinth version found${requiredBy ? ` for dependency required by ${requiredBy}` : ''}.`);

    for (const dependency of version.dependencies || []) {
      if (dependency.dependency_type !== 'required') continue;
      if (dependency.version_id) await installTarget({ versionId: dependency.version_id }, version.name || projectId);
      else if (dependency.project_id) await installTarget({ projectId: dependency.project_id }, version.name || projectId);
    }

    const file = version.files?.find(f => f.primary) || version.files?.[0];
    if (!file?.url || !file?.filename) throw new Error(`Compatible Modrinth version ${version.name || version.id} has no downloadable file.`);
    const destination = assertInside(modsDir(instanceId), path.join(modsDir(instanceId), path.basename(file.filename)));
    if (isManagedCoreFilename(destination)) throw new Error('Modrinth attempted to overwrite launcher-managed Eternal Core.');

    const exists = Boolean(await fs.stat(destination).catch(() => null));
    const exact = exists && await existingMatches(destination, file.hashes || {});
    if (!exact) await downloadFile(file, destination, emit, version.name || file.filename);
    installed.push({ ...(await metadata(destination)), projectId: version.project_id, versionId: version.id, alreadyPresent: exact });
  }

  await installTarget({ projectId });
  return { primaryProjectId: projectId, installed };
}
