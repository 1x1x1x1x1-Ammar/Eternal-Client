import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');

test('v1.1 stable visual polish is the final launcher CSS layer', () => {
  const main = read('src/main.jsx');
  const css = read('src/v11-release.css');
  const studio = main.lastIndexOf("import './v11-studio.css'");
  const release = main.lastIndexOf("import './v11-release.css'");
  assert.ok(studio >= 0 && release > studio, 'v11-release.css must load after Studio');
  assert.ok(css.length > 7000, 'stable release polish must be a substantial implementation');
  for (const token of ['.app-shell', '.titlebar', '.sidebar', '.nav-icon.active', '.premium-status-deck', '.v11-module-card', 'prefers-reduced-motion']) {
    assert.ok(css.includes(token), `missing release polish selector: ${token}`);
  }
});

test('Studio is identified in the shared launcher chrome', () => {
  const title = read('src/components/TitleBar.jsx');
  assert.match(title, /'\/studio': 'CUSTOMIZATION STUDIO'/);
});

test('v1.1 publication workflow builds launcher and the same standalone Core', () => {
  const workflow = read('.github/workflows/release-v1.1.0.yml');
  assert.match(workflow, /RELEASE_TAG: v1\.1\.0/);
  assert.match(workflow, /CORE_VERSION: 1\.1\.0/);
  assert.match(workflow, /LAUNCHER_VERSION: 1\.1\.0/);
  assert.match(workflow, /gradle clean build --stacktrace/);
  assert.match(workflow, /node scripts\/stage-core\.mjs/);
  assert.match(workflow, /Eternal-Core-Standalone-\$env:CORE_VERSION\.jar/);
  assert.match(workflow, /Eternal\.Client\.Setup\.1\.1\.0\.exe/);
  assert.match(workflow, /latest\.yml/);
  assert.match(workflow, /SHA256SUMS\.txt/);
  assert.match(workflow, /--smoke-test/);
  assert.match(workflow, /--latest/);
  assert.doesNotMatch(workflow, /--prerelease/);
});

test('v1.1 release notes document launcher Core and standalone behavior', () => {
  const notes = read('RELEASE_NOTES_v1.1.0.md');
  for (const token of ['Customization Studio', 'ClickGUI 2.0', 'HUD Studio', 'Standalone Eternal Core v1.1.0', 'Eternal.Client.Setup.1.1.0.exe', 'Eternal-Core-Standalone-1.1.0.jar']) {
    assert.ok(notes.includes(token), `release notes missing ${token}`);
  }
});
