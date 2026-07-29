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
const familyById = Object.fromEntries(data.families.map((f) => [f.id, f]));

/* Perfils de sabor orientatius per família (eixos 0–5). Editorial, no analític. */
const FLAVOUR = {
  'carquinyolis-dhorta': [['Cruixent', 5], ['Intensitat', 4], ['Dolçor', 3], ['Torrat', 4], ['Persistència', 4]],
  'porretes-del-padri':  [['Cruixent', 3], ['Tendresa', 4], ['Dolçor', 3], ['Torrat', 4], ['Persistència', 4]],
  'petarrons':           [['Cruixent', 4], ['Mantega', 5], ['Dolçor', 3], ['Aroma', 4], ['Persistència', 3]]
};
const PAIR = { cafe:['☕','Cafè'], te:['🍵','Te'], 'vi-dolc':['🍷','Vi dolç'], cava:['🥂','Cava'], gelat:['🍨','Gelat'], xocolata:['🍫','Xocolata'], llet:['🥛','Llet'], formatge:['🧀','Formatges'] };

const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

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
const ESCENA = (p) => `<img class="form-success__scene" src="${p}images/illustrations/llindar.png"
        width="459" height="737" alt="" aria-hidden="true" loading="lazy" decoding="async">`;

function head(p, { title, desc, jsonld = '' }) {
  return `<!DOCTYPE html>
<html lang="ca">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${p}css/settings.css">
  <link rel="stylesheet" href="${p}css/base.css">
  <link rel="stylesheet" href="${p}css/layout.css">
  <link rel="stylesheet" href="${p}css/animations.css">
  <link rel="stylesheet" href="${p}css/components/navbar.css">
  <link rel="stylesheet" href="${p}css/components/buttons.css">
  <link rel="stylesheet" href="${p}css/components/cards.css">
  <link rel="stylesheet" href="${p}css/components/product.css">
  <link rel="stylesheet" href="${p}css/components/quote.css">
  <link rel="stylesheet" href="${p}css/components/story.css">
  <link rel="stylesheet" href="${p}css/components/forms.css">
  <link rel="stylesheet" href="${p}css/components/footer.css">
  ${jsonld ? `<script type="application/ld+json">${jsonld}</script>` : ''}
</head>
<body>
<a class="skip-link" href="#contingut">Salta al contingut</a>
<header class="header is-scrolled" data-header>
  <div class="header__inner">
    <a class="brand" href="${p}index.html" aria-label="Ca la Marxanta — inici">
      <svg class="brand__mark" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="26" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="28" cy="28" r="20.5" fill="none" stroke="currentColor" stroke-width="0.75" opacity="0.45"/><text x="28" y="35" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="23" font-weight="500" fill="currentColor">M</text><text x="28" y="46.5" text-anchor="middle" font-family="Inter, sans-serif" font-size="5" letter-spacing="1.5" fill="currentColor" opacity="0.85">2018</text></svg>
      <span class="brand__text">Ca la Marxanta<small>Carquinyolis d'Horta</small></span>
    </a>
    <nav class="nav" data-nav aria-label="Navegació principal">
      <ul class="nav__list">
        <li><a class="nav__link" href="${p}historia/">Història</a></li>
        <li><a class="nav__link" href="${p}obrador/">L'obrador</a></li>
        <li><a class="nav__link" href="${p}colleccio/">Col·lecció</a></li>
        <li><a class="nav__link" href="${p}trobans/">On trobar-nos</a></li>
        <li><a class="nav__link" href="${p}empreses/">Empreses</a></li>
        <li><a class="nav__link" href="${p}contacte/">Contacte</a></li>
      </ul>
      <div class="nav__lang" aria-label="Idioma"><a href="${p}index.html" aria-current="true">CA</a><span>ES</span><span>EN</span></div>
    </nav>
    <button class="nav__toggle" data-nav-toggle aria-label="Obre el menú" aria-expanded="false"><span></span><span></span><span></span></button>
  </div>
</header>
<main id="contingut">`;
}

function foot(p) {
  return `</main>
<footer class="footer">
  <div class="container">
    <div class="footer__grid">
      <div>
        <p class="footer__brand-name">Ca la Marxanta</p>
        <p class="footer__tagline">Carquinyolis, Porretes i Petarrons 100% artesans, elaborats al barri d'Horta. No volem vendre't un producte, volem que t'agradi.</p>
        <div class="footer__social"><a href="https://www.instagram.com/calamarxanta_/" target="_blank" rel="noopener" aria-label="Instagram"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg></a></div>
      </div>
      <div class="footer__col"><h4>Explora</h4><ul>
        <li><a href="${p}historia/">La nostra història</a></li>
        <li><a href="${p}obrador/">L'obrador</a></li>
        <li><a href="${p}colleccio/">Col·lecció</a></li>
        <li><a href="${p}trobans/">On trobar-nos</a></li>
        <li><a href="${p}porta-nos-al-teu-barri/">Porta'ns al teu barri</a></li>
        <li><a href="${p}empreses/">Empreses</a></li>
        <li><a href="${p}contacte/">Contacte</a></li>
      </ul></div>
      <div class="footer__col"><h4>Contacte</h4><ul>
        <li>Carrer Plutó, 24<br>08035 Barcelona</li>
        <li><a href="mailto:info@calamarxanta.com">info@calamarxanta.com</a></li>
        <li><a href="tel:+34608387092">+34 608 387 092</a></li>
      </ul></div>
    </div>
    <div class="footer__bottom">
      <p>Carquinyolis d'Horta © <span data-year>2026</span> · Ca la Marxanta</p>
      <div class="footer__legal"><a href="${p}legal/avis-legal/">Nota legal</a><a href="${p}legal/politica-de-privacitat/">Política de privacitat</a><a href="${p}legal/politica-de-cookies/">Política de cookies</a></div>
    </div>
  </div>
</footer>
<script type="module" src="${p}js/main.js"></script>
</body>
</html>`;
}

