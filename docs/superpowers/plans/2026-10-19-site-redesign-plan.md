# Mevallar Site Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Mevallar website as a multi-page static site (landing, concerts list + per-concert pages, merch, linktree-style links page) with a parametrized sky/cloud/grass/flower visual theme, built by a dependency-free Node script and deployed via GitHub Actions so only the published site — never build tooling — is reachable on mevallar.com.

**Architecture:** Hand-written static pages live in `src/`; concert pages are generated from `data/concerts.js` + `templates/*.html` by `scripts/build-site.js`, which assembles everything into a `dist/` folder. A GitHub Actions workflow runs the build and publishes only `dist/` as the Pages artifact.

**Tech Stack:** Plain HTML5 + CSS3 (custom properties), vanilla Node.js (`node:fs`, `node:path`, `node:test`, `node:assert/strict` — no npm dependencies), GitHub Actions (`actions/checkout`, `actions/setup-node`, `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`).

**Spec:** `docs/superpowers/specs/2026-10-19-site-redesign-design.md`

## Global Constraints

- Build script and its tests use Node.js built-in modules only — no npm dependencies, no `package.json` required.
- The published site is plain static HTML/CSS; no server-side logic.
- All colors are CSS custom properties defined once in `:root` (fully parametrized palette).
- Concert slugs use the format `YYYYMMDD-venueslug`.
- `/links/` has no topbar and no grass footer — standalone chrome only.
- `dist/` is build output only. It is never committed; it is added to `.gitignore`.
- GitHub Actions publishes only the contents of `dist/`; `scripts/`, `templates/`, `data/`, and `src/` must never be reachable on the live domain.
- Upcoming vs. past concert status is computed by comparing each concert's `date` field to the current date at build time — never a manually stored flag.

---

## File Structure

```
/
├── src/
│   ├── index.html
│   ├── style.css
│   ├── merch/index.html
│   └── links/index.html
├── data/
│   └── concerts.js
├── templates/
│   ├── concierto.html
│   └── conciertos-listing.html
├── assets/
│   └── posters/              (user adds the 3 real poster files here)
├── scripts/
│   ├── build-site.js
│   └── build-site.test.js
├── .github/workflows/deploy.yml
├── .gitignore
├── CNAME
└── README.md
```

The old root `index.html` and `style.css` are moved (not copied) into `src/` in Task 1 — they must not remain duplicated at the repo root.

---

### Task 1: Relocate site source into `src/` and set the new color palette

**Files:**
- Modify (move): `index.html` → `src/index.html`
- Modify (move): `style.css` → `src/style.css`
- Modify: `src/style.css` (new `:root` palette)

**Interfaces:**
- Consumes: nothing (first task)
- Produces: `src/style.css` with CSS custom properties `--sky-top`, `--sky-bottom`, `--cloud`, `--grass`, `--grass-dark`, `--flower-pink`, `--flower-orange`, `--flower-red`, `--ink`, `--paper`, `--muted`, `--lilac`, `--mustard`, `--sage`, `--brown`, `--line`, consumed by every later CSS/HTML task.

- [ ] **Step 1: Move the existing files**

```bash
mkdir -p src
git mv index.html src/index.html
git mv style.css src/style.css
```

- [ ] **Step 2: Replace the `:root` block in `src/style.css`**

