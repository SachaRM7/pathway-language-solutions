// V4 frame of the interactive flows: placement test, CRS calculator and
// enrollment. The working markup of each flow (every element its script
// reads or writes) and its scripts are taken verbatim from the current page
// of the same language; this module rebuilds everything around them in the
// V4 layout: intro with a summary card, numbered steps, V4 header and footer.
// The flows are restyled by /v4/flows.css.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { icon } from '../v4/icons.js';
import { esc, prefix } from './build-v4-programs.mjs';
import { UI } from './v4-pages-content.mjs';

const VERSION = 'flows-1';

export const FLOWS = {
  test: { es: 'test-placement.html', locale: 'test.html' },
  calculator: { es: 'calculador.html', locale: 'calculateur-crs.html' },
  inscription: { es: 'v4/inscription.html', locale: 'inscription.html' }
};

const COPY = {
  test: {
    trail: { es: 'Test de nivel', fr: 'Test de niveau', en: 'Placement test', de: 'Einstufungstest' },
    steps: {
      es: [['Elige tu test', 'Express para orientarte, intensivo para afinar la estimación.'], ['Responde sin ayuda', 'Preguntas progresivas de A1 a B2, en francés.'], ['Recibe tu estimación', 'Un nivel por competencia, confirmado en tu primera clase.']],
      fr: [['Choisissez votre test', 'Express pour vous orienter, intensif pour affiner l’estimation.'], ['Répondez sans aide', 'Des questions progressives de A1 à B2, en français.'], ['Recevez votre estimation', 'Un niveau par compétence, confirmé lors du premier cours.']],
      en: [['Choose your test', 'Express to get your bearings, intensive for a sharper estimate.'], ['Answer on your own', 'Progressive questions from A1 to B2, in French.'], ['Get your estimate', 'A level per skill, confirmed in your first class.']],
      de: [['Test wählen', 'Express zur Orientierung, intensiv für eine genauere Einschätzung.'], ['Ohne Hilfe antworten', 'Steigende Fragen von A1 bis B2, auf Französisch.'], ['Einschätzung erhalten', 'Ein Niveau pro Kompetenz, in der ersten Stunde bestätigt.']]
    }
  },
  calculator: {
    trail: { es: 'Calculador CRS', fr: 'Calculateur CRS', en: 'CRS calculator', de: 'CRS-Rechner' },
    card: { es: 'Tu escenario en tres pasos', fr: 'Votre scénario en trois étapes', en: 'Your scenario in three steps', de: 'Ihr Szenario in drei Schritten' },
    pill: { es: 'Reglas oficiales IRCC', fr: 'Règles officielles IRCC', en: 'Official IRCC rules', de: 'Offizielle IRCC-Regeln' }
  },
  inscription: {
    trail: { es: 'Inscripción', fr: 'Inscription', en: 'Enrollment', de: 'Anmeldung' },
    steps: {
      es: [['Elige tu ritmo', 'Esencial, Acelerado o Intensivo, según tu fecha.'], ['Propón tus horarios', 'Pathway comprueba la disponibilidad real.'], ['Confirmamos por escrito', 'El pago solo se pide después de la confirmación.']],
      fr: [['Choisissez votre rythme', 'Essentiel, Accéléré ou Intensif, selon votre date.'], ['Proposez vos horaires', 'Pathway vérifie les disponibilités réelles.'], ['Nous confirmons par écrit', 'Le paiement n’est demandé qu’après la confirmation.']],
      en: [['Choose your pace', 'Essential, Accelerated or Intensive, depending on your date.'], ['Suggest your times', 'Pathway checks real availability.'], ['We confirm in writing', 'Payment is only requested after confirmation.']],
      de: [['Rhythmus wählen', 'Essenziell, Beschleunigt oder Intensiv, je nach Ihrem Datum.'], ['Zeiten vorschlagen', 'Pathway prüft die tatsächliche Verfügbarkeit.'], ['Schriftliche Bestätigung', 'Die Zahlung wird erst nach der Bestätigung angefordert.']]
    }
  }
};

const arrow = icon('i-arrow');

// Pieces of the current page: what is inside <main>, and what follows it
// (mobile bars, inline configuration, scripts) without the old footer.
function pieces(markup) {
  const body = markup.slice(markup.indexOf('<body'));
  const mainOpen = body.indexOf('<main');
  const mainStart = body.indexOf('>', mainOpen) + 1;
  const mainEnd = body.indexOf('</main>');
  const main = body.slice(mainStart, mainEnd);
  const after = body.slice(mainEnd + 7, body.lastIndexOf('</body>'))
    .replace(/<footer[\s\S]*?<\/footer>/g, '')
    .replace(/<script[^>]*src="[^"]*(site-config|analytics)\.js[^"]*"[^>]*><\/script>/g, '');
  if (mainOpen < 0 || mainEnd < 0) throw new Error('Flow page without <main>');
  return { main, after };
}

