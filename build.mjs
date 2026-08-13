import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const dist = resolve(root, 'dist');
const client = resolve(dist, 'client');
const server = resolve(dist, 'server');
const metadata = resolve(dist, '.openai');
const assets = [
  'index-v2.html',
  'calculador.html',
  'gracias.html',
  'privacidad.html',
  'condiciones.html',
  'preparacion-tef-canada.html',
  'nclc-7.html',
  'tefaq-quebec.html',
  'pathway-mark.svg',
  'theme.css',
  'guide.css',
  'theme.js',
  'site-config.js',
  'analytics.js',
  'og-pathway.png',
  'robots.txt',
  'sitemap.xml',
  'crs-engine.js',
  'ircc-data.js'
  ,'pathway-v2.css'
  ,'pathway-v2.js'
];

await rm(dist, { recursive: true, force: true });
await mkdir(client, { recursive: true });
await mkdir(server, { recursive: true });
await mkdir(metadata, { recursive: true });

for (const asset of assets) {
  const destination = asset === 'index-v2.html' ? 'index.html' : asset;
  await cp(resolve(root, asset), resolve(client, destination));
}
// Deux URL partageables, une seule source HTML : la seconde active la palette Pathway humanisée.
await cp(resolve(root, 'index-v2.html'), resolve(client, 'couleurs.html'));
await cp(resolve(root, 'assets'), resolve(client, 'assets'), { recursive: true });
await cp(resolve(root, '.openai', 'hosting.json'), resolve(metadata, 'hosting.json'));
await writeFile(resolve(server, 'index.js'), `export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  }
};
`, 'utf8');

console.log(`Built ${assets.length} static assets for Pathway.`);
