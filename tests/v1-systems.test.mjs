import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('real operation console is wired backend -> preload -> store -> app', () => {
  const main = read('electron/main.js');
  const preload = read('electron/preload.cjs');
  const store = read('src/store/useEternalStore.js');
  const app = read('src/App.jsx');
  const consoleUi = read('src/components/OperationConsole.jsx');
  assert.match(main, /operation:event/);
  assert.match(main, /tracedOperations/);
  assert.match(main, /instances:create/);
  assert.match(preload, /operation: \(cb\) => on\('operation:event'/);
  assert.match(store, /operationEvents/);
  assert.match(store, /pushOperationEvent/);
  assert.match(store, /operationConsoleOpen/);
  assert.match(app, /api\.on\.operation/);
  assert.match(app, /<OperationConsole/);
  assert.match(consoleUi, /Nothing here is simulated/);
  assert.match(consoleUi, /CTRL \+ J/);
});

test('instance system supports official full catalog, edit and real duplication', () => {
  const versions = read('electron/services/versionService.js');
  const service = read('electron/services/instanceService.js');
  const main = read('electron/main.js');
  const preload = read('electron/preload.cjs');
  const page = read('src/pages/Library.jsx');
  assert.match(versions, /limit = 1000/);
  assert.match(versions, /Math\.min\(Number\(limit\) \|\| 1000, 2000\)/);
  assert.match(page, /includeSnapshots: true/);
  assert.match(page, /old_beta/);
  assert.match(page, /old_alpha/);
  assert.match(page, /datalist id="eternal-minecraft-versions"/);
  assert.match(service, /duplicateInstance/);
  assert.match(service, /fs\.cp/);
  assert.match(service, /patchInstance/);
  assert.match(service, /resourcepacks/);
  assert.match(service, /shaderpacks/);
  assert.match(main, /instances:patch/);
  assert.match(main, /instances:duplicate/);
  assert.match(preload, /duplicate: \(data\) => invoke\('instances:duplicate'/);
});

test('Mod Hub V1 supports real sorting categories pagination and verified installs', () => {
  const service = read('electron/services/modService.js');
  const page = read('src/pages/Mods.jsx');
  for (const token of ['relevance', 'downloads', 'follows', 'newest', 'updated']) assert.match(service, new RegExp(token));
  assert.match(service, /offset/);
  assert.match(service, /category/);
  assert.match(service, /verifyBuffer/);
  assert.match(service, /dependency_type !== 'required'/);
  assert.match(page, /Load more/);
  assert.match(page, /v1-category-rail/);
  assert.match(page, /Most downloaded/);
  assert.match(page, /total_hits/);
});

test('Core V1.1 opens premium real-function screens through the crash-safe Minecraft task queue', () => {
  const core = read('eternal-core/src/main/java/gg/eternal/core/EternalCore.java');
  const home = read('eternal-core/src/main/java/gg/eternal/core/ui/EternalHomeScreen.java');
  const editor = read('eternal-core/src/main/java/gg/eternal/core/ui/HudEditorScreen.java');
  assert.match(core, /EternalHomeScreen::new/);
  assert.match(core, /ClickGuiScreen::new/);
  assert.match(core, /HudEditorScreen::new/);
  assert.match(core, /mc\.execute/);
  assert.match(core, /screenOpenQueued/);
  assert.match(home, /Component\.literal\("Eternal Start"\)/);
  for (const token of ['WELCOME BACK', 'QUICK MODULES', 'HUD WORKSPACE', 'ClickGUI 2.0']) assert.match(home, new RegExp(token));
  assert.match(home, /EternalCore\.openClickGui\(\)/);
  assert.match(home, /EternalCore\.openHudEditor\(\)/);
  assert.match(home, /CoreConfig\.INSTANCE\.toggle\(QUICK_MODULES\[i\]\)/);
  assert.match(home, /applyPreset\("DEFAULT"/);
  assert.match(home, /applyPreset\("COMPACT"/);
  assert.match(home, /applyPreset\("CORNERS"/);
  assert.match(home, /HudRenderer\.value\("FPS"\)/);
  assert.match(home, /HudRenderer\.value\("Ping"\)/);
  assert.match(home, /isPauseScreen\(\)/);
  assert.match(editor, /"MODULES"/);
  assert.match(editor, /EternalCore\.openClickGui\(\)/);
});

test('stable release intentionally excludes portable ZIP', () => {
  const stable = read('.github/workflows/release-stable.yml');
  assert.doesNotMatch(stable, /Compress-Archive/);
  assert.doesNotMatch(stable, /portable\.zip/);
  assert.doesNotMatch(stable, /-portable/);
  assert.match(stable, /Eternal-Core-Standalone-\$env:CORE_VERSION\.jar/);
  assert.match(stable, /release\/latest\.yml/);
  assert.match(stable, /SHA256SUMS\.txt/);
});

test('V1 systems visual layer is substantial, responsive and loaded last', () => {
  const main = read('src/main.jsx');
  const css = read('src/v1-systems.css');
  assert.ok(css.length > 10000, 'V1 systems UI must be a substantial implementation');
  assert.ok(main.indexOf("import './v1-systems.css'") > main.indexOf("import './v1-motion.css'"));
  for (const token of ['v1-operation-console', 'v1-instance-commandbar', 'v1-version-browser', 'v1-category-rail', 'v1-mod-result']) assert.match(css, new RegExp(token));
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@media\(max-width:780px\)/);
});
