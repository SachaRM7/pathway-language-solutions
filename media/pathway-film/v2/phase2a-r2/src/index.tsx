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

// A single large world. Its path is never swapped: a moving stroke window
// travels over the same connected curve and stops on the official logo path.
const curves:Cubic[]=[];const events:Record<string,number>={};let pen:P=[230,745];
const curve=(b:P,c:P,d:P)=>{curves.push([pen,b,c,d]);pen=d;};
const event=(name:string)=>{events[name]=curves.length;};
curve([520,745],[675,780],[920,780]);
curve([1220,780],[1470,775],[1780,775]);event('intro');
curve([2010,775],[2130,740],[2340,720]);
curve([2600,690],[2800,690],[2990,690]);
curve([3290,690],[3480,710],[3670,760]);event('classes');
curve([3870,800],[4140,710],[4350,680]);
curve([4570,650],[4730,660],[4900,610]);
curve([5070,560],[5120,670],[5340,680]);
curve([5540,690],[5760,690],[5920,710]);event('levels');
// Turn down into the teaching surface; the approach stays below the text.
curve([6100,735],[6080,1120],[5730,1110]);
curve([5480,1100],[5380,820],[5586.39,784]);event('annotation-start');
curve([5600,784],[5620,784],[5637.65,784]);event('annotation');
curve([5755,784],[5700,1060],[5820,1100]);
curve([5960,1145],[6130,1120],[6160,1040]);
curve([6175,1000],[6170,989],[6197.81,989]);
curve([6225,989],[6260,989],[6290.34,989]);event('exchange');
curve([6550,989],[6840,900],[7070,850]);
curve([7310,805],[7400,765],[7550,765]);
curve([7740,765],[7890,790],[8080,815]);
curve([8310,845],[8530,845],[8780,820]);event('practice');
curve([9030,785],[9240,730],[9460,700]);
curve([9680,670],[9880,685],[10100,700]);
curve([10350,720],[10670,715],[11000,710]);event('goal');
curve([11240,715],[11300,770],[11520,775]);
curve([11820,780],[11960,775],[12200,740]);
curve([12430,715],[12650,720],[12900,750]);event('entry');
curve([13150,780],[13580,900],[13670,740]);
curve([13770,575],[13615,485],[13734.8,431.9]);event('logo-start');
// Original Pathway d: M8 49 c7.5-4.2 15.5-6.3 24-6.3 S48.5 44.8 56 49
const logo={x:13710,y:280,s:3.1};
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
const headKeys=[[0,0],[.2,0],[4.3,distance('intro')],[9.2,distance('classes')],[14.0,distance('levels')],[17.6,distance('annotation-start')],[18.7,distance('annotation')],[23.8,distance('exchange')],[28.8,distance('practice')],[33.5,distance('goal')],[37.8,distance('entry')],[40.0,distance('logo-start')],[40.65,L],[45,L]];

const Text:React.FC<React.SVGProps<SVGTextElement>>=({children,...props})=><text fontFamily="Outfit" fontWeight={500} fill={C.green} {...props}>{children}</text>;
const OriginalLogoBody=()=> <g fill="none" strokeLinecap="round" strokeLinejoin="round">
 <path d="M12 29.5C13.9 18.2 21.7 10 32 10s18.1 8.2 20 19.5" stroke="#D4AF37" strokeWidth="2"/>
 <path d="M23.8 43h16.4l-3-26.5H26.8z" fill="#EDF3DF" stroke="#103A35" strokeWidth="1.8"/>
 <path d="M27 16.5h10M25.8 12.5h12.4L35.5 8h-7z" fill="#FB8669" stroke="#103A35" strokeWidth="1.6"/>
 <path d="M29.5 23h5v6.5h-5zM29.5 35h5v8h-5z" fill="#103A35" stroke="#103A35" strokeWidth="1"/>
 <path d="M32 4.5V8M20.5 9.5l3.1 3M43.5 9.5l-3.1 3" stroke="#D4AF37" strokeWidth="2"/>
 <circle cx="32" cy="8" r="1.8" fill="#D4AF37" stroke="none"/>
</g>;

