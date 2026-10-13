#!/usr/bin/env node
// Makes the V4 design the site served at pathway-languages.com, without /v4
// in the address.
//
// - Every finished V4 page is published at its root address (/v4/fr/ → /fr/,
//   /v4/programas/a1/ → /programas/a1/, …), replacing the current-site page
//   of the same address. Links to V4 pages lose their /v4 prefix; styles,
//   scripts and images keep being served from /v4/, which visitors never see.
// - A V4 page that is still a "page en refonte" placeholder is not published:
//   links to it point to the working page of the current site instead, until
//   the redesigned page exists (then it is promoted on the next build, with
//   no change here).
// - Old /v4/… addresses redirect to the root address, keeping ?query and
//   #hash, so shared links keep working without duplicate pages.
//
// Integration: build.mjs calls makeV4Default({ outDir }) last.

import { access, readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';

const SITE_ORIGIN = 'https://pathway-languages.com';
const PLACEHOLDER_MARKER = 'class="placeholder-page"';

// Placeholder pages whose current-site equivalent has another address.
const ALIASES = {
  '/v4/aviso-legal.html': '/condiciones.html',
  '/v4/cookies.html': '/privacidad.html',
  '/v4/nclc7.html': '/nclc-7.html'
};

// Files whose /v4/<page> links must follow the pages to the root.
const V4_SCRIPTS_WITH_LINKS = ['content.js', 'render.js'];

const exists = path => access(path).then(() => true, () => false);
const fileFor = (outDir, route) => join(outDir, route.endsWith('/') ? `${route}index.html` : route);
const routeOf = (outDir, file) => `/${relative(outDir, file).split(sep).join('/')}`.replace(/index\.html$/, '');
const langOf = route => (route.match(/^\/(?:v4\/)?(fr|en|de)\//) || [])[1] || 'es';
const isPage = path => path.endsWith('/') || path.endsWith('.html');

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

// Root address of the working current-site page for a V4 placeholder.
async function fallbackFor(outDir, route, promoted) {
  const legacy = route.replace(/^\/v4/, '');
  const name = legacy.split('/').pop();
  const candidates = [ALIASES[route], legacy, `/${name === 'nclc7.html' ? 'nclc-7.html' : name}`].filter(Boolean);
  for (const candidate of candidates) {
    if (promoted.has(candidate)) return candidate;
    const file = fileFor(outDir, candidate);
    if (await exists(file) && !(await readFile(file, 'utf8')).includes(PLACEHOLDER_MARKER)) return candidate;
  }
  return null;
}

export async function makeV4Default({ outDir }) {
  const v4Pages = new Map();
  for (const file of await htmlFiles(join(outDir, 'v4'))) {
    const markup = await readFile(file, 'utf8');
    v4Pages.set(routeOf(outDir, file), { file, markup, placeholder: markup.includes(PLACEHOLDER_MARKER) });
  }

  // Finished V4 pages and their root address.
  const promoted = new Set();
  for (const [route, page] of v4Pages) if (!page.placeholder) promoted.add(route.replace(/^\/v4/, '') || '/');

  // Where each V4 page address now lives.
  const destination = new Map();
  const unresolved = [];
  for (const [route, page] of v4Pages) {
    const target = page.placeholder ? await fallbackFor(outDir, route, promoted) : (route.replace(/^\/v4/, '') || '/');
    if (target) destination.set(route, target);
    else unresolved.push(route);
  }
  if (unresolved.length) throw new Error(`V4 placeholders without a working fallback: ${unresolved.join(', ')}`);

  // Rewrite /v4/<page> links (relative, absolute and inside attributes or
  // scripts); /v4/<asset> references are left untouched.
  const rewrite = text => text.replace(/(https:\/\/pathway-languages\.com)?\/v4\/([A-Za-z0-9_\-./]*)/g, (match, origin, rest) => {
    const route = `/v4/${rest}`;
    if (!isPage(route)) return match;
    const target = destination.get(route) || route.replace(/^\/v4/, '');
    return `${origin || ''}${target}`;
  });

  for (const [route, page] of v4Pages) {
    const target = destination.get(route);
    if (!page.placeholder) {
      const file = fileFor(outDir, target);
      await mkdir(dirname(file), { recursive: true });
      const markup = rewrite(page.markup)
        .replace(/<meta name="robots" content="noindex, ?(follow|nofollow)">/, '<meta name="robots" content="index, follow">');
      await writeFile(file, markup, 'utf8');
    }
    await writeFile(page.file, redirectPage(target, langOf(route)), 'utf8');
  }

  for (const name of V4_SCRIPTS_WITH_LINKS) {
    const file = join(outDir, 'v4', name);
    if (await exists(file)) await writeFile(file, rewrite(await readFile(file, 'utf8')), 'utf8');
  }

  return {
    promoted: [...promoted].sort(),
    redirects: [...destination].filter(([route]) => v4Pages.get(route).placeholder).map(([route, target]) => `${route} -> ${target}`)
  };
}
