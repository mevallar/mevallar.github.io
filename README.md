# Mevallar — Web Oficial

Sitio estático de la banda Mevallar, publicado en **mevallar.com** vía GitHub
Pages. Sin frameworks, sin dependencias npm: HTML5 + CSS3 a mano, y un script
de Node (solo módulos nativos) que genera las páginas de conciertos.

## Mapa del sitio

```
/                           Landing (hero + bio)
/conciertos/                Listado: Próximos + Anteriores (generado)
/conciertos/<slug>/         Una página por concierto (generada)
/merch/                     Página de merchandising
/links/                     Página tipo linktree, standalone (sin topbar/footer)
```

Formato de slug de concierto: `YYYYMMDD-venueslug` (p. ej. `20261106-almo2bar`).
El estado "próximo"/"anterior" se calcula en el build comparando `date` con la
fecha actual — nunca se marca a mano.

## Estructura del repo

- `src/` — páginas escritas a mano y copiadas tal cual al build:
  - `index.html` — landing.
  - `style.css` — hoja de estilos única, compartida por todo el sitio.
  - `merch/index.html`, `links/index.html`.
- `data/concerts.js` — fuente única de datos de conciertos (CommonJS, un
  array de objetos `{ slug, date, time, venue, city, address, mapUrl,
  ticketUrl, price, lineup, poster, description }`).
- `templates/` — plantillas HTML con tokens `{{token}}`:
  - `concierto.html` — página de un concierto.
  - `conciertos-listing.html` — listado de próximos/anteriores.
- `scripts/build-site.js` — build (ver detalle abajo). Sin dependencias npm,
  solo `node:fs` / `node:path`.
- `scripts/build-site.test.js` — tests con `node:test` / `node:assert/strict`.
- `assets/posters/` — carteles de conciertos, nombrados `<slug>.jpg`.
  Copiada tal cual a `dist/assets/`.
- `.github/workflows/deploy.yml` — CI/CD: tests → build → publica `dist/`
  como artefacto de GitHub Pages.
- `dist/` — **resultado del build, nunca se versiona** (está en
  `.gitignore`). Es lo único que GitHub Pages publica; `scripts/`,
  `templates/`, `data/`, `src/` nunca son accesibles en el dominio público.
- `docs/superpowers/` — spec y plan de implementación del rediseño actual
  (histórico, útil como referencia de decisiones de diseño).

## Sistema visual

Toda la paleta vive en `:root` de `src/style.css` como custom properties —
cambiar el tema entero es editar ese único bloque:

- Cielo: `--sky-top`, `--sky-bottom`, `--cloud`.
- Césped/flores (footer): `--grass`, `--grass-dark`, `--flower-pink`,
  `--flower-orange`, `--flower-red`.
- Neutros: `--ink`, `--paper`, `--muted`, `--line`.
- Acentos: `--lilac` (acento principal: botones, eyebrow, enlaces),
  `--mustard`, `--sage`, `--brown`.

Componentes reutilizables clave:

- `.cloud-link` / `.cloud-link--accent` / `.cloud-link--big` — todo enlace
  clicable del sitio se renderiza como una nube. Úsalo para cualquier botón
  o link nuevo, no inventes otro estilo de botón.
- `.site-footer` + `.flower-1`..`.flower-6` — footer de césped con flores,
  en todas las páginas excepto `/links/`.
- `.poster-placeholder` — caja con borde punteado para carteles o fotos que
  todavía no existen.
- `.concert-card` — tarjeta de la página de listado de conciertos.
- `.linktree` — layout standalone de `/links/` (sin topbar ni footer).

## Desarrollo local

```bash
node scripts/build-site.js
```

Genera `dist/`. Las páginas usan rutas absolutas (`/conciertos/`, etc.), así
que ábrelas con un servidor estático, no con `file://`:

```bash
cd dist && python3 -m http.server 8080
```

Luego visita `http://localhost:8080/`.

## Tests

```bash
node --test scripts/build-site.test.js
```

Cubren: contenido de las páginas escritas a mano, validez de
`data/concerts.js`, tokens de las plantillas, y cada función del build
(`renderTemplate`, `splitUpcomingPast`, `formatDateDisplay`,
`renderPosterHtml`, `renderConciertoPage`, `renderCardHtml`,
`renderListingPage`, `build`) incluyendo que `dist/` nunca contenga
`scripts/`, `templates/`, `data/`, `src/` ni `.DS_Store`.

## Añadir o editar un concierto

1. Añade/edita una entrada en `data/concerts.js` siguiendo la forma de las
   existentes.
2. Si hay cartel, guárdalo en `assets/posters/<slug>.jpg` y pon esa misma
   ruta (`/assets/posters/<slug>.jpg`) en el campo `poster`. Si no hay
   cartel aún, deja `poster: null` — se renderiza un placeholder.
3. Vuelve a ejecutar `node scripts/build-site.js`. No hace falta tocar
   ningún flag de "próximo"/"anterior", se calcula solo.

## Pendiente (requiere acción humana)

- **Foto de la camiseta "Anims"** en `/merch/` — hoy es una caja
  placeholder (`src/merch/index.html`), no está conectada a ningún archivo.
- **GitHub Pages → Settings → Pages → Build and deployment → Source →
  "GitHub Actions"** (no "Deploy from a branch"). Paso manual único,
  obligatorio antes de que el workflow de despliegue funcione.
- Esta rama (`site-redesign`) todavía no está mergeada a `main`.

## Despliegue

Cada push a `main` lanza `.github/workflows/deploy.yml`: `node --test
scripts/build-site.test.js` → `node scripts/build-site.js` → publica
`dist/` vía GitHub Pages (`actions/configure-pages` +
`actions/upload-pages-artifact` + `actions/deploy-pages`).
