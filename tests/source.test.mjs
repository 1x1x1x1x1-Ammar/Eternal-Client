import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const launcherFiles = [
  'electron/main.js',
  'electron/services/accountService.js',
  'electron/services/coreService.js',
  'electron/services/javaService.js',
  'electron/services/launcherService.js',
  'electron/services/modService.js',
  'electron/services/serverService.js',
  'electron/services/versionService.js'
];

test('package and Core versions are Beta 8', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.version, '0.8.0-beta.8');
  assert.match(read('eternal-core/gradle.properties'), /mod_version=0\.8\.0-beta\.8/);
  assert.match(read('eternal-core/src/main/java/gg/eternal/core/EternalCore.java'), /VERSION = "0\.8\.0-beta\.8"/);
});

test('tar CommonJS/ESM regression remains fixed', () => {
  const java = read('electron/services/javaService.js');
  assert.match(java, /import \* as tar from 'tar'/);
  assert.doesNotMatch(java, /import tar from 'tar'/);
});

test('electron-updater CommonJS import regression remains fixed', () => {
  const main = read('electron/main.js');
  assert.doesNotMatch(main, /import\s*\{\s*autoUpdater\s*\}\s*from\s*['"]electron-updater['"]/);
  assert.match(main, /import updaterPackage from 'electron-updater'/);
  assert.match(main, /const \{ autoUpdater \} = updaterPackage/);
});

test('packaged smoke-test is a release gate', () => {
  const main = read('electron/main.js');
  const ci = read('.github/workflows/ci.yml');
  assert.match(main, /--smoke-test/);
  assert.match(main, /did-finish-load/);
  assert.match(main, /app\.exit\(91\)/);
  assert.match(ci, /Smoke test packaged Electron main process/);
  assert.match(ci, /Eternal Client\.exe/);
});

test('Electron renderer remains isolated and Eternal-branded', () => {
  const main = read('electron/main.js');
  const builder = read('electron-builder.yml');
  assert.match(main, /contextIsolation\s*:\s*true/);
  assert.match(main, /nodeIntegration\s*:\s*false/);
  assert.match(main, /sandbox\s*:\s*true/);
  assert.match(main, /app\.setAppUserModelId\(['"]gg\.eternal\.client['"]\)/);
  assert.match(main, /assets\/icon\.png/);
  assert.match(builder, /icon:\s*build\/icon\.svg/);
  assert.match(builder, /executableName:\s*Eternal Client/);
});

test('renderer bundles Eternal images instead of fragile absolute file URLs', () => {
  for (const file of ['src/App.jsx', 'src/pages/Home.jsx', 'src/pages/Core.jsx', 'src/pages/Mods.jsx', 'src/components/Sidebar.jsx', 'src/components/TitleBar.jsx']) {
    const content = read(file);
    if (file !== 'src/App.jsx' && file !== 'src/pages/Mods.jsx') assert.match(content, /import eternalLogo from/);
    assert.doesNotMatch(content, /src=["']\/assets\/logo\.svg["']/);
  }
});

test('Beta 8 premium UI layer is loaded last', () => {
  const main = read('src/main.jsx');
  assert.match(main, /import '\.\/beta8\.css'/);
  const beta8 = read('src/beta8.css');
  assert.ok(beta8.length > 12000, 'Beta 8 UI layer should be a substantial implementation, not a token placeholder');
  assert.match(beta8, /beta8-core-page/);
  assert.match(beta8, /beta8-activity-dock/);
  assert.match(beta8, /beta8-settings-grid/);
});

test('launcher pages are real routes and command actions', () => {
  const app = read('src/App.jsx');
  const command = read('src/components/CommandCenter.jsx');
  for (const route of ['/library', '/mods', '/servers', '/core', '/accounts', '/downloads', '/developer', '/settings']) {
    assert.match(app, new RegExp(route.replace('/', '\\/')));
    assert.match(command, new RegExp(route.replace('/', '\\/')));
  }
  assert.match(command, /api\.instances\.launch/);
  assert.match(command, /refreshInstances|run: refresh/);
});

test('launcher bootstrap exposes real failure instead of hanging splash forever', () => {
  assert.match(read('src/store/useEternalStore.js'), /bootstrapError/);
  assert.match(read('src/App.jsx'), /Eternal could not load its launcher state/);
  assert.match(read('src/App.jsx'), /Retry/);
});

test('launch logs cannot overwrite real lifecycle state', () => {
  const store = read('src/store/useEternalStore.js');
  assert.match(store, /event\.state === 'LOG' \|\| event\.state === 'DEBUG'/);
  assert.match(store, /launchLogs/);
  assert.match(store, /launchEvents:/);
});

test('Minecraft versions come from Mojang official manifest and creation validates them', () => {
  const service = read('electron/services/versionService.js');
  const main = read('electron/main.js');
  assert.match(service, /piston-meta\.mojang\.com\/mc\/game\/version_manifest_v2\.json/);
  assert.match(service, /assertMinecraftVersion/);
  assert.match(main, /instances:versions/);
  assert.match(main, /versions\.assertMinecraftVersion/);
  assert.match(read('src/pages/Library.jsx'), /api\.instances\.versions/);
});

test('launcher only advertises loaders it really implements', () => {
  const library = read('src/pages/Library.jsx');
  const instanceService = read('electron/services/instanceService.js');
  assert.match(library, /value="vanilla"/);
  assert.match(library, /value="fabric"/);
  assert.doesNotMatch(library, /value="forge"|value="neoforge"|value="quilt"/);
  assert.match(instanceService, /\['vanilla','fabric'\]/);
});

test('Java is validated before launch and version requirement is enforced', () => {
  const java = read('electron/services/javaService.js');
  const launcher = read('electron/services/launcherService.js');
  assert.match(java, /export async function validateJava/);
  assert.match(launcher, /await validateJava\(configured\)/);
  assert.match(launcher, /runtime\.major < required/);
  assert.match(read('src/pages/Settings.jsx'), /api\.java\.validate/);
});

test('Microsoft/offline account flows are real', () => {
  const account = read('electron/services/accountService.js');
  assert.match(account, /OfflinePlayer:/);
  assert.match(account, /user\.auth\.xboxlive\.com/);
  assert.match(account, /xsts\.auth\.xboxlive\.com/);
  assert.match(account, /api\.minecraftservices\.com\/entitlements\/mcstore/);
  assert.match(account, /meta:\{type:'msa'/);
  assert.match(read('src/pages/Accounts.jsx'), /api\.accounts\.loginMicrosoft/);
});

test('Modrinth install resolves required dependencies and verifies hashes', () => {
  const mod = read('electron/services/modService.js');
  assert.match(mod, /dependency_type !== 'required'/);
  assert.match(mod, /sha512/);
  assert.match(mod, /sha1/);
  assert.match(mod, /verifyBuffer/);
  assert.match(mod, /\.part/);
  assert.match(mod, /progress: \{ current, total, type: 'mod' \}/);
});

test('managed Eternal Core cannot be deleted or disabled in Mod Hub', () => {
  const mod = read('electron/services/modService.js');
  const page = read('src/pages/Mods.jsx');
  assert.match(mod, /Eternal Core is managed by the launcher and cannot be removed/);
  assert.match(mod, /cannot be disabled from Mod Hub/);
  assert.match(page, /beta8-managed-chip/);
  assert.match(page, /mod\.managed/);
});

test('Vanilla profiles do not pretend mod JAR installation works', () => {
  const mod = read('electron/services/modService.js');
  const page = read('src/pages/Mods.jsx');
  assert.match(mod, /Local mod JARs require a mod-loader profile/);
  assert.match(mod, /Modrinth mod installation requires a mod-loader profile/);
  assert.match(page, /current\.loader === 'vanilla'/);
});

test('server ping uses real handshake plus Minecraft SRV resolution', () => {
  const server = read('electron/services/serverService.js');
  assert.match(server, /createConnection/);
  assert.match(server, /resolveSrv/);
  assert.match(server, /_minecraft\._tcp/);
  assert.match(server, /varInt\(-1\)/);
  assert.doesNotMatch(read('src/pages/Servers.jsx'), /Math\.random/);
});

test('server launch works for modern Quick Play and older --server args', () => {
  const launcher = read('electron/services/launcherService.js');
  assert.match(launcher, /--quickPlayMultiplayer/);
  assert.match(launcher, /--server/);
  assert.match(launcher, /--port/);
});

test('Core launcher mode requires a compatible profile and verifies SHA-256', () => {
  const launcher = read('electron/services/launcherService.js');
  const core = read('electron/services/coreService.js');
  const page = read('src/pages/Core.jsx');
  assert.match(launcher, /requireCore = false/);
  assert.match(launcher, /Launch with Core currently requires a Fabric 1\.21\.11 profile/);
  assert.match(page, /requireCore: true/);
  assert.match(core, /createHash\('sha256'\)/);
  assert.match(core, /exactMatch/);
  assert.match(core, /verification failed after copying/);
});

test('standalone Core export is verified and backed by real IPC', () => {
  const core = read('electron/services/coreService.js');
  assert.match(core, /export async function exportStandalone/);
  assert.match(core, /Standalone Core export verification failed/);
  assert.match(read('electron/main.js'), /core:exportStandalone/);
  assert.match(read('electron/preload.cjs'), /exportStandalone/);
  assert.match(read('src/pages/Core.jsx'), /api\.core\.exportStandalone/);
});

test('Core metadata contains embedded Eternal icon', () => {
  const metadata = read('eternal-core/src/main/resources/fabric.mod.json');
  const build = read('eternal-core/build.gradle');
  assert.match(metadata, /assets\/eternal-core\/icon\.png/);
  assert.match(build, /assets\/icon\.png/);
});

test('Core has persistent modules, style, layouts and real configurable keybinds', () => {
  const config = read('eternal-core/src/main/java/gg/eternal/core/config/CoreConfig.java');
  const gui = read('eternal-core/src/main/java/gg/eternal/core/ui/ClickGuiScreen.java');
  const core = read('eternal-core/src/main/java/gg/eternal/core/EternalCore.java');
  for (const token of ['zoomFov', 'hudAlpha', 'accentColor', 'applyPreset', 'openKey', 'hudEditorKey', 'zoomKey', 'setAllModules']) assert.match(config, new RegExp(token));
  assert.match(gui, /ENABLE ALL/);
  assert.match(gui, /DISABLE ALL/);
  assert.match(gui, /PRESS A KEY/);
  assert.match(gui, /keyInUseByOther/);
  assert.match(core, /config\.openKey\(\)/);
  assert.match(core, /config\.hudEditorKey\(\)/);
  assert.match(core, /config\.zoomKey\(\)/);
});

test('HUD editor drag/nudge/presets/disable are actual code paths', () => {
  const editor = read('eternal-core/src/main/java/gg/eternal/core/ui/HudEditorScreen.java');
  assert.match(editor, /mouseDragged/);
  assert.match(editor, /event\.key\(\) == 261/);
  assert.match(editor, /CoreConfig\.INSTANCE\.toggle\(module\)/);
  assert.match(editor, /apply\("DEFAULT"\)/);
  assert.match(editor, /apply\("COMPACT"\)/);
  assert.match(editor, /apply\("CORNERS"\)/);
});

test('Core HUD values come from live Minecraft/JVM state', () => {
  const hud = read('eternal-core/src/main/java/gg/eternal/core/hud/HudRenderer.java');
  assert.match(hud, /mc\.getFps\(\)/);
  assert.match(hud, /InputState\.leftCps\(\)/);
  assert.match(hud, /mc\.player\.getX\(\)/);
  assert.match(hud, /getLatency\(\)/);
  assert.match(hud, /Runtime\.getRuntime\(\)/);
  assert.match(hud, /EternalCore\.sessionMillis\(\)/);
});

test('window/external utility buttons use backend call results', () => {
  assert.match(read('src/pages/Developer.jsx'), /call\(api\.app\.openDataFolder\(\)\)/);
  assert.match(read('src/pages/Developer.jsx'), /call\(api\.app\.openExternal/);
  assert.match(read('src/pages/Settings.jsx'), /call\(api\.app\.openDataFolder\(\)\)/);
  assert.match(read('src/pages/Accounts.jsx'), /call\(api\.app\.openExternal/);
  assert.match(read('src/pages/Servers.jsx'), /call\(api\.app\.openExternal/);
});

test('there are no random fake runtime values in launcher/backend sources', () => {
  for (const file of launcherFiles) assert.doesNotMatch(read(file), /Math\.random\(/, file);
  for (const file of ['src/pages/Home.jsx', 'src/pages/Servers.jsx', 'src/pages/Downloads.jsx', 'src/pages/Core.jsx']) assert.doesNotMatch(read(file), /Math\.random\(/, file);
});
