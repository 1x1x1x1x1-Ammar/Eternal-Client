import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { registerHooks } from 'node:module';
import AdmZip from 'adm-zip';
import { normalizeModuleSettings } from '../shared/moduleSettings.js';

test('module settings clamp invalid values and preserve independent defaults', () => {
  const settings = normalizeModuleSettings({ ArmorDurability: { scale: 9999, background: 'false', keybind: -9 }, FPS: { scale: 125 } });
  assert.equal(settings.ArmorDurability.scale, 200);
  assert.equal(settings.ArmorDurability.keybind, 0);
  assert.equal(settings.FPS.scale, 125);
  assert.equal(typeof settings.ArmorDurability.background, 'boolean');
  settings.FPS.scale = 150;
  assert.equal(normalizeModuleSettings().FPS.scale, 100);
});

test('pack routing, validation and module saves work against a real isolated instance', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'eternal-content-'));
  const storeUrl = new URL('../electron/services/store.js', import.meta.url).href;
  const hook = registerHooks({ load(url, context, next) {
    if (url === storeUrl) return { format: 'module', shortCircuit: true, source: `export function dataRoot() { return ${JSON.stringify(root)}; }` };
    return next(url, context);
  } });
  try {
    const game = path.join(root, 'instances/test/.minecraft');
    await fs.mkdir(path.join(game, 'saves/Survival'), { recursive: true });
    await fs.writeFile(path.join(root, 'instances/test/instance.json'), JSON.stringify({ id: 'test', loader: 'fabric', minecraftVersion: '1.21.11' }));
    await fs.writeFile(path.join(game, 'saves/Survival/level.dat'), 'test fixture');
    const content = await import('../electron/services/contentService.js');
    const core = await import('../electron/services/coreService.js');
    const pack = path.join(root, 'pack.zip');
    const zip = new AdmZip();
    zip.addFile('pack.mcmeta', Buffer.from('{"pack":{"pack_format":1,"description":"test"}}'));
    zip.writeZip(pack);
    for (const type of ['resourcepack', 'datapack']) {
      const request = { instanceId: 'test', type, world: 'Survival', files: [pack] };
      await content.addContent(request);
      const relative = type === 'datapack' ? 'saves/Survival/datapacks/pack.zip' : 'resourcepacks/pack.zip';
      assert.deepEqual(await fs.readFile(path.join(game, relative)), await fs.readFile(pack));
      await content.toggleContent({ ...request, filename: 'pack.zip', enabled: false });
      assert.equal((await content.listContent(request))[0].enabled, false);
      await content.removeContent({ ...request, filename: 'pack.zip.disabled' });
      assert.deepEqual(await content.listContent(request), []);
    }
    await assert.rejects(content.addContent({ instanceId: 'test', type: 'datapack', world: '../escape', files: [pack] }), /existing singleplayer world/);
    await assert.rejects(content.addContent({ instanceId: 'test', type: 'shader', files: [pack] }), /shaders directory/);
    const shader = new AdmZip(); shader.addFile('shaders/test.fsh', Buffer.from('void main() {}')); shader.writeZip(pack);
    await content.addContent({ instanceId: 'test', type: 'shader', files: [pack] });
    await fs.access(path.join(game, 'shaderpacks/pack.zip'));
    await Promise.all([
      core.patchCoreConfig('test', { moduleSettings: { FPS: { scale: 150 } } }),
      core.patchCoreConfig('test', { moduleSettings: { FPS: { opacity: 65 } } })
    ]);
    let config = await core.readCoreConfig('test');
    assert.equal(config.moduleSettings.FPS.scale, 150);
    assert.equal(config.moduleSettings.FPS.opacity, 65);
    await core.patchCoreConfig('test', { moduleSettings: { FPS: { keybind: 74 } } });
    config = await core.patchCoreConfig('test', { moduleSettings: { Ping: { keybind: 74 } } });
    assert.equal(config.moduleSettings.FPS.keybind, 0);
    assert.equal(config.moduleSettings.Ping.keybind, 74);
    await assert.rejects(core.patchCoreConfig('test', { moduleSettings: { FPS: { keybind: config.openKey } } }), /reserved/);
  } finally {
    hook.deregister();
    await fs.rm(root, { recursive: true, force: true });
  }
});
