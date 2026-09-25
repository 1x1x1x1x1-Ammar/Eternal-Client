// Optional browser check: PLAYWRIGHT_MODULE and CHROMIUM_PATH can select local installs.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve('website');
const output = path.resolve('build/website-checks');
const types = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.webp':'image/webp' };
const server = http.createServer(async (req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try { res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(await fs.readFile(file)); }
  catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
await fs.mkdir(output, { recursive:true });
const browser = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH || undefined, args:['--no-sandbox'] });
const errors = [];
try {
  for (const width of [1440, 960, 390, 320]) {
    const page = await browser.newPage({ viewport:{ width, height:900 }, reducedMotion:'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://api.github.com/**', route => route.fulfill({ status:503, body:'offline' }));
    for (const name of ['index', 'client']) {
      await page.goto(`${base}/${name}.html`, { waitUntil:'networkidle' });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false, `${name} overflow at ${width}`);
      assert.deepEqual(await page.locator('img[src]').evaluateAll(images => images.filter(image => !image.complete || !image.naturalWidth).map(image => image.src)), []);
      if (width === 1440 || width === 390) await page.screenshot({ path:`${output}/${name}-${width}.png` });
      if (name === 'client') {
        for (const preset of ['sword','mace','spear','crystal','cart']) {
          await page.locator(`[data-preset="${preset}"]`).click();
          assert.equal((await page.locator('#preset-name').textContent()).toLowerCase(), preset);
          assert.equal(await page.locator('[data-preset][aria-pressed="true"]').count(), 1);
        }
        assert.match(await page.locator('#download-core').getAttribute('href'), /v1\.1\.1\/Eternal-Core-Standalone-1\.1\.1\.jar$/);
        const faq = page.locator('details').last();
        await faq.locator('summary').click();
        assert.equal(await faq.getAttribute('open'), '');
        if (width === 390) {
          await page.locator('.navbar-toggler').click();
          await page.locator('.mobile-links a[href="#download"]').click();
          await page.waitForFunction(() => !document.getElementById('mobileNav').classList.contains('show'));
          await page.waitForFunction(() => location.hash === '#download');
          assert.ok(await page.locator('#download').evaluate(el => Math.abs(el.getBoundingClientRect().top) < 200));
        }
        await page.locator('[data-lightbox]').first().click();
        await page.waitForFunction(() => document.getElementById('artModal').classList.contains('show'));
        assert.match(await page.locator('[data-art-image]').getAttribute('src'), /studio-preview.webp$/);
        await page.locator('#artModal .btn-close').click();
        if (width === 1440) {
          await page.locator('#loadouts').scrollIntoViewIfNeeded();
          await page.screenshot({ path:`${output}/loadouts-${width}.png` });
        }
      }
    }
    await page.close();
  }
  // A partial release must not put a new version label on an older JAR.
  const page = await browser.newPage();
  const releaseRoot = 'https://github.com/1x1x1x1x1-Ammar/Eternal-Client/releases/download/v9.0.0/';
  const exe = { name:'Eternal.Client.Setup.9.0.0.exe', browser_download_url:releaseRoot + 'Eternal.Client.Setup.9.0.0.exe' };
  const jar = { name:'Eternal-Core-Standalone-9.0.0.jar', browser_download_url:releaseRoot + 'Eternal-Core-Standalone-9.0.0.jar' };
  let assets = [exe];
  await page.route('https://api.github.com/**', route => route.fulfill({ json:{ tag_name:'v9.0.0', assets } }));
  await page.goto(`${base}/client.html`, { waitUntil:'networkidle' });
  assert.equal(await page.locator('[data-release-version]').first().textContent(), 'v1.1.1');
  assets = [exe, jar];
  await page.reload({ waitUntil:'networkidle' });
  assert.equal(await page.locator('[data-release-version]').first().textContent(), 'v9.0.0');
  assert.equal(await page.locator('#download-core').getAttribute('href'), jar.browser_download_url);
  await page.close();
  const noJs = await browser.newPage({ javaScriptEnabled:false });
  await noJs.goto(`${base}/client.html`);
  assert.equal(await noJs.locator('h1').evaluate(el => getComputedStyle(el.parentElement).opacity), '1');
  assert.match(await noJs.locator('#download-installer').getAttribute('href'), /1\.1\.1\.exe$/);
  assert.deepEqual(errors, []);
  console.log('Website checks passed: 4 viewports, 2 pages, presets, navigation, lightbox, FAQ, release fallback/update and no-JS content.');
} finally {
  await browser.close();
  server.close();
}
