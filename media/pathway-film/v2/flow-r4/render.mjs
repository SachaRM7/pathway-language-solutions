import {bundle} from '@remotion/bundler';
import {openBrowser,selectComposition,renderStill,renderMedia} from '@remotion/renderer';
import path from 'node:path';
const mode=process.argv[2]||'frames';
const serveUrl=await bundle({entryPoint:path.resolve('src/index.tsx'),publicDir:path.resolve('public')});
const browser=await openBrowser('chrome',{chromeMode:'headless-shell'});
const base={serveUrl,pupeteerInstance:browser};
const composition=await selectComposition({...base,id:'MASTER-R4-FLOW'});
if(mode==='frames'){
 for(const [i,t] of [1,4,7,10,13,16,19,22,25,28,31,34,37,40].entries()){
  await renderStill({...base,composition:{...composition,props:{stillTime:t}},inputProps:{stillTime:t},output:`review/R4-${String(i+1).padStart(2,'0')}.png`,imageFormat:'png'});
  console.log('Frame',i+1,t);
 }
} else if(mode==='seams'){
 for(const [frame,id,local] of [[449,'WINDOW-01',449],[450,'WINDOW-02',0],[451,'WINDOW-02',1],[839,'WINDOW-02',389],[840,'WINDOW-03',0],[841,'WINDOW-03',1]]){
  const window=await selectComposition({...base,id});
  await renderStill({...base,composition,frame,output:`review/master-${frame}.png`,imageFormat:'png'});
  await renderStill({...base,composition:window,frame:local,output:`review/window-${frame}.png`,imageFormat:'png'});
  console.log('Window equality frame',frame);
 }
} else {
 let last=-1;
 await renderMedia({...base,composition,outputLocation:'deliverables/Pathway-R4-MASTER-FLOW.mp4',codec:'h264',crf:23,scale:2/3,imageFormat:'jpeg',jpegQuality:88,concurrency:4,muted:true,onProgress:p=>{const n=Math.floor(p.progress*10);if(n>last){last=n;console.log(n*10+'%');}}});
}
await browser.close({silent:true});
