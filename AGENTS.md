# AGENTS.md — working in this repo

Quick orientation for AI agents. Read `README.md` first for the site map,
file structure, and visual system — this file is about *how to work here*,
not what the site is.

## Hard constraints — do not violate

- **No npm dependencies, anywhere.** `scripts/build-site.js` and
  `scripts/build-site.test.js` use only `node:fs`, `node:path`, `node:test`,
  `node:assert/strict`. There is no `package.json` and none should be
  added. If a task seems to need an npm package, it doesn't — write the few
  extra lines of vanilla JS instead.
- **`dist/` is never committed.** It's generated, gitignored, and is the
  *only* thing GitHub Pages serves. Never hand-edit a file under `dist/` —
  edit the source (`src/`, `templates/`, `data/concerts.js`) and rebuild.
- **`scripts/`, `templates/`, `data/`, `src/` must never be reachable on
  the live domain.** The build copies only specific files into `dist/`
  (see `copyStaticFiles()` in `scripts/build-site.js`). If you add a new
  top-level source file that needs to ship, you must add a line there —
  it will NOT be picked up automatically.
- **All colors are CSS custom properties in `:root` of `src/style.css`.**
  Never hardcode a hex color in a new rule; add or reuse a `--variable`.
- **Every clickable link uses `.cloud-link`** (plus `--accent`/`--big`
  modifiers as needed). Don't invent a new button style.
- **Concert status (upcoming/past) is always computed from `date` vs. the
  current date at build time** (`splitUpcomingPast()`). Never add a manual
  `status` or `isUpcoming` field to `data/concerts.js`.
- **Concert slugs are `YYYYMMDD-venueslug`.** Keep this format for any new
  entry — it's what makes `past`/`upcoming` sorting work correctly
  (string comparison on `date`, separately from the slug).
- **`/links/` has no topbar and no site-footer.** It's intentionally
  standalone (`.linktree` layout). Don't add site chrome to it.

## Before changing anything

1. Run the tests first to confirm the baseline is green:
   ```bash
   node --test scripts/build-site.test.js
   ```
2. After any change touching `src/`, `templates/`, `data/concerts.js`, or
   `scripts/build-site.js`, re-run the tests, then rebuild and spot-check
   for leftover `{{...}}` tokens (a sign a template token was renamed in
   one place and not the other):
   ```bash
   node scripts/build-site.js
   grep -rn "{{" dist/ || echo "clean"
   ```
3. To actually view the result, serve `dist/` — the pages use root-relative
   paths (`/conciertos/`, `/merch/`, etc.) that break under `file://`:
   ```bash
   cd dist && python3 -m http.server 8080
   ```

## Where things live, precisely

| Want to change... | Edit this | Then |
|---|---|---|
| Landing page copy/links | `src/index.html` | rebuild |
| Global styles / palette | `src/style.css` (`:root` block at top) | rebuild |
| Merch items | `src/merch/index.html` | rebuild |
| Links page buttons | `src/links/index.html` | rebuild |
| A concert's data | `data/concerts.js` | rebuild (status auto-computed) |
| Concert page layout | `templates/concierto.html` | rebuild |
| Concert listing layout | `templates/conciertos-listing.html` | rebuild |
| Build logic itself | `scripts/build-site.js` | update `scripts/build-site.test.js` too |
| Deploy pipeline | `.github/workflows/deploy.yml` | — |

Template tokens (`{{token}}`) are substituted by `renderTemplate()` in
`scripts/build-site.js`. If you add a new token to a template, you must
also add it to the `data` object passed to `renderTemplate` in the
corresponding `render*Page`/`render*Html` function, or it silently renders
as an empty string — there is no error for an unknown token.

## Testing conventions

- Tests live in one file: `scripts/build-site.test.js`, using Node's
  built-in test runner. Follow the existing pattern: one `test(...)` block
  per behavior, `assert.match`/`assert.equal`/`assert.doesNotMatch` from
  `node:assert/strict`.
- When adding a function to `scripts/build-site.js`, export it from
  `module.exports` and add it to the `require(...)` destructure at the top
  of the test file — tests import by name, not by re-reading the module.
- The `build()` test is an integration test: it actually runs the build
  into the real `dist/` directory and asserts on the files it produces.
  Keep it fast (it already is — no network, no npm).

## Context for design decisions

`docs/superpowers/specs/2026-10-19-site-redesign-design.md` and
`docs/superpowers/plans/2026-10-19-site-redesign-plan.md` are the spec and
implementation plan behind the current sky/cloud/grass visual system and
multi-page structure. Consult them for *why* something is shaped the way
it is before changing it structurally — e.g. why `/links/` has no chrome,
why posters are nullable, why the palette is split into sky/grass/ink/
accent groups.

**Known plan/reality mismatch (already resolved, documented for context):**
the original plan assumed the pre-redesign `style.css` already had
`--roof` variables and a house/cloud hero illustration. It didn't — the
repo had an unrelated dark-theme placeholder template. The hero's
`.hero-art`/`.cloud`/`.skyline`/`.house`/`.roof`/`.chimney`/`.body`/
`.window`/`.door` CSS was written from scratch to match what the new
`index.html` markup expects. If you're hunting for where that CSS
"should have come from," it didn't come from anywhere — it's original to
this implementation.

## Current known gaps (as of this writing)

- Merch page photo (`src/merch/index.html`) is a placeholder box, not
  wired to a real image file.
- Branch `site-redesign` is not yet merged to `main`.
- GitHub Pages source setting (Settings → Pages → Build and deployment →
  Source → "GitHub Actions") has not been confirmed set on the actual
  repo — this is a manual, one-time step a human must do; no agent can
  do it via code.

## Commit conventions observed in this repo

- Imperative, present-tense subject lines ("Add the merch page", "Rewrite
  the landing page with...").
- One task/feature per commit where practical; CSS component additions,
  new pages, and build-script functions have each gotten their own commit
  historically.
