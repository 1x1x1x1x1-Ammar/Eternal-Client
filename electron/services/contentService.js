import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import AdmZip from 'adm-zip';
import { getInstance, instanceDir } from './instanceService.js';
import { assertInside, ensureDir } from './fsService.js';
import { downloadFile, listMods, addMods, toggleMod, removeMod, installModrinth } from './modService.js';
import { createSerialQueue } from '../../shared/serialQueue.js';

const writes = createSerialQueue();
const folders = { resourcepack:'resourcepacks', shader:'shaderpacks', datapack:'datapacks' };
const loaders = { resourcepack:['minecraft'], shader:['iris','optifine'], datapack:['datapack'] };
const types = new Set(['mod', ...Object.keys(folders)]);
function validateType(type) { if (!types.has(type)) throw new Error('Unsupported content type.'); }
function filename(value) {
  if (!value || value !== path.basename(value) || /[\\/]/.test(value) || !/\.(jar|zip)(\.disabled)?$/i.test(value)) throw new Error('Invalid content filename.');
  return value;
}
async function directory({ instanceId, type, world }) {
  validateType(type);
  await getInstance(instanceId);
  const game = path.join(instanceDir(instanceId), '.minecraft');
  if (type === 'mod') return path.join(game, 'mods');
  if (type !== 'datapack') return path.join(game, folders[type]);
  if (!world || world !== path.basename(world) || /[\\/]/.test(world) || world === '.' || world === '..') throw new Error('Select an existing singleplayer world for datapacks.');
  const saves = path.join(game, 'saves');
  const worldDir = assertInside(saves, path.join(saves, world));
  const realSaves = await fs.realpath(saves);
  assertInside(realSaves, await fs.realpath(worldDir));
  await fs.access(path.join(worldDir, 'level.dat'));
  return path.join(worldDir, 'datapacks');
}
export async function listWorlds(instanceId) {
  await getInstance(instanceId);
  const dir = path.join(instanceDir(instanceId), '.minecraft', 'saves');
  const entries = await fs.readdir(dir, { withFileTypes:true }).catch(error => { if (error.code === 'ENOENT') return []; throw error; });
  const out = [];
  for (const entry of entries) if (entry.isDirectory()) {
    if (await fs.stat(path.join(dir, entry.name, 'level.dat')).catch(() => null)) out.push({ id:entry.name, name:entry.name });
  }
  return out.sort((a,b) => a.name.localeCompare(b.name));
}
export async function listContent(data) {
  if (data.type === 'mod') return listMods(data.instanceId);
  const dir = await directory(data);
  await ensureDir(dir);
  return (await fs.readdir(dir)).filter(name => /\.zip(\.disabled)?$/i.test(name)).sort().map(name => ({ filename:name, name:name.replace(/\.zip(\.disabled)?$/i,''), enabled:!name.endsWith('.disabled'), managed:false, loader:data.type }));
}
function validatePack(file, type) {
  const zip = new AdmZip(file);
  if (type === 'shader') {
    if (!zip.getEntries().some(entry => entry.entryName.startsWith('shaders/'))) throw new Error('Shader ZIP must contain a shaders directory.');
  } else if (!zip.getEntry('pack.mcmeta')) throw new Error('Pack ZIP must contain pack.mcmeta at its root.');
}
export async function addContent(data) {
  return writes(data.instanceId, async () => {
    if (data.type === 'mod') return addMods(data.instanceId, data.files);
    const dir = await directory(data);
    await ensureDir(dir);
    const added = [];
    for (const source of data.files || []) {
      if (!/\.zip$/i.test(source)) throw new Error('Resource packs, datapacks and shader packs must be ZIP files.');
      validatePack(source, data.type);
      const target = assertInside(dir, path.join(dir, filename(path.basename(source))));
      await fs.copyFile(source, target, fs.constants.COPYFILE_EXCL);
      added.push({ filename:path.basename(target) });
    }
    return added;
  });
}
export async function toggleContent(data) {
  return writes(data.instanceId, async () => {
    if (data.type === 'mod') return toggleMod(data.instanceId, data.filename, data.enabled);
    const dir = await directory(data);
    const source = assertInside(dir, path.join(dir, filename(data.filename)));
    if (!source.endsWith('.disabled') === data.enabled) return true;
    const target = data.enabled ? source.slice(0,-9) : source + '.disabled';
    if (await fs.stat(target).catch(() => null)) throw new Error('A file with that name already exists.');
    await fs.rename(source,target);
    return true;
  });
}
export async function removeContent(data) {
  return writes(data.instanceId, async () => {
    if (data.type === 'mod') return removeMod(data.instanceId, data.filename);
    const dir = await directory(data);
    await fs.rm(assertInside(dir,path.join(dir,filename(data.filename))),{force:true});
    return true;
  });
}
async function json(url) {
  const response = await fetch(url, { headers:{'User-Agent':'EternalClient/1.2.0 (github.com/1x1x1x1x1-Ammar/Eternal-Client)'} });
  if (!response.ok) throw new Error(`Modrinth request failed (${response.status}).`);
  return response.json();
}
export async function installContent(data) {
  return writes(data.instanceId, async () => {
    if (data.type === 'mod') return installModrinth(data);
    const instance = await getInstance(data.instanceId);
    const dir = await directory(data);
    await ensureDir(dir);
    const visited = new Set(), installed = [];
    async function install(projectId, versionId) {
      const key = versionId || projectId;
      if (visited.has(key)) return;
      visited.add(key);
      let version;
      if (versionId) version = await json(`https://api.modrinth.com/v2/version/${encodeURIComponent(versionId)}`);
      else {
        const url = new URL(`https://api.modrinth.com/v2/project/${encodeURIComponent(projectId)}/version`);
        url.searchParams.set('game_versions', JSON.stringify([instance.minecraftVersion]));
        url.searchParams.set('loaders',JSON.stringify(loaders[data.type]));
        const versions = await json(url);
        version = versions.find(item => item.version_type === 'release') || versions[0];
      }
      if (!version || !version.game_versions?.includes(instance.minecraftVersion) || !version.loaders?.some(loader => loaders[data.type].includes(loader))) throw new Error(`No compatible ${data.type} version for Minecraft ${instance.minecraftVersion}. Required dependencies must support the same pack type.`);
      for (const dependency of version.dependencies || []) if (dependency.dependency_type === 'required') {
        if (!dependency.project_id && !dependency.version_id) throw new Error('A required dependency must be installed manually.');
        await install(dependency.project_id, dependency.version_id);
      }
      const file = version.files?.find(item => item.primary) || version.files?.[0];
      if (!file || !/\.zip$/i.test(file.filename) || !file.url.startsWith('https://cdn.modrinth.com/') || (!file.hashes?.sha512 && !file.hashes?.sha1)) throw new Error('Modrinth did not provide a verified pack ZIP.');
      const target = assertInside(dir,path.join(dir,filename(file.filename)));
      if (await fs.stat(target).catch(() => null)) {
        const algorithm = file.hashes.sha512 ? 'sha512' : 'sha1';
        const digest = crypto.createHash(algorithm).update(await fs.readFile(target)).digest('hex');
        if (digest !== file.hashes[algorithm]) throw new Error('A different pack already uses this filename. Remove or rename it before installing.');
        installed.push({filename:file.filename, projectId:version.project_id, versionId:version.id, alreadyPresent:true});
        return;
      }
      const temp = target + '.download';
      try {
        await downloadFile(file,temp,data.emit,version.name,false);
        validatePack(temp,data.type);
        await fs.copyFile(temp,target,fs.constants.COPYFILE_EXCL);
        data.emit?.({ type:'download', id:file.hashes.sha1 || file.filename, name:version.name || file.filename,
          message:`Installed ${file.filename}`, state:'INSTALLED', progress:{current:1,total:1,type:data.type} });
      } finally { await fs.rm(temp,{force:true}); }
      installed.push({filename:file.filename,projectId:version.project_id,versionId:version.id});
    }
    await install(data.projectId);
    return { installed };
  });
}
