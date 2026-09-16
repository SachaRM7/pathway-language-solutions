const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=fs.readFileSync('src/index.tsx','utf8');
const core=source.slice(source.indexOf('type P='),source.indexOf('const Text:')).replace('export const motionState','const motionState');
const js=ts.transpileModule(core+'\nmodule.exports={motionState,curves,distance,logo,headKeys,L};',{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
const context={module:{exports:{}}};vm.runInNewContext(js,context);const {motionState,curves,distance,logo,L}=context.module.exports;
let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,backtracks=[];
for(let i=1;i<1350;i++){
 const a=motionState((i-1)/30),b=motionState(i/30);const x=960+(b.tip[0]-b.cx)*b.scale,y=540+(b.tip[1]-b.cy)*b.scale;
 minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
 if(b.start<a.start-.1)backtracks.push({frame:i,delta:b.start-a.start});
}
const joins=[15,30].map(t=>({time:t,before:motionState(t-1/30),at:motionState(t),after:motionState(t+1/30)}));
const expected=[[[8,49],[15.5,44.8],[23.5,42.7],[32,42.7]],[[32,42.7],[40.5,42.7],[48.5,44.8],[56,49]]].map(c=>c.map(([x,y])=>[logo.x+x*logo.s,logo.y+y*logo.s]));
const logoExact=JSON.stringify(expected)===JSON.stringify(curves.slice(-2));
const holdStatic=JSON.stringify(motionState(41))===JSON.stringify(motionState(44.9666666667));
const result={tipScreenBounds:{minX,maxX,minY,maxY},tailBacktracks:backtracks,joins,logoExact,holdStatic,logoLength:L-distance('logo-start'),noExternalTimingReset:true};
fs.writeFileSync('review/motion-check.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,joins:joins.map(j=>({time:j.time,position:j.at.tip,scale:j.at.scale,headAdvance:j.after.head-j.at.head})),tailBacktracks:backtracks.length},null,2));
if(!logoExact||!holdStatic||minX<0||maxX>1920||minY<0||maxY>1080)process.exit(1);
