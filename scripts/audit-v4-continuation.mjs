import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const browser = process.env.AGENT_BROWSER_BIN || 'D:/Tools/agent-browser/node_modules/agent-browser/bin/agent-browser-win32-x64.exe';
const base = process.env.PATHWAY_PREVIEW_URL || 'http://127.0.0.1:4174/v4/';
const session = 'pathway-v4-continuation';
function command(args, input) {
  const raw = execFileSync('rtk', ['proxy', browser, '--session', session, '--json', ...args], { encoding: 'utf8', input, timeout: 45000, stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 8 * 1024 * 1024 });
  const response = JSON.parse(raw.slice(raw.indexOf('{')));
  assert(response.success, JSON.stringify(response));
  return response.data;
}
const evaluate = source => command(['eval', '--stdin'], source).result;
command(['open', base]);
command(['set', 'viewport', '1440', '1024']);
evaluate('document.fonts.ready.then(() => true)');

const ids = evaluate(`(() => {const all=[...document.querySelectorAll('[id]')].map(e=>e.id);return all.filter((id,i)=>all.indexOf(id)!==i)})()`);
assert.deepEqual(ids, []);
console.log('PASS no duplicate IDs');
const current = (await readFile('v4/index.html', 'utf8')).split('    <section class="v4-section stories-v4"')[0];
const firstPartHash = createHash('sha256').update(current.slice(current.indexOf('  <main')).trim().replaceAll('\r', '')).digest('hex');
assert.equal(firstPartHash, '218299f22e8d90376c43fcdc052af46cc6c903711799c82d0b811342cf47eb99');
console.log('PASS original first seven sections preserved byte-for-byte');

for (let index = 0; index < 5; index++) {
  command(['click', `[data-stage="${index}"]`]);
  command(['hover', '[data-program-link]']);
  const state = evaluate(`({level:document.querySelector('[data-program-count]').textContent,bg:getComputedStyle(document.querySelector('[data-program-link]')).backgroundColor,href:document.querySelector('[data-program-link]').getAttribute('href')})`);
  assert.equal(state.level, `${index + 1}/5`);
  assert.equal(state.bg, 'rgb(255, 250, 242)');
  assert(state.href.startsWith('/v4/'));
}
console.log('PASS five level states retain light CTA');
evaluate('document.querySelector("#profesores").scrollIntoView({behavior:"instant"})');
const swaps = evaluate(`new Promise(resolve => {const stage=document.querySelector('[data-teacher-stage]');const samples=[{front:stage.dataset.front,time:performance.now()}];const observer=new MutationObserver(()=>{if(samples.at(-1).front!==stage.dataset.front)samples.push({front:stage.dataset.front,time:performance.now()});if(samples.length===3){observer.disconnect();resolve(samples)}});observer.observe(stage,{attributes:true,attributeFilter:['data-front']});setTimeout(()=>{observer.disconnect();resolve(samples)},6500);})`);
assert.equal(swaps.length, 3);
assert(Math.abs(swaps[2].time - swaps[1].time - 2500) < 180);
console.log('PASS 2.5 second alternating teacher cards', JSON.stringify(swaps));
command(['set', 'media', 'light', 'reduced-motion']);
const reduced = evaluate(`({matches:matchMedia('(prefers-reduced-motion: reduce)').matches,cards:[...document.querySelectorAll('.teacher-card')].map(e=>({width:e.getBoundingClientRect().width,transform:getComputedStyle(e).transform})),scroll:getComputedStyle(document.documentElement).scrollBehavior})`);
assert(reduced.matches);
assert(reduced.cards.every(e => e.transform === 'none'));
assert.equal(reduced.cards[0].width, reduced.cards[1].width);
assert.equal(reduced.scroll, 'auto');
console.log('PASS reduced motion and equal portraits');
command(['set', 'media', 'light']);

