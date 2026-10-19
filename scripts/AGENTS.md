# scripts/ — build and tests

`build-site.js` generates the whole site into `dist/`; `build-site.test.js`
is the single test file. Global constraints (no npm, `dist/` hygiene) live
in the root `AGENTS.md` — the rules here are specific to build mechanics.

## Build mechanics

- `renderTemplate(templateStr, data)` substitutes `{{token}}` placeholders.
  **An unknown token renders as an empty string — silently.** There is no
  error for a missing token: a typo, or a token renamed in the template but
  not in the data object, produces an empty field, not a failure. That's why
  the standard check after building is `grep -rn "{{" dist/`.
- `splitUpcomingPast(concerts, now)` computes upcoming/past by comparing
  each concert's `date` against the current date at build time. Never add a
  manual `status` or `isUpcoming` field to `data/concerts.js`.
- `copyStaticFiles()` is the explicit allowlist of what may ship to `dist/`:
  `src/index.html`, `src/style.css`, `src/merch/`, `src/links/`, `assets/`,
  `CNAME`. Anything else in the repo stays private by default.
- `formatDateDisplay()` renders Spanish long dates (`6 de noviembre de
  2026`); site copy is Spanish — keep it that way.

## Testing conventions

- One `test(...)` block per behavior; assertions via `assert.match` /
  `assert.equal` / `assert.doesNotMatch` from `node:assert/strict`.
- When adding a function to `build-site.js`: export it from
  `module.exports` **and** add it to the `require(...)` destructure at the
  top of the test file — tests import by name, not by re-reading the module.
- The `build()` test is an integration test: it runs the real build into the
  real `dist/` and asserts on the produced files, including that `dist/`
  never contains `scripts/`, `templates/`, `data/`, `src/`, `.DS_Store`, or
  any `AGENTS.md`. Keep it fast — no network, no npm.
