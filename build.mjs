import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { LOCALES, pageNames, renderLocalePage } from './i18n/locale-pages.mjs';

const root = process.cwd();
const dist = resolve(root, 'dist');
const client = resolve(dist, 'client');
const server = resolve(dist, 'server');
const metadata = resolve(dist, '.openai');
const assets = [
  'index-v2.html', 'calculador.html', 'calculateur-crs.html', 'gracias.html', 'merci.html',
  'privacidad.html', 'politique-confidentialite.html', 'condiciones.html', 'conditions-nclc7.html',
  'preparacion-tef-canada.html', 'recursos.html', 'nclc-7.html', 'tefaq-quebec.html',
  'pathway-mark.svg', 'theme.css', 'guide.css', 'theme.js', 'site-config.js', 'analytics.js',
  'og-pathway.png', 'robots.txt', 'sitemap.xml', 'crs-engine.js', 'ircc-data.js',
  'pathway-v2.css', 'pathway-v2.js', 'test-placement.html', 'test.html', 'placement.css',
  'placement-test.css', 'test.css', 'placement-test.js', 'test.js', 'placement-scoring.js',
  'inscription.html', 'inscription.js', 'resource.css', 'resource.js',
  'calculator.css', 'calculator.js', 'conditions-nclc7.css', 'conditions-nclc7.js'
];

await rm(dist, { recursive: true, force: true });
await mkdir(client, { recursive: true });
await mkdir(server, { recursive: true });
await mkdir(metadata, { recursive: true });

for (const asset of assets) {
  const destination = asset === 'index-v2.html' ? 'index.html' : asset;
  await cp(resolve(root, asset), resolve(client, destination));
}
await cp(resolve(root, 'index-v2.html'), resolve(client, 'index-v2.html'));
await cp(resolve(root, 'index-v2.html'), resolve(client, 'couleurs.html'));
await cp(resolve(root, 'assets'), resolve(client, 'assets'), { recursive: true });
await mkdir(resolve(client, 'i18n'), { recursive: true });
await cp(resolve(root, 'i18n', 'locale.css'), resolve(client, 'i18n', 'locale.css'), { recursive: false });
await cp(resolve(root, '.openai', 'hosting.json'), resolve(metadata, 'hosting.json'));

for (const locale of Object.keys(LOCALES)) {
  const localeDir = resolve(client, locale);
  await mkdir(localeDir, { recursive: true });
  for (const page of pageNames) {
    await writeFile(resolve(localeDir, page), renderLocalePage(locale, page), 'utf8');
  }
}

await writeFile(resolve(server, 'index.js'), `export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  }
};
`, 'utf8');

const generated = assets.length + 2 + Object.keys(LOCALES).length * pageNames.length;
console.log(`Built ${generated} static assets plus ${Object.keys(LOCALES).length} locale trees for Pathway.`);
