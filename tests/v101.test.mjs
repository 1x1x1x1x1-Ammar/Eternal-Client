import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('CoreConfig initializes module catalog before singleton instance', () => {
  const config = read('eternal-core/src/main/java/gg/eternal/core/config/CoreConfig.java');
  const modules = config.indexOf('public static final String[] MODULES');
  const instance = config.indexOf('public static final CoreConfig INSTANCE');
  assert.ok(modules >= 0 && instance > modules, 'MODULES must initialize before INSTANCE to avoid Core startup NPE');
  assert.match(config, /enabled\.put\(name, false\)/);
  assert.match(config, /getOrDefault\(name, false\)/);
});

test('Eternal replaces vanilla title screen with real clickable client menu', () => {
  const mixin = read('eternal-core/src/main/java/gg/eternal/core/mixin/MinecraftScreenMixin.java');
  const title = read('eternal-core/src/main/java/gg/eternal/core/ui/EternalTitleScreen.java');
  assert.match(mixin, /screen instanceof TitleScreen/);
  assert.match(mixin, /new EternalTitleScreen\(\)/);
  for (const token of ['SelectWorldScreen', 'JoinMultiplayerScreen', 'openClickGui', 'openHudEditor', 'OptionsScreen', 'mc.stop']) assert.match(title, new RegExp(token.replace('.', '\\.')));
});

test('skin pipeline uses validated PNGs and official Minecraft Services endpoint', () => {
  const skin = read('electron/services/skinService.js');
  const accounts = read('electron/services/accountService.js');
  assert.match(skin, /PNG_SIGNATURE/);
  assert.match(skin, /width !== 64/);
  assert.match(skin, /\[32, 64\]/);
  assert.match(accounts, /api\.minecraftservices\.com\/minecraft\/profile\/skins/);
  assert.match(accounts, /FormData/);
  assert.match(accounts, /new Blob/);
  assert.match(accounts, /method:'DELETE'/);
  assert.match(accounts, /saveLocalSkin/);
});

test('skin IPC is wired through main and isolated preload', () => {
  const main = read('electron/main.js');
  const preload = read('electron/preload.cjs');
  for (const channel of ['dialog:skin', 'accounts:refreshProfile', 'accounts:skinPreview', 'accounts:setSkin', 'accounts:resetSkin']) assert.match(main, new RegExp(channel));
  for (const token of ['skin: ()', 'refreshProfile:', 'skinPreview:', 'setSkin:', 'resetSkin:']) assert.match(preload, new RegExp(token.replace(/[()]/g, '\\$&')));
});

test('Accounts page exposes premium real Skin Studio and honest offline scope', () => {
  const page = read('src/pages/Accounts.jsx');
  const css = read('src/v101.css');
  assert.match(page, /Accounts \+ Skin Studio/);
  assert.match(page, /api\.accounts\.setSkin/);
  assert.match(page, /api\.accounts\.resetSkin/);
  assert.match(page, /api\.accounts\.refreshProfile/);
  assert.match(page, /Offline skins are deliberately local to Eternal/);
  assert.match(page, /MinecraftSkinPreview/);
  assert.match(css, /v101-skin-stage/);
  assert.match(css, /v101-account-hero/);
  assert.match(css, /prefers-reduced-motion/);
});

test('v1.0.1 source versions stay synchronized', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.version, '1.0.1');
  assert.match(read('eternal-core/gradle.properties'), /mod_version=1\.0\.1/);
  assert.match(read('eternal-core/src/main/java/gg/eternal/core/EternalCore.java'), /VERSION = "1\.0\.1"/);
});
