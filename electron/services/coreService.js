import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import { getInstance, instanceDir } from './instanceService.js';
import { ensureDir } from './fsService.js';
const here=path.dirname(fileURLToPath(import.meta.url));
const staged=path.resolve(here,'../../assets/eternal-core.jar');
export async function coreStatus(instanceId){const i=await getInstance(instanceId);const supported=i.loader==='fabric'&&i.minecraftVersion==='1.21.11';const dest=path.join(instanceDir(instanceId),'.minecraft','mods','eternal-core.jar');let stagedExists=false,installed=false;try{await fs.access(staged);stagedExists=true;}catch{}try{await fs.access(dest);installed=true;}catch{}return {supported,stagedExists,installed,target:'Minecraft 1.21.11 + Fabric'};}
export async function prepareCore(instanceId){const status=await coreStatus(instanceId);if(!status.supported)return {installed:false,reason:`Eternal Core beta currently certifies ${status.target}.`};if(!status.stagedExists)return {installed:false,reason:'Eternal Core JAR is not staged. Build eternal-core first, then stage the JAR.'};const zip=new AdmZip(staged);const mod=zip.getEntry('fabric.mod.json');if(!mod)throw new Error('Staged Eternal Core JAR is invalid: fabric.mod.json missing.');const meta=JSON.parse(mod.getData().toString('utf8'));if(meta.id!=='eternal-core')throw new Error('Staged JAR is not Eternal Core.');const dir=path.join(instanceDir(instanceId),'.minecraft','mods');await ensureDir(dir);await fs.copyFile(staged,path.join(dir,'eternal-core.jar'));return {installed:true,version:meta.version||'unknown'};}
