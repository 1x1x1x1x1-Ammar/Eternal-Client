const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const fallback = {
  version: 'v1.1.0',
  releaseUrl: 'https://github.com/1x1x1x1x1-Ammar/Eternal-Client/releases/tag/v1.1.0',
  installer: 'https://github.com/1x1x1x1x1-Ammar/Eternal-Client/releases/download/v1.1.0/Eternal.Client.Setup.1.1.0.exe',
  core: 'https://github.com/1x1x1x1x1-Ammar/Eternal-Client/releases/download/v1.1.0/Eternal-Core-Standalone-1.1.0.jar',
  checksums: 'https://github.com/1x1x1x1x1-Ammar/Eternal-Client/releases/download/v1.1.0/SHA256SUMS.txt',
  date: 'September 17, 2026',
  installerSize: '~113 MB',
  coreSize: '~90 KB'
};

function bytes(value) {
  if (!Number.isFinite(value) || value <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const amount = value / 1024 ** exponent;
  return `${amount >= 100 || exponent === 0 ? amount.toFixed(0) : amount.toFixed(1)} ${units[exponent]}`;
}

function setHref(selector, href) {
  if (!href) return;
  $$(selector).forEach(node => { node.href = href; });
}

function applyRelease(data) {
  $$('[data-release-version]').forEach(node => { node.textContent = data.version; });
  $$('[data-release-date]').forEach(node => { node.textContent = data.date; });

  setHref('#hero-download, #download-installer, #final-download', data.installer);
  setHref('#core-download, #download-core', data.core);
  setHref('#checksums-link', data.checksums);
  setHref('#release-link, #footer-release', data.releaseUrl);

  const installerSize = $('#installer-size');
  const coreSize = $('#core-size');
  if (installerSize && data.installerSize) installerSize.textContent = data.installerSize;
  if (coreSize && data.coreSize) coreSize.textContent = data.coreSize;
}

async function loadLatestRelease() {
  applyRelease(fallback);
  try {
    const response = await fetch('https://api.github.com/repos/1x1x1x1x1-Ammar/Eternal-Client/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' }
    });
    if (!response.ok) return;
    const release = await response.json();
    const installer = release.assets?.find(asset => /Eternal\.Client\.Setup\..*\.exe$/i.test(asset.name));
    const core = release.assets?.find(asset => /Eternal-Core-Standalone-.*\.jar$/i.test(asset.name));
    const checksums = release.assets?.find(asset => asset.name === 'SHA256SUMS.txt');
    const version = release.tag_name || fallback.version;
    const date = release.published_at
      ? new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(release.published_at))
      : fallback.date;

    applyRelease({
      version,
      releaseUrl: release.html_url || fallback.releaseUrl,
      installer: installer?.browser_download_url || fallback.installer,
      core: core?.browser_download_url || fallback.core,
      checksums: checksums?.browser_download_url || fallback.checksums,
      date,
      installerSize: installer ? bytes(installer.size) : fallback.installerSize,
      coreSize: core ? bytes(core.size) : fallback.coreSize
    });
  } catch {
    // The fallback is intentionally complete so the site remains usable when GitHub is unavailable or rate limited.
  }
}

function setupReveal() {
  const nodes = $$('.reveal');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    nodes.forEach(node => node.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -32px' });

  nodes.forEach(node => observer.observe(node));
}

function setupExperienceTabs() {
  const buttons = $$('.experience-tabs button');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const view = button.dataset.view;
      buttons.forEach(item => item.classList.toggle('active', item === button));
      $$('[data-copy]').forEach(node => node.classList.toggle('hidden', node.dataset.copy !== view));
      $$('[data-screen]').forEach(node => node.classList.toggle('hidden', node.dataset.screen !== view));
    });
  });
}

function setupFeatureTabs() {
  const buttons = $$('.feature-tab');
  const panels = $$('[data-feature-panel]');
  if (!buttons.length || !panels.length) return;

  const activate = feature => {
    buttons.forEach(button => {
      const active = button.dataset.feature === feature;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    panels.forEach(panel => panel.classList.toggle('hidden', panel.dataset.featurePanel !== feature));
  };

  buttons.forEach((button, index) => {
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(button.classList.contains('active')));
    button.addEventListener('click', () => activate(button.dataset.feature));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const next = buttons[(index + direction + buttons.length) % buttons.length];
      next.focus();
      activate(next.dataset.feature);
    });
  });
}

function setupMobileMenu() {
  const button = $('.menu-button');
  const menu = $('.mobile-nav');
  if (!button || !menu) return;

  const close = () => {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    button.setAttribute('aria-expanded', 'false');
  };

  button.addEventListener('click', () => {
    const open = !menu.classList.contains('open');
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    button.setAttribute('aria-expanded', String(open));
  });
  $$('.mobile-nav a').forEach(link => link.addEventListener('click', close));
  addEventListener('resize', () => { if (innerWidth > 860) close(); });
  addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
}

function setupCursorGlow() {
  const glow = $('.cursor-glow');
  if (!glow || matchMedia('(pointer: coarse)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let frame = 0;
  addEventListener('pointermove', event => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      glow.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0)`;
      glow.style.opacity = '1';
    });
  }, { passive: true });
  addEventListener('pointerleave', () => { glow.style.opacity = '0'; });
}

function setupShowcaseMotion() {
  const stage = $('.dawn-launcher-showcase');
  const windowNode = $('.dawn-window');
  if (!stage || !windowNode || matchMedia('(pointer: coarse)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let frame = 0;
  const reset = () => {
    windowNode.style.transform = 'perspective(1500px) rotateX(4deg) rotateY(0deg) translateY(0px)';
  };

  stage.addEventListener('pointermove', event => {
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const rotateY = x * 5;
      const rotateX = 4 - y * 3;
      windowNode.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${-Math.abs(x) * 2}px)`;
    });
  }, { passive: true });
  stage.addEventListener('pointerleave', reset);
}

function setupHeader() {
  const header = $('.site-header');
  if (!header) return;
  const update = () => header.classList.toggle('scrolled', scrollY > 24);
  update();
  addEventListener('scroll', update, { passive: true });
}

function setupFaq() {
  $$('.faq-list details').forEach(detail => {
    detail.addEventListener('toggle', () => {
      if (!detail.open) return;
      $$('.faq-list details').forEach(other => {
        if (other !== detail) other.open = false;
      });
    });
  });
}

function setupDownloadTelemetry() {
  ['#hero-download', '#download-installer', '#download-core', '#core-download', '#final-download'].forEach(selector => {
    $$(selector).forEach(link => {
      link.addEventListener('click', () => { link.dataset.clicked = 'true'; }, { passive: true });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadLatestRelease();
  setupReveal();
  setupExperienceTabs();
  setupFeatureTabs();
  setupMobileMenu();
  setupCursorGlow();
  setupShowcaseMotion();
  setupHeader();
  setupFaq();
  setupDownloadTelemetry();
});
