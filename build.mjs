import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { LOCALES, pageNames, renderLocalePage } from './i18n/locale-pages.mjs';
import { renderPricing, renderReviews } from './v4/render.js';
import { buildV4Routes } from './scripts/build-v4-routes.mjs';
import { buildV4Programs } from './scripts/build-v4-programs.mjs';
import { makeV4Default } from './scripts/build-v4-default.mjs';
import { buildV4Pages } from './scripts/build-v4-pages.mjs';
import { buildCampus } from './scripts/build-campus.mjs';

const root = process.cwd();
const dist = resolve(root, 'dist');
const client = resolve(dist, 'client');
const canonicalHome = await readFile(resolve(root, 'index-v2.html'), 'utf8');
const sectionSignature = markup => [...markup.matchAll(/<section class="([^"]+)"/g)].map(match => match[1]);
const canonicalHomeSections = sectionSignature(canonicalHome);
const sharedShellHref = 'pathway-page-shell.css';
const assertSharedShell = (markup, page) => {
  if (!markup.includes('class="pathway-page"') || !markup.includes(sharedShellHref)) {
    throw new Error(`${page} must use the shared Pathway page shell.`);
  }
};
const assertHomeParity = (markup, page) => {
  const requiredMarkers = [
    'pathway-v2.css', 'brand-palette', 'class="site-header"', 'class="hero"',
    'starting-section', 'route-section', 'context-section', 'teacher-section',
    'experience-section', 'week-section', 'stories-section', 'plans-section',
    'faq-section', 'closing-section', 'class="site-footer"'
  ];
  const missing = requiredMarkers.filter(marker => !markup.includes(marker));
  if (missing.length) {
    throw new Error(`${page} diverges from the Spanish home structure: ${missing.join(', ')}`);
  }
  const positions = requiredMarkers.slice(2).map(marker => markup.indexOf(marker));
  if (positions.some((position, index) => index > 0 && position <= positions[index - 1])) {
    throw new Error(`${page} changes the Spanish home section order.`);
  }
  const localizedSections = sectionSignature(markup);
  if (JSON.stringify(localizedSections) !== JSON.stringify(canonicalHomeSections)) {
    throw new Error(`${page} must preserve every Spanish home section and CSS class.`);
  }
};
const assertMobileExperience = (markup, page, nested = false) => {
  const requiredMarkers = ['viewport-fit=cover', 'data-video-play', 'preload="none"', 'data-story-swipe-hint', 'data-story-deck', ...(page === 'index.html' ? [] : ['data-week-swipe-hint']), 'data-plan-swipe-hint', 'data-plans-deck'];
  const missing = requiredMarkers.filter(marker => !markup.includes(marker));
  if (missing.length) throw new Error(`${page} is missing mobile experience markers: ${missing.join(', ')}`);
  if (/data-testimonial-video[^>]*autoplay/.test(markup)) throw new Error(`${page} must not autoplay testimonial videos.`);
  if (nested && (markup.includes('srcset="assets/') || markup.includes(', assets/'))) {
    throw new Error(`${page} contains a non-localized responsive image path.`);
  }
};
assertMobileExperience(canonicalHome, 'index-v2.html');
const assets = [
  'index.html', 'index-v2.html', 'pathway-v3.css', 'pathway-v3.js', 'programa.css', 'programa.js', 'manual-a2.css', 'manual-a2.js', 'calculador.html', 'calculateur-crs.html', 'gracias.html', 'merci.html',
  'privacidad.html', 'politique-confidentialite.html', 'condiciones.html', 'conditions-nclc7.html',
  'preparacion-tef-canada.html', 'recursos.html', 'nclc-7.html', 'tefaq-quebec.html',
  'pathway-mark.svg', 'theme.css', 'guide.css', 'theme.js', 'site-config.js', 'analytics.js',
  'og-pathway.png', 'robots.txt', 'sitemap.xml', 'crs-engine.js', 'ircc-data.js',
  'pathway-v2.css', 'pathway-page-shell.css', 'pathway-v2.js', 'test-placement.html', 'test.html', 'placement.css',
  'placement-test.css', 'test.css', 'placement-test.js', 'test.js', 'placement-scoring.js',
  'inscription.html', 'inscription.js', 'inscription.css', 'resource.css', 'resource.js',
  'calculator.css', 'calculator.js', 'conditions-nclc7.css', 'conditions-nclc7.js'
];

await rm(dist, { recursive: true, force: true });
await mkdir(client, { recursive: true });

for (const asset of assets) {
  const destination = asset;
  await cp(resolve(root, asset), resolve(client, destination));
}
await cp(resolve(root, 'index-v2.html'), resolve(client, 'index-v2.html'));
await cp(resolve(root, 'index-v2.html'), resolve(client, 'couleurs.html'));
await cp(resolve(root, 'assets'), resolve(client, 'assets'), { recursive: true });
await mkdir(resolve(client, 'i18n'), { recursive: true });
await cp(resolve(root, 'i18n', 'locale.css'), resolve(client, 'i18n', 'locale.css'), { recursive: false });

