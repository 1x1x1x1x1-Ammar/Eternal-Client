import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Core key handling ignores GLFW repeats and opens screens on the Minecraft task queue', () => {
  const keyboard = read('eternal-core/src/main/java/gg/eternal/core/mixin/KeyboardMixin.java');
  const core = read('eternal-core/src/main/java/gg/eternal/core/EternalCore.java');
  assert.match(keyboard, /if \(action == 2\) return/);
  assert.match(keyboard, /action == 1/);
  assert.match(core, /screenOpenQueued/);
  assert.match(core, /mc\.execute/);
  assert.match(core, /queueScreen/);
  assert.match(core, /CoreLog\.error/);
});

test('clean Core config does not auto-enable HUD or Zoom modules', () => {
  const config = read('eternal-core/src/main/java/gg/eternal/core/config/CoreConfig.java');
  assert.match(config, /enabled\.put\(name, false\)/);
  assert.match(config, /getOrDefault\(name, false\)/);
  assert.doesNotMatch(config, /for \(String name : MODULES\) enabled\.put\(name, true\)/);
});

test('Eternal replaces the vanilla title screen with its own real navigation surface', () => {
  const mixins = read('eternal-core/src/main/resources/eternal-core.mixins.json');
  const mixin = read('eternal-core/src/main/java/gg/eternal/core/mixin/MinecraftScreenMixin.java');
  const title = read('eternal-core/src/main/java/gg/eternal/core/ui/EternalTitleScreen.java');
  assert.match(mixins, /MinecraftScreenMixin/);
  assert.match(mixin, /instanceof TitleScreen/);
  assert.match(mixin, /new EternalTitleScreen/);
  for (const label of ['SINGLEPLAYER', 'MULTIPLAYER', 'MODULES', 'HUD EDITOR', 'OPTIONS', 'QUIT GAME']) assert.match(title, new RegExp(label));
  assert.match(title, /SelectWorldScreen/);
  assert.match(title, /JoinMultiplayerScreen/);
  assert.match(title, /OptionsScreen/);
  assert.match(title, /EternalCore\.openClickGui/);
  assert.match(title, /EternalCore\.openHudEditor/);
});

test('Core emits a durable runtime diagnostic log that launcher Minecraft console can capture', () => {
  const log = read('eternal-core/src/main/java/gg/eternal/core/util/CoreLog.java');
  const launcher = read('electron/services/launcherService.js');
  const consoleUi = read('src/components/OperationConsole.jsx');
  assert.match(log, /eternal-core\.log/);
  assert.match(log, /System\.err\.println/);
  assert.match(log, /System\.out\.println/);
  assert.match(launcher, /classifyGameMessage/);
  assert.match(launcher, /level: 'error'/);
  assert.match(consoleUi, /event\?\.level === 'error'/);
  assert.match(consoleUi, /minecraft/);
});

test('Downloads page renders real backend bytes speed updater and indeterminate states', () => {
  const app = read('src/App.jsx');
  const downloads = read('src/pages/Downloads.jsx');
  const main = read('src/main.jsx');
  assert.match(app, /api\.on\.update/);
  assert.match(app, /bytesPerSecond/);
  assert.match(downloads, /formatBytes/);
  assert.match(downloads, /Measured bytes transferred/);
  assert.match(downloads, /indeterminate/);
  assert.match(downloads, /Nothing|No matching transfer events/);
  assert.match(main, /v1-transfers\.css/);
  assert.doesNotMatch(downloads, /Math\.random/);
});

test('Premium keystrokes uses live WASD mouse state and real CPS', () => {
  const hud = read('eternal-core/src/main/java/gg/eternal/core/hud/HudRenderer.java');
  const input = read('eternal-core/src/main/java/gg/eternal/core/state/InputState.java');
  assert.match(hud, /LMB/);
  assert.match(hud, /RMB/);
  assert.match(hud, /InputState\.mouseDown\(0\)/);
  assert.match(hud, /InputState\.leftCps\(\)/);
  assert.match(input, /MOUSE/);
  assert.match(input, /mouseDown/);
});
