import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const backendFiles = [
  'electron/main.js',
  'electron/services/accountService.js',
  'electron/services/coreService.js',
  'electron/services/javaService.js',
  'electron/services/launcherService.js',
  'electron/services/modService.js',
  'electron/services/serverService.js',
  'electron/services/versionService.js'
];

test('launcher and Core version metadata stay aligned', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
  const coreVersion = read('eternal-core/gradle.properties').match(/^mod_version=(.+)$/m)?.[1].trim();
  const sourceVersion = read('eternal-core/src/main/java/gg/eternal/core/EternalCore.java').match(/VERSION = "([^"]+)"/)?.[1];
  assert.equal(coreVersion, pkg.version);
  assert.equal(sourceVersion, pkg.version);
  assert.doesNotMatch(pkg.version, /beta|alpha|rc/i);
});

test('known Electron CommonJS/ESM regressions are gated', () => {
  const java = read('electron/services/javaService.js');
  const main = read('electron/main.js');
  assert.match(java, /import \* as tar from 'tar'/);
  assert.doesNotMatch(java, /import tar from 'tar'/);
  assert.match(main, /import updaterPackage from 'electron-updater'/);
  assert.match(main, /const \{ autoUpdater \} = updaterPackage/);
  assert.doesNotMatch(main, /import\s*\{\s*autoUpdater\s*\}/);
});

test('minecraft-launcher-core Client loads through CommonJS and has a runtime constructor gate', () => {
  const launcher = read('electron/services/launcherService.js');
  const runtime = read('scripts/runtime-smoke.mjs');
  const pkg = JSON.parse(read('package.json'));
  assert.match(launcher, /createRequire/);
  assert.match(launcher, /requireCjs\('minecraft-launcher-core'\)/);
  assert.doesNotMatch(launcher, /await import\('minecraft-launcher-core'\)/);
  assert.match(launcher, /typeof ClientClass !== 'function'/);
  assert.match(runtime, /requireCjs\('minecraft-launcher-core'\)/);
  assert.match(runtime, /new Client\(\)/);
  assert.match(runtime, /typeof client\.launch !== 'function'/);
  assert.equal(pkg.scripts['test:runtime'], 'node scripts/runtime-smoke.mjs');
});

test('packaged Electron startup remains a CI release gate', () => {
  const main = read('electron/main.js');
  const ci = read('.github/workflows/ci.yml');
  const stable = read('.github/workflows/release-stable.yml');
  assert.match(main, /--smoke-test/);
  assert.match(main, /did-finish-load/);
  assert.match(main, /app\.exit\(91\)/);
  assert.match(ci, /Smoke test packaged Electron main process/);
  assert.match(stable, /Smoke test packaged Eternal Client\.exe/);
});

