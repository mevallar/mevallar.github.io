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
