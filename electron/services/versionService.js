const MANIFEST = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
let cache = null;
let cacheUntil = 0;

async function fetchJson(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'EternalClient/0.8.0-beta.8' }
    });
    if (!response.ok) throw new Error(`Minecraft metadata request failed (${response.status}).`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function listMinecraftVersions({ includeSnapshots = false, limit = 120 } = {}) {
  const now = Date.now();
  if (!cache || now >= cacheUntil) {
    cache = await fetchJson(MANIFEST);
    cacheUntil = now + 5 * 60 * 1000;
  }
  const versions = (cache.versions || [])
    .filter(v => includeSnapshots || v.type === 'release')
    .slice(0, Math.max(1, Math.min(Number(limit) || 120, 300)))
    .map(v => ({ id: v.id, type: v.type, releaseTime: v.releaseTime, time: v.time }));
  return {
    latest: cache.latest || {},
    versions
  };
}

export async function assertMinecraftVersion(version) {
  const manifest = await listMinecraftVersions({ includeSnapshots: true, limit: 300 });
  const found = manifest.versions.find(v => v.id === String(version));
  if (!found) throw new Error(`Minecraft version ${version} is not present in Mojang's official version manifest.`);
  return found;
}
