/* =====================================================================
   build-pages.mjs — genera la pàgina de col·lecció i les 9 fitxes
   a partir de data/productes.json. Sense dependències.
   Ús:  node build/build-pages.mjs
   ===================================================================== */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(join(ROOT, 'data', 'productes.json'), 'utf8'));
const venda = JSON.parse(await readFile(join(ROOT, 'data', 'punts-venda.json'), 'utf8'));
const legals = JSON.parse(await readFile(join(ROOT, 'data', 'legals.json'), 'utf8'));
const recos = JSON.parse(await readFile(join(ROOT, 'data', 'recomanacions.json'), 'utf8'));
/* --- Idiomes ---
   El català viu a l'arrel (és l'original i el domini és català); el castellà i
   l'anglès, a /es/ i /en/. Les funcions de pàgina llegeixen T i R, que canvien
   a cada volta del bucle final. */
const IDIOMES = ['ca', 'es', 'en'];
const TEXTOS = {};
for (const codi of IDIOMES) {
  TEXTOS[codi] = JSON.parse(await readFile(join(ROOT, 'data', `textos.${codi}.json`), 'utf8'));
}
let T = TEXTOS.ca;      // textos de l'idioma que s'està generant
let R = T.rutes;        // carpetes de secció d'aquest idioma
let SUB = '';           // salt extra fins a l'arrel del lloc: '' al català, '../' a la resta

/* Dos camins diferents, i és important no confondre'ls:
   · p            → arrel DE L'IDIOMA. Per als enllaços entre seccions.
   · arrelLloc(p) → arrel DEL LLOC. Per al CSS, el JavaScript i les imatges,
                    que són compartits i viuen fora de /es/ i /en/.
   Es queden relatius a posta: així el web funciona igual a l'arrel d'un domini
   que dins d'un subdirectori, com ara a GitHub Pages. */
const arrelLloc = (p) => p + SUB;

/* Domini final del web. Mentre no hi sigui, els enllaços entre idiomes van
   relatius (funcionen igual al navegador i el web es pot moure de lloc). Quan
   el domini estigui en marxa, generar amb:
     SITE=https://www.carquinyolisdhorta.com node build/build-pages.mjs
   i les etiquetes hreflang sortiran amb l'adreça completa, que és el que
   recomana Google. */
const SITE = process.env.SITE || '';

/* Adreça d'aquesta mateixa pàgina en un altre idioma.
   `pagina` diu quina pàgina és; sense això no sabríem a quina equivalent anar
   (les carpetes canvien de nom a cada idioma: colleccio / coleccion / collection). */
function urlIdioma(p, codi, pagina) {
  const rutes = TEXTOS[codi].rutes;
  const carpeta = codi === 'ca' ? '' : `${codi}/`;
  const base = SITE ? `${SITE}/${carpeta}` : arrelLloc(p) + carpeta;
  const tipus = pagina && pagina.tipus;
  if (tipus === 'seccio') return `${base}${rutes[pagina.clau]}/`;
  if (tipus === 'producte') return `${base}${rutes.colleccio}/${pagina.slug}/`;
  if (tipus === 'legal') {
    const lp = legals.pages.find((x) => x.slug === pagina.slug);
    const slug = codi === 'ca' ? lp.slug : (lp[`slug_${codi}`] || lp.slug);
    return `${base}${rutes.legal}/${slug}/`;
  }
  return `${base}index.html`;   // portada (i qualsevol cas no previst)
}

const familyById = Object.fromEntries(data.families.map((f) => [f.id, f]));

/* Text d'un producte o família en l'idioma actual. L'original és el català;
   si encara no hi ha traducció d'un camp, es queda el català abans que buit. */
const tp = (obj, camp) => (obj[`${camp}_${T.codi}`] ?? obj[camp]);
const majuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* Carpeta d'una pàgina legal en l'idioma actual. La clau és sempre el slug
   català, que fa d'identificador: /legal/avis-legal/ → /es/legal/aviso-legal/ */
const slugLegal = (clau) => tp(legals.pages.find((x) => x.slug === clau), 'slug');

/* Perfils de sabor orientatius per família (eixos 0–5). Editorial, no analític.
   Van per clau, no per etiqueta: el text el posa el fitxer d'idioma. */
const FLAVOUR = {
  'carquinyolis-dhorta': [['cruixent', 5], ['intensitat', 4], ['dolcor', 3], ['torrat', 4], ['persistencia', 4]],
  'porretes-del-padri':  [['cruixent', 3], ['tendresa', 4], ['dolcor', 3], ['torrat', 4], ['persistencia', 4]],
  'petarrons':           [['cruixent', 4], ['mantega', 5], ['dolcor', 3], ['aroma', 4], ['persistencia', 3]]
};
/* Només l'emoji: el nom del maridatge també surt del fitxer d'idioma. */
const PAIR = { cafe:'☕', te:'🍵', 'vi-dolc':'🍷', 'vins-escumosos':'🥂', gelat:'🍨', xocolata:'🍫', llet:'🥛', formatge:'🧀' };

const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
/* JSON per posar dins d'un <script>: cal partir qualsevol "</" o el navegador
   es pensaria que la etiqueta s'acaba allà. */
const jsonSegur = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

/* Segell de les targetes d'agraïment: cercle verd amb la porta oberta i raigs */
const SEGELL = `<svg class="form-success__mark" viewBox="0 0 168 96" aria-hidden="true">
        <g stroke="var(--color-or-soft)" stroke-width="2" stroke-linecap="round">
          <path d="M22 34h16M14 48h18M22 62h16"/>
          <path d="M146 34h-16M154 48h-18M146 62h-16"/>
        </g>
        <circle cx="84" cy="48" r="35" fill="var(--color-exit-fosc)"/>
        <circle cx="84" cy="48" r="35" fill="none" stroke="var(--color-or)" stroke-width="1.5"/>
        <circle cx="84" cy="48" r="30" fill="none" stroke="var(--color-or-soft)" stroke-width="0.75" opacity="0.55"/>
        <g fill="none" stroke="var(--color-or-soft)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M84 30v37"/>
          <path d="M84 30l-13 4v29l13 4"/>
          <path d="M84 30h13v37H84"/>
          <circle cx="79" cy="49" r="1.6" fill="var(--color-or-soft)" stroke="none"/>
        </g>
      </svg>`;

/* Filet — cor — filet */
const DIVISOR = `<div class="form-success__div" aria-hidden="true">
        <svg width="17" height="15" viewBox="0 0 17 15" fill="currentColor"><path d="M8.5 14.5S0 9.3 0 4.7A4.5 4.5 0 0 1 8.5 2.4 4.5 4.5 0 0 1 17 4.7c0 4.6-8.5 9.8-8.5 9.8Z"/></svg>
      </div>`;

/* Il·lustració del llindar (retallada de la maqueta del client, fons transparent).
   Decorativa: alt buit i lazy, així no es baixa fins que la targeta es mostra. */
const ESCENA = (p) => `<img class="form-success__scene" src="${arrelLloc(p)}images/illustrations/llindar.png"
        width="459" height="737" alt="" aria-hidden="true" loading="lazy" decoding="async">`;

/* Fulls d'estil. Les pàgines interiors porten els de fitxa, història i
   formularis; la portada, en canvi, porta hero.css i no necessita aquells.
   Es declara aquí perquè és l'única diferència real entre les dues capçaleres. */
const CSS_INTERIOR = ['settings', 'base', 'layout', 'animations', 'components/navbar',
  'components/buttons', 'components/cards', 'components/product', 'components/quote',
  'components/story', 'components/forms', 'components/footer'];
const CSS_PORTADA = ['settings', 'base', 'layout', 'animations', 'components/navbar',
  'components/buttons', 'components/hero', 'components/quote', 'components/cards',
  'components/footer'];

/* transparent: la capçalera arrenca sense vidre perquè va damunt del hero.
   La resta de pàgines no tenen hero, així que hi comencen amb `is-scrolled`. */
