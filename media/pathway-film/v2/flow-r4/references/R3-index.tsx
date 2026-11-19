import React from 'react';
import {Composition,registerRoot,useCurrentFrame,useVideoConfig,staticFile,delayRender,continueRender} from 'remotion';

const handle=delayRender('Pathway local assets');
const fontJobs=[['Outfit',500],['Outfit',600],['Outfit',700],['DM Sans',500],['DM Sans',600]].map(async([f,w])=>{
 const family=String(f);const font=new FontFace(family,`url(${staticFile(`${family.replace(' ','-')}-${w}.ttf`)})`,{weight:String(w)});document.fonts.add(await font.load());
});
const screenshot=new Promise<void>((resolve,reject)=>{const im=new Image();im.onload=()=>resolve();im.onerror=reject;im.src=staticFile('pathway-site-hero.jpg');});
Promise.all([...fontJobs,screenshot]).then(()=>continueRender(handle));

type P=[number,number];
type Cubic=[P,P,P,P];
const C={cream:'#F5EFE4',paper:'#FFFAF2',green:'#122B26',muted:'#50625C',line:'#C76F56',gold:'#D4AF37'};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const ease=(v:number)=>{const x=clamp(v);return x*x*x*(x*(x*6-15)+10);};
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const p=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
const value=(t:number,keys:number[][])=>{if(t<=keys[0][0])return keys[0][1];for(let i=0;i<keys.length-1;i++){if(t<=keys[i+1][0])return mix(keys[i][1],keys[i+1][1],p(t,keys[i][0],keys[i+1][0]));}return keys[keys.length-1][1];};

// One physical stroke. Each named endpoint is a semantic action, not a scene cut.
// Time is always global, including across the standalone export boundaries.
const curves:Cubic[]=[];const events:Record<string,number>={};let pen:P=[240,560];
const curve=(b:P,c:P,d:P)=>{curves.push([pen,b,c,d]);pen=d;};
const event=(name:string)=>{events[name]=curves.length;};
curve([400,560],[600,560],[785,560]);event('hook');
curve([940,560],[1070,650],[1780,650]);event('intro-out');
curve([2000,650],[2140,600],[2280,600]);event('classes-in');
curve([2700,600],[3100,600],[3540,600]);event('classes');
curve([3820,600],[4020,595],[4270,595]);event('levels-in');
curve([4800,595],[5420,595],[5910,595]);event('levels');
// Deliberate retraction along the same baseline, then a precise A2 selection.
// No decorative lower loop. A short pen stroke returns to the selected level.
curve([5600,595],[5230,595],[5000,595]);
curve([5000,565],[5000,530],[5000,490]);event('circle-start');
curve([5000,429.25],[4950.75,380],[4890,380]);
curve([4829.25,380],[4780,429.25],[4780,490]);
curve([4780,550.75],[4829.25,600],[4890,600]);
curve([4950.75,600],[5000,550.75],[5000,490]);event('selected');
curve([5050,490],[5110,540],[5170,540]);event('entry');
// The opened circle enters the unit margin, then reaches the first baseline.
curve([5190,540],[5190,545],[5190,580]);
curve([5190,670],[5190,784],[5310,784]);event('first-in');
curve([5400,784],[5500,784],[5586.39,784]);event('annotation-start');
curve([5600,784],[5620,784],[5637.65,784]);event('annotation');
// Direct connection through negative space between the two expressions.
curve([5730,784],[5770,989],[5910,989]);
curve([6010,989],[6100,989],[6197.81,989]);event('response-in');
curve([6225,989],[6260,989],[6290.34,989]);event('exchange');
// The response annotation becomes the supporting baseline of guided practice.
curve([6450,989],[6520,960],[6520,840]);event('practice-origin');
curve([6520,610],[6530,490],[6580,490]);event('practice-in');
curve([6780,490],[7000,490],[7210,490]);event('practice');
curve([7280,490],[7250,675],[7340,675]);event('feedback-in');
curve([7560,675],[7800,675],[8020,675]);event('feedback');
// Feedback points forward; the same baseline defines the goal's open enclosure.
curve([8170,675],[8320,705],[8490,705]);event('goal-in');
curve([8710,705],[9060,705],[9280,705]);event('goal-base');
curve([9500,705],[9500,365],[9280,365]);event('goal');
curve([9600,365],[9900,445],[10180,445]);event('personal-in');
curve([10500,445],[10950,445],[11340,445]);event('personal');
curve([11430,445],[11410,650],[11500,650]);event('plan');
// Tangent-matched approach to the first point of the official logo stroke.
curve([11880,650],[12234.8,487.9],[12334.8,431.9]);event('logo-start');
const logo={x:12310,y:280,s:3.1};
const at=(x:number,y:number):P=>[logo.x+x*logo.s,logo.y+y*logo.s];
curve(at(15.5,44.8),at(23.5,42.7),at(32,42.7));
curve(at(40.5,42.7),at(48.5,44.8),at(56,49));event('logo-end');

