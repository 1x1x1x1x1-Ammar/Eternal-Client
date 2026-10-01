import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await createServer({ server: { host: '127.0.0.1', port: 5187, strictPort: true } });
await server.listen();
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const ok = data => Promise.resolve({ ok: true, data: structuredClone(data) });
    const accounts = [{ id: 'local', type: 'offline', username: 'LocalPlayer', uuid: 'test-local' }, { id: 'online', type: 'microsoft', username: 'OnlinePlayer', uuid: 'test-online' }];
    const initial = { enabled: {}, openKey: 74, hudEditorKey: 75, combatPreset: 'sword', positions: {}, hudAlpha: 196, accentColor: -53192, zoomFov: 30, zoomSpeed: 5, snap: 4, crosshair: { color: -1, gap: 3, length: 5, thickness: 1 }, smoothZoom: true };
    const configs = { one:structuredClone(initial), two:{...structuredClone(initial),openKey:76,hudEditorKey:79} };
    const instances = [{id:'one',name:'PvP',loader:'fabric',minecraftVersion:'1.21.11',ramMb:6144}, {id:'two',name:'Survival',loader:'fabric',minecraftVersion:'1.21.11',ramMb:8192}];
    let running = [], settings = {reducedMotion:true,ramMb:6144};
    const listeners = {};
    window.uiUpdateCore = (id, patch) => { configs[id] = {...configs[id],...patch}; };
    window.uiCalls = [];
    window.eternal = {
      on: Object.fromEntries(['account', 'launch', 'download', 'operation', 'update', 'app'].map(key => [key, callback => {listeners[key]=callback;return () => {delete listeners[key];};}])),
      accounts: { list: () => ok({ accounts, activeId: 'local' }), skin: async data => {
        window.uiCalls.push({ type: 'skin', ...data });
        accounts.find(item => item.id === data.accountId).skinUrl = data.reset ? '' : data.dataUrl;
        return ok(true);
      } },
      app: { state: () => ok({ version: '1.2.0', running }), openExternal: url => { window.uiCalls.push({ type: 'external', url }); return ok(true); } },
      settings: { get: () => ok(settings), patch: patch => {window.uiCalls.push({type:'settings',patch});settings={...settings,...patch};return ok(settings);} },
      mods: {worlds: () => ok([{id:'Survival',name:'Survival'}]), contentList: () => ok([]), search: data => {window.uiCalls.push({type:'search',data}); return ok({hits:[],total_hits:0});}},
      instances: {
        list: () => ok(instances),
        launch: data => {
          window.uiCalls.push({type:'launch',...data});
          if (window.uiLaunchError) {
            const error=window.uiLaunchError; window.uiLaunchError='';
            listeners.launch?.({instanceId:data.instanceId,state:'ERROR',message:error});
            return Promise.resolve({ok:false,error});
          }
          running=[{instanceId:data.instanceId,pids:[42],count:1}];
          listeners.launch?.({instanceId:data.instanceId,state:'RUNNING',pid:42});
          return ok({pid:42});
        },
        stop: id => {window.uiCalls.push({type:'stop',instanceId:id});running=[];listeners.launch?.({instanceId:id,state:'STOPPED',pid:42});return ok(true);},
        openFolder: id => {window.uiCalls.push({type:'folder',instanceId:id});return ok(true);},
        patch: ({instanceId,patch}) => {window.uiCalls.push({type:'instancePatch',instanceId,patch});Object.assign(instances.find(row=>row.id===instanceId),patch);return ok(instances.find(row=>row.id===instanceId));}
      },
      servers: { list: () => ok([]) },
      core: { config: id => ok(configs[id]), profiles: () => ok([]), screenshots: () => ok([]), status: () => ok({ supported: true, stagedExists: true, installedValid: true, installedVersion: '1.2.0' }), patchConfig: async ({ instanceId, patch }) => {
        let config = configs[instanceId];
        window.uiCalls.push({type:'corePatch',instanceId,patch});
        const moduleSettings = {...config.moduleSettings};
        for (const [name,values] of Object.entries(patch.moduleSettings || {})) moduleSettings[name] = {...moduleSettings[name],...values};
        config = { ...config, ...patch, moduleSettings, enabled: { ...config.enabled, ...patch.enabled }, crosshair: { ...config.crosshair, ...patch.crosshair } };
        configs[instanceId] = config;
        return ok(config);
      } }
    };
  });
  await page.goto('http://127.0.0.1:5187/#/accounts', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Skin studio' }).waitFor();
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#6ce0c0'; ctx.fillRect(0, 0, 64, 64);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.getByLabel('Skin PNG').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await page.getByRole('button', { name: 'Save to Eternal', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Skin saved' }).waitFor();
  await page.getByLabel('Skin account').selectOption('online');
  await page.getByLabel('Skin PNG').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await page.getByRole('button', { name: 'Apply to Minecraft profile', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Skin applied' }).waitFor();
  assert.deepEqual(await page.evaluate(() => window.uiCalls.filter(item => item.type === 'skin').map(item => item.accountId)), ['local', 'online']);
  await page.getByRole('link', { name: 'Servers', exact: true }).click();
  await page.getByRole('button', { name: 'Create on Aternos' }).click();
  assert.equal(await page.evaluate(() => window.uiCalls.at(-1).url), 'https://aternos.org/servers/');
  await page.getByRole('link', { name: 'Studio', exact: true }).click();
  await page.getByRole('heading', { name: 'PvP loadout' }).waitFor();
  for (const name of ['Sword', 'Mace', 'Spear', 'Crystal', 'Cart']) {
    const preset = page.locator('.combat-presets button').filter({ has: page.getByText(name, { exact: true }) });
    await preset.click(); assert.equal(await preset.getAttribute('aria-pressed'), 'true');
  }
  const output = path.resolve('build/ui-checks'); await fs.mkdir(output, { recursive: true });
  for (const [width, height] of [[1440, 900], [960, 640], [640, 480], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({ path: path.join(output, `studio-${width}.png`) });
    const size = await page.locator('.content').evaluate(el => [el.scrollWidth, el.clientWidth]);
    assert.ok(size[0] <= size[1] + 2, `Horizontal overflow at ${width}: ${size}`);
  }
  await page.setViewportSize({width:1440,height:900});
  await page.getByRole('button',{name:'ArmorDurability settings',exact:true}).click();
  await page.getByLabel('Show each armor piece').uncheck();
  await page.getByLabel('HUD scale').fill('150');
  await page.waitForFunction(() => window.uiCalls.some(x => x.type === 'corePatch' && x.patch.moduleSettings?.ArmorDurability?.scale === 150));
  assert.ok(await page.getByText('Changes apply without closing the menu.').isVisible());
  await page.screenshot({path:path.join(output,'module-settings-1440.png')});
  for (const [width,height] of [[390,844],[640,480],[960,640]]) {
    await page.setViewportSize({width,height});
    const size = await page.locator('.content').evaluate(el => [el.scrollWidth,el.clientWidth]);
    assert.ok(size[0] <= size[1]+2, `Settings overflow ${width}: ${size}`);
  }
  await page.setViewportSize({width:1440,height:900});
  await page.evaluate(() => location.hash = '#/mods');
  await page.getByRole('button',{name:'Resource Packs',exact:true}).click();
  await page.getByRole('button',{name:'Search',exact:true}).click();
  await page.waitForFunction(() => window.uiCalls.some(x => x.type === 'search' && x.data.projectType === 'resourcepack'));
  await page.getByRole('button',{name:'Datapacks',exact:true}).click();
  await page.getByLabel('Datapack world').selectOption('Survival');
  await page.getByRole('button',{name:'Shader Packs',exact:true}).click();
  await page.getByRole('button',{name:'Search',exact:true}).click();
  await page.waitForFunction(() => window.uiCalls.some(x => x.type === 'search' && x.data.projectType === 'shader'));
  await page.screenshot({path:path.join(output,'modhub-1440.png')});
  await page.evaluate(() => location.hash = '#/');
  await page.getByRole('button',{name:'Play',exact:true}).click();
  assert.equal(await page.evaluate(() => window.uiCalls.find(x => x.type === 'launch').instanceId),'one');
  await page.getByText('J: Modules / K: HUD editor', {exact:true}).waitFor();
  await page.getByRole('button',{name:'Folder',exact:true}).click();
  assert.equal(await page.evaluate(() => window.uiCalls.at(-1).instanceId), 'one');
  await page.getByRole('button',{name:'Stop',exact:true}).click();
  await page.getByRole('button',{name:'Play',exact:true}).waitFor();
  assert.equal(await page.evaluate(() => window.uiCalls.find(x => x.type === 'stop').instanceId), 'one');
  await page.evaluate(() => {window.uiLaunchError='Java 21 was not found';});
  await page.getByRole('button',{name:'Play',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'Java 21 was not found'}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Play',exact:true}).isEnabled(), true);
  await page.getByLabel('Selected instance').selectOption('two');
  await page.getByText('L: Modules / O: HUD editor', {exact:true}).waitFor();
  assert.equal(await page.getByLabel('Memory allocation').inputValue(), '8192');
  await page.getByLabel('Memory allocation').fill('4096');
  await page.getByRole('button', {name:'Save memory', exact:true}).click();
  await page.getByText('Memory saved', {exact:true}).waitFor();
  assert.deepEqual(await page.evaluate(() => window.uiCalls.filter(x => x.type === 'instancePatch')), [{type:'instancePatch',instanceId:'two',patch:{ramMb:4096}}]);
  await page.getByRole('button',{name:'Modules & settings Configure the selected instance'}).click();
  assert.equal(await page.getByLabel('Minecraft profile').inputValue(), 'two');
  await page.evaluate(() => {location.hash='#/studio?instance=one';});
  await page.waitForFunction(() => document.querySelector('select[aria-label="Minecraft profile"]')?.value === 'one');
  await page.getByLabel('Minecraft profile').selectOption('two');
  await page.getByRole('button',{name:'FPS module',exact:true}).waitFor();
  await page.evaluate(() => {window.uiUpdateCore('two',{enabled:{FPS:true}});window.dispatchEvent(new Event('focus'));});
  await page.waitForFunction(() => document.querySelector('button[aria-label="FPS module"]')?.getAttribute('aria-pressed') === 'true');
  await page.getByRole('link',{name:'Home',exact:true}).click();
  assert.equal(await page.getByLabel('Selected instance').inputValue(), 'two');
  assert.equal(await page.getByLabel('Memory allocation').inputValue(), '4096');
  for (const [width,height] of [[1440,900],[960,640],[640,480],[390,844]]) {
    await page.setViewportSize({width,height});
    await page.screenshot({path:path.join(output,`home-${width}.png`)});
    const size = await page.locator('.content').evaluate(el => [el.scrollWidth,el.clientWidth]);
    assert.ok(size[0] <= size[1]+2, `Home overflow ${width}: ${size}`);
    const bounds = await page.evaluate(() => {
      const title = document.querySelector('.titlebar').getBoundingClientRect();
      const sidebar = document.querySelector('.sidebar').getBoundingClientRect();
      const content = document.querySelector('.content').getBoundingClientRect();
      return {titleBottom:title.bottom,sidebarTop:sidebar.top,sidebarRight:sidebar.right,contentLeft:content.left,sidebarBottom:sidebar.bottom};
    });
    assert.ok(Math.abs(bounds.titleBottom-bounds.sidebarTop) <= 1, `Sidebar displaced at ${width}: ${JSON.stringify(bounds)}`);
    assert.ok(bounds.sidebarRight <= bounds.contentLeft+1, `Sidebar overlaps content at ${width}`);
    assert.ok(bounds.sidebarBottom <= height+1, `Sidebar clipped at ${width}`);
    await page.getByRole('link', {name:'Settings',exact:true}).scrollIntoViewIfNeeded();
    assert.ok(await page.getByRole('link', {name:'Settings',exact:true}).isVisible());
  }
  await page.setViewportSize({width:1440,height:900});
  assert.ok(parseFloat(await page.locator('.sidebar .nav-icon span').first().evaluate(el => getComputedStyle(el).fontSize)) >= 12);
  await page.evaluate(() => location.hash = '#/core');
  await page.getByRole('heading', {name:'Eternal Core',exact:true}).waitFor();
  await page.screenshot({path:path.join(output,'core-1440.png')});
  assert.equal(await page.getByText('240', {exact:true}).count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS: launch/stop/error recovery, per-instance memory, shared profile selection, live config refresh, skins, presets, and four viewport layouts.');
} finally { await browser?.close(); await server.close(); }
