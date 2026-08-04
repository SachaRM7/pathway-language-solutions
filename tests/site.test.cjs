const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pages = ['index.html','calculador.html','gracias.html','privacidad.html','condiciones.html','preparacion-tef-canada.html','nclc-7.html','tefaq-quebec.html'];
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
    if (target && !fs.existsSync(path.join(root, target))) errors.push(`${file}: missing link target ${target}`);
  }
}

for (const required of ['robots.txt','sitemap.xml','og-pathway.png','analytics.js','site-config.js']) {
  if (!fs.existsSync(path.join(root, required))) errors.push(`missing asset ${required}`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Site integrity: ${pages.length} pages and local links passed`);