function card(prod, p) {
  const fam = familyById[prod.familia];
  return `<article class="family-card ${prod.familia === 'petarrons' ? 'family-card--petarrons' : prod.familia === 'porretes-del-padri' ? 'family-card--porretes' : ''} reveal">
    <a href="${p}colleccio/${prod.slug}/" style="display:flex;flex-direction:column;height:100%">
      <div class="family-card__media"><img src="${p}${prod.imatge}" alt="${esc(prod.nom)} ${esc(prod.varietat)}"></div>
      <div class="family-card__body">
        <h3>${esc(prod.nom)}</h3>
        <p class="family-card__variety">${esc(prod.varietat)}${prod.temporada ? ' · de temporada' : ''}</p>
        <span class="link-arrow">Veure la fitxa <span>→</span></span>
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
        <h2>${esc(fam.lema)}</h2>
        <p class="lead">${esc(fam.recepta[0].toUpperCase() + fam.recepta.slice(1))}.</p>
      </div>
      <div class="family-grid">${prods.map((x) => card(x, p)).join('\n')}</div>
    </div>`;
  }).join('\n');

  const body = `
  <section class="section">
    <div class="container">
      <nav class="breadcrumb" aria-label="Molla de pa"><a href="${p}index.html">Inici</a><span>›</span>Col·lecció</nav>
      <div class="page-head text-center" style="max-width:60ch;margin-inline:auto;padding-top:var(--space-12)">
        <p class="eyebrow mx-auto">La nostra col·lecció</p>
        <h1>Hi ha receptes que no canvien. Només milloren amb el temps.</h1>
        <hr class="rule mx-auto">
        <p class="lead mx-auto">Cada recepta neix del mateix compromís: respectar el sabor autèntic, triar bé els ingredients i elaborar cada peça amb la mateixa cura del primer dia.</p>
      </div>
    </div>
  </section>
  <section class="section section--tight"><div class="container">${families}</div></section>
  <section class="quote quote--plain"><p class="quote__text reveal">Cada recepta té la seva pròpia personalitat.</p></section>`;

  return head(p, {
    title: "Col·lecció · Ca la Marxanta — Carquinyolis, Porretes i Petarrons",
    desc: "Descobreix la col·lecció de Ca la Marxanta: Carquinyolis d'Horta, Porretes del Padrí i Petarrons, tots 100% artesans."
  }) + body + foot(p);
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
    name: `${prod.nom} · ${prod.varietat}`,
    brand: { "@type": "Brand", name: "Ca la Marxanta" },
    category: fam.nom, weight: prod.pes, description: prod.descripcio,
    image: `https://www.carquinyolisdhorta.com/${prod.imatge}`
  });

  const body = `
  <section class="section section--tight">
    <div class="container">
      <nav class="breadcrumb" aria-label="Molla de pa"><a href="${p}index.html">Inici</a><span>›</span><a href="${p}colleccio/">Col·lecció</a><span>›</span>${esc(prod.nom)} · ${esc(prod.varietat)}</nav>
      <div class="product" style="margin-top:var(--space-8)">
        <div class="product__media reveal"><img src="${p}${prod.imatge}" alt="Caixa de ${esc(prod.nom)} ${esc(prod.varietat)} (150 g)"></div>
        <div class="product__info reveal" data-delay="1">
          <p class="eyebrow">${esc(fam.nom)}</p>
          <h1>${esc(prod.varietat)}</h1>
          <p class="product__variety">${esc(fam.lema)}</p>
          <p class="product__desc">${esc(prod.descripcio)}</p>
          <div class="product__meta">
            <span class="badge">${esc(prod.pes)}</span>
            <span class="badge">100% artesà</span>
            ${prod.temporada ? '<span class="badge badge--season">Producte de temporada</span>' : ''}
          </div>
          <div class="flavour">
            ${flavour.map(([label, v]) => `<div class="flavour__row"><span class="flavour__label">${label}</span><span class="flavour__bar"><i style="width:${v*20}%"></i></span></div>`).join('\n')}
          </div>
          <a class="btn btn--primary" href="${p}trobans/">On comprar-los</a>
          <p class="product__hint">No el trobes a prop de casa? <a href="${p}porta-nos-al-teu-barri/">Digues-nos on t'agradaria trobar-lo</a>.</p>

          <div class="info-block">
            <h3>Ingredients</h3>
            <p>${esc(prod.ingredients)}</p>
            <div class="allergens">${prod.allergens.map((a) => `<span class="badge">${esc(a)}</span>`).join('')}</div>
            <p style="margin-top:var(--space-3);font-size:.9rem;color:var(--color-tinta-soft)">${esc(prod.traces)} Mantenir en un lloc fresc i sec.</p>
          </div>

          <div class="info-block">
            <table class="nutri">
              <caption>Valors nutricionals per 100 g</caption>
              <tbody>
                <tr><th>Valor energètic</th><td>${esc(n.energia)}</td></tr>
                <tr><th>Greixos</th><td>${esc(n.greixos)} <small>(saturats ${esc(n.greixos_saturats)})</small></td></tr>
                <tr><th>Hidrats de carboni</th><td>${esc(n.hidrats)} <small>(sucres ${esc(n.sucres)})</small></td></tr>
                <tr><th>Proteïnes</th><td>${esc(n.proteines)}</td></tr>
                <tr><th>Sal</th><td>${esc(n.sal)}</td></tr>
              </tbody>
            </table>
          </div>

          <div class="info-block">
            <h3>Marida amb</h3>
            <div class="pairings" style="justify-content:flex-start">
              ${prod.maridatges.map((m) => PAIR[m] ? `<div class="pairing"><span class="pairing__emoji">${PAIR[m][0]}</span><span>${PAIR[m][1]}</span></div>` : '').join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" style="background:var(--color-marfil)">
    <div class="container">
      <p class="eyebrow reveal">Altres receptes</p>
      <h2 class="reveal" style="margin-bottom:var(--space-12)">Descobreix la resta de la col·lecció</h2>
      <div class="related-grid">${related.map((x) => card(x, p)).join('\n')}</div>
    </div>
  </section>`;

  return head(p, {
    title: `${prod.nom} · ${prod.varietat} — Ca la Marxanta`,
    desc: prod.descripcio.slice(0, 155),
    jsonld
  }) + body + foot(p);
}

