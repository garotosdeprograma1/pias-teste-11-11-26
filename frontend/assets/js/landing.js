(function () {
  'use strict';

  /* ====== THEME ====== */
  const html = document.documentElement;
  const themeBtn = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('dafix_theme') || localStorage.getItem('lp-theme') || 'light';
  html.setAttribute('data-theme', savedTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('dafix_theme', next);
    });
  }

  /* ====== HEADER SCROLL ====== */
  const header = document.getElementById('lp-header');
  const onScroll = () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ====== SMOOTH SCROLL ====== */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        closeMobileMenu();
      }
    });
  });

  /* ====== MOBILE MENU ====== */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const mobileClose = document.getElementById('mobile-close');

  function openMobileMenu() {
    mobileMenu.classList.add('is-open');
    mobileOverlay.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    mobileOverlay.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    mobileMenu.classList.remove('is-open');
    mobileOverlay.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileOverlay.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (hamburger) hamburger.addEventListener('click', openMobileMenu);
  if (mobileClose) mobileClose.addEventListener('click', closeMobileMenu);
  window.addEventListener('resize', () => { if (innerWidth > 1024 && mobileMenu?.classList.contains('is-open')) closeMobileMenu(); });
  if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileMenu);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMobileMenu();
  });

  /* ====== INTERSECTION OBSERVER (reveal) ====== */
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  /* ====== ANIMATED COUNTERS ====== */
  function animateCounter(el) {
    const target = parseInt(el.dataset.counter, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const start = performance.now();
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(ease * target);
      const formatted = value >= 1000 ? (value / 1000).toFixed(1).replace('.0', '') + 'k' : String(value);
      el.textContent = formatted + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const counterEls = document.querySelectorAll('[data-counter]');
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counterEls.forEach(el => cio.observe(el));
  } else {
    counterEls.forEach(el => {
      el.textContent = el.dataset.counter + (el.dataset.suffix || '');
    });
  }

  /* ====== TESTIMONIALS CAROUSEL ====== */
  const inner = document.getElementById('testimonials-inner');
  const dotsContainer = document.getElementById('t-dots');
  const prevBtn = document.getElementById('t-prev');
  const nextBtn = document.getElementById('t-next');

  if (inner) {
    const cards = Array.from(inner.querySelectorAll('.testimonial-card'));
    let current = 0;
    let autoTimer = null;
    const visible = () => window.innerWidth < 768 ? 1 : window.innerWidth < 1200 ? 2 : 3;

    function buildDots() {
      if (!dotsContainer) return;
      const total = Math.ceil(cards.length / visible());
      dotsContainer.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('button');
        dot.className = 't-dot' + (i === Math.floor(current / visible()) ? ' active' : '');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Ir para o depoimento ' + (i + 1));
        dot.addEventListener('click', () => goTo(i * visible()));
        dotsContainer.appendChild(dot);
      }
    }

    function updateDots() {
      if (!dotsContainer) return;
      const idx = Math.floor(current / visible());
      dotsContainer.querySelectorAll('.t-dot').forEach((d, i) => {
        d.classList.toggle('active', i === idx);
      });
    }

    function goTo(idx) {
      const max = cards.length - visible();
      current = Math.max(0, Math.min(idx, max));
      const cardWidth = cards[0].offsetWidth + 24;
      inner.style.transform = `translateX(-${current * cardWidth}px)`;
      cards.forEach((c, i) => c.classList.toggle('active', i === current));
      updateDots();
    }

    function next() { goTo(current + visible() >= cards.length ? 0 : current + 1); }
    function prev() { goTo(current === 0 ? cards.length - visible() : current - 1); }

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(next, 5000);
    }
    function stopAuto() { clearInterval(autoTimer); }

    if (prevBtn) prevBtn.addEventListener('click', () => { stopAuto(); prev(); startAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { stopAuto(); next(); startAuto(); });

    inner.addEventListener('mouseenter', stopAuto);
    inner.addEventListener('mouseleave', startAuto);

    let touchStartX = 0;
    inner.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; stopAuto(); }, { passive: true });
    inner.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
      startAuto();
    }, { passive: true });

    buildDots();
    startAuto();
    window.addEventListener('resize', () => { buildDots(); goTo(0); }, { passive: true });
  }

  /* ====== FAQ ACCORDION ====== */
  document.querySelectorAll('.faq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const answer = document.getElementById(btn.getAttribute('aria-controls'));
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        openItem.classList.remove('open');
        const ob = openItem.querySelector('.faq-btn');
        const oa = openItem.querySelector('.faq-answer');
        if (ob) ob.setAttribute('aria-expanded', 'false');
        if (oa) {
          oa.style.maxHeight = '0';
          oa.removeAttribute('hidden');
        }
      });

      if (!isOpen && answer) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        answer.removeAttribute('hidden');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // Initialize FAQ answers (collapsed)
  document.querySelectorAll('.faq-answer').forEach(a => {
    a.style.maxHeight = '0';
  });

  /* ====== SCROLL PROGRESS BAR ====== */
  const scrollProgress = document.getElementById('scrollProgress');
  if (scrollProgress) {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      scrollProgress.style.transform = 'scaleX(' + Math.min(1, Math.max(0, pct / 100)) + ')';
    };
    let progressFrame = 0;
    window.addEventListener('scroll', () => { if (!progressFrame) progressFrame = requestAnimationFrame(() => { progressFrame = 0; updateProgress(); }); }, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  /* ====== SERVICE CARD keyboard support ====== */
  document.querySelectorAll('.service-card[tabindex]').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.querySelector('.svc-btn')?.click();
      }
    });
  });

  /* ====== CTA BUTTONS scroll tracking ====== */
  document.querySelectorAll('.svc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = document.getElementById('solicitar');
      if (section) {
        const top = section.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      }
    });
  });

})();