Replace the current `:root{...}` line (the file's first non-`@import` line) with:

```css
:root{
  /* sky */
  --sky-top:#aed4ea;
  --sky-bottom:#eaf4fb;
  --cloud:#ffffff;

  /* grass + flowers (footer) */
  --grass:#5a9a3f;
  --grass-dark:#447a30;
  --flower-pink:#e85c86;
  --flower-orange:#ec9a3b;
  --flower-red:#e8432e;

  /* ink / neutrals */
  --ink:#2b2420;
  --paper:#fffdf6;
  --muted:#6b5c4e;

  /* accents */
  --lilac:#9c8db8;
  --mustard:#d9a33e;
  --sage:#a9c6ae;
  --brown:#6b4a33;

  --line:rgba(43,36,32,.14);
}
```

Delete the old `--roof` / `--roof-dark` variables and every rule in the file that references `var(--roof)` or `var(--roof-dark)` — replace each occurrence with `var(--lilac)` (for the main accent uses: `.eyebrow` color, `.button` background, `.date` color, link underline colors, `.contact` background) so the file has no dangling references to removed variables. The house illustration's roof (`.house .roof`, `.house .chimney`) should use `var(--lilac)` / a darkened lilac — for the chimney specifically, since there's no `--lilac-dark`, use `var(--brown)` instead (closer visually to a chimney and avoids inventing an unplanned variable).

- [ ] **Step 3: Verify no dangling variable references remain**

Run:
```bash
grep -n "var(--roof" src/style.css
```
Expected: no output (empty match means the grep found nothing).

- [ ] **Step 4: Verify the new palette is present**

Run:
```bash
grep -c "^\s*--\(sky-top\|grass\|flower-pink\|lilac\|mustard\|sage\|brown\):" src/style.css
```
Expected: `7` (one match per listed variable name).

- [ ] **Step 5: Commit**

```bash
git add src/style.css src/index.html
git commit -m "Move site source into src/ and set the new sky/grass palette"
```

---

### Task 2: Build the `.cloud-link` component

**Files:**
- Modify: `src/style.css`

**Interfaces:**
- Consumes: `--cloud`, `--ink`, `--paper`, `--lilac`, `--line` from Task 1.
- Produces: CSS classes `.cloud-link`, `.cloud-link--accent`, `.cloud-link--big`, used by every page task (4–8) and every template task (8) for every clickable link.

- [ ] **Step 1: Append the component CSS to `src/style.css`**

```css
.cloud-link{display:inline-flex;align-items:center;justify-content:center;position:relative;background:var(--cloud);color:var(--ink);font:600 .82rem 'Space Grotesk',sans-serif;padding:.75rem 1.4rem;border-radius:999px;text-decoration:none;box-shadow:0 6px 14px rgba(43,36,32,.12);transition:transform .15s ease,box-shadow .15s ease;z-index:1}
.cloud-link::before,.cloud-link::after{content:'';position:absolute;background:var(--cloud);border-radius:50%;z-index:-1}
.cloud-link::before{width:1.1em;height:1.1em;top:-.35em;left:14%}
.cloud-link::after{width:1.4em;height:1.4em;top:-.5em;right:18%}
.cloud-link:hover,.cloud-link:focus-visible{transform:translateY(-3px);box-shadow:0 10px 22px rgba(43,36,32,.18)}
.cloud-link:focus-visible{outline:2px solid var(--lilac);outline-offset:3px}
.cloud-link--accent{background:var(--lilac);color:var(--paper)}
.cloud-link--accent::before,.cloud-link--accent::after{background:var(--lilac)}
.cloud-link--big{padding:1.1rem 2rem;font-size:1rem;width:100%;max-width:320px}
```

- [ ] **Step 2: Verify the classes are present**

Run:
```bash
grep -c "\.cloud-link" src/style.css
```
Expected: a number greater than `0` (e.g. `9` or more, one per selector occurrence).

- [ ] **Step 3: Commit**

```bash
git add src/style.css
git commit -m "Add the cloud-link component"
```

---

### Task 3: Build the grass-and-flowers footer + poster-placeholder styles

**Files:**
- Modify: `src/style.css`

**Interfaces:**
- Consumes: `--grass`, `--grass-dark`, `--flower-pink`, `--flower-orange`, `--flower-red`, `--mustard`, `--paper`, `--line`, `--muted` from Task 1.
- Produces: CSS classes `.site-footer`, `.flower` + `.flower-1`..`.flower-6`, `.poster-placeholder`, `.concert-card`, `.linktree`, `.linktree .wordmark`, `.linktree .tagline`, used by pages in Tasks 4–8.

- [ ] **Step 1: Append the footer, flower, and placeholder CSS**

```css
.site-footer{position:relative;padding:5rem 6vw 2rem;background:var(--grass);overflow:hidden;color:var(--paper);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1.5rem}
.site-footer::before{content:'';position:absolute;top:-1px;left:0;right:0;height:40px;background:var(--grass-dark);clip-path:polygon(0 100%,4% 20%,10% 70%,16% 10%,24% 60%,32% 15%,40% 65%,48% 5%,56% 55%,64% 20%,72% 70%,80% 10%,88% 60%,96% 15%,100% 100%)}
.site-footer .wordmark{color:var(--paper)}
.site-footer small{color:rgba(255,253,246,.75);font:.65rem 'DM Mono',monospace}
.flower{position:absolute;top:-9px;width:9px;height:9px;border-radius:50%;background:currentColor;box-shadow:0 -9px 0 0 currentColor,8px -3px 0 0 currentColor,5px 7px 0 0 currentColor,-5px 7px 0 0 currentColor,-8px -3px 0 0 currentColor;z-index:1}
.flower::after{content:'';position:absolute;top:-2px;left:2px;width:5px;height:5px;border-radius:50%;background:var(--mustard)}
.flower-1{left:8%;color:var(--flower-pink)}
.flower-2{left:22%;color:var(--flower-orange);top:-14px}
.flower-3{left:38%;color:var(--flower-red)}
.flower-4{left:58%;color:var(--flower-pink);top:-14px}
.flower-5{left:74%;color:var(--flower-orange)}
.flower-6{left:90%;color:var(--flower-red);top:-14px}

.poster-placeholder{aspect-ratio:3/4;border:2px dashed var(--line);border-radius:12px;display:grid;place-items:center;color:var(--muted);font:.72rem 'DM Mono',monospace;text-align:center;padding:1rem;background:var(--paper)}

.concert-card{display:grid;grid-template-columns:100px 1fr auto;gap:1.2rem;align-items:center;padding:1.2rem 0;border-top:1px solid var(--line)}
.concert-card img{width:100px;aspect-ratio:3/4;object-fit:cover;border-radius:8px}
.concert-card .poster-placeholder{width:100px}
.concert-card .meta{display:flex;flex-direction:column;gap:.2rem}
.concert-card .meta .venue{font-weight:600;font-size:1.05rem}
.concert-card .meta small{color:var(--muted);font:.75rem 'DM Mono',monospace}

.linktree{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;padding:4rem 6vw;background:linear-gradient(180deg,var(--sky-top) 0,var(--sky-bottom) 100%);text-align:center}
.linktree .wordmark{font-size:2rem;font-weight:700;letter-spacing:-.06em;margin:0}
.linktree .tagline{color:var(--muted);margin-bottom:1rem}
```

- [ ] **Step 2: Verify the classes are present**

Run:
```bash
grep -c "\.site-footer\|\.flower\|\.poster-placeholder\|\.concert-card\|\.linktree" src/style.css
```
Expected: a number greater than `0`.

- [ ] **Step 3: Commit**

```bash
git add src/style.css
git commit -m "Add grass footer, flower, poster-placeholder, concert-card, and linktree styles"
```

---

### Task 4: Rewrite the landing page (`src/index.html`)

**Files:**
- Modify: `src/index.html`

**Interfaces:**
- Consumes: `.cloud-link`, `.cloud-link--accent`, `.site-footer`, `.flower-1`..`.flower-6` from Tasks 2–3; `.hero`, `.hero-art`, `.cloud`, `.skyline`, `.house` (unchanged from current CSS); confirmed URLs: Spotify `https://open.spotify.com/artist/1XJAfJmBUaSlnuha4jlX3F`, Instagram `https://www.instagram.com/mevallar_/`, YouTube `https://www.youtube.com/@Mevallar`, email `mevallargrupo@gmail.com`.
- Produces: the page at `src/index.html`, copied verbatim into `dist/index.html` by Task 13.

- [ ] **Step 1: Write the regression test**

Create `scripts/build-site.test.js` with the first test (this file will grow across Tasks 7–13):

```js
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.join(__dirname, '..');

test('src/index.html has the landing page content', () => {
  const html = fs.readFileSync(path.join(rootDir, 'src', 'index.html'), 'utf8');
  assert.match(html, /MEVALLAR/);
  assert.match(html, /mevallar nace en barcelona/i);
  assert.match(html, /class="cloud-link/);
  assert.match(html, /open\.spotify\.com\/artist\/1XJAfJmBUaSlnuha4jlX3F/);
  assert.match(html, /instagram\.com\/mevallar_/);
  assert.match(html, /youtube\.com\/@Mevallar/);
  assert.match(html, /\/conciertos\//);
  assert.match(html, /\/merch\//);
  assert.match(html, /\/links\//);
  assert.match(html, /mailto:mevallargrupo@gmail\.com/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/build-site.test.js`
Expected: FAIL — `src/index.html` doesn't yet contain this content (or the assertions mismatch the current placeholder copy).

- [ ] **Step 3: Replace the full contents of `src/index.html`**

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#aed4ea">
  <meta name="description" content="Web oficial de Mevallar. Pop rock español desde Barcelona. Música, conciertos y novedades.">
  <title>Mevallar — Web Oficial</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="topbar">
    <a class="wordmark" href="/">Mevallar</a>
    <nav aria-label="Navegación principal">
      <a class="cloud-link" href="#home">Inicio</a>
      <a class="cloud-link" href="/conciertos/">Conciertos</a>
      <a class="cloud-link" href="/merch/">Merch</a>
      <a class="cloud-link" href="/links/">Links</a>
    </nav>
  </header>

  <main>
    <section class="hero" id="home">
      <div class="hero-copy">
        <p class="eyebrow">De "la meva llar" · pop rock</p>
        <h1>MEVALLAR</h1>
        <p class="intro">Mevallar nace en Barcelona como punto de encuentro entre cuatro músicos de distintos rincones del país que encuentran en la música su hogar compartido.</p>
        <div class="hero-links">
          <a class="cloud-link cloud-link--accent" href="https://open.spotify.com/artist/1XJAfJmBUaSlnuha4jlX3F">Spotify</a>
          <a class="cloud-link" href="https://www.instagram.com/mevallar_/">Instagram</a>
          <a class="cloud-link" href="https://www.youtube.com/@Mevallar">YouTube</a>
          <a class="cloud-link" href="/conciertos/">Conciertos</a>
          <a class="cloud-link" href="/merch/">Merch</a>
          <a class="cloud-link" href="/links/">Links</a>
        </div>
      </div>
      <div class="hero-art" role="img" aria-label="Casa bajo un cielo con nubes">
        <div class="cloud cloud-one"></div>
        <div class="cloud cloud-two"></div>
        <div class="cloud cloud-three"></div>
        <div class="skyline">
          <div class="house house-small"><span class="roof"></span><span class="body"></span></div>
          <div class="house house-main"><span class="roof"></span><span class="chimney"></span><span class="body"><span class="window"></span><span class="door"></span></span></div>
          <div class="house house-small"><span class="roof"></span><span class="body"></span></div>
        </div>
      </div>
      <a class="scroll-cue" href="#about">DESLIZA PARA EXPLORAR ↓</a>
    </section>

    <section class="section about" id="about">
      <p class="eyebrow">01 / EL GRUPO</p>
      <h2>Mevallar, de<br>"la meva llar".</h2>
      <p class="bio">Mevallar nace en Barcelona como punto de encuentro entre cuatro músicos de distintos rincones del país que encuentran en la música su hogar compartido.</p>
    </section>
  </main>

  <footer class="site-footer">
    <div class="flower flower-1"></div><div class="flower flower-2"></div><div class="flower flower-3"></div>
    <div class="flower flower-4"></div><div class="flower flower-5"></div><div class="flower flower-6"></div>
    <a class="wordmark" href="/">Mevallar</a>
    <div class="socials">
      <a class="cloud-link" href="https://www.instagram.com/mevallar_/">Instagram</a>
      <a class="cloud-link" href="https://open.spotify.com/artist/1XJAfJmBUaSlnuha4jlX3F">Spotify</a>
      <a class="cloud-link" href="https://www.youtube.com/@Mevallar">YouTube</a>
      <a class="cloud-link" href="mailto:mevallargrupo@gmail.com">Email</a>
    </div>
    <small>© <span id="year">2026</span> Mevallar</small>
  </footer>
  <script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body>
</html>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/build-site.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/index.html scripts/build-site.test.js
git commit -m "Rewrite the landing page with cloud-link hero and real band copy"
```

---

### Task 5: Build the merch page (`src/merch/index.html`)

**Files:**
- Create: `src/merch/index.html`
- Modify: `scripts/build-site.test.js`

**Interfaces:**
- Consumes: `.cloud-link`, `.site-footer`, `.flower-1`..`.flower-6`, `.poster-placeholder` from Tasks 2–3.
- Produces: `src/merch/index.html`, copied verbatim into `dist/merch/index.html` by Task 13.

- [ ] **Step 1: Add the failing test**

Append to `scripts/build-site.test.js`:

```js
test('src/merch/index.html has the merch item and keeps site chrome', () => {
  const html = fs.readFileSync(path.join(rootDir, 'src', 'merch', 'index.html'), 'utf8');
  assert.match(html, /Camiseta "Anims"/);
  assert.match(html, /15\s*€/);
  assert.match(html, /Disponible en los conciertos/);
  assert.match(html, /class="topbar"/);
  assert.match(html, /class="site-footer"/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/build-site.test.js`
Expected: FAIL — `src/merch/index.html` does not exist yet (ENOENT).

- [ ] **Step 3: Create `src/merch/index.html`**

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#aed4ea">
  <meta name="description" content="Merchandising oficial de Mevallar.">
  <title>Merch — Mevallar</title>
  <link rel="stylesheet" href="../style.css">
</head>
<body>
  <header class="topbar">
    <a class="wordmark" href="/">Mevallar</a>
    <nav aria-label="Navegación principal">
      <a class="cloud-link" href="/">Inicio</a>
      <a class="cloud-link" href="/conciertos/">Conciertos</a>
      <a class="cloud-link" href="/merch/">Merch</a>
      <a class="cloud-link" href="/links/">Links</a>
    </nav>
  </header>

  <main>
    <section class="section merch-page">
      <div class="section-heading"><p class="eyebrow">MERCH</p><h2>Llévate un<br>trozo de hogar.</h2></div>
      <div class="merch-grid">
        <article class="merch-item">
          <div class="poster-placeholder">[FOTO<br>CAMISETA 'ANIMS']</div>
          <h3>Camiseta "Anims"</h3>
          <p class="price">15 €</p>
          <p class="note">Disponible en los conciertos.</p>
        </article>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="flower flower-1"></div><div class="flower flower-2"></div><div class="flower flower-3"></div>
    <div class="flower flower-4"></div><div class="flower flower-5"></div><div class="flower flower-6"></div>
    <a class="wordmark" href="/">Mevallar</a>
    <div class="socials">
      <a class="cloud-link" href="https://www.instagram.com/mevallar_/">Instagram</a>
      <a class="cloud-link" href="https://open.spotify.com/artist/1XJAfJmBUaSlnuha4jlX3F">Spotify</a>
      <a class="cloud-link" href="https://www.youtube.com/@Mevallar">YouTube</a>
      <a class="cloud-link" href="mailto:mevallargrupo@gmail.com">Email</a>
    </div>
    <small>© <span id="year">2026</span> Mevallar</small>
  </footer>
  <script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body>
</html>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/build-site.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/merch/index.html scripts/build-site.test.js
git commit -m "Add the merch page"
```

---

### Task 6: Build the standalone links page (`src/links/index.html`)

**Files:**
- Create: `src/links/index.html`
- Modify: `scripts/build-site.test.js`

**Interfaces:**
- Consumes: `.cloud-link`, `.cloud-link--big`, `.cloud-link--accent`, `.linktree`, `.linktree .wordmark`, `.linktree .tagline` from Tasks 2–3.
- Produces: `src/links/index.html`, copied verbatim into `dist/links/index.html` by Task 13.

- [ ] **Step 1: Add the failing test**

Append to `scripts/build-site.test.js`:

```js
test('src/links/index.html is standalone with all 6 link buttons', () => {
  const html = fs.readFileSync(path.join(rootDir, 'src', 'links', 'index.html'), 'utf8');
  assert.doesNotMatch(html, /class="topbar"/);
  assert.doesNotMatch(html, /class="site-footer"/);
  assert.match(html, /open\.spotify\.com\/artist\/1XJAfJmBUaSlnuha4jlX3F/);
  assert.match(html, /instagram\.com\/mevallar_/);
  assert.match(html, /youtube\.com\/@Mevallar/);
  assert.match(html, /href="\/conciertos\/"/);
  assert.match(html, /href="\/merch\/"/);
  assert.match(html, /mailto:mevallargrupo@gmail\.com/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/build-site.test.js`
Expected: FAIL — `src/links/index.html` does not exist yet (ENOENT).

- [ ] **Step 3: Create `src/links/index.html`**

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#aed4ea">
  <meta name="description" content="Todos los enlaces de Mevallar en un sitio.">
  <title>Mevallar — Enlaces</title>
  <link rel="stylesheet" href="../style.css">
</head>
<body>
  <main class="linktree">
    <p class="wordmark">Mevallar</p>
    <p class="tagline">Pop rock con acento catalán, desde Barcelona.</p>
    <a class="cloud-link cloud-link--big cloud-link--accent" href="https://open.spotify.com/artist/1XJAfJmBUaSlnuha4jlX3F">Spotify</a>
    <a class="cloud-link cloud-link--big" href="https://www.instagram.com/mevallar_/">Instagram</a>
    <a class="cloud-link cloud-link--big" href="https://www.youtube.com/@Mevallar">YouTube</a>
    <a class="cloud-link cloud-link--big" href="/conciertos/">Próximo concierto</a>
    <a class="cloud-link cloud-link--big" href="/merch/">Merch</a>
    <a class="cloud-link cloud-link--big" href="mailto:mevallargrupo@gmail.com">Email</a>
  </main>
</body>
</html>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/build-site.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/links/index.html scripts/build-site.test.js
git commit -m "Add the standalone links page"
```

---

### Task 7: Create the concerts data file (`data/concerts.js`)

**Files:**
- Create: `data/concerts.js`
- Modify: `scripts/build-site.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `module.exports` = an array of 5 concert objects, each shaped `{ slug, date, time, venue, city, address, mapUrl, ticketUrl, price, lineup, poster, description }`, consumed by `scripts/build-site.js` from Task 13 onward.

- [ ] **Step 1: Add the failing test**

Append to `scripts/build-site.test.js`:

```js
test('data/concerts.js has 5 valid concert entries', () => {
  const concerts = require(path.join(rootDir, 'data', 'concerts.js'));
  assert.equal(concerts.length, 5);
  for (const concert of concerts) {
    assert.match(concert.slug, /^\d{8}-[a-z0-9]+$/);
    assert.match(concert.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Array.isArray(concert.lineup) && concert.lineup.length > 0);
  }

  const almo2bar = concerts.find(c => c.slug === '20261106-almo2bar');
  assert.equal(almo2bar.ticketUrl, 'https://entradium.com/events/la-mudanzza-de-la-mevallar');
  assert.equal(almo2bar.price, '10 €');
  assert.equal(almo2bar.poster, '/assets/posters/20261106-almo2bar.jpg');

  const poblenou = concerts.find(c => c.slug === '20260918-poblenou');
  assert.equal(poblenou.price, 'Entrada gratuita');
  assert.equal(poblenou.mapUrl, null);
  assert.equal(poblenou.poster, null);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/build-site.test.js`
Expected: FAIL — `data/concerts.js` does not exist yet (ENOENT).

- [ ] **Step 3: Create `data/concerts.js`**

```js
module.exports = [
  {
    slug: "20260521-parallel62",
    date: "2026-05-21",
    time: null,
    venue: "Parallel 62 Club",
    city: "Barcelona",
    address: "Avinguda del Paral·lel, 62, Ciutat Vella, 08001 Barcelona",
    mapUrl: "https://maps.app.goo.gl/FXrbMW6h1b7Gvp4d6",
    ticketUrl: null,
    price: null,
    lineup: ["Mevallar"],
    poster: "/assets/posters/20260521-parallel62.jpg",
    description: ""
  },
  {
    slug: "20260718-casalprosperitat",
    date: "2026-07-18",
    time: null,
    venue: "Casal de Joves de la Prosperitat",
    city: "Barcelona",
    address: "Pg Valldaura, 271-289, 08016 Barcelona",
    mapUrl: "https://maps.app.goo.gl/5zxyFS8gzAX5DtyG6",
    ticketUrl: null,
    price: null,
    lineup: ["Mevallar", "Caresmar", "Ladera", "Idilia", "Biela"],
    poster: null,
    description: ""
  },
  {
    slug: "20260918-poblenou",
    date: "2026-09-18",
    time: null,
    venue: "Fiesta Poblenou",
    city: "Barcelona",
    address: "Carrer Maria Aguiló, 107, Barcelona",
    mapUrl: null,
    ticketUrl: null,
    price: "Entrada gratuita",
    lineup: ["Mevallar"],
    poster: null,
    description: ""
  },
  {
    slug: "20260924-urnieta",
    date: "2026-09-24",
    time: "23:00",
    venue: "San Mielak · Urnietako Txosnagunea",
    city: "Urnieta",
    address: "Urnietako Txosnagunea, Urnieta 20130",
    mapUrl: null,
    ticketUrl: null,
    price: "Entrada gratuita",
    lineup: ["Mevallar", "Superlore", "Lappa", "Ganbara Studios"],
    poster: "/assets/posters/20260924-urnieta.jpg",
    description: ""
  },
  {
    slug: "20261106-almo2bar",
    date: "2026-11-06",
    time: "20:30",
    venue: "Almo2Bar",
    city: "Barcelona",
    address: "Carrer Bruniquer, 59-61 (Plaça Joanic), Barcelona",
    mapUrl: "https://maps.app.goo.gl/FFxGjQKQMovCCWCn9",
    ticketUrl: "https://entradium.com/events/la-mudanzza-de-la-mevallar",
    price: "10 €",
    lineup: ["La MudanzZa", "Mevallar"],
    poster: "/assets/posters/20261106-almo2bar.jpg",
    description: ""
  }
];
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/build-site.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add data/concerts.js scripts/build-site.test.js
git commit -m "Add the concerts data file"
```

---

### Task 8: Create the concert page templates

**Files:**
- Create: `templates/concierto.html`
- Create: `templates/conciertos-listing.html`
- Modify: `scripts/build-site.test.js`

**Interfaces:**
- Consumes: `.cloud-link`, `.cloud-link--accent`, `.site-footer`, `.flower-1`..`.flower-6`, `.concert-card` from Tasks 2–3.
- Produces: two template strings with `{{token}}` placeholders, read and rendered by `scripts/build-site.js` starting Task 11. `concierto.html` tokens: `venue`, `city`, `statusLabel`, `posterHtml`, `dateDisplay`, `timeDisplay`, `priceDisplay`, `lineupHtml`, `descriptionHtml`, `ticketLinkHtml`, `mapLinkHtml`. `conciertos-listing.html` tokens: `upcomingCards`, `pastCards`.

- [ ] **Step 1: Add the failing test**

Append to `scripts/build-site.test.js`:

```js
test('templates have the required tokens', () => {
  const concierto = fs.readFileSync(path.join(rootDir, 'templates', 'concierto.html'), 'utf8');
  for (const token of ['venue', 'city', 'statusLabel', 'posterHtml', 'dateDisplay', 'timeDisplay', 'priceDisplay', 'lineupHtml', 'descriptionHtml', 'ticketLinkHtml', 'mapLinkHtml']) {
    assert.match(concierto, new RegExp(`{{\\s*${token}\\s*}}`), `concierto.html is missing {{${token}}}`);
  }

  const listing = fs.readFileSync(path.join(rootDir, 'templates', 'conciertos-listing.html'), 'utf8');
  assert.match(listing, /{{\s*upcomingCards\s*}}/);
  assert.match(listing, /{{\s*pastCards\s*}}/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/build-site.test.js`
Expected: FAIL — neither template file exists yet (ENOENT).

- [ ] **Step 3: Create `templates/concierto.html`**

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#aed4ea">
  <meta name="description" content="{{venue}}, {{city}} — Mevallar en directo.">
  <title>{{venue}} — Mevallar</title>
  <link rel="stylesheet" href="../../style.css">
</head>
<body>
  <header class="topbar">
    <a class="wordmark" href="/">Mevallar</a>
    <nav aria-label="Navegación principal">
      <a class="cloud-link" href="/">Inicio</a>
      <a class="cloud-link" href="/conciertos/">Conciertos</a>
      <a class="cloud-link" href="/merch/">Merch</a>
      <a class="cloud-link" href="/links/">Links</a>
    </nav>
  </header>

  <main>
    <section class="section concierto-detail">
      <p class="eyebrow">{{statusLabel}}</p>
      <h2>{{venue}}<br><small>{{city}}</small></h2>
      <div class="concierto-layout">
        {{posterHtml}}
        <div class="concierto-info">
          <p class="date-time">{{dateDisplay}}{{timeDisplay}}</p>
          <p class="price">{{priceDisplay}}</p>
          <p class="lineup"><strong>Lineup:</strong> {{lineupHtml}}</p>
          {{descriptionHtml}}
          <div class="links">
            {{ticketLinkHtml}}
            {{mapLinkHtml}}
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="flower flower-1"></div><div class="flower flower-2"></div><div class="flower flower-3"></div>
    <div class="flower flower-4"></div><div class="flower flower-5"></div><div class="flower flower-6"></div>
    <a class="wordmark" href="/">Mevallar</a>
    <div class="socials">
      <a class="cloud-link" href="https://www.instagram.com/mevallar_/">Instagram</a>
      <a class="cloud-link" href="https://open.spotify.com/artist/1XJAfJmBUaSlnuha4jlX3F">Spotify</a>
      <a class="cloud-link" href="https://www.youtube.com/@Mevallar">YouTube</a>
      <a class="cloud-link" href="mailto:mevallargrupo@gmail.com">Email</a>
    </div>
    <small>© <span id="year">2026</span> Mevallar</small>
  </footer>
  <script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body>
</html>
```

- [ ] **Step 4: Create `templates/conciertos-listing.html`**

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#aed4ea">
  <meta name="description" content="Conciertos de Mevallar, pasados y próximos.">
  <title>Conciertos — Mevallar</title>
  <link rel="stylesheet" href="../style.css">
</head>
<body>
  <header class="topbar">
    <a class="wordmark" href="/">Mevallar</a>
    <nav aria-label="Navegación principal">
      <a class="cloud-link" href="/">Inicio</a>
      <a class="cloud-link" href="/conciertos/">Conciertos</a>
      <a class="cloud-link" href="/merch/">Merch</a>
      <a class="cloud-link" href="/links/">Links</a>
    </nav>
  </header>

  <main>
    <section class="section shows">
      <div class="section-heading"><p class="eyebrow">PRÓXIMOS</p><h2>Ven a saludar.</h2></div>
      {{upcomingCards}}
    </section>

    <section class="section shows">
      <div class="section-heading"><p class="eyebrow">ANTERIORES</p><h2>Lo que ya<br>hemos vivido.</h2></div>
      {{pastCards}}
    </section>
  </main>

  <footer class="site-footer">
    <div class="flower flower-1"></div><div class="flower flower-2"></div><div class="flower flower-3"></div>
    <div class="flower flower-4"></div><div class="flower flower-5"></div><div class="flower flower-6"></div>
    <a class="wordmark" href="/">Mevallar</a>
    <div class="socials">
      <a class="cloud-link" href="https://www.instagram.com/mevallar_/">Instagram</a>
      <a class="cloud-link" href="https://open.spotify.com/artist/1XJAfJmBUaSlnuha4jlX3F">Spotify</a>
      <a class="cloud-link" href="https://www.youtube.com/@Mevallar">YouTube</a>
      <a class="cloud-link" href="mailto:mevallargrupo@gmail.com">Email</a>
    </div>
    <small>© <span id="year">2026</span> Mevallar</small>
  </footer>
  <script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body>
</html>
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test scripts/build-site.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add templates/concierto.html templates/conciertos-listing.html scripts/build-site.test.js
git commit -m "Add concert page and listing page templates"
```

---

### Task 9: Build script — `renderTemplate()` utility

**Files:**
- Create: `scripts/build-site.js`
- Modify: `scripts/build-site.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `renderTemplate(templateStr, data)` — exported from `scripts/build-site.js`, returns `templateStr` with every `{{key}}` replaced by `data[key]` (or `''` if `key` is absent). Consumed by Tasks 11 and 12.

- [ ] **Step 1: Write the failing test**

Replace the top of `scripts/build-site.test.js` so it requires the new module (keep all existing tests below the `require` line unchanged):

```js
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { renderTemplate } = require('./build-site.js');

const rootDir = path.join(__dirname, '..');
```

Append:

```js
test('renderTemplate substitutes known tokens', () => {
  const result = renderTemplate('Hola {{name}}, bienvenido a {{place}}.', { name: 'Mevallar', place: 'Barcelona' });
  assert.equal(result, 'Hola Mevallar, bienvenido a Barcelona.');
});

test('renderTemplate replaces missing tokens with empty string', () => {
  const result = renderTemplate('{{a}}-{{b}}', { a: 'x' });
  assert.equal(result, 'x-');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/build-site.test.js`
Expected: FAIL — `scripts/build-site.js` does not exist yet (cannot find module).

- [ ] **Step 3: Create `scripts/build-site.js` with the minimal implementation**

```js
function renderTemplate(templateStr, data) {
  return templateStr.replace(/{{\s*(\w+)\s*}}/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : '';
  });
}

module.exports = {
  renderTemplate
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/build-site.test.js`
Expected: PASS (all tests from Tasks 4–8 plus these two)

- [ ] **Step 5: Commit**

```bash
git add scripts/build-site.js scripts/build-site.test.js
git commit -m "Add renderTemplate() token substitution utility"
```

---

### Task 10: Build script — `splitUpcomingPast()` date logic

**Files:**
- Modify: `scripts/build-site.js`
- Modify: `scripts/build-site.test.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: `splitUpcomingPast(concerts, now = new Date())` — returns `{ upcoming, past }`, where `upcoming` is sorted ascending by `date` and `past` is sorted descending by `date`. Consumed by Task 13's `build()`.

- [ ] **Step 1: Write the failing test**

Update the `require` line in `scripts/build-site.test.js`:

```js
const { renderTemplate, splitUpcomingPast } = require('./build-site.js');
```

Append:

```js
test('splitUpcomingPast separates by date relative to now', () => {
  const concerts = [
    { slug: 'past-one', date: '2026-01-01' },
    { slug: 'future-one', date: '2026-12-31' },
    { slug: 'today', date: '2026-06-15' }
  ];
  const { upcoming, past } = splitUpcomingPast(concerts, new Date('2026-06-15T12:00:00'));
  assert.deepEqual(upcoming.map(c => c.slug), ['today', 'future-one']);
  assert.deepEqual(past.map(c => c.slug), ['past-one']);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/build-site.test.js`
Expected: FAIL — `splitUpcomingPast is not a function`.

- [ ] **Step 3: Implement `splitUpcomingPast`**

Append to `scripts/build-site.js`, above `module.exports`:

```js
function splitUpcomingPast(concerts, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const upcoming = [];
  const past = [];
  for (const concert of concerts) {
    const concertDate = new Date(concert.date + 'T00:00:00');
    if (concertDate >= today) {
      upcoming.push(concert);
    } else {
      past.push(concert);
    }
  }
  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  past.sort((a, b) => b.date.localeCompare(a.date));
  return { upcoming, past };
}
```

Update `module.exports`:

```js
module.exports = {
  renderTemplate,
  splitUpcomingPast
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/build-site.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/build-site.js scripts/build-site.test.js
git commit -m "Add splitUpcomingPast() date logic"
```

---

### Task 11: Build script — concert page rendering functions

**Files:**
- Modify: `scripts/build-site.js`
- Modify: `scripts/build-site.test.js`

**Interfaces:**
- Consumes: `renderTemplate` from Task 9.
- Produces: `formatDateDisplay(isoDate)`, `renderPosterHtml(concert)`, `renderLineupHtml(lineup)`, `renderConciertoPage(concert, template, isUpcoming)` — all exported, consumed by Task 13's `build()` and by Task 12.

- [ ] **Step 1: Write the failing tests**

Update the `require` line:

```js
const { renderTemplate, splitUpcomingPast, formatDateDisplay, renderPosterHtml, renderLineupHtml, renderConciertoPage } = require('./build-site.js');
```

Append:

```js
test('formatDateDisplay renders a Spanish long date', () => {
  assert.equal(formatDateDisplay('2026-11-06'), '6 de noviembre de 2026');
});

test('renderPosterHtml returns an img tag when poster is set', () => {
  const html = renderPosterHtml({ venue: 'Almo2Bar', poster: '/assets/posters/x.jpg' });
  assert.match(html, /<img class="poster" src="\/assets\/posters\/x\.jpg" alt="Cartel de Almo2Bar">/);
});

test('renderPosterHtml returns a placeholder when poster is null', () => {
  const html = renderPosterHtml({ venue: 'Fiesta Poblenou', poster: null });
  assert.match(html, /poster-placeholder/);
});

test('renderLineupHtml joins the lineup with commas', () => {
  assert.equal(renderLineupHtml(['La MudanzZa', 'Mevallar']), 'La MudanzZa, Mevallar');
});

test('renderConciertoPage fills in ticket and map links when present', () => {
  const concert = {
    venue: 'Almo2Bar', city: 'Barcelona', date: '2026-11-06', time: '20:30',
    price: '10 €', lineup: ['La MudanzZa', 'Mevallar'], description: '',
    poster: '/assets/posters/x.jpg',
    mapUrl: 'https://maps.app.goo.gl/FFxGjQKQMovCCWCn9',
    ticketUrl: 'https://entradium.com/events/la-mudanzza-de-la-mevallar'
  };
  const template = '{{venue}}|{{city}}|{{statusLabel}}|{{posterHtml}}|{{dateDisplay}}|{{timeDisplay}}|{{priceDisplay}}|{{lineupHtml}}|{{descriptionHtml}}|{{ticketLinkHtml}}|{{mapLinkHtml}}';
  const result = renderConciertoPage(concert, template, true);
  assert.match(result, /PRÓXIMO CONCIERTO/);
  assert.match(result, /6 de noviembre de 2026/);
  assert.match(result, / · 20:30h/);
  assert.match(result, /href="https:\/\/entradium\.com\/events\/la-mudanzza-de-la-mevallar"/);
  assert.match(result, /href="https:\/\/maps\.app\.goo\.gl\/FFxGjQKQMovCCWCn9"/);
});

test('renderConciertoPage omits ticket/map links when absent and labels past shows', () => {
  const concert = {
    venue: 'Fiesta Poblenou', city: 'Barcelona', date: '2026-09-18', time: null,
    price: 'Entrada gratuita', lineup: ['Mevallar'], description: '',
    poster: null, mapUrl: null, ticketUrl: null
  };
  const template = '{{venue}}|{{statusLabel}}|{{ticketLinkHtml}}|{{mapLinkHtml}}|{{timeDisplay}}';
  const result = renderConciertoPage(concert, template, false);
  assert.match(result, /CONCIERTO PASADO/);
  assert.doesNotMatch(result, /cloud-link--accent/);
  assert.doesNotMatch(result, /Cómo llegar/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/build-site.test.js`
Expected: FAIL — `formatDateDisplay is not a function` (and the other new functions).

- [ ] **Step 3: Implement the functions**

Append to `scripts/build-site.js`, above `module.exports`:

```js
const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function formatDateDisplay(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${Number(day)} de ${MONTHS_ES[Number(month) - 1]} de ${year}`;
}

function renderPosterHtml(concert) {
  if (concert.poster) {
    return `<img class="poster" src="${concert.poster}" alt="Cartel de ${concert.venue}">`;
  }
  return `<div class="poster-placeholder">[CARTEL<br>PRÓXIMAMENTE]</div>`;
}

function renderLineupHtml(lineup) {
  return lineup.join(', ');
}

function renderConciertoPage(concert, template, isUpcoming) {
  const data = {
    venue: concert.venue,
    city: concert.city,
    statusLabel: isUpcoming ? 'PRÓXIMO CONCIERTO' : 'CONCIERTO PASADO',
    posterHtml: renderPosterHtml(concert),
    dateDisplay: formatDateDisplay(concert.date),
    timeDisplay: concert.time ? ` · ${concert.time}h` : '',
    priceDisplay: concert.price || 'Más información próximamente',
    lineupHtml: renderLineupHtml(concert.lineup),
    descriptionHtml: concert.description ? `<p class="description">${concert.description}</p>` : '',
    ticketLinkHtml: concert.ticketUrl ? `<a class="cloud-link cloud-link--accent" href="${concert.ticketUrl}">Entradas</a>` : '',
    mapLinkHtml: concert.mapUrl ? `<a class="cloud-link" href="${concert.mapUrl}">Cómo llegar</a>` : ''
  };
  return renderTemplate(template, data);
}
```

Update `module.exports`:

```js
module.exports = {
  renderTemplate,
  splitUpcomingPast,
  formatDateDisplay,
  renderPosterHtml,
  renderLineupHtml,
  renderConciertoPage
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/build-site.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/build-site.js scripts/build-site.test.js
git commit -m "Add concert page rendering functions"
```

---

### Task 12: Build script — listing page rendering functions

**Files:**
- Modify: `scripts/build-site.js`
- Modify: `scripts/build-site.test.js`

**Interfaces:**
- Consumes: `renderTemplate` (Task 9), `formatDateDisplay` (Task 11).
- Produces: `renderCardHtml(concert, isUpcoming)`, `renderCardsHtml(concerts, isUpcoming, emptyMessage)`, `renderListingPage(upcoming, past, template)` — all exported, consumed by Task 13's `build()`.

- [ ] **Step 1: Write the failing tests**

Update the `require` line:

```js
const { renderTemplate, splitUpcomingPast, formatDateDisplay, renderPosterHtml, renderLineupHtml, renderConciertoPage, renderCardHtml, renderCardsHtml, renderListingPage } = require('./build-site.js');
```

Append:

```js
test('renderCardHtml links to tickets when upcoming with a ticketUrl', () => {
  const concert = { slug: '20261106-almo2bar', venue: 'Almo2Bar', city: 'Barcelona', date: '2026-11-06', poster: null, ticketUrl: 'https://entradium.com/x' };
  const html = renderCardHtml(concert, true);
  assert.match(html, /Entradas/);
  assert.match(html, /href="\/conciertos\/20261106-almo2bar\/"/);
});

test('renderCardHtml links to details when past or no ticketUrl', () => {
  const concert = { slug: '20260918-poblenou', venue: 'Fiesta Poblenou', city: 'Barcelona', date: '2026-09-18', poster: null, ticketUrl: null };
  const html = renderCardHtml(concert, false);
  assert.match(html, /Ver detalles/);
  assert.doesNotMatch(html, /Entradas/);
});

test('renderCardsHtml shows the empty message when there are no concerts', () => {
  const html = renderCardsHtml([], true, 'No hay conciertos próximos.');
  assert.match(html, /No hay conciertos próximos\./);
});

test('renderListingPage fills both sections', () => {
  const upcoming = [{ slug: '20261106-almo2bar', venue: 'Almo2Bar', city: 'Barcelona', date: '2026-11-06', poster: null, ticketUrl: 'https://entradium.com/x' }];
  const past = [{ slug: '20260918-poblenou', venue: 'Fiesta Poblenou', city: 'Barcelona', date: '2026-09-18', poster: null, ticketUrl: null }];
  const template = '{{upcomingCards}}|{{pastCards}}';
  const result = renderListingPage(upcoming, past, template);
  assert.match(result, /Almo2Bar/);
  assert.match(result, /Fiesta Poblenou/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/build-site.test.js`
Expected: FAIL — `renderCardHtml is not a function`.

- [ ] **Step 3: Implement the functions**

Append to `scripts/build-site.js`, above `module.exports`:

```js
function renderCardHtml(concert, isUpcoming) {
  const posterHtml = concert.poster
    ? `<img src="${concert.poster}" alt="Cartel de ${concert.venue}">`
    : `<div class="poster-placeholder">[CARTEL]</div>`;
  const actionHtml = (isUpcoming && concert.ticketUrl)
    ? `<a class="cloud-link cloud-link--accent" href="/conciertos/${concert.slug}/">Entradas</a>`
    : `<a class="cloud-link" href="/conciertos/${concert.slug}/">Ver detalles</a>`;
  return `
    <article class="concert-card">
      ${posterHtml}
      <div class="meta">
        <span class="venue">${concert.venue} <small>${concert.city}</small></span>
        <small>${formatDateDisplay(concert.date)}</small>
      </div>
      ${actionHtml}
    </article>`;
}

function renderCardsHtml(concerts, isUpcoming, emptyMessage) {
  if (concerts.length === 0) {
    return `<p class="note">${emptyMessage}</p>`;
  }
  return concerts.map(c => renderCardHtml(c, isUpcoming)).join('\n');
}

function renderListingPage(upcoming, past, template) {
  const data = {
    upcomingCards: renderCardsHtml(upcoming, true, 'No hay conciertos próximos. ¡Síguenos para enterarte!'),
    pastCards: renderCardsHtml(past, false, 'Todavía no hemos tocado en directo.')
  };
  return renderTemplate(template, data);
}
```

Update `module.exports`:

```js
module.exports = {
  renderTemplate,
  splitUpcomingPast,
  formatDateDisplay,
  renderPosterHtml,
  renderLineupHtml,
  renderConciertoPage,
  renderCardHtml,
  renderCardsHtml,
  renderListingPage
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/build-site.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/build-site.js scripts/build-site.test.js
git commit -m "Add listing page rendering functions"
```

---

### Task 13: Build script — static file copy, `build()` orchestration, and `.gitignore`

**Files:**
- Modify: `scripts/build-site.js`
- Modify: `scripts/build-site.test.js`
- Create: `.gitignore`

**Interfaces:**
- Consumes: `splitUpcomingPast`, `renderConciertoPage`, `renderListingPage` from Tasks 10–12; `src/`, `data/concerts.js`, `templates/*.html`, `assets/`, `CNAME` from Tasks 1 and 4–8.
- Produces: `copyStaticFiles(rootDir, distDir)`, `build(rootDir)` — both exported. `build()` is also invoked automatically when the file is run directly (`node scripts/build-site.js`), consumed by the CI workflow in Task 14.

- [ ] **Step 1: Write the failing integration test**

Update the `require` line one last time:

```js
const { renderTemplate, splitUpcomingPast, formatDateDisplay, renderPosterHtml, renderLineupHtml, renderConciertoPage, renderCardHtml, renderCardsHtml, renderListingPage, build } = require('./build-site.js');
```

Append:

```js
test('build() produces the full static site in dist/ and excludes build-only files', () => {
  const distDir = build(rootDir);

  assert.ok(fs.existsSync(path.join(distDir, 'index.html')));
  assert.ok(fs.existsSync(path.join(distDir, 'style.css')));
  assert.ok(fs.existsSync(path.join(distDir, 'merch', 'index.html')));
  assert.ok(fs.existsSync(path.join(distDir, 'links', 'index.html')));
  assert.ok(fs.existsSync(path.join(distDir, 'CNAME')));
  assert.ok(fs.existsSync(path.join(distDir, 'conciertos', 'index.html')));
  assert.ok(fs.existsSync(path.join(distDir, 'conciertos', '20261106-almo2bar', 'index.html')));

  assert.equal(fs.existsSync(path.join(distDir, 'scripts')), false);
  assert.equal(fs.existsSync(path.join(distDir, 'templates')), false);
  assert.equal(fs.existsSync(path.join(distDir, 'data')), false);
  assert.equal(fs.existsSync(path.join(distDir, 'src')), false);

  const almo2barHtml = fs.readFileSync(path.join(distDir, 'conciertos', '20261106-almo2bar', 'index.html'), 'utf8');
  assert.match(almo2barHtml, /Entradas/);
  assert.match(almo2barHtml, /entradium\.com/);

  const listingHtml = fs.readFileSync(path.join(distDir, 'conciertos', 'index.html'), 'utf8');
  assert.match(listingHtml, /Almo2Bar/);
  assert.match(listingHtml, /Parallel 62 Club/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/build-site.test.js`
Expected: FAIL — `build is not a function`.

- [ ] **Step 3: Implement `copyStaticFiles` and `build`**

Append to `scripts/build-site.js`, above `module.exports` (and add the `require('node:fs')`/`require('node:path')` lines at the top of the file if they aren't there yet):

```js
const fs = require('node:fs');
const path = require('node:path');

function copyRecursiveSync(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function copyStaticFiles(rootDir, distDir) {
  copyRecursiveSync(path.join(rootDir, 'src', 'index.html'), path.join(distDir, 'index.html'));
  copyRecursiveSync(path.join(rootDir, 'src', 'style.css'), path.join(distDir, 'style.css'));
  copyRecursiveSync(path.join(rootDir, 'src', 'merch'), path.join(distDir, 'merch'));
  copyRecursiveSync(path.join(rootDir, 'src', 'links'), path.join(distDir, 'links'));
  if (fs.existsSync(path.join(rootDir, 'assets'))) {
    copyRecursiveSync(path.join(rootDir, 'assets'), path.join(distDir, 'assets'));
  }
  copyRecursiveSync(path.join(rootDir, 'CNAME'), path.join(distDir, 'CNAME'));
}

function build(rootDir = path.join(__dirname, '..')) {
  const distDir = path.join(rootDir, 'dist');
  fs.rmSync(distDir, { recursive: true, force: true });
  fs.mkdirSync(distDir, { recursive: true });

  copyStaticFiles(rootDir, distDir);

  const concerts = require(path.join(rootDir, 'data', 'concerts.js'));
  const { upcoming, past } = splitUpcomingPast(concerts);
  const upcomingSlugs = new Set(upcoming.map(c => c.slug));

  const conciertoTemplate = fs.readFileSync(path.join(rootDir, 'templates', 'concierto.html'), 'utf8');
  for (const concert of concerts) {
    const html = renderConciertoPage(concert, conciertoTemplate, upcomingSlugs.has(concert.slug));
    const outDir = path.join(distDir, 'conciertos', concert.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
  }

  const listingTemplate = fs.readFileSync(path.join(rootDir, 'templates', 'conciertos-listing.html'), 'utf8');
  const listingHtml = renderListingPage(upcoming, past, listingTemplate);
  fs.mkdirSync(path.join(distDir, 'conciertos'), { recursive: true });
  fs.writeFileSync(path.join(distDir, 'conciertos', 'index.html'), listingHtml);

  return distDir;
}
```

Update `module.exports` and add the direct-run guard at the end of the file:

```js
module.exports = {
  renderTemplate,
  splitUpcomingPast,
  formatDateDisplay,
  renderPosterHtml,
  renderLineupHtml,
  renderConciertoPage,
  renderCardHtml,
  renderCardsHtml,
  renderListingPage,
  copyStaticFiles,
  build
};

if (require.main === module) {
  build();
}
```

- [ ] **Step 4: Create `.gitignore`**

```
dist/
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test scripts/build-site.test.js`
Expected: PASS (every test from Tasks 4–13)

- [ ] **Step 6: Run the real build and spot-check it manually**

Run: `node scripts/build-site.js`
Then open `dist/index.html`, `dist/merch/index.html`, `dist/links/index.html`, `dist/conciertos/index.html`, and `dist/conciertos/20261106-almo2bar/index.html` in a browser and confirm they render with no missing-token text (no literal `{{...}}` visible anywhere) and the cloud-link/footer styling from Tasks 2–3 is applied.

- [ ] **Step 7: Commit**

```bash
git add scripts/build-site.js scripts/build-site.test.js .gitignore
git commit -m "Add static file copy and build() orchestration"
```

---

### Task 14: GitHub Actions deploy workflow + README

**Files:**
- Create: `.github/workflows/deploy.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: `node --test scripts/build-site.test.js` and `node scripts/build-site.js` from Task 13 (run as CI steps).
- Produces: a CI/CD pipeline that builds and publishes `dist/` on every push to `main`.

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Run tests
        run: node --test scripts/build-site.test.js
      - name: Build site
        run: node scripts/build-site.js
      - name: Configure Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Replace the contents of `README.md`**

```markdown
# Mevallar — Web Oficial

Sitio estático de la banda Mevallar, publicado en mevallar.com vía GitHub Pages.

## Estructura

- `src/` — páginas escritas a mano (landing, merch, links) y la hoja de estilos compartida.
- `data/concerts.js` — fuente única de datos de conciertos.
- `templates/` — plantillas HTML con tokens `{{...}}` para las páginas de conciertos.
- `scripts/build-site.js` — script de Node (sin dependencias npm) que genera todo en `dist/`.
- `dist/` — resultado del build, no se versiona. Es lo único que publica GitHub Pages.

## Desarrollo local

```bash
node scripts/build-site.js
```

Abre `dist/index.html` en el navegador, o sirve `dist/` con cualquier servidor estático.

## Tests

```bash
node --test scripts/build-site.test.js
```

## Añadir un concierto

Añade una entrada a `data/concerts.js` siguiendo la forma de las existentes y vuelve a ejecutar el build. El estado "próximo"/"anterior" se calcula automáticamente a partir del campo `date` — no hace falta marcarlo a mano.

## Despliegue

Cada push a `main` lanza `.github/workflows/deploy.yml`, que ejecuta los tests, construye el sitio y publica `dist/` vía GitHub Pages.

**Paso manual único:** en los ajustes del repositorio, ve a Settings → Pages → Build and deployment → Source, y selecciona "GitHub Actions" (no "Deploy from a branch"). Sin este cambio, el paso de despliegue del workflow fallará aunque el build se complete correctamente.
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "Add GitHub Actions deploy workflow and update README"
```

- [ ] **Step 4: Manual verification (cannot be automated from this session)**

After pushing this branch and merging to `main`:
1. In the repo, go to **Settings → Pages → Build and deployment → Source** and select **"GitHub Actions"**. This is the one-time setting mentioned in the README; without it the `deploy` job fails even when `build` succeeds.
2. Open the repo's **Actions** tab and confirm the "Deploy to GitHub Pages" workflow run completes both the `build` and `deploy` jobs successfully.
3. Visit `https://mevallar.com/`, `/conciertos/`, `/conciertos/20261106-almo2bar/`, `/merch/`, and `/links/` and confirm each loads with the new design and no `scripts/`, `templates/`, or `data/` paths are reachable (e.g. `https://mevallar.com/scripts/build-site.js` should 404).
4. Add the three real poster files (`assets/posters/20260521-parallel62.jpg`, `assets/posters/20260924-urnieta.jpg`, `assets/posters/20261106-almo2bar.jpg`) in a follow-up commit once available, confirm `renderPosterHtml` picks them up (poster `<img>` instead of the placeholder) on the next build.

---

## Self-Review Notes

- **Spec coverage:** Section 2 (site map/slugs) → Tasks 7, 13. Section 3.1 (palette) → Task 1. Section 3.2 (cloud component) → Task 2. Section 3.3 (topbar) → Tasks 4–6, 8. Section 3.4 (grass footer) → Task 3. Section 4 (data/templates/build/deploy) → Tasks 7–14. Section 5.1 (landing) → Task 4. Section 5.2–5.3 (concert listing/detail) → Tasks 7, 8, 11, 12, 13. Section 5.4 (merch) → Task 5. Section 5.5 (links, standalone) → Task 6. Section 6 (user-supplied assets) → noted in Task 13 Step 6 and Task 14 Step 4. Section 7 (deferred items) — no tasks needed, confirmed nothing in the plan contradicts the deferrals.
- **Placeholder scan:** no TBD/TODO strings; every step has literal file contents or exact shell commands.
- **Type consistency:** function names and parameter shapes (`renderTemplate(templateStr, data)`, `splitUpcomingPast(concerts, now)`, `renderConciertoPage(concert, template, isUpcoming)`, `renderCardHtml(concert, isUpcoming)`, `renderListingPage(upcoming, past, template)`, `build(rootDir)`) are identical across the task that defines them and every task that consumes them.
