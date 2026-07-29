/* =====================================================================
   menu.js — capçalera (vidre en scroll) + menú mòbil
   ===================================================================== */

export function initHeader() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  // En pàgines sense hero (interiors), la capçalera és sempre sòlida (vidre).
  const hasHero = document.querySelector('.hero');
  if (!hasHero) {
    header.classList.add('is-scrolled');
    return;
  }

  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

export function initMobileNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (!toggle || !nav) return;

  const close = () => {
    nav.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    nav.classList.add('is-open');
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
  };

  toggle.addEventListener('click', () => {
    nav.classList.contains('is-open') ? close() : open();
  });

  // Tancar en clicar un enllaç o prémer Escape
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}