// The promoted homepage and program pages are public; old v3 URLs redirect.
await cp(resolve(root, 'programas'), resolve(client, 'programas'), { recursive: true });
await cp(resolve(root, 'v3'), resolve(client, 'v3'), { recursive: true, filter: source => !source.endsWith('.md') });
await cp(resolve(root, 'v4'), resolve(client, 'v4'), { recursive: true, filter: source => !source.endsWith('.md') });
const v4HomePath = resolve(client, 'v4/index.html');
const v4Home = (await readFile(v4HomePath, 'utf8'))
  .replace('<!-- pricing-cards -->', renderPricing('monthly'))
  .replace('<!-- written-reviews -->', renderReviews(0));
await writeFile(v4HomePath, v4Home, 'utf8');
await buildV4Routes({ outDir: client, rootDir: root });
// The V4 program pages replace their placeholders with the manual reader.
await buildV4Programs({ outDir: client, rootDir: root });
const publicHome = await readFile(resolve(client, 'index.html'), 'utf8');
assertMobileExperience(publicHome, 'index.html');
if (!publicHome.includes('data-program-carousel') || publicHome.includes('noindex') || !publicHome.includes('href="/programas/a2/"')) {
  throw new Error('The public homepage must include the indexable program carousel and A2 link.');
}
const manualReaderPage = await readFile(resolve(root, 'programas', 'a2', 'index.html'), 'utf8');
const manualReaderScript = await readFile(resolve(root, 'manual-a2.js'), 'utf8');
const manualReaderStyles = await readFile(resolve(root, 'manual-a2.css'), 'utf8');
const fullscreenMarkers = [
  [manualReaderPage, 'id="fullscreen-open"'],
  [manualReaderPage, 'aria-pressed="false"'],
  [manualReaderScript, 'requestFullscreen'],
  [manualReaderScript, "classList.toggle('is-reader-fullscreen'"],
  [manualReaderStyles, '.reader-shell.is-reader-fullscreen'],
  [manualReaderStyles, 'env(safe-area-inset-top)']
];
if (fullscreenMarkers.some(([source, marker]) => !source.includes(marker))) {
  throw new Error('The A2 reader must keep a persistent, safe-area-aware fullscreen mode with page navigation.');
}
const commitmentPage = await readFile(resolve(root, 'condiciones.html'), 'utf8');
for (const marker of ['proyeccion-b1', 'evaluacion-b2', 'consolidacion', '4 meses', 'se factura normalmente']) {
  if (!commitmentPage.includes(marker)) throw new Error(`The NCLC 7 commitment is missing the required stage: ${marker}.`);
}
// Historical Spanish homepage links must reach the new default experience.
const homeRedirect = await readFile(resolve(root, 'v3/index.html'), 'utf8');
await writeFile(resolve(client, 'index-v2.html'), homeRedirect);
await writeFile(resolve(client, 'couleurs.html'), homeRedirect);

for (const page of ['condiciones.html', 'conditions-nclc7.html', 'calculador.html', 'calculateur-crs.html']) {
  assertSharedShell(await readFile(resolve(root, page), 'utf8'), page);
}

for (const locale of Object.keys(LOCALES)) {
  const localeDir = resolve(client, locale);
  await mkdir(localeDir, { recursive: true });
  for (const page of pageNames) {
    const markup = renderLocalePage(locale, page);
    if (page === 'index.html') {
      assertHomeParity(markup, `${locale}/${page}`);
      assertMobileExperience(markup, `${locale}/${page}`, true);
    }
    else if (page !== 'inscription.html') assertSharedShell(markup, `${locale}/${page}`);
    await writeFile(resolve(localeDir, page), markup, 'utf8');
  }
}


// Redesigned V4 pages replace their placeholders, then the V4 design is
// served at the root addresses; /v4/… redirects there.
await buildV4Pages({ outDir: client, rootDir: root });
const v4Default = await makeV4Default({ outDir: client });
// The student and teacher campus is a separate app under /campus/ (noindex, invitation only).
const campus = await buildCampus({ outDir: client, rootDir: root });

const generated = assets.length + 2 + Object.keys(LOCALES).length * pageNames.length;
console.log(`Built ${generated} static assets plus ${Object.keys(LOCALES).length} locale trees and the public program pages for Pathway.`);
console.log(`Campus published at /campus/ and linked from ${campus.linked} page headers.`);
console.log(`V4 design served at the root: ${v4Default.promoted.length} pages; ${v4Default.redirects.length} unfinished V4 pages keep the current-site page.`);
