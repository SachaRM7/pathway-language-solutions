import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PRICING, VIDEO_TESTIMONIALS, WRITTEN_TESTIMONIALS } from '../v4/content.js';

const browser = process.env.AGENT_BROWSER_BIN || 'D:/Tools/agent-browser/node_modules/agent-browser/bin/agent-browser-win32-x64.exe';
const base = process.env.PATHWAY_PREVIEW_URL || 'http://127.0.0.1:4174/v4/';
const session = 'pathway-v4-continuation';
const output = resolve('tmp/v4-continuation');
await mkdir(output, { recursive: true });
let checks = 0;
const command = (...args) => {
  const raw = execFileSync('rtk', ['proxy', browser, '--session', session, '--json', ...args], { encoding: 'utf8', timeout: 45000, stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 8 * 1024 * 1024 });
  const result = JSON.parse(raw.slice(raw.indexOf('{')));
  assert(result.success, `${args[0]}: ${JSON.stringify(result.error)}`);
  return result.data;
};
const evaluate = source => command('eval', source).result;
const pass = (label, detail) => { checks++; console.log(`PASS ${label}: ${JSON.stringify(detail)}`); };
const capture = (name, selector) => {
  if (selector) evaluate(`(async () => { await document.fonts.ready; const section=document.querySelector(${JSON.stringify(selector)}); window.scrollTo({top:section.getBoundingClientRect().top+scrollY-parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')),behavior:'instant'}); await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))); return scrollY; })()`);
  command('screenshot', resolve(output, `${name}.png`));
};
const home = () => {
  command('open', base);
  evaluate('document.fonts.ready.then(() => true)');
};

home();
command('set', 'viewport', '1440', '1024');
for (const [name, selector] of [['08-testimonials', '#historias'], ['10-monthly', '#planes'], ['11-result', '#resultado'], ['12-faq', '#preguntas'], ['13-nclc', '#objetivo-nclc7'], ['14-crs', '#crs'], ['15-rounds', '#rondas-ircc'], ['16-commitment', '#compromiso'], ['17-final', '.final-cta-v4'], ['17-footer', '.footer-v4']]) capture(name, selector);
command('click', '[data-billing="cycle"]');
capture('10-cycle', '#planes');
if (process.argv.includes('--capture')) {
  command('set', 'viewport', '390', '844');
  command('screenshot', '--full', resolve(output, 'mobile-long.png'));
  process.exit(0);
}

assert.equal(VIDEO_TESTIMONIALS.length, 10);
assert.equal(WRITTEN_TESTIMONIALS.length, 16);
for (const entry of VIDEO_TESTIMONIALS) {
  await access(resolve('dist/client', entry.src.slice(1)));
  await access(resolve('dist/client', entry.poster.slice(1).split('?')[0]));
}
for (const plan of PRICING.plans) {
  assert.equal(plan.cycle.originalAmount, plan.monthly.amount * plan.cycle.months);
  assert.equal(plan.cycle.amount, Math.round(plan.cycle.originalAmount * .85 * 100) / 100);
  assert.equal(plan.cycle.saving, Math.round((plan.cycle.originalAmount - plan.cycle.amount) * 100) / 100);
}
pass('collections, media files and exact pricing arithmetic', { videos: 10, reviews: 16, cycles: PRICING.plans.map(plan => plan.cycle.amount) });

const heights = {};
for (const mode of ['monthly', 'cycle', 'monthly', 'cycle']) {
  command('click', `[data-billing="${mode}"]`);
  const state = evaluate(`({ selected: document.querySelector('[data-billing][aria-pressed="true"]').dataset.billing, height:document.querySelector('.pricing-grid').getBoundingClientRect().height, count:document.querySelectorAll('.price-card').length, hrefs:[...document.querySelectorAll('[data-chosen-plan]')].map(a=>a.getAttribute('href')), prices:[...document.querySelectorAll('.price-amount strong')].map(n=>n.textContent) })`);
  assert.equal(state.selected, mode);
  assert.equal(state.count, 3);
  assert(state.hrefs.every(href => href.startsWith('/v4/inscription.html?') && href.includes(mode === 'cycle' ? 'billing=Ciclo' : 'billing=Mensual')));
  heights[mode] = state.height;
  pass(`pricing ${mode}`, state);
}
assert.equal(heights.monthly, heights.cycle);
pass('no pricing layout shift', heights);

const viewerState = () => evaluate(`({open:document.querySelector('[data-story-viewer]').open, name:document.querySelector('[data-sv-name]').textContent, count:document.querySelector('[data-sv-count]').textContent, cards:document.querySelectorAll('.reel-card').length, quotes:document.querySelectorAll('.quote-track:not([aria-hidden]) .quote-card').length})`);
capture('08-testimonials', '#historias');
assert.equal(viewerState().cards, 10);
assert.equal(viewerState().quotes, 16);
command('click', '.reel-item:nth-child(1) .reel-card');
assert.equal(viewerState().open, true);
assert.equal(viewerState().name, 'Yazmin');
command('click', '[data-sv-next]');
assert.equal(viewerState().name, 'Devon');
command('click', '[data-sv-previous]');
command('click', '[data-sv-previous]');
assert.equal(viewerState().name, 'Elisa');
assert.equal(viewerState().count, '10 / 10');
pass('story viewer navigation and wrap', viewerState());
const media = evaluate(`new Promise(resolve=>{ const video=document.querySelector('[data-sv-video]'); const report=()=>resolve({paused:video.paused,ready:video.readyState,error:video.error?.message||null,duration:Number.isFinite(video.duration)?video.duration:null}); if(video.readyState>2)report();else {video.addEventListener('playing',report,{once:true});video.addEventListener('error',report,{once:true});setTimeout(report,10000);} })`);
assert.equal(media.error, null);
pass('actual video playback', media);
command('click', '[data-sv-close]');
assert.equal(viewerState().open, false);

