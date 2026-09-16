import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const mode=process.argv[2]||'frames';
const serveUrl=await bundle({entryPoint:path.resolve('src/index.tsx'),publicDir:path.resolve('public')});
const browser=await openBrowser('chrome',{chromeMode:'headless-shell'});
const base={serveUrl,pupeteerInstance:browser};
const props={opening:'C',timing:'A',stillTime:null};
const composition=await selectComposition({...base,id:'Pathway-Phase2A',inputProps:props});
if(mode==='frames'){
 const jobs=[
  ['Opening-A',.9,'A'],['Opening-B',.9,'B'],['Opening-C',.9,'C'],
  ['Frame-01-opening',.9,'C'],['Frame-02-pathway',3.4,'C'],['Frame-03-enter-A2',5.8,'C'],
  ['Frame-04-annotation',7.25,'C'],['Frame-05-human-guidance',10.8,'C'],
  ['Frame-06-logo-resolution',15.2,'C'],['Frame-07-brand-CTA',18,'C']
 ];
 for(const [name,time,opening] of jobs){
  await renderStill({...base,composition:{...composition,props:{...props,opening,stillTime:time}},inputProps:{...props,opening,stillTime:time},output:`deliverables/styleframes/${name}.png`,imageFormat:'png'});
  console.log(`Saved ${name}`);
 }
} else if(mode==='videos'){
 for(const timing of ['A','B']){
  const outputLocation=`deliverables/Pathway-Phase2A-Animatic-${timing}.mp4`;
  let last=-1;
  await renderMedia({...base,composition:{...composition,props:{...props,timing}},inputProps:{...props,timing},outputLocation,codec:'h264',crf:24,scale:2/3,imageFormat:'jpeg',jpegQuality:85,concurrency:4,muted:true,onProgress:p=>{let q=Math.floor(p.progress*10);if(q>last){last=q;console.log(`Variant ${timing}: ${q*10}%`);}}});
  console.log(`Saved ${outputLocation}`);
 }
} else if(mode==='checks'){
 for(const time of [1.9,2.2,4.6,4.9,5.1,5.65,8.4,9.5,12.4,13,13.7,14.2,15.15,15.8]){
  await renderStill({...base,composition:{...composition,props:{...props,stillTime:time}},inputProps:{...props,stillTime:time},output:`review/check-${time}.png`,imageFormat:'png',scale:0.5});
 }
}
await browser.close({silent:true});
