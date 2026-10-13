#!/usr/bin/env node
// Makes V4 the default experience of pathway-languages.com.
//
// - The root and language homepages (/, /fr/, /en/, /de/) redirect to the V4
//   homepage of the same language, keeping the query string and hash.
// - Every V4 page that is still a "page en refonte" placeholder redirects to
//   the working page of the current site, so no V4 link is a dead end. A
//   redesigned V4 page no longer carries the placeholder class, so its
//   redirect disappears on the next build without any change here.
// - V4 homepages and program pages become indexable.
//
// GitHub Pages serves static files only, so redirects are HTML pages with a
// meta refresh plus location.replace (which keeps ?utm=… and #anchors).
//
// Integration: build.mjs calls makeV4Default({ outDir }) last.

import { access, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const SITE_ORIGIN = 'https://pathway-languages.com';
const PLACEHOLDER_MARKER = 'class="placeholder-page"';
export const HOME_REDIRECTS = { '/': '/v4/', '/fr/': '/v4/fr/', '/en/': '/v4/en/', '/de/': '/v4/de/' };

// Placeholder pages whose current-site equivalent has another name.
const ALIASES = {
  '/v4/aviso-legal.html': '/v4/condiciones.html',
  '/v4/cookies.html': '/v4/privacidad.html',
  '/v4/nclc7.html': '/nclc-7.html'
};

const exists = path => access(path).then(() => true, () => false);

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  }));
  return nested.flat();
}

export function redirectPage(target, lang = 'es') {
  const url = JSON.stringify(target);
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, follow">
  <title>Pathway Language Solutions</title>
  <link rel="canonical" href="${SITE_ORIGIN}${target}">
  <meta http-equiv="refresh" content="0; url=${target}">
  <script>location.replace(${url} + location.search + location.hash);</script>
</head>
<body>
  <p><a href="${target}">Pathway Language Solutions</a></p>
</body>
</html>
`;
}

// Where a V4 placeholder should send visitors on the current site.
async function fallbackFor(outDir, route) {
  const candidates = [];
  if (ALIASES[route]) candidates.push(ALIASES[route]);
  const legacy = route.replace(/^\/v4/, '');
  candidates.push(legacy);
  // Pages that only exist in Spanish on the current site.
  const name = legacy.split('/').pop();
  candidates.push(`/${name === 'nclc7.html' ? 'nclc-7.html' : name}`);
  for (const candidate of candidates) {
    const file = join(outDir, candidate.endsWith('/') ? `${candidate}index.html` : candidate);
    if (await exists(file) && !(await readFile(file, 'utf8')).includes(PLACEHOLDER_MARKER)) return candidate;
  }
  return null;
}

const routeOf = (outDir, file) => `/${relative(outDir, file).split(sep).join('/')}`.replace(/index\.html$/, '');
const langOf = route => (route.match(/^\/v4\/(fr|en|de)\//) || [])[1] || 'es';

export async function makeV4Default({ outDir }) {
  const report = { homes: [], placeholders: [], unresolved: [] };

  for (const [route, target] of Object.entries(HOME_REDIRECTS)) {
    await writeFile(join(outDir, route, 'index.html'), redirectPage(target, langOf(target)), 'utf8');
    report.homes.push(`${route} -> ${target}`);
  }

  for (const file of await htmlFiles(join(outDir, 'v4'))) {
    const markup = await readFile(file, 'utf8');
    const route = routeOf(outDir, file);
    if (markup.includes(PLACEHOLDER_MARKER)) {
      const target = await fallbackFor(outDir, route);
      if (target) {
        await writeFile(file, redirectPage(target, langOf(route)), 'utf8');
        report.placeholders.push(`${route} -> ${target}`);
      } else {
        report.unresolved.push(route);
      }
      continue;
    }
    // The public V4 pages are now the site: let search engines index them.
    if (/^\/v4\/((fr|en|de)\/)?(programas\/[ab][12]\/)?$/.test(route)) {
      const indexed = markup.replace(/<meta name="robots" content="noindex, ?(follow|nofollow)">/, '<meta name="robots" content="index, follow">');
      if (indexed !== markup) await writeFile(file, indexed, 'utf8');
    }
  }
  if (report.unresolved.length) {
    throw new Error(`V4 placeholders without a working fallback: ${report.unresolved.join(', ')}`);
  }
  return report;
}