home();
assert.equal(evaluate('document.querySelectorAll("[data-faq] details[open]").length'), 1);
assert(evaluate('document.querySelector("[data-faq] details").open'));
command('focus', '[data-faq] details:nth-child(2) summary');
command('press', 'Enter');
assert(evaluate('document.querySelector("[data-faq] details:nth-child(2)").open'));
assert.equal(evaluate('document.querySelectorAll("[data-faq] details[open]").length'), 1);
command('focus', '[data-faq] details:nth-child(3) summary');
command('press', 'Space');
assert(evaluate('document.querySelector("[data-faq] details:nth-child(3)").open'));
assert.equal(evaluate('document.querySelectorAll("[data-faq] details[open]").length'), 1);
pass('FAQ: first open, exclusivity, Enter and Space', true);

const links = evaluate(`[...document.querySelectorAll('a[href]')].map(a=>({raw:a.getAttribute('href'),url:a.href}))`);
for (const { raw, url } of links) {
  const target = new URL(url);
  if (target.origin !== new URL(base).origin) continue;
  if (target.pathname.startsWith('/assets/')) continue;
  assert(target.pathname.startsWith('/v4/'), `Escaped V4: ${raw}`);
  let file = resolve('dist/client', target.pathname.slice(1));
  if (target.pathname.endsWith('/')) file = resolve(file, 'index.html');
  await access(file);
  if (target.hash) {
    const markup = await readFile(file, 'utf8');
    assert(markup.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`), `Missing anchor: ${raw}`);
  }
}
pass('all home internal routes and anchors exist within V4', links.length);
assert(evaluate(`document.querySelector('a[href="mailto:contacto@pathway-languages.com"]') !== null`));
assert(evaluate(`[...document.querySelectorAll('a[href="https://wa.me/51989887516"]')].some(a=>a.textContent.includes('+51 989 887 516'))`));
pass('footer exact email and WhatsApp', true);

for (const plan of PRICING.plans) {
  for (const billing of ['Mensual', 'Ciclo']) {
    command('open', `${base}inscription.html?${new URLSearchParams({ plan: plan.name, billing })}`);
    const selected = evaluate(`({plan:document.querySelector('input[name="plan"]:checked')?.value,billing:document.querySelector('input[name="billing"]:checked')?.value,form:!!document.querySelector('[data-enroll-form]')})`);
    assert.deepEqual(selected, { plan: plan.name, billing, form: true });
    pass('real enrollment preselection', selected);
  }
}
home();
const rounds = evaluate(`new Promise(resolve=>{ const p=document.querySelector('[data-ircc-rounds]');const done=()=>resolve({mode:p.dataset.irccReady,score:[...p.querySelectorAll('[data-round-score]')].map(x=>x.textContent),updated:p.querySelector('[data-ircc-updated]').textContent});if(p.dataset.irccReady)done();else {const o=new MutationObserver(()=>{if(p.dataset.irccReady){o.disconnect();done();}});o.observe(p,{attributes:true});setTimeout(done,18000);} })`);
assert(['live', 'snapshot'].includes(rounds.mode));
assert(rounds.score.every(value => /^\d+$/.test(value)));
assert(rounds.updated.includes('2026'));
pass('verified IRCC values and explicit update', rounds);

for (const width of [1440, 1280, 1024, 768, 390, 360, 320]) {
  command('set', 'viewport', String(width), '900');
  const state = evaluate(`({overflow:document.documentElement.scrollWidth-innerWidth,bad:[...document.querySelectorAll('.v4-section *, .footer-v4 *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1)&&!e.closest('.result-scene')}).map(e=>e.className).slice(0,10)})`);
  assert.equal(state.overflow, 0, `Overflow at ${width}`);
  assert.deepEqual(state.bad, [], `Escaping content at ${width}`);
  pass(`responsive width ${width}`, state);
}
command('set', 'viewport', '390', '844');
for (const [name, selector] of [['08-mobile', '#historias'], ['10-mobile', '#planes'], ['11-mobile', '#resultado'], ['12-mobile', '#preguntas'], ['13-mobile', '#objetivo-nclc7'], ['14-mobile', '#crs'], ['15-mobile', '#rondas-ircc'], ['16-mobile', '#compromiso'], ['17-mobile', '.final-cta-v4'], ['footer-mobile', '.footer-v4']]) capture(name, selector);
command('screenshot', '--full', resolve(output, 'mobile-long.png'));
command('set', 'viewport', '1440', '1024');
command('screenshot', '--full', resolve(output, 'desktop-long.png'));
console.log(`Completed ${checks} continuation checks. Screenshots: ${output}`);
