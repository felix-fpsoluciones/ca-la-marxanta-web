/* =====================================================================
   comprova-textos.mjs — que els tres fitxers d'idioma diguin el mateix
   Ús:  node build/comprova-textos.mjs
   Avisa de claus que falten, que sobren, de llistes amb un nombre diferent
   d'elements i de marcadors ({lloc}, {zona}) perduts en traduir.
   ===================================================================== */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IDIOMES = ['ca', 'es', 'en'];
const T = {};
for (const c of IDIOMES) T[c] = JSON.parse(await readFile(join(ROOT, 'data', `textos.${c}.json`), 'utf8'));

/* Aplana l'objecte a "seccio.clau" → valor, ignorant els comentaris (_...) */
function aplana(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('_')) continue;
    const clau = prefix ? `${prefix}.${k}` : k;
    if (Array.isArray(v)) out[clau] = v;
    else if (v && typeof v === 'object') aplana(v, clau, out);
    else out[clau] = v;
  }
  return out;
}

const pla = Object.fromEntries(IDIOMES.map((c) => [c, aplana(T[c])]));
const problemes = [];

for (const idioma of IDIOMES.slice(1)) {
  const base = pla.ca, altre = pla[idioma];
  for (const clau of Object.keys(base)) {
    if (!(clau in altre)) { problemes.push(`${idioma}: falta «${clau}»`); continue; }
    const a = base[clau], b = altre[clau];
    if (Array.isArray(a) !== Array.isArray(b)) {
      problemes.push(`${idioma}: «${clau}» hauria de ser ${Array.isArray(a) ? 'una llista' : 'un text'}`);
    } else if (Array.isArray(a)) {
      if (a.length !== b.length) problemes.push(`${idioma}: «${clau}» té ${b.length} elements i el català ${a.length}`);
      a.forEach((el, i) => {
        if (Array.isArray(el) && Array.isArray(b[i]) && el.length !== b[i].length) {
          problemes.push(`${idioma}: «${clau}[${i}]» té ${b[i].length} camps i el català ${el.length}`);
        }
      });
    } else if (typeof a === 'string') {
      // Els marcadors {lloc} i {zona} han de sobreviure a la traducció
      const marcadors = (s) => (String(s).match(/\{[a-z_]+\}/g) || []).sort().join(',');
      if (marcadors(a) !== marcadors(b)) {
        problemes.push(`${idioma}: «${clau}» hauria de portar ${marcadors(a) || '(cap marcador)'} i porta ${marcadors(b) || '(cap)'}`);
      }
      if (!String(b).trim()) problemes.push(`${idioma}: «${clau}» és buit`);
    }
  }
  for (const clau of Object.keys(altre)) {
    if (!(clau in pla.ca)) problemes.push(`${idioma}: sobra «${clau}» (no és al català)`);
  }
}

/* Les rutes no poden xocar entre elles dins d'un mateix idioma */
for (const c of IDIOMES) {
  const rutes = Object.values(T[c].rutes);
  const repetides = rutes.filter((r, i) => rutes.indexOf(r) !== i);
  if (repetides.length) problemes.push(`${c}: rutes repetides → ${[...new Set(repetides)].join(', ')}`);
}

if (problemes.length) {
  console.error(`✗ ${problemes.length} problemes:\n` + problemes.map((p) => '  · ' + p).join('\n'));
  process.exit(1);
}
console.log(`OK · els ${IDIOMES.length} fitxers d'idioma tenen les mateixes ${Object.keys(pla.ca).length} claus.`);
