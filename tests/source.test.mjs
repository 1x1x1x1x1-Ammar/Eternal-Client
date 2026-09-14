import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'));
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

test('tar namespace import regression', () => assert.match(read('electron/services/javaService.js'), /import \* as tar from 'tar'/));
test('electron-updater CommonJS import regression', () => {
  const main = read('electron/main.js');
  assert.doesNotMatch(main, /import\s*\{\s*autoUpdater\s*\}\s*from\s*['\"]electron-updater['\"]/);
  assert.match(main, /import updaterPackage from 'electron-updater'/);
  assert.match(main, /const \{ autoUpdater \} = updaterPackage/);
});
test('packaged smoke-test mode exists', () => {
  const main = read('electron/main.js');
  assert.match(main, /--smoke-test/);
  assert.match(main, /did-finish-load/);
  assert.match(main, /app\.exit\(91\)/);
});
test('Core staging derives version dynamically', () => {
  const stage = read('scripts/stage-core.mjs');
  assert.match(stage, /gradle\.properties/);
  assert.match(stage, /mod_version/);
  assert.match(stage, /packageJson\.version !== expectedVersion/);
  assert.doesNotMatch(stage, /metadata\.version\s*!==\s*['\"]0\.5\.0-beta\.5['\"]/);
});
test('renderer has command center', () => { assert.match(read('src/App.jsx'), /CommandCenter/); assert.match(read('src/components/CommandCenter.jsx'), /Launch/); });
test('release routes are real pages', () => {
  const app = read('src/App.jsx');
  for (const route of ['/accounts', '/downloads', '/developer']) assert.match(app, new RegExp(route.replace('/', '\\/')));
  for (const file of ['src/pages/Accounts.jsx', 'src/pages/Downloads.jsx', 'src/pages/Developer.jsx']) assert.ok(fs.statSync(path.join(root, file)).size > 500);
});
test('reference launcher UI remains wired', () => {
  const home = read('src/pages/Home.jsx');
  const main = read('src/main.jsx');
  assert.match(home, /beta6-console-grid/);
  assert.match(home, /COMMAND CENTER/);
  assert.match(home, /HUD EDITOR/);
  assert.match(home, /ACCOUNTS/);
  assert.match(home, /INSTANCES/);
  assert.match(main, /beta6\.css/);
  assert.match(main, /beta7-core\.css/);
});
test('home action panels call real routes or launcher APIs', () => {
  const home = read('src/pages/Home.jsx');
  assert.match(home, /api\.instances\.launch/);
  assert.match(home, /navigate\('\/mods'\)/);
  assert.match(home, /navigate\('\/servers'\)/);
  assert.match(home, /navigate\('\/accounts'\)/);
});
test('no fake random server count', () => assert.doesNotMatch(read('src/pages/Servers.jsx'), /Math\.random/));
test('offline UUID uses Minecraft OfflinePlayer namespace', () => assert.match(read('electron/services/accountService.js'), /OfflinePlayer:/));
test('Electron renderer is isolated', () => {
  const main = read('electron/main.js');
  assert.match(main, /contextIsolation\s*:\s*true/);
  assert.match(main, /nodeIntegration\s*:\s*false/);
  assert.match(main, /sandbox\s*:\s*true/);
});
test('Windows identity uses Eternal app id and logo', () => {
  const main = read('electron/main.js');
  const builder = read('electron-builder.yml');
  assert.match(main, /app\.setAppUserModelId\(['\"]gg\.eternal\.client['\"]\)/);
  assert.match(main, /assets\/icon\.png/);
  assert.match(builder, /icon:\s*build\/icon\.svg/);
  assert.match(builder, /executableName:\s*Eternal Client/);
  assert.match(read('scripts/prepare-brand.mjs'), /build\/icon\.svg|targetSvg/);
});
test('renderer bundles Eternal logo instead of file-root absolute assets', () => {
  for (const file of ['src/pages/Home.jsx', 'src/pages/Core.jsx', 'src/components/Sidebar.jsx']) {
    const content = read(file);
    assert.match(content, /import eternalLogo from/);
    assert.doesNotMatch(content, /src=["']\/assets\/logo\.svg["']/);
  }
});
test('developer diagnostics are backed by IPC', () => {
  assert.match(read('electron/main.js'), /app:diagnostics/);
  assert.match(read('electron/preload.cjs'), /diagnostics:/);
  assert.match(read('src/pages/Developer.jsx'), /api\.app\.diagnostics/);
});
test('MCLC auth object supports MSA', () => assert.match(read('electron/services/accountService.js'), /meta:\{type:'msa'/));
test('Fabric profile comes from official metadata endpoint', () => assert.match(read('electron/services/fabricService.js'), /meta\.fabricmc\.net\/v2/));
test('mod search filters actual MC version and loader', () => { const mod = read('electron/services/modService.js'); assert.match(mod, /versions:/); assert.match(mod, /categories:/); });
test('server ping implements Minecraft handshake', () => { const server = read('electron/services/serverService.js'); assert.match(server, /varInt\(767\)/); assert.match(server, /createConnection/); });
test('multi-process stop events carry pid and remaining count', () => {
  const launcher = read('electron/services/launcherService.js');
  assert.match(launcher, /state: 'STOPPED'/);
  assert.match(launcher, /pid: child\.pid, remaining/);
});
test('release branding assets are present', () => {
  assert.ok(fs.statSync(path.join(root, 'assets/logo.svg')).size > 1000);
  assert.ok(fs.statSync(path.join(root, 'assets/icon.png')).size > 1000);
  assert.ok(fs.statSync(path.join(root, 'assets/release-banner.svg')).size > 2000);
  assert.match(read('src/main.jsx'), /release\.css/);
});
test('standalone Core export is a real IPC path', () => {
  assert.match(read('electron/services/coreService.js'), /export async function exportStandalone/);
  assert.match(read('electron/main.js'), /core:exportStandalone/);
  assert.match(read('electron/preload.cjs'), /exportStandalone/);
  assert.match(read('src/pages/Core.jsx'), /api\.core\.exportStandalone/);
});
test('standalone Core metadata contains its embedded icon', () => {
  const metadata = read('eternal-core/src/main/resources/fabric.mod.json');
  const build = read('eternal-core/build.gradle');
  assert.match(metadata, /assets\/eternal-core\/icon\.png/);
  assert.match(build, /assets\/icon\.png/);
});
test('beta 7 Core has real persistent customization controls', () => {
  const config = read('eternal-core/src/main/java/gg/eternal/core/config/CoreConfig.java');
  const gui = read('eternal-core/src/main/java/gg/eternal/core/ui/ClickGuiScreen.java');
  assert.match(config, /zoomFov/);
  assert.match(config, /hudAlpha/);
  assert.match(config, /accentColor/);
  assert.match(config, /applyPreset/);
  assert.match(gui, /HUD MODULES/);
  assert.match(gui, /UTILITY/);
  assert.match(gui, /STYLE/);
  assert.match(gui, /STANDALONE FABRIC MOD/);
});
test('package and Core versions are beta 7', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.version, '0.7.0-beta.7');
  assert.match(read('eternal-core/gradle.properties'), /mod_version=0\.7\.0-beta\.7/);
  assert.match(read('eternal-core/src/main/java/gg/eternal/core/EternalCore.java'), /VERSION = "0\.7\.0-beta\.7"/);
});