// Arc-length lookup for a smoothly moving head and tail. Final curve data
// is preserved exactly; lengths control reveal only, not geometry.
const sample=(c:Cubic,t:number):P=>{const u=1-t;return [0,1].map(k=>u*u*u*c[0][k]+3*u*u*t*c[1][k]+3*u*t*t*c[2][k]+t*t*t*c[3][k]) as P;};
const lengths=[0];const lookup:{length:number,point:P}[]=[{length:0,point:curves[0][0]}];
for(const c of curves){let len=0,prev=c[0];for(let i=1;i<=250;i++){const q=sample(c,i/250);len+=Math.hypot(q[0]-prev[0],q[1]-prev[1]);prev=q;lookup.push({length:lengths[lengths.length-1]+len,point:q});}lengths.push(lengths[lengths.length-1]+len);}
const L=lengths[lengths.length-1];
const pointAt=(len:number):P=>{let lo=0,hi=lookup.length-1;while(lo<hi){const mid=Math.floor((lo+hi)/2);if(lookup[mid].length<len)lo=mid+1;else hi=mid;}return lookup[lo].point;};
const d=`M${curves[0][0].join(' ')} `+curves.map(c=>'C'+c.slice(1).map(q=>q.join(' ')).join(' ')).join(' ');
const distance=(name:string)=>lengths[events[name]];
// Micro-actions are short; reading holds are explicit. The camera is cued later.
const headKeys=[
 [0,0],[.18,0],[.72,distance('hook')],[2.45,distance('hook')],
 [3.3,distance('intro-out')],[3.85,distance('classes-in')],[4.9,distance('classes')],[6.45,distance('classes')],
 [7.55,distance('levels-in')],[9.55,distance('levels')],[10.2,distance('levels')],
 [11.1,distance('circle-start')],[11.62,distance('selected')],[12.75,distance('selected')],
 [13.35,distance('entry')],[15.35,distance('first-in')],[16.12,distance('annotation-start')],
 [16.4,distance('annotation')],[17.65,distance('annotation')],
 [18.75,distance('response-in')],[19.03,distance('exchange')],[20.05,distance('exchange')],
 [20.7,distance('practice-origin')],[21.7,distance('practice-in')],[22.3,distance('practice')],[23.2,distance('practice')],
 [23.72,distance('feedback-in')],[24.24,distance('feedback')],[25.5,distance('feedback')],
 [27.7,distance('goal-in')],[28.6,distance('goal-base')],[29.15,distance('goal')],[31.5,distance('goal')],
 [33,distance('personal-in')],[34,distance('personal')],[34.5,distance('personal')],
 [35.12,distance('plan')],[36.55,distance('plan')],[39.3,distance('logo-start')],[40.1,L],[40.8,L],[45,L]
];
// Continuous, reversible masks tied to pen position rather than unrelated fades.
const reached=(head:number,from:string,to:string)=>clamp((head-distance(from))/(distance(to)-distance(from)));
// Tail never redraws retired geometry. Both head and start interpolate on the
// same event intervals, preserving a non-negative continuous stroke window.
const tailKeys=[[0,950],[9.55,1640],[10.2,90],[11.1,90],[11.62,distance('selected')-distance('circle-start')],[12.75,distance('selected')-distance('circle-start')],[14.2,550],[15.35,450],[16.4,51.26],[17.65,51.26],[18.75,480],[19.03,92.53],[20.05,92.53],[21.7,650],[22.3,630],[23.2,630],[24.24,680],[25.5,680],[27.7,1050],[29.15,distance('goal')-distance('goal-in')],[31.5,distance('goal')-distance('goal-in')],[33,1100],[36.55,1100],[39.65,400],[40.8,L-distance('logo-start')],[45,L-distance('logo-start')]];
let previousStart=0;
const startKeys=headKeys.map(([t,h])=>{previousStart=Math.max(previousStart,h-value(t,tailKeys),0);return [t,previousStart];});
export const motionState=(t:number)=>{
 const head=value(t,headKeys),tip=pointAt(head);
 const scale=value(t,[[0,1],[12.7,1],[15.55,1.12],[17.6,1.12],[19.1,1],[20.3,1],[22.25,.88],[24.6,.88],[28.6,1],[45,1]]);
 const wantedCx=value(t,[[0,960],[2.9,960],[4.7,3000],[6.85,3000],[9.0,5050],[12.9,5050],[15.55,5650],[17.9,5650],[19.25,6100],[20.25,6100],[22.45,7060],[24.5,7450],[25.8,7450],[29.1,8900],[31.85,8900],[34.2,10800],[37.15,10800],[39.95,12700],[45,12700]]);
 const cy=value(t,[[0,540],[12.9,540],[15.55,710],[17.9,710],[19.25,800],[20.25,800],[22.45,650],[24.5,590],[25.8,590],[29.1,540],[45,540]]);
 const cx=Math.max(tip[0]-740/scale,Math.min(wantedCx,tip[0]+740/scale));
 const start=value(t,startKeys);
 return {head,tip,cx,cy,scale,start};
};

