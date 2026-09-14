import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('every routed page participates in the Beta 8 UI system', () => {
  const expectations = {
    'src/pages/Home.jsx': /beta8-home/,
    'src/pages/Library.jsx': /beta8-library-page/,
    'src/pages/Mods.jsx': /beta8-mods-page/,
    'src/pages/Servers.jsx': /beta8-servers-page/,
    'src/pages/Core.jsx': /beta8-core-page/,
    'src/pages/Accounts.jsx': /beta8-account-grid|beta8-page/,
    'src/pages/Downloads.jsx': /beta8-downloads-page/,
    'src/pages/Developer.jsx': /beta8-developer-grid|beta8-page/,
    'src/pages/Settings.jsx': /beta8-settings-page/
  };

  for (const [file, pattern] of Object.entries(expectations)) {
    assert.match(read(file), pattern, `${file} is missing Beta 8 UI coverage`);
  }
});

test('polish layer is loaded after the base Beta 8 skin', () => {
  const main = read('src/main.jsx');
  const beta8Index = main.indexOf("import './beta8.css'");
  const polishIndex = main.indexOf("import './beta8-polish.css'");
  assert.ok(beta8Index >= 0, 'beta8.css must be loaded');
  assert.ok(polishIndex > beta8Index, 'beta8-polish.css must load after beta8.css');
});

test('sidebar width has one source of truth across expanded and compact layouts', () => {
  const css = read('src/beta8-polish.css');
  assert.match(css, /--release-sidebar:188px/);
  assert.match(css, /grid-template-columns:var\(--release-sidebar\) minmax\(0,1fr\)/);
  assert.match(css, /@media\(max-width:1080px\)[\s\S]*--release-sidebar:72px/);
  assert.match(css, /command-backdrop,.modal-backdrop\{left:var\(--release-sidebar\)/);
});

test('compact Electron window can actually reach responsive breakpoints', () => {
  const main = read('electron/main.js');
  assert.match(main, /minWidth:\s*760/);
  assert.match(main, /minHeight:\s*560/);
});

test('collapsed sidebar keeps discoverable navigation labels', () => {
  const sidebar = read('src/components/Sidebar.jsx');
  const css = read('src/beta8-polish.css');
  assert.match(sidebar, /data-tip=\{label\}/);
  assert.match(css, /\.release-sidebar \.nav-icon:after[\s\S]*display:block/);
});

test('title bar exposes current route context', () => {
  const title = read('src/components/TitleBar.jsx');
  assert.match(title, /useLocation/);
  assert.match(title, /titlebar-context/);
  assert.match(title, /'\/downloads': 'DOWNLOADS'/);
});
