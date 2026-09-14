import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as tar from 'tar';

const execFileAsync = promisify(execFile);
const isWin = process.platform === 'win32';
const javaNames = isWin ? ['javaw.exe', 'java.exe'] : ['java'];

async function exists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}

async function resolveExecutable(input) {
  const raw = String(input || '').trim().replace(/^"|"$/g, '');
  if (!raw) return '';
  const stat = await fs.stat(raw).catch(() => null);
  if (stat?.isFile()) return raw;
  if (stat?.isDirectory()) {
    for (const name of javaNames) {
      const direct = path.join(raw, name);
      if (await exists(direct)) return direct;
      const nested = path.join(raw, 'bin', name);
      if (await exists(nested)) return nested;
    }
  }
  return raw;
}

export async function validateJava(javaPath) {
  const resolved = await resolveExecutable(javaPath);
  if (!resolved || !(await exists(resolved))) return null;
  try {
    const probe = isWin && resolved.toLowerCase().endsWith('javaw.exe')
      ? path.join(path.dirname(resolved), 'java.exe')
      : resolved;
    const executable = await exists(probe) ? probe : resolved;
    const { stderr, stdout } = await execFileAsync(executable, ['-version'], { timeout: 7000, windowsHide: true });
    const raw = `${stderr}\n${stdout}`.trim();
    const match = raw.match(/version [\"']([^\"']+)/i);
    const version = match?.[1] || '';
    const major = version
      ? Number((version.startsWith('1.') ? version.split('.')[1] : version.split('.')[0]).replace(/\D/g, ''))
      : 0;
    if (!major) return null;
    return {
      path: resolved,
      major,
      version,
      vendor: raw.split('\n').find(Boolean) || 'Java runtime',
      raw: raw.split('\n').slice(0, 3).join(' | ')
    };
  } catch {
    return null;
  }
}

export async function detectJava() {
  const candidates = new Set();
  if (process.env.JAVA_HOME) candidates.add(process.env.JAVA_HOME);
  for (const item of (process.env.PATH || '').split(path.delimiter)) if (item) candidates.add(item);
  if (isWin) {
    for (const base of ['C:/Program Files/Java', 'C:/Program Files/Eclipse Adoptium', 'C:/Program Files/Microsoft', 'C:/Program Files/Amazon Corretto', 'D:/java']) {
      try {
        for (const dir of await fs.readdir(base, { withFileTypes: true })) if (dir.isDirectory()) candidates.add(path.join(base, dir.name));
      } catch {}
    }
  }

  const out = [];
  for (const candidate of candidates) {
    const value = await validateJava(candidate);
    if (value) out.push(value);
  }
  return [...new Map(out.map(x => [x.path.toLowerCase(), x])).values()].sort((a, b) => b.major - a.major);
}

export function requiredJavaMajor(mcVersion) {
  if (/^26\./.test(mcVersion)) return 25;
  const n = String(mcVersion).split('.').map(Number);
  if (n[0] === 1 && n[1] >= 20 && (n[1] > 20 || (n[2] || 0) >= 5)) return 21;
  if (n[0] === 1 && n[1] >= 18) return 17;
  return 8;
}

// Keep tar imported through its namespace form: tar v7 does not expose a default ESM export.
export { tar };
