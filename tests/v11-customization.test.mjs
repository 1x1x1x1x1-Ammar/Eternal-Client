import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');

test('v1.1 Studio is routed and its CSS loads last', () => {
  const app = read('src/App.jsx');
  const sidebar = read('src/components/Sidebar.jsx');
  const main = read('src/main.jsx');
  const corePage = read('src/pages/Core.jsx');
  assert.match(app, /import Studio from '.\/pages\/Studio\.jsx'/);
  assert.match(app, /path="\/studio" element=\{<Studio \/>\}/);
  assert.match(sidebar, /\['\/studio', Palette, 'Studio'\]/);
  assert.match(corePage, /to="\/studio"/);
  assert.ok(main.lastIndexOf("./v11-studio.css") > main.lastIndexOf("./v101-client.css"));
});

test('Studio controls real Core IPC instead of demo state', () => {
  const studio = read('src/pages/Studio.jsx');
  const preload = read('electron/preload.cjs');
  const main = read('electron/main.js');
  const service = read('electron/services/coreService.js');

  for (const method of ['config', 'patchConfig', 'profiles', 'saveProfile', 'applyProfile', 'deleteProfile', 'screenshots', 'deleteScreenshot', 'openScreenshots']) {
    assert.match(preload, new RegExp(`${method}:`));
  }
  for (const channel of ['core:config', 'core:patchConfig', 'core:profiles', 'core:saveProfile', 'core:applyProfile', 'core:deleteProfile', 'core:screenshots', 'core:deleteScreenshot', 'core:openScreenshots']) {
    assert.ok(main.includes(channel), `missing IPC handler ${channel}`);
  }
  assert.match(studio, /api\.core\.patchConfig/);
  assert.match(studio, /api\.core\.saveProfile/);
  assert.match(studio, /api\.core\.screenshots/);
  assert.match(service, /writeJsonAtomic/);
  assert.doesNotMatch(studio, /fake|mock|demo percentage|placeholder module/i);
});

test('Core preserves safe static ordering and adds live v1.1 settings', () => {
  const config = read('eternal-core/src/main/java/gg/eternal/core/config/CoreConfig.java');
  const core = read('eternal-core/src/main/java/gg/eternal/core/EternalCore.java');
  const renderer = read('eternal-core/src/main/java/gg/eternal/core/hud/HudRenderer.java');
  const guiMixin = read('eternal-core/src/main/java/gg/eternal/core/mixin/GuiMixin.java');
  const mixins = read('eternal-core/src/main/resources/eternal-core.mixins.json');

  assert.ok(config.indexOf('public static final String[] MODULES') < config.indexOf('public static final CoreConfig INSTANCE'));
  for (const name of ['Crosshair', 'Fullbright', 'ToggleSprint', 'ToggleSneak', 'Perspective']) assert.ok(config.includes(`"${name}"`));
  for (const field of ['perspectiveKey', 'textShadow', 'gradientHud', 'smoothZoom', 'zoomSpeed', 'crosshairColor', 'crosshairHitColor']) assert.ok(config.includes(field));
  for (const setter of ['setCrosshairGap', 'setCrosshairLength', 'setCrosshairThickness', 'setCrosshairDot', 'setCrosshairOutline']) assert.ok(config.includes(setter));
  assert.match(config, /reloadIfChanged\(\)/);
  assert.match(core, /CoreConfig\.INSTANCE|config\.reloadIfChanged\(\)/);
  assert.match(core, /toggleSprint\(\)/);
  assert.match(core, /toggleCrouch\(\)/);
  assert.match(core, /gamma\(\)/);
  assert.match(renderer, /renderCrosshair/);
  assert.match(guiMixin, /method = "renderCrosshair"/);
  assert.match(mixins, /MinecraftTickMixin/);
});

test('ClickGUI 2.0 exposes the real v1.1 customization surface', () => {
  const clickGui = read('eternal-core/src/main/java/gg/eternal/core/ui/ClickGuiScreen.java');
  for (const section of ['HUD', 'CLIENT', 'VISUAL', 'STYLE', 'ABOUT']) assert.ok(clickGui.includes(`"${section}"`));
  for (const module of ['Zoom', 'Fullbright', 'ToggleSprint', 'ToggleSneak', 'Perspective', 'Crosshair']) assert.ok(clickGui.includes(`"${module}"`));
  for (const action of ['setPerspectiveKey', 'setCrosshairGap', 'setCrosshairLength', 'setCrosshairThickness', 'setSmoothZoom', 'applyPreset']) assert.ok(clickGui.includes(action));
  assert.match(clickGui, /OPEN HUD EDITOR/);
  assert.match(clickGui, /CUSTOMIZATION STUDIO/);
});

test('v1.1 launcher and Core version metadata stays aligned', () => {
  const pkg = JSON.parse(read('package.json'));
  const gradle = read('eternal-core/gradle.properties');
  const core = read('eternal-core/src/main/java/gg/eternal/core/EternalCore.java');
  assert.equal(pkg.version, '1.1.0');
  assert.match(gradle, /^mod_version=1\.1\.0$/m);
  assert.match(core, /VERSION = "1\.1\.0"/);
});

test('v1.1 Studio presentation is responsive and motion-safe', () => {
  const css = read('src/v11-studio.css');
  for (const selector of ['.v11-studio-hero', '.v11-module-grid', '.v11-crosshair-stage', '.v11-profile-card', '.v11-media-row']) assert.ok(css.includes(selector));
  assert.match(css, /@media \(max-width: 1180px\)/);
  assert.match(css, /@media \(max-width: 920px\)/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