const Text:React.FC<React.SVGProps<SVGTextElement>>=({children,...props})=><text fontFamily="Outfit" fontWeight={500} fill={C.green} {...props}>{children}</text>;
const OriginalLogoBody=()=> <g fill="none" strokeLinecap="round" strokeLinejoin="round">
 <path d="M12 29.5C13.9 18.2 21.7 10 32 10s18.1 8.2 20 19.5" stroke="#D4AF37" strokeWidth="2"/>
 <path d="M23.8 43h16.4l-3-26.5H26.8z" fill="#EDF3DF" stroke="#103A35" strokeWidth="1.8"/>
 <path d="M27 16.5h10M25.8 12.5h12.4L35.5 8h-7z" fill="#FB8669" stroke="#103A35" strokeWidth="1.6"/>
 <path d="M29.5 23h5v6.5h-5zM29.5 35h5v8h-5z" fill="#103A35" stroke="#103A35" strokeWidth="1"/>
 <path d="M32 4.5V8M20.5 9.5l3.1 3M43.5 9.5l-3.1 3" stroke="#D4AF37" strokeWidth="2"/>
 <circle cx="32" cy="8" r="1.8" fill="#D4AF37" stroke="none"/>
</g>;

export const Prototype:React.FC<{stillTime:number|null;offset?:number}>=({stillTime=null,offset=0})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=stillTime??(offset+frame/fps);
 const {head,tip,cx,cy,scale,start}=motionState(t),visible=head-start;
 const surface=p(t,13.15,15),a2=p(t,13.15,15);
 const logoReveal=p(t,39.45,40.5),endText=p(t,39.75,41.0);
 const classes=reached(head,'classes-in','classes');
 const levels=reached(head,'levels-in','levels');
 const first=p(t,15.35,15.75),teacher=p(t,16.52,16.88),second=p(t,18.2,18.55);
 const practice=p(t,19.2,19.55),carry=p(t,20.05,22.3);
 const practiceX=mix(6190,6890,p(t,20.05,20.8)),practiceY=t<22.3?tip[1]+mix(95,-30,carry):460,practiceSize=mix(38,86,carry);
 const feedback=p(t,23.25,23.6),reply=p(t,23.2,24.24);
 const feedbackX=mix(7310,7670,reply),feedbackY=mix(455,630,reply),feedbackSize=mix(40,86,reply);
 const goal=reached(head,'goal-in','goal-base');
 const personal=reached(head,'personal-in','personal'),plan=reached(head,'personal','plan');
 // Consequence labels begin inside the learning space, then settle into the
 // approved two-line benefit composition. The pen carries the same baseline.

 const colorT=p(t,39.3,40.1);
 const color='#'+[1,3,5].map(k=>Math.round(mix(parseInt('#C76F56'.slice(k,k+2),16),parseInt('#FB8669'.slice(k,k+2),16),colorT)).toString(16).padStart(2,'0')).join('');
 return <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{display:'block',background:C.cream}}>
 <defs>
  <clipPath id="site"><rect x="1090" y="168" width="670" height="450" rx="24"/></clipPath>
  <clipPath id="course"><rect x="5100" y="380" width={1450*surface} height="840" rx="26"/></clipPath>
  <clipPath id="first-word"><rect x="5300" y="635" width="440" height={150*first}/></clipPath>
  <clipPath id="teacher"><rect x="5750" y="510" width="790" height={130*teacher}/></clipPath>
  <clipPath id="second"><rect x="5900" y="830" width="600" height={155*second}/></clipPath>
  <clipPath id="classes"><rect x="2180" y="250" width={1660*classes} height="400"/></clipPath>
  <clipPath id="levels"><rect x="4270" y="300" width={1700*levels} height="310"/></clipPath>
  <clipPath id="practice"><rect x={practiceX-390} y={practiceY-110} width={780*practice} height="130"/></clipPath>
  <clipPath id="feedback"><rect x={feedbackX-370} y={feedbackY-110} width={740*feedback} height="130"/></clipPath>
  <clipPath id="goal"><rect x="8380" y="235" width={1130*goal} height="440"/></clipPath>
  <clipPath id="personal"><rect x="10150" y="290" width={1320*personal} height="170"/></clipPath>
  <clipPath id="plan"><rect x="10200" y="470" width={1200*plan} height="150"/></clipPath>
  <clipPath id="body"><rect x="0" y={52*(1-logoReveal)} width="64" height={55*logoReveal}/></clipPath>
  <clipPath id="end-text"><rect x="11400" y="250" width="2450" height={740*endText}/></clipPath>
 </defs>
 <g transform={`translate(960 540) scale(${scale}) translate(${-cx} ${-cy})`}>
  {/* Institute and actual website, not an invented application UI. */}
  <Text x="240" y="355" fontSize="140" fontWeight="700" letterSpacing="-4">Pathway</Text>
  <Text x="248" y="410" fontFamily="DM Sans" fontSize="26" letterSpacing="5" fill={C.muted}>LANGUAGE SOLUTIONS</Text>
  <Text x="240" y="535" fontSize="72">Francés, contigo.</Text>
  <Text x="248" y="625" fontFamily="DM Sans" fontSize="32" fill={C.muted}>pathway-languages.com</Text>
  <g clipPath="url(#site)"><image href={staticFile('pathway-site-hero.jpg')} x="1090" y="168" width="670" height="460" preserveAspectRatio="xMidYMid meet"/></g>

  <g clipPath="url(#classes)">
  <Text x="3000" y="425" textAnchor="middle" fontSize="116" fontWeight="600">Clases privadas.</Text>
  <Text x="3000" y="565" textAnchor="middle" fontSize="68">En vivo, con tu profesor.</Text>
  </g>

  <g clipPath="url(#levels)">
  <Text x="4450" y="535" textAnchor="middle" fontSize="112">A1</Text>
  <Text x="5350" y="535" textAnchor="middle" fontSize="112">B1</Text>
  <Text x="5800" y="535" textAnchor="middle" fontSize="112">B2</Text>
  </g>

  <g clipPath="url(#course)">
   <rect x="5100" y="380" width="1450" height="840" rx="26" fill={C.paper}/>
   <Text x="6410" y="500" textAnchor="end" fontSize="34" fontWeight="600" fill={C.muted}>Pathway</Text>
   <Text x="5310" y="500" fontFamily="DM Sans" fontSize="34" fill={C.muted}>· Unité 1</Text>
   <g clipPath="url(#first-word)"><Text x="5320" y="760" fontSize="96">je parle</Text></g>
   <g clipPath="url(#teacher)"><Text x="5760" y="615" fontFamily="DM Sans" fontSize="66">Con tu profesor</Text></g>
   <g clipPath="url(#second)"><Text x="5920" y="965" fontSize="96">tu parles</Text></g>
  </g>
  <Text x={mix(4824,5230,a2)} y={mix(535,500,a2)} fontSize={mix(126,42,a2)} fontWeight="600" visibility={levels>.27?'visible':'hidden'}>A2</Text>
  {/* The single A2 node remains above the growing surface. */}
  <g clipPath="url(#practice)"><Text x={practiceX} y={practiceY} textAnchor="middle" fontSize={practiceSize}>Práctica guiada.</Text></g>
  <g clipPath="url(#feedback)"><Text x={feedbackX} y={feedbackY} textAnchor="middle" fontSize={feedbackSize}>Feedback útil.</Text></g>

  <g clipPath="url(#goal)">
  <Text x="8900" y="315" textAnchor="middle" fontFamily="DM Sans" fontSize="42" letterSpacing="5" fill={C.muted}>OBJETIVO</Text>
  <Text x="8900" y="535" textAnchor="middle" fontSize="190" fontWeight="600">NCLC 7</Text>
  <Text x="8900" y="635" textAnchor="middle" fontFamily="DM Sans" fontSize="56">TEF · TCF Canada</Text>
  </g>

  <g clipPath="url(#personal)"><Text x="10800" y="415" textAnchor="middle" fontSize="94">Tu punto de partida.</Text></g>
  <g clipPath="url(#plan)"><Text x="10800" y="570" textAnchor="middle" fontSize="76">Un plan para ti.</Text></g>

  <path id="continuous-travelling-line" d={d} fill="none" stroke={color} strokeWidth={mix(7,7.44,colorT)/scale} strokeLinecap="round" strokeLinejoin="round" pathLength={L} strokeDasharray={`${Math.max(.001,visible)} ${L+1}`} strokeDashoffset={-start} visibility={t>.18?'visible':'hidden'}/>

  <g transform={`translate(${logo.x} ${logo.y}) scale(${logo.s})`} clipPath="url(#body)"><OriginalLogoBody/></g>
  <g clipPath="url(#end-text)">
   <Text x="12542" y="430" fontSize="136" fontWeight="700" letterSpacing="-4">Pathway</Text>
   <Text x="12550" y="480" fontFamily="DM Sans" fontSize="24" letterSpacing="5" fill={C.muted}>LANGUAGE SOLUTIONS</Text>
   <Text x="12700" y="630" textAnchor="middle" fontSize="75">Tu francés tiene un camino.</Text>
   <rect x="12390" y="728" width="620" height="112" rx="14" fill={C.green}/>
   <Text x="12700" y="804" textAnchor="middle" fontFamily="DM Sans" fontSize="56" fontWeight="600" fill={C.paper}>Evalúa tu nivel</Text>
   <Text x="12700" y="909" textAnchor="middle" fontFamily="DM Sans" fontSize="46" fill={C.muted}>pathway-languages.com</Text>
  </g>
 </g>
 </svg>;
};
registerRoot(()=> <>
 <Composition id="Pathway-R3-45s" component={Prototype} width={1920} height={1080} fps={30} durationInFrames={1350} defaultProps={{stillTime:null as number|null,offset:0}}/>
 {[0,1,2].map(i=><Composition key={i} id={`VIDEO-0${i+1}`} component={Prototype} width={1920} height={1080} fps={30} durationInFrames={450} defaultProps={{stillTime:null as number|null,offset:i*15}}/>)}
 <Composition id="MASTER-LONG-FORM" component={Prototype} width={1920} height={1080} fps={30} durationInFrames={1320} defaultProps={{stillTime:null as number|null,offset:0}}/>
</>);
