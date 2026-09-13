import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { dataRoot } from './store.js';
import { ensureDir, readJson, writeJson, safeName, assertInside } from './fsService.js';
export function instancesRoot(){return path.join(dataRoot(),'instances');} export function instanceDir(id){return assertInside(instancesRoot(),path.join(instancesRoot(),id));}
export async function listInstances(){await ensureDir(instancesRoot());const out=[];for(const d of await fs.readdir(instancesRoot(),{withFileTypes:true}))if(d.isDirectory()){const v=await readJson(path.join(instancesRoot(),d.name,'instance.json'));if(v)out.push(v);}return out.sort((a,b)=>new Date(b.lastPlayedAt||0)-new Date(a.lastPlayedAt||0));}
export async function getInstance(id){const v=await readJson(path.join(instanceDir(id),'instance.json'));if(!v)throw new Error('Instance not found.');return v;}
export async function createInstance(data){const loader=['vanilla','fabric'].includes(data.loader)?data.loader:'vanilla';const version=String(data.minecraftVersion||'1.21.11');const id=`${safeName(data.name||`${loader}-${version}`).toLowerCase().replace(/\s+/g,'-')}-${crypto.randomBytes(3).toString('hex')}`;const dir=instanceDir(id);await ensureDir(path.join(dir,'.minecraft','mods'));const v={id,name:safeName(data.name||`${version} ${loader}`),minecraftVersion:version,loader,loaderVersion:data.loaderVersion||'',ramMb:Number(data.ramMb)||6144,icon:data.icon||'grass',createdAt:new Date().toISOString(),lastPlayedAt:null,playtimeSeconds:0};await writeJson(path.join(dir,'instance.json'),v);return v;}
export async function removeInstance(id){await fs.rm(instanceDir(id),{recursive:true,force:true});return true;} export async function patchInstance(id,patch){const v=await getInstance(id);Object.assign(v,patch);await writeJson(path.join(instanceDir(id),'instance.json'),v);return v;}