function head(p, { title, desc, jsonld = '', css = CSS_INTERIOR, transparent = false, canonical = '', og = null, pagina = null }) {
  const fulls = css.map((n) => `<link rel="stylesheet" href="${arrelLloc(p)}css/${n}.css">`).join('\n  ');
  /* Diu al cercador que aquestes tres pàgines són la mateixa en tres idiomes,
     i no contingut duplicat. x-default apunta al català, que és l'original. */
  const alternatives = IDIOMES.map((codi) =>
    `<link rel="alternate" hreflang="${codi}" href="${urlIdioma(p, codi, pagina)}">`).join('\n  ')
    + `\n  <link rel="alternate" hreflang="x-default" href="${urlIdioma(p, 'ca', pagina)}">`;
  const social = og ? `
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Ca la Marxanta">
  <meta property="og:title" content="${esc(og.title)}">
  <meta property="og:description" content="${esc(og.desc)}">
  <meta property="og:image" content="${esc(og.image)}">
  <meta property="og:locale" content="${esc(og.locale)}">
  <meta name="twitter:card" content="summary_large_image">` : '';
  return `<!DOCTYPE html>
<html lang="${T.html_lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">${canonical ? `\n  <link rel="canonical" href="${esc(canonical)}">` : ''}${social}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  ${alternatives}
  ${fulls}
  ${jsonld ? `<script type="application/ld+json">${jsonld}</script>` : ''}
</head>
<body>
<a class="skip-link" href="#contingut">${esc(T.nav.salta)}</a>
<header class="header${transparent ? '' : ' is-scrolled'}" data-header>
  <div class="header__inner">
    <a class="brand" href="${p}index.html" aria-label="${esc(T.nav.inici_aria)}">
      <img class="brand__logo" src="${arrelLloc(p)}images/brand/logo.png" width="360" height="306" alt="Ca la Marxanta">
    </a>
    <nav class="nav" id="menu" data-nav aria-label="${esc(T.nav.aria)}">
      <ul class="nav__list">
        <li><a class="nav__link" href="${p}${R.historia}/">${esc(T.nav.historia)}</a></li>
        <li><a class="nav__link" href="${p}${R.obrador}/">${esc(T.nav.obrador)}</a></li>
        <li><a class="nav__link" href="${p}${R.colleccio}/">${esc(T.nav.colleccio)}</a></li>
        <li><a class="nav__link" href="${p}${R.trobans}/">${esc(T.nav.trobans)}</a></li>
        <li><a class="nav__link" href="${p}${R.empreses}/">${esc(T.nav.empreses)}</a></li>
        <li><a class="nav__link" href="${p}${R.contacte}/">${esc(T.nav.contacte)}</a></li>
      </ul>
      <!-- Amb salt de línia entre ells: enganxats, un lector de pantalla els llegeix
           com una sola paraula ("CAESEN") i en copiar el text surten junts.
           Cada idioma porta a la pàgina equivalent, no a la portada. -->
      <div class="nav__lang" aria-label="${esc(T.nav.idioma)}">
        ${IDIOMES.map((codi) => codi === T.codi
          ? `<a href="${urlIdioma(p, codi, pagina)}" aria-current="true">${esc(TEXTOS[codi].etiqueta)}</a>`
          : `<a href="${urlIdioma(p, codi, pagina)}" hreflang="${codi}" lang="${codi}">${esc(TEXTOS[codi].etiqueta)}</a>`
        ).join('\n        ')}
      </div>
    </nav>
    <!-- aria-controls ha d'apuntar a un id que existeixi: és el <nav id="menu"> de sobre.
         A la portada escrita a mà hi era però el <nav> no tenia id, així que no apuntava enlloc. -->
    <button class="nav__toggle" data-nav-toggle aria-label="${esc(T.nav.obre_menu)}" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
  </div>
</header>
<main id="contingut">`;
}

function foot(p, { id = '' } = {}) {
  return `</main>
<footer class="footer"${id ? ` id="${id}"` : ''}>
  <div class="container">
    <div class="footer__grid">
      <div>
        <p class="footer__brand-name">Ca la Marxanta</p>
        <p class="footer__tagline">${esc(T.peu.tagline)}</p>
        <div class="footer__social"><a href="https://www.instagram.com/calamarxanta_/" target="_blank" rel="noopener" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a></div>
      </div>
      <div class="footer__col"><h4>${esc(T.peu.explora)}</h4><ul>
        <li><a href="${p}${R.historia}/">${esc(T.peu.historia_llarg)}</a></li>
        <li><a href="${p}${R.obrador}/">${esc(T.nav.obrador)}</a></li>
        <li><a href="${p}${R.colleccio}/">${esc(T.nav.colleccio)}</a></li>
        <li><a href="${p}${R.trobans}/">${esc(T.nav.trobans)}</a></li>
        <li><a href="${p}${R.barri}/">${esc(T.peu.barri)}</a></li>
        <li><a href="${p}${R.empreses}/">${esc(T.nav.empreses)}</a></li>
        <li><a href="${p}${R.contacte}/">${esc(T.nav.contacte)}</a></li>
      </ul></div>
      <div class="footer__col"><h4>${esc(T.peu.contacte)}</h4><ul>
        <li>${T.peu.adreca}</li>
        <li><a href="mailto:info@calamarxanta.com">info@calamarxanta.com</a></li>
        <li><a href="tel:+34608387092">+34 608 387 092</a></li>
      </ul></div>
    </div>
    <div class="footer__bottom">
      <p>${esc(T.peu.copyright)} <span data-year>2026</span> · Ca la Marxanta</p>
      <div class="footer__legal">
        <a href="${p}${R.legal}/${slugLegal('avis-legal')}/">${esc(T.peu.nota_legal)}</a>
        <a href="${p}${R.legal}/${slugLegal('politica-de-privacitat')}/">${esc(T.peu.privacitat)}</a>
        <a href="${p}${R.legal}/${slugLegal('politica-de-cookies')}/">${esc(T.peu.cookies)}</a>
      </div>
    </div>
  </div>
</footer>
<script>window.CLM_TXT=${jsonSegur(T.js)}</script>
<script type="module" src="${arrelLloc(p)}js/main.js"></script>
</body>
</html>`;
}

function card(prod, p) {
  const fam = familyById[prod.familia];
  return `<article class="family-card ${prod.familia === 'petarrons' ? 'family-card--petarrons' : prod.familia === 'porretes-del-padri' ? 'family-card--porretes' : ''} reveal">
    <a href="${p}${R.colleccio}/${prod.slug}/" style="display:flex;flex-direction:column;height:100%">
      <div class="family-card__media"><img src="${arrelLloc(p)}${prod.imatge}" alt="${esc(prod.nom)} ${esc(tp(prod, 'varietat'))}"></div>
      <div class="family-card__body">
        <h3>${esc(prod.nom)}</h3>
        <p class="family-card__variety">${esc(tp(prod, 'varietat'))}${prod.temporada ? ` · ${esc(T.comu.de_temporada)}` : ''}</p>
        <span class="link-arrow">${esc(T.comu.veure_fitxa)} <span>→</span></span>
      </div>
    </a>
  </article>`;
}

/* ---------- Pàgina de col·lecció ---------- */
function collectionPage() {
  const p = '../';
  const families = data.families.map((fam) => {
    const prods = data.productes.filter((x) => x.familia === fam.id);
    return `<div class="family-block reveal">
      <div class="family-block__intro">
        <p class="eyebrow">${esc(fam.nom)}</p>
        <h2>${esc(tp(fam, 'lema'))}</h2>
        <p class="lead">${esc(majuscula(tp(fam, 'recepta')))}.</p>
      </div>
      <div class="family-grid">${prods.map((x) => card(x, p)).join('\n')}</div>
    </div>`;
  }).join('\n');

  const body = `
  <section class="section">
    <div class="container">
      <nav class="breadcrumb" aria-label="${esc(T.comu.molla_aria)}"><a href="${p}index.html">${esc(T.comu.inici)}</a><span>›</span>${esc(T.nav.colleccio)}</nav>
      <div class="page-head text-center" style="max-width:60ch;margin-inline:auto;padding-top:var(--space-12)">
        <p class="eyebrow mx-auto">${esc(T.colleccio.eyebrow)}</p>
        <h1>${esc(T.colleccio.h1)}</h1>
        <hr class="rule mx-auto">
        <p class="lead mx-auto">${esc(T.colleccio.lead)}</p>
      </div>
    </div>
  </section>
  <section class="section section--tight"><div class="container">${families}</div></section>
  <section class="quote quote--plain"><p class="quote__text reveal">${esc(T.colleccio.cita)}</p></section>`;

  return head(p, { title: T.colleccio.title, desc: T.colleccio.desc, pagina: { tipus: 'seccio', clau: 'colleccio' } }) + body + foot(p);
}

