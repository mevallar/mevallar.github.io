# src/ — hand-written pages and styles

`index.html` (landing), `style.css` (single shared stylesheet),
`merch/index.html`, `links/index.html`. The build copies these verbatim into
`dist/` — no processing, so what you write is what ships.

## Styles

- **All colors are CSS custom properties in `:root` of `style.css`.** Never
  hardcode a hex color in a new rule; add or reuse a `--variable`. The
  palette groups (sky, grass, neutrals, accents) are listed in `README.md` →
  "Visual system".
- **Every clickable link uses `.cloud-link`** (plus `--accent` / `--big`
  modifiers as needed). Don't invent a new button style. Reusable components
  (`.site-footer`, `.poster-placeholder`, `.concert-card`, `.linktree`) are
  documented in the README — reuse them before writing new CSS.

## Layout rules

- **`/links/` has no topbar and no site-footer.** It's intentionally
  standalone (`.linktree` layout). Don't add site chrome to it.
- Every other page keeps the topbar and the `.site-footer` grass footer.

## Known gaps

- The merch page photo (`merch/index.html`) is a `.poster-placeholder` box,
  not wired to a real image file.

## Design context

The hero's `.hero-art` / `.cloud` / `.skyline` / `.house` / `.roof` /
`.chimney` / `.body` / `.window` / `.door` CSS was written from scratch for
the current redesign — it did not come from any earlier theme (the
pre-redesign `style.css` was an unrelated dark-theme placeholder). Don't go
hunting for where it "should have" come from. See
`docs/superpowers/specs/2026-10-19-site-redesign-design.md` for the visual
system's rationale.
