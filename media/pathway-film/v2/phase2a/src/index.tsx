import React from 'react';
import {Composition, registerRoot, useCurrentFrame, useVideoConfig, delayRender, continueRender, staticFile} from 'remotion';

const fontGate=delayRender('Local Pathway fonts');
Promise.all([
  ['Outfit',500],['Outfit',600],['Outfit',700],
  ['DM Sans',500],['DM Sans',600],
].map(async ([family,weight])=>{
  const name=String(family); const font=new FontFace(name,`url(${staticFile(`${name.replace(' ','-')}-${weight}.ttf`)})`,{weight:String(weight)});
  document.fonts.add(await font.load());
})).then(()=>continueRender(fontGate));

export type Props={opening:'A'|'B'|'C';timing:'A'|'B';stillTime:number|null};
type Point=[number,number];
const C={cream:'#F5EFE4',paper:'#FFFAF2',green:'#122B26',muted:'#50625C',sage:'#CAD8C3',line:'#C76F56',gold:'#D4AF37',logoPath:'#FB8669'};
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const x=clamp(v);return x*x*x*(x*(x*6-15)+10);};
const progress=(t:number,a:number,b:number)=>ease((t-a)/(b-a));
const lerp=(a:Point,b:Point,t:number):Point=>[mix(a[0],b[0],t),mix(a[1],b[1],t)];
const blend=(a:Point[],b:Point[],t:number)=>a.map((p,i)=>lerp(p,b[i],t));
// Every state has six connected cubics; the same SVG path persists from the
// opening to the official logo. No scene cut, crossfade or duplicate path.
const spline=(knots:Point[]):Point[]=>{
 const r:Point[]=[knots[0]];
 for(let i=0;i<knots.length-1;i++){
  const p0=knots[Math.max(0,i-1)],p1=knots[i],p2=knots[i+1],p3=knots[Math.min(knots.length-1,i+2)];
  r.push([p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6],
   [p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6],p2);
 } return r;
};
const split=(p:Point[],t:number):[Point[],Point[]]=>{
 const a=lerp(p[0],p[1],t),b=lerp(p[1],p[2],t),c=lerp(p[2],p[3],t);
 const d=lerp(a,b,t),e=lerp(b,c,t),f=lerp(d,e,t);return [[p[0],a,d,f],[f,e,c,p[3]]];
};
const thirds=(p:Point[])=>{const [a,bc]=split(p,1/3);const [b,c]=split(bc,1/2);return [a,b,c];};
// Exact original: M8 49 c7.5-4.2 15.5-6.3 24-6.3 S48.5 44.8 56 49.
const logoCurves=[...thirds([[8,49],[15.5,44.8],[23.5,42.7],[32,42.7]]),...thirds([[32,42.7],[40.5,42.7],[48.5,44.8],[56,49]])];
const LOGO={x:570,y:280,scale:3.1};
const logoPoints:Point[]=[logoCurves[0][0],...logoCurves.flatMap(c=>c.slice(1))].map(p=>[LOGO.x+p[0]*LOGO.scale,LOGO.y+p[1]*LOGO.scale]);
const route=spline([[230,640],[440,640],[640,615],[800,580],[1060,622],[1350,640],[1700,640]]);
const openingPaths={
 A:spline([[245,550],[430,550],[660,602],[900,665],[1160,576],[1390,555],[1650,555]]),
 B:spline([[240,555],[440,555],[660,608],[885,675],[1130,570],[1380,555],[1670,555]]),
 C:spline([[260,555],[430,555],[650,587],[920,660],[1130,617],[1390,555],[1660,555]])
};
const entry=spline([[780,750],[835,742],[900,730],[962,716],[1030,708],[1090,702],[1193.83,702]]);
// Exact Outfit 500 metrics at 116 px: "je parl"=321.89; "je parle"=383.83.
const annotation:Point[]=[[1131.89,702],[1152.5367,702],[1173.1833,702],[1193.83,702],...Array.from({length:15},()=>[1193.83,702] as Point)];
const exchange:Point[]=[
 [1131.89,702],[1145,702],[1175,702],[1193.83,702],
 [1209,702],[1194,842],[1235,856],
 [1270,871],[1320,877],[1370,877],
 [1430,877],[1490,870],[1515,845],
 [1535,825],[1530,802],[1555.69,802],
 [1600,802],[1640,802],[1667.5,802]
];
const curveLength=(p:Point[])=>{
 let length=0,prev=p[0];
 for(let i=0;i<6;i++){
  const [a,b,c,d]=p.slice(i*3,i*3+4);
  for(let j=1;j<=50;j++){
   const t=j/50,u=1-t;const q:Point=[u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]];
   length+=Math.hypot(q[0]-prev[0],q[1]-prev[1]);prev=q;
  }
 }return length;
};
const pathString=(p:Point[])=>`M${p[0].join(' ')} `+Array.from({length:6},(_,i)=>`C${p.slice(1+i*3,4+i*3).map(p=>p.join(' ')).join(' ')}`).join(' ');
const hexMix=(a:string,b:string,t:number)=>'#'+[1,3,5].map(k=>Math.round(mix(parseInt(a.slice(k,k+2),16),parseInt(b.slice(k,k+2),16),t)).toString(16).padStart(2,'0')).join('');
export const canonicalTime=(t:number,timing:'A'|'B')=>{
 if(timing==='A')return t;
 const real=[0,4.4,6.1,8.6,13.1,17,20],canonical=[0,4.4,5.7,8.2,12.1,16,20];
 const i=Math.min(real.length-2,Math.max(0,real.findIndex((x,j)=>j<real.length-1&&t>=x&&t<=real[j+1])));
 return mix(canonical[i],canonical[i+1],clamp((t-real[i])/(real[i+1]-real[i])));
};

