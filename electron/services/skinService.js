const PROFILE_URL = 'https://api.minecraftservices.com/minecraft/profile';
export const MAX_SKIN_BYTES = 256 * 1024;

export function validateSkin(dataUrl, variant = 'classic') {
  if (!['classic', 'slim'].includes(variant)) throw new Error('Choose a classic or slim skin model.');
  if (typeof dataUrl !== 'string' || dataUrl.length > MAX_SKIN_BYTES * 1.4 || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(dataUrl)) throw new Error('Choose a PNG skin smaller than 256 KB.');
  const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
  if (bytes.length < 45 || bytes.length > MAX_SKIN_BYTES || !bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) || bytes.toString('ascii', 12, 16) !== 'IHDR') throw new Error('The selected file is not a valid PNG skin.');
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (width !== 64 || ![32, 64].includes(height)) throw new Error('Java skins must be 64 x 64 or 64 x 32 pixels.');
  if (height === 32 && variant === 'slim') throw new Error('Legacy 64 x 32 skins require the classic model.');
  return { bytes, width, height, variant };
}

async function minecraftRequest(request, suffix, options) {
  const response = await request(PROFILE_URL + suffix, { ...options, signal: AbortSignal.timeout(20000) });
  if (!response.ok) {
    if ([401, 403].includes(response.status)) throw new Error('Minecraft rejected the session. Sign in with Microsoft again.');
    if (response.status === 429) throw new Error('Minecraft is rate limiting skin changes. Try again later.');
    throw new Error(`Minecraft skin request failed (${response.status}).`);
  }
  return response.status === 204 ? null : response.json().catch(() => null);
}

// Keep account authentication in the main process; offline skins never reach Minecraft Services.
export async function changeSkin({ account, dataUrl, variant = 'classic', reset = false, authorize, request = fetch }) {
  if (!account || !['offline', 'microsoft'].includes(account.type)) throw new Error('Select a valid account first.');
  const skin = reset ? null : validateSkin(dataUrl, variant);
  if (account.type === 'offline') return { skinUrl: reset ? '' : dataUrl, skinVariant: reset ? 'classic' : variant, skinScope: 'local' };
  const authorization = await authorize(account);
  if (!authorization?.access_token) throw new Error('Sign in with Microsoft again before changing your skin.');
  const headers = { Authorization: `Bearer ${authorization.access_token}` };
  let profile;
  if (reset) profile = await minecraftRequest(request, '/skins/active', { method: 'DELETE', headers });
  else {
    const form = new FormData();
    form.append('variant', variant);
    form.append('file', new Blob([skin.bytes], { type: 'image/png' }), 'skin.png');
    profile = await minecraftRequest(request, '/skins', { method: 'POST', headers, body: form });
  }
  const active = profile?.skins?.find(item => item.state === 'ACTIVE') || profile?.skins?.[0];
  return { skinUrl: active?.url || (reset ? '' : dataUrl), skinVariant: active?.variant?.toLowerCase() || variant, skinScope: 'minecraft' };
}
