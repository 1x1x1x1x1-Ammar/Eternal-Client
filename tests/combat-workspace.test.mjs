import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { createSerialQueue } from '../shared/serialQueue.js';

const read = file => fs.readFileSync(file, 'utf8');
const java = 'eternal-core/src/main/java/gg/eternal/core/';
const presets = JSON.parse(read('shared/combat-presets.json'));

test('all five combat presets use modules available across launcher and standalone', () => {
  assert.deepEqual(presets.map(p => p.id), ['sword', 'mace', 'spear', 'crystal', 'cart']);
  const config = read(`${java}config/CoreConfig.java`);
  const service = read('electron/services/coreService.js');
  const studio = read('src/pages/Studio.jsx');
  for (const preset of presets) {
    for (const name of preset.modules) {
      assert.ok(config.includes(`"${name}"`), `Core missing ${name}`);
      assert.ok(service.includes(`'${name}'`), `launcher missing ${name}`);
      assert.ok(studio.includes(`'${name}'`), `Studio missing ${name}`);
    }
    assert.ok(preset.crosshair.gap >= 0 && preset.crosshair.gap <= 12);
    assert.ok(preset.crosshair.length >= 2 && preset.crosshair.length <= 14);
  }
  assert.match(config, /root.addProperty\("combatPreset", combatPreset\)/);
  assert.match(read('eternal-core/build.gradle'), /shared\/combat-presets.json/);
  assert.match(read('electron-builder.yml'), /shared\/\*\*\/\*/);
});

test('config queue preserves rapid edits in order and recovers after a failed write', async () => {
  const enqueue = createSerialQueue();
  let disk = { enabled: {} };
  const patch = (key, value) => enqueue('profile', async () => {
    const current = structuredClone(disk);
    await new Promise(resolve => setTimeout(resolve, 2));
    current.enabled[key] = value;
    disk = current;
  });
  await Promise.all([patch('FPS', true), patch('Offhand', true), patch('FPS', false)]);
  assert.deepEqual(disk, { enabled: { FPS: false, Offhand: true } });
  await assert.rejects(enqueue('profile', () => { throw new Error('Disk full'); }), /Disk full/);
  await patch('AttackCooldown', true);
  assert.equal(disk.enabled.AttackCooldown, true);
});

test('different profile queues can progress independently', async () => {
  const enqueue = createSerialQueue();
  let release;
  const blocked = enqueue('one', () => new Promise(resolve => { release = resolve; }));
  assert.equal(await enqueue('two', () => 42), 42);
  release();
  await blocked;
});

test('menu transforms fit GUI scales and invert pointer coordinates', context => {
  try { execFileSync('javac', ['-version']); }
  catch (error) {
    if (error.code === 'ENOENT') { context.skip('JDK required for Java geometry test'); return; }
    throw error;
  }
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'eternal-viewport-'));
  try {
    execFileSync('javac', ['-d', directory, `${java}ui/MenuViewport.java`, 'tests/java/MenuViewportTest.java']);
    execFileSync('java', ['-cp', directory, 'MenuViewportTest']);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('combat telemetry is cached per tick and HUD drags commit on release', () => {
  const hud = read(`${java}hud/HudRenderer.java`);
  const combat = read(`${java}hud/CombatHud.java`);
  const editor = read(`${java}ui/HudEditorScreen.java`);
  assert.match(hud, /VALUES.computeIfAbsent/);
  assert.match(hud, /VALUES.clear/);
  assert.match(combat, /getAttackStrengthScale/);
  assert.match(combat, /getItemBySlot/);
  assert.match(combat, /getInventory/);
  assert.doesNotMatch(combat, /sendPacket|\.attack\(|setSelectedSlot/);
  assert.match(editor, /previewPos/);
  assert.match(editor, /mouseReleased[\s\S]*savePositions/);
  for (const screen of ['ClickGuiScreen', 'EternalHomeScreen', 'EternalTitleScreen']) {
    const source = read(`${java}ui/${screen}.java`);
    assert.match(source, /viewport\(\).pointer\(event.x\(\)\)/);
    assert.match(source, /finally[\s\S]*popMatrix/);
  }
});