// Make every local URL absolute, relative to where the current page lives.
function absolutize(html, base) {
  return html.replace(/\s(href|src)="([^"]+)"/g, (match, attr, url) => {
    if (/^(https?:|mailto:|tel:|data:|#|\/|javascript:)/.test(url)) return match;
    return ` ${attr}="${new URL(url, `https://x${base}`).pathname}${url.includes('?') ? `?${url.split('?')[1]}` : ''}"`;
  });
}

// Links into the old site that now have a V4 page in the same language.
function toV4(html, lang) {
  const local = lang === 'es' ? '' : `${lang}/`;
  const map = {
    [`/${local}test.html`]: `${prefix(lang)}${lang === 'es' ? 'test-placement.html' : 'test.html'}`,
    '/test-placement.html': `${prefix('es')}test-placement.html`,
    [`/${local}inscription.html`]: `${prefix(lang)}inscription.html`,
    '/privacidad.html': '/v4/privacidad.html',
    [`/${local}politique-confidentialite.html`]: `${prefix(lang)}politique-confidentialite.html`,
    [`/${local}`]: prefix(lang),
    '/index-v2.html': '/v4/'
  };
  return html.replace(/href="([^"?#]+)/g, (match, path) => (map[path] ? `href="${map[path]}` : match));
}

const take = (html, pattern, label) => {
  const match = html.match(pattern);
  if (!match) throw new Error(`Flow markup changed: ${label} not found`);
  return match;
};

const trail = (lang, label) => `<nav class="pg-trail" aria-label="${esc(UI[lang].home)}"><a href="${prefix(lang)}">${UI[lang].home}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(label)}</span></nav>`;
const steps = list => `<ol class="pg-steps">${list.map(([title, text]) => `<li><strong>${esc(title)}</strong><span>${esc(text)}</span></li>`).join('')}</ol>`;

function testMain(lang, main) {
  const intro = take(main, /<section class="intro-grid" data-test-intro>([\s\S]*?)<\/section>/, 'test intro')[1];
  const copy = take(intro, /<div class="intro-copy">([\s\S]*?)<\/div>/, 'test copy')[1];
  const eyebrow = take(copy, /<span class="eyebrow">([\s\S]*?)<\/span>/, 'test eyebrow')[1];
  const h1 = take(copy, /<h1>([\s\S]*?)<\/h1>/, 'test title')[1];
  const lead = take(copy, /<p>([\s\S]*?)<\/p>/, 'test lead')[1];
  const panel = take(intro, /<aside class="intro-panel">([\s\S]*?)<\/aside>/, 'test panel')[1]
    .replace(/^\s*<strong>([\s\S]*?)<\/strong>/, '<span class="pg-pill">$1</span>');
  const flow = main.slice(main.indexOf('</section>', main.indexOf('data-test-intro')) + 10);
  return `    <section class="pg-hero pg-flow-hero" data-test-intro aria-labelledby="pg-title">
      <div class="container pg-hero-grid">
        <div>
          ${trail(lang, COPY.test.trail[lang])}
          <p class="eyebrow">${eyebrow}</p>
          <h1 id="pg-title" class="pg-long">${h1}</h1>
          <p class="pg-lead">${lead}</p>
          ${steps(COPY.test.steps[lang])}
        </div>
        <aside class="pg-card pg-card-dark pg-test-panel intro-panel">${panel}</aside>
      </div>
    </section>
    <section class="pg-flow pg-flow-test">
      <div class="container">${flow}</div>
    </section>`;
}

function calculatorMain(lang, main) {
  if (lang === 'es') {
    const intro = take(main, /<div class="intro">([\s\S]*?)<\/div>\s*<\/div>/, 'calculator intro')[0];
    const eyebrow = take(intro, /<p class="eyebrow">([\s\S]*?)<\/p>/, 'calculator eyebrow')[1];
    const h1 = take(intro, /<h1>([\s\S]*?)<\/h1>/, 'calculator title')[1];
    const lead = take(intro, /<div>\s*<p>([\s\S]*?)<\/p>/, 'calculator lead')[1];
    const status = take(intro, /<span class="data-status" id="data-status">[\s\S]*?<\/span>/, 'calculator status')[0];
    const strip = take(main, /<ol class="scenario-strip"[\s\S]*?<\/ol>/, 'calculator steps')[0];
    const rows = [...strip.matchAll(/<strong>([\s\S]*?)<\/strong><small>([\s\S]*?)<\/small>/g)].map(match => `<li><span><b>${match[1]}</b><br><small>${match[2]}</small></span></li>`);
    const rest = main.slice(main.indexOf('</ol>', main.indexOf('scenario-strip')) + 5).replace(/<\/div>\s*$/, '');
    return calculatorFrame(lang, eyebrow, h1, [lead], status, rows, rest);
  }
  const intro = take(main, /<div class="calculator-intro">([\s\S]*?)<\/div>/, 'calculator intro')[1];
  const eyebrow = take(intro, /<span class="eyebrow">([\s\S]*?)<\/span>/, 'calculator eyebrow')[1];
  const h1 = take(intro, /<h1>([\s\S]*?)<\/h1>/, 'calculator title')[1];
  const lead = take(intro, /<p>([\s\S]*?)<\/p>/, 'calculator lead')[1];
  const status = take(intro, /<p class="calculator-status" id="calculator-status">[\s\S]*?<\/p>/, 'calculator status')[0];
  const strip = take(main, /<ol class="calculator-steps"[\s\S]*?<\/ol>/, 'calculator steps')[0];
  const rows = [...strip.matchAll(/<li>(?:\d+\s*·\s*)?([\s\S]*?)<\/li>/g)].map(match => `<li><span><b>${match[1]}</b></span></li>`);
  const layoutStart = main.indexOf('<div class="calculator-layout">');
  const rest = main.slice(layoutStart).replace(/<\/section>\s*$/, '');
  return calculatorFrame(lang, eyebrow, h1, [lead], status, rows, rest);
}

function calculatorFrame(lang, eyebrow, h1, leads, status, rows, rest) {
  return `    <section class="pg-hero pg-flow-hero" aria-labelledby="pg-title">
      <div class="container pg-hero-grid">
        <div>
          ${trail(lang, COPY.calculator.trail[lang])}
          <p class="eyebrow">${eyebrow}</p>
          <h1 id="pg-title" class="pg-long">${h1}</h1>
          ${leads.map(lead => `<p class="pg-lead">${lead}</p>`).join('')}
          <div class="pg-flow-status">${status}</div>
        </div>
        <aside class="pg-card"><span class="pg-pill">${esc(COPY.calculator.pill[lang])}</span><h2>${esc(COPY.calculator.card[lang])}</h2><ul class="pg-card-rows pg-numbered">${rows.join('')}</ul></aside>
      </div>
    </section>
    <section class="pg-flow pg-flow-calculator">
      <div class="container">${rest}</div>
    </section>`;
}

function inscriptionMain(lang, main) {
  const head = take(main, /<div class="ins-head">([\s\S]*?)<\/div>/, 'enrollment head')[1];
  const rest = main.slice(main.indexOf('</div>', main.indexOf('class="ins-head"')) + 6);
  return `    <section class="pg-hero pg-flow-hero pg-enroll-hero" aria-labelledby="pg-title">
      <div class="container pg-hero-grid">
        <div class="ins-head">
          ${trail(lang, COPY.inscription.trail[lang])}
          ${head.replace('<h1 ', '<h1 id="pg-title" class="pg-long" ').replace(/<span class="eyebrow"/, '<p class="eyebrow"').replace(/(<p class="eyebrow"[\s\S]*?<\/span>)<\/span>/, '$1</p>').replace(/<p (data-enroll-intro)/, '<p class="pg-lead" $1')}
        </div>
        <aside class="pg-enroll-steps">${steps(COPY.inscription.steps[lang])}</aside>
      </div>
    </section>
    <section class="pg-flow pg-flow-enroll">
      <div class="container ins-shell">${rest}</div>
    </section>`;
}

export async function renderFlow({ flow, lang, outDir, rootDir, homeMarkup }) {
  const { shell } = await import('./build-v4-pages.mjs');
  const name = lang === 'es' ? FLOWS[flow].es : FLOWS[flow].locale;
  // Spanish sources are the repository pages (the enrollment page is the V4
  // route page, which already carries the plan/billing preselection adapter);
  // other languages are the locale pages written earlier in this build.
  const source = lang === 'es' && flow !== 'inscription' ? join(rootDir, name) : join(outDir, lang === 'es' ? '' : lang, name);
  const base = lang === 'es' ? (flow === 'inscription' ? '/v4/' : '/') : `/${lang}/`;
  const markup = await readFile(source, 'utf8');
  const { main, after } = pieces(markup);
  const title = (markup.match(/<title>([^<|]+)/) || [])[1]?.trim() || COPY[flow].trail[lang];
  const description = (markup.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const fix = html => toV4(absolutize(html, base), lang);
  const body = { test: testMain, calculator: calculatorMain, inscription: inscriptionMain }[flow](lang, fix(main));
  const head = flow === 'inscription' ? `<link rel="stylesheet" href="/inscription.css?v=20260831-stepper">` : '';
  return shell({
    lang, key: flow, title, description, homeMarkup, head,
    headAfter: `<link rel="stylesheet" href="/v4/flows.css?v=${VERSION}">`,
    bodyClass: `pg-flow-page pg-flow-${flow}-page`,
    main: body,
    scripts: fix(after)
  });
}
