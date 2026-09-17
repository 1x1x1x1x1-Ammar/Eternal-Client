import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('v1.0.1 client polish layer is final and preserves the existing runtime layers', () => {
  const main = read('src/main.jsx');
  const polish = read('src/v101-client.css');
  const previous = main.indexOf("import './v1-transfers.css'");
  const finalLayer = main.indexOf("import './v101-client.css'");
  assert.ok(previous >= 0 && finalLayer > previous, 'v1.0.1 polish must load after stable runtime presentation layers');
  for (const token of ['release-sidebar','titlebar','premium-hero','premium-status-deck','premium-library-profile','premium-mod-hero','beta8-server-card','account-page-row','beta8-core-hero','download-page-row','v1-operation-console']) {
    assert.match(polish, new RegExp(token));
  }
  assert.match(polish, /prefers-reduced-motion/);
  assert.doesNotMatch(polish, /Math\.random|fake|demo player|placeholder/i);
});
