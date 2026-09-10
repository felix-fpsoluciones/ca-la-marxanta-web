/* =====================================================================
   main.js — orquestrador
   ===================================================================== */
import { initHeader, initMobileNav } from './menu.js';
import { initReveal } from './animations.js';

/* Normalitza per cercar sense accents ni majúscules */
const plain = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/* Frases que escriu el JavaScript. Les posa el generador a cada pàgina
   (window.CLM_TXT), així surten en l'idioma de la pàgina. El text de reserva
   és el català, per si algú obre un HTML antic sense aquesta línia.
   tx('buit_titol', { lloc: 'Girona' }) → "Encara no ens trobaràs a Girona" */
const RESERVA = {
  buit_titol: 'Encara no ens trobaràs a {lloc}',
  buit_titol_sense: 'Encara no ens hi trobaràs',
  barri_titol: 'Quina botiga de {zona} hi encaixaria?',
  barri_lead: "Encara no ens trobes a {zona}, i ens hi agradaria arribar. Digues-nos quina botiga hi encaixaria i hi anirem a trucar de part teva.",
  enviant: 'Enviant…',
  camp_obligatori: 'Aquest camp és obligatori',
  correu_invalid: 'Introdueix un correu vàlid',
  success_lloc: ' de {lloc}'
};
const tx = (clau, valors) => {
  const font = (typeof window !== 'undefined' && window.CLM_TXT) || {};
  let s = font[clau] || RESERVA[clau] || '';
  for (const k in valors) s = s.split('{' + k + '}').join(valors[k]);
  return s;
};

function initShopFilters() {
  const filters = document.querySelector('[data-filters]');
  if (!filters) return;
  const shops = [...document.querySelectorAll('.shop')];
  const search = document.querySelector('[data-search]');
  const empty = document.querySelector('[data-empty]');
  const title = empty && empty.querySelector('[data-empty-title]');
  const cta = empty && empty.querySelector('[data-empty-cta]');
  const ctaHref = cta && cta.getAttribute('href');

  let zone = 'tots';
  let zoneName = '';

  function apply() {
    const q = plain(search ? search.value.trim() : '');
    let visible = 0;
    shops.forEach((s) => {
      const okZone = zone === 'tots' || s.dataset.zone === zone;
      const okText = !q || plain(s.textContent).includes(q);
      s.hidden = !(okZone && okText);
      if (!s.hidden) visible++;
    });
    if (!empty) return;
    empty.hidden = visible > 0;
    if (visible > 0) return;
    // Sense resultats: la invitació pren el nom que ha escrit (o la zona triada)
    const lloc = search && search.value.trim() ? search.value.trim() : zoneName;
    if (title) title.textContent = lloc ? tx('buit_titol', { lloc }) : tx('buit_titol_sense');
    if (cta && ctaHref) cta.setAttribute('href', lloc ? `${ctaHref}?zona=${encodeURIComponent(lloc)}` : ctaHref);
  }

  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter');
    if (!btn) return;
    zone = btn.dataset.zone;
    zoneName = zone === 'tots' ? '' : btn.textContent.trim();
    filters.querySelectorAll('.filter').forEach((f) => f.classList.toggle('is-active', f === btn));
    apply();
  });

  if (search) search.addEventListener('input', apply);
}

function initBarriPrefill() {
  const input = document.querySelector('form[data-form="barri"] [name="barri"]');
  if (!input) return;
  const zona = new URLSearchParams(location.search).get('zona');
  if (!zona) return;
  input.value = zona;
  const title = document.querySelector('[data-barri-title]');
  const lead = document.querySelector('[data-barri-lead]');
  if (title) title.textContent = tx('barri_titol', { zona });
  if (lead) lead.textContent = tx('barri_lead', { zona });
}

/* Mode demostració: en local i a GitHub Pages no hi ha servidor de formularis,
   així que mostrem la targeta sense enviar res (val per ensenyar el disseny).
   A Netlify, en canvi, fem un POST real i només aleshores donem les gràcies. */
const MODE_DEMO = ['localhost', '127.0.0.1', ''].includes(location.hostname)
  || location.hostname.endsWith('.github.io');

function initForms() {
  document.querySelectorAll('form[data-form]').forEach((form) => {
    const success = document.querySelector(`#${form.dataset.form}-success`);
    const btn = form.querySelector('button[type="submit"]');
    const btnText = btn && btn.textContent;
    const error = form.querySelector('[data-form-error]');

    /* Únic afegit al text: el barri o població que ha escrit l'usuari.
       Si no n'ha posat cap, la frase queda tal com és. */
    function personalitzaGracies() {
      if (!success) return;
      const slot = success.querySelector('[data-success-lloc]');
      const lloc = (form.querySelector('[name="barri"]') || {}).value;
      if (slot && lloc && lloc.trim()) slot.textContent = tx('success_lloc', { lloc: lloc.trim() });
    }

    function mostraGracies() {
      personalitzaGracies();
      form.hidden = true;
      if (!success) return;
      success.classList.add('is-visible');
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async function envia() {
      if (MODE_DEMO) { mostraGracies(); return; }
      if (error) error.hidden = true;
      if (btn) { btn.disabled = true; btn.textContent = tx('enviant'); }
      try {
        const res = await fetch(form.getAttribute('action') || location.pathname, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString()
        });
        if (!res.ok) throw new Error(res.status);
        mostraGracies();
      } catch (err) {
        // No perdem el missatge en silenci: oferim una alternativa
        if (error) error.hidden = false;
        else alert("No hem pogut enviar el formulari. Escriu-nos a info@calamarxanta.com.");
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = btnText; }
      }
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      // Validació bàsica de camps requerits
      form.querySelectorAll('[required]').forEach((input) => {
        const field = input.closest('.field, .consent');
        const valid = input.type === 'checkbox' ? input.checked : input.value.trim() !== '';
        if (field) field.classList.toggle('field--invalid', !valid);
        const err = field && field.querySelector('.field__error');
        if (err) err.textContent = valid ? '' : tx('camp_obligatori');
        if (!valid) ok = false;
      });
      // Email
      const email = form.querySelector('input[type="email"]');
      if (email && email.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
        ok = false;
        const f = email.closest('.field');
        f && f.classList.add('field--invalid');
        const err = f && f.querySelector('.field__error');
        if (err) err.textContent = tx('correu_invalid');
      }
      if (!ok) return;
      envia();
    });
  });
}

function boot() {
  initHeader();
  initMobileNav();
  initReveal();
  initShopFilters();
  initBarriPrefill();
  initForms();
  // Any de copyright dinàmic
  const y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