/* ---------- Pàgina HISTÒRIA ---------- */
function historiaPage() {
  const p = '../';
  const body = `
  <section class="section section--tight">
    <div class="container">
      <nav class="breadcrumb" aria-label="Molla de pa"><a href="${p}index.html">Inici</a><span>›</span>Història</nav>
      <div class="page-head story-intro" style="padding-top:var(--space-12)">
        <p class="eyebrow">La nostra història</p>
        <h1>Les millors històries comencen amb una decisió</h1>
        <hr class="rule">
        <p class="lead">La de fer les coses com sempre s'han fet: amb temps, amb cura i amb ingredients de debò.</p>
      </div>
    </div>
  </section>

  <section class="section section--tight"><div class="container">
    <div class="editorial">
      <div class="editorial__media reveal"><img src="${p}images/workshop/obrador-rodillo.jpg" alt="Treball de la massa a l'obrador"></div>
      <div class="editorial__body reveal" data-delay="1">
        <p class="eyebrow">Les persones</p>
        <h2>D'en Xavier a en Ferran</h2>
        <hr class="rule">
        <p>El 2018, en Xavier va decidir recuperar una recepta i obrir un petit obrador al barri d'Horta. Així va néixer Ca la Marxanta: una aposta valenta per un ofici tradicional.</p>
        <p style="margin-top:1rem">El 2026 comença la història d'en Ferran al costat d'en Xavier, que segueix formant-ne part. No és un relleu que substitueix: és una història que continua creixent, amb la mateixa passió de sempre.</p>
      </div>
    </div>
  </div></section>

  <section class="quote quote--plain"><p class="quote__text reveal">Les tradicions no sobreviuen per casualitat. Sobreviuen perquè algú decideix protegir-les.</p></section>

  <section class="section section--tight"><div class="container">
    <div class="editorial editorial--reverse">
      <div class="editorial__media reveal"><img src="${p}images/workshop/obrador-masa.jpg" alt="Massa enfarinada a l'obrador"></div>
      <div class="editorial__body reveal" data-delay="1">
        <p class="eyebrow">El nom</p>
        <h2>Per què "Ca la Marxanta"?</h2>
        <hr class="rule">
        <p>Una <em>marxanta</em> és qui va al mercat, qui recorre camins portant el bon producte d'un lloc a un altre. El nom evoca aquest ofici antic i de proximitat: avui, els nostres carquinyolis viatgen de l'obrador d'Horta a les taules de Catalunya.</p>
      </div>
    </div>
  </div></section>

  <section class="section section--tight"><div class="container story-intro">
    <p class="eyebrow">El barri d'Horta</p>
    <h2>Sóc d'Horta</h2>
    <hr class="rule">
    <p>El barri d'Horta és un dels més carismàtics de Barcelona; sempre ha mantingut la seva identitat. Fins i tot hi pots veure gent que desfila orgullosa amb samarretes que diuen "Sóc d'Horta". De vegades fa la sensació de no ser a Barcelona: l'ambient que s'hi respira és ben diferent.</p>
  </div></section>

  <section class="section" style="background:var(--color-marfil)"><div class="container">
    <div class="story-intro reveal" style="margin-bottom:var(--space-12)">
      <p class="eyebrow">La nostra promesa</p>
      <h2>El que mai canvia</h2>
    </div>
    <ul class="promise reveal" data-delay="1">
      <li>Elaboració artesana</li>
      <li>Ingredients triats, de proximitat</li>
      <li>Producció acurada, sense pressa</li>
      <li>Proximitat i tracte proper</li>
      <li>Compromís amb la qualitat</li>
    </ul>
  </div></section>

  <section class="section text-center"><div class="container container--narrow reveal">
    <h2>Cada dia tornem a començar</h2>
    <hr class="rule mx-auto">
    <p class="lead mx-auto" style="margin-bottom:var(--space-8)">Perquè creiem que les millors tradicions mereixen seguir vives.</p>
    <a class="btn btn--primary" href="${p}obrador/">Descobreix com els elaborem</a>
  </div></section>`;
  return head(p, { title: "La nostra història · Ca la Marxanta", desc: "La història de Ca la Marxanta: d'en Xavier a en Ferran, un obrador de carquinyolis artesans nascut al barri d'Horta el 2018." }) + body + foot(p);
}

