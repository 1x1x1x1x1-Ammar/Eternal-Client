const MANIFEST = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
let cache = null;
let cacheUntil = 0;

async function fetchJson(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'EternalClient/1.0.0' }
    });
    if (!response.ok) throw new Error(`Minecraft metadata request failed (${response.status}).`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function manifest() {
  const now = Date.now();
  if (!cache || now >= cacheUntil) {
    cache = await fetchJson(MANIFEST);
    cacheUntil = now + 5 * 60 * 1000;
  }
  return cache;
}

export async function listMinecraftVersions({ includeSnapshots = false, limit = 1000 } = {}) {
  const data = await manifest();
  const max = Math.max(1, Math.min(Number(limit) || 1000, 2000));
  const versions = (data.versions || [])
    .filter(v => includeSnapshots || v.type === 'release')
    .slice(0, max)
    .map(v => ({ id: v.id, type: v.type, releaseTime: v.releaseTime, time: v.time, url: v.url, complianceLevel: v.complianceLevel }));
  return {
    latest: data.latest || {},
    total: (data.versions || []).length,
    versions
  };
}

export async function assertMinecraftVersion(version) {
  const data = await manifest();
  const found = (data.versions || []).find(v => v.id === String(version));
  if (!found) throw new Error(`Minecraft version ${version} is not present in Mojang's official version manifest.`);
  return { id: found.id, type: found.type, releaseTime: found.releaseTime, time: found.time };
}