test('Electron stays isolated, single-instance and Eternal-branded', () => {
  const main = read('electron/main.js');
  const builder = read('electron-builder.yml');
  assert.match(main, /contextIsolation\s*:\s*true/);
  assert.match(main, /nodeIntegration\s*:\s*false/);
  assert.match(main, /sandbox\s*:\s*true/);
  assert.match(main, /requestSingleInstanceLock/);
  assert.match(main, /second-instance/);
  assert.match(main, /setWindowOpenHandler/);
  assert.match(main, /app\.setAppUserModelId\(['"]gg\.eternal\.client['"]\)/);
  assert.match(main, /assets\/icon\.png/);
  assert.match(builder, /icon:\s*build\/icon\.svg/);
  assert.match(builder, /executableName:\s*Eternal Client/);
});

test('premium launcher layers are split intentionally and loaded in the final order', () => {
  const main = read('src/main.jsx');
  const v1 = read('src/v1.css');
  const motion = read('src/v1-motion.css');
  const systems = read('src/v1-systems.css');
  const transfers = read('src/v1-transfers.css');
  const iV1 = main.indexOf("import './v1.css'");
  const iMotion = main.indexOf("import './v1-motion.css'");
  const iSystems = main.indexOf("import './v1-systems.css'");
  const iTransfers = main.indexOf("import './v1-transfers.css'");
  assert.ok(iV1 >= 0 && iMotion > iV1 && iSystems > iMotion && iTransfers > iSystems);
  assert.ok(v1.length > 12000, 'base stable premium layer must remain substantial');
  assert.match(v1, /premium-hero/);
  assert.match(v1, /premium-library-profile/);
  assert.match(v1, /beta8-core-hero/);
  assert.match(v1, /prefers-reduced-motion/);
  assert.match(motion, /animation|transition/);
  assert.match(systems, /v1-operation-console/);
  assert.match(systems, /v1-instance-commandbar/);
  assert.match(transfers, /v1-download-row/);
});

test('launcher routes and command center point to real functions', () => {
  const app = read('src/App.jsx');
  const command = read('src/components/CommandCenter.jsx');
  for (const route of ['/library', '/mods', '/servers', '/core', '/accounts', '/downloads', '/developer', '/settings']) {
    assert.match(app, new RegExp(route.replace('/', '\\/')));
    assert.match(command, new RegExp(route.replace('/', '\\/')));
  }
  assert.match(command, /api\.instances\.launch/);
  assert.match(command, /refreshInstances|run: refresh/);
});

test('real operation console is wired end-to-end', () => {
  const app = read('src/App.jsx');
  const consoleUi = read('src/components/OperationConsole.jsx');
  const store = read('src/store/useEternalStore.js');
  const main = read('electron/main.js');
  assert.match(app, /<OperationConsole\s*\/>/);
  assert.match(app, /api\.on\.operation/);
  assert.match(consoleUi, /CTRL \+ J/);
  assert.match(consoleUi, /Minecraft/);
  assert.match(consoleUi, /Transfers/);
  assert.match(store, /operationEvents/);
  assert.match(main, /operation:event/);
  assert.match(main, /tracedOperations/);
});

test('bootstrap failure is visible and retryable', () => {
  assert.match(read('src/store/useEternalStore.js'), /bootstrapError/);
  assert.match(read('src/App.jsx'), /Eternal could not load its launcher state/);
  assert.match(read('src/App.jsx'), /Retry/);
});

test('Minecraft lifecycle logs cannot overwrite lifecycle state', () => {
  const store = read('src/store/useEternalStore.js');
  assert.match(store, /event\.state === 'LOG' \|\| event\.state === 'DEBUG'/);
  assert.match(store, /launchLogs/);
  assert.match(store, /launchEvents:/);
});

test('Mojang full version catalog is real and version type persists into launch', () => {
  const versions = read('electron/services/versionService.js');
  const instances = read('electron/services/instanceService.js');
  const launcher = read('electron/services/launcherService.js');
  const library = read('src/pages/Library.jsx');
  assert.match(versions, /piston-meta\.mojang\.com\/mc\/game\/version_manifest_v2\.json/);
  assert.match(versions, /assertMinecraftVersion/);
  assert.match(library, /includeSnapshots: true/);
  assert.match(library, /old_beta/);
  assert.match(library, /old_alpha/);
  assert.match(instances, /versionType:\s*versionMeta\.type/);
  assert.match(launcher, /type:\s*instance\.versionType \|\| 'release'/);
});

test('only implemented loaders are advertised', () => {
  const library = read('src/pages/Library.jsx');
  const instanceService = read('electron/services/instanceService.js');
  assert.match(library, /value="vanilla"/);
  assert.match(library, /value="fabric"/);
  assert.doesNotMatch(library, /value="forge"|value="neoforge"|value="quilt"/);
  assert.match(instanceService, /\['vanilla','fabric'\]/);
});

test('Java is validated before launch with required major enforcement', () => {
  const java = read('electron/services/javaService.js');
  const launcher = read('electron/services/launcherService.js');
  assert.match(java, /export async function validateJava/);
  assert.match(launcher, /await validateJava\(configured\)/);
  assert.match(launcher, /runtime\.major < required/);
  assert.match(read('src/pages/Settings.jsx'), /api\.java\.validate/);
});

test('Microsoft auth verifies ownership and renews encrypted session state', () => {
  const account = read('electron/services/accountService.js');
  const launcher = read('electron/services/launcherService.js');
  for (const token of ['user.auth.xboxlive.com', 'xsts.auth.xboxlive.com', 'api.minecraftservices.com/entitlements/mcstore']) assert.match(account, new RegExp(token.replaceAll('.', '\\.').replaceAll('/', '\\/')));
  assert.match(account, /msalCache/);
  assert.match(account, /homeAccountId/);
  assert.match(account, /acquireTokenSilent/);
  assert.match(account, /refreshMicrosoftAccount/);
  assert.match(launcher, /await launcherAuthorization\(account\)/);
});

test('Modrinth installation resolves dependencies and verifies downloads', () => {
  const mod = read('electron/services/modService.js');
  assert.match(mod, /dependency_type !== 'required'/);
  assert.match(mod, /sha512/);
  assert.match(mod, /sha1/);
  assert.match(mod, /verifyBuffer/);
  assert.match(mod, /\.part/);
  assert.match(mod, /Eternal Core is managed by the launcher and cannot be removed/);
  assert.match(mod, /cannot be disabled from Mod Hub/);
  assert.match(mod, /Local mod JARs require a mod-loader profile/);
});

test('server tools use real protocol/SRV and real launch arguments', () => {
  const server = read('electron/services/serverService.js');
  const launcher = read('electron/services/launcherService.js');
  assert.match(server, /createConnection/);
  assert.match(server, /resolveSrv/);
  assert.match(server, /_minecraft\._tcp/);
  assert.match(launcher, /--quickPlayMultiplayer/);
  assert.match(launcher, /--server/);
  assert.match(launcher, /--port/);
  assert.doesNotMatch(read('src/pages/Servers.jsx'), /Math\.random/);
});

test('Core launcher mode and standalone export verify the actual Core binary', () => {
  const launcher = read('electron/services/launcherService.js');
  const core = read('electron/services/coreService.js');
  assert.match(launcher, /Launch with Core currently requires a Fabric 1\.21\.11 profile/);
  assert.match(core, /createHash\('sha256'\)/);
  assert.match(core, /exactMatch/);
  assert.match(core, /verification failed after copying/);
  assert.match(core, /export async function exportStandalone/);
  assert.match(core, /Standalone Core export verification failed/);
  assert.match(read('src/pages/Core.jsx'), /api\.core\.exportStandalone/);
});

test('Core modules start OFF and remain user-controlled', () => {
  const config = read('eternal-core/src/main/java/gg/eternal/core/config/CoreConfig.java');
  assert.match(config, /for \(String name : MODULES\) enabled\.put\(name, false\)/);
  assert.match(config, /getOrDefault\(name, false\)/);
  assert.match(config, /setAllModules/);
  assert.doesNotMatch(config, /enabled\.put\(name, true\)/);
});

test('Core config, modules, layouts and keybinds persist safely', () => {
  const config = read('eternal-core/src/main/java/gg/eternal/core/config/CoreConfig.java');
  const gui = read('eternal-core/src/main/java/gg/eternal/core/ui/ClickGuiScreen.java');
  for (const token of ['zoomFov', 'hudAlpha', 'accentColor', 'applyPreset', 'openKey', 'hudEditorKey', 'zoomKey', 'setAllModules', 'ATOMIC_MOVE']) assert.match(config, new RegExp(token));
  for (const module of ['Health', 'Armor', 'Food', 'Server']) assert.match(config, new RegExp(`"${module}"`));
  assert.match(config, /eternal-core\.corrupt-/);
  assert.match(gui, /ENABLE ALL/);
  assert.match(gui, /DISABLE ALL/);
  assert.match(gui, /PRESS A KEY/);
  assert.match(gui, /keyInUseByOther/);
});

test('Right Shift Eternal Start is queued, repeat-safe and render-safe', () => {
  const core = read('eternal-core/src/main/java/gg/eternal/core/EternalCore.java');
  const keyboard = read('eternal-core/src/main/java/gg/eternal/core/mixin/KeyboardMixin.java');
  const mixins = read('eternal-core/src/main/resources/eternal-core.mixins.json');
  const background = read('eternal-core/src/main/java/gg/eternal/core/mixin/ScreenBackgroundMixin.java');
  const home = read('eternal-core/src/main/java/gg/eternal/core/ui/EternalHomeScreen.java');
  assert.match(keyboard, /action == 2/);
  assert.match(core, /screenOpenQueued/);
  assert.match(core, /mc\.execute/);
  assert.match(core, /CoreLog\.error/);
  assert.match(mixins, /ScreenBackgroundMixin/);
  assert.match(background, /renderBackground/);
  assert.match(background, /ci\.cancel\(\)/);
  assert.match(home, /ETERNAL CORE SAFE MODE/);
  assert.match(home, /Eternal Start render failed/);
});

test('Eternal replaces vanilla title screen with real Minecraft navigation', () => {
  const title = read('eternal-core/src/main/java/gg/eternal/core/ui/EternalTitleScreen.java');
  const mixin = read('eternal-core/src/main/java/gg/eternal/core/mixin/MinecraftScreenMixin.java');
  assert.match(mixin, /TitleScreen/);
  assert.match(mixin, /new EternalTitleScreen\(\)/);
  assert.match(title, /SelectWorldScreen/);
  assert.match(title, /JoinMultiplayerScreen/);
  assert.match(title, /OptionsScreen/);
  assert.match(title, /EternalCore\.openClickGui/);
  assert.match(title, /EternalCore\.openHudEditor/);
});

test('HUD editor has real drag snap nudge presets inspector and disable paths', () => {
  const editor = read('eternal-core/src/main/java/gg/eternal/core/ui/HudEditorScreen.java');
  assert.match(editor, /mouseDragged/);
  assert.match(editor, /event\.key\(\) == 261/);
  assert.match(editor, /CoreConfig\.INSTANCE\.toggle\(module\)/);
  assert.match(editor, /apply\("DEFAULT"\)/);
  assert.match(editor, /apply\("COMPACT"\)/);
  assert.match(editor, /apply\("CORNERS"\)/);
  assert.match(editor, /INSPECTOR/);
  assert.match(editor, /MODULES/);
});

test('premium Keystrokes uses live WASD mouse state and real CPS', () => {
  const hud = read('eternal-core/src/main/java/gg/eternal/core/hud/HudRenderer.java');
  assert.match(hud, /drawKeystrokes/);
  for (const value of ['"W"', '"A"', '"S"', '"D"', '"LMB"', '"RMB"']) assert.match(hud, new RegExp(value));
  assert.match(hud, /InputState\.mouseDown\(0\)/);
  assert.match(hud, /InputState\.mouseDown\(1\)/);
  assert.match(hud, /InputState\.leftCps\(\)/);
  assert.match(hud, /InputState\.rightCps\(\)/);
});

test('Core HUD values are live Minecraft/JVM state', () => {
  const hud = read('eternal-core/src/main/java/gg/eternal/core/hud/HudRenderer.java');
  for (const token of ['mc.getFps()', 'InputState.leftCps()', 'mc.player.getX()', 'getLatency()', 'getHealth()', 'getArmorValue()', 'getFoodData()', 'getCurrentServer()', 'Runtime.getRuntime()', 'EternalCore.sessionMillis()']) {
    assert.ok(hud.includes(token), `missing real HUD source: ${token}`);
  }
});

test('Downloads uses measured events and does not invent percentages', () => {
  const downloads = read('src/pages/Downloads.jsx');
  const store = read('src/store/useEternalStore.js');
  const launcher = read('electron/services/launcherService.js');
  assert.match(downloads, /progressValue/);
  assert.match(downloads, /bytePair/);
  assert.match(downloads, /bytesPerSecond/);
  assert.match(downloads, /indeterminate/);
  assert.match(downloads, /No matching transfer events/);
  assert.match(store, /transferFromLaunch/);
  assert.match(launcher, /client\.on\('progress'/);
  assert.match(launcher, /client\.on\('download-status'/);
  assert.doesNotMatch(downloads, /Math\.random/);
});

test('stable updater is wired main to preload to Settings', () => {
  const main = read('electron/main.js');
  const preload = read('electron/preload.cjs');
  const settings = read('src/pages/Settings.jsx');
  const builder = read('electron-builder.yml');
  assert.match(main, /updater:check/);
  assert.match(main, /updater:download/);
  assert.match(main, /updater:install/);
  assert.match(main, /quitAndInstall/);
  assert.match(preload, /updater/);
  assert.match(settings, /api\.updater\.check/);
  assert.match(settings, /api\.updater\.download/);
  assert.match(settings, /api\.updater\.install/);
  assert.match(builder, /provider:\s*github/);
  assert.match(builder, /releaseType:\s*release/);
});

test('stable v1.0.1 workflow publishes installer only plus Core/update metadata', () => {
  const stable = read('.github/workflows/release-stable.yml');
  assert.match(stable, /RELEASE_TAG: v1\.0\.1/);
  assert.match(stable, /CORE_VERSION: 1\.0\.1/);
  assert.match(stable, /release\/latest\.yml/);
  assert.match(stable, /Eternal-Core-Standalone-1\.0\.1\.jar/);
  assert.match(stable, /--latest/);
  assert.doesNotMatch(stable, /--prerelease/);
  assert.doesNotMatch(stable, /portable/i);
  assert.match(stable, /SHA256SUMS\.txt/);
});

test('there are no random fake runtime values in backend or main runtime pages', () => {
  for (const file of backendFiles) assert.doesNotMatch(read(file), /Math\.random\(/, file);
  for (const file of ['src/pages/Home.jsx', 'src/pages/Servers.jsx', 'src/pages/Downloads.jsx', 'src/pages/Core.jsx']) assert.doesNotMatch(read(file), /Math\.random\(/, file);
});