/* ---------- Fitxa de producte ---------- */
function productPage(prod) {
  const p = '../../';
  const fam = familyById[prod.familia];
  const flavour = FLAVOUR[prod.familia] || [];
  const related = data.productes.filter((x) => x.slug !== prod.slug)
    .sort((a, b) => (a.familia === prod.familia ? -1 : 1)).slice(0, 4);
  const n = prod.nutricio_100g;

  const jsonld = JSON.stringify({
    "@context": "https://schema.org", "@type": "Product",
    name: `${prod.nom} · ${tp(prod, 'varietat')}`,
    brand: { "@type": "Brand", name: "Ca la Marxanta" },
    category: fam.nom, weight: prod.pes, description: tp(prod, 'descripcio'),
    image: `https://www.carquinyolisdhorta.com/${prod.imatge}`
  });

  const body = `
  <section class="section section--tight">
    <div class="container">
      <nav class="breadcrumb" aria-label="${esc(T.comu.molla_aria)}"><a href="${p}index.html">${esc(T.comu.inici)}</a><span>›</span><a href="${p}${R.colleccio}/">${esc(T.nav.colleccio)}</a><span>›</span>${esc(prod.nom)} · ${esc(tp(prod, 'varietat'))}</nav>
      <div class="product" style="margin-top:var(--space-8)">
        <div class="product__media reveal"><img src="${arrelLloc(p)}${prod.imatge}" alt="${esc(T.fitxa.caixa_de)} ${esc(prod.nom)} ${esc(tp(prod, 'varietat'))} (150 g)"></div>
        <div class="product__info reveal" data-delay="1">
          <p class="eyebrow">${esc(fam.nom)}</p>
          <h1>${esc(tp(prod, 'varietat'))}</h1>
          <p class="product__variety">${esc(tp(fam, 'lema'))}</p>
          <p class="product__desc">${esc(tp(prod, 'descripcio'))}</p>
          <div class="product__meta">
            <span class="badge">${esc(prod.pes)}</span>
            <span class="badge">${esc(T.fitxa.artesa)}</span>
            ${prod.temporada ? `<span class="badge badge--season">${esc(T.fitxa.temporada_badge)}</span>` : ''}
          </div>
          <div class="flavour">
            ${flavour.map(([clau, v]) => `<div class="flavour__row"><span class="flavour__label">${esc(T.fitxa.perfils[clau])}</span><span class="flavour__bar"><i style="width:${v*20}%"></i></span></div>`).join('\n')}
          </div>
          <a class="btn btn--primary" href="${p}${R.trobans}/">${esc(T.fitxa.on_comprar)}</a>
          <p class="product__hint">${esc(T.fitxa.hint_pregunta)} <a href="${p}${R.barri}/">${esc(T.fitxa.hint_enllac)}</a>.</p>

          <div class="info-block">
            <h3>${esc(T.fitxa.ingredients)}</h3>
            <p>${esc(tp(prod, 'ingredients'))}</p>
            <div class="allergens">${tp(prod, 'allergens').map((a) => `<span class="badge">${esc(a)}</span>`).join('')}</div>
            <p style="margin-top:var(--space-3);font-size:.9rem;color:var(--color-tinta-soft)">${esc(tp(prod, 'traces'))} ${esc(T.fitxa.conservacio)}</p>
          </div>

          <div class="info-block">
            <table class="nutri">
              <caption>${esc(T.fitxa.nutri_caption)}</caption>
              <tbody>
                <tr><th>${esc(T.fitxa.nutri_energia)}</th><td>${esc(n.energia)}</td></tr>
                <tr><th>${esc(T.fitxa.nutri_greixos)}</th><td>${esc(n.greixos)} <small>(${esc(T.fitxa.nutri_saturats)} ${esc(n.greixos_saturats)})</small></td></tr>
                <tr><th>${esc(T.fitxa.nutri_hidrats)}</th><td>${esc(n.hidrats)} <small>(${esc(T.fitxa.nutri_sucres)} ${esc(n.sucres)})</small></td></tr>
                <tr><th>${esc(T.fitxa.nutri_proteines)}</th><td>${esc(n.proteines)}</td></tr>
                <tr><th>${esc(T.fitxa.nutri_sal)}</th><td>${esc(n.sal)}</td></tr>
              </tbody>
            </table>
          </div>

          <div class="info-block">
            <h3>${esc(T.fitxa.marida_amb)}</h3>
            <div class="pairings" style="justify-content:flex-start">
              ${prod.maridatges.map((m) => PAIR[m] ? `<div class="pairing"><span class="pairing__emoji">${PAIR[m]}</span><span>${esc(T.fitxa.maridatges[m])}</span></div>` : '').join('')}
            </div>
            ${prod.nota_maridatge ? `<p class="pairings__note">${esc(tp(prod, 'nota_maridatge'))}</p>` : ''}
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" style="background:var(--color-marfil)">
    <div class="container">
      <p class="eyebrow reveal">${esc(T.fitxa.altres_eyebrow)}</p>
      <h2 class="reveal" style="margin-bottom:var(--space-12)">${esc(T.fitxa.altres_titol)}</h2>
      <div class="related-grid">${related.map((x) => card(x, p)).join('\n')}</div>
    </div>
  </section>`;

  return head(p, {
    title: `${prod.nom} · ${tp(prod, 'varietat')} — Ca la Marxanta`,
    desc: tp(prod, 'descripcio').slice(0, 155),
    jsonld,
    pagina: { tipus: 'producte', slug: prod.slug }
  }) + body + foot(p);
  /* Nota: el títol i la descripció surten del producte (productes.json), que és
     on viuen les dades de catàleg; en fer el castellà i l'anglès caldrà tenir-hi
     descripcio/ingredients per idioma. */
}

/* ---------- Pàgina HISTÒRIA ---------- */
function historiaPage() {
  const p = '../';
  const body = `
  <section class="section section--tight">
    <div class="container">
      <nav class="breadcrumb" aria-label="${esc(T.comu.molla_aria)}"><a href="${p}index.html">${esc(T.comu.inici)}</a><span>›</span>${esc(T.nav.historia)}</nav>
      <div class="page-head story-intro" style="padding-top:var(--space-12)">
        <p class="eyebrow">${esc(T.historia.eyebrow)}</p>
        <h1>${esc(T.historia.h1)}</h1>
        <hr class="rule">
        <p class="lead">${esc(T.historia.lead)}</p>
      </div>
    </div>
  </section>

  <section class="quote quote--plain"><p class="quote__text reveal">${esc(T.historia.cita)}</p></section>

  <section class="section section--tight"><div class="container">
    <div class="editorial editorial--reverse">
      <div class="editorial__media reveal"><img src="${arrelLloc(p)}images/workshop/obrador-masa.jpg" alt="${esc(T.historia.nom_alt)}"></div>
      <div class="editorial__body reveal" data-delay="1">
        <p class="eyebrow">${esc(T.historia.nom_eyebrow)}</p>
        <h2>${esc(T.historia.nom_titol)}</h2>
        <hr class="rule">
        <p>${T.historia.nom_text}</p>
      </div>
    </div>
  </div></section>

  <section class="section section--tight"><div class="container story-intro">
    <p class="eyebrow">${esc(T.historia.barri_eyebrow)}</p>
    <h2>${esc(T.historia.barri_titol)}</h2>
    <hr class="rule">
    <p>${esc(T.historia.barri_text)}</p>
  </div></section>

  <section class="section" style="background:var(--color-marfil)"><div class="container">
    <div class="story-intro reveal" style="margin-bottom:var(--space-12)">
      <p class="eyebrow">${esc(T.historia.promesa_eyebrow)}</p>
      <h2>${esc(T.historia.promesa_titol)}</h2>
    </div>
    <ul class="promise reveal" data-delay="1">
      ${T.historia.promesa.map((x) => `<li>${esc(x)}</li>`).join('\n      ')}
    </ul>
  </div></section>

  <section class="section text-center"><div class="container container--narrow reveal">
    <h2>${esc(T.historia.final_titol)}</h2>
    <hr class="rule mx-auto">
    <p class="lead mx-auto" style="margin-bottom:var(--space-8)">${esc(T.historia.final_text)}</p>
    <a class="btn btn--primary" href="${p}${R.obrador}/">${esc(T.historia.final_cta)}</a>
  </div></section>`;
  return head(p, { title: T.historia.title, desc: T.historia.desc, pagina: { tipus: 'seccio', clau: 'historia' } }) + body + foot(p);
}

