/* ============================================================
   DaFix · Área Pública — script.js
   Shared across home / servicos / institucional
   ============================================================ */

'use strict';

/* ── GLOBALS ── */
let DATA = null;
const PAGE = document.body.dataset.page;
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   THEME
   ============================================================ */
const Theme = (() => {
  const key = 'dafix_theme';
  const html = document.documentElement;
  let current = localStorage.getItem(key) || localStorage.getItem('dafix-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  function apply(t) {
    current = t;
    html.setAttribute('data-theme', t);
    localStorage.setItem(key, t);
  }

  function toggle() {
    apply(current === 'light' ? 'dark' : 'light');
  }

  apply(current);

  document.addEventListener('DOMContentLoaded', () => {
    const btn = $('#themeToggle');
    if (btn) btn.addEventListener('click', toggle);
  });

  return { apply, toggle, get: () => current };
})();

/* ============================================================
   HEADER — sticky + scroll
   ============================================================ */
function initHeader() {
  const header = $('#header');
  const progress = $('#scrollProgress');
  if (!header) return;

  const update = () => {
    const scrolled = window.scrollY > 12;
    header.classList.toggle('scrolled', scrolled);

    if (progress) {
      const scrollTop = window.scrollY;
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (docH > 0 ? Math.min(1, Math.max(0, scrollTop / docH)) : 0) + ')';
    }
  };

  let frame = 0;
  window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); }); }, { passive: true });
  window.addEventListener('resize', update);
  update();
}

/* ============================================================
   MOBILE MENU
   ============================================================ */
function initMobileMenu() {
  const btn = $('#hamburger');
  const menu = $('#mobileMenu');
  if (!btn || !menu) return;

  let open = false;

  function setOpen(val) {
    open = val;
    btn.classList.toggle('is-open', open);
    menu.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  btn.addEventListener('click', () => setOpen(!open));
  window.addEventListener('resize', () => { if (innerWidth > 1024 && open) setOpen(false); });

  document.addEventListener('click', e => {
    if (open && !menu.contains(e.target) && !btn.contains(e.target)) setOpen(false);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && open) { setOpen(false); btn.focus(); }
  });

  $$('.nav-link', menu).forEach(a => a.addEventListener('click', () => setOpen(false)));
}

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
function initReveal() {
  const classes = ['reveal', 'reveal-left', 'reveal-right', 'reveal-scale'];
  const targets = $$(classes.map(c => '.' + c).join(','));
  if (!targets.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(el => observer.observe(el));
}

/* ============================================================
   COUNTER ANIMATION
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initHeader(); initMobileMenu(); initReveal();
  document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale').forEach(el=>el.classList.add('visible'));
  const input=document.getElementById('heroSearch');
  const search=()=>{location.href='/publico/servicos.html?q='+encodeURIComponent(input?.value || '')};
  document.getElementById('heroSearchBtn')?.addEventListener('click',event=>{event.preventDefault();search()});
  input?.addEventListener('keydown',event=>{if(event.key==='Enter')search()});
});