/* ---------- Pàgina OBRADOR ---------- */
function obradorPage() {
  const p = '../';
  const steps = [
    ['Selecció', "Triem avellanes i ametlles de Catalunya, mantega artesana i pell de llimona ecològica."],
    ['Mescla', "Pastem els ingredients amb la proporció justa, sense additius innecessaris."],
    ['Treball manual', "Donem forma a la massa a mà, amb la cura de sempre."],
    ['Primer forn', "Una primera cocció que assenta la massa i concentra el sabor."],
    ['Tall un a un', "Tallem cada carquinyoli un a un abans del segon forn. Per això no queden en forma de llesca."],
    ['Segon forn', "La segona cocció és la que els dona el cruixent característic."],
    ['Envasat', "Els envasem amb cura perquè arribin perfectes a casa teva."]
  ];
  const ingredients = [
    ['Ametlla i avellana', "De Catalunya. Aporten el sabor intens i característic dels nostres carquinyolis."],
    ['Mantega artesana', "100% artesana: el cor dels Petarrons i la seva textura inconfusible."],
    ['Pell de llimona ecològica', "Un toc fresc i aromàtic, present a gairebé totes les receptes."],
    ['Ou', "Lliga la massa i aporta estructura; als Petarrons, en fem servir la clara."],
    ['Sucre morè', "Per a una dolçor justa, mai excessiva."],
    ['Farina de blat', "La base de tota la família, treballada amb temps i paciència."]
  ];
  const body = `
  <section class="section section--tight">
    <div class="container">
      <nav class="breadcrumb" aria-label="Molla de pa"><a href="${p}index.html">Inici</a><span>›</span>L'obrador</nav>
      <div class="page-head story-intro" style="padding-top:var(--space-12)">
        <p class="eyebrow">L'obrador</p>
        <h1>Les coses ben fetes necessiten temps</h1>
        <hr class="rule">
        <p class="lead">No busquem produir més. Busquem fer-ho millor.</p>
      </div>
    </div>
  </section>

  <section class="section section--tight"><div class="container">
    <div class="story-intro reveal" style="margin-bottom:var(--space-16)">
      <p class="eyebrow">El procés artesanal</p>
      <h2>Set passos, sense dreceres</h2>
    </div>
    <div class="steps">
      ${steps.map(([t, d], i) => `<article class="step reveal"><span class="step__num">${String(i + 1).padStart(2, '0')}</span><div><h3>${t}</h3><p>${d}</p></div></article>`).join('\n')}
    </div>
  </div></section>

  <section class="quote"><div class="quote__media"><img src="${p}images/workshop/obrador-masa.jpg" alt=""></div><p class="quote__text reveal">No creiem en les dreceres. Creiem en el temps, en les mans i en el respecte per una recepta.</p></section>

  <section class="section"><div class="container">
    <div class="story-intro reveal" style="margin-bottom:var(--space-12)">
      <p class="eyebrow">Els nostres ingredients</p>
      <h2>Els bons ingredients mai necessiten amagar-se</h2>
    </div>
    <div class="ingredients-grid">
      ${ingredients.map(([t, d]) => `<article class="ingredient reveal"><h3>${t}</h3><p>${d}</p></article>`).join('\n')}
    </div>
  </div></section>

  <section class="section text-center" style="background:var(--color-marfil)"><div class="container container--narrow reveal">
    <h2>Ja tens gana?</h2>
    <hr class="rule mx-auto">
    <p class="lead mx-auto" style="margin-bottom:var(--space-8)">Descobreix tota la col·lecció i troba el teu preferit.</p>
    <a class="btn btn--primary" href="${p}colleccio/">Veure la col·lecció</a>
  </div></section>`;
  return head(p, { title: "L'obrador · Ca la Marxanta", desc: "Així elaborem els nostres carquinyolis: set passos artesanals, tallats un a un i de doble cocció, amb ingredients de proximitat." }) + body + foot(p);
}

