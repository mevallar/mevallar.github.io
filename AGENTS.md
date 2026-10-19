# AGENTS.md — working in this repo

Quick orientation for AI agents. Read `README.md` first for the site map,
file structure, and visual system — this file is about *how to work here*,
not what the site is.

Each source directory has its own `AGENTS.md` with the rules that apply
there. Agents load a directory's file automatically when reading files
inside it — the table below routes you to the right one.

## Hard constraints — do not violate

- **No npm dependencies, anywhere.** There is no `package.json` and none
  should be added. Build and tests use only `node:fs`, `node:path`,
  `node:test`, `node:assert/strict`. If a task seems to need an npm
  package, it doesn't — write the few extra lines of vanilla JS instead.
- **`dist/` is never committed.** It's generated, gitignored, and is the
  *only* thing GitHub Pages serves. Never hand-edit a file under `dist/` —
  edit the source (`src/`, `templates/`, `data/concerts.js`, `scripts/`)
  and rebuild.
- **`scripts/`, `templates/`, `data/`, `src/` must never be reachable on
  the live domain.** The build copies only an explicit allowlist into
  `dist/` (`copyStaticFiles()` in `scripts/build-site.js`). If you add a
  new top-level source file that needs to ship, you must add a line there —
  it will NOT be picked up automatically.

## Before changing anything

1. Run the tests first to confirm the baseline is green:
   ```bash
   node --test scripts/build-site.test.js
   ```
2. After any change touching `src/`, `templates/`, `data/concerts.js`, or
   `scripts/`, re-run the tests, then rebuild and spot-check for leftover
   `{{...}}` tokens (a sign a template token was renamed in one place and
   not the other):
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

| Want to change... | Edit this | Rules in |
|---|---|---|
| Landing page copy/links | `src/index.html` | `src/AGENTS.md` |
| Global styles / palette | `src/style.css` (`:root` block at top) | `src/AGENTS.md` |
| Merch items | `src/merch/index.html` | `src/AGENTS.md` |
| Links page buttons | `src/links/index.html` | `src/AGENTS.md` |
| A concert's data | `data/concerts.js` | `data/AGENTS.md` |
| Concert page layout | `templates/concierto.html` | `templates/AGENTS.md` |
| Concert listing layout | `templates/conciertos-listing.html` | `templates/AGENTS.md` |
| Build logic / tests | `scripts/build-site.js` + `.test.js` | `scripts/AGENTS.md` |
| Deploy pipeline | `.github/workflows/deploy.yml` | — |

## Context and conventions

- `docs/superpowers/specs/2026-10-19-site-redesign-design.md` and
  `docs/superpowers/plans/2026-10-19-site-redesign-plan.md` are the spec and
  implementation plan behind the current sky/cloud/grass visual system.
  Consult them for *why* something is shaped the way it is before changing
  it structurally.
- Commits: imperative, present-tense subject lines ("Add the merch page");
  one task/feature per commit where practical.


