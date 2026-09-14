import fs from 'node:fs/promises';
import path from 'node:path';
import AdmZip from 'adm-zip';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'));
const libs = path.join(root, 'eternal-core', 'build', 'libs');
const output = path.join(root, 'assets', 'eternal-core.jar');

const names = await fs.readdir(libs);
const candidates = names.filter(name => name.endsWith('.jar') && !name.includes('-sources'));
if (candidates.length !== 1) throw new Error(`Expected exactly one Eternal Core runtime JAR in ${libs}; found ${candidates.length}: ${candidates.join(', ')}`);

const source = path.join(libs, candidates[0]);
const zip = new AdmZip(source);
const entry = zip.getEntry('fabric.mod.json');
if (!entry) throw new Error('Built Eternal Core JAR is missing fabric.mod.json.');
const metadata = JSON.parse(entry.getData().toString('utf8'));
if (metadata.id !== 'eternal-core') throw new Error(`Unexpected Fabric mod id: ${metadata.id || '<missing>'}`);
if (metadata.version !== '0.5.0-beta.5') throw new Error(`Unexpected Eternal Core version: ${metadata.version || '<missing>'}`);

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.copyFile(source, output);
const stat = await fs.stat(output);
console.log(`Staged ${path.basename(source)} -> assets/eternal-core.jar (${stat.size} bytes)`);