export const Prototype:React.FC<{stillTime:number|null}>=({stillTime=null})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=stillTime??frame/fps;
 const wantedCx=value(t,[[0,960],[3.8,960],[6.3,3000],[8.7,3000],[11.3,5050],[13.3,5050],[16.8,5650],[18.8,5650],[20.8,6100],[23.5,6100],[26,8200],[28.5,8200],[30.6,10300],[33.5,10300],[35.7,12200],[37.7,12200],[40.4,14100],[45,14100]]);
 const cy=value(t,[[0,540],[13.3,560],[16.8,710],[18.8,710],[20.8,840],[23.5,840],[26,600],[28.5,600],[30.6,540],[45,540]]);
 const scale=value(t,[[0,1],[13.3,1],[16.8,1.12],[18.8,1.12],[20.8,1],[45,1]]);
 const head=value(t,headKeys);
 const tip=pointAt(head);
 const cx=Math.max(tip[0]-760/scale,Math.min(wantedCx,tip[0]+760/scale));
 const tailLength=value(t,[[0,1550],[13.5,1700],[18.7,72],[20.8,880],[23.8,880],[26,1600],[37.8,1600],[40,450],[40.65,L-distance('logo-start')],[45,L-distance('logo-start')]]);
 const start=Math.max(0,head-tailLength),visible=head-start;
 const surface=p(t,14.0,16.3),a2=p(t,14,16.5);
 const logoReveal=p(t,40.05,40.9),endText=p(t,40.5,41.0);
 const colorT=p(t,39.8,40.65);
 const color='#'+[1,3,5].map(k=>Math.round(mix(parseInt('#C76F56'.slice(k,k+2),16),parseInt('#FB8669'.slice(k,k+2),16),colorT)).toString(16).padStart(2,'0')).join('');
 return <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{display:'block',background:C.cream}}>
 <defs>
  <clipPath id="site"><rect x="1090" y="168" width="670" height="450" rx="24"/></clipPath>
  <clipPath id="course"><rect x="5100" y="380" width={1450*surface} height="840" rx="26"/></clipPath>
  <clipPath id="first-word"><rect x="5300" y="635" width="440" height={150*p(t,17,17.5)}/></clipPath>
  <clipPath id="teacher"><rect x="5750" y="510" width="790" height={130*p(t,19.05,19.55)}/></clipPath>
  <clipPath id="second"><rect x="5900" y="830" width="600" height={155*p(t,19.8,20.25)}/></clipPath>
  <clipPath id="body"><rect x="0" y={52*(1-logoReveal)} width="64" height={55*logoReveal}/></clipPath>
  <clipPath id="end-text"><rect x="12800" y="250" width="2450" height={740*endText}/></clipPath>
 </defs>
 <g transform={`translate(960 540) scale(${scale}) translate(${-cx} ${-cy})`}>
  {/* Institute and actual website, not an invented application UI. */}
  <Text x="240" y="355" fontSize="140" fontWeight="700" letterSpacing="-4">Pathway</Text>
  <Text x="248" y="410" fontFamily="DM Sans" fontSize="26" letterSpacing="5" fill={C.muted}>LANGUAGE SOLUTIONS</Text>
  <Text x="240" y="535" fontSize="72">Francés, contigo.</Text>
  <Text x="248" y="625" fontFamily="DM Sans" fontSize="32" fill={C.muted}>pathway-languages.com</Text>
  <g clipPath="url(#site)"><image href={staticFile('pathway-site-hero.jpg')} x="1090" y="168" width="670" height="460" preserveAspectRatio="xMidYMid meet"/></g>

  <Text x="3000" y="425" textAnchor="middle" fontSize="116" fontWeight="600">Clases privadas.</Text>
  <Text x="3000" y="565" textAnchor="middle" fontSize="68">En vivo, con tu profesor.</Text>

  <Text x="4450" y="535" textAnchor="middle" fontSize="112">A1</Text>
  <Text x="5350" y="535" textAnchor="middle" fontSize="112">B1</Text>
  <Text x="5800" y="535" textAnchor="middle" fontSize="112">B2</Text>

  <g clipPath="url(#course)">
   <rect x="5100" y="380" width="1450" height="840" rx="26" fill={C.paper}/>
   <Text x="5310" y="500" fontFamily="DM Sans" fontSize="34" fill={C.muted}>· Unité 1</Text>
   <g clipPath="url(#first-word)"><Text x="5320" y="760" fontSize="96">je parle</Text></g>
   <g clipPath="url(#teacher)"><Text x="5760" y="615" fontFamily="DM Sans" fontSize="66">Con tu profesor</Text></g>
   <g clipPath="url(#second)"><Text x="5920" y="965" fontSize="96">tu parles</Text></g>
  </g>
  <Text x={mix(4824,5230,a2)} y={mix(490,500,a2)} fontSize={mix(126,42,a2)} fontWeight="600">A2</Text>
  {/* The single A2 node remains above the growing surface. */}
  <Text x="7790" y="460" textAnchor="middle" fontSize="86">Práctica guiada.</Text>
  <Text x="8570" y="630" textAnchor="middle" fontSize="86">Feedback útil.</Text>

  <Text x="10300" y="315" textAnchor="middle" fontFamily="DM Sans" fontSize="42" letterSpacing="5" fill={C.muted}>OBJETIVO</Text>
  <Text x="10300" y="535" textAnchor="middle" fontSize="190" fontWeight="600">NCLC 7</Text>
  <Text x="10300" y="635" textAnchor="middle" fontFamily="DM Sans" fontSize="56">TEF · TCF Canada</Text>

  <Text x="12200" y="415" textAnchor="middle" fontSize="94">Tu punto de partida.</Text>
  <Text x="12200" y="570" textAnchor="middle" fontSize="76">Un plan para ti.</Text>

  <path id="continuous-travelling-line" d={d} fill="none" stroke={color} strokeWidth={mix(7,7.44,colorT)/scale} strokeLinecap="round" strokeLinejoin="round" pathLength={L} strokeDasharray={`${Math.max(.001,visible)} ${L+1}`} strokeDashoffset={-start} visibility={t>.2?'visible':'hidden'}/>

  <g transform={`translate(${logo.x} ${logo.y}) scale(${logo.s})`} clipPath="url(#body)"><OriginalLogoBody/></g>
  <g clipPath="url(#end-text)">
   <Text x="13942" y="430" fontSize="136" fontWeight="700" letterSpacing="-4">Pathway</Text>
   <Text x="13950" y="480" fontFamily="DM Sans" fontSize="24" letterSpacing="5" fill={C.muted}>LANGUAGE SOLUTIONS</Text>
   <Text x="14100" y="630" textAnchor="middle" fontSize="75">Tu francés tiene un camino.</Text>
   <rect x="13790" y="728" width="620" height="112" rx="14" fill={C.green}/>
   <Text x="14100" y="804" textAnchor="middle" fontFamily="DM Sans" fontSize="56" fontWeight="600" fill={C.paper}>Evalúa tu nivel</Text>
   <Text x="14100" y="909" textAnchor="middle" fontFamily="DM Sans" fontSize="46" fill={C.muted}>pathway-languages.com</Text>
  </g>
 </g>
 </svg>;
};
registerRoot(()=> <Composition id="Pathway-R2-45s" component={Prototype} width={1920} height={1080} fps={30} durationInFrames={1350} defaultProps={{stillTime:null as number|null}}/>);