/* ---------- Pàgina OBRADOR ---------- */
function obradorPage() {
  const p = '../';
  const steps = T.obrador.passos;
  const ingredients = T.obrador.ingredients;
  const body = `
  <section class="section section--tight">
    <div class="container">
      <nav class="breadcrumb" aria-label="${esc(T.comu.molla_aria)}"><a href="${p}index.html">${esc(T.comu.inici)}</a><span>›</span>${esc(T.nav.obrador)}</nav>
      <div class="page-head story-intro" style="padding-top:var(--space-12)">
        <p class="eyebrow">${esc(T.obrador.eyebrow)}</p>
        <h1>${esc(T.obrador.h1)}</h1>
        <hr class="rule">
        <p class="lead">${esc(T.obrador.lead)}</p>
      </div>
    </div>
  </section>

  <section class="section section--tight"><div class="container">
    <div class="story-intro reveal" style="margin-bottom:var(--space-16)">
      <p class="eyebrow">${esc(T.obrador.passos_eyebrow)}</p>
      <h2>${esc(T.obrador.passos_titol)}</h2>
    </div>
    <div class="steps">
      ${steps.map(([t, d], i) => `<article class="step reveal"><span class="step__num">${String(i + 1).padStart(2, '0')}</span><div><h3>${t}</h3><p>${d}</p></div></article>`).join('\n')}
    </div>
  </div></section>

  <section class="quote"><div class="quote__media"><img src="${arrelLloc(p)}images/workshop/obrador-masa.jpg" alt=""></div><p class="quote__text reveal">${esc(T.obrador.cita)}</p></section>

  <section class="section"><div class="container">
    <div class="story-intro reveal" style="margin-bottom:var(--space-12)">
      <p class="eyebrow">${esc(T.obrador.ingredients_eyebrow)}</p>
      <h2>${esc(T.obrador.ingredients_titol)}</h2>
    </div>
    <div class="ingredients-grid">
      ${ingredients.map(([t, d]) => `<article class="ingredient reveal"><h3>${t}</h3><p>${d}</p></article>`).join('\n')}
    </div>
  </div></section>

  <section class="section text-center" style="background:var(--color-marfil)"><div class="container container--narrow reveal">
    <h2>${esc(T.obrador.final_titol)}</h2>
    <hr class="rule mx-auto">
    <p class="lead mx-auto" style="margin-bottom:var(--space-8)">${esc(T.obrador.final_text)}</p>
    <a class="btn btn--primary" href="${p}${R.colleccio}/">${esc(T.comu.veure_colleccio)}</a>
  </div></section>`;
  return head(p, { title: T.obrador.title, desc: T.obrador.desc, pagina: { tipus: 'seccio', clau: 'obrador' } }) + body + foot(p);
}

/* ---------- Pàgina TROBA'NS ---------- */
function trobansPage() {
  const p = '../';
  const zones = [T.trobans.tots, ...venda.zones];
  const filters = zones.map((z, i) =>
    `<button class="filter ${i === 0 ? 'is-active' : ''}" data-zone="${i === 0 ? 'tots' : esc(z)}">${esc(z)}</button>`).join('\n');
  const shops = venda.establiments.map((s) => {
    // Cap "Barcelona" fix a la cerca del mapa: hi ha establiments fora de la
    // província. El codi postal ja és únic a tot l'Estat; la població, si la
    // tenim, acaba d'afinar-ho.
    const lloc = s.poblacio ? `${s.cp} ${s.poblacio}` : `${s.cp} Catalunya`;
    const q = encodeURIComponent(`${s.nom}, ${s.adreca}, ${lloc}`);
    return `<article class="shop reveal" data-zone="${esc(s.zona)}">
      <p class="shop__zone">${esc(s.zona)}</p>
      <h3>${esc(s.nom)}</h3>
      <p>${esc(s.adreca)}<br>${esc(s.cp)}${s.poblacio ? ' ' + esc(s.poblacio) : ''}</p>
      <a class="link-arrow" href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener">${esc(T.trobans.veure_mapa)} <span>→</span></a>
    </article>`;
  }).join('\n');
  const body = `
  <section class="section section--tight">
    <div class="container">
      <nav class="breadcrumb" aria-label="${esc(T.comu.molla_aria)}"><a href="${p}index.html">${esc(T.comu.inici)}</a><span>›</span>${esc(T.nav.trobans)}</nav>
      <div class="page-head story-intro" style="padding-top:var(--space-12)">
        <p class="eyebrow">${esc(T.trobans.eyebrow)}</p>
        <h1>${esc(T.trobans.h1)}</h1>
        <hr class="rule">
        <p class="lead">${esc(T.trobans.lead)}</p>
      </div>
    </div>
  </section>

  <section class="section section--tight"><div class="container">
    <form class="shop-search" role="search" onsubmit="return false">
      <label for="shop-q">${esc(T.trobans.cerca_label)}</label>
      <input id="shop-q" type="search" data-search placeholder="${esc(T.trobans.cerca_placeholder)}" autocomplete="off">
    </form>
    <div class="filters" data-filters>${filters}</div>
    <div class="shops">${shops}</div>
    <div class="invite" data-empty hidden>
      <h2 data-empty-title>${esc(T.trobans.buit_titol)}</h2>
      <p>${esc(T.trobans.buit_text)}</p>
      <a class="btn btn--primary" href="${p}${R.barri}/" data-empty-cta>${esc(T.trobans.buit_cta)}</a>
    </div>

    <div class="invite invite--band reveal">
      <h3>${esc(T.trobans.banda_titol)}</h3>
      <p>${esc(T.trobans.banda_text_a)} ${venda.establiments.length} ${esc(T.trobans.banda_text_b)}</p>
      <a class="btn btn--secondary" href="${p}${R.barri}/">${esc(T.trobans.banda_cta)}</a>
    </div>
  </div></section>

  <section class="section text-center" style="background:var(--color-marfil)"><div class="container container--narrow reveal">
    <p class="eyebrow mx-auto">${esc(T.trobans.b2b_eyebrow)}</p>
    <h2>${esc(T.trobans.b2b_titol)}</h2>
    <hr class="rule mx-auto">
    <p class="lead mx-auto" style="margin-bottom:var(--space-8)">${esc(T.trobans.b2b_text)}</p>
    <a class="btn btn--primary" href="${p}${R.empreses}/">${esc(T.comu.parlem_ne)}</a>
  </div></section>`;
  return head(p, { title: T.trobans.title, desc: T.trobans.desc, pagina: { tipus: 'seccio', clau: 'trobans' } }) + body + foot(p);
}

/* ---------- Pàgina PORTA'NS AL TEU BARRI ----------
   Recomanació de botiga per part d'un client. NO és un sistema de ressenyes:
   és una nominació. El bloc públic només mostra zona i recompte —mai el nom
   de la botiga recomanada, que és un negoci de tercers— i només es genera si
   data/recomanacions.json té zones (l'omple el client, després de moderar). */
