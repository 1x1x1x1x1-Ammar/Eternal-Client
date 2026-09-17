import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Core module catalog initializes before the singleton', () => {
  const config = read('eternal-core/src/main/java/gg/eternal/core/config/CoreConfig.java');
  const modules = config.indexOf('public static final String[] MODULES');
  const singleton = config.indexOf('public static final CoreConfig INSTANCE');
  assert.ok(modules >= 0, 'Core module catalog must exist');
  assert.ok(singleton > modules, 'MODULES must initialize before CoreConfig.INSTANCE to prevent ExceptionInInitializerError');
});

test('Eternal in-world screens avoid vanilla background blur and retain safe mode', () => {
  const background = read('eternal-core/src/main/java/gg/eternal/core/mixin/ScreenBackgroundMixin.java');
  const home = read('eternal-core/src/main/java/gg/eternal/core/ui/EternalHomeScreen.java');
  assert.match(background, /renderBackground/);
  assert.match(background, /ci\.cancel\(\)/);
  assert.doesNotMatch(home, /renderBackground\(graphics/);
  assert.match(home, /ETERNAL CORE SAFE MODE/);
  assert.match(home, /CoreLog\.error\("Eternal Start render failed"/);
});
