import fs from 'node:fs/promises';
import path from 'node:path';
import AdmZip from 'adm-zip';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'));
const coreRoot = path.join(root, 'eternal-core');
const libs = path.join(coreRoot, 'build', 'libs');
const output = path.join(root, 'assets', 'eternal-core.jar');

async function expectedCoreVersion() {
  const properties = await fs.readFile(path.join(coreRoot, 'gradle.properties'), 'utf8');
  const line = properties.split(/\r?\n/).find(value => /^\s*mod_version\s*=/.test(value));
  const version = line?.split('=').slice(1).join('=').trim();
  if (!version) throw new Error('eternal-core/gradle.properties does not define mod_version.');
  return version;
}

const expectedVersion = await expectedCoreVersion();
const packageJson = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
if (packageJson.version !== expectedVersion) {
  throw new Error(`Launcher/Core version mismatch: package.json=${packageJson.version}, Eternal Core=${expectedVersion}`);
}

const names = await fs.readdir(libs);
const candidates = names.filter(name => name.endsWith('.jar') && !name.includes('-sources'));
if (candidates.length !== 1) {
  throw new Error(`Expected exactly one Eternal Core runtime JAR in ${libs}; found ${candidates.length}: ${candidates.join(', ')}`);
}

const source = path.join(libs, candidates[0]);
const zip = new AdmZip(source);
const entry = zip.getEntry('fabric.mod.json');
if (!entry) throw new Error('Built Eternal Core JAR is missing fabric.mod.json.');

const metadata = JSON.parse(entry.getData().toString('utf8'));
if (metadata.id !== 'eternal-core') throw new Error(`Unexpected Fabric mod id: ${metadata.id || '<missing>'}`);
if (metadata.version !== expectedVersion) {
  throw new Error(`Unexpected Eternal Core version: ${metadata.version || '<missing>'}; expected ${expectedVersion}`);
}

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.copyFile(source, output);
const stat = await fs.stat(output);
console.log(`Verified Eternal Core ${expectedVersion}`);
console.log(`Staged ${path.basename(source)} -> assets/eternal-core.jar (${stat.size} bytes)`);
