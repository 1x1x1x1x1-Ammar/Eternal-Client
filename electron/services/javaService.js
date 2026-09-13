import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as tar from 'tar';
const execFileAsync=promisify(execFile);
async function validate(javaPath){try{const {stderr,stdout}=await execFileAsync(javaPath,['-version'],{timeout:7000,windowsHide:true});const raw=`${stderr}\n${stdout}`.trim();const m=raw.match(/version [\"']([^\"']+)/i);const major=m?Number((m[1].startsWith('1.')?m[1].split('.')[1]:m[1].split('.')[0]).replace(/\D/g,'')):0;return {path:javaPath,major,raw:raw.split('\n')[0]};}catch{return null;}}
export async function detectJava(){const candidates=new Set();if(process.env.JAVA_HOME)candidates.add(path.join(process.env.JAVA_HOME,'bin',process.platform==='win32'?'javaw.exe':'java'));for(const item of(process.env.PATH||'').split(path.delimiter))if(item)candidates.add(path.join(item,process.platform==='win32'?'javaw.exe':'java'));if(process.platform==='win32')for(const base of['C:/Program Files/Java','C:/Program Files/Eclipse Adoptium','C:/Program Files/Microsoft','D:/java'])try{for(const d of await fs.readdir(base,{withFileTypes:true}))if(d.isDirectory())candidates.add(path.join(base,d.name,'bin','javaw.exe'));}catch{}const out=[];for(const p of candidates)try{await fs.access(p);const v=await validate(p);if(v)out.push(v);}catch{}return [...new Map(out.map(x=>[x.path.toLowerCase(),x])).values()].sort((a,b)=>b.major-a.major);}
export function requiredJavaMajor(mcVersion){if(/^26\./.test(mcVersion))return 25;const n=mcVersion.split('.').map(Number);if(n[0]===1&&n[1]>=20&&(n[1]>20||(n[2]||0)>=5))return 21;if(n[0]===1&&n[1]>=18)return 17;return 8;}