function barriPage() {
  const p = '../';
  const zones = (recos.zones || []).filter((z) => z && z.nom);
  const cites = (recos.cites || []).filter((c) => c && c.text);
  const demanda = zones.length ? `
  <section class="section" style="background:var(--color-marfil)"><div class="container">
    <div class="story-intro reveal" style="margin-bottom:var(--space-12)">
      <p class="eyebrow">${esc(T.barri.demanda_eyebrow)}</p>
      <h2>${esc(T.barri.demanda_titol)}</h2>
      <hr class="rule">
      <p class="lead">${esc(T.barri.demanda_lead)}</p>
    </div>
    <div class="demand">
      ${zones.map((z) => `<div class="demand__item reveal"><span class="demand__num">${esc(z.peticions)}</span><p class="demand__zone">${esc(z.nom)}</p></div>`).join('\n')}
    </div>
    ${cites.length ? `<div style="margin-top:var(--space-16)">${cites.map((c) => `<blockquote class="testimoni reveal"><p>«${esc(c.text)}»</p><cite>${esc(c.autor || T.barri.demanda_autor)}</cite></blockquote>`).join('\n')}</div>` : ''}
  </div></section>` : '';

  const body = `
  <section class="section section--tight">
    <div class="container">
      <nav class="breadcrumb" aria-label="${esc(T.comu.molla_aria)}"><a href="${p}index.html">${esc(T.comu.inici)}</a><span>›</span><a href="${p}${R.trobans}/">${esc(T.nav.trobans)}</a><span>›</span>${esc(T.peu.barri)}</nav>
      <div class="page-head story-intro" style="padding-top:var(--space-12)">
        <p class="eyebrow">${esc(T.barri.eyebrow)}</p>
        <h1 data-barri-title>${esc(T.barri.h1)}</h1>
        <hr class="rule">
        <p class="lead" data-barri-lead>${esc(T.barri.lead)}</p>
      </div>
    </div>
  </section>

  <section class="section section--tight"><div class="container">
    <form class="form reveal" name="barri" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" data-form="barri" novalidate>
      <input type="hidden" name="form-name" value="barri">
      <p hidden aria-hidden="true"><label>${esc(T.comu.no_omplis)} <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
      <div class="form__grid">
        <div class="field"><label for="b-barri">${esc(T.barri.camp_barri)}</label><input id="b-barri" name="barri" required autocomplete="address-level3"><span class="field__error"></span></div>
        <div class="field"><label for="b-cp">${esc(T.barri.camp_cp)}</label><input id="b-cp" name="cp" inputmode="numeric" autocomplete="postal-code"><span class="field__error"></span></div>
        <div class="field"><label for="b-botiga">${esc(T.barri.camp_botiga)}</label><input id="b-botiga" name="botiga" placeholder="${esc(T.barri.camp_botiga_ph)}"><span class="field__error"></span></div>
        <div class="field"><label for="b-on">${esc(T.barri.camp_on)}</label><input id="b-on" name="on_es" placeholder="${esc(T.barri.camp_on_ph)}"><span class="field__error"></span></div>
        <div class="field form__row--full"><label for="b-motiu">${esc(T.barri.camp_motiu)}</label><textarea id="b-motiu" name="motiu" placeholder="${esc(T.barri.camp_motiu_ph)}"></textarea><span class="field__error"></span></div>
        <div class="field"><label for="b-nom">${esc(T.barri.camp_nom)}</label><input id="b-nom" name="nom" autocomplete="name"><span class="field__error"></span></div>
        <div class="field"><label for="b-email">${esc(T.barri.camp_email)}</label><input id="b-email" name="email" type="email" autocomplete="email"><span class="field__error"></span></div>
        <div class="form__row--full"><label class="consent"><input type="checkbox" name="rgpd" required> ${esc(T.comu.consent)} <a href="${p}${R.legal}/${slugLegal('politica-de-privacitat')}/">${esc(T.comu.consent_privacitat)}</a> ${esc(T.comu.consent_dades)} *</label><span class="field__error"></span></div>
        <div class="form__row--full"><label class="consent"><input type="checkbox" name="citable"> ${esc(T.barri.citable)}</label></div>
      </div>
      <p class="form-error" data-form-error hidden role="alert">${esc(T.comu.error_enviament)} <a href="mailto:info@calamarxanta.com">info@calamarxanta.com</a>.</p>
      <p style="margin-top:var(--space-8)"><button type="submit" class="btn btn--primary">${esc(T.barri.enviar)}</button></p>
    </form>
    <div class="form-success" id="barri-success">
      ${ESCENA(p)}
      ${SEGELL}
      <h3>${esc(T.barri.gracies_titol)}</h3>
      ${DIVISOR}
      <p class="form-success__lead">${esc(T.barri.gracies_lead_a)}<span data-success-lloc></span>${T.barri.gracies_lead_b}</p>
      <p class="form-success__note">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 11h18"/><circle cx="8" cy="15" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="15" r="1.1" fill="currentColor" stroke="none"/></svg>
        <span>${T.barri.gracies_nota}</span>
      </p>
    </div>
  </div></section>
${demanda}
  <section class="section text-center" style="background:var(--color-xocolata);color:var(--color-blanc-trencat)"><div class="container container--narrow reveal">
    <p class="eyebrow mx-auto" style="color:var(--color-or)">${esc(T.barri.b2b_eyebrow)}</p>
    <h2>${esc(T.barri.b2b_titol)}</h2>
    <hr class="rule mx-auto">
    <p class="lead mx-auto" style="margin-bottom:var(--space-8);color:rgba(250,247,241,.85)">${esc(T.barri.b2b_text)}</p>
    <a class="btn btn--ghost-light" href="${p}${R.empreses}/">${esc(T.comu.parlem_ne)}</a>
  </div></section>`;
  return head(p, { title: T.barri.title, desc: T.barri.desc, pagina: { tipus: 'seccio', clau: 'barri' } }) + body + foot(p);
}

