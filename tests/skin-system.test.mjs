import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSkin, changeSkin, MAX_SKIN_BYTES } from '../electron/services/skinService.js';

function pngHeader(width = 64, height = 64) {
  const bytes = Buffer.alloc(45);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(bytes);
  bytes.write('IHDR', 12);
  bytes.writeUInt32BE(width, 16); bytes.writeUInt32BE(height, 20);
  return `data:image/png;base64,${bytes.toString('base64')}`;
}
const dataUrl = pngHeader();
const offline = { id: 'offline:one', type: 'offline' };
const microsoft = { id: 'msa:one', type: 'microsoft' };

test('skin validation bounds size, image dimensions and model', () => {
  assert.equal(validateSkin(dataUrl, 'slim').height, 64);
  assert.equal(validateSkin(pngHeader(64, 32), 'classic').height, 32);
  for (const input of [null, '', 'https://example.com/skin.png', 'data:image/png;base64,AAAA', pngHeader(512, 512), `data:image/png;base64,${'A'.repeat(MAX_SKIN_BYTES * 2)}`]) assert.throws(() => validateSkin(input));
  assert.throws(() => validateSkin(dataUrl, 'unknown'), /model/);
  assert.throws(() => validateSkin(pngHeader(64, 32), 'slim'), /classic/);
});

test('offline skins stay local and never authenticate or upload', async () => {
  const forbidden = () => { throw new Error('Offline must not contact Minecraft'); };
  const result = await changeSkin({ account: offline, dataUrl, variant: 'slim', authorize: forbidden, request: forbidden });
  assert.deepEqual(result, { skinUrl: dataUrl, skinVariant: 'slim', skinScope: 'local' });
  assert.equal((await changeSkin({ account: offline, reset: true, authorize: forbidden, request: forbidden })).skinUrl, '');
});

test('Microsoft skin uses renewed credentials and multipart PNG upload', async () => {
  let authorized = false;
  const result = await changeSkin({ account: microsoft, dataUrl, variant: 'slim',
    authorize: async account => { assert.equal(account.id, microsoft.id); authorized = true; return { access_token: 'test-session' }; },
    request: async (url, options) => {
      assert.equal(authorized, true);
      assert.equal(url, 'https://api.minecraftservices.com/minecraft/profile/skins');
      assert.equal(options.method, 'POST');
      assert.equal(options.headers.Authorization, 'Bearer test-session');
      assert.equal(options.body.get('variant'), 'slim');
      assert.equal(options.body.get('file').type, 'image/png');
      assert.equal(options.body.get('file').size, 45);
      return { ok: true, status: 200, json: async () => ({ skins: [{ state: 'ACTIVE', variant: 'SLIM', url: 'https://textures.minecraft.net/texture/test' }] }) };
    }
  });
  assert.equal(result.skinScope, 'minecraft');
  assert.equal(result.skinVariant, 'slim');
  assert.equal(result.skinUrl, 'https://textures.minecraft.net/texture/test');
  assert.equal(JSON.stringify(result).includes('test-session'), false);
});

test('Microsoft reset calls the active skin endpoint and handles empty success', async () => {
  const result = await changeSkin({ account: microsoft, reset: true, authorize: async () => ({ access_token: 'test' }), request: async (url, options) => {
    assert.ok(url.endsWith('/skins/active')); assert.equal(options.method, 'DELETE'); return { ok: true, status: 204 };
  } });
  assert.equal(result.skinUrl, '');
});

test('failed Microsoft uploads never return a successful local change', async () => {
  for (const status of [401, 403, 429, 500]) {
    await assert.rejects(changeSkin({ account: microsoft, dataUrl, authorize: async () => ({ access_token: 'test' }), request: async () => ({ ok: false, status }) }));
  }
  await assert.rejects(changeSkin({ account: microsoft, dataUrl, authorize: async () => ({}) }), /Sign in/);
  await assert.rejects(changeSkin({ account: null, dataUrl }), /valid account/);
});
