const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pages = ['index.html','index-v2.html','calculador.html','gracias.html','privacidad.html','condiciones.html','preparacion-tef-canada.html','nclc-7.html','tefaq-quebec.html','test-placement.html','inscription.html'];
const errors = [];

for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  if (!/<html lang="es">/.test(html)) errors.push(`${file}: lang es missing`);
  if (!/<meta name="viewport"/.test(html)) errors.push(`${file}: viewport missing`);
  if (!/<h1[ >]/.test(html)) errors.push(`${file}: h1 missing`);
  if (!/class="skip-link"/.test(html)) errors.push(`${file}: skip link missing`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  for (const id of new Set(ids)) if (ids.filter(value => value === id).length > 1) errors.push(`${file}: duplicate id ${id}`);
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|#)/.test(href)) continue;
    const target = href.split('#')[0].split('?')[0];
    if (target === 'couleurs.html') continue; // Alias generated from index-v2.html during the build.
    if (target && !fs.existsSync(path.join(root, target))) errors.push(`${file}: missing link target ${target}`);
  }
}

for (const required of ['robots.txt','sitemap.xml','og-pathway.png','analytics.js','site-config.js','assets/audio/placement-a1.wav','assets/audio/placement-a2.wav','assets/audio/placement-b1.wav','assets/audio/placement-b2.wav']) {
  if (!fs.existsSync(path.join(root, required))) errors.push(`missing asset ${required}`);
}

const placementScript = fs.readFileSync(path.join(root, 'placement-test.js'), 'utf8');
const placementQuestionCount = [...placementScript.matchAll(/\{ level: '[AB][12]'/g)].length;
const listeningQuestionCount = [...placementScript.matchAll(/skill: 'Compréhension orale'/g)].length;
if (placementQuestionCount !== 20) errors.push(`placement test: expected 20 questions, found ${placementQuestionCount}`);
if (listeningQuestionCount !== 8) errors.push(`placement test: expected 8 listening questions, found ${listeningQuestionCount}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Site integrity: ${pages.length} pages and local links passed`);