/* ---------- Pàgina EMPRESES (B2B) ---------- */
function empresesPage() {
  const p = '../';
  const sectors = T.empreses.sectors;
  const reasons = T.empreses.raons;
  const steps = T.empreses.passos;
  const body = `
  <section class="section section--tight">
    <div class="container">
      <nav class="breadcrumb" aria-label="${esc(T.comu.molla_aria)}"><a href="${p}index.html">${esc(T.comu.inici)}</a><span>›</span>${esc(T.nav.empreses)}</nav>
      <div class="page-head story-intro" style="padding-top:var(--space-12)">
        <p class="eyebrow">${esc(T.empreses.eyebrow)}</p>
        <h1>${esc(T.empreses.h1)}</h1>
        <hr class="rule">
        <p class="lead">${esc(T.empreses.lead)}</p>
        <p style="margin-top:var(--space-6)"><a class="btn btn--primary" href="#contacte-b2b">${esc(T.empreses.cta_dalt)}</a></p>
      </div>
    </div>
  </section>

  <section class="section section--tight"><div class="container">
    <div class="story-intro reveal" style="margin-bottom:var(--space-12)"><p class="eyebrow">${esc(T.empreses.sectors_eyebrow)}</p><h2>${esc(T.empreses.sectors_titol)}</h2></div>
    <div class="ingredients-grid">
      ${sectors.map(([t, d]) => `<article class="ingredient reveal"><h3>${t}</h3><p>${d}</p></article>`).join('\n')}
    </div>
  </div></section>

  <section class="section" style="background:var(--color-marfil)"><div class="container">
    <div class="story-intro reveal" style="margin-bottom:var(--space-12)"><p class="eyebrow">${esc(T.empreses.raons_eyebrow)}</p><h2>${esc(T.empreses.raons_titol)}</h2></div>
    <div class="pillars">
      ${reasons.map(([t, d]) => `<article class="pillar reveal" style="text-align:left"><h3>${t}</h3><p style="margin:0">${d}</p></article>`).join('\n')}
    </div>
  </div></section>

  <section class="section section--tight"><div class="container">
    <div class="story-intro reveal" style="margin-bottom:var(--space-12)"><p class="eyebrow">${esc(T.empreses.passos_eyebrow)}</p><h2>${esc(T.empreses.passos_titol)}</h2></div>
    <div class="steps">
      ${steps.map((t, i) => `<article class="step reveal"><span class="step__num">${String(i + 1).padStart(2, '0')}</span><div><h3>${t}</h3></div></article>`).join('\n')}
    </div>
  </div></section>

  <section class="section" id="contacte-b2b"><div class="container">
    <div class="story-intro reveal" style="margin-bottom:var(--space-8)"><p class="eyebrow">${esc(T.empreses.form_eyebrow)}</p><h2>${esc(T.empreses.form_titol)}</h2><p class="lead">${esc(T.empreses.form_lead)}</p></div>
    <form class="form reveal" name="empreses" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" data-form="empreses" novalidate>
      <input type="hidden" name="form-name" value="empreses">
      <p hidden aria-hidden="true"><label>${esc(T.comu.no_omplis)} <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
      <div class="form__grid">
        <div class="field"><label for="e-nom">${esc(T.empreses.camp_nom)}</label><input id="e-nom" name="nom" required><span class="field__error"></span></div>
        <div class="field"><label for="e-empresa">${esc(T.empreses.camp_empresa)}</label><input id="e-empresa" name="empresa" required><span class="field__error"></span></div>
        <div class="field"><label for="e-carrec">${esc(T.empreses.camp_carrec)}</label><input id="e-carrec" name="carrec"><span class="field__error"></span></div>
        <div class="field"><label for="e-email">${esc(T.empreses.camp_email)}</label><input id="e-email" name="email" type="email" required><span class="field__error"></span></div>
        <div class="field"><label for="e-tel">${esc(T.empreses.camp_telefon)}</label><input id="e-tel" name="telefon" type="tel"><span class="field__error"></span></div>
        <div class="field"><label for="e-prov">${esc(T.empreses.camp_provincia)}</label><input id="e-prov" name="provincia"><span class="field__error"></span></div>
        <div class="field"><label for="e-tipus">${esc(T.empreses.camp_tipus)}</label><select id="e-tipus" name="tipus"><option value="">${esc(T.comu.selecciona)}</option>${T.empreses.tipus.map((o) => `<option>${esc(o)}</option>`).join('')}</select><span class="field__error"></span></div>
        <div class="field"><label for="e-volum">${esc(T.empreses.camp_volum)}</label><select id="e-volum" name="volum"><option value="">${esc(T.comu.selecciona)}</option>${T.empreses.volums.map((o) => `<option>${esc(o)}</option>`).join('')}</select><span class="field__error"></span></div>
        <div class="field form__row--full"><label>${esc(T.empreses.camp_productes)}</label><div class="checks">
          ${T.empreses.productes.map((x) => `<label class="check"><input type="checkbox" name="productes" value="${esc(x)}"> ${esc(x)}</label>`).join('\n          ')}
        </div></div>
        <div class="field form__row--full"><label for="e-msg">${esc(T.empreses.camp_missatge)}</label><textarea id="e-msg" name="missatge"></textarea><span class="field__error"></span></div>
        <div class="form__row--full"><label class="consent"><input type="checkbox" name="rgpd" required> ${esc(T.comu.consent)} <a href="${p}${R.legal}/${slugLegal('politica-de-privacitat')}/">${esc(T.comu.consent_privacitat)}</a> ${esc(T.comu.consent_dades)} *</label><span class="field__error"></span></div>
      </div>
      <p class="form-error" data-form-error hidden role="alert">${esc(T.comu.error_enviament)} <a href="mailto:info@calamarxanta.com">info@calamarxanta.com</a>.</p>
      <p style="margin-top:var(--space-8)"><button type="submit" class="btn btn--primary">${esc(T.empreses.enviar)}</button></p>
    </form>
    <div class="form-success" id="empreses-success">
      ${ESCENA(p)}
      ${SEGELL}
      <h3>${esc(T.empreses.gracies_titol)}</h3>
      ${DIVISOR}
      <p class="form-success__lead">${T.empreses.gracies_lead}</p>
      <p class="form-success__note">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h2.2a1.5 1.5 0 0 1 1.45 1.1l.7 2.5a1.5 1.5 0 0 1-.5 1.55l-1.3 1a12 12 0 0 0 5.8 5.8l1-1.3a1.5 1.5 0 0 1 1.55-.5l2.5.7A1.5 1.5 0 0 1 20 16.3v2.2a1.5 1.5 0 0 1-1.5 1.5A15 15 0 0 1 4 5.5Z"/></svg>
        <span>${esc(T.comu.pressa)} <a href="tel:+34608387092">+34 608 387 092</a>.</span>
      </p>
    </div>
  </div></section>`;
  return head(p, { title: T.empreses.title, desc: T.empreses.desc, pagina: { tipus: 'seccio', clau: 'empreses' } }) + body + foot(p);
}

/* ---------- Pàgina CONTACTE ---------- */
function contactePage() {
  const p = '../';
  const body = `
  <section class="section section--tight">
    <div class="container">
      <nav class="breadcrumb" aria-label="${esc(T.comu.molla_aria)}"><a href="${p}index.html">${esc(T.comu.inici)}</a><span>›</span>${esc(T.nav.contacte)}</nav>
      <div class="page-head story-intro" style="padding-top:var(--space-12)">
        <p class="eyebrow">${esc(T.contacte.eyebrow)}</p>
        <h1>${esc(T.contacte.h1)}</h1>
        <hr class="rule">
        <p class="lead">${esc(T.contacte.lead)}</p>
      </div>
    </div>
  </section>

  <section class="section section--tight"><div class="container">
    <div class="editorial">
      <div class="editorial__body reveal">
        <div class="contact-info">
          <div><span class="label">${esc(T.contacte.label_adreca)}</span>${esc(T.contacte.adreca)}</div>
          <div><span class="label">${esc(T.contacte.label_correu)}</span><a href="mailto:info@calamarxanta.com">info@calamarxanta.com</a></div>
          <div><span class="label">${esc(T.contacte.label_telefon)}</span><a href="tel:+34608387092">+34 608 387 092</a></div>
          <div><span class="label">${esc(T.contacte.label_instagram)}</span><a href="https://www.instagram.com/calamarxanta_/" target="_blank" rel="noopener">@calamarxanta_</a></div>
        </div>
      </div>
      <div class="editorial__media reveal" data-delay="1">
        <form class="form" name="contacte" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" data-form="contacte" novalidate style="max-width:none">
          <input type="hidden" name="form-name" value="contacte">
          <p hidden aria-hidden="true"><label>${esc(T.comu.no_omplis)} <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
          <div class="form__grid">
            <div class="field"><label for="c-nom">${esc(T.contacte.camp_nom)}</label><input id="c-nom" name="nom" required><span class="field__error"></span></div>
            <div class="field"><label for="c-email">${esc(T.contacte.camp_email)}</label><input id="c-email" name="email" type="email" required><span class="field__error"></span></div>
            <div class="field form__row--full"><label for="c-msg">${esc(T.contacte.camp_missatge)}</label><textarea id="c-msg" name="missatge" required></textarea><span class="field__error"></span></div>
            <div class="form__row--full"><label class="consent"><input type="checkbox" name="rgpd" required> ${esc(T.comu.consent_curt)} <a href="${p}${R.legal}/${slugLegal('politica-de-privacitat')}/">${esc(T.comu.consent_privacitat)}</a>. *</label><span class="field__error"></span></div>
          </div>
          <p class="form-error" data-form-error hidden role="alert">${esc(T.comu.error_enviament)} <a href="mailto:info@calamarxanta.com">info@calamarxanta.com</a>.</p>
          <p style="margin-top:var(--space-6)"><button type="submit" class="btn btn--primary">${esc(T.contacte.enviar)}</button></p>
        </form>
        <div class="form-success" id="contacte-success">
          ${SEGELL}
          <h3>${esc(T.contacte.gracies_titol)}</h3>
          ${DIVISOR}
          <p class="form-success__lead">${T.contacte.gracies_lead}</p>
          <p class="form-success__note">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h2.2a1.5 1.5 0 0 1 1.45 1.1l.7 2.5a1.5 1.5 0 0 1-.5 1.55l-1.3 1a12 12 0 0 0 5.8 5.8l1-1.3a1.5 1.5 0 0 1 1.55-.5l2.5.7A1.5 1.5 0 0 1 20 16.3v2.2a1.5 1.5 0 0 1-1.5 1.5A15 15 0 0 1 4 5.5Z"/></svg>
            <span>${esc(T.comu.pressa)} <a href="tel:+34608387092">+34 608 387 092</a>.</span>
          </p>
        </div>
      </div>
    </div>
  </div></section>`;
  return head(p, { title: T.contacte.title, desc: T.contacte.desc, pagina: { tipus: 'seccio', clau: 'contacte' } }) + body + foot(p);
}

