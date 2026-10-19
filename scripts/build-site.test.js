const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { renderTemplate, splitUpcomingPast, formatDateDisplay, renderPosterHtml, renderLineupHtml, renderConciertoPage, renderCardHtml, renderCardsHtml, renderListingPage, build } = require('./build-site.js');

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

test('src/merch/index.html has the merch item and keeps site chrome', () => {
  const html = fs.readFileSync(path.join(rootDir, 'src', 'merch', 'index.html'), 'utf8');
  assert.match(html, /Camiseta "Anims"/);
  assert.match(html, /15\s*€/);
  assert.match(html, /Disponible en los conciertos/);
  assert.match(html, /class="topbar"/);
  assert.match(html, /class="site-footer"/);
});

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
  assert.equal(poblenou.poster, '/assets/posters/20260918-poblenou.jpg');
});

test('templates have the required tokens', () => {
  const concierto = fs.readFileSync(path.join(rootDir, 'templates', 'concierto.html'), 'utf8');
  for (const token of ['venue', 'city', 'statusLabel', 'posterHtml', 'dateDisplay', 'timeDisplay', 'priceDisplay', 'lineupHtml', 'descriptionHtml', 'ticketLinkHtml', 'mapLinkHtml']) {
    assert.match(concierto, new RegExp(`{{\\s*${token}\\s*}}`), `concierto.html is missing {{${token}}}`);
  }

  const listing = fs.readFileSync(path.join(rootDir, 'templates', 'conciertos-listing.html'), 'utf8');
  assert.match(listing, /{{\s*upcomingCards\s*}}/);
  assert.match(listing, /{{\s*pastCards\s*}}/);
});

test('renderTemplate substitutes known tokens', () => {
  const result = renderTemplate('Hola {{name}}, bienvenido a {{place}}.', { name: 'Mevallar', place: 'Barcelona' });
  assert.equal(result, 'Hola Mevallar, bienvenido a Barcelona.');
});

test('renderTemplate replaces missing tokens with empty string', () => {
  const result = renderTemplate('{{a}}-{{b}}', { a: 'x' });
  assert.equal(result, 'x-');
});

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

test('build() excludes .DS_Store files from dist/', () => {
  const distDir = build(rootDir);
  assert.equal(fs.existsSync(path.join(distDir, 'assets', 'posters', '.DS_Store')), false);
});
