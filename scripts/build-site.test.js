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
  assert.equal(poblenou.poster, null);
});
