/* =====================================================================
   comprova-enllacos.mjs — cap enllaç intern trencat, cap fitxer que falti
   Ús:  node build/comprova-enllacos.mjs
   Recorre tots els .html generats, resol cada href/src relatiu contra el
   disc i avisa del que no existeix. Amb tres idiomes i carpetes que canvien
   de nom, aquesta comprovació val més que llegir-se el codi.
   ===================================================================== */
import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IGNORA = new Set(['node_modules', '.git', 'build', 'PARA-SUBIR-A-NETLIFY']);

async function htmls(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (IGNORA.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) await htmls(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const existeix = async (p) => { try { await stat(p); return true; } catch { return false; } };

const fitxers = await htmls(ROOT);
const problemes = [];
let comprovats = 0;

for (const f of fitxers) {
  const html = await readFile(f, 'utf8');
  const base = dirname(f);
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    // Fora: adreces externes, àncores, correu, telèfon i el 404 (rutes absolutes)
    if (/^(https?:|mailto:|tel:|#|data:)/.test(ref)) continue;
    if (ref.startsWith('/')) continue;
    const net = ref.split('#')[0].split('?')[0];
    if (!net) continue;
    const desti = resolve(base, net);
    const objectiu = net.endsWith('/') ? join(desti, 'index.html') : desti;
    comprovats++;
    if (!(await existeix(objectiu))) {
      problemes.push(`${relative(ROOT, f).replace(/\\/g, '/')} → ${ref}`);
    }
  }
}

if (problemes.length) {
  console.error(`✗ ${problemes.length} enllaços trencats:\n` + [...new Set(problemes)].map((p) => '  · ' + p).join('\n'));
  process.exit(1);
}
console.log(`OK · ${comprovats} enllaços comprovats a ${fitxers.length} pàgines, cap de trencat.`);
