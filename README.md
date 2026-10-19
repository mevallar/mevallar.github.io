# Mevallar — Official Website

Static site for the band Mevallar, published at **mevallar.com** via GitHub
Pages. No frameworks, no npm dependencies: hand-written HTML5 + CSS3, plus a
Node script (built-in modules only) that generates the concert pages.

## Site map

```
/                           Landing (hero + bio)
/conciertos/                Listing: Upcoming + Past (generated)
/conciertos/<slug>/         One page per concert (generated)
/merch/                     Merchandise page
/links/                     Linktree-style page, standalone (no topbar/footer)
```

Concert slug format: `YYYYMMDD-venueslug` (e.g. `20261106-almo2bar`).
The "upcoming"/"past" status is computed at build time by comparing `date`
with the current date — it is never set by hand.

## Repo structure

- `src/` — hand-written pages, copied verbatim at build time:
  - `index.html` — landing.
  - `style.css` — the single stylesheet, shared by the whole site.
  - `merch/index.html`, `links/index.html`.
- `data/concerts.js` — the single source of truth for concert data
  (CommonJS, an array of `{ slug, date, time, venue, city, address, mapUrl,
  ticketUrl, price, lineup, poster, description }` objects).
- `templates/` — HTML templates with `{{token}}` placeholders:
  - `concierto.html` — a single concert's page.
  - `conciertos-listing.html` — the upcoming/past listing.
- `scripts/build-site.js` — the build (see details below). No npm
  dependencies, only `node:fs` / `node:path`.
- `scripts/build-site.test.js` — tests with `node:test` /
  `node:assert/strict`.
- `assets/posters/` — concert posters, named `<slug>.jpg`. Copied verbatim
  to `dist/assets/`.
- `.github/workflows/deploy.yml` — CI/CD: tests → build → publish `dist/`
  as the GitHub Pages artifact.
- `dist/` — **build output, never committed** (it's in `.gitignore`). It is
  the only thing GitHub Pages serves; `scripts/`, `templates/`, `data/`,
  `src/` are never reachable on the public domain.
- `AGENTS.md` — working rules for AI agents: the root file is the router,
  and each source directory (`scripts/`, `src/`, `data/`, `templates/`)
  has its own with directory-specific rules.
- `docs/superpowers/` — spec and implementation plan of the current
  redesign (historical, useful as a record of design decisions).

## Visual system

The whole palette lives in `:root` of `src/style.css` as custom properties —
changing the entire theme means editing that single block:

- Sky: `--sky-top`, `--sky-bottom`, `--cloud`.
- Grass/flowers (footer): `--grass`, `--grass-dark`, `--flower-pink`,
  `--flower-orange`, `--flower-red`.
- Neutrals: `--ink`, `--paper`, `--muted`, `--line`.
- Accents: `--lilac` (the main accent: buttons, eyebrow, links),
  `--mustard`, `--sage`, `--brown`.

Key reusable components:

- `.cloud-link` / `.cloud-link--accent` / `.cloud-link--big` — every
  clickable link on the site renders as a cloud. Use it for any new button
  or link; don't invent another button style.
- `.site-footer` + `.flower-1`..`.flower-6` — grass footer with flowers,
  on every page except `/links/`.
- `.poster-placeholder` — dashed-border box for posters or photos that
  don't exist yet.
- `.concert-card` — card on the concert listing page.
- `.linktree` — standalone layout of `/links/` (no topbar or footer).

## Local development

```bash
node scripts/build-site.js
```

Generates `dist/`. Pages use root-relative paths (`/conciertos/`, etc.), so
open them with a static server, not with `file://`:

```bash
cd dist && python3 -m http.server 8080
```

Then visit `http://localhost:8080/`.

## Tests

```bash
node --test scripts/build-site.test.js
```

They cover: content of the hand-written pages, validity of
`data/concerts.js`, template tokens, and every build function
(`renderTemplate`, `splitUpcomingPast`, `formatDateDisplay`,
`renderPosterHtml`, `renderConciertoPage`, `renderCardHtml`,
`renderListingPage`, `build`) — including that `dist/` never contains
`scripts/`, `templates/`, `data/`, `src/`, or `.DS_Store`.

## Adding or editing a concert

1. Add/edit an entry in `data/concerts.js`, following the shape of the
   existing ones.
2. If there's a poster, save it to `assets/posters/<slug>.jpg` and set the
   `poster` field to that same path (`/assets/posters/<slug>.jpg`). If
   there's no poster yet, leave `poster: null` — a placeholder box gets
   rendered.
3. Run `node scripts/build-site.js` again. No need to touch any
   "upcoming"/"past" flag — it's computed automatically.

## Pending (requires human action)

- **Photo of the "Anims" t-shirt** on `/merch/` — currently a placeholder
  box (`src/merch/index.html`), not connected to any file.
- **GitHub Pages → Settings → Pages → Build and deployment → Source →
  "GitHub Actions"** (not "Deploy from a branch"). A one-time manual step,
  required before the deploy workflow works.
- This branch (`site-redesign`) is not yet merged to `main`.

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`:
`node --test scripts/build-site.test.js` → `node scripts/build-site.js` →
publish `dist/` via GitHub Pages (`actions/configure-pages` +
`actions/upload-pages-artifact` + `actions/deploy-pages`).
