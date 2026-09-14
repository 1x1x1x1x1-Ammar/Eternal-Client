import fs from 'node:fs/promises';
import path from 'node:path';
import { dataRoot } from './store.js';

const PNG_SIGNATURE = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
const MAX_SKIN_BYTES = 2 * 1024 * 1024;

export function inspectSkinPng(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 24) throw new Error('Skin file is not a valid PNG.');
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error('Skin file must be a PNG image.');
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width !== 64 || ![32, 64].includes(height)) {
    throw new Error(`Minecraft skin must be 64x64 or legacy 64x32 pixels; received ${width}x${height}.`);
  }
  if (buffer.length > MAX_SKIN_BYTES) throw new Error('Skin PNG is larger than Eternal allows (2 MB).');
  return { width, height, bytes: buffer.length };
}

export async function readSkinFile(filePath) {
  const file = String(filePath || '').trim();
  if (!file || path.extname(file).toLowerCase() !== '.png') throw new Error('Choose a PNG skin file.');
  const buffer = await fs.readFile(file);
  return { buffer, ...inspectSkinPng(buffer) };
}

function skinDirectory() { return path.join(dataRoot(), 'skins'); }

export async function saveLocalSkin(uuid, sourcePath) {
  const { buffer, width, height, bytes } = await readSkinFile(sourcePath);
  const dir = skinDirectory();
  await fs.mkdir(dir, { recursive: true });
  const safeId = String(uuid || 'offline').replace(/[^a-zA-Z0-9-]/g, '');
  const destination = path.join(dir, `${safeId}.png`);
  const temp = `${destination}.tmp`;
  await fs.writeFile(temp, buffer);
  await fs.rename(temp, destination).catch(async () => {
    await fs.rm(destination, { force: true });
    await fs.rename(temp, destination);
  });
  return { path: destination, width, height, bytes };
}

export async function removeLocalSkin(filePath) {
  if (!filePath) return;
  await fs.rm(String(filePath), { force: true }).catch(() => {});
}

function dataUrl(buffer) { return `data:image/png;base64,${buffer.toString('base64')}`; }

export async function skinPreviewData({ localPath = '', remoteUrl = '' } = {}) {
  if (localPath) {
    try {
      const buffer = await fs.readFile(localPath);
      const meta = inspectSkinPng(buffer);
      return { dataUrl: dataUrl(buffer), source: 'local', ...meta };
    } catch {}
  }
  if (!remoteUrl) return { dataUrl: '', source: 'none' };
  let url;
  try { url = new URL(remoteUrl); } catch { return { dataUrl: '', source: 'none' }; }
  if (url.protocol === 'http:' && url.hostname === 'textures.minecraft.net') url.protocol = 'https:';
  if (url.protocol !== 'https:') throw new Error('Remote Minecraft skin URL must use HTTPS.');
  const response = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'EternalClient/1.0.1' } });
  if (!response.ok) throw new Error(`Could not download Minecraft skin preview (${response.status}).`);
  const array = await response.arrayBuffer();
  const buffer = Buffer.from(array);
  const meta = inspectSkinPng(buffer);
  return { dataUrl: dataUrl(buffer), source: 'minecraft', ...meta };
}
