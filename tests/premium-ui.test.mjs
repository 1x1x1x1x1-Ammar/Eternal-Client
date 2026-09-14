import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('premium visual layer is substantial and loaded after every Beta 8 layer', () => {
  const main = read('src/main.jsx');
  const premium = read('src/premium.css');
  const polishIndex = main.indexOf("import './beta8-polish.css'");
  const premiumIndex = main.indexOf("import './premium.css'");
  assert.ok(polishIndex >= 0);
  assert.ok(premiumIndex > polishIndex, 'premium.css must be the final visual layer');
  assert.ok(premium.length > 18000, 'premium layer must be a real implementation, not a token skin');
  for (const token of ['premium-hero', 'premium-status-deck', 'premium-mod-hero', 'premium-library-profile', 'beta8-core-hero']) {
    assert.match(premium, new RegExp(token));
  }
});

test('home command deck remains backed by real launcher state', () => {
  const home = read('src/pages/Home.jsx');
  assert.match(home, /premium-status-deck/);
  assert.match(home, /premium-instance-select-wrap/);
  assert.match(home, /api\.instances\.launch/);
  assert.match(home, /runningProcesses/);
  assert.match(home, /launchEvents/);
  assert.doesNotMatch(home, /Math\.random/);
});

test('Mod Hub premium discovery keeps real Modrinth install behavior', () => {
  const mods = read('src/pages/Mods.jsx');
  assert.match(mods, /premium-mod-hero/);
  assert.match(mods, /premium-quick-searches/);
  assert.match(mods, /api\.mods\.search/);
  assert.match(mods, /api\.mods\.install/);
  assert.match(mods, /current\.minecraftVersion/);
  assert.match(mods, /current\.loader/);
});

test('instance cards preserve real actions while using premium states', () => {
  const card = read('src/components/ProfileCard.jsx');
  assert.match(card, /premium-library-profile/);
  assert.match(card, /premium-state-chip/);
  assert.match(card, /api\.instances\.launch/);
  assert.match(card, /api\.instances\.stop/);
  assert.match(card, /api\.instances\.openFolder/);
});

test('in-game ClickGUI premium pass keeps all functional controls', () => {
  const gui = read('eternal-core/src/main/java/gg/eternal/core/ui/ClickGuiScreen.java');
  for (const token of ['PREMIUM CLIENT', 'LIVE CONFIG', 'ENABLE ALL', 'DISABLE ALL', 'PRESS A KEY', 'OPEN HUD EDITOR']) {
    assert.match(gui, new RegExp(token));
  }
  assert.match(gui, /CoreConfig\.INSTANCE\.toggle/);
  assert.match(gui, /CoreConfig\.INSTANCE\.setAccentColor/);
  assert.match(gui, /CoreConfig\.INSTANCE\.applyPreset/);
  assert.match(gui, /new HudEditorScreen\(\)/);
});

test('HUD editor premium surface preserves drag, snap, nudge, preset and disable paths', () => {
  const editor = read('eternal-core/src/main/java/gg/eternal/core/ui/HudEditorScreen.java');
  assert.match(editor, /HUD CANVAS/);
  assert.match(editor, /INSPECTOR/);
  assert.match(editor, /mouseDragged/);
  assert.match(editor, /setSnap/);
  assert.match(editor, /apply\("DEFAULT"\)/);
  assert.match(editor, /apply\("COMPACT"\)/);
  assert.match(editor, /apply\("CORNERS"\)/);
  assert.match(editor, /event\.key\(\) == 261/);
});

test('premium live HUD still renders genuine Minecraft and JVM values', () => {
  const hud = read('eternal-core/src/main/java/gg/eternal/core/hud/HudRenderer.java');
  assert.match(hud, /drawWatermark/);
  assert.match(hud, /drawKeystrokes/);
  assert.match(hud, /mc\.getFps\(\)/);
  assert.match(hud, /InputState\.leftCps\(\)/);
  assert.match(hud, /mc\.player\.getX\(\)/);
  assert.match(hud, /getLatency\(\)/);
  assert.match(hud, /Runtime\.getRuntime\(\)/);
  assert.match(hud, /EternalCore\.sessionMillis\(\)/);
  assert.doesNotMatch(hud, /Math\.random/);
});
