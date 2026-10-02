import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { registerHooks } from 'node:module';

test('launcher recovers from failures, serializes startup, and persists actual sessions', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'eternal-launch-'));
  const fixture = globalThis.eternalLaunchFixture = { javaMajor: 0, nextPid: 100, children: [], options: [] };
  const serviceUrl = name => new URL(`../electron/services/${name}.js`, import.meta.url).href;
  const stubs = new Map([
    [serviceUrl('store'), `export function dataRoot() { return ${JSON.stringify(root)}; } export const store = {get: key => key === 'settings' ? {ramMb:6144,resolution:{width:1280,height:720}} : ''};`],
    [serviceUrl('accountService'), "export function activeAccount() { return {id:'local'}; } export async function launcherAuthorization() { return {name:'LocalPlayer'}; }"],
    [serviceUrl('fabricService'), "export async function installFabricProfile() { return {id:'fabric-test'}; }"],
    [serviceUrl('coreService'), "export async function prepareCore() { return {installed:true, version:'1.2.0'}; }"],
    [serviceUrl('javaService'), `export function requiredJavaMajor() { return 21; }
      export async function detectJava() { await globalThis.eternalLaunchFixture.javaGate; const major=globalThis.eternalLaunchFixture.javaMajor; return major ? [{path:'test-java',major}] : []; }
      export async function validateJava() { return null; }`]
  ]);
  const clientUrl = new URL('./mock-launcher.cjs', import.meta.url).href;
  const hook = registerHooks({
    resolve(specifier, context, next) {
      if (specifier === 'minecraft-launcher-core') return { url: clientUrl, shortCircuit: true };
      return next(specifier, context);
    },
    load(url, context, next) {
      if (stubs.has(url)) return { format: 'module', shortCircuit: true, source: stubs.get(url) };
      if (url === clientUrl) return { format: 'commonjs', shortCircuit: true, source: `
        const {EventEmitter} = require('node:events');
        module.exports.Client = class extends EventEmitter {
          async launch(options) {
            const f = globalThis.eternalLaunchFixture;
            f.options.push(options);
            const child = new EventEmitter(); child.pid = f.nextPid++;
            child.kill = () => { queueMicrotask(() => child.emit('close', 0)); return true; };
            f.children.push(child);
            this.emit('progress', {current:50,total:100,type:'assets'});
            return child;
          }
        };` };
      return next(url, context);
    }
  });
  try {
    const folder = path.join(root, 'instances/one');
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(path.join(folder, 'instance.json'), JSON.stringify({ id:'one', name:'PvP', loader:'fabric', minecraftVersion:'1.21.11', ramMb:4096, playtimeSeconds:0 }));
    const launcher = await import('../electron/services/launcherService.js');
    const instances = await import('../electron/services/instanceService.js');
    let events = [], transfers = [], stopped;
    const options = { instanceId:'one', emit: event => { events.push(event); if (event.state === 'STOPPED') stopped?.(event); }, emitDownload: event => transfers.push(event) };

    await t.test('Java validation failure clears Starting and allows another attempt', async () => {
      await assert.rejects(launcher.launchInstance(options), /requires Java 21/);
      assert.deepEqual(events.map(event => event.state), ['VALIDATING', 'ERROR']);
      assert.equal(launcher.isLaunching('one'), false);
      assert.deepEqual(launcher.runningState(), []);
    });

    await t.test('retry uses saved instance memory and reports the actual process and transfers', async () => {
      fixture.javaMajor = 21;
      events = [];
      const result = await launcher.launchInstance(options);
      assert.equal(result.pid, 100);
      assert.equal(fixture.options[0].memory.max, '4096M');
      assert.deepEqual(launcher.runningState(), [{instanceId:'one',pids:[100],count:1}]);
      const running = events.find(event => event.state === 'RUNNING');
      assert.equal((await instances.getInstance('one')).lastPlayedAt, running.startedAt);
      assert.ok(transfers.some(event => event.state === 'DOWNLOADING' && event.progress.current === 50));
      assert.equal(launcher.isLaunching('one'), false);
    });

    await t.test('concurrent settings and completed sessions preserve every update', async () => {
      await Promise.all([instances.recordPlaytime('one', 5), instances.patchInstance('one', {ramMb:8192}), instances.recordPlaytime('one', 7)]);
      const saved = await instances.getInstance('one');
      assert.equal(saved.ramMb, 8192);
      assert.equal(saved.playtimeSeconds, 12);
      assert.ok(saved.lastPlayedAt);
      const finished = new Promise(resolve => { stopped = resolve; });
      assert.equal(launcher.stopInstance('one'), true);
      const event = await finished;
      assert.equal(event.playtimeSeconds, (await instances.getInstance('one')).playtimeSeconds);
      assert.ok(event.playtimeSeconds >= 12);
      assert.deepEqual(launcher.runningState(), []);
      assert.equal(launcher.stopInstance('one'), false);
    });

    await t.test('a duplicate start cannot corrupt the first launch or lock future launches', async () => {
      let release;
      fixture.javaGate = new Promise(resolve => { release = resolve; });
      events = [];
      const pending = launcher.launchInstance(options);
      assert.equal(launcher.isLaunching('one'), true);
      await assert.rejects(launcher.launchInstance(options), /already starting/);
      assert.equal(events.some(event => event.state === 'ERROR'), false);
      release();
      await pending;
      assert.equal(fixture.options.at(-1).memory.max, '8192M');
      assert.equal(launcher.isLaunching('one'), false);
      const finished = new Promise(resolve => { stopped = resolve; });
      launcher.stopInstance('one');
      await finished;
    });
  } finally {
    hook.deregister();
    delete globalThis.eternalLaunchFixture;
    await fs.rm(root, { recursive: true, force: true });
  }
});
