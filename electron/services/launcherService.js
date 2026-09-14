import path from 'node:path';
import { getInstance, instanceDir, patchInstance } from './instanceService.js';
import { installFabricProfile } from './fabricService.js';
import { prepareCore } from './coreService.js';
import { activeAccount, launcherAuthorization } from './accountService.js';
import { store } from './store.js';
import { requiredJavaMajor, detectJava, validateJava } from './javaService.js';

const processes = new Map();
let ClientClass = null;

async function clientClass() {
  if (ClientClass) return ClientClass;
  const mod = await import('minecraft-launcher-core');
  ClientClass = mod.Client || mod.default?.Client;
  if (!ClientClass) throw new Error('minecraft-launcher-core Client export unavailable.');
  return ClientClass;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
}

function versionAtLeast(version, major, minor, patch = 0) {
  const parts = String(version).split('.').map(value => Number.parseInt(value, 10) || 0);
  const current = [parts[0] || 0, parts[1] || 0, parts[2] || 0];
  const wanted = [major, minor, patch];
  for (let i = 0; i < 3; i += 1) {
    if (current[i] > wanted[i]) return true;
    if (current[i] < wanted[i]) return false;
  }
  return true;
}

function serverLaunchArgs(instance, server) {
  if (!server?.host) return [];
  const host = String(server.host).trim();
  const port = Number(server.port) || 25565;
  if (versionAtLeast(instance.minecraftVersion, 1, 20, 0)) {
    return ['--quickPlayMultiplayer', `${host}:${port}`];
  }
  return ['--server', host, '--port', String(port)];
}

function classifyGameMessage(value, debug = false) {
  const message = String(value ?? '').trimEnd();
  const lower = message.toLowerCase();
  if (/\b(fatal|exception|crash|error)\b/.test(lower) || lower.includes('caused by:')) return { message, level: 'error', warning: true };
  if (/\bwarn(?:ing)?\b/.test(lower) || lower.includes('mixin apply failed')) return { message, level: 'warning', warning: true };
  return { message, level: debug ? 'debug' : 'info', warning: false };
}

async function resolveJava(instance) {
  const configured = store.get('settings.javaPath');
  const required = requiredJavaMajor(instance.minecraftVersion);
  if (configured) {
    const runtime = await validateJava(configured);
    if (!runtime) throw new Error('The configured Java path is not a working Java runtime. Choose a valid JDK/JRE in Settings.');
    if (runtime.major < required) throw new Error(`Minecraft ${instance.minecraftVersion} requires Java ${required}+; configured Java is ${runtime.major}.`);
    return { ...runtime, required };
  }
  const found = await detectJava();
  const best = found.find(java => java.major >= required);
  if (!best) throw new Error(`Minecraft ${instance.minecraftVersion} requires Java ${required}+; configure a compatible Java runtime in Settings.`);
  return { ...best, required };
}

export function runningState() {
  return [...processes.entries()].map(([instanceId, children]) => ({ instanceId, pids: [...children].map(child => child.pid), count: children.size }));
}

