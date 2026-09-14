import fs from 'node:fs/promises';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { getInstance, instanceDir } from './instanceService.js';
import { ensureDir, assertInside } from './fsService.js';

const USER_AGENT = 'EternalClient/0.8.0-beta.8';
function modsDir(id) { return path.join(instanceDir(id), '.minecraft', 'mods'); }

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
  return { filename: base, id, name, version, loader, enabled, path: file };
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

async function downloadFile(file, destination, emit, projectName) {
  const temp = `${destination}.part`;
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
  await fs.writeFile(temp, Buffer.concat(chunks));
  await fs.rename(temp, destination);
  emit?.({
    type: 'download',
    id: file.hashes?.sha1 || file.filename,
    name: projectName || file.filename,
    message: `Installed ${file.filename}`,
    state: 'INSTALLED',
    progress: { current: current || total || 1, total: total || current || 1, type: 'mod' }
  });
}

export async function listMods(id) {
  await getInstance(id);
  await ensureDir(modsDir(id));
  const out = [];
  for (const file of await fs.readdir(modsDir(id))) {
    if (file.endsWith('.jar') || file.endsWith('.jar.disabled')) out.push(await metadata(path.join(modsDir(id), file)));
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function addMods(id, files) {
  await getInstance(id);
  await ensureDir(modsDir(id));
  const added = [];
  for (const src of files || []) {
    if (!String(src).toLowerCase().endsWith('.jar')) continue;
    const dest = assertInside(modsDir(id), path.join(modsDir(id), path.basename(src)));
    await fs.copyFile(src, dest);
    added.push(await metadata(dest));
  }
  return added;
}

export async function removeMod(id, filename) {
  await getInstance(id);
  await fs.rm(assertInside(modsDir(id), path.join(modsDir(id), path.basename(filename))), { force: true });
  return true;
}

export async function toggleMod(id, filename, enabled) {
  await getInstance(id);
  const src = assertInside(modsDir(id), path.join(modsDir(id), path.basename(filename)));
  const currently = !src.endsWith('.disabled');
  if (currently === enabled) return true;
  const dest = enabled ? src.replace(/\.disabled$/i, '') : `${src}.disabled`;
  if (await fs.stat(dest).catch(() => null)) throw new Error(`Cannot toggle mod because ${path.basename(dest)} already exists.`);
  await fs.rename(src, dest);
  return true;
}

export async function searchModrinth({ query = '', mcVersion = '', loader = 'fabric', limit = 20 }) {
  const facets = [];
  if (mcVersion) facets.push([`versions:${mcVersion}`]);
  if (loader && loader !== 'vanilla') facets.push([`categories:${loader}`]);
  facets.push(['project_type:mod']);
  const url = new URL('https://api.modrinth.com/v2/search');
  url.searchParams.set('query', String(query || '').trim());
  url.searchParams.set('limit', String(Math.min(Math.max(Number(limit) || 20, 1), 50)));
  url.searchParams.set('facets', JSON.stringify(facets));
  return fetchJson(url);
}

export async function installModrinth({ instanceId, projectId, emit = () => {} }) {
  const instance = await getInstance(instanceId);
  if (instance.loader === 'vanilla') throw new Error('Modrinth mod installation requires a mod loader profile. Create/select a Fabric profile.');
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
    const existing = await fs.stat(destination).catch(() => null);
    if (!existing) await downloadFile(file, destination, emit, version.name || file.filename);
    installed.push({ ...(await metadata(destination)), projectId: version.project_id, versionId: version.id, alreadyPresent: Boolean(existing) });
  }

  await installTarget({ projectId });
  return { primaryProjectId: projectId, installed };
}
