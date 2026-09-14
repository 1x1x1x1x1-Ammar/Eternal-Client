import path from 'node:path';
import { getInstance, instanceDir, patchInstance } from './instanceService.js';
import { installFabricProfile } from './fabricService.js';
import { prepareCore } from './coreService.js';
import { activeAccount, launcherAuthorization } from './accountService.js';
import { store } from './store.js';
import { requiredJavaMajor, detectJava } from './javaService.js';

const processes = new Map();
let ClientClass = null;

async function clientClass() {
  if (ClientClass) return ClientClass;
  const mod = await import('minecraft-launcher-core');
  ClientClass = mod.Client || mod.default?.Client;
  if (!ClientClass) throw new Error('minecraft-launcher-core Client export unavailable.');
  return ClientClass;
}

async function resolveJava(instance) {
  const configured = store.get('settings.javaPath');
  const required = requiredJavaMajor(instance.minecraftVersion);
  if (configured) return { path: configured, required };
  const found = await detectJava();
  const best = found.find(java => java.major >= required);
  if (!best) throw new Error(`Minecraft ${instance.minecraftVersion} requires Java ${required}+; configure a compatible Java runtime in Settings.`);
  return { path: best.path, required };
}

export function runningState() {
  return [...processes.entries()].map(([instanceId, children]) => ({ instanceId, pids: [...children].map(child => child.pid), count: children.size }));
}

export async function launchInstance({ instanceId, server = null, emit = () => {} }) {
  const instance = await getInstance(instanceId);
  const gameRoot = path.join(instanceDir(instanceId), '.minecraft');
  const account = activeAccount();
  if (!account) throw new Error('Add and select an account before launching.');

  emit({ instanceId, state: 'VALIDATING', message: 'Validating instance…' });
  const java = await resolveJava(instance);
  let versionCustom = '';

  if (instance.loader === 'fabric') {
    emit({ instanceId, state: 'RESOLVING_LOADER', message: 'Resolving Fabric loader…' });
    const fabric = await installFabricProfile(gameRoot, instance.minecraftVersion, instance.loaderVersion);
    versionCustom = fabric.id;
    if (instance.minecraftVersion === '1.21.11') {
      const core = await prepareCore(instanceId);
      if (!core.installed) emit({ instanceId, state: 'PREPARING_MODS', message: core.reason, warning: true });
    }
  }

  emit({ instanceId, state: 'STARTING_JVM', message: 'Starting Minecraft…' });
  const Client = await clientClass();
  const client = new Client();
  const settings = store.get('settings');
  const maxMb = Number(instance.ramMb || settings.ramMb || 6144);
  const customLaunchArgs = [];
  if (server?.host) customLaunchArgs.push('--quickPlayMultiplayer', `${server.host}:${server.port || 25565}`);

  const options = {
    authorization: launcherAuthorization(account),
    root: gameRoot,
    javaPath: java.path,
    version: { number: instance.minecraftVersion, type: 'release', ...(versionCustom ? { custom: versionCustom } : {}) },
    memory: { min: `${Math.max(1024, Math.floor(maxMb / 2))}M`, max: `${maxMb}M` },
    window: { width: settings.resolution?.width || 1280, height: settings.resolution?.height || 720 },
    customLaunchArgs
  };

  client.on('progress', progress => emit({ instanceId, state: 'DOWNLOADING', message: progress.type || 'Downloading Minecraft files…', progress }));
  client.on('download-status', progress => emit({ instanceId, state: 'DOWNLOADING', message: 'Downloading…', progress }));
  client.on('debug', message => emit({ instanceId, state: 'DEBUG', message: String(message) }));
  client.on('data', message => emit({ instanceId, state: 'LOG', message: String(message) }));

  const child = await client.launch(options);
  if (!child?.pid) throw new Error('Minecraft process did not start.');
  if (!processes.has(instanceId)) processes.set(instanceId, new Set());
  processes.get(instanceId).add(child);

  const started = Date.now();
  emit({ instanceId, state: 'RUNNING', message: `Minecraft running (PID ${child.pid})`, pid: child.pid, remaining: processes.get(instanceId).size });
  await patchInstance(instanceId, { lastPlayedAt: new Date().toISOString() });

  child.once('close', async code => {
    const set = processes.get(instanceId);
    set?.delete(child);
    const remaining = set?.size || 0;
    if (set && remaining === 0) processes.delete(instanceId);
    const latest = await getInstance(instanceId).catch(() => null);
    if (latest) await patchInstance(instanceId, { playtimeSeconds: (latest.playtimeSeconds || 0) + Math.round((Date.now() - started) / 1000) });
    emit({ instanceId, state: 'STOPPED', message: `Minecraft exited (${code ?? 'unknown'}).`, code, pid: child.pid, remaining });
  });

  return { pid: child.pid };
}

export function stopInstance(id) {
  const set = processes.get(id);
  if (!set?.size) return false;
  for (const process of set) {
    try { process.kill(); } catch {}
  }
  return true;
}
