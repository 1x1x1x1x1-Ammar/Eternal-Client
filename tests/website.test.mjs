import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');

test('official website ships the premium image-first product experience', () => {
  const html = read('website/index.html');
  const css = read('website/styles.css');
  const js = read('website/app.js');

  for (const id of ['features', 'experience', 'core', 'release', 'download']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }

  for (const label of ['Eternal Client', 'Eternal Core', 'ClickGUI 2.0', 'HUD Studio', 'Customization Studio']) {
    assert.ok(html.includes(label), `missing website product surface: ${label}`);
  }

  for (const asset of ['launcher-showcase.svg', 'modhub-showcase.svg', 'studio-showcase.svg', 'client-showcase.svg']) {
    assert.ok(html.includes(`assets/${asset}`), `missing product-shot reference: ${asset}`);
    assert.ok(fs.existsSync(`website/assets/${asset}`), `missing product-shot file: ${asset}`);
  }

  assert.doesNotMatch(html, /dawn-plus\.css/);
  assert.match(html, /href="styles\.css"/);
  assert.match(html, /Eternal\.Client\.Setup\.1\.1\.0\.exe/);
  assert.match(html, /Eternal-Core-Standalone-1\.1\.0\.jar/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /site\.webmanifest/);

  assert.ok(css.length > 12000, 'single website visual system should remain substantial');
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /\.launcher-window/);
  assert.match(css, /\.experience-frame/);
  assert.match(css, /\.download-card/);
  assert.match(css, /\.feature-tabs/);

  assert.match(js, /api\.github\.com\/repos\/1x1x1x1x1-Ammar\/Eternal-Client\/releases\/latest/);
  assert.match(js, /IntersectionObserver/);
  assert.match(js, /setupExperienceTabs/);
  assert.match(js, /setupFeatureTabs/);
  assert.match(js, /setupMobileMenu/);
  assert.match(js, /setupShowcaseMotion/);
  assert.match(js, /#core-download, #download-core, #final-download/);
  assert.match(js, /fallback/);
});

test('website Pages workflow deploys only the static website directory', () => {
  const workflow = read('.github/workflows/website-pages.yml');
  assert.match(workflow, /actions\/configure-pages@v5/);
  assert.match(workflow, /actions\/upload-pages-artifact@v3/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /path:\s*website/);
  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /id-token:\s*write/);
});
