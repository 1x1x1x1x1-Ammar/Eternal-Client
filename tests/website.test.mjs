import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');

test('website ships Eternal SMP premium v5 at desktop 67% density', () => {
  const home = read('website/index.html');
  const client = read('website/client.html');
  const css = read('website/styles.css');
  const js = read('website/app.js');

  for (const id of ['team', 'god-armour', 'features', 'ranks', 'gallery']) {
    assert.match(home, new RegExp(`id="${id}"`), `missing home section: ${id}`);
  }

  for (const id of ['launcher', 'ingame', 'download']) {
    assert.match(client, new RegExp(`id="${id}"`), `missing client section: ${id}`);
  }

  for (const asset of [
    'hero.webp',
    'team.webp',
    'god-armour.webp',
    'celestial.webp',
    'pycraft.webp',
    'dragon.webp',
    'aljenral.webp'
  ]) {
    assert.ok(home.includes(`assets/${asset}`), `home does not reference ${asset}`);
    assert.ok(fs.existsSync(`website/assets/${asset}`), `missing asset file: ${asset}`);
  }

  assert.ok(client.includes('assets/client-showcase.webp'));
  assert.ok(fs.existsSync('website/assets/client-showcase.webp'));

  assert.match(home, /bootstrap@5\.3\.3/);
  assert.match(home, /bootstrap-icons@1\.11\.3/);
  assert.match(client, /bootstrap@5\.3\.3/);
  assert.match(client, /bootstrap-icons@1\.11\.3/);

  assert.match(css, /@media\s*\(min-width:1200px\)/);
  assert.match(css, /zoom:\s*\.67/);
  assert.match(css, /width:\s*149\.253731%/);
  assert.match(css, /min-height:\s*149\.253731svh/);
  assert.match(css, /prefers-reduced-motion:reduce/);

  assert.doesNotMatch(css, /armor-figure|dragon-body|floating-island/);
  assert.match(js, /api\.github\.com\/repos\/1x1x1x1x1-Ammar\/Eternal-Client\/releases\/latest/);
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