export async function launchInstance({ instanceId, server = null, requireCore = false, emit = () => {} }) {
  const instance = await getInstance(instanceId);
  if (!['vanilla', 'fabric'].includes(instance.loader)) throw new Error(`Loader ${instance.loader} is not implemented by this Eternal build.`);
  if (requireCore && !(instance.loader === 'fabric' && instance.minecraftVersion === '1.21.11')) {
    throw new Error('Launch with Core currently requires a Fabric 1.21.11 profile.');
  }

  const gameRoot = path.join(instanceDir(instanceId), '.minecraft');
  const account = activeAccount();
  if (!account) throw new Error('Add and select an account before launching.');

  emit({ instanceId, state: 'VALIDATING', message: 'Validating profile, account and Java…' });
  const java = await resolveJava(instance);
  const authorization = await launcherAuthorization(account);
  let versionCustom = '';

  if (instance.loader === 'fabric') {
    emit({ instanceId, state: 'RESOLVING_LOADER', message: 'Resolving Fabric loader from official metadata…' });
    const fabric = await installFabricProfile(gameRoot, instance.minecraftVersion, instance.loaderVersion);
    versionCustom = fabric.id;

    if (instance.minecraftVersion === '1.21.11') {
      emit({ instanceId, state: 'PREPARING_MODS', message: 'Verifying Eternal Core…' });
      const core = await prepareCore(instanceId);
      if (!core.installed && requireCore) throw new Error(core.reason || 'Eternal Core could not be prepared.');
      if (!core.installed) emit({ instanceId, state: 'PREPARING_MODS', message: core.reason, warning: true });
      else emit({ instanceId, state: 'PREPARING_MODS', message: core.changed ? `Eternal Core ${core.version} repaired/updated.` : `Eternal Core ${core.version} verified.` });
    } else if (requireCore) {
      throw new Error('Eternal Core is not certified for this Minecraft version.');
    }
  }

  emit({ instanceId, state: 'STARTING_JVM', message: `Starting Minecraft with Java ${java.major}…` });
  const Client = await clientClass();
  const client = new Client();
  const settings = store.get('settings');
  const maxMb = clampNumber(instance.ramMb || settings.ramMb, 1024, 32768, 6144);
  const width = Math.round(clampNumber(settings.resolution?.width, 640, 7680, 1280));
  const height = Math.round(clampNumber(settings.resolution?.height, 360, 4320, 720));
  const customLaunchArgs = serverLaunchArgs(instance, server);

  const options = {
    authorization,
    root: gameRoot,
    javaPath: java.path,
    version: { number: instance.minecraftVersion, type: 'release', ...(versionCustom ? { custom: versionCustom } : {}) },
    memory: { min: `${Math.max(1024, Math.floor(maxMb / 2))}M`, max: `${maxMb}M` },
    window: { width, height },
    customLaunchArgs
  };

  client.on('progress', progress => emit({ instanceId, state: 'DOWNLOADING', message: progress.type || 'Downloading Minecraft files…', progress, source: 'minecraft' }));
  client.on('download-status', progress => emit({ instanceId, state: 'DOWNLOADING', message: 'Downloading Minecraft files…', progress, source: 'minecraft' }));
  client.on('debug', value => {
    const line = classifyGameMessage(value, true);
    emit({ instanceId, state: 'DEBUG', ...line });
  });
  client.on('data', value => {
    const line = classifyGameMessage(value, false);
    emit({ instanceId, state: 'LOG', ...line });
  });

  const child = await client.launch(options);
  if (!child?.pid) throw new Error('Minecraft process did not start.');
  if (!processes.has(instanceId)) processes.set(instanceId, new Set());
  processes.get(instanceId).add(child);

  const started = Date.now();
  emit({ instanceId, state: 'RUNNING', message: `Minecraft running (PID ${child.pid})`, pid: child.pid, remaining: processes.get(instanceId).size });
  await patchInstance(instanceId, { lastPlayedAt: new Date().toISOString() });

  child.once('error', error => {
    emit({ instanceId, state: 'PROCESS_ERROR', level: 'error', warning: true, message: `Minecraft process error: ${error?.message || error}`, pid: child.pid });
  });
  child.once('close', async code => {
    const set = processes.get(instanceId);
    set?.delete(child);
    const remaining = set?.size || 0;
    if (set && remaining === 0) processes.delete(instanceId);
    const latest = await getInstance(instanceId).catch(() => null);
    if (latest) await patchInstance(instanceId, { playtimeSeconds: (latest.playtimeSeconds || 0) + Math.round((Date.now() - started) / 1000) });
    const failed = Number.isInteger(code) && code !== 0;
    emit({
      instanceId,
      state: 'STOPPED',
      level: failed ? 'error' : 'info',
      warning: failed,
      message: failed ? `Minecraft exited with code ${code}. Open Console → Minecraft for the preceding error/warning lines.` : `Minecraft exited (${code ?? 'unknown'}).`,
      code,
      pid: child.pid,
      remaining
    });
  });

  return { pid: child.pid, javaMajor: java.major, javaPath: java.path };
}

export function stopInstance(id) {
  const set = processes.get(id);
  if (!set?.size) return false;
  for (const process of set) {
    try { process.kill(); } catch {}
  }
  return true;
}
