# Ca la Marxanta — Web

Web premium de Ca la Marxanta (Carquinyolis d'Horta). HTML5 + CSS3 + JavaScript Vanilla, arquitectura modular. Sin frameworks.

Basada en la **Web Experience Bible** (`../CA-LA-MARXANTA-Web-Experience-Bible.md`).

## Estado (Fase 1 — en curso)

- [x] Sistema de diseño en tokens (`css/settings.css`)
- [x] Estructura modular CSS/JS
- [x] **Home narrativa** (`index.html`) — catalán
- [x] Datos reales de producto (`data/productes.json`, 9 SKU) y puntos de venta (`data/punts-venda.json`, 23)
- [x] Páginas: Història, Obrador, Col·lecció + 9 fichas, Empreses, Dónde encontrarnos, Contacte, Legals
- [x] **Porta'ns al teu barri** (`porta-nos-al-teu-barri/`) — recomendación de tienda por parte del cliente
- [ ] Versiones **castellano** e **inglés** (estructura i18n prevista)
- [ ] Sustituir fotos de obrador (placeholders stock) por sesión real

## Formularios

Los tres formularios (`contacte`, `empreses`, `barri`) están **ya cableados para
Netlify Forms**: `name`, `method="POST"`, `data-netlify="true"`, el `<input hidden
name="form-name">` y un honeypot anti-spam (`bot-field`). No hay dependencias ni
backend propio.

`initForms()` en `js/main.js` valida en cliente y luego:

- **En local** (`localhost`) **no envía nada**: muestra directamente la tarjeta de
  gràcies, para poder maquetar sin ruido.
- **En producción** hace `POST` por `fetch` a la propia URL (patrón AJAX de Netlify),
  con el botón en estado "Enviant…". Si el POST falla, **no** muestra la tarjeta:
  enseña el aviso `.form-error` con el correo de contacto, para no perder el mensaje
  en silencio.

Al desplegar por primera vez hay que **verificar en el panel de Netlify** que los tres
formularios aparecen detectados (Forms → los detecta al hacer deploy del HTML).
Plan gratuito: 100 envíos/mes.

## Ilustración de las tarjetas de gracias

`images/illustrations/llindar.png` (459×737, fondo transparente) es un **recorte** de la
maqueta que dio el cliente, guardada como referencia en
`../assets/referencies/maqueta-targeta-gracies.png`.

El recorte se hizo con un script sin dependencias (decodifica el PNG con `zlib`,
localiza el dibujo por diferencia respecto al papel y vuelve a escribir el PNG con
alfa). Si el cliente entrega una versión nueva, hay que repetir el recorte —
el script quedó en el scratchpad de la sesión, no en el repo.

Se carga con `loading="lazy"`: al vivir dentro de una tarjeta oculta, los 264 KB solo
se descargan cuando alguien envía el formulario. Se oculta por debajo de 1080 px de
ancho, donde no cabe sin pisar el texto.

## Regenerar páginas

Todas las páginas salvo `index.html` se generan desde `data/*.json`:

```bash
node build/build-pages.mjs
```

`data/recomanacions.json` alimenta el bloque público de "Porta'ns al teu barri".
Lo rellena el cliente **a mano tras moderar**; si `zones` está vacío el bloque no se
genera. Nunca incluir el nombre de la tienda recomendada (negocio de terceros).

## Desplegar (Netlify)

La carpeta a subir es **`web/`**, no `CaLaMarxanta/`. El `index.html` tiene que quedar
en la raíz del sitio; si se sube la carpeta padre, la home da 404.

```
netlify.com/drop  →  arrastrar la carpeta  web
```

Todas las rutas internas son **relativas**, así que el sitio funciona igual en la raíz
de un dominio o en un subdirectorio. La única excepción a propósito es `404.html`, que
usa rutas absolutas porque se sirve desde cualquier nivel de la URL.

`404.html` en la raíz lo recoge Netlify automáticamente: nadie ve la pantalla de error
del proveedor.

Se pueden borrar antes de subir (no hacen falta en producción, pero tampoco molestan):
`build/`, `data/`, `serve.mjs`, `README.md`.

## Cómo verlo en local

Necesita servirse por HTTP (los módulos ES no funcionan con `file://`):

```bash
node serve.mjs        # → http://localhost:5500
```

## Estructura

```
index.html
css/   settings · base · layout · animations · components/*
js/    main · menu · animations  (ES Modules)
data/  productes.json · punts-venda.json · legals.json · recomanacions.json
images/ products · workshop · brand
```

## Convenciones

- CSS: BEM + tokens en `:root`; mobile-first; solo `transform`/`opacity` en animaciones; respeta `prefers-reduced-motion`.
- JS: ES Modules, una función por responsabilidad; progressive enhancement (la web funciona sin JS).
- Accesibilidad: WCAG AA (foco visible, skip link, semántica, contraste).

## Pendientes de cliente (ver Bible)

- B) Relato oficial del nombre · precio por producto · horario de atención · sesión fotográfica del obrador.
