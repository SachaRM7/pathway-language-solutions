// Last build step: what search engines, link previews and the host see.
//
// - Old addresses and working copies (/test.html, /index-v2.html, /v3/…,
//   /v4/…, …) redirect to the current page: dist/worker-data.json feeds the
//   301s of worker/index.js, and each old file becomes a noindex relay page
//   for hosts without the Worker. Links inside the site skip the relay.
//   (dist/worker-data.json also gives the Worker the size of each audio and
//   video file, for byte-range answers.)
// - Thank-you pages are noindex, without hreflang.
// - hreflang only lists live, indexable pages and always has x-default.
// - Every public page gets its Open Graph / Twitter tags in its own language
//   (existing tags are kept; only the generic image and a wrong locale are
//   replaced), an apple-touch-icon, and JSON-LD on the homes and programs.
// - The home landscape is served as WebP with a PNG fallback.
// - sitemap.xml is generated from the indexable pages.
// - Files nothing links to (original videos, working PNGs) are not published.
//
// Integration: build.mjs calls finalizeSite({ outDir, rootDir, v4Destinations }) last.

import { execFileSync } from 'node:child_process';
import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { redirectPage } from './build-v4-default.mjs';

export const SITE_ORIGIN = 'https://pathway-languages.com';
const LANGS = ['es', 'fr', 'en', 'de'];
const SKIP_DIRS = new Set(['campus', 'prototipos', 'prototypes', 'assets']);

// Old copies of current pages, always redirected.
const LEGACY = {
  '/test.html': '/test-placement.html',
  '/merci.html': '/gracias.html',
  '/politique-confidentialite.html': '/privacidad.html',
  '/calculateur-crs.html': '/calculador.html',
  '/conditions-nclc7.html': '/condiciones.html',
  '/index-v2.html': '/',
  '/couleurs.html': '/'
};
// Old-template pages: redirected only while they have not been rebuilt in V4.
const LEGACY_UNLESS_V4 = {
  '/recursos.html': '/preparacion-tef-canada.html',
  '/tefaq-quebec.html': '/preparacion-tef-canada.html',
  '/fr/ressources.html': '/fr/preparacion-tef-canada.html',
  '/en/ressources.html': '/en/preparacion-tef-canada.html',
  '/de/ressources.html': '/de/preparacion-tef-canada.html'
};
const THANK_YOU = ['/gracias.html', '/fr/merci.html', '/en/merci.html', '/de/merci.html'];

const OG_LOCALE = { es: 'es_419', fr: 'fr_CA', en: 'en_CA', de: 'de_DE' };
const OG_IMAGE_ALT = {
  es: 'Pathway Language Solutions · Tu ruta al NCLC 7 · Clases privadas de francés en vivo',
  fr: 'Pathway Language Solutions · Votre parcours vers le NCLC 7 · Cours privés de français en direct',
  en: 'Pathway Language Solutions · Your path to NCLC 7 · Private live French lessons',
  de: 'Pathway Language Solutions · Ihr Weg zu NCLC 7 · Französisch-Einzelunterricht live'
};
const ogImage = lang => `${SITE_ORIGIN}/og-pathway-${lang}.jpg`;
const HOME = { es: '/', fr: '/fr/', en: '/en/', de: '/de/' };
const INSCRIPTION = { es: '/inscription.html', fr: '/fr/inscription.html', en: '/en/inscription.html', de: '/de/inscription.html' };
const EMAIL = lang => (lang === 'es' ? 'contacto@pathway-languages.com' : 'contact@pathway-languages.com');
const TELEPHONE = '+51 989 887 516';
// Decision 1: three plans, hours per week; the monthly prices are read from v4/content.js.
const PLANS = [
  { key: 'essential', plan: 'Esencial', hours: 2, names: { es: 'Esencial', fr: 'Essentiel', en: 'Essential', de: 'Basis' } },
  { key: 'accelerated', plan: 'Acelerado', hours: 4, names: { es: 'Acelerado', fr: 'Accéléré', en: 'Accelerated', de: 'Beschleunigt' } },
  { key: 'intensive', plan: 'Intensivo', hours: 6, names: { es: 'Intensivo', fr: 'Intensif', en: 'Intensive', de: 'Intensiv' } }
];
const PER_WEEK = { es: 'h/semana', fr: 'h/semaine', en: 'h/week', de: 'Std./Woche' };

