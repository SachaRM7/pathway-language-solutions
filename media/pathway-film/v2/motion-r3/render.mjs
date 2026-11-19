import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import path from 'node:path';
const mode=process.argv[2]||'frames';
const serveUrl=await bundle({entryPoint:path.resolve('src/index.tsx'),publicDir:path.resolve('public')});
const browser=await openBrowser('chrome',{chromeMode:'headless-shell'});
const base={serveUrl,pupeteerInstance:browser};
const composition=await selectComposition({...base,id:'Pathway-R3-45s'});
if(mode==='frames'){
 for(const [i,t] of [1.2,5.7,9.7,12.1,15,16.8,19.3,22.5,24.7,30,35.6,40.2,43].entries()){
  await renderStill({...base,composition:{...composition,props:{stillTime:t}},inputProps:{stillTime:t},output:`deliverables/frames/R3-${String(i+1).padStart(2,'0')}.png`,imageFormat:'png'});
  console.log('Frame',i+1,t);
 }
} else {
 let last=-1;
 await renderMedia({...base,composition,outputLocation:'review/rendered-master.mp4',codec:'h264',crf:23,scale:2/3,imageFormat:'jpeg',jpegQuality:88,concurrency:4,muted:true,onProgress:p=>{const n=Math.floor(p.progress*10);if(n>last){last=n;console.log(n*10+'%');}}});
}
await browser.close({silent:true});
