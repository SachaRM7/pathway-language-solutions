import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { LOCALES, pageNames, renderLocalePage } from './i18n/locale-pages.mjs';

const root = process.cwd();
const dist = resolve(root, 'dist');
const client = resolve(dist, 'client');
const server = resolve(dist, 'server');
const metadata = resolve(dist, '.openai');
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
  const requiredMarkers = ['viewport-fit=cover', 'data-video-play', 'preload="none"', 'data-story-swipe-hint', 'data-story-deck', 'data-week-swipe-hint', 'data-plan-swipe-hint', 'data-plans-deck'];
  const missing = requiredMarkers.filter(marker => !markup.includes(marker));
  if (missing.length) throw new Error(`${page} is missing mobile experience markers: ${missing.join(', ')}`);
  if (/data-testimonial-video[^>]*autoplay/.test(markup)) throw new Error(`${page} must not autoplay testimonial videos.`);
  if (nested && (markup.includes('srcset="assets/') || markup.includes(', assets/'))) {
    throw new Error(`${page} contains a non-localized responsive image path.`);
  }
};
assertMobileExperience(canonicalHome, 'index-v2.html');
const assets = [
  'index-v2.html', 'calculador.html', 'calculateur-crs.html', 'gracias.html', 'merci.html',
  'privacidad.html', 'politique-confidentialite.html', 'condiciones.html', 'conditions-nclc7.html',
  'preparacion-tef-canada.html', 'recursos.html', 'nclc-7.html', 'tefaq-quebec.html',
  'pathway-mark.svg', 'theme.css', 'guide.css', 'theme.js', 'site-config.js', 'analytics.js',
  'og-pathway.png', 'robots.txt', 'sitemap.xml', 'crs-engine.js', 'ircc-data.js',
  'pathway-v2.css', 'pathway-page-shell.css', 'pathway-v2.js', 'test-placement.html', 'test.html', 'placement.css',
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
    else assertSharedShell(markup, `${locale}/${page}`);
    await writeFile(resolve(localeDir, page), markup, 'utf8');
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