for (const mode of ['snapshot', 'unavailable']) {
  const state = evaluate(`(async()=>{const original=window.fetch;window.fetch=(url,...rest)=>${mode === 'unavailable' ? "Promise.reject(new TypeError('Simulated offline'))" : "String(url).includes('canada.ca')?Promise.reject(new TypeError('Simulated IRCC failure')):original(url,...rest)"};const panel=document.querySelector('[data-ircc-rounds]');await panel.__irccRoundsPromise;delete panel.__irccRoundsPromise;window.PathwayIrccRounds.resetIrccRoundsCache();await window.PathwayIrccRounds.setupIrccRounds(panel);window.fetch=original;return {mode:panel.dataset.irccReady,score:[...panel.querySelectorAll('[data-round-score]')].map(e=>e.textContent),message:panel.querySelector('[data-ircc-status]').textContent,updated:panel.querySelector('[data-ircc-updated]').textContent}})()`);
  assert.equal(state.mode, mode);
  assert(state.message.includes('no disponibles'));
  if (mode === 'unavailable') assert(state.score.every(value => value === ''));
  else assert(state.updated.includes('Copia verificada'));
  console.log(`PASS IRCC ${mode}`, JSON.stringify(state));
}
command(['open', base]);
const axe = await readFile(process.env.AXE_CORE_PATH || 'D:/Tools/tmp/vaultscaffold/node_modules/axe-core/axe.min.js', 'utf8');
for (const width of [1440, 390]) {
  command(['set', 'viewport', String(width), '900']);
  for (const mode of ['monthly', 'cycle']) {
    command(['click', `[data-billing="${mode}"]`]);
    const result = evaluate(`(async()=>{${axe};const result=await axe.run({include:[['.v4-section'],['.final-cta-v4'],['.footer-v4']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return {violations:result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,reason:n.failureSummary}))})),incomplete:result.incomplete.map(v=>v.id),passes:result.passes.length}})()`);
    console.log(`AXE ${width} ${mode}`, JSON.stringify(result));
    assert.equal(result.violations.length, 0);
  }
}
console.log('PASS accessibility audit desktop/mobile and both price states');

for (const width of [390, 320]) {
  command(['set', 'viewport', String(width), '844']);
  const heights = [];
  for (const mode of ['monthly', 'cycle']) {
    command(['click', `[data-billing="${mode}"]`]);
    const layout = evaluate(`({overflow:document.documentElement.scrollWidth-innerWidth,height:document.querySelector('.pricing-grid').getBoundingClientRect().height, overlap:[...document.querySelectorAll('.price-card')].some(card=>card.querySelector('.price-block').getBoundingClientRect().bottom>card.querySelector('.price-includes').getBoundingClientRect().top+1)})`);
    assert.equal(layout.overflow, 0);
    assert.equal(layout.overlap, false);
    heights.push(layout.height);
    console.log(`PASS mobile ${width} ${mode}`, JSON.stringify(layout));
  }
  assert.equal(heights[0], heights[1]);
}
command(['set', 'viewport', '390', '844']);
evaluate('document.querySelector(".pricing-grid").scrollIntoView({behavior:"instant"})');
command(['screenshot', 'tmp/v4-continuation/pricing-cycle-mobile.png']);
command(['focus', '.menu-toggle']);
command(['press', 'Enter']);
assert.equal(evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'), 'true');
command(['press', 'Escape']);
assert.equal(evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded")'), 'false');
console.log('PASS fixed mobile menu, Enter and Escape');
console.log('BROWSER ERRORS', JSON.stringify(command(['errors'])));
command(['set', 'viewport', '1440', '1024']);
command(['open', base]);
const failedVideo = evaluate(`new Promise(resolve=>{const v=document.querySelector('[data-testimony-video]');v.addEventListener('error',()=>requestAnimationFrame(()=>resolve({visible:!document.querySelector('[data-video-error]').hidden,message:document.querySelector('[data-video-error]').textContent})),{once:true});v.src='/v4/intentionally-missing-verification-video.mp4';v.load();setTimeout(()=>resolve({visible:false,message:'timeout'}),8000);})`);
assert(failedVideo.visible);
console.log('PASS video failure has a visible original-file recovery link', JSON.stringify(failedVideo));
command(['open', base]);