const T:React.FC<React.SVGProps<SVGTextElement>>=({children,...props})=><text fill={C.green} fontFamily="Outfit" fontWeight={500} {...props}>{children}</text>;
const OriginalLogoBody=()=> <g fill="none" strokeLinecap="round" strokeLinejoin="round">
 <path d="M12 29.5C13.9 18.2 21.7 10 32 10s18.1 8.2 20 19.5" stroke="#D4AF37" strokeWidth="2"/>
 <path d="M23.8 43h16.4l-3-26.5H26.8z" fill="#EDF3DF" stroke="#103A35" strokeWidth="1.8"/>
 <path d="M27 16.5h10M25.8 12.5h12.4L35.5 8h-7z" fill="#FB8669" stroke="#103A35" strokeWidth="1.6"/>
 <path d="M29.5 23h5v6.5h-5zM29.5 35h5v8h-5z" fill="#103A35" stroke="#103A35" strokeWidth="1"/>
 <path d="M32 4.5V8M20.5 9.5l3.1 3M43.5 9.5l-3.1 3" stroke="#D4AF37" strokeWidth="2"/>
 <circle cx="32" cy="8" r="1.8" fill="#D4AF37" stroke="none"/>
</g>;

export const Prototype:React.FC<Props>=({opening='C',timing='A',stillTime=null})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig();
 const t=canonicalTime(stillTime===null?frame/fps:stillTime,timing);
 const openingExit=progress(t,1.65,2.4),pathwayIn=progress(t,1.85,2.5);
 const enter=progress(t,4.4,5.7),annotate=progress(t,5.85,6.65);
 const human=progress(t,8.65,9.05),teacher=progress(t,8.2,8.6),join=progress(t,9.2,10.05);
 const withdraw=progress(t,12.1,13.2),resolve=progress(t,12.4,15.15);
 const cx=mix(mix(960,1210,enter),960,resolve),cy=mix(mix(540,675,enter),540,resolve);
 const scale=mix(mix(1,1.25,enter),1,resolve);
 let points=blend(openingPaths[opening],route,progress(t,1.5,2.4));
 points=blend(points,entry,enter);points=blend(points,annotation,annotate);
 points=blend(points,exchange,progress(t,8.0,8.8));points=blend(points,logoPoints,resolve);
 const visibleFraction=(t>=8&&t<10.05)?mix(Math.min(1,61.94/curveLength(points)),1,join):progress(t,.2,1.6);
 const stroke=hexMix(C.line,C.logoPath,progress(t,14.2,15.15));
 const strokeWidth=mix(6,2.4*LOGO.scale,resolve)/scale;
 const paperReveal=progress(t,4.55,5.55)*(1-withdraw);
 const a2Show=pathwayIn*(1-withdraw);
 const logoReveal=progress(t,14.1,15.18),nameReveal=progress(t,14.5,15.22);
 const tagline=progress(t,15.0,15.55),cta=progress(t,15.35,15.9);
 const first=progress(t,5.4,5.85)*(1-withdraw),second=human*(1-withdraw);
 const sub=enter*(1-withdraw);
 return <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{display:'block',background:C.cream}}>
 <defs>
  <clipPath id="opening-mask"><rect x="180" y="230" width="1560" height={460*(1-openingExit)}/></clipPath>
  <clipPath id="level-mask"><rect x="150" y="320" width="1650" height={280*pathwayIn*(1-enter)}/></clipPath>
  <clipPath id="a2-mask"><rect x="690" y="380" width="260" height={220*a2Show}/></clipPath>
  <clipPath id="sub-mask"><rect x="864" y="397" width={280*sub} height="80"/></clipPath>
  <clipPath id="first-mask"><rect x="795" y="545" width="440" height={155*first}/></clipPath>
  <clipPath id="second-mask"><rect x="1205" y="645" width="485" height={155*second}/></clipPath>
  <clipPath id="human-mask"><rect x="1180" y="418" width="540" height={90*teacher*(1-withdraw)}/></clipPath>
  <clipPath id="logo-body-mask"><rect x="0" y={52*(1-logoReveal)} width="64" height={55*logoReveal}/></clipPath>
  <clipPath id="name-mask"><rect x="790" y="295" width={655*nameReveal} height="200"/></clipPath>
  <clipPath id="tagline-mask"><rect x="340" y="535" width="1240" height={145*tagline}/></clipPath>
  <clipPath id="cta-mask"><rect x="550" y="710" width="820" height={230*cta}/></clipPath>
 </defs>
 <g transform={`translate(960 540) scale(${scale}) translate(${-cx} ${-cy})`}>
  <g clipPath="url(#opening-mask)">
   {opening==='A'&&<>
    <T x="380" y="470" textAnchor="middle" fontSize="80">Palabras.</T>
    <T x="910" y="580" textAnchor="middle" fontSize="80">Reglas.</T>
    <T x="1430" y="470" textAnchor="middle" fontSize="80">Práctica.</T>
   </>}
   {opening==='B'&&<>
    <T x="390" y="475" textAnchor="middle" fontSize="88">bonjour</T>
    <T x="900" y="590" textAnchor="middle" fontSize="88">parler</T>
    <path d="M1350 450v15m20-38v60m20-83v104m20-128v150m20-111v74m20-95v118m20-82v46m20-34v22" fill="none" stroke={C.green} strokeWidth="7" strokeLinecap="round"/>
    <path d="M250 404v-22h35M1070 606v24h-32" fill="none" stroke={C.muted} strokeWidth="2"/>
   </>}
   {opening==='C'&&<>
    <T x="390" y="465" textAnchor="middle" fontSize="100">Tu</T>
    <T x="930" y="580" textAnchor="middle" fontSize="100">siguiente</T>
    <T x="1470" y="465" textAnchor="middle" fontSize="100">paso.</T>
   </>}
  </g>
  <rect x={mix(762,658,paperReveal)} y={mix(510,375,paperReveal)} width={mix(76,1180,paperReveal)} height={mix(4,560,paperReveal)} rx={mix(2,22,paperReveal)} fill={C.paper} visibility={paperReveal>0?'visible':'hidden'}/>
  <g clipPath="url(#level-mask)">
   <T x="350" y="560" textAnchor="middle" fontSize="112">A1</T>
   <T x="1250" y="560" textAnchor="middle" fontSize="112">B1</T>
   <T x="1670" y="560" textAnchor="middle" fontSize="112">B2</T>
  </g>
  <g clipPath="url(#a2-mask)"><T x={mix(723,800,enter)} y={mix(510,445,enter)} fontSize={mix(126,36,enter)} fontWeight="600">A2</T></g>
  <g clipPath="url(#sub-mask)"><T x="866" y="445" fontFamily="DM Sans" fontSize="32" fill={C.muted}>· Unité 1</T></g>
  <g clipPath="url(#first-mask)"><T x="810" y="675" fontSize="116">je parle</T></g>
  <g clipPath="url(#second-mask)"><T x="1220" y="775" fontSize="116">tu parles</T></g>
  <g clipPath="url(#human-mask)"><T x="1190" y="475" fontFamily="DM Sans" fontSize="52" fontWeight="500">Con tu profesor</T></g>
  <path id="continuous-guidance" d={pathString(points)} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-visibleFraction}/>
  <g transform={`translate(${LOGO.x} ${LOGO.y}) scale(${LOGO.scale})`} clipPath="url(#logo-body-mask)"><OriginalLogoBody/></g>
  <g clipPath="url(#name-mask)">
   <T x="802" y="430" fontSize="136" fontWeight="700" letterSpacing="-4">Pathway</T>
   <T x="810" y="480" fontFamily="DM Sans" fontSize="24" letterSpacing="5" fill={C.muted}>LANGUAGE SOLUTIONS</T>
  </g>
  <g clipPath="url(#tagline-mask)"><T x="960" y="630" textAnchor="middle" fontSize="75">Tu francés tiene un camino.</T></g>
  <g clipPath="url(#cta-mask)">
   <rect x="650" y="728" width="620" height="112" rx="14" fill={C.green}/>
   <T x="960" y="804" textAnchor="middle" fontFamily="DM Sans" fontSize="56" fontWeight="600" fill={C.paper}>Evalúa tu nivel</T>
   <T x="960" y="909" textAnchor="middle" fontFamily="DM Sans" fontSize="46" fill={C.muted}>pathway-languages.com</T>
  </g>
 </g>
 </svg>;
};
const Root=()=> <Composition id="Pathway-Phase2A" component={Prototype} width={1920} height={1080} fps={30} durationInFrames={600} defaultProps={{opening:'C',timing:'A',stillTime:null} as Props}/>;
registerRoot(Root);
