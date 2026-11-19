const fs=require('fs'),vm=require('vm'),ts=require('typescript');
function readCore(file,r4){let s=fs.readFileSync(file,'utf8');s=s.slice(s.indexOf('type P='),s.indexOf('const Text:')).replaceAll('export const','const');let extra=r4?'motionState,lineDistance,lineVelocity,L,eventTimes,curves,logo,distance,FLOW_END,MASTER_END':'motionState,L,headKeys';const ctx={module:{exports:{}}};vm.runInNewContext(ts.transpileModule(s+`\nmodule.exports={${extra}}`,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,ctx);return ctx.module.exports;}
const now=readCore('src/index.tsx',true),old=readCore('references/R3-index.tsx',false);
const fps=240,dt=1/fps,rows=[];let bounds=[Infinity,-Infinity,Infinity,-Infinity],minVisible=Infinity;
const screen=s=>[960+(s.tip[0]-s.cx)*s.scale,540+(s.tip[1]-s.cy)*s.scale];
for(let i=0;i<=44*fps;i++){
 const t=i/fps,a=now.motionState(t),b=now.motionState(t+dt),oa=old.motionState(t),ob=old.motionState(t+dt),pa=screen(a),pb=screen(b);
 rows.push({t,r4_s:a.head,r4_progress:a.head/now.L,r4_v:now.lineVelocity(t),r4_measured_v:(b.head-a.head)/dt,r4_screen_v:Math.hypot(pb[0]-pa[0],pb[1]-pa[1])/dt,r3_s:oa.head,r3_progress:oa.head/old.L,r3_v:(ob.head-oa.head)/dt,head_x:pa[0],head_y:pa[1],camera_x:a.cx,camera_y:a.cy,scale:a.scale});
 if(t<39){bounds=[Math.min(bounds[0],pa[0]),Math.max(bounds[1],pa[0]),Math.min(bounds[2],pa[1]),Math.max(bounds[3],pa[1])];if(i)minVisible=Math.min(minVisible,a.head-a.start);}
}
function intervals(predicate,limit=42){let result=[],start=null;for(const r of rows.filter(r=>r.t<=limit)){const yes=predicate(r);if(yes&&start===null)start=r.t;else if(!yes&&start!==null){result.push([start,r.t]);start=null;}}if(start!==null)result.push([start,limit]);return result;}
const zeros=intervals(r=>r.r4_v<10),oldStops=old.headKeys.slice(1).flatMap((b,i)=>{const a=old.headKeys[i];return b[1]===a[1]&&a[0]<40.1?[[a[0],Math.min(b[0],40.1)]]:[];});
const expected=[[[8,49],[15.5,44.8],[23.5,42.7],[32,42.7]],[[32,42.7],[40.5,42.7],[48.5,44.8],[56,49]]].map(c=>c.map(([x,y])=>[now.logo.x+x*now.logo.s,now.logo.y+y*now.logo.s]));
const joins=[15,28,30].map(t=>({t,s:now.lineDistance(t),v:now.lineVelocity(t),before:now.lineVelocity(t-dt),after:now.lineVelocity(t+dt),stateEquality:JSON.stringify(now.motionState(t))===JSON.stringify(now.motionState((t-14)+14))}));
const angleChanges=now.curves.slice(1).map((b,i)=>{const a=now.curves[i];const u=[a[3][0]-a[2][0],a[3][1]-a[2][1]],v=[b[1][0]-b[0][0],b[1][1]-b[0][1]];return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v)))))*180/Math.PI;});
const summary={max_geometric_tangent_change_degrees:Math.max(...angleChanges),L:now.L,duration:42,line_stop:39,final_hold:3,eventTimes:now.eventTimes,min_velocity_before_final_deceleration:Math.min(...rows.filter(r=>r.t<34.5).map(r=>r.r4_v)),near_zero_definition:'arc velocity < 10 source pixels / second',intentional_near_zero:zeros,screen_near_zero_before_deceleration:intervals(r=>r.t<34.5&&r.r4_screen_v<10,34.5),r3_full_stops:oldStops,r3_stopped_seconds_before_logo:oldStops.reduce((sum,[a,b])=>sum+b-a,0),bounds,minVisible,joins,exactLogo:JSON.stringify(expected)===JSON.stringify(now.curves.slice(-2)),singleContinuousClock:true};
fs.writeFileSync('review/metrics.json',JSON.stringify(summary,null,2));
const keys=Object.keys(rows[0]);fs.writeFileSync('deliverables/Pathway-R4-motion-data.csv',keys.join(',')+'\n'+rows.map(r=>keys.map(k=>r[k].toFixed(6)).join(',')).join('\n'));
console.log(JSON.stringify(summary,null,2));
if(!summary.exactLogo||summary.min_velocity_before_final_deceleration<=0||bounds[0]<0||bounds[1]>1920||bounds[2]<0||bounds[3]>1080)process.exitCode=1;
