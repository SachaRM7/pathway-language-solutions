// Checks what the last build step produced (scripts/build-seo.mjs): sitemap,
// share tags, hreflang, JSON-LD, redirects, 404 page and share images.
// Errors stop the build; hreflang pairs that do not point back at each other
// are reported as warnings (their pages belong to other parts of the site).
//
// Usage: node scripts/verify-site.mjs [dist/client]   (build.mjs calls verifySite)

import { readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SITE_ORIGIN = 'https://pathway-languages.com';
const OG_LOCALE = { es: 'es_419', fr: 'fr_CA', en: 'en_CA', de: 'de_DE' };
const MAX_SHARE_IMAGE = 300 * 1024;
const fileFor = (outDir, route) => join(outDir, route.endsWith('/') ? `${route}index.html` : route);
const meta = (markup, key) => (markup.match(new RegExp(`<meta\\s+(?:property|name)="${key}"\\s+content="([^"]*)"`, 'i')) || [])[1];

export async function verifySite({ outDir }) {
  const errors = [];
  const warnings = [];
  const read = path => readFile(path, 'utf8').catch(() => null);
  const size = path => stat(path).then(info => info.size, () => -1);

  const sitemap = await read(join(outDir, 'sitemap.xml'));
  if (!sitemap) throw new Error('dist has no sitemap.xml.');
  const routes = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc.replace(SITE_ORIGIN, ''));
  const seen = new Set();
  for (const route of routes) {
    if (seen.has(route)) errors.push(`sitemap lists ${route} twice`);
    seen.add(route);
  }
  for (const required of ['/', '/fr/', '/en/', '/de/', '/test-placement.html', '/inscription.html', '/nclc-7.html', '/preparacion-tef-canada.html', '/en/tef-canada-preparation.html', '/de/tef-canada-vorbereitung.html', '/en/programs/a2/', '/de/programme/a2/']) {
    if (!seen.has(required)) errors.push(`sitemap is missing ${required}`);
  }
  for (const route of routes) {
    if (/^\/(v3|v4|campus)\//.test(route) || ['/test.html', '/index-v2.html', '/couleurs.html', '/404.html'].includes(route)) errors.push(`sitemap lists a working page: ${route}`);
  }

  const robots = await read(join(outDir, 'robots.txt')) || '';
  const disallowed = [...robots.matchAll(/^Disallow:\s*(\S+)/gm)].map(([, path]) => path);

  const pages = new Map();
  for (const route of routes) {
    const markup = await read(fileFor(outDir, route));
    if (!markup) { errors.push(`sitemap lists ${route}, which is not in the build`); continue; }
    pages.set(route, markup);
    const lang = ((markup.match(/<html[^>]*\slang="([a-z]{2})/) || [])[1]) || 'es';
    if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(markup)) errors.push(`${route} is in the sitemap but noindex`);
    if (/http-equiv="refresh"/i.test(markup)) errors.push(`${route} is in the sitemap but is a relay page`);
    const canonical = (markup.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i) || [])[1];
    if (canonical && canonical !== `${SITE_ORIGIN}${route}`) errors.push(`${route}: canonical points to ${canonical}`);
    if (disallowed.some(path => route.startsWith(path))) errors.push(`${route} is in the sitemap but robots.txt disallows it`);
    for (const key of ['og:title', 'og:description', 'og:image', 'og:url', 'og:locale', 'og:type', 'og:site_name', 'twitter:card']) {
      if (!meta(markup, key)) errors.push(`${route}: no ${key}`);
    }
    const locale = meta(markup, 'og:locale');
    if (locale && OG_LOCALE[lang] && locale !== OG_LOCALE[lang]) errors.push(`${route}: og:locale ${locale} for a page in ${lang}`);
    const image = meta(markup, 'og:image');
    if (image && image.startsWith(SITE_ORIGIN)) {
      const bytes = await size(join(outDir, image.replace(SITE_ORIGIN, '')));
      if (bytes < 0) errors.push(`${route}: og:image ${image} is not in the build`);
      else if (bytes > MAX_SHARE_IMAGE) errors.push(`${route}: og:image ${image} weighs ${Math.round(bytes / 1024)} KB (max 300 KB)`);
    }
    for (const [, json] of markup.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try { JSON.parse(json); } catch (error) { errors.push(`${route}: invalid JSON-LD (${error.message})`); }
    }
  }

  // hreflang: every target is a sitemap page, x-default exists, pairs point back.
  for (const [route, markup] of pages) {
    const alternates = [...markup.matchAll(/<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)">/gi)].map(([, lang, href]) => ({ lang, route: href.replace(SITE_ORIGIN, '') }));
    if (!alternates.length) continue;
    if (!alternates.some(entry => entry.lang === 'x-default')) errors.push(`${route}: hreflang without x-default`);
    for (const { lang, route: target } of alternates) {
      if (!pages.has(target)) { errors.push(`${route}: hreflang ${lang} points to ${target}, which is not an indexable page`); continue; }
      if (lang === 'x-default' || target === route) continue;
      if (!pages.get(target).includes(`hreflang="`) || !pages.get(target).includes(`href="${SITE_ORIGIN}${route}"`)) {
        warnings.push(`hreflang ${route} -> ${target} (${lang}) is not returned by ${target}`);
      }
    }
  }

  // Redirects used by the Worker.
  const workerData = JSON.parse(await read(join(dirname(outDir), 'worker-data.json')) || '{}');
  const redirects = workerData.redirects || {};
  for (const [path, bytes] of Object.entries(workerData.media || {})) {
    if ((await size(join(outDir, path))) !== bytes) errors.push(`worker-data.json: wrong size for ${path}`);
  }
  if (!Object.keys(workerData.media || {}).length) errors.push('worker-data.json lists no audio or video file');
  for (const [from, to] of Object.entries(redirects)) {
    if (!(await read(fileFor(outDir, to.split(/[?#]/)[0])))) errors.push(`redirect ${from} -> ${to}: no such page`);
    if (seen.has(from)) errors.push(`redirected address ${from} is in the sitemap`);
  }
  for (const legacy of ['/test.html', '/index-v2.html', '/couleurs.html', '/merci.html', '/politique-confidentialite.html', '/v3/', '/v4/', '/v4/inscription.html']) {
    if (!redirects[legacy]) errors.push(`${legacy} has no redirect`);
  }
  // English and German pages that had French or Spanish names (trad-64): one hop to the new name.
  for (const [legacy, target] of [['/en/preparacion-tef-canada.html', '/en/tef-canada-preparation.html'], ['/de/programas/a2/', '/de/programme/a2/'], ['/v4/en/calculateur-crs.html', '/en/crs-calculator.html'], ['/de/merci.html', '/de/danke.html']]) {
    if (redirects[legacy] !== target) errors.push(`${legacy} must redirect to ${target}, not ${redirects[legacy] || 'nowhere'}`);
  }
  for (const [from, to] of Object.entries(redirects)) {
    if (redirects[to.split(/[?#]/)[0]]) errors.push(`redirect ${from} -> ${to} takes more than one hop`);
  }

  const notFound = await read(join(outDir, '404.html'));
  if (!notFound || !notFound.includes('noindex')) errors.push('404.html is missing or indexable');
  for (const lang of Object.keys(OG_LOCALE)) {
    const bytes = await size(join(outDir, `og-pathway-${lang}.jpg`));
    if (bytes < 0 || bytes > MAX_SHARE_IMAGE) errors.push(`og-pathway-${lang}.jpg is missing or over 300 KB`);
  }
  if (!(await read(join(outDir, '_headers')))) errors.push('dist has no _headers file');

  if (errors.length) throw new Error(`Site check failed:\n- ${errors.join('\n- ')}`);
  return { pages: pages.size, redirects: Object.keys(redirects).length, warnings };
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const outDir = resolve(process.argv[2] || 'dist/client');
  const report = await verifySite({ outDir });
  for (const warning of report.warnings) console.warn(`warning: ${warning}`);
  console.log(`Site check passed: ${report.pages} sitemap pages, ${report.redirects} redirects.`);
}
