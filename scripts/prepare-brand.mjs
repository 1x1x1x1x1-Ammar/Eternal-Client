import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'));
const assets = path.join(root, 'assets');
const build = path.join(root, 'build');
const sourceSvg = path.join(assets, 'logo.svg');
const sourcePng = path.join(assets, 'icon.png');
const targetSvg = path.join(build, 'icon.svg');

await fs.mkdir(build, { recursive: true });

const [svg, png] = await Promise.all([fs.readFile(sourceSvg, 'utf8'), fs.readFile(sourcePng)]);
if (!svg.includes('<svg') || svg.length < 1000) throw new Error('Eternal logo.svg is missing or invalid.');
if (png.length < 1024 || png[0] !== 0x89 || png.toString('ascii', 1, 4) !== 'PNG') throw new Error('Eternal icon.png is missing or invalid.');

const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
if (width < 256 || height < 256) throw new Error(`Eternal Windows icon must be at least 256x256; got ${width}x${height}.`);

await fs.writeFile(targetSvg, svg, 'utf8');
console.log(`Prepared Eternal brand icon: build/icon.svg (${width}x${height} PNG validated).`);
