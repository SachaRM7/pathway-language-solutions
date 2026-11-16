// Run against a local checkout: python -m http.server 4173, then node scripts/verify-campus-motion.cjs.
// Requires Playwright; backend requests are replaced with fixtures, never sent to production.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');
const { fixture } = require('../tests/campus/fixture.cjs');
const output = process.env.MOTION_QA_DIR || '/tmp/pathway-motion-qa';
(async () => {
 await fs.mkdir(output, { recursive: true });
 const browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}), args:['--no-sandbox']});
 try {
  for (const width of [1440, 390, 360]) {
   const page = await browser.newPage({viewport:{width,height:1000},colorScheme:width===360?'dark':'light'});
   const errors=[]; page.on('pageerror',e=>errors.push(e.message));
   await fixture(page);
   await page.locator('[data-roll="today-xp"] .motion-sr').waitFor();
   assert.equal(await page.locator('[data-roll="today-xp"] .motion-sr').textContent(),'30');
   await page.getByRole('button',{name:'Abrir búsqueda'}).click();
   await page.locator('#campusSearch').fill('présent');
   await page.waitForFunction(()=>+document.querySelector('.seek').style.getPropertyValue('--seek-say')===1);
   assert.equal(await page.locator('#searchSlot [data-start]').count(),1);
   await page.locator('#campusSearch').press('ArrowDown');
   assert.equal(await page.evaluate(()=>document.activeElement.dataset.start),'fixture-u1');
   await page.locator('#searchSlot button').first().press('Escape');
   assert.equal(await page.locator('#campusSearch').inputValue(),'');
   assert.equal(await page.getByRole('button',{name:'Abrir búsqueda'}).evaluate(e=>e===document.activeElement),true);
   await page.getByRole('button',{name:'Abrir búsqueda'}).click();
   await page.locator('#campusSearch').fill('<img src=x onerror=alert(1)>');
   assert.equal(await page.locator('#searchSlot img').count(),0);
   assert.match(await page.locator('#searchSlot').textContent(),/Sin resultados/);
   await page.locator('#campusSearch').fill('être');
   await page.waitForFunction(()=>+document.querySelector('.seek').style.getPropertyValue('--seek-say')===1);
   await page.screenshot({path:`${output}/search-${width}.png`});
   const box=await page.locator('#searchSlot .menu').boundingBox();
   assert(box.x>=15 && box.x+box.width<=width-15, `Search overflow at ${width}: ${JSON.stringify(box)}`);
   await page.locator('#campusSearch').press('Escape');
   await page.evaluate(()=>window.__motionTest.earn());
   await page.waitForFunction(()=>document.querySelector('.motion-check path').style.strokeDashoffset==='0');
   await page.waitForFunction(()=>[...document.querySelectorAll('.roll-strip')].every(e=>!e.style.filter));
   assert.equal(await page.locator('[data-roll="today-xp"] .motion-sr').textContent(),'50');
   assert.equal(await page.locator('[data-roll="total-xp"] .motion-sr').textContent(),'1.315');
   await page.screenshot({path:`${output}/home-${width}.png`});
   await page.evaluate(()=>{location.hash='repasar'});
   await page.locator('#flash').waitFor();
   assert.equal(await page.locator('.review-card[inert]').count(),2);
   await page.getByRole('button',{name:'Abrir búsqueda'}).click();
   await page.locator('#campusSearch').fill('présent');
   await page.locator('#campusSearch').press('ArrowDown');
   await page.keyboard.press('3');
   assert.equal(await page.evaluate(()=>window.__mock.reviews.length),0);
   assert.equal(await page.locator('#flash').evaluate(e=>e.classList.contains('flipped')),false);
   await page.keyboard.press('Escape');
   await page.locator('#flash').press('Space');
   await page.locator('#rate:not([hidden])').waitFor();
   await page.evaluate(()=>{window.__mock.failReview=true});
   await page.locator('[data-rate="2"]').click();
   await page.waitForFunction(()=>!window.__motionTest.state().busy);
   assert.deepEqual((await page.evaluate(()=>window.__motionTest.state())).cards,['c1','c2','c3']);
   assert.match(await page.locator('#toast').textContent(),/Inténtalo de nuevo/);
   await page.waitForFunction(()=>!document.querySelector('#toast').classList.contains('show') && getComputedStyle(document.querySelector('#toast')).opacity==='0');
   await page.evaluate(()=>{window.__mock.failReview=false;window.__mock.delayReview=150;});
   await page.locator('[data-rate="2"]').click();
   assert.equal(await page.locator('[data-rate="2"]').isDisabled(),true);
   // Keyboard repeats cannot issue a second save while the first is pending.
   await page.keyboard.press('3'); await page.keyboard.press('3');
   await page.waitForFunction(()=>window.__motionTest.state().reviewed===1);
   assert.equal(await page.evaluate(()=>window.__mock.reviews.length),2);
   assert.deepEqual((await page.evaluate(()=>window.__motionTest.state())).cards,['c2','c3']);
   assert.equal(await page.locator('#flash').evaluate(e=>e===document.activeElement),true);
   await page.screenshot({path:`${output}/review-${width}.png`});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.locator('#flash').press('Space'); await page.keyboard.press('1');
   await page.waitForFunction(()=>!window.__motionTest.state().busy);
   assert.deepEqual((await page.evaluate(()=>window.__motionTest.state())).cards,['c3','c2']);
   await page.evaluate(()=>window.__motionTest.result());
   assert.equal(await page.locator('#xpCount .motion-sr').textContent(),'+125');
   assert.equal(await page.locator('#lesson .check-tick path').evaluate(e=>e.style.strokeDashoffset),'0');
   await page.screenshot({path:`${output}/result-${width}-reduced.png`});
   assert.deepEqual(errors,[]);
   console.log(`PASS ${width}px: search, keyboard, escaping, XP, checks, review success/failure/double submit, reduced motion, no overflow or JS errors`);
   await page.close();
  }
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
