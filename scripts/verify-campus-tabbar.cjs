// Requires the same local server and Playwright setup as verify-campus-motion.cjs.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');
const { fixture } = require('../tests/campus/fixture.cjs');
const output = process.env.MOTION_QA_DIR || '/tmp/pathway-tabbar-qa';
const position = page => page.locator('.tabbar-indicator').evaluate(el=>el.getBoundingClientRect().x);
const aligned = page => page.waitForFunction(()=>{
 const nav=document.querySelector('#tabbar'), active=nav.querySelector('a[aria-current]');
 const a=active.getBoundingClientRect(), p=nav.querySelector('.tabbar-indicator').getBoundingClientRect();
 return Math.abs(a.x-p.x)<.05 && Math.abs(a.width-p.width)<.05;
});
const selected = (page,id) => page.locator(`#tabbar a[href="#${id}"][aria-current="page"]`).waitFor();
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 try {
  for(const width of [390,360,768]) {
   const page=await browser.newPage({viewport:{width,height:844},colorScheme:width===360?'dark':'light'});
   const errors=[]; page.on('pageerror',e=>errors.push(e.message));
   await fixture(page); await aligned(page);
   assert.equal(await page.locator('#tabbar a').count(),5);
   assert.equal(await page.locator('.tabbar-indicator').getAttribute('aria-hidden'),'true');

   // Controlled frames verify visible travel and retargeting before the first move settles.
   await page.clock.install({time:new Date('2026-11-15T12:00:00Z')});
   await page.clock.pauseAt(new Date('2026-11-15T12:00:01Z'));
   const start=await position(page);
   await page.locator('#tabbar a[href="#ruta"]').evaluate(e=>e.click()); await selected(page,'ruta');
   await page.clock.runFor(64);
   const during=await position(page), target=await page.locator('#tabbar a[aria-current]').evaluate(e=>e.getBoundingClientRect().x);
   assert(during>start+1 && during<target-1,'Pill should travel between the previous and next tab');
   await page.locator('#tabbar a[href="#logros"]').evaluate(e=>e.click()); await selected(page,'logros');
   await page.clock.runFor(80);
   const forward=await position(page); assert(forward>during,'Rapid taps must continue from the visible position');
   await page.locator('#tabbar a[href="#inicio"]').evaluate(e=>e.click()); await selected(page,'inicio');
   await page.clock.runFor(160);
   assert(await position(page)<forward,'Pill must reverse toward the latest selection');
   await page.clock.runFor(1200);
   assert(Math.abs(await position(page)-start)<.05);
   await page.locator('#tabbar a[href="#logros"]').evaluate(e=>e.click()); await selected(page,'logros');
   for(let frame=0;frame<45;frame++) {
    await page.clock.runFor(16);
    assert.equal(await page.locator('#tabbar').evaluate(nav=>{
     const bar=nav.getBoundingClientRect(), pill=nav.querySelector('.tabbar-indicator').getBoundingClientRect();
     return pill.x>=bar.x+5.9 && pill.right<=bar.right-5.9;
    }),true,'Pill stays within the bar even at the outermost tab');
   }
   await page.locator('#tabbar a[href="#inicio"]').evaluate(e=>e.click()); await selected(page,'inicio');
   await page.clock.runFor(1200);
   await page.clock.resume();

   await page.goBack(); await selected(page,'logros'); await aligned(page);
   await page.goForward(); await selected(page,'inicio'); await aligned(page);
   const review=page.locator('#tabbar a[href="#repasar"]');
   await review.focus(); await review.press('Enter'); await selected(page,'repasar'); await aligned(page);
   assert.equal(await review.evaluate(e=>e===document.activeElement),true,'Navigation preserves keyboard focus');
   await page.evaluate(()=>{window.savedNavLink=document.activeElement;window.__motionTest.render();});
   assert.equal(await page.evaluate(()=>document.activeElement===window.savedNavLink),true,'Data refresh preserves the focused link');
   await review.press('Tab');
   assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('href')),'#simulacros');
   await page.screenshot({path:`${output}/navigation-${width}.png`});

   for(const count of [6,7,5]) {
    await page.evaluate(n=>window.__motionTest.navOptions(n),count); await aligned(page);
    assert.equal(await page.locator('#tabbar a').count(),count);
   }
   await page.setViewportSize({width:844,height:390}); await aligned(page);
   await page.setViewportSize({width:1440,height:1000});
   assert.equal(await page.locator('#tabbar').isVisible(),false);
   await page.setViewportSize({width,height:844}); await aligned(page);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);

   await page.emulateMedia({reducedMotion:'reduce'});
   await page.locator('#tabbar a[href="#logros"]').click(); await selected(page,'logros'); await aligned(page);
   assert.equal(await page.locator('#tabbar').evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
   // Changing preference during a move settles immediately at the selected tab.
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.locator('#tabbar a[href="#inicio"]').click(); await selected(page,'inicio');
   await page.emulateMedia({reducedMotion:'reduce'}); await aligned(page);
   await page.evaluate(()=>window.__motionTest.staffNav()); await aligned(page);
   assert.equal(await page.locator('#tabbar a').count(),9);
   assert.equal(await page.locator('#tabbar a[aria-current]').getAttribute('href'),'#ajustes');
   await page.screenshot({path:`${output}/staff-${width}.png`});
   await page.evaluate(()=>window.__motionTest.login());
   assert.equal(await page.locator('#tabbar').isVisible(),false);
   assert.equal(await page.locator('.tabbar-indicator').getAttribute('hidden'),'');
   assert.deepEqual(errors,[]);
   console.log(`PASS ${width}px: moving pill, rapid reversals, history, keyboard/focus, 5–9 links, resize, desktop fallback, reduced motion, logout`);
   await page.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
