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
    let config = { enabled: {}, combatPreset: 'sword', positions: {}, hudAlpha: 196, accentColor: -53192, zoomFov: 30, zoomSpeed: 5, snap: 4, crosshair: { color: -1, gap: 3, length: 5, thickness: 1 }, smoothZoom: true };
    window.uiCalls = [];
    window.eternal = {
      on: Object.fromEntries(['account', 'launch', 'download', 'operation', 'update', 'app'].map(key => [key, () => () => {}])),
      accounts: { list: () => ok({ accounts, activeId: 'local' }), skin: async data => {
        window.uiCalls.push({ type: 'skin', ...data });
        accounts.find(item => item.id === data.accountId).skinUrl = data.reset ? '' : data.dataUrl;
        return ok(true);
      } },
      app: { state: () => ok({ version: '1.1.0', running: [] }), openExternal: url => { window.uiCalls.push({ type: 'external', url }); return ok(true); } },
      settings: { get: () => ok({ reducedMotion: true }) },
      instances: { list: () => ok([{ id: 'one', name: 'PvP', loader: 'fabric', minecraftVersion: '1.21.11' }]) },
      servers: { list: () => ok([]) },
      core: { config: () => ok(config), profiles: () => ok([]), screenshots: () => ok([]), status: () => ok({ supported: true }), patchConfig: async ({ patch }) => {
        config = { ...config, ...patch, enabled: { ...config.enabled, ...patch.enabled }, crosshair: { ...config.crosshair, ...patch.crosshair } };
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
  assert.deepEqual(errors, []);
  console.log('PASS: skin account routing, skin preview, Aternos link, five presets, four viewport layouts.');
} finally { await browser?.close(); await server.close(); }
