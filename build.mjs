import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const dist = resolve(root, 'dist');
const client = resolve(dist, 'client');
const server = resolve(dist, 'server');
const metadata = resolve(dist, '.openai');
const assets = [
  'index.html',
  'calculador.html',
  'gracias.html',
  'pathway-mark.svg',
  'theme.css',
  'theme.js',
  'crs-engine.js',
  'ircc-data.js'
];

await rm(dist, { recursive: true, force: true });
await mkdir(client, { recursive: true });
await mkdir(server, { recursive: true });
await mkdir(metadata, { recursive: true });

for (const asset of assets) {
  await cp(resolve(root, asset), resolve(client, asset));
}
await cp(resolve(root, '.openai', 'hosting.json'), resolve(metadata, 'hosting.json'));
await writeFile(resolve(server, 'index.js'), `export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  }
};
`, 'utf8');

console.log(`Built ${assets.length} static assets for Pathway.`);
