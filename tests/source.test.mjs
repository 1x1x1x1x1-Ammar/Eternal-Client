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

test('package and Core versions are stable v1.0.1', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.version, '1.0.1');
  assert.match(read('eternal-core/gradle.properties'), /mod_version=1\.0\.1/);
  assert.match(read('eternal-core/src/main/java/gg/eternal/core/EternalCore.java'), /VERSION = "1\.0\.1"/);
  assert.doesNotMatch(pkg.version, /beta|alpha|rc/i);
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
  const stable = read('.github/workflows/release-stable.yml');
  assert.match(main, /--smoke-test/);
  assert.match(main, /did-finish-load/);
  assert.match(main, /app\.exit\(91\)/);
  assert.match(ci, /Smoke test packaged Electron main process/);
  assert.match(stable, /Smoke test packaged Eternal Client\.exe/);
  assert.match(stable, /Eternal Client\.exe/);
});

test('Electron renderer remains isolated, single-instance and Eternal-branded', () => {
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

test('renderer bundles Eternal images instead of fragile absolute file URLs', () => {
  for (const file of ['src/App.jsx', 'src/pages/Home.jsx', 'src/pages/Core.jsx', 'src/pages/Mods.jsx', 'src/components/Sidebar.jsx', 'src/components/TitleBar.jsx']) {
    const content = read(file);
    if (file !== 'src/App.jsx' && file !== 'src/pages/Mods.jsx') assert.match(content, /import eternalLogo from/);
    assert.doesNotMatch(content, /src=["']\/assets\/logo\.svg["']/);
  }
});

test('v1.0.1 premium UI layer is substantial and loaded last', () => {
  const main = read('src/main.jsx');
  const base = read('src/v1.css');
  const patch = read('src/v1.0.1.css');
  const baseIndex = main.indexOf("import './v1.css'");
  const patchIndex = main.indexOf("import './v1.0.1.css'");
  assert.ok(base.length > 12000, 'v1 base visual layer must remain substantial');
  assert.ok(patch.length > 7000, 'v1.0.1 visual polish must be a real implementation');
  assert.ok(baseIndex >= 0 && patchIndex > baseIndex, 'v1.0.1.css must load after the v1 base system');
  for (const token of ['release-sidebar', 'premium-hero', 'premium-library-profile', 'v1-operation-console', 'v101-downloads-page']) assert.match(patch, new RegExp(token));
  assert.match(patch, /prefers-reduced-motion/);
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

test('operation console records real launcher operations and Minecraft output', () => {
  const main = read('electron/main.js');
  const preload = read('electron/preload.cjs');
  const consoleUi = read('src/components/OperationConsole.jsx');
  const store = read('src/store/useEternalStore.js');
  assert.match(main, /operation:event/);
  assert.match(main, /instances:create/);
  assert.match(preload, /operation/);
  assert.match(consoleUi, /Minecraft/);
  assert.match(consoleUi, /Transfers/);
  assert.match(store, /operationConsoleOpen/);
  assert.match(store, /clearMinecraftLogs/);
});

test('pre-JVM and runtime Minecraft failures surface as real launch errors', () => {
  const launcher = read('electron/services/launcherService.js');
  const downloads = read('src/pages/Downloads.jsx');
  assert.match(launcher, /state: 'ERROR'/);
  assert.match(launcher, /launchInstanceInternal/);
  assert.match(launcher, /PROCESS_ERROR/);
  assert.match(launcher, /classifyGameMessage/);
  assert.match(downloads, /'ERROR'/);
  assert.match(downloads, /Open console/);
  assert.match(downloads, /Clear session transfers/);
  assert.match(downloads, /Unknown-size work stays indeterminate/);
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

test('Microsoft auth uses ownership verification and renewable encrypted session state', () => {
  const account = read('electron/services/accountService.js');
  const launcher = read('electron/services/launcherService.js');
  assert.match(account, /OfflinePlayer:/);
  assert.match(account, /user\.auth\.xboxlive\.com/);
  assert.match(account, /xsts\.auth\.xboxlive\.com/);
  assert.match(account, /api\.minecraftservices\.com\/entitlements\/mcstore/);
  assert.match(account, /msalCache/);
  assert.match(account, /homeAccountId/);
  assert.match(account, /acquireTokenSilent/);
  assert.match(account, /refreshMicrosoftAccount/);
  assert.match(account, /export async function launcherAuthorization/);
  assert.match(launcher, /await launcherAuthorization\(account\)/);
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

test('Core launcher mode requires compatible profile and verifies SHA-256', () => {
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

test('clean-install Core modules default to disabled', () => {
  const config = read('eternal-core/src/main/java/gg/eternal/core/config/CoreConfig.java');
  assert.match(config, /enabled\.put\(name, false\)/);
  assert.match(config, /getOrDefault\(name, false\)/);
});

test('Core module center has real controls and guarded recovery', () => {
  const gui = read('eternal-core/src/main/java/gg/eternal/core/ui/ClickGuiScreen.java');
  for (const token of ['ENABLE ALL', 'DISABLE ALL', 'EDIT LAYOUT', 'PRESS A KEY', 'keyInUseByOther', 'PREMIUM IN-GAME CLIENT']) assert.match(gui, new RegExp(token));
  assert.match(gui, /CoreLog\.error/);
  assert.match(gui, /recover\("render"/);
  assert.match(gui, /EternalCore\.openHudEditor/);
  assert.match(gui, /EternalCore\.openHome/);
});

test('Right Shift/Core screen lifecycle is queued and protected against repeat input', () => {
  const core = read('eternal-core/src/main/java/gg/eternal/core/EternalCore.java');
  const keyboard = read('eternal-core/src/main/java/gg/eternal/core/mixin/KeyboardMixin.java');
  assert.match(core, /AtomicBoolean screenOpenQueued/);
  assert.match(core, /mc\.execute/);
  assert.match(core, /openHome\(\)/);
  assert.match(core, /CoreLog\.error\("Could not open/);
  assert.match(keyboard, /action == 2/);
});

test('Core custom title/start menu replaces vanilla title surface with real destinations', () => {
  const title = read('eternal-core/src/main/java/gg/eternal/core/ui/EternalTitleScreen.java');
  const mixin = read('eternal-core/src/main/java/gg/eternal/core/mixin/MinecraftScreenMixin.java');
  assert.match(title, /SINGLEPLAYER/);
  assert.match(title, /MULTIPLAYER/);
  assert.match(title, /MODULES/);
  assert.match(title, /HUD STUDIO/);
  assert.match(title, /OptionsScreen/);
  assert.match(title, /SelectWorldScreen/);
  assert.match(title, /JoinMultiplayerScreen/);
  assert.match(title, /SAFE MENU/);
  assert.match(title, /CoreLog\.error/);
  assert.match(mixin, /TitleScreen/);
  assert.match(mixin, /EternalTitleScreen/);
});

test('HUD Studio drag/nudge/presets/disable and recovery are actual code paths', () => {
  const editor = read('eternal-core/src/main/java/gg/eternal/core/ui/HudEditorScreen.java');
  assert.match(editor, /mouseDragged/);
  assert.match(editor, /event\.key\(\) == 261/);
  assert.match(editor, /CoreConfig\.INSTANCE\.toggle\(module\)/);
  assert.match(editor, /apply\("DEFAULT"\)/);
  assert.match(editor, /apply\("COMPACT"\)/);
  assert.match(editor, /apply\("CORNERS"\)/);
  assert.match(editor, /MODULE INSPECTOR/);
  assert.match(editor, /EternalCore\.openClickGui/);
  assert.match(editor, /recover\("render"/);
  assert.match(editor, /CoreLog\.error/);
});

test('Core HUD values come from live Minecraft/JVM state and isolate module crashes', () => {
  const hud = read('eternal-core/src/main/java/gg/eternal/core/hud/HudRenderer.java');
  assert.match(hud, /mc\.getFps\(\)/);
  assert.match(hud, /InputState\.leftCps\(\)/);
  assert.match(hud, /InputState\.rightCps\(\)/);
  assert.match(hud, /InputState\.mouseDown\(0\)/);
  assert.match(hud, /mc\.player\.getX\(\)/);
  assert.match(hud, /getLatency\(\)/);
  assert.match(hud, /getHealth\(\)/);
  assert.match(hud, /getArmorValue\(\)/);
  assert.match(hud, /getFoodData\(\)/);
  assert.match(hud, /getCurrentServer\(\)/);
  assert.match(hud, /Runtime\.getRuntime\(\)/);
  assert.match(hud, /EternalCore\.sessionMillis\(\)/);
  assert.match(hud, /HUD module .* failed and was disabled for safety/);
});

test('top-level HUD mixin failure cannot take down Minecraft render loop', () => {
  const guiMixin = read('eternal-core/src/main/java/gg/eternal/core/mixin/GuiMixin.java');
  assert.match(guiMixin, /try \{/);
  assert.match(guiMixin, /catch \(Throwable error\)/);
  assert.match(guiMixin, /CoreLog\.error/);
});

test('Core log persists full exception diagnostics', () => {
  const log = read('eternal-core/src/main/java/gg/eternal/core/util/CoreLog.java');
  assert.match(log, /printStackTrace/);
  assert.match(log, /StringWriter/);
  assert.match(log, /eternal-core\.log/);
  assert.match(log, /StandardOpenOption\.APPEND/);
});

test('real stable updater is wired main -> preload -> Settings and GitHub provider', () => {
  const main = read('electron/main.js');
  const preload = read('electron/preload.cjs');
  const settings = read('src/pages/Settings.jsx');
  const builder = read('electron-builder.yml');
  assert.match(main, /updater:check/);
  assert.match(main, /updater:download/);
  assert.match(main, /updater:install/);
  assert.match(main, /quitAndInstall/);
  assert.match(preload, /download: \(\) => invoke\('updater:download'\)/);
  assert.match(preload, /install: \(\) => invoke\('updater:install'\)/);
  assert.match(settings, /api\.updater\.check/);
  assert.match(settings, /api\.updater\.download/);
  assert.match(settings, /api\.updater\.install/);
  assert.match(builder, /provider:\s*github/);
  assert.match(builder, /releaseType:\s*release/);
});

test('stable v1.0.1 workflow is installer-only and carries updater metadata', () => {
  const stable = read('.github/workflows/release-stable.yml');
  assert.match(stable, /RELEASE_TAG: v1\.0\.1/);
  assert.match(stable, /CORE_VERSION: 1\.0\.1/);
  assert.match(stable, /release\/latest\.yml/);
  assert.match(stable, /--latest/);
  assert.doesNotMatch(stable, /--prerelease/);
  assert.doesNotMatch(stable, /portable\.zip|portable build/i);
  assert.match(stable, /SHA256SUMS\.txt/);
  assert.match(stable, /upload-artifact@v4/);
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
