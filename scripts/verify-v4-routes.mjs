#!/usr/bin/env node
// Verification for scripts/build-v4-routes.mjs.
//
// Builds the V4 routes into a throwaway directory and checks: link rebasing
// stays inside /v4, the root form/fields and prices are preserved, legal pages
// reach the real terms, the rate adapter preselects plan/billing and adds no
// submission, and no secrets leak. Exits non-zero on any failure.

import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { access, cp, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { buildV4Routes, resolveEnrollPreferences, rebaseHtml, buildAdapterSource, PLAN_VALUES, BILLING_VALUES } from './build-v4-routes.mjs';
import { PRICING } from '../v4/content.js';
import { buildV4Programs } from './build-v4-programs.mjs';
import { homeTail, HOME_TAIL_MARKER } from './home-tail.mjs';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let checks = 0;
const ok = (name) => { checks += 1; console.log(`PASS ${name}`); };

const outBase = await mkdtemp(join(tmpdir(), 'v4-routes-verify-'));
try {
  // Mirror production: the v4 tree is copied first, then these routes overwrite
  // the placeholders. Seeding it lets us assert every local ref resolves.
  await cp(join(rootDir, 'v4'), join(outBase, 'v4'), { recursive: true });
  // As in build.mjs, the homes receive their shared tail (stories to footer),
  // which the program pages copy their header and footer from.
  for (const lang of ['es', 'fr', 'en', 'de']) {
    const home = join(outBase, 'v4', lang === 'es' ? '' : lang, 'index.html');
    await writeFile(home, (await readFile(home, 'utf8')).replace(HOME_TAIL_MARKER, homeTail(lang)), 'utf8');
  }
  const result = await buildV4Routes({ rootDir, outDir: outBase });
  // Production then generates the program pages over their placeholders.
  await buildV4Programs({ rootDir, outDir: outBase });
  const v4 = result.v4Dir;
  const read = (name) => readFile(join(v4, name), 'utf8');

  const names = result.files.map((file) => file.name);
  for (const expected of [
    'condiciones.html', 'privacidad.html', 'inscription.html', 'inscription-v4.js',
    'inscription.js', 'inscription.css', 'theme.css', 'guide.css',
    'conditions-nclc7.css', 'pathway-page-shell.css', 'site-config.js', 'pathway-mark.svg'
  ]) assert(names.includes(expected), `missing generated file: ${expected}`);
  ok('generates all route pages, adapter and required assets');

  const condiciones = await read('condiciones.html');
  const privacidad = await read('privacidad.html');
  const inscription = await read('inscription.html');
  const adapter = await read('inscription-v4.js');
  assert.notEqual(condiciones, privacidad);
  ok('route pages keep their distinct source content');

  // Navigation oracle: every internal link must resolve under /v4, except
  // public media under /assets/ which is intentionally shared at the root.
  const LOCAL_NAV = /(?:\shref=|\ssrc=)"([^"]*)"/gi;
  for (const [label, html] of [['condiciones', condiciones], ['privacidad', privacidad], ['inscription', inscription]]) {
    for (const match of html.matchAll(LOCAL_NAV)) {
      const ref = match[1].trim();
      if (!ref) continue;
      if (/^(?:#|mailto:|tel:|data:)/i.test(ref)) continue;
      if (/^https?:\/\//i.test(ref)) {
        if (/^https?:\/\/pathway-languages\.com\//i.test(ref)) {
          assert(
            ref.startsWith('https://pathway-languages.com/v4/') || ref.includes('/assets/'),
            `${label}: site URL escapes /v4: ${ref}`
          );
        }
        continue;
      }
      if (ref.startsWith('/')) {
        assert(
          ref.startsWith('/v4/') || ref === '/v4' || ref.startsWith('/assets/'),
          `${label}: root-relative link escapes /v4: ${ref}`
        );
        continue;
      }
      assert.fail(`${label}: un-rebased local reference: ${ref}`);
    }
  }
  ok('every local link resolves under /v4, with public /assets/ shared at the root');

  // Every local reference must resolve to a real file in the served tree
  // (placeholder pages under /v4 resolve too, since they are part of the tree).
  for (const [label, html] of [['condiciones', condiciones], ['privacidad', privacidad], ['inscription', inscription]]) {
    for (const match of html.matchAll(LOCAL_NAV)) {
      const ref = match[1].trim().split(/[?#]/)[0];
      if (!ref || /^(?:#|mailto:|tel:|data:)/i.test(ref)) continue;
      let path;
      if (/^https?:\/\//i.test(ref)) {
        if (!/^https?:\/\/pathway-languages\.com\//i.test(ref)) continue;
        path = join(outBase, new URL(ref).pathname);
      } else if (ref.startsWith('/')) {
        path = join(outBase, ref);
      } else {
        path = join(v4, ref);
      }
      const info = await stat(path).catch(() => null);
      assert(info && (info.isFile() || info.isDirectory()), `${label}: reference does not resolve: ${ref}`);
    }
  }
  ok('every local reference resolves to a real file in the built tree');

  // A raw root-relative navigation link in the source (e.g. /programas/...) must
  // be rebased; only /assets/ and already-/v4 paths may keep a leading slash.
  const navProbe = rebaseHtml('<nav><a href="/programas/a2/">A2</a><a href="/test-placement.html">t</a><a href="/assets/videos/x.mp4">v</a><a href="/v4/existing.html">e</a><a href="/">home</a></nav>');
  assert(navProbe.includes('href="/v4/programas/a2/"'), 'root-relative /programas must be rebased into /v4');
  assert(navProbe.includes('href="/v4/test-placement.html"'), 'root-relative page must be rebased into /v4');
  assert(navProbe.includes('href="/assets/videos/x.mp4"'), 'public /assets/ media must stay at the root');
  assert(navProbe.includes('href="/v4/existing.html"'), 'already /v4 path must be left alone');
  assert(navProbe.includes('href="/v4/"'), 'root link must rebase to /v4/');
  ok('root-relative navigation rebases into /v4 while public /assets/ stays at the root');

  for (const html of [condiciones, privacidad, inscription]) {
    assert(!html.includes('index-v2.html'), 'index-v2.html leaked into generated HTML');
    assert(!/(?:\shref=)"(?:condiciones|privacidad|inscription|test-placement)\.html"/.test(html), 'root page link leaked');
  }
  ok('root page filenames are fully rebased to /v4');

  assert(condiciones.includes('/v4/test-placement.html'), 'conditions CTA must point at the V4 evaluation');
  for (const id of ['objetivo', 'nivel-inicial', 'proyeccion-b1', 'evaluacion-b2', 'consolidacion', 'requisitos', 'continuidad', 'exclusiones']) {
    assert(condiciones.includes(`id="${id}"`), `conditions page lost real terms section #${id}`);
  }
  assert(condiciones.includes('4 meses'), 'conditions page must keep the real consolidation term');
  assert(condiciones.includes('id="compromiso-nclc7"'), 'homepage CTA anchor #compromiso-nclc7 must resolve on the terms page');
  assert(condiciones.indexOf('id="compromiso-nclc7"') < condiciones.indexOf('id="objetivo"'), 'anchor must land on the heading');
  ok('conditions page carries the full real terms and a V4 evaluation CTA');

  assert(privacidad.includes('/v4/condiciones.html'), 'privacy footer must link the real Spanish terms');
  assert(!privacidad.includes('href="/v4/conditions-nclc7.html"'), 'privacy must not link the conditions placeholder');
  ok('privacy page legal links resolve to the real terms page within /v4');

  const sourceInscription = await readFile(join(rootDir, 'inscription.html'), 'utf8');
  const collect = (html, pattern) => [...html.matchAll(pattern)].map((m) => m[1]).sort();
  assert.deepEqual(collect(inscription, /name="([^"]+)"/g), collect(sourceInscription, /name="([^"]+)"/g), 'form field set changed');
  assert.deepEqual(collect(inscription, /<input[^>]*type="([^"]+)"/g), collect(sourceInscription, /<input[^>]*type="([^"]+)"/g), 'input types changed');
  assert.deepEqual(collect(inscription, /value="([^"]+)"/g), collect(sourceInscription, /value="([^"]+)"/g), 'radio/option values changed');
  ok('root form fields, input types and values are preserved exactly');

  assert(inscription.includes('/v4/inscription-v4.js'), 'adapter script not referenced');
  assert(inscription.indexOf('/v4/inscription-v4.js') < inscription.indexOf('inscription.js?v='), 'adapter must load before the form script');
  const formScriptVersion = (sourceInscription.match(/src="inscription\.js\?v=([^"]+)"/) || [])[1];
  assert(formScriptVersion && inscription.includes(`src="/v4/inscription.js?v=${formScriptVersion}"`), 'root form script must be rebased and kept');
  assert(!/action=|method="post"/i.test(inscription), 'no live form submission should be added');
  assert(!/fetch\(|XMLHttpRequest|api\.hsforms/i.test(adapter), 'adapter must not submit anywhere');
  assert(adapter.includes("'pathwayV4Selection'"), 'adapter must read the continuation session key pathwayV4Selection');
  ok('adapter is injected ahead of the form script and adds no submission');

  // Every asset the copied CSS references through url() must ship next to it.
  const CSS_FILES = ['theme.css', 'guide.css', 'conditions-nclc7.css', 'pathway-page-shell.css', 'inscription.css'];
  for (const cssFile of CSS_FILES) {
    const css = await read(cssFile);
    for (const match of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) {
      const raw = match[2].trim();
      if (/^(?:data:|https?:|\/\/|#|%)/i.test(raw)) continue;
      const referenced = raw.split(/[?#]/)[0].replace(/^\.\//, '');
      const path = referenced.startsWith('/') ? join(outBase, referenced) : join(v4, referenced);
      await access(path).then(() => {}, () => assert.fail(`${cssFile}: referenced resource missing: ${raw}`));
    }
  }
  ok('all CSS-referenced resources exist next to the copied stylesheets');

  const generated = [condiciones, privacidad, inscription, adapter];
  for (const html of generated) {
    assert(!/api[_-]?key/i.test(html), 'possible api key');
    assert(!/\bsecret\b/i.test(html), 'possible secret');
    assert(!/AKIA[0-9A-Z]{16}|sk_live_|Bearer\s+[A-Za-z0-9._-]{12,}|password\s*[:=]/i.test(html), 'possible credential');
  }
  const siteConfig = await read('site-config.js');
  assert(/leadWebhook:\s*''/.test(siteConfig), 'lead webhook must remain empty (no live submission)');
  for (const amount of ['185 CAD/mes', '277,50 CAD/mes', '370 CAD/mes', '462,50 CAD/mes', '555 CAD/mes', '15 CAD']) {
    assert(inscription.includes(amount), `price term changed or missing: ${amount}`);
  }
  ok('no secrets and no new commercial terms (prices unchanged)');

  // --- resolver + rebase unit tests ---------------------------------------
  const r = (search, stored) => resolveEnrollPreferences(search, stored);
  assert.deepEqual(r('?plan=Acelerado&billing=Ciclo', null), { plan: 'Acelerado', hours: 4, billing: 'Ciclo' });
  assert.deepEqual(r('?plan=esencial&billing=mensual', null), { plan: 'Esencial', hours: 2, billing: 'Mensual' });
  assert.deepEqual(r('', { plan: 'Intensivo', billing: 'Ciclo' }), { plan: 'Intensivo', hours: 6, billing: 'Ciclo' });
  assert.deepEqual(r('?plan=Intensivo', { plan: 'Esencial', billing: 'Mensual' }), { plan: 'Intensivo', hours: 6, billing: 'Mensual' });
  assert.deepEqual(r('?plan=bogus&billing=nope', { plan: 'Acelerado', billing: 'Ciclo' }), { plan: 'Acelerado', hours: 4, billing: 'Ciclo' });
  assert.deepEqual(r('', null), { plan: null, hours: null, billing: null });
  assert.deepEqual(r('?plan=INTENSIVO&billing=cycle', null), { plan: 'Intensivo', hours: 6, billing: 'Ciclo' });
  // Hours must belong to the plan (2 · 3–4 · 5–6); otherwise the plan's usual hours apply.
  assert.deepEqual(r('?plan=Acelerado&hours=3', null), { plan: 'Acelerado', hours: 3, billing: null });
  assert.deepEqual(r('?plan=Acelerado&hours=6', null), { plan: 'Acelerado', hours: 4, billing: null });
  assert.deepEqual(r('?plan=Intensivo&hours=5&billing=Mensual', null), { plan: 'Intensivo', hours: 5, billing: 'Mensual' });
  ok('resolver: query precedence, session fallback, canonicalization, ignores junk');

  assert(buildAdapterSource().includes(resolveEnrollPreferences.toString()), 'adapter must embed the tested resolver');
  ok('shipped adapter embeds the exact tested resolver');

  // The adapter's allowed values must match the real plan/billing source so the
  // continuation pricing links and the form radios can never drift apart.
  assert.deepEqual([...PLAN_VALUES].sort(), PRICING.plans.map((plan) => plan.enrollmentRhythmId).sort(), 'plan values must match content.js');
  assert.deepEqual([...BILLING_VALUES].sort(), PRICING.billingOptions.map((option) => option.id).sort(), 'billing values must match content.js');
  ok('adapter plan/billing values match the v4/content.js pricing source');

  assert.equal(rebaseHtml('<a href="condiciones.html">x</a>'), '<a href="/v4/condiciones.html">x</a>');
  assert.equal(rebaseHtml('<a href="index-v2.html">x</a>'), '<a href="/v4/">x</a>');
  assert.equal(rebaseHtml('<a href="#top">x</a>'), '<a href="#top">x</a>');
  assert.equal(rebaseHtml('<a href="https://example.com/x">x</a>'), '<a href="https://example.com/x">x</a>');
  assert.equal(rebaseHtml('<a href="https://pathway-languages.com/privacidad.html">x</a>'), '<a href="https://pathway-languages.com/v4/privacidad.html">x</a>');
  assert.equal(rebaseHtml('<img src="/assets/x.png">'), '<img src="/assets/x.png">');
  assert.equal(rebaseHtml('<img src="/already/rooted.png">'), '<img src="/v4/already/rooted.png">');
  ok('rebaseHtml rewrites local/site/root-relative refs, keeps /assets/ and externals');

  // --- adapter behavior in a fake DOM -------------------------------------
  function makeInput(name, value, h) {
    return { tagName: 'INPUT', type: 'radio', name, value, dataset: h ? { h: String(h) } : {}, checked: false, events: [], dispatchEvent(event) { this.events.push(event.type); return true; } };
  }
  function runAdapter({ search, stored }) {
    const all = [
      makeInput('plan', 'Esencial', 2), makeInput('plan', 'Acelerado', 3), makeInput('plan', 'Acelerado', 4),
      makeInput('plan', 'Intensivo', 5), makeInput('plan', 'Intensivo', 6),
      makeInput('billing', 'Mensual'), makeInput('billing', 'Ciclo')
    ];
    const form = { querySelectorAll(selector) { const name = (selector.match(/name="([^"]+)"/) || [])[1]; return all.filter((input) => input.name === name); } };
    const store = new Map();
    if (stored) store.set('pathwayV4Selection', JSON.stringify(stored));
    runInNewContext(adapter, {
      document: { readyState: 'complete', querySelector: (selector) => (selector === '[data-enroll-form]' ? form : null), addEventListener: () => {} },
      location: { search },
      sessionStorage: { getItem: (key) => (store.has(key) ? store.get(key) : null), setItem: (key, value) => store.set(key, value) },
      Event: class Event { constructor(type, options) { this.type = type; this.bubbles = !!(options && options.bubbles); } },
      URLSearchParams,
      console
    });
    return { all, store };
  }

  const queryRun = runAdapter({ search: '?plan=Intensivo&billing=Ciclo', stored: null });
  assert.deepEqual(queryRun.all.filter((i) => i.checked).map((i) => i.value).sort(), ['Ciclo', 'Intensivo']);
  assert.deepEqual(queryRun.all.find((i) => i.value === 'Intensivo' && i.dataset.h === '6').events, ['input', 'change']);
  assert.deepEqual(JSON.parse(queryRun.store.get('pathwayV4Selection')), { plan: 'Intensivo', hours: 6, billing: 'Ciclo' });

  const sessionRun = runAdapter({ search: '', stored: { plan: 'Esencial', billing: 'Mensual' } });
  assert.deepEqual(sessionRun.all.filter((i) => i.checked).map((i) => i.value).sort(), ['Esencial', 'Mensual']);

  const mergeRun = runAdapter({ search: '?plan=Acelerado', stored: { plan: 'Esencial', billing: 'Ciclo' } });
  assert.deepEqual(mergeRun.all.filter((i) => i.checked).map((i) => i.value).sort(), ['Acelerado', 'Ciclo']);

  const junkRun = runAdapter({ search: '?plan=zzz&billing=qqq', stored: null });
  assert.equal(junkRun.all.filter((i) => i.checked).length, 0);

  const exactRun = runAdapter({ search: '?plan=Acelerado', stored: null });
  // Without ?hours=, Acelerado selects its usual 4 h card, not the 3 h one.
  assert.equal(exactRun.all.find((i) => i.value === 'Acelerado' && i.dataset.h === '4').checked, true);
  assert.equal(exactRun.all.find((i) => i.value === 'Acelerado' && i.dataset.h === '3').checked, false);
  const hoursRun = runAdapter({ search: '?plan=Acelerado&hours=3', stored: null });
  assert.equal(hoursRun.all.find((i) => i.value === 'Acelerado' && i.dataset.h === '3').checked, true);
  ok('adapter preselects, fires input+change, merges query over session, and matches exact values');

  // --- visible route test: serve the built output over HTTP -----------------
  // Drives the adapter against the real radios parsed from the served HTML,
  // proving the route is reachable and the flow web-serves end to end.
  const requests = { page: 0, adapter: 0 };
  const server = createServer(async (request, response) => {
    try {
      const relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const file = resolve(outBase, `.${relative}`);
      if (file !== outBase && !file.startsWith(outBase + sep)) { response.writeHead(403).end(); return; }
      if (relative === '/v4/inscription.html') requests.page += 1;
      else if (relative === '/v4/inscription-v4.js') requests.adapter += 1;
      const info = await stat(file).catch(() => null);
      const target = info && info.isDirectory() ? join(file, 'index.html') : file;
      const body = await readFile(target);
      response.writeHead(200, { 'Content-Type': extname(target) === '.html' ? 'text/html; charset=utf-8' : 'text/javascript; charset=utf-8' });
      response.end(body);
    } catch (_) { response.writeHead(404).end('not found'); }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const pageResponse = await fetch(`${origin}/v4/inscription.html?plan=Intensivo&billing=Ciclo`);
    assert.equal(pageResponse.status, 200, 'served inscription page must be reachable');
    const servedHtml = await pageResponse.text();
    assert(servedHtml.includes('data-enroll-form') && servedHtml.includes('/v4/inscription-v4.js'), 'served page must contain the real form and adapter');

    // A rebased navigation link on the served page must resolve over HTTP.
    const navHref = (servedHtml.match(/href="(\/v4\/[^"?#]+)"/) || [])[1];
    assert(navHref && navHref.startsWith('/v4/'), 'served page must expose a /v4 navigation link');
    assert.equal((await fetch(`${origin}${navHref}`)).status, 200, `rebased nav target must serve: ${navHref}`);
    assert.equal((await fetch(`${origin}/v4/programas/a2/`)).status, 200, 'rebased /v4/programas target must serve');

    const radioValues = (name) => [...servedHtml.matchAll(new RegExp(`<input[^>]*name="${name}"[^>]*value="([^"]+)"`, 'g'))].map((m) => m[1]);
    const planValues = radioValues('plan');
    const billingValues = radioValues('billing');
    assert(planValues.includes('Intensivo') && planValues.includes('Esencial'), 'serve must expose the real plan radios');
    assert(billingValues.includes('Ciclo') && billingValues.includes('Mensual'), 'serve must expose the real billing radios');

    const adapterResponse = await fetch(`${origin}/v4/inscription-v4.js`);
    assert.equal(adapterResponse.status, 200, 'served adapter must be reachable');
    const servedAdapter = await adapterResponse.text();

    const simulate = ({ search, selection }) => {
      const inputs = [
        ...planValues.map((value) => makeInput('plan', value)),
        ...billingValues.map((value) => makeInput('billing', value))
      ];
      const liveForm = { querySelectorAll: (selector) => { const name = (selector.match(/name="([^"]+)"/) || [])[1]; return inputs.filter((input) => input.name === name); } };
      const store = new Map();
      if (selection) store.set('pathwayV4Selection', JSON.stringify(selection));
      runInNewContext(servedAdapter, {
        document: { readyState: 'complete', querySelector: (selector) => (selector === '[data-enroll-form]' ? liveForm : null), addEventListener: () => {} },
        location: { search },
        sessionStorage: { getItem: (key) => (store.has(key) ? store.get(key) : null), setItem: (key, value) => store.set(key, value) },
        Event: class Event { constructor(type, options) { this.type = type; this.bubbles = !!(options && options.bubbles); } },
        URLSearchParams,
        console
      });
      return { inputs, store };
    };

    const queryLive = simulate({ search: '?plan=Intensivo&billing=Ciclo', selection: null });
    assert.deepEqual(queryLive.inputs.filter((i) => i.checked).map((i) => i.value).sort(), ['Ciclo', 'Intensivo']);
    assert.deepEqual(JSON.parse(queryLive.store.get('pathwayV4Selection')), { plan: 'Intensivo', hours: 6, billing: 'Ciclo' });

    const sessionLive = simulate({ search: '', selection: { plan: 'Esencial', billing: 'Mensual' } });
    assert.deepEqual(sessionLive.inputs.filter((i) => i.checked).map((i) => i.value).sort(), ['Esencial', 'Mensual']);

    assert(requests.page >= 1 && requests.adapter >= 1, 'server must have served the route page and adapter');
    ok('visible route test: served /v4/inscription.html + adapter preselect the chosen rate');
  } finally {
    await new Promise((done) => server.close(done));
  }
} finally {
  await rm(outBase, { recursive: true, force: true });
}

console.log(`\nAll ${checks} V4 route checks passed.`);
