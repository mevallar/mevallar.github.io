# data/ — concert data

`concerts.js` is the single source of truth for concerts: a CommonJS array
of `{ slug, date, time, venue, city, address, mapUrl, ticketUrl, price,
lineup, poster, description }` objects. The build turns it into every
concert page and the listing.

## Rules

- **Slugs are `YYYYMMDD-venueslug`** (e.g. `20261106-almo2bar`). Keep the
  format — the slug is the URL, and the listing sorts by plain string
  comparison on `date`, so both must stay machine-shaped.
- **Never add a manual `status` or `isUpcoming` field.** Upcoming/past is
  always computed at build time by comparing `date` with the current date
  (`splitUpcomingPast()` in `scripts/build-site.js`).
- **`poster` is nullable.** With a poster: save it as
  `assets/posters/<slug>.jpg` and set `poster: '/assets/posters/<slug>.jpg'`.
  Without one yet: `poster: null` — the build renders a placeholder box.
- `time`, `mapUrl`, `ticketUrl`, `price`, and `description` are all
  optional/nullable; the build degrades gracefully. Follow the shape of the
  existing entries.

## After editing

Run `node scripts/build-site.js`. There are no status flags to flip —
everything is derived from `date`. The verify loop (tests → build → grep
for leftover `{{...}}`) is in the root `AGENTS.md`.