/* ---------- Pàgina 404 ----------
   Va a l'arrel: Netlify (i la majoria d'allotjaments estàtics) la fan servir
   automàticament, així ningú no veu la pantalla d'error del proveïdor.
   Compte: les rutes han de ser absolutes, perquè aquesta pàgina es serveix
   des de qualsevol nivell de l'adreça. */
function noTrobadaPage() {
  /* Adreces absolutes a partir de l'arrel del lloc. El valor per defecte és el
     del lloc publicat ara mateix (GitHub Pages, dins un subdirectori); si no
     fos així, una regeneració qualsevol trencaria els enllaços del 404 sense
     avisar. En un allotjament que serveixi des de l'arrel (Netlify, domini
     propi) cal generar amb:  BASE=/ node build/build-pages.mjs */
  const arrel = process.env.BASE || '/ca-la-marxanta-web/';
  const body = `
  <section class="section"><div class="container container--narrow text-center" style="padding-top:var(--space-16)">
    <p class="eyebrow mx-auto">${esc(T.error404.eyebrow)}</p>
    <h1>${esc(T.error404.h1)}</h1>
    <hr class="rule mx-auto">
    <p class="lead" style="margin-bottom:var(--space-12)">${esc(T.error404.lead)}</p>
    <p style="display:flex;gap:var(--space-4);flex-wrap:wrap;justify-content:center">
      <a class="btn btn--primary" href="${arrel}">${esc(T.error404.cta_inici)}</a>
      <a class="btn btn--secondary" href="${arrel}${R.colleccio}/">${esc(T.comu.veure_colleccio)}</a>
      <a class="btn btn--secondary" href="${arrel}${R.trobans}/">${esc(T.nav.trobans)}</a>
    </p>
  </div></section>`;
  return head(arrel, { title: T.error404.title, desc: T.error404.desc }) + body + foot(arrel);
}

/* ---------- Pàgines LEGALS ---------- */
function legalPage(page) {
  const p = '../../';
  const titol = tp(page, 'title');
  const blocks = page.blocks.map((b) =>
    (b.h ? `<h2>${esc(tp(b, 'h'))}</h2>` : '') + tp(b, 'p').map((par) => `<p>${par}</p>`).join('\n')).join('\n');
  /* Fora del català, avisem que la versió que preval és l'original. És el que
     es fa amb qualsevol document legal traduït, i evita malentesos. */
  const avis = T.codi === 'ca' ? ''
    : `<p class="legal__avis">${esc(T.legal.nota_versio)}</p>`;
  const body = `
  <section class="section section--tight"><div class="container">
    <nav class="breadcrumb" aria-label="${esc(T.comu.molla_aria)}"><a href="${p}index.html">${esc(T.comu.inici)}</a><span>›</span>${esc(titol)}</nav>
    <div class="page-head" style="padding-top:var(--space-8)"><h1>${esc(titol)}</h1><hr class="rule"></div>
    <div class="legal reveal">${avis}${blocks}</div>
  </div></section>`;
  return head(p, { title: `${titol} · Ca la Marxanta`, desc: `${titol} · Ca la Marxanta (Carquinyolis d'Horta).`, pagina: { tipus: 'legal', slug: page.slug } }) + body + foot(p);
}

/* ---------- PORTADA ----------
   Fins ara era l'única pàgina escrita a mà. Entra aquí perquè el web ha de
   sortir en castellà i en anglès: mantenir tres portades a mà es descuadra a
   la primera. El contingut és el mateix, paraula per paraula. */