/* ---------- Pàgina TROBA'NS ---------- */
function trobansPage() {
  const p = '../';
  const zones = ['Tots', ...venda.zones];
  const filters = zones.map((z, i) =>
    `<button class="filter ${i === 0 ? 'is-active' : ''}" data-zone="${z === 'Tots' ? 'tots' : esc(z)}">${esc(z)}</button>`).join('\n');
  const shops = venda.establiments.map((s) => {
    const q = encodeURIComponent(`${s.nom}, ${s.adreca}, ${s.cp} Barcelona`);
    return `<article class="shop reveal" data-zone="${esc(s.zona)}">
      <p class="shop__zone">${esc(s.zona)}</p>
      <h3>${esc(s.nom)}</h3>
      <p>${esc(s.adreca)}<br>${esc(s.cp)}</p>
      <a class="link-arrow" href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener">Veure al mapa <span>→</span></a>
    </article>`;
  }).join('\n');
  const body = `
  <section class="section section--tight">
    <div class="container">
      <nav class="breadcrumb" aria-label="Molla de pa"><a href="${p}index.html">Inici</a><span>›</span>On trobar-nos</nav>
      <div class="page-head story-intro" style="padding-top:var(--space-12)">
        <p class="eyebrow">On trobar-nos</p>
        <h1>On pots comprar els nostres productes</h1>
        <hr class="rule">
        <p class="lead">Pots trobar els nostres Carquinyolis, Porretes i Petarrons en aquests establiments de Barcelona i Catalunya.</p>
      </div>
    </div>
  </section>

  <section class="section section--tight"><div class="container">
    <form class="shop-search" role="search" onsubmit="return false">
      <label for="shop-q">Busca pel teu barri, població o codi postal</label>
      <input id="shop-q" type="search" data-search placeholder="Gràcia, Sabadell, 08035…" autocomplete="off">
    </form>
    <div class="filters" data-filters>${filters}</div>
    <div class="shops">${shops}</div>
    <div class="invite" data-empty hidden>
      <h2 data-empty-title>Encara no ens hi trobaràs</h2>
      <p>Però ens hi agradaria arribar. Coneixes una botiga que hi encaixaria? Digues-nos-ho i hi anirem a trucar.</p>
      <a class="btn btn--primary" href="${p}porta-nos-al-teu-barri/" data-empty-cta>Recomana'ns una botiga</a>
    </div>

    <div class="invite invite--band reveal">
      <h3>No ens trobes a prop de casa?</h3>
      <p>Som en 23 establiments, però ens en falten molts. Si al teu barri o a la teva ciutat hi ha una botiga que hi encaixaria, recomana-la: cada recomanació ens obre una porta.</p>
      <a class="btn btn--secondary" href="${p}porta-nos-al-teu-barri/">Porta'ns al teu barri</a>
    </div>
  </div></section>

  <section class="section text-center" style="background:var(--color-marfil)"><div class="container container--narrow reveal">
    <p class="eyebrow mx-auto">Empreses i professionals</p>
    <h2>Tens un negoci i vols oferir els nostres productes?</h2>
    <hr class="rule mx-auto">
    <p class="lead mx-auto" style="margin-bottom:var(--space-8)">Col·laborem amb cafeteries, restaurants, hotels i botigues gurmet.</p>
    <a class="btn btn--primary" href="${p}empreses/">Parlem-ne</a>
  </div></section>`;
  return head(p, { title: "On trobar-nos · Ca la Marxanta", desc: "Llistat de botigues i establiments on comprar els carquinyolis, porretes i petarrons de Ca la Marxanta a Barcelona i Catalunya." }) + body + foot(p);
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
      <p class="eyebrow">On ens demaneu</p>
      <h2>Els barris que ens reclamen</h2>
      <hr class="rule">
      <p class="lead">Aquestes són les zones des d'on més ens heu escrit. Hi estem treballant.</p>
    </div>
    <div class="demand">
      ${zones.map((z) => `<div class="demand__item reveal"><span class="demand__num">${esc(z.peticions)}</span><p class="demand__zone">${esc(z.nom)}</p></div>`).join('\n')}
    </div>
    ${cites.length ? `<div style="margin-top:var(--space-16)">${cites.map((c) => `<blockquote class="testimoni reveal"><p>«${esc(c.text)}»</p><cite>${esc(c.autor || 'Una recomanació rebuda')}</cite></blockquote>`).join('\n')}</div>` : ''}
  </div></section>` : '';

  const body = `
  <section class="section section--tight">
    <div class="container">
      <nav class="breadcrumb" aria-label="Molla de pa"><a href="${p}index.html">Inici</a><span>›</span><a href="${p}trobans/">On trobar-nos</a><span>›</span>Porta'ns al teu barri</nav>
      <div class="page-head story-intro" style="padding-top:var(--space-12)">
        <p class="eyebrow">Porta'ns al teu barri</p>
        <h1 data-barri-title>Quina botiga hi encaixaria?</h1>
        <hr class="rule">
        <p class="lead" data-barri-lead>Si al teu barri o a la teva ciutat no ens trobes, ajuda'ns a arribar-hi. Digues-nos quina botiga hi encaixaria i hi anirem a trucar de part teva.</p>
      </div>
    </div>
  </section>

  <section class="section section--tight"><div class="container">
    <form class="form reveal" name="barri" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" data-form="barri" novalidate>
      <input type="hidden" name="form-name" value="barri">
      <p hidden aria-hidden="true"><label>No omplis aquest camp <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
      <div class="form__grid">
        <div class="field"><label for="b-barri">El teu barri o ciutat *</label><input id="b-barri" name="barri" required autocomplete="address-level3"><span class="field__error"></span></div>
        <div class="field"><label for="b-cp">Codi postal</label><input id="b-cp" name="cp" inputmode="numeric" autocomplete="postal-code"><span class="field__error"></span></div>
        <div class="field"><label for="b-botiga">Botiga que recomanes</label><input id="b-botiga" name="botiga" placeholder="Nom de la botiga"><span class="field__error"></span></div>
        <div class="field"><label for="b-on">On és</label><input id="b-on" name="on_es" placeholder="Adreça o Instagram"><span class="field__error"></span></div>
        <div class="field form__row--full"><label for="b-motiu">Per què hi encaixaria?</label><textarea id="b-motiu" name="motiu" placeholder="És una botiga de barri amb producte de proximitat…"></textarea><span class="field__error"></span></div>
        <div class="field"><label for="b-nom">El teu nom</label><input id="b-nom" name="nom" autocomplete="name"><span class="field__error"></span></div>
        <div class="field"><label for="b-email">Correu</label><input id="b-email" name="email" type="email" autocomplete="email"><span class="field__error"></span></div>
        <div class="form__row--full"><label class="consent"><input type="checkbox" name="rgpd" required> Accepto la <a href="${p}legal/politica-de-privacitat/">política de privacitat</a> i el tractament de les meves dades. *</label><span class="field__error"></span></div>
        <div class="form__row--full"><label class="consent"><input type="checkbox" name="citable"> Autoritzo que Ca la Marxanta expliqui a la botiga que la recomanació ve d'un client del barri (sense donar el meu nom).</label></div>
      </div>
      <p class="form-error" data-form-error hidden role="alert">No hem pogut enviar el formulari. Torna-ho a provar o escriu-nos a <a href="mailto:info@calamarxanta.com">info@calamarxanta.com</a>.</p>
      <p style="margin-top:var(--space-8)"><button type="submit" class="btn btn--primary">Enviar la recomanació</button></p>
    </form>
    <div class="form-success" id="barri-success">
      ${ESCENA(p)}
      ${SEGELL}
      <h3>Gràcies per obrir-nos una porta</h3>
      ${DIVISOR}
      <p class="form-success__lead">Hem apuntat la teva recomanació<span data-success-lloc></span>.<br>Cada botiga que ens recomaneu és una <strong>conversa</strong> que comencem amb molt <strong>més sentit</strong>.</p>
      <p class="form-success__note">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 11h18"/><circle cx="8" cy="15" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="15" r="1.1" fill="currentColor" stroke="none"/></svg>
        <span>Si ens has deixat el correu,<br>t'avisarem el dia que hi arribem.</span>
      </p>
    </div>
  </div></section>
${demanda}
  <section class="section text-center" style="background:var(--color-xocolata);color:var(--color-blanc-trencat)"><div class="container container--narrow reveal">
    <p class="eyebrow mx-auto" style="color:var(--color-or)">I si la botiga ets tu?</p>
    <h2>Tens un negoci i vols oferir els nostres productes?</h2>
    <hr class="rule mx-auto">
    <p class="lead mx-auto" style="margin-bottom:var(--space-8);color:rgba(250,247,241,.85)">No cal esperar que et recomanin: escriu-nos i en parlem.</p>
    <a class="btn btn--ghost-light" href="${p}empreses/">Parlem-ne</a>
  </div></section>`;
  return head(p, {
    title: "Porta'ns al teu barri · Ca la Marxanta",
    desc: "No trobes els nostres carquinyolis al teu barri? Recomana'ns una botiga de la teva zona i hi anirem a trucar de part teva."
  }) + body + foot(p);
}

/* ---------- Pàgina EMPRESES (B2B) ---------- */
function empresesPage() {
  const p = '../';
  const sectors = [
    ['Cafeteries', "Per afegir valor a l'experiència del cafè."],
    ['Restaurants', "Un postre tradicional, un detall per a la sobretaula."],
    ['Hotels', "Producte premium per a esmorzars i amenities."],
    ['Botigues gurmet', "Per diferenciar el lineal amb producte artesà."],
    ['Vinoteques i cellers', "Maridatges, enoturisme i regals."],
    ['Empreses', "Detalls corporatius, Nadal i esdeveniments."],
    ['Distribuïdors', "Relacions comercials duradores i de confiança."]
  ];
  const reasons = [
    ['Elaboració artesana', "Tallats un a un, de doble cocció, sense pressa."],
    ['Ingredients triats', "Avellanes i ametlles de Catalunya i mantega artesana."],
    ['Imatge premium', "Un packaging cuidat que llueix a qualsevol lineal."],
    ['Proximitat', "Tracte proper i atenció personalitzada."]
  ];
  const steps = ["Ens expliques el teu projecte", "Coneixem les teves necessitats", "T'assessorem", "Preparem una proposta", "Comencem a col·laborar"];
  const body = `
  <section class="section section--tight">
    <div class="container">
      <nav class="breadcrumb" aria-label="Molla de pa"><a href="${p}index.html">Inici</a><span>›</span>Empreses</nav>
      <div class="page-head story-intro" style="padding-top:var(--space-12)">
        <p class="eyebrow">Empreses i professionals</p>
        <h1>Porta la tradició de Ca la Marxanta al teu negoci</h1>
        <hr class="rule">
        <p class="lead">Col·laborem amb professionals que valoren la qualitat, l'artesania i les relacions basades en la confiança.</p>
        <p style="margin-top:var(--space-6)"><a class="btn btn--primary" href="#contacte-b2b">Vull col·laborar</a></p>
      </div>
    </div>
  </section>

  <section class="section section--tight"><div class="container">
    <div class="story-intro reveal" style="margin-bottom:var(--space-12)"><p class="eyebrow">Amb qui treballem</p><h2>Un producte que encaixa al teu negoci</h2></div>
    <div class="ingredients-grid">
      ${sectors.map(([t, d]) => `<article class="ingredient reveal"><h3>${t}</h3><p>${d}</p></article>`).join('\n')}
    </div>
  </div></section>

  <section class="section" style="background:var(--color-marfil)"><div class="container">
    <div class="story-intro reveal" style="margin-bottom:var(--space-12)"><p class="eyebrow">Per què triar-nos</p><h2>Qualitat de debò, de principi a fi</h2></div>
    <div class="pillars">
      ${reasons.map(([t, d]) => `<article class="pillar reveal" style="text-align:left"><h3>${t}</h3><p style="margin:0">${d}</p></article>`).join('\n')}
    </div>
  </div></section>

  <section class="section section--tight"><div class="container">
    <div class="story-intro reveal" style="margin-bottom:var(--space-12)"><p class="eyebrow">Com treballem</p><h2>Començar és senzill</h2></div>
    <div class="steps">
      ${steps.map((t, i) => `<article class="step reveal"><span class="step__num">${String(i + 1).padStart(2, '0')}</span><div><h3>${t}</h3></div></article>`).join('\n')}
    </div>
  </div></section>

  <section class="section" id="contacte-b2b"><div class="container">
    <div class="story-intro reveal" style="margin-bottom:var(--space-8)"><p class="eyebrow">Parlem-ne</p><h2>Explica'ns el teu projecte</h2><p class="lead">Si busques un proveïdor de confiança per incorporar un producte artesà de qualitat, ens encantarà conèixer-te.</p></div>
    <form class="form reveal" name="empreses" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" data-form="empreses" novalidate>
      <input type="hidden" name="form-name" value="empreses">
      <p hidden aria-hidden="true"><label>No omplis aquest camp <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
      <div class="form__grid">
        <div class="field"><label for="e-nom">Nom *</label><input id="e-nom" name="nom" required><span class="field__error"></span></div>
        <div class="field"><label for="e-empresa">Empresa *</label><input id="e-empresa" name="empresa" required><span class="field__error"></span></div>
        <div class="field"><label for="e-carrec">Càrrec</label><input id="e-carrec" name="carrec"><span class="field__error"></span></div>
        <div class="field"><label for="e-email">Correu electrònic *</label><input id="e-email" name="email" type="email" required><span class="field__error"></span></div>
        <div class="field"><label for="e-tel">Telèfon</label><input id="e-tel" name="telefon" type="tel"><span class="field__error"></span></div>
        <div class="field"><label for="e-prov">Província</label><input id="e-prov" name="provincia"><span class="field__error"></span></div>
        <div class="field"><label for="e-tipus">Tipus de negoci</label><select id="e-tipus" name="tipus"><option value="">Selecciona…</option><option>Restaurant</option><option>Hotel</option><option>Cafeteria</option><option>Distribuïdor</option><option>Botiga</option><option>Empresa</option><option>Altres</option></select><span class="field__error"></span></div>
        <div class="field"><label for="e-volum">Volum aproximat</label><select id="e-volum" name="volum"><option value="">Selecciona…</option><option>Petit (degustació)</option><option>Mitjà (puntual)</option><option>Gran (recurrent)</option></select><span class="field__error"></span></div>
        <div class="field form__row--full"><label>Quins productes t'interessen?</label><div class="checks">
          <label class="check"><input type="checkbox" name="productes" value="Carquinyolis"> Carquinyolis</label>
          <label class="check"><input type="checkbox" name="productes" value="Porretes"> Porretes</label>
          <label class="check"><input type="checkbox" name="productes" value="Petarrons"> Petarrons</label>
          <label class="check"><input type="checkbox" name="productes" value="Tots"> Tots</label>
        </div></div>
        <div class="field form__row--full"><label for="e-msg">Missatge</label><textarea id="e-msg" name="missatge"></textarea><span class="field__error"></span></div>
        <div class="form__row--full"><label class="consent"><input type="checkbox" name="rgpd" required> Accepto la <a href="${p}legal/politica-de-privacitat/">política de privacitat</a> i el tractament de les meves dades. *</label><span class="field__error"></span></div>
      </div>
      <p class="form-error" data-form-error hidden role="alert">No hem pogut enviar el formulari. Torna-ho a provar o escriu-nos a <a href="mailto:info@calamarxanta.com">info@calamarxanta.com</a>.</p>
      <p style="margin-top:var(--space-8)"><button type="submit" class="btn btn--primary">Sol·licitar informació</button></p>
    </form>
    <div class="form-success" id="empreses-success">
      ${ESCENA(p)}
      ${SEGELL}
      <h3>Hem rebut el teu projecte</h3>
      ${DIVISOR}
      <p class="form-success__lead">El llegirem amb calma i et respondrem <strong>personalment</strong>. No treballem amb catàlegs automàtics: preferim entendre primer què necessites.</p>
      <p class="form-success__note">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h2.2a1.5 1.5 0 0 1 1.45 1.1l.7 2.5a1.5 1.5 0 0 1-.5 1.55l-1.3 1a12 12 0 0 0 5.8 5.8l1-1.3a1.5 1.5 0 0 1 1.55-.5l2.5.7A1.5 1.5 0 0 1 20 16.3v2.2a1.5 1.5 0 0 1-1.5 1.5A15 15 0 0 1 4 5.5Z"/></svg>
        <span>Si tens pressa, truca'ns al <a href="tel:+34608387092">+34 608 387 092</a>.</span>
      </p>
    </div>
  </div></section>`;
  return head(p, { title: "Empreses i professionals · Ca la Marxanta", desc: "Distribució de carquinyolis, porretes i petarrons artesans per a cafeteries, restaurants, hotels, botigues gurmet i distribuïdors." }) + body + foot(p);
}

/* ---------- Pàgina CONTACTE ---------- */
function contactePage() {
  const p = '../';
  const body = `
  <section class="section section--tight">
    <div class="container">
      <nav class="breadcrumb" aria-label="Molla de pa"><a href="${p}index.html">Inici</a><span>›</span>Contacte</nav>
      <div class="page-head story-intro" style="padding-top:var(--space-12)">
        <p class="eyebrow">Contacte</p>
        <h1>Parlem</h1>
        <hr class="rule">
        <p class="lead">Per qualsevol dubte o informació que necessitis, contacta amb nosaltres. Estarem encantats d'atendre't!</p>
      </div>
    </div>
  </section>

  <section class="section section--tight"><div class="container">
    <div class="editorial">
      <div class="editorial__body reveal">
        <div class="contact-info">
          <div><span class="label">Adreça</span>Carrer Plutó, 24 · 08035 Barcelona</div>
          <div><span class="label">Correu</span><a href="mailto:info@calamarxanta.com">info@calamarxanta.com</a></div>
          <div><span class="label">Telèfon</span><a href="tel:+34608387092">+34 608 387 092</a></div>
          <div><span class="label">Instagram</span><a href="https://www.instagram.com/calamarxanta_/" target="_blank" rel="noopener">@calamarxanta_</a></div>
        </div>
      </div>
      <div class="editorial__media reveal" data-delay="1">
        <form class="form" name="contacte" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" data-form="contacte" novalidate style="max-width:none">
          <input type="hidden" name="form-name" value="contacte">
          <p hidden aria-hidden="true"><label>No omplis aquest camp <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
          <div class="form__grid">
            <div class="field"><label for="c-nom">Nom *</label><input id="c-nom" name="nom" required><span class="field__error"></span></div>
            <div class="field"><label for="c-email">Correu electrònic *</label><input id="c-email" name="email" type="email" required><span class="field__error"></span></div>
            <div class="field form__row--full"><label for="c-msg">Missatge *</label><textarea id="c-msg" name="missatge" required></textarea><span class="field__error"></span></div>
            <div class="form__row--full"><label class="consent"><input type="checkbox" name="rgpd" required> Accepto la <a href="${p}legal/politica-de-privacitat/">política de privacitat</a>. *</label><span class="field__error"></span></div>
          </div>
          <p class="form-error" data-form-error hidden role="alert">No hem pogut enviar el formulari. Torna-ho a provar o escriu-nos a <a href="mailto:info@calamarxanta.com">info@calamarxanta.com</a>.</p>
          <p style="margin-top:var(--space-6)"><button type="submit" class="btn btn--primary">Escriu-nos</button></p>
        </form>
        <div class="form-success" id="contacte-success">
          ${SEGELL}
          <h3>Missatge rebut</h3>
          ${DIVISOR}
          <p class="form-success__lead">El llegirem nosaltres i et respondrem <strong>personalment</strong>.</p>
          <p class="form-success__note">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h2.2a1.5 1.5 0 0 1 1.45 1.1l.7 2.5a1.5 1.5 0 0 1-.5 1.55l-1.3 1a12 12 0 0 0 5.8 5.8l1-1.3a1.5 1.5 0 0 1 1.55-.5l2.5.7A1.5 1.5 0 0 1 20 16.3v2.2a1.5 1.5 0 0 1-1.5 1.5A15 15 0 0 1 4 5.5Z"/></svg>
            <span>Si tens pressa, truca'ns al <a href="tel:+34608387092">+34 608 387 092</a>.</span>
          </p>
        </div>
      </div>
    </div>
  </div></section>`;
  return head(p, { title: "Contacte · Ca la Marxanta", desc: "Contacta amb Ca la Marxanta: Carrer Plutó 24, 08035 Barcelona · info@calamarxanta.com · +34 608 387 092." }) + body + foot(p);
}

/* ---------- Pàgina 404 ----------
   Va a l'arrel: Netlify (i la majoria d'allotjaments estàtics) la fan servir
   automàticament, així ningú no veu la pantalla d'error del proveïdor.
   Compte: les rutes han de ser absolutes, perquè aquesta pàgina es serveix
   des de qualsevol nivell de l'adreça. */
function noTrobadaPage() {
  /* Adreces absolutes a partir de l'arrel del lloc. Per defecte '/', però en un
     subdirectori (p. ex. GitHub Pages) cal indicar-ho:
       BASE=/ca-la-marxanta-web/ node build/build-pages.mjs */
  const arrel = process.env.BASE || '/';
  const body = `
  <section class="section"><div class="container container--narrow text-center" style="padding-top:var(--space-16)">
    <p class="eyebrow mx-auto">Error 404</p>
    <h1>Aquesta pàgina no existeix</h1>
    <hr class="rule mx-auto">
    <p class="lead" style="margin-bottom:var(--space-12)">Potser l'enllaç era antic o hi ha alguna lletra fora de lloc. Tornem al camí?</p>
    <p style="display:flex;gap:var(--space-4);flex-wrap:wrap;justify-content:center">
      <a class="btn btn--primary" href="${arrel}">Anar a l'inici</a>
      <a class="btn btn--secondary" href="${arrel}colleccio/">Veure la col·lecció</a>
      <a class="btn btn--secondary" href="${arrel}trobans/">On trobar-nos</a>
    </p>
  </div></section>`;
  return head(arrel, { title: 'Pàgina no trobada · Ca la Marxanta', desc: "La pàgina que busques no existeix. Torna a l'inici de Ca la Marxanta." }) + body + foot(arrel);
}

/* ---------- Pàgines LEGALS ---------- */
function legalPage(page) {
  const p = '../../';
  const blocks = page.blocks.map((b) =>
    (b.h ? `<h2>${esc(b.h)}</h2>` : '') + b.p.map((par) => `<p>${par}</p>`).join('\n')).join('\n');
  const body = `
  <section class="section section--tight"><div class="container">
    <nav class="breadcrumb" aria-label="Molla de pa"><a href="${p}index.html">Inici</a><span>›</span>${esc(page.title)}</nav>
    <div class="page-head" style="padding-top:var(--space-8)"><h1>${esc(page.title)}</h1><hr class="rule"></div>
    <div class="legal reveal">${blocks}</div>
  </div></section>`;
  return head(p, { title: `${page.title} · Ca la Marxanta`, desc: `${page.title} de Ca la Marxanta (Carquinyolis d'Horta).` }) + body + foot(p);
}

/* ---------- Escriure fitxers ---------- */
for (const [name, htmlFn] of [['historia', historiaPage], ['obrador', obradorPage], ['trobans', trobansPage], ['porta-nos-al-teu-barri', barriPage], ['empreses', empresesPage], ['contacte', contactePage]]) {
  await mkdir(join(ROOT, name), { recursive: true });
  await writeFile(join(ROOT, name, 'index.html'), htmlFn());
}
for (const lp of legals.pages) {
  const dir = join(ROOT, 'legal', lp.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), legalPage(lp));
}
await writeFile(join(ROOT, '404.html'), noTrobadaPage());

await mkdir(join(ROOT, 'colleccio'), { recursive: true });
await writeFile(join(ROOT, 'colleccio', 'index.html'), collectionPage());
let count = 0;
for (const prod of data.productes) {
  const dir = join(ROOT, 'colleccio', prod.slug);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), productPage(prod));
  count++;
}
console.log(`OK · col·lecció + ${count} fitxes generades.`);
