(() => {
  'use strict';

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer:fine)').matches;
  const nav = document.querySelector('[data-nav]');
  const progress = document.querySelector('[data-scroll-progress]');

  const onScroll = () => {
    nav?.classList.toggle('scrolled', scrollY > 18);
    if (progress) {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      progress.style.width = `${Math.min(100, Math.max(0, (scrollY / max) * 100))}%`;
    }
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  const reveals = [...document.querySelectorAll('.reveal')];
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -54px' });
    reveals.forEach(el => revealObserver.observe(el));
  }

  const hero = document.querySelector('.hero-section');
  const heroMedia = document.querySelector('.hero-media');
  if (!reduceMotion && finePointer && hero && heroMedia) {
    let frame = 0;
    hero.addEventListener('pointermove', event => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        heroMedia.style.transform = `scale(1.045) translate3d(${x * -12}px,${y * -9}px,0)`;
      });
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { heroMedia.style.transform = 'scale(1.02)'; });
  }

  if (!reduceMotion && finePointer) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      let frame = 0;
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          card.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${y * -4}deg) translateY(-5px)`;
        });
      }, { passive: true });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });

    document.querySelectorAll('[data-tilt-soft]').forEach(stage => {
      const target = stage.querySelector('.product-window') || stage;
      let frame = 0;
      stage.addEventListener('pointermove', event => {
        const rect = stage.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          target.style.transform = `perspective(1600px) rotateY(${-5 + x * 3.5}deg) rotateX(${1.8 - y * 2.2}deg) translateY(${-Math.abs(x) * 3}px)`;
        });
      }, { passive: true });
      stage.addEventListener('pointerleave', () => { target.style.transform = ''; });
    });
  }

  document.querySelectorAll('[data-copy]').forEach(copyButton => {
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(copyButton.dataset.copy || '');
        const toastEl = document.getElementById('copyToast');
        if (toastEl && window.bootstrap) bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 1800 }).show();
      } catch (_) {}
    });
  });

  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('.navbar .nav-link[href^="#"]')];
  if ('IntersectionObserver' in window && sections.length && navLinks.length) {
    const sectionObserver = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`));
    }, { rootMargin: '-34% 0px -56%', threshold: [0.01, 0.15, 0.35] });
    sections.forEach(section => sectionObserver.observe(section));
  }



  // Premium pointer spotlight for cards and panels.
  if (!reduceMotion && finePointer) {
    document.querySelectorAll('.premium-frame,.member-card,.glass-feature,.rank-card,.story-card,.system-shell,.download-shell,.gallery-panel').forEach(el => {
      el.addEventListener('pointermove', event => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
        el.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
      }, { passive: true });
    });
  }

  // Real image lightbox: only opens actual generated artwork files.
  const artModalEl = document.getElementById('artModal');
  if (artModalEl && window.bootstrap) {
    const artModal = bootstrap.Modal.getOrCreateInstance(artModalEl);
    const artImage = artModalEl.querySelector('[data-art-image]');
    const artTitle = artModalEl.querySelector('[data-art-title]');
    document.querySelectorAll('[data-lightbox]').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const src = trigger.dataset.lightbox;
        if (!src) return;
        artImage.src = src;
        artImage.alt = trigger.dataset.lightboxTitle || 'Eternal artwork';
        artTitle.textContent = trigger.dataset.lightboxTitle || 'Eternal artwork';
        artModal.show();
      });
    });
    artModalEl.addEventListener('hidden.bs.modal', () => { artImage.src = ''; });
  }

  // Magnetic feel for primary actions without moving layout.
  if (!reduceMotion && finePointer) {
    document.querySelectorAll('.btn-eternal,.nav-btn-red').forEach(button => {
      button.addEventListener('pointermove', event => {
        const rect = button.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - .5) * 7;
        const y = ((event.clientY - rect.top) / rect.height - .5) * 5;
        button.style.transform = `translate3d(${x}px,${y}px,0)`;
      }, { passive: true });
      button.addEventListener('pointerleave', () => { button.style.transform = ''; });
    });
  }

  const fallback = {
    version: 'v1.1.0',
    installer: 'https://github.com/1x1x1x1x1-Ammar/Eternal-Client/releases/download/v1.1.0/Eternal.Client.Setup.1.1.0.exe',
    core: 'https://github.com/1x1x1x1x1-Ammar/Eternal-Client/releases/download/v1.1.0/Eternal-Core-Standalone-1.1.0.jar'
  };

  const applyRelease = (version, installer, core) => {
    document.querySelectorAll('[data-release-version]').forEach(el => { el.textContent = version; });
    document.querySelectorAll('#hero-download,#download-installer').forEach(el => { el.href = installer; });
    document.querySelectorAll('#core-download,#download-core').forEach(el => { el.href = core; });
  };
  applyRelease(fallback.version, fallback.installer, fallback.core);

  fetch('https://api.github.com/repos/1x1x1x1x1-Ammar/Eternal-Client/releases/latest', { headers: { Accept: 'application/vnd.github+json' } })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (!data) return;
      const exe = data.assets?.find(asset => /Eternal\.Client\.Setup\..*\.exe$/i.test(asset.name));
      const jar = data.assets?.find(asset => /Eternal-Core-Standalone-.*\.jar$/i.test(asset.name));
      applyRelease(data.tag_name || fallback.version, exe?.browser_download_url || fallback.installer, jar?.browser_download_url || fallback.core);
    })
    .catch(() => {});
})();
