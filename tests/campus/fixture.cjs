const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const stub = `
window.__mock = { failReview: false, delayReview: 0, reviews: [] };
window.supabase = { createClient() { return {
 auth: { getSession: async () => ({data:{session:null}}), onAuthStateChange() {} },
 from() { const q = new Proxy({}, {get(_, key) {if(key==='then') return resolve => Promise.resolve({data:[],error:null}).then(resolve); return () => q; }}); return q; },
 async rpc(name, args) {
  if(name==='review_card') {window.__mock.reviews.push(args); await new Promise(r=>setTimeout(r,window.__mock.delayReview)); return window.__mock.failReview ? {error:{message:'Test: save failed'}} : {data:{goal_reached:false},error:null};}
  return {data:null,error:null};
 }
}; }};
`;
const harness = `
window.__motionTest = {
 setup() {
  A.session = { user: { id: 'fixture-student' } };
  A.profile = {id:'fixture-student',full_name:'Sofía Martínez',role:'student',level:'A2',xp_total:1295,daily_goal:50,streak:4,freezes:1,timezone:'UTC',exam:'ambos',target_month:'2027-06',onboarded_at:'2026-01-01',last_goal_day:addDays(todayKey(),-1)};
  A.teacher = {full_name:'Ryan'};
  A.units = [{id:'fixture-u1',number:1,title:'Le présent et les verbes en -er',level:'A2',cards:[{front:'parler',back:'hablar'}]}, {id:'fixture-u2',number:2,title:'Être et avoir',level:'A2',cards:[]}];
  A.unitInfo = {'fixture-u1':{count:5,validated:5},'fixture-u2':{count:5,validated:5}};
  A.xp = [{amount:30,created_at:new Date().toISOString()}];
  A.due = 3; A.weekly = null; A.gate = false; A.levelVal = [];
  R.loaded = true; R.reviewed = 0; R.busy = false;
  R.cards = [
   {id:'c1',front:'Je travaille à Montréal.',back:'Trabajo en Montreal.',note:'Travailler : un verbe en -er.',source:'unit',source_label:'Le présent',reps:0,interval_days:1,ease:2.5},
   {id:'c2',front:'Nous avons un projet.',back:'Tenemos un proyecto.',source:'unit',source_label:'Être et avoir',reps:1,interval_days:1,ease:2.5},
   {id:'c3',front:'Elle est arrivée hier.',back:'Llegó ayer.',source:'unit',source_label:'Passé composé',reps:1,interval_days:1,ease:2.5}
  ];
  showApp();
 },
 earn() {A.xp.push({amount:20,created_at:new Date().toISOString()}); A.profile.xp_total+=20; render(false);},
 state: () => ({cards:R.cards.map(c=>c.id),busy:R.busy,reviewed:R.reviewed,search:A.search}),
 render,
 result() {
  $('#lesson').hidden=false; $('#toast').classList.remove('show');
  $('#lessonBody').innerHTML='<div class="end"><h2>¡Unidad superada!</h2><div class="end-stats"><div style="background:var(--butter);color:var(--butter-ink)"><small>XP ganados</small><b id="xpCount"></b></div></div><div class="end-list"><div class="end-item">'+checkMarkup('Tarea entregada',true,'fixture-check',true)+'</div></div></div>';
  countUp($('#xpCount'),125);
 }
};
`;
async function fixture(page) {
 const app = await fs.readFile(path.join(root,'campus/app.js'),'utf8');
 await page.addInitScript(() => {
  localStorage.setItem('campus-tour-student','1'); localStorage.setItem('campus-tour-teacher','1');
 });
 await page.route('**/supabase.js', r=>r.fulfill({contentType:'application/javascript',body:stub}));
 await page.route('**/*.supabase.co/**', r=>r.abort());
 await page.route('**/campus/app.js', r=>r.fulfill({contentType:'application/javascript',body:app+'\n'+harness}));
 await page.goto((process.env.PATHWAY_PREVIEW_URL || 'http://127.0.0.1:4173')+'/campus/');
 await page.locator('#login').waitFor({state:'visible'});
 await page.evaluate(()=>window.__motionTest.setup());
 await page.evaluate(()=>document.fonts.ready);
}
module.exports={fixture};