const LANDSCAPE_IMG = /<img\b([^>]*?)\ssrc="\/v4\/assets\/parcours-canada\.png"([^>]*)>/g;
const LANDSCAPE_SOURCES = [640, 960, 1254];

const exists = path => stat(path).then(() => true, () => false);
const routeOf = (outDir, file) => `/${relative(outDir, file).split(sep).join('/')}`.replace(/(^|\/)index\.html$/, '$1');
const fileFor = (outDir, route) => join(outDir, route.endsWith('/') ? `${route}index.html` : route);
const escapeAttr = text => text.replace(/&(?![a-zA-Z#0-9]+;)/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const decode = text => text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const isV4 = markup => markup.includes('/v4/home.css') || markup.includes('/v4/assets/fonts/');
const isRelay = markup => /http-equiv="refresh"/i.test(markup);
const robotsOf = markup => ((markup.match(/<meta\s+name="robots"\s+content="([^"]*)"/i) || [])[1] || '').toLowerCase();
const isNoindex = markup => robotsOf(markup).includes('noindex');
const langOfMarkup = markup => {
  const lang = ((markup.match(/<html[^>]*\slang="([a-zA-Z]{2})/) || [])[1] || 'es').toLowerCase();
  return LANGS.includes(lang) ? lang : 'es';
};
const titleOf = markup => decode(((markup.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '').trim());
const descriptionOf = markup => decode((markup.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1] || '');
const canonicalOf = markup => (markup.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i) || [])[1] || null;
const pathOfUrl = href => {
  try {
    const url = new URL(href, SITE_ORIGIN);
    return url.origin === SITE_ORIGIN ? url.pathname : null;
  } catch { return null; }
};
const insertInHead = (markup, tags) => markup.replace(/\n?\s*<\/head>/i, match => `\n  ${tags.join('\n  ')}${match}`);

async function htmlFiles(dir, base = dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(relative(base, path).split(sep)[0])) out.push(...await htmlFiles(path, base));
    } else if (entry.name.endsWith('.html')) out.push(path);
  }
  return out;
}

async function textFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await textFiles(path));
    else if (/\.(html|js|mjs|css|json|xml|webmanifest|vtt)$/.test(entry.name)) out.push(path);
  }
  return out;
}

function lastCommitDate(rootDir) {
  try {
    const date = execFileSync('git', ['log', '-1', '--format=%cs'], { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  } catch { /* no git history in this checkout */ }
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------- redirects

async function buildRedirects(outDir, pages, v4Destinations) {
  const map = new Map();
  const add = (from, to) => {
    map.set(from, to);
    if (from.endsWith('/')) map.set(`${from}index.html`, to);
  };
  for (const [from, to] of Object.entries(LEGACY)) if (pages.has(from)) add(from, to);
  for (const [from, to] of Object.entries(LEGACY_UNLESS_V4)) {
    const page = pages.get(from);
    if (page && !isV4(page.markup)) add(from, to);
  }
  for (const [route] of pages) {
    if (!route.startsWith('/v3/')) continue;
    const target = route.replace(/^\/v3/, '') || '/';
    add(route, pages.has(target) ? target : '/');
  }
  for (const [from, to] of v4Destinations || []) add(from, to);
  // Resolve chains (a V4 placeholder may point to a page that is itself redirected).
  for (const [from] of map) {
    let target = map.get(from);
    const seen = new Set([from]);
    while (map.has(target.split(/[?#]/)[0]) && !seen.has(target)) { seen.add(target); target = map.get(target); }
    map.set(from, target);
  }
  for (const [from, to] of map) {
    const path = to.split(/[?#]/)[0];
    if (from === path) throw new Error(`Redirect loop on ${from}.`);
    if (!(await exists(fileFor(outDir, path)))) throw new Error(`Redirect ${from} -> ${to}: the target page does not exist.`);
  }
  return map;
}

// ------------------------------------------------------------ page passes

function rewriteLinks(markup, route, redirects) {
  const base = new URL(route, SITE_ORIGIN);
  return markup.replace(/(<a\b[^>]*?\shref=")([^"]+)(")/g, (match, open, href, close) => {
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return match;
    let url;
    try { url = new URL(decode(href), base); } catch { return match; }
    if (url.origin !== SITE_ORIGIN) return match;
    const target = redirects.get(url.pathname);
    if (!target) return match;
    const absolute = /^https?:/i.test(href);
    return `${open}${absolute ? SITE_ORIGIN : ''}${target}${url.search}${url.hash}${close}`;
  });
}

function setNoindex(markup) {
  if (/<meta\s+name="robots"/i.test(markup)) {
    return markup.replace(/<meta\s+name="robots"\s+content="[^"]*">/i, '<meta name="robots" content="noindex, follow">');
  }
  return markup.replace(/(<meta\s+charset="[^"]*">)/i, '$1\n  <meta name="robots" content="noindex, follow">');
}

const HREFLANG = /[ \t]*<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)">\n?/gi;

function fixHreflang(markup, route, indexable) {
  const entries = [...markup.matchAll(HREFLANG)].map(([, lang, href]) => ({ lang, href }));
  if (!entries.length) return markup;
  const live = entries.filter(({ lang, href }) => lang !== 'x-default' && indexable.has(pathOfUrl(href)));
  const stripped = markup.replace(HREFLANG, '');
  if (!indexable.has(route) || live.length < 2) return stripped;
  const spanish = live.find(entry => entry.lang === 'es');
  const xDefault = spanish ? spanish.href : live[0].href;
  const block = [...live, { lang: 'x-default', href: xDefault }]
    .map(({ lang, href }) => `<link rel="alternate" hreflang="${lang}" href="${href}">`);
  const anchor = /<link\s+rel="canonical"[^>]*>/i;
  return anchor.test(stripped)
    ? stripped.replace(anchor, match => `${match}\n  ${block.join('\n  ')}`)
    : insertInHead(stripped, block);
}

function shareTags(markup, route, lang) {
  const has = property => new RegExp(`<meta\\s+(?:property|name)="${property}"`, 'i').test(markup);
  let out = markup
    // The old generic image (one Spanish picture for every language) becomes the page-language picture.
    .replace(/(<meta\s+property="og:image"\s+content=")[^"]*\/og-pathway\.png(")/i, `$1${ogImage(lang)}$2`)
    // es_ES / fr_FR were wrong for this audience (decision 9: es_419).
    .replace(/(<meta\s+property="og:locale"\s+content=")[^"]*(")/i, `$1${OG_LOCALE[lang]}$2`);
  const title = titleOf(markup);
  const description = descriptionOf(markup);
  const url = canonicalOf(markup) || `${SITE_ORIGIN}${route}`;
  const usesDefaultImage = !has('og:image') || out.includes(`content="${ogImage(lang)}"`);
  const tags = [];
  if (!has('og:type')) tags.push('<meta property="og:type" content="website">');
  if (!has('og:site_name')) tags.push('<meta property="og:site_name" content="Pathway Language Solutions">');
  if (!has('og:title') && title) tags.push(`<meta property="og:title" content="${escapeAttr(title)}">`);
  if (!has('og:description') && description) tags.push(`<meta property="og:description" content="${escapeAttr(description)}">`);
  if (!has('og:url')) tags.push(`<meta property="og:url" content="${url}">`);
  if (!has('og:locale')) tags.push(`<meta property="og:locale" content="${OG_LOCALE[lang]}">`);
  if (!has('og:locale:alternate')) {
    for (const other of LANGS) if (other !== lang) tags.push(`<meta property="og:locale:alternate" content="${OG_LOCALE[other]}">`);
  }
  if (!has('og:image')) tags.push(`<meta property="og:image" content="${ogImage(lang)}">`);
  if (usesDefaultImage) {
    if (!has('og:image:type')) tags.push('<meta property="og:image:type" content="image/jpeg">');
    if (!has('og:image:width')) tags.push('<meta property="og:image:width" content="1200">');
    if (!has('og:image:height')) tags.push('<meta property="og:image:height" content="630">');
    if (!has('og:image:alt')) tags.push(`<meta property="og:image:alt" content="${escapeAttr(OG_IMAGE_ALT[lang])}">`);
  }
  if (!has('twitter:card')) tags.push('<meta name="twitter:card" content="summary_large_image">');
  return tags.length ? insertInHead(out, tags) : out;
}

function icons(markup) {
  let out = markup.replace(/(<link\s+rel="icon"[^>]*\shref=")[^"]*pathway-mark\.svg(")/i, '$1/v4/assets/favicon.svg$2');
  const tags = [];
  if (!/<link\s+rel="icon"/i.test(out)) tags.push('<link rel="icon" type="image/svg+xml" href="/v4/assets/favicon.svg">');
  if (!/rel="apple-touch-icon"/i.test(out)) tags.push('<link rel="apple-touch-icon" href="/apple-touch-icon.png">');
  return tags.length ? insertInHead(out, tags) : out;
}

function structuredData(markup, route, lang, prices) {
  if (markup.includes('application/ld+json')) return markup;
  const organization = {
    '@type': 'EducationalOrganization',
    '@id': `${SITE_ORIGIN}/#organization`,
    name: 'Pathway Language Solutions',
    alternateName: 'Pathway',
    url: `${SITE_ORIGIN}${HOME[lang]}`,
    logo: `${SITE_ORIGIN}/pathway-logo-512.png`,
    image: ogImage(lang),
    email: EMAIL(lang),
    telephone: TELEPHONE,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: EMAIL(lang),
      telephone: TELEPHONE,
      availableLanguage: ['es', 'fr', 'en', 'de']
    }
  };
  let data = null;
  if (route === HOME[lang]) {
    data = {
      '@context': 'https://schema.org',
      '@graph': [
        { ...organization, description: descriptionOf(markup) || undefined },
        { '@type': 'WebSite', '@id': `${SITE_ORIGIN}${HOME[lang]}#website`, url: `${SITE_ORIGIN}${HOME[lang]}`, name: 'Pathway Language Solutions', inLanguage: lang, publisher: { '@id': organization['@id'] } }
      ]
    };
  }
  const program = route.match(/^\/(?:(fr|en|de)\/)?programas\/(a1|a2|b1|b2)\/$/);
  if (program) {
    const level = program[2].toUpperCase();
    data = {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: titleOf(markup).replace(/\s*\|\s*Pathway.*$/, ''),
      description: descriptionOf(markup),
      url: `${SITE_ORIGIN}${route}`,
      educationalLevel: `CEFR ${level}`,
      provider: { '@type': 'EducationalOrganization', '@id': organization['@id'], name: organization.name, url: organization.url },
      hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online' },
      offers: PLANS.map(plan => ({
        '@type': 'Offer',
        name: `${plan.names[lang]} · ${plan.hours} ${PER_WEEK[lang]}`,
        url: `${SITE_ORIGIN}${INSCRIPTION[lang]}?plan=${plan.plan}`,
        category: 'Subscription',
        price: prices[plan.key].toFixed(2),
        priceCurrency: 'CAD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: prices[plan.key].toFixed(2),
          priceCurrency: 'CAD',
          referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' }
        }
      }))
    };
  }
  if (!data) return markup;
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return insertInHead(markup, [`<script type="application/ld+json">${json}</script>`]);
}

function landscapePicture(markup) {
  return markup.replace(LANDSCAPE_IMG, (match, before, after) => {
    const attributes = `${before}${after}`.replace(/\sfetchpriority="[^"]*"/, '').replace(/\sdecoding="[^"]*"/, '');
    const srcset = LANDSCAPE_SOURCES.map(width => `/v4/assets/parcours-canada-${width}.webp ${width}w`).join(', ');
    return `<picture><source type="image/webp" srcset="${srcset}" sizes="(max-width: 1023px) 100vw, 640px"><img${attributes.replace(/\s+$/, '')} src="/v4/assets/parcours-canada.png" decoding="async"></picture>`;
  });
}

async function monthlyPrices(rootDir) {
  const content = await readFile(join(rootDir, 'v4', 'content.js'), 'utf8');
  const block = (content.match(/MONTHLY_AMOUNTS\s*=\s*Object\.freeze\(\{([^}]*)\}\)/) || [])[1] || '';
  const prices = {};
  for (const [, key, value] of block.matchAll(/(\w+)\s*:\s*([\d.]+)/g)) prices[key] = Number(value);
  for (const plan of PLANS) if (!(prices[plan.key] > 0)) throw new Error(`v4/content.js: no monthly price for ${plan.key}.`);
  return prices;
}

// ------------------------------------------------------------------ sitemap

function sitemap(routes, lastmod) {
  const order = route => {
    const lang = (route.match(/^\/(fr|en|de)\//) || [])[1] || 'es';
    return [LANGS.indexOf(lang), route === HOME[lang] ? 0 : 1, route];
  };
  const sorted = [...routes].sort((a, b) => {
    const [la, ha, ra] = order(a);
    const [lb, hb, rb] = order(b);
    return la - lb || ha - hb || ra.localeCompare(rb);
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by scripts/build-seo.mjs from the indexable pages of the build. Do not edit. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sorted.map(route => `  <url><loc>${SITE_ORIGIN}${route}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;
}

// ------------------------------------------------------------------ headers

// Cloudflare static-asset headers for files served without the Worker (images,
// fonts, videos, CSS, JS). Pages, folders, audio and video pass through
// worker/index.js, which sets the same security headers itself. File names are
// not versioned, so assets are cached for a week (revalidated in the
// background), not forever.
const HEADERS = `# Generated by scripts/build-seo.mjs. Do not edit.
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000
/assets/*
  Cache-Control: public, max-age=604800, stale-while-revalidate=86400
/v4/assets/*
  Cache-Control: public, max-age=604800, stale-while-revalidate=86400
`;

// ---------------------------------------------------------- unused files

async function removeUnusedFiles(outDir) {
  const candidates = [];
  for (const folder of ['assets', join('assets', 'videos')]) {
    for (const entry of await readdir(join(outDir, folder), { withFileTypes: true })) {
      if (entry.isFile()) candidates.push(join(folder, entry.name));
    }
  }
  const texts = await Promise.all((await textFiles(outDir)).map(file => readFile(file, 'utf8')));
  const corpus = texts.join('\n');
  const removed = [];
  for (const candidate of candidates) {
    const name = candidate.split(sep).pop();
    if (corpus.includes(name)) continue;
    await rm(join(outDir, candidate));
    removed.push(`/${candidate.split(sep).join('/')}`);
  }
  return removed;
}

// --------------------------------------------------------------------- main

export async function finalizeSite({ outDir, rootDir, v4Destinations }) {
  const pages = new Map();
  for (const file of await htmlFiles(outDir)) {
    const route = routeOf(outDir, file);
    if (route === '/404.html') continue;
    pages.set(route, { file, markup: await readFile(file, 'utf8') });
  }

  const redirects = await buildRedirects(outDir, pages, v4Destinations);
  for (const [from, to] of redirects) {
    const page = pages.get(from);
    if (!page) continue;
    const lang = (from.match(/^\/(?:v[34]\/)?(fr|en|de)\//) || [])[1] || 'es';
    await writeFile(page.file, redirectPage(to, lang), 'utf8');
    pages.delete(from);
  }

  // Thank-you pages: reached after a form, not from a search engine.
  for (const route of THANK_YOU) {
    const page = pages.get(route);
    if (page) page.markup = setNoindex(page.markup);
  }

  for (const [route, page] of pages) if (isRelay(page.markup)) pages.delete(route);
  const indexable = new Set([...pages].filter(([route, page]) => {
    if (isNoindex(page.markup)) return false;
    const canonical = canonicalOf(page.markup);
    return !canonical || pathOfUrl(canonical) === route;
  }).map(([route]) => route));

  const prices = await monthlyPrices(rootDir);
  for (const [route, page] of pages) {
    const lang = langOfMarkup(page.markup);
    let markup = rewriteLinks(page.markup, route, redirects);
    markup = fixHreflang(markup, route, indexable);
    markup = shareTags(markup, route, lang);
    markup = icons(markup);
    markup = structuredData(markup, route, lang, prices);
    markup = landscapePicture(markup);
    page.markup = markup;
    await writeFile(page.file, markup, 'utf8');
  }

  const lastmod = lastCommitDate(rootDir);
  await writeFile(join(outDir, 'sitemap.xml'), sitemap(indexable, lastmod), 'utf8');
  await writeFile(join(outDir, '_headers'), HEADERS, 'utf8');
  const removed = await removeUnusedFiles(outDir);
  // Read by worker/index.js (outside the public assets): the 301 map and the
  // size of each audio and video file, for byte-range answers.
  const media = {};
  for (const folder of ['videos', 'audio']) {
    for (const entry of await readdir(join(outDir, 'assets', folder), { withFileTypes: true })) {
      if (entry.isFile()) media[`/assets/${folder}/${entry.name}`] = (await stat(join(outDir, 'assets', folder, entry.name))).size;
    }
  }
  const workerData = { redirects: Object.fromEntries([...redirects].sort()), media };
  await writeFile(join(dirname(outDir), 'worker-data.json'), `${JSON.stringify(workerData, null, 2)}\n`, 'utf8');

  return { redirects, indexable: [...indexable].sort(), removed, lastmod };
}