function portadaPage() {
  const p = '';
  const jsonld = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Ca la Marxanta",
    "legalName": "CARQUINYOLIS D'HORTA — Ferran Escardó",
    "description": "Carquinyolis, Petarrons i Porretes artesans elaborats al barri d'Horta de Barcelona.",
    "url": "https://www.carquinyolisdhorta.com/",
    "telephone": "+34608387092",
    "email": "info@calamarxanta.com",
    "foundingDate": "2018",
    "image": "https://www.carquinyolisdhorta.com/images/workshop/obrador-hero.jpg",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Carrer Plutó, 24",
      "postalCode": "08035",
      "addressLocality": "Barcelona",
      "addressCountry": "ES"
    },
    "sameAs": ["https://www.instagram.com/calamarxanta_/"]
  }, null, 2);

  const ICONES_PILAR = [
    '<path d="M24 6c6 6 9 12 9 18a9 9 0 1 1-18 0c0-6 3-12 9-18z"/>',
    '<rect x="8" y="14" width="32" height="26" rx="3"/><path d="M16 14V9a8 8 0 0 1 16 0v5M16 26h16"/>',
    '<path d="M24 42s-14-8-14-20a8 8 0 0 1 14-5 8 8 0 0 1 14 5c0 12-14 20-14 20z"/>'
  ];
  const pilars = T.portada.pilars.map(([titol, text], i) => `<article class="pillar reveal"${i ? ` data-delay="${i}"` : ''}>
            <svg class="pillar__icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">${ICONES_PILAR[i]}</svg>
            <h3>${esc(titol)}</h3>
            <p>${esc(text)}</p>
          </article>`).join('\n          ');

  /* Les tres famílies, amb text editorial propi de la portada (no el de les
     fitxes): aquí expliquem la família, no el producte concret. */
  /* El que no es tradueix (classe, imatge, adreça i nom de marca) es queda aquí;
     l'alt, la varietat i el text venen del fitxer d'idioma. */
  const FAMILIES_FIXES = [
    ['', 'carquinyolis-ametlla.png', "Carquinyolis d'Horta", 'carquinyolis-dhorta-ametlla'],
    [' family-card--porretes', 'porretes-ametlla.png', 'Porretes del Padrí', 'porretes-del-padri-ametlla'],
    [' family-card--petarrons', 'petarrons-classics.png', 'Petarrons', 'petarrons-classics']
  ];
  const families = FAMILIES_FIXES.map(([mod, img, nom, slug], i) => {
    const [alt, varietat, text] = T.portada.families[i];
    return `<article class="family-card${mod} reveal"${i ? ` data-delay="${i}"` : ''}>
            <div class="family-card__media"><img src="${arrelLloc(p)}images/products/${img}" alt="${esc(alt)}"></div>
            <div class="family-card__body">
              <h3>${esc(nom)}</h3>
              <p class="family-card__variety">${esc(varietat)}</p>
              <p>${esc(text)}</p>
              <a class="link-arrow" href="${p}${R.colleccio}/${slug}/">${esc(T.portada.descobrir)} <span>→</span></a>
            </div>
          </article>`;
  }).join('\n          ');

  const EMOJI_MARIDATGE = ['☕', '🍵', '🍷', '🥂', '🍨', '🍫', '🧀'];
  const maridatges = T.portada.maridatges
    .map((n, i) => `<div class="pairing"><span class="pairing__emoji">${EMOJI_MARIDATGE[i]}</span><span>${esc(n)}</span></div>`).join('\n          ');

  const body = `
    <section class="hero">
      <div class="hero__media">
        <img src="${arrelLloc(p)}images/workshop/obrador-hero.jpg" alt="${esc(T.portada.hero_alt)}" fetchpriority="high">
      </div>
      <div class="container hero__content">
        <h1 class="hero__title">${T.portada.hero_titol}</h1>
        <p class="hero__subtitle">${esc(T.portada.hero_subtitol)}</p>
        <div class="hero__actions">
          <a class="btn btn--primary" href="#historia">${esc(T.portada.hero_cta)}</a>
          <a class="btn btn--ghost-light" href="${p}${R.colleccio}/">${esc(T.comu.veure_colleccio)}</a>
        </div>
      </div>
      <a class="hero__scroll" href="#historia" aria-label="${esc(T.portada.hero_baixa)}">
        <svg width="20" height="30" viewBox="0 0 18 28" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="1" y="1" width="16" height="26" rx="8"/><line x1="9" y1="7" x2="9" y2="12"/>
        </svg>
      </a>
    </section>

    <section class="section" id="historia">
      <div class="container">
        <div class="editorial">
          <div class="editorial__media reveal">
            <img src="${arrelLloc(p)}images/workshop/obrador-rodillo.jpg" alt="${esc(T.portada.historia_alt)}">
          </div>
          <div class="editorial__body reveal" data-delay="1">
            <p class="eyebrow">${esc(T.portada.historia_eyebrow)}</p>
            <h2>${esc(T.portada.historia_titol)}</h2>
            <hr class="rule">
            <p>${esc(T.portada.historia_text)}</p>
            <p style="margin-top:1rem"><em>${esc(T.portada.historia_lema)}</em></p>
            <p style="margin-top:1.5rem">
              <a class="link-arrow" href="${p}${R.historia}/">${esc(T.portada.historia_enllac)} <span>→</span></a>
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="quote">
      <div class="quote__media"><img src="${arrelLloc(p)}images/workshop/obrador-masa.jpg" alt=""></div>
      <p class="quote__text reveal">${esc(T.portada.cita_1)}</p>
    </section>

    <section class="section" id="obrador">
      <div class="container">
        <div class="editorial editorial--reverse">
          <div class="editorial__media reveal">
            <img src="${arrelLloc(p)}images/workshop/obrador-masa.jpg" alt="${esc(T.portada.obrador_alt)}">
          </div>
          <div class="editorial__body reveal" data-delay="1">
            <p class="eyebrow">${esc(T.portada.obrador_eyebrow)}</p>
            <h2>${esc(T.portada.obrador_titol)}</h2>
            <hr class="rule">
            <p>${esc(T.portada.obrador_text_1)}</p>
            <p style="margin-top:1rem">${esc(T.portada.obrador_text_2a)} <strong>${esc(T.portada.obrador_text_2b)}</strong>${esc(T.portada.obrador_text_2c)}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="quote quote--plain">
      <p class="quote__text reveal">${T.portada.cita_2}</p>
    </section>

    <section class="section">
      <div class="container">
        <div class="text-center reveal" style="max-width:60ch;margin-inline:auto;margin-bottom:var(--space-16)">
          <p class="eyebrow">${esc(T.portada.pilars_eyebrow)}</p>
          <h2>${esc(T.portada.pilars_titol)}</h2>
        </div>
        <div class="pillars">
          ${pilars}
        </div>
      </div>
    </section>

    <section class="quote">
      <div class="quote__media"><img src="${arrelLloc(p)}images/workshop/obrador-rodillo.jpg" alt=""></div>
      <p class="quote__text reveal">${esc(T.portada.cita_3)}</p>
    </section>

    <section class="section" id="colleccio">
      <div class="container">
        <div class="text-center reveal" style="max-width:60ch;margin-inline:auto;margin-bottom:var(--space-16)">
          <p class="eyebrow">${esc(T.portada.colleccio_eyebrow)}</p>
          <h2>${esc(T.portada.colleccio_titol)}</h2>
        </div>
        <div class="collection">
          ${families}
        </div>
      </div>
    </section>

    <section class="quote quote--plain">
      <p class="quote__text reveal">${esc(T.portada.cita_4)}</p>
    </section>

    <section class="section">
      <div class="container">
        <div class="text-center reveal" style="max-width:60ch;margin-inline:auto;margin-bottom:var(--space-12)">
          <p class="eyebrow">${esc(T.portada.maridatge_eyebrow)}</p>
          <h2>${esc(T.portada.maridatge_titol)}</h2>
        </div>
        <div class="pairings reveal" data-delay="1">${maridatges}</div>
      </div>
    </section>

    <section class="quote quote--plain">
      <p class="quote__text reveal">${esc(T.portada.cita_5)}</p>
    </section>

    <section class="section text-center" id="empreses">
      <div class="container container--narrow reveal">
        <p class="eyebrow mx-auto">Ca la Marxanta</p>
        <h2>${esc(T.portada.final_titol)}</h2>
        <hr class="rule mx-auto">
        <p class="lead mx-auto" style="margin-bottom:var(--space-8)">
          ${esc(T.portada.final_text)}
        </p>
        <div class="hero__actions" style="justify-content:center">
          <a class="btn btn--primary" href="${p}${R.colleccio}/">${esc(T.comu.veure_colleccio)}</a>
          <a class="btn btn--secondary" href="${p}${R.empreses}/">${esc(T.portada.final_cta)}</a>
        </div>
      </div>
    </section>
`;

  return head(p, {
    title: T.portada.title,
    desc: T.portada.desc,
    css: CSS_PORTADA,
    transparent: true,
    canonical: `https://www.carquinyolisdhorta.com/${T.codi === 'ca' ? '' : T.codi + '/'}`,
    og: {
      title: T.portada.og_title,
      desc: T.portada.og_desc,
      image: 'https://www.carquinyolisdhorta.com/images/workshop/obrador-hero.jpg',
      locale: T.og_locale
    },
    jsonld,
    pagina: { tipus: 'portada' }
  }) + body + foot(p, { id: 'contacte' });
}

/* ---------- Escriure fitxers ----------
   Una volta per idioma. El català va a l'arrel; el castellà i l'anglès, a /es/
   i /en/. Els noms de carpeta surten de R, mai escrits a mà. */
let total = 0;
for (const codi of IDIOMES) {
  T = TEXTOS[codi];
  R = T.rutes;
  SUB = codi === 'ca' ? '' : '../';
  const DIR = codi === 'ca' ? ROOT : join(ROOT, codi);
  let n = 0;

  for (const [ruta, htmlFn] of [[R.historia, historiaPage], [R.obrador, obradorPage], [R.trobans, trobansPage], [R.barri, barriPage], [R.empreses, empresesPage], [R.contacte, contactePage]]) {
    await mkdir(join(DIR, ruta), { recursive: true });
    await writeFile(join(DIR, ruta, 'index.html'), htmlFn());
    n++;
  }
  for (const lp of legals.pages) {
    const dir = join(DIR, R.legal, tp(lp, 'slug'));
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.html'), legalPage(lp));
    n++;
  }
  await mkdir(DIR, { recursive: true });
  await writeFile(join(DIR, 'index.html'), portadaPage());
  n++;

  await mkdir(join(DIR, R.colleccio), { recursive: true });
  await writeFile(join(DIR, R.colleccio, 'index.html'), collectionPage());
  n++;
  for (const prod of data.productes) {
    const dir = join(DIR, R.colleccio, prod.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'index.html'), productPage(prod));
    n++;
  }
  console.log(`  ${codi} · ${n} pàgines`);
  total += n;
}

/* El 404 va sol a l'arrel i en català: l'allotjament el serveix per a
   qualsevol adreça que no existeixi, sigui de l'idioma que sigui. */
T = TEXTOS.ca; R = T.rutes; SUB = '';
await writeFile(join(ROOT, '404.html'), noTrobadaPage());
console.log(`OK · ${total + 1} pàgines generades en ${IDIOMES.length} idiomes.`);
