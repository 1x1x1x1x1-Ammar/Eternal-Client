import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');

test('official website ships the Eternal SMP season and premium client experience', () => {
  const home = read('website/index.html');
  const client = read('website/client.html');
  const css = read('website/styles.css');
  const js = read('website/app.js');

  for (const id of ['abilities', 'ranks', 'update', 'team']) {
    assert.match(home, new RegExp(`id="${id}"`));
  }

  for (const label of ['CELESTIAL', 'Celestial Armor', 'Laser Ability', 'NEW RANK SYSTEM', 'ADMINS &amp; BUILDERS']) {
    assert.ok(home.includes(label), `missing season surface: ${label}`);
  }

  for (const staff of ['Celestial', '『PYCRAFT』 Snare', '✦ DRAGON ✦', 'Aljenral', 'Founder', 'Co-Founder', 'Administrator', 'Builder']) {
    assert.ok(home.includes(staff), `missing staff mapping: ${staff}`);
  }

  for (const id of ['launcher', 'features', 'download']) {
    assert.match(client, new RegExp(`id="${id}"`));
  }

  for (const label of ['Eternal Client', 'Standalone Core', 'Profiles', 'Mods &amp; Modpacks', 'Customization', 'Customize your game.']) {
    assert.ok(client.includes(label), `missing client product surface: ${label}`);
  }

  for (const asset of ['launcher-showcase.svg', 'modhub-showcase.svg', 'studio-showcase.svg', 'client-showcase.svg']) {
    assert.ok(client.includes(`assets/${asset}`), `missing product-shot reference: ${asset}`);
    assert.ok(fs.existsSync(`website/assets/${asset}`), `missing product-shot file: ${asset}`);
  }

  for (const asset of ['team/celestial.svg', 'team/pycraft.svg', 'team/dragon.svg', 'team/aljenral.svg', 'armor-strip.svg']) {
    assert.ok(home.includes(`assets/${asset}`), `missing season asset reference: ${asset}`);
    assert.ok(fs.existsSync(`website/assets/${asset}`), `missing season asset file: ${asset}`);
  }

  assert.match(home, /href="styles\.css"/);
  assert.match(client, /href="styles\.css"/);
  assert.doesNotMatch(home, /dawn-plus\.css|dawn-v2\.css|fix\.css|final\.css/);
  assert.equal((home.match(/rel="stylesheet"/g) || []).length, 1, 'home must load one production stylesheet');
  assert.equal((client.match(/rel="stylesheet"/g) || []).length, 1, 'client must load one production stylesheet');

  assert.ok(css.length > 12000, 'single website visual system should remain substantial');
  for (const breakpoint of ['1100px', '900px', '720px', '480px']) assert.ok(css.includes(breakpoint));
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /\.celestial-stage/);
  assert.match(css, /\.staff-carousel/);
  assert.match(css, /\.client-overview/);
  assert.match(css, /\.client-game/);
  assert.match(css, /\.download-finale/);

  assert.match(js, /api\.github\.com\/repos\/1x1x1x1x1-Ammar\/Eternal-Client\/releases\/latest/);
  assert.match(js, /Eternal\.Client\.Setup\.1\.1\.0\.exe/);
  assert.match(js, /Eternal-Core-Standalone-1\.1\.0\.jar/);
  assert.match(js, /IntersectionObserver/);
  assert.match(js, /initClientTabs/);
  assert.match(js, /initCarousel/);
  assert.match(js, /initNav/);
  assert.match(js, /'#core-download','#download-core'/);
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
