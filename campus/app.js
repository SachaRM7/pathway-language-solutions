// Campus Pathway · application élève et professeur, branchée sur Supabase.
// Interface en espagnol ; contenu travaillé en français. Données : voir campus/db/001_init.sql.

const CFG = window.CAMPUS_CONFIG;
const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

/* ───────────── Helpers ───────────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const icon = (n, c = '') => `<svg class="icon ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = n => Number(n || 0).toLocaleString('es-ES', { useGrouping: 'always' });
const firstName = n => (n || '').trim().split(/\s+/)[0] || '';
const initials = n => (n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const pad2 = n => String(n).padStart(2, '0');

let tt;
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 3600); };
const fail = (e, msg = 'Algo salió mal. Inténtalo de nuevo.') => { console.error(e); toast(msg); };

const levelInfo = xp => { let lvl = 1, need = 80, acc = 0; while (xp >= acc + need) { acc += need; lvl++; need = 60 + 20 * lvl; } return { lvl, into: xp - acc, need }; };

/* Dates in the student's time zone */
const tzOf = () => (A.profile && A.profile.timezone) || 'America/Lima';
const dayKey = (d, tz = tzOf()) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const addDays = (key, n) => { const d = new Date(key + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const fmtDate = (d, opts, tz = tzOf()) => new Intl.DateTimeFormat('es', { timeZone: tz, ...opts }).format(d);

/* ───────────── State ───────────── */
const A = {
  session: null, profile: null, teacher: null,
  units: [], unitInfo: {}, runs: [], assignments: [], xp: [], due: 0, badges: [], myBadges: new Set(),
  staff: { overview: [], errors: [] }, seg: null, simExam: null
};
const isStaff = () => A.profile && ['teacher', 'admin'].includes(A.profile.role);

const SEGMENTS = {
  A2: [
    { letter: 'A', name: 'Rappels & vie quotidienne', desc: 'Présent, auxiliaires, connecteurs simples, futur proche, expressions avec être / avoir, impératif et recommandations.' },
    { letter: 'B', name: 'Raconter au passé', desc: 'Passé composé, accord du participe, négation et interrogation, marqueurs temporels, pronominaux, imparfait et choix des deux temps.' },
    { letter: 'C', name: 'Décrire & caractériser', desc: 'Adjectifs, comparatif et superlatif, pronoms COD / COI / toniques / en / y, démonstratifs et possessifs, portrait et description.' },
    { letter: 'D', name: 'Exprimer & relier ses idées', desc: 'Relatifs, futur simple, hypothèse, conditionnel, conseil, opinion, cause, but, gérondif, connecteurs logiques et production écrite.' }
  ]
};
const segmentsFor = lvl => SEGMENTS[lvl] || ['A', 'B', 'C', 'D'].map(l => ({ letter: l, name: `Segmento ${l}`, desc: '' }));
const UNIT_ART = { 'a2-01': { big: '-er', stickers: ['nous parl<em>ons</em>', 'ils travaill<em>ent</em>'] } };
const LEVELS = ['A1', 'A2', 'B1', 'B2'];

/* ───────────── Speech (browser voice until recordings exist) ───────────── */
let frVoice = null;
const canSpeak = 'speechSynthesis' in window;
const pickVoice = () => { try { const vs = speechSynthesis.getVoices(); frVoice = vs.find(v => /^fr[-_]FR/i.test(v.lang)) || vs.find(v => /^fr/i.test(v.lang)) || null; } catch (e) { /* ignore */ } };
if (canSpeak) { pickVoice(); try { speechSynthesis.onvoiceschanged = pickVoice; } catch (e) { /* ignore */ } }
const speak = (text, rate = .92, btn) => {
  if (!canSpeak) return false;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR'; u.rate = rate; if (frVoice) u.voice = frVoice;
    if (btn) { btn.classList.add('speaking'); u.onend = u.onerror = () => btn.classList.remove('speaking'); }
    speechSynthesis.speak(u); return true;
  } catch (e) { return false; }
};

/* ───────────── Boot & auth ───────────── */
let booted = false;
async function boot() {
  const hash = location.hash;
  const authError = /error_description=/.test(hash) ? decodeURIComponent((hash.match(/error_description=([^&]+)/) || [])[1] || '').replace(/\+/g, ' ') : '';
  const { data } = await sb.auth.getSession();
  A.session = data.session;
  if (/access_token=|error=/.test(location.hash)) history.replaceState(null, '', location.pathname);
  $('#boot').hidden = true;
  if (!A.session) return showLogin(authError ? 'El enlace ya no es válido. Pide uno nuevo.' : '');
  try { await loadAll(); } catch (e) { fail(e, 'No pudimos cargar tu campus. Revisa tu conexión.'); }
  $('#login').hidden = true;
  if (!isStaff() && !A.profile.onboarded_at) return openOnboarding(true);
  showApp();
}
sb.auth.onAuthStateChange((event, session) => {
  if (!booted) return;
  if (event === 'SIGNED_IN' && !A.session) { A.session = session; boot(); }
  if (event === 'SIGNED_OUT') { A.session = null; A.profile = null; $('#app').hidden = true; $('#tabbar').hidden = true; showLogin(''); }
});

let loginEmail = '';
function showLogin(err, sent = false) {
  $('#app').hidden = true; $('#tabbar').hidden = true; $('#login').hidden = false;
  const box = $('#loginBox');
  if (!sent) {
    box.innerHTML = `<h1>Entra a tu campus</h1>
      <p class="sub">Te enviamos un enlace de acceso a tu correo. Sin contraseña.</p>
      ${err ? `<p class="form-error" role="alert">${esc(err)}</p>` : ''}
      <form id="loginForm" class="form" novalidate>
        <label class="field" for="loginEmail">Tu correo<input id="loginEmail" type="email" autocomplete="email" inputmode="email" required value="${esc(loginEmail)}" placeholder="nombre@correo.com"></label>
        <button class="btn btn-dark" type="submit">Recibir mi enlace<span class="arrow">${icon('arrow')}</span></button>
      </form>`;
    $('#loginForm').onsubmit = async e => {
      e.preventDefault();
      const email = $('#loginEmail').value.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) return showLogin('Escribe un correo válido, por ejemplo nombre@correo.com.');
      loginEmail = email;
      const btn = e.submitter || $('#loginForm button'); btn.disabled = true; btn.textContent = 'Enviando…';
      const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname } });
      if (error) {
        const m = /signups? not allowed|user not found/i.test(error.message) ? 'Este correo no tiene acceso al campus. Pide a Pathway que te invite.'
          : /seconds|rate/i.test(error.message) ? 'Espera un minuto antes de pedir otro enlace.'
          : 'No pudimos enviar el enlace. Inténtalo de nuevo.';
        return showLogin(m);
      }
      showLogin('', true);
    };
    setTimeout(() => $('#loginEmail')?.focus(), 50);
  } else {
    box.innerHTML = `<h1>Revisa tu correo</h1>
      <p class="sub">Enviamos un enlace a <b>${esc(loginEmail)}</b>. Ábrelo en este dispositivo para entrar.</p>
      ${err ? `<p class="form-error" role="alert">${esc(err)}</p>` : ''}
      <form id="codeForm" class="form" novalidate>
        <label class="field" for="loginCode">¿El correo trae un código de 6 cifras? Escríbelo aquí<input id="loginCode" class="code-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}"></label>
        <button class="btn btn-dark" type="submit">Entrar con el código</button>
      </form>
      <button class="ob-link" type="button" id="otherEmail" style="justify-self:start">Usar otro correo</button>`;
    $('#otherEmail').onclick = () => showLogin('');
    $('#codeForm').onsubmit = async e => {
      e.preventDefault();
      const token = $('#loginCode').value.replace(/\D/g, '');
      if (token.length !== 6) return showLogin('El código tiene 6 cifras.', true);
      const { error } = await sb.auth.verifyOtp({ email: loginEmail, token, type: 'email' });
      if (error) return showLogin('Código incorrecto o caducado. Pide un enlace nuevo.', true);
    };
  }
}

async function loadAll() {
  const uid = A.session.user.id;
  const [prof, units, ex, runs, asg, xp, due, badges, mine, teacher] = await Promise.all([
    sb.from('profiles').select('*').eq('id', uid).single(),
    sb.from('units').select('id,level,segment,number,title,manual_time').order('level').order('number'),
    sb.from('exercises').select('unit_id,status'),
    sb.from('lesson_runs').select('unit_id,total,first_try_correct,xp,finished_at').eq('user_id', uid).order('finished_at'),
    sb.from('assignment_students').select('completed_at, assignment:assignments(id,unit_id,due_on,note,created_at)').eq('student_id', uid),
    sb.from('xp_events').select('amount,created_at').eq('user_id', uid).gte('created_at', new Date(Date.now() - 9 * 864e5).toISOString()),
    sb.from('review_cards').select('id', { count: 'exact', head: true }).eq('user_id', uid).lte('due_at', new Date().toISOString()),
    sb.from('badges').select('*').order('position'),
    sb.from('user_badges').select('badge_id').eq('user_id', uid),
    sb.rpc('my_teacher')
  ]);
  for (const r of [prof, units, ex, runs, asg, xp, badges, mine]) if (r.error) throw r.error;
  A.profile = prof.data;
  A.units = units.data;
  A.unitInfo = {};
  for (const e of ex.data) { const u = A.unitInfo[e.unit_id] ||= { count: 0, validated: 0 }; u.count++; if (e.status === 'validated') u.validated++; }
  A.runs = runs.data;
  A.assignments = asg.data.filter(a => a.assignment).map(a => ({ ...a.assignment, completed_at: a.completed_at }));
  A.xp = xp.data;
  A.due = due.count || 0;
  A.badges = badges.data;
  A.myBadges = new Set(mine.data.map(b => b.badge_id));
  A.teacher = teacher.data || null;
  if (isStaff()) await loadStaff();
}
async function loadStaff() {
  const [ov, er] = await Promise.all([sb.rpc('teacher_overview'), sb.rpc('teacher_common_errors')]);
  if (ov.error) throw ov.error;
  A.staff.overview = ov.data || [];
  A.staff.errors = er.data || [];
}
async function refresh() { try { await loadAll(); } catch (e) { fail(e); } }

/* Derived values */
const todayKey = () => dayKey(new Date());
const todayXp = () => A.xp.filter(e => dayKey(new Date(e.created_at)) === todayKey()).reduce((s, e) => s + e.amount, 0);
function liveStreak() {
  const p = A.profile; if (!p.last_goal_day) return 0;
  const t = todayKey();
  if (p.last_goal_day >= addDays(t, -1)) return p.streak;
  if (p.last_goal_day === addDays(t, -2) && p.freezes > 0) return p.streak;
  return 0;
}
const doneToday = () => A.profile.last_goal_day === todayKey();
const doneUnits = () => new Set(A.runs.map(r => r.unit_id));
const playable = u => isStaff() ? (A.unitInfo[u.id]?.count || 0) > 0 : (A.unitInfo[u.id]?.validated || 0) > 0;
const unitById = id => A.units.find(u => u.id === id);
function nextUnit() {
  const done = doneUnits();
  return A.units.filter(u => u.level === A.profile.level).find(u => !done.has(u.id) && playable(u)) || null;
}
const openHomework = () => A.assignments.filter(a => !a.completed_at).sort((a, b) => (a.due_on || '9999').localeCompare(b.due_on || '9999'));

/* ───────────── Navigation ───────────── */
const SNAV = [
  { id: 'inicio', label: 'Inicio', icon: 'home' },
  { id: 'ruta', label: 'Mi ruta', icon: 'route' },
  { id: 'repasar', label: 'Repasar', icon: 'cards', count: () => A.due },
  { id: 'simulacros', label: 'Simulacros', icon: 'timer' },
  { id: 'logros', label: 'Logros', icon: 'trophy' }
];
const TNAV = [
  { id: 'grupo', label: 'Mi grupo', icon: 'users' },
  { id: 'contenido', label: 'Contenido', icon: 'book' }
];
const navItems = () => isStaff() ? TNAV : SNAV;
const VIEWS = { inicio: viewInicio, ruta: viewRuta, repasar: viewRepasar, simulacros: viewSimulacros, logros: viewLogros, grupo: viewGrupo, contenido: viewContenido };

function currentView() {
  const id = location.hash.slice(1);
  return navItems().some(n => n.id === id) ? id : navItems()[0].id;
}
function renderNav(cur) {
  const items = navItems();
  $('#sideNav').innerHTML = items.map(it => { const c = it.count ? it.count() : 0; return `<a href="#${it.id}" ${it.id === cur ? 'aria-current="page"' : ''}>${icon(it.icon)}${it.label}${c ? `<span class="count num">${c > 99 ? '99+' : c}</span>` : ''}</a>`; }).join('');
  $('#tabbar').hidden = false;
  $('#tabbar').innerHTML = items.map(it => { const c = it.count ? it.count() : 0; return `<a href="#${it.id}" aria-label="${it.label}" ${it.id === cur ? 'aria-current="page"' : ''}>${icon(it.icon)}${c && it.id !== cur ? '<span class="dot"></span>' : ''}</a>`; }).join('');
  const p = A.profile;
  $('#promo').innerHTML = isStaff()
    ? `<span>${p.role === 'admin' ? 'Administración' : 'Profesor'}</span><b>${esc(p.full_name)}</b><span>${A.staff.overview.length} alumno${A.staff.overview.length === 1 ? '' : 's'}</span>`
    : (p.next_class_at ? `<span>Próxima clase</span><b>${esc(cap(fmtDate(new Date(p.next_class_at), { weekday: 'long', day: 'numeric', month: 'short' })))}</b><span>${fmtDate(new Date(p.next_class_at), { hour: '2-digit', minute: '2-digit' })}${A.teacher ? ' · ' + esc(A.teacher.full_name) : ''}</span>`
      : `<span>Tu objetivo</span><b>NCLC 7</b><span>${esc(EXAMS[p.exam] || 'Examen por definir')}</span>`);
  $('#sideFoot').innerHTML = `<span>${esc(firstName(p.full_name))}</span><button type="button" data-action="menu">Mi cuenta</button>`;
}
function topBar(id, title, sub) {
  const p = A.profile;
  return `<header class="top"><div><h1 id="${id}">${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>
    <div class="top-tools">
      <div class="menu-wrap"><button type="button" class="round ava-btn" data-action="menu" aria-label="Mi cuenta" aria-haspopup="true"><span class="ava">${esc(initials(p.full_name))}</span></button><div id="menuSlot"></div></div>
    </div></header>`;
}
function render() {
  if (!A.profile) return;
  const id = currentView();
  renderNav(id);
  $('#main').innerHTML = VIEWS[id]();
  bindView(id);
}
function showApp() {
  $('#login').hidden = true; $('#ob').hidden = true; $('#app').hidden = false;
  document.body.classList.remove('no-scroll');
  render();
}
window.addEventListener('hashchange', () => { flipped = false; if (A.profile && !$('#app').hidden) { render(); window.scrollTo({ top: 0 }); } });

function toggleMenu() {
  const slot = $('#menuSlot'); if (!slot) return;
  if (slot.innerHTML) { slot.innerHTML = ''; return; }
  const p = A.profile;
  slot.innerHTML = `<div class="menu" role="menu"><div class="who"><b>${esc(p.full_name)}</b>${esc(A.session.user.email)}</div>
    ${isStaff() ? '' : `<button type="button" role="menuitem" data-action="plan">${icon('target')}Mi plan</button>`}
    <button type="button" role="menuitem" data-action="logout">${icon('x')}Cerrar sesión</button></div>`;
}

/* ───────────── Student views ───────────── */
const EXAMS = { tef: 'TEF Canada', tcf: 'TCF Canada', ambos: 'TEF y TCF Canada', nose: 'Examen por definir' };
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaLabel = v => { if (!v || v === 'nose') return 'Por definir'; const [y, m] = v.split('-'); return `${MONTHS_L[+m - 1]} de ${y}`; };

const ring = (val, max, label) => {
  const r = 50, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, max ? val / max : 0));
  return `<svg class="ring" viewBox="0 0 112 112" role="img" aria-label="${label}"><circle class="track" cx="56" cy="56" r="${r}"/><circle class="val" cx="56" cy="56" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - p)).toFixed(1)}"/><text x="56" y="64" text-anchor="middle" class="num">${Math.round(p * 100)}%</text></svg>`;
};

function heroTile() {
  const hw = openHomework()[0];
  const unit = hw ? unitById(hw.unit_id) : nextUnit();
  if (!unit) {
    return `<article class="tile peach hero c-8"><div><span class="pill">${icon('check')}Todo al día</span><h2>No hay lecciones nuevas por ahora</h2><p>Tu profesor publicará la siguiente unidad muy pronto.</p></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-dark" href="#repasar">Repasar mis tarjetas<span class="arrow">${icon('arrow')}</span></a></div><span class="hero-art" aria-hidden="true">✓</span></article>`;
  }
  const art = UNIT_ART[unit.id] || { big: pad2(unit.number), stickers: [] };
  const n = A.unitInfo[unit.id]?.[isStaff() ? 'count' : 'validated'] || 0;
  const due = hw && hw.due_on ? fmtDate(new Date(hw.due_on + 'T12:00:00Z'), { weekday: 'long' }, 'UTC') : '';
  const tag = hw ? `${icon('pen')}Tarea${A.teacher ? ' de ' + esc(firstName(A.teacher.full_name)) : ''}${due ? ' · para el ' + due : ''}` : `${icon('route')}Siguiente unidad`;
  return `<article class="tile peach hero c-8">
    <div><span class="pill">${tag}</span><h2>${esc(unit.title)}</h2><p>Unidad ${unit.number} · ${unit.level} · ${n} ejercicio${n === 1 ? '' : 's'} · ${Math.max(5, n + 2)} min</p></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;position:relative;z-index:1"><button class="btn btn-dark" data-start="${unit.id}">Empezar la lección<span class="arrow">${icon('arrow')}</span></button></div>
    ${art.stickers.map((s, i) => `<span class="sticker s${i + 1}">${s}</span>`).join('')}
    <span class="hero-art" aria-hidden="true">${esc(art.big)}</span></article>`;
}

function viewInicio() {
  const p = A.profile, li = levelInfo(p.xp_total), tx = todayXp(), left = Math.max(0, p.daily_goal - tx), streak = liveStreak();
  const t = todayKey();
  const days = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));
  const goalDays = new Set();
  for (const d of days) { const s = A.xp.filter(e => dayKey(new Date(e.created_at)) === d).reduce((a, e) => a + e.amount, 0); if (s >= p.daily_goal) goalDays.add(d); }
  if (doneToday()) goalDays.add(t);
  const vals = days.map(d => A.xp.filter(e => dayKey(new Date(e.created_at)) === d).reduce((a, e) => a + e.amount, 0));
  const maxV = Math.max(100, ...vals);
  const dayLetter = d => cap(fmtDate(new Date(d + 'T12:00:00Z'), { weekday: 'narrow' }, 'UTC'));
  const dayShort = d => d === t ? 'Hoy' : cap(fmtDate(new Date(d + 'T12:00:00Z'), { weekday: 'short' }, 'UTC').replace('.', ''));
  const done = doneUnits();
  const lvIdx = LEVELS.indexOf(p.level);
  const nc = p.next_class_at ? new Date(p.next_class_at) : null;
  return `<section class="view" aria-labelledby="h-inicio">
  ${topBar('h-inicio', `Hola, ${esc(firstName(p.full_name))}`, `${esc(cap(fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' })))} · ${left ? `${left} XP para tu meta de hoy` : 'Meta de hoy cumplida'}`)}
  <div class="bento">
    ${heroTile()}
    <article class="tile butter c-4">
      <div class="streak-top"><div><p class="label" style="color:var(--butter-ink)">Racha</p><p class="huge num" style="margin-top:10px">${streak}</p><p style="font-weight:700;margin-top:6px">día${streak === 1 ? '' : 's'} seguido${streak === 1 ? '' : 's'}</p></div><span class="flame">${icon('flame')}</span></div>
      <div class="week">${days.map(d => { const on = goalDays.has(d), today = d === t; return `<div><i class="${on ? 'on' : ''} ${today ? 'is-today' : ''}">${on ? icon('check') : ''}</i>${dayLetter(d)}</div>`; }).join('')}</div>
    </article>
    <article class="tile lilac c-4">
      <p class="label" style="color:var(--lilac-ink)">Meta de hoy</p>
      <div class="goal-row" style="margin-top:14px">${ring(tx, p.daily_goal, `Meta diaria: ${tx} de ${p.daily_goal} XP`)}
        <div><p class="big num">${tx}<span style="font-size:18px;color:var(--lilac-ink)"> / ${p.daily_goal} XP</span></p><p style="margin-top:8px;font-weight:600;color:color-mix(in srgb,var(--lilac-ink) 70%,var(--ink))">Nivel ${li.lvl} · ${fmt(p.xp_total)} XP</p></div></div>
    </article>
    <article class="tile c-8">
      <div class="tile-head"><h2>Camino al NCLC 7</h2><a class="pill ghost" href="https://pathway-languages.com/calculador.html" target="_blank" rel="noopener">Calculador CRS ${icon('arrow-up')}</a></div>
      <div class="levels">${LEVELS.map((l, i) => {
        const n = A.units.filter(u => u.level === l && done.has(u.id)).length;
        const pct = i < lvIdx ? 100 : n / 64 * 100;
        return `<div class="lv ${i === lvIdx ? 'cur' : ''}"><b>${l}</b><div class="track"><i style="width:${pct.toFixed(1)}%"></i></div><small class="num">${i < lvIdx ? 'Completado' : `${n} de 64 unidades`}</small></div>`;
      }).join('')}<span class="lv-goal">${icon('target')}NCLC 7</span></div>
      <p class="muted" style="margin-top:20px;font-size:14px"><b style="color:var(--ink)">${esc(EXAMS[p.exam] || EXAMS.nose)}${p.target_month && p.target_month !== 'nose' ? ' · ' + fechaLabel(p.target_month) : ''}.</b> NCLC 7 en las cuatro competencias abre las rondas Express Entry por competencia en francés.</p>
    </article>
    <article class="tile c-5">
      <div class="tile-head"><h2>Tu semana</h2><span class="pill ghost num">${vals.reduce((a, b) => a + b, 0)} XP</span></div>
      <div class="bars">${vals.map((v, i) => `<div class="${days[i] === t ? 'on' : ''}"><i class="${days[i] === t ? 'today' : v >= p.daily_goal ? 'hit' : ''}" style="height:${Math.max(10, v / maxV * 110)}px">${v ? `<span class="num">${v}</span>` : ''}</i>${dayShort(days[i])}</div>`).join('')}</div>
    </article>
    <article class="tile c-4">
      <div class="tile-head"><h2>Próxima clase</h2><span class="pill ghost">${icon('video')}En vivo</span></div>
      ${nc ? `<div class="class-row"><div class="date-block"><small>${esc(fmtDate(nc, { month: 'short' }).replace('.', '').toUpperCase())}</small><b>${fmtDate(nc, { day: 'numeric' })}</b></div><div><h3>${esc(cap(fmtDate(nc, { weekday: 'long' })))} · ${fmtDate(nc, { hour: '2-digit', minute: '2-digit' })}</h3><p class="muted" style="font-size:14px;margin-top:4px">Tu hora local</p></div></div>`
        : `<p class="muted" style="font-size:14px">Tu profesor aún no programó la próxima clase.</p>`}
      <div class="teacher"><span class="ava sm">${esc(initials(A.teacher?.full_name || 'P'))}</span><b>${esc(A.teacher?.full_name || 'Tu profesor')}</b>${nc && p.class_link ? `<a class="btn btn-dark btn-sm" style="margin-left:auto" href="${esc(p.class_link)}" target="_blank" rel="noopener">Unirse</a>` : ''}</div>
    </article>
    <article class="tile mint c-3">
      <p class="label" style="color:var(--mint-ink)">Repaso</p>
      <p class="big num" style="margin-top:12px">${A.due}<span style="font-size:18px;color:var(--mint-ink)"> tarjeta${A.due === 1 ? '' : 's'}</span></p>
      <p style="margin-top:8px;font-weight:600;font-size:14px">Vocabulario y errores que vuelven justo antes de que los olvides.</p>
      <a class="btn btn-dark btn-sm" style="margin-top:16px" href="#repasar">Repasar</a>
    </article>
  </div></section>`;
}

function viewRuta() {
  const p = A.profile, segs = segmentsFor(p.level);
  if (A.seg == null) { const nu = nextUnit(); A.seg = nu ? Math.max(0, segs.findIndex(s => s.letter === nu.segment)) : 0; }
  const s = segs[A.seg], from = A.seg * 16 + 1, done = doneUnits(), nu = nextUnit();
  const cells = [];
  for (let n = from; n < from + 16; n++) {
    const u = A.units.find(x => x.level === p.level && x.number === n);
    let cls = 'soon', label = `Unidad ${n}, pronto`, inner = pad2(n);
    if (u && done.has(u.id)) { cls = 'done'; inner = icon('check'); label = `Unidad ${n}, hecha`; }
    else if (u && nu && u.id === nu.id) { cls = 'cur'; label = `Unidad ${n}, siguiente`; }
    else if (u && playable(u)) { cls = ''; label = `Unidad ${n}`; }
    cells.push(`<button class="u ${cls}" ${u && playable(u) ? `data-start="${u.id}"` : `data-toast="La unidad ${n} todavía no está disponible."`} aria-label="${label}">${inner}</button>`);
  }
  cells.push(`<button class="u exam" data-toast="El examen ${s.letter} se desbloquea al terminar las 16 unidades del segmento." aria-label="Examen ${s.letter}">${icon('trophy')}</button>`);
  const featured = nu && nu.segment === s.letter ? nu : null;
  const fInfo = featured ? A.unitInfo[featured.id] : null;
  return `<section class="view" aria-labelledby="h-ruta">
  ${topBar('h-ruta', 'Mi ruta', `Manual ${p.level} · 64 unidades en 4 segmentos`)}
  <div class="seg-tabs" role="group" aria-label="Segmento">${segs.map((x, i) => `<button type="button" data-seg="${i}" aria-pressed="${i === A.seg}"><b>${x.letter}</b>${esc(x.name)}</button>`).join('')}</div>
  ${featured ? `<article class="tile peach unit-hero">
      <div><span class="pill">Unidad actual</span><h2>${esc(featured.title)}</h2>
        <div style="margin-top:22px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-dark" data-start="${featured.id}">Empezar<span class="arrow">${icon('arrow')}</span></button></div></div>
      <div class="unit-meta"><p class="unit-no">${pad2(featured.number)}</p><div><span>En el campus</span>${fInfo?.[isStaff() ? 'count' : 'validated'] || 0} ejercicios</div>${featured.manual_time ? `<div><span>En el manual</span>${esc(featured.manual_time)}</div>` : ''}</div>
    </article>` : ''}
  <article class="tile">
    <div class="tile-head"><div><h2>Segmento ${s.letter} · ${esc(s.name)}</h2>${s.desc ? `<p class="muted" style="font-size:14px;margin-top:6px;max-width:70ch">${esc(s.desc)}</p>` : ''}</div></div>
    <div class="units">${cells.join('')}</div>
    <div class="legend"><span><i style="background:var(--ink)"></i>Hecha</span><span><i style="background:var(--coral)"></i>Siguiente</span><span><i style="background:var(--soft);box-shadow:inset 0 0 0 1px var(--line)"></i>Pronto</span><span><i style="background:var(--butter)"></i>Examen ${s.letter}</span></div>
  </article></section>`;
}

/* Review */
let flipped = false;
const R = { cards: [], loaded: false, reviewed: 0, busy: false };
async function loadReview() {
  const { data, error } = await sb.from('review_cards').select('*').eq('user_id', A.session.user.id).lte('due_at', new Date().toISOString()).order('due_at').limit(60);
  if (error) return fail(error);
  R.cards = data; R.loaded = true; R.reviewed = 0;
  if (currentView() === 'repasar') render();
}
const previewInterval = (c, g) => {
  if (g === 0) return '1 min';
  const d = g === 1 ? (c.reps === 0 ? 0.0042 : Math.max(1, c.interval_days * 1.2)) : g === 2 ? (c.reps === 0 ? 1 : c.reps === 1 ? 3 : c.interval_days * c.ease) : (c.reps === 0 ? 4 : c.interval_days * c.ease * 1.3);
  if (d < 1) return `${Math.round(d * 1440)} min`;
  if (d < 30) return `${Math.round(d)} día${Math.round(d) === 1 ? '' : 's'}`;
  return `${Math.round(d / 30)} mes${Math.round(d / 30) === 1 ? '' : 'es'}`;
};
function viewRepasar() {
  if (!R.loaded) { loadReview(); return `<section class="view">${topBar('h-rep', 'Repasar', '')}<div class="saving"><span class="logo-mark"><svg class="icon"><use href="#i-cards"/></svg></span>Cargando tus tarjetas…</div></section>`; }
  const card = R.cards[0];
  const stage = card ? `<div class="flash-wrap"><div class="flash ${flipped ? 'flipped' : ''}" id="flash" role="button" tabindex="0" aria-label="Tarjeta, toca para girar">
        <div class="face"><span class="pill ${card.source === 'class' ? 'err' : ''}">${esc(card.source_label || 'Repaso')}</span>
          <button class="round speak" type="button" data-say="${esc(card.source === 'unit' ? card.front : card.back)}" aria-label="Escuchar">${icon('speaker')}</button>
          ${card.source !== 'unit' ? '<p class="hint">Corrige o completa</p>' : ''}<p class="term ${card.source === 'class' ? 'err' : ''}">${esc(card.front)}</p><p class="hint">Toca o pulsa espacio para girar</p></div>
        <div class="face back"><span class="pill" style="background:var(--mint);color:var(--mint-ink)">Respuesta</span><p class="term">${esc(card.back)}</p>${card.note ? `<p class="muted" style="font-size:15px">${esc(card.note)}</p>` : ''}</div>
      </div></div>
      <div class="rate" id="rate" ${flipped ? '' : 'hidden'}>${['Otra vez', 'Difícil', 'Bien', 'Fácil'].map((l, g) => `<button type="button" data-rate="${g}">${l}<small>${previewInterval(card, g)}</small></button>`).join('')}</div>`
    : `<div class="face" style="position:relative;min-height:300px"><span class="flame" style="background:var(--mint);color:var(--mint-ink)">${icon('check')}</span><p class="term">Todo repasado</p><p class="muted">${R.reviewed ? `<span class="num">${R.reviewed}</span> tarjetas repasadas. ` : ''}Las siguientes vuelven cuando toque.</p><a class="btn btn-dark btn-sm" href="#inicio">Volver al inicio</a></div>`;
  return `<section class="view" aria-labelledby="h-rep">
  ${topBar('h-rep', 'Repasar', 'Cada tarjeta vuelve justo antes de que la olvides')}
  <div class="review"><article class="tile lilac stage">${stage}</article>
    <div style="display:grid;gap:16px">
      <article class="tile"><p class="label">Para hoy</p><p class="huge num" style="margin-top:10px">${R.cards.length}</p><p class="muted" style="margin-top:6px;font-size:14px">tarjeta${R.cards.length === 1 ? '' : 's'}</p></article>
      <article class="tile"><p style="font-size:14px" class="muted">Vienen del vocabulario de cada unidad, de tus errores en las lecciones y de los que tus profesores anotan en clase.</p></article>
    </div></div></section>`;
}
function flip() { flipped = !flipped; $('#flash')?.classList.toggle('flipped', flipped); const r = $('#rate'); if (r) r.hidden = !flipped; }
async function rate(g) {
  if (R.busy || !R.cards.length) return;
  R.busy = true;
  const c = R.cards[0];
  const { data, error } = await sb.rpc('review_card', { p_card: c.id, p_grade: g });
  R.busy = false;
  if (error) return fail(error);
  R.cards.shift();
  if (g === 0) R.cards.splice(Math.min(2, R.cards.length), 0, { ...c, reps: 0 }); else R.reviewed++;
  A.due = Math.max(0, A.due - (g === 0 ? 0 : 1));
  if (data && data.goal_reached) { A.profile.streak = data.streak; A.profile.last_goal_day = todayKey(); toast(`Meta de hoy cumplida · racha de ${data.streak} día${data.streak === 1 ? '' : 's'}`); }
  if (g > 0) A.xp.push({ amount: 2, created_at: new Date().toISOString() });
  flipped = false; render();
}

function viewSimulacros() {
  const e = A.profile.exam;
  const choices = e === 'tef' ? ['tef'] : e === 'tcf' ? ['tcf'] : ['tef', 'tcf'];
  if (!choices.includes(A.simExam)) A.simExam = choices[0];
  const dur = A.simExam === 'tcf' ? ['35 min', '60 min', '60 min', '12 min'] : ['40 min', '60 min', '60 min', '15 min'];
  const sk = [['Compréhension orale', 'speaker', 'sky'], ['Compréhension écrite', 'book', 'lilac'], ['Expression écrite', 'pen', 'peach'], ['Expression orale', 'mic', 'butter']];
  return `<section class="view" aria-labelledby="h-sim">
  ${topBar('h-sim', 'Simulacros', 'Pruebas cronometradas en las condiciones del examen, con una estimación NCLC por competencia')}
  ${choices.length > 1 ? `<div class="seg-tabs" role="group" aria-label="Examen">${choices.map(x => `<button type="button" data-exam="${x}" aria-pressed="${x === A.simExam}"><b>${x === 'tcf' ? 'C' : 'E'}</b>${x === 'tcf' ? 'TCF Canada' : 'TEF Canada'}</button>`).join('')}</div>` : ''}
  <div class="exam-grid">${sk.map(([k, ic, c], i) => `<article class="tile ${c} exam"><div class="row"><span class="pill">${icon(ic)}${dur[i]}</span><span class="pill">Pronto</span></div>
    <div><h3>${k}</h3><p style="font-size:14px;margin-top:6px;color:var(--ink-2)">Formato ${A.simExam === 'tcf' ? 'TCF' : 'TEF'} Canada</p></div></article>`).join('')}</div>
  <p class="faint" style="font-size:13px">Los simulacros llegan en la próxima etapa del campus. Mientras tanto, tu profesor organiza los simulacros en clase.</p>
  </section>`;
}

function viewLogros() {
  const p = A.profile, li = levelInfo(p.xp_total);
  const perfect = A.runs.filter(r => r.first_try_correct === r.total).length;
  return `<section class="view" aria-labelledby="h-log">
  ${topBar('h-log', 'Logros', 'Las insignias marcan pasos reales hacia tu examen')}
  <div class="bento">
    <article class="tile c-6"><div class="lvl-card"><div class="date-block" style="background:var(--peach);color:var(--peach-ink);width:84px;height:84px"><small>NIVEL</small><b>${li.lvl}</b></div>
      <div style="flex:1;min-width:0"><p class="big num">${fmt(p.xp_total)} XP</p><div class="xp-track"><i style="width:${(li.into / li.need * 100).toFixed(0)}%"></i></div><p class="muted num" style="font-size:13px;margin-top:8px">${li.need - li.into} XP para el nivel ${li.lvl + 1}</p></div></div></article>
    <article class="tile butter c-3"><p class="label" style="color:var(--butter-ink)">Mejor racha</p><p class="huge num" style="margin-top:10px">${p.best_streak}</p><p style="font-weight:700;margin-top:4px">días · ahora ${liveStreak()}</p></article>
    <article class="tile mint c-3"><p class="label" style="color:var(--mint-ink)">Lecciones</p><p class="huge num" style="margin-top:10px">${A.runs.length}</p><p style="font-weight:700;margin-top:4px">${perfect} sin errores</p></article>
  </div>
  <article class="tile"><div class="tile-head"><h2>Insignias</h2><span class="pill ghost num">${A.myBadges.size} de ${A.badges.length}</span></div>
    <div class="badges">${A.badges.map(b => { const has = A.myBadges.has(b.id); return `<div class="badge ${has ? '' : 'locked'}"><span class="medal" style="background:var(--${b.color});color:var(--${b.color}-ink)">${icon(has ? b.icon : 'lock')}</span><b>${esc(b.name)}</b><span>${esc(b.description)}</span></div>`; }).join('')}</div>
  </article></section>`;
}

/* ───────────── Staff views ───────────── */
const daysSince = d => d ? Math.floor((Date.now() - new Date(d).getTime()) / 864e5) : null;
function viewGrupo() {
  const ov = A.staff.overview;
  const active = ov.filter(s => s.week_xp > 0).length;
  const open = ov.reduce((a, s) => a + s.homework_open, 0);
  const acc = ov.filter(s => s.week_accuracy != null);
  const avgAcc = acc.length ? Math.round(acc.reduce((a, s) => a + s.week_accuracy, 0) / acc.length) : null;
  const alerts = [];
  for (const s of ov) {
    const ds = daysSince(s.last_activity);
    if (!s.onboarded) alerts.push({ s, kind: 'warn', text: 'Todavía no completó la bienvenida del campus.' });
    else if (ds == null || ds >= 4) alerts.push({ s, kind: 'bad', text: ds == null ? 'Aún no practicó en el campus.' : `${ds} días sin practicar.` });
    if (s.week_accuracy != null && s.week_accuracy < 60) alerts.push({ s, kind: 'warn', text: `${s.week_accuracy} % de aciertos esta semana.` });
  }
  const units = A.units.filter(u => (A.unitInfo[u.id]?.validated || 0) > 0);
  const studentOpts = ov.map(s => `<option value="${s.id}">${esc(s.full_name)}</option>`).join('');
  const rows = ov.map(s => {
    const ds = daysSince(s.last_activity);
    const st = !s.onboarded ? '<span class="status warn">Sin empezar</span>' : ds == null || ds >= 4 ? '<span class="status bad">Inactivo</span>' : s.week_accuracy != null && s.week_accuracy < 60 ? '<span class="status warn">Dificultad</span>' : '<span class="status">Al día</span>';
    return `<tr><td><span class="who"><span class="ava sm">${esc(initials(s.full_name))}</span>${esc(s.full_name)}</span></td><td>${s.level}</td><td class="num">${s.streak ? `${s.streak} día${s.streak === 1 ? '' : 's'}` : '<span class="faint">—</span>'}</td><td>${ds == null ? '<span class="faint">Nunca</span>' : ds === 0 ? 'Hoy' : ds === 1 ? 'Ayer' : `Hace ${ds} días`}</td><td class="num">${s.homework_done} / ${s.homework_done + s.homework_open}</td><td>${st}</td></tr>`;
  }).join('');
  const now = new Date(Date.now() + 2 * 864e5); const localDefault = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}T18:00`;
  return `<section class="view" aria-labelledby="h-grupo">
  ${topBar('h-grupo', 'Mi grupo', 'Lo que pasó entre clases, antes de la próxima')}
  ${!ov.length ? `<article class="tile empty"><h2>Todavía no tienes alumnos asignados</h2><p class="muted">Cuando Pathway te asigne alumnos, aparecerán aquí con su progreso.</p></article>` : `
  <div class="bento">
    <article class="tile sky c-4 kpi"><p class="label" style="color:var(--sky-ink)">Activos esta semana</p><p class="big num">${active}<span style="font-size:20px;color:var(--sky-ink)"> / ${ov.length}</span></p></article>
    <article class="tile mint c-4 kpi"><p class="label" style="color:var(--mint-ink)">Tareas pendientes</p><p class="big num">${open}</p></article>
    <article class="tile peach c-4 kpi"><p class="label" style="color:var(--peach-ink)">Aciertos a la primera</p><p class="big num">${avgAcc == null ? '—' : avgAcc + '%'}</p></article>
    <article class="tile c-7"><div class="tile-head"><h2>Necesitan atención</h2></div>
      ${alerts.length ? `<div class="alerts">${alerts.map(a => `<div class="alert"><span class="ava">${esc(initials(a.s.full_name))}</span><p><b>${esc(a.s.full_name)}</b><br>${a.text}</p></div>`).join('')}</div>` : '<p class="muted">Todo el grupo está al día.</p>'}</article>
    <article class="tile c-5"><div class="tile-head"><h2>Errores frecuentes</h2><span class="pill ghost">30 días</span></div>
      ${A.staff.errors.length ? A.staff.errors.map(e => `<div class="err-row"><span>${esc(correctText({ type: e.type, ...e.payload }))}</span><span class="pill ghost num">${e.students} alumno${e.students === 1 ? '' : 's'}</span></div>`).join('') : '<p class="muted">Aún no hay errores registrados.</p>'}</article>
    <article class="tile"><div class="tile-head"><h2>Alumnos</h2></div><div class="table-wrap"><table><thead><tr><th>Alumno</th><th>Nivel</th><th>Racha</th><th>Última actividad</th><th>Tareas</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table></div></article>
    <article class="tile c-6"><div class="tile-head"><h2>Anotar un error de la clase</h2></div>
      <p class="muted" style="font-size:14px;margin:-6px 0 16px">Se convierte en una tarjeta de repaso del alumno.</p>
      <form id="errForm" class="form">
        <label class="field" for="errStudent">Alumno<select id="errStudent" required>${studentOpts}</select></label>
        <div class="form-2"><label class="field" for="errWrong">Lo que dijo<input id="errWrong" required maxlength="300" placeholder="J'ai allé au cinéma."></label><label class="field" for="errRight">Corrección<input id="errRight" required maxlength="300" placeholder="Je suis allé au cinéma."></label></div>
        <label class="field" for="errWhy">Explicación<input id="errWhy" maxlength="500" placeholder="Aller forma el passé composé con être."></label>
        <button class="btn btn-dark" type="submit">${icon('plus')}Añadir al repaso</button>
      </form></article>
    <article class="tile c-6"><div class="tile-head"><h2>Asignar una tarea</h2></div>
      ${units.length ? `<form id="hwForm" class="form">
        <div class="form-2"><label class="field" for="hwUnit">Unidad<select id="hwUnit" required>${units.map(u => `<option value="${u.id}">${u.level} · Unidad ${u.number} · ${esc(u.title)}</option>`).join('')}</select></label>
          <label class="field" for="hwDate">Para el<input id="hwDate" type="date"></label></div>
        <div class="field">Alumnos<div class="chips">${ov.map((s, i) => `<label for="hw${i}"><input type="checkbox" id="hw${i}" value="${s.id}"><span>${esc(s.full_name)}</span></label>`).join('')}</div></div>
        <button class="btn btn-dark" type="submit">Asignar</button>
      </form>` : '<p class="muted">Publica al menos una unidad en «Contenido» para poder asignarla.</p>'}</article>
    <article class="tile c-6"><div class="tile-head"><h2>Programar la próxima clase</h2></div>
      <form id="classForm" class="form">
        <label class="field" for="clStudent">Alumno<select id="clStudent" required>${studentOpts}</select></label>
        <div class="form-2"><label class="field" for="clAt">Fecha y hora (tu hora local)<input id="clAt" type="datetime-local" required value="${localDefault}"></label>
          <label class="field" for="clLink">Enlace de la clase<input id="clLink" type="url" placeholder="https://zoom.us/j/…"></label></div>
        <button class="btn btn-dark" type="submit">Guardar</button>
      </form></article>
  </div>`}
  </section>`;
}

function viewContenido() {
  const levels = [...new Set(A.units.map(u => u.level))];
  return `<section class="view" aria-labelledby="h-cont">
  ${topBar('h-cont', 'Contenido', 'Prueba cada unidad y publícala cuando esté validada. Los alumnos solo ven las unidades publicadas.')}
  ${levels.map(l => `<article class="tile"><div class="tile-head"><h2>Nivel ${l}</h2></div>
    ${A.units.filter(u => u.level === l).map(u => { const inf = A.unitInfo[u.id] || { count: 0, validated: 0 }; const live = inf.count && inf.validated === inf.count;
      return `<div class="unit-row"><span class="no">${pad2(u.number)}</span><div class="meta"><b>${esc(u.title)}</b><span>${inf.count} ejercicio${inf.count === 1 ? '' : 's'}${u.manual_time ? ' · manual: ' + esc(u.manual_time) : ''}</span></div>
        <span class="state-chip ${live ? 'live' : 'draft'}">${live ? 'Publicada' : 'Borrador'}</span>
        ${inf.count ? `<button class="btn btn-light btn-sm" data-preview="${u.id}">Probar</button><button class="btn ${live ? 'btn-light' : 'btn-dark'} btn-sm" data-publish="${u.id}" data-status="${live ? 'draft' : 'validated'}">${live ? 'Volver a borrador' : 'Publicar'}</button>` : ''}</div>`; }).join('')}
  </article>`).join('') || '<article class="tile"><p class="muted">Todavía no hay unidades.</p></article>'}
  </section>`;
}

/* ───────────── Events ───────────── */
function bindView(id) {
  if (id === 'grupo') {
    const ef = $('#errForm');
    if (ef) ef.onsubmit = async e => {
      e.preventDefault();
      const { error } = await sb.rpc('add_class_error', { p_student: $('#errStudent').value, p_wrong: $('#errWrong').value.trim(), p_right: $('#errRight').value.trim(), p_note: $('#errWhy').value.trim() });
      if (error) return fail(error);
      toast(`Tarjeta añadida al repaso de ${$('#errStudent').selectedOptions[0].text}.`); ef.reset();
    };
    const hf = $('#hwForm');
    if (hf) hf.onsubmit = async e => {
      e.preventDefault();
      const ids = $$('#hwForm input[type=checkbox]:checked').map(c => c.value);
      if (!ids.length) return toast('Elige al menos un alumno.');
      const { error } = await sb.rpc('create_assignment', { p_unit: $('#hwUnit').value, p_due: $('#hwDate').value || null, p_note: '', p_students: ids });
      if (error) return fail(error);
      toast(`Tarea asignada a ${ids.length} alumno${ids.length > 1 ? 's' : ''}.`); await refresh(); render();
    };
    const cf = $('#classForm');
    if (cf) cf.onsubmit = async e => {
      e.preventDefault();
      const at = new Date($('#clAt').value);
      if (isNaN(at)) return toast('Elige una fecha y hora.');
      const { error } = await sb.rpc('set_next_class', { p_student: $('#clStudent').value, p_at: at.toISOString(), p_link: $('#clLink').value.trim() });
      if (error) return fail(error);
      toast('Clase guardada. El alumno la verá en su inicio.'); cf.reset();
    };
  }
}

document.addEventListener('click', async e => {
  const t = e.target.closest('[data-start],[data-toast],[data-say],[data-rate],[data-seg],[data-exam],[data-action],[data-preview],[data-publish],#flash');
  if (!t) { const slot = $('#menuSlot'); if (slot && slot.innerHTML && !e.target.closest('.menu')) slot.innerHTML = ''; return; }
  if (t.matches('[data-say]')) { e.stopPropagation(); if (!speak(t.dataset.say, .9, t)) toast('Este navegador no tiene voz francesa.'); return; }
  if (t.matches('[data-start]')) return startLesson(t.dataset.start, false);
  if (t.matches('[data-preview]')) return startLesson(t.dataset.preview, true);
  if (t.matches('[data-toast]')) return toast(t.dataset.toast);
  if (t.matches('[data-seg]')) { A.seg = +t.dataset.seg; render(); return; }
  if (t.matches('[data-exam]')) { A.simExam = t.dataset.exam; render(); return; }
  if (t.matches('[data-rate]')) return rate(+t.dataset.rate);
  if (t.id === 'flash') return flip();
  if (t.matches('[data-publish]')) {
    t.disabled = true;
    const { error } = await sb.rpc('set_unit_status', { p_unit: t.dataset.publish, p_status: t.dataset.status });
    if (error) { t.disabled = false; return fail(error); }
    toast(t.dataset.status === 'validated' ? 'Unidad publicada: los alumnos ya pueden hacerla.' : 'Unidad devuelta a borrador.');
    await refresh(); render(); return;
  }
  const a = t.dataset.action;
  if (a === 'menu') { e.stopPropagation(); if (!$('#menuSlot')) location.hash = navItems()[0].id; toggleMenu(); return; }
  if (a === 'logout') { await sb.auth.signOut(); return; }
  if (a === 'plan') { $('#menuSlot').innerHTML = ''; return openOnboarding(false); }
});
document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (!$('#lesson').hidden) return lessonKeys(e, tag);
  if (!$('#ob').hidden) return;
  if (e.key === 'Escape') { const slot = $('#menuSlot'); if (slot) slot.innerHTML = ''; }
  if (currentView() === 'repasar' && R.cards.length && !['input', 'textarea', 'select'].includes(tag)) {
    if (e.key === ' ') { e.preventDefault(); flip(); }
    if (flipped && /^[1-4]$/.test(e.key)) rate(+e.key - 1);
  }
});

/* ───────────── Onboarding ───────────── */
const monthList = () => { const now = new Date(); const out = []; for (let i = 1; i <= 18; i++) { const d = new Date(now.getFullYear(), now.getMonth() + i, 1); out.push({ v: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`, m: d.getMonth(), y: d.getFullYear() }); } return out; };
const MOTIVOS = { rp: 'Residencia permanente', estudios: 'Estudiar en Canadá', trabajo: 'Trabajar en francés', otro: 'Proyecto personal' };
const RITMOS = { 30: '10 min al día', 50: '15 min al día', 80: '25 min al día' };
const OB = [
  { id: 'hola', c: 'peach', word: 'Bonjour' },
  { id: 'motivo', c: 'lilac', word: 'Pourquoi ?', st: [['Express Entry', 'NCLC 7'], ['Québec', 'PEQ, PSTQ']], key: 'motive', title: '¿Para qué aprendes francés?', sub: 'Elegimos los temas y los ejemplos según tu proyecto.',
    opts: [{ v: 'rp', t: 'Residencia permanente', d: 'Express Entry y programas provinciales', ic: 'target' }, { v: 'estudios', t: 'Estudiar en Canadá', d: 'Universidad, college o cégep', ic: 'book' }, { v: 'trabajo', t: 'Trabajar en francés', d: 'Entrevistas, correos y reuniones', ic: 'users' }, { v: 'otro', t: 'Otro proyecto', d: 'Familia, viajes o gusto personal', ic: 'sparkle' }] },
  { id: 'examen', c: 'sky', word: 'TEF · TCF', st: [['TEF Canada', '4 pruebas'], ['TCF Canada', '4 pruebas']], key: 'exam', title: '¿Qué examen vas a presentar?', sub: 'IRCC acepta los dos. Tus simulacros seguirán el formato que elijas, y puedes cambiarlo después.',
    opts: [{ v: 'ambos', t: 'Los dos', d: 'Lo que hace la mayoría de nuestros alumnos', ic: 'cards', rec: true }, { v: 'tef', t: 'TEF Canada', d: 'Simulacros con el formato del TEF', ic: 'timer' }, { v: 'tcf', t: 'TCF Canada', d: 'Simulacros con el formato del TCF', ic: 'timer' }, { v: 'nose', t: 'Aún no lo sé', d: 'Lo decides con tu profesor', ic: 'users' }] },
  { id: 'fecha', c: 'butter', word: String(new Date().getFullYear() + 1), st: [['Fecha objetivo', 'aproximada']], key: 'target_month', title: '¿Cuándo quieres presentarlo?', sub: 'Una fecha aproximada basta para organizar tu ritmo.' },
  { id: 'nivel', c: 'mint', word: 'A2', st: [['Nivel de partida', 'según tu test']], key: 'level', title: 'Tu nivel de partida', sub: 'El que indicó tu test de nivel o tu profesor. Corrígelo si hace falta.' },
  { id: 'ritmo', c: 'peach', word: '15 min', st: [['Meta diaria', 'tu racha']], key: 'daily_goal', title: '¿Cuánto tiempo al día?', sub: 'Tu meta diaria. Cumplirla mantiene tu racha.',
    opts: [{ v: 30, t: '10 min al día', d: 'Tranquilo · 30 XP', ic: 'timer' }, { v: 50, t: '15 min al día', d: 'Regular · 50 XP', ic: 'timer', rec: true }, { v: 80, t: '25 min al día', d: 'Intenso · 80 XP', ic: 'flame' }] },
  { id: 'plan', c: 'lilac', word: 'NCLC 7', st: [['Tu plan', 'listo']] }
];
let ob = { i: 0, p: {}, first: true, saving: false };
function openOnboarding(first) {
  const p = A.profile;
  ob = { i: first ? 0 : 1, first, saving: false, p: { motive: p.motive, exam: p.exam, target_month: p.target_month, level: p.level, daily_goal: p.onboarded_at ? p.daily_goal : null, reminder: p.reminder, reminder_channel: p.reminder_channel } };
  $('#login').hidden = true; $('#app').hidden = true; $('#tabbar').hidden = true;
  $('#ob').hidden = false; document.body.classList.add('no-scroll'); renderOb();
}
function obWord(step) {
  if (step.id === 'fecha' && ob.p.target_month && ob.p.target_month !== 'nose') { const [y, m] = ob.p.target_month.split('-'); return `${MONTHS[+m - 1]} ${y.slice(2)}`; }
  if (step.id === 'nivel') return ob.p.level || 'A2';
  if (step.id === 'ritmo' && ob.p.daily_goal) return RITMOS[ob.p.daily_goal].replace(' al día', '');
  if (step.id === 'examen' && ob.p.exam === 'tef') return 'TEF';
  if (step.id === 'examen' && ob.p.exam === 'tcf') return 'TCF';
  return step.word;
}
const obReady = step => !step.key || ob.p[step.key] != null;
function renderOb() {
  const step = OB[ob.i], p = A.profile;
  const stickers = step.id === 'hola' ? [[p.full_name, A.teacher ? `Invitado por ${firstName(A.teacher.full_name)}` : 'Bienvenido'], [p.level, 'Tu nivel de partida']] : step.st;
  const art = $('#obArt');
  art.style.background = `var(--${step.c})`;
  art.innerHTML = `<span class="ob-logo"><span class="logo-mark"><svg class="icon"><use href="#i-route"/></svg></span>Pathway</span>
    ${stickers.map((s, i) => `<span class="ob-sticker o${i + 1}">${esc(s[0])}<small>${esc(s[1])}</small></span>`).join('')}
    <span class="ob-word" aria-hidden="true">${esc(obWord(step))}</span>`;
  $('#obSteps').innerHTML = OB.map((_, i) => `<i class="${i <= ob.i ? 'on' : ''}"></i>`).join('');
  $('#obBack').disabled = ob.i === 0 || (!ob.first && ob.i === 1);
  let h = '';
  if (step.id === 'hola') {
    h = `<h1>Hola, ${esc(firstName(p.full_name))}</h1><p class="sub">Este es tu campus de Pathway: ejercicios, repaso y simulacros entre tus clases. Dos minutos para preparar tu plan.</p>
      ${A.teacher ? `<div class="plan"><div><span>Tu profesor</span><b>${esc(A.teacher.full_name)}</b></div></div>` : ''}`;
  } else if (step.opts) {
    h = `<h1>${step.title}</h1><p class="sub">${step.sub}</p><div class="choices" role="radiogroup">${step.opts.map(o => { const on = String(ob.p[step.key]) === String(o.v); return `<button type="button" class="choice" role="radio" data-ob="${step.key}" data-v="${o.v}" aria-pressed="${on}" aria-checked="${on}"><span class="ci">${icon(o.ic)}</span><span><b>${o.t}</b><small>${o.d}</small></span><span class="end">${o.rec ? '<span class="tag-rec">Recomendado</span>' : ''}<span class="tick">${icon('check')}</span></span></button>`; }).join('')}</div>`;
    if (step.id === 'ritmo') {
      const rem = [['manana', 'Mañana · 8:00'], ['mediodia', 'Mediodía · 12:30'], ['noche', 'Noche · 20:00'], ['no', 'Sin recordatorio']];
      h += `<div class="ob-extra"><h3>Recordatorio diario</h3><div class="seg-chips">${rem.map(([v, t]) => `<button type="button" data-ob="reminder" data-v="${v}" aria-pressed="${ob.p.reminder === v}">${t}</button>`).join('')}</div>
        ${ob.p.reminder !== 'no' ? `<div class="seg-chips">${[['whatsapp', 'Por WhatsApp'], ['correo', 'Por correo']].map(([v, t]) => `<button type="button" data-ob="reminder_channel" data-v="${v}" aria-pressed="${ob.p.reminder_channel === v}">${t}</button>`).join('')}</div>` : ''}</div>`;
    }
  } else if (step.id === 'fecha') {
    h = `<h1>${step.title}</h1><p class="sub">${step.sub}</p><div class="months">${monthList().map(m => `<button type="button" class="month" data-ob="target_month" data-v="${m.v}" aria-pressed="${ob.p.target_month === m.v}">${MONTHS[m.m]}<small>${m.y}</small></button>`).join('')}
      <button type="button" class="month wide" data-ob="target_month" data-v="nose" aria-pressed="${ob.p.target_month === 'nose'}">Aún no tengo fecha</button></div>`;
  } else if (step.id === 'nivel') {
    h = `<h1>${step.title}</h1><p class="sub">${step.sub}</p><div class="lvl-pick">${LEVELS.map(l => `<button type="button" data-ob="level" data-v="${l}" aria-pressed="${ob.p.level === l}">${l}<small>${{ A1: 'Principiante', A2: 'Elemental', B1: 'Intermedio', B2: 'Avanzado' }[l]}</small></button>`).join('')}</div>
      <a class="ob-link" href="https://pathway-languages.com/test-placement.html" target="_blank" rel="noopener">Hacer el test de nivel</a>`;
  } else if (step.id === 'plan') {
    const q = ob.p;
    h = `<h1>Tu plan está listo</h1><p class="sub">${A.teacher ? esc(firstName(A.teacher.full_name)) + ' lo verá antes de tu próxima clase. ' : ''}Puedes cambiarlo cuando quieras desde «Mi cuenta».</p>
      <div class="plan">
        <div><span>Objetivo</span><b>${q.motive === 'rp' ? 'NCLC 7 en las 4 competencias' : MOTIVOS[q.motive]}</b></div>
        <div><span>Examen</span><b>${EXAMS[q.exam]}</b></div>
        <div><span>Fecha</span><b>${fechaLabel(q.target_month)}</b></div>
        <div><span>Nivel de partida</span><b>${q.level}</b></div>
        <div><span>Meta diaria</span><b>${RITMOS[q.daily_goal]}</b></div>
        <div><span>Recordatorio</span><b>${q.reminder === 'no' ? 'Ninguno' : `${{ manana: '8:00', mediodia: '12:30', noche: '20:00' }[q.reminder]} · ${q.reminder_channel === 'correo' ? 'correo' : 'WhatsApp'}`}</b></div>
      </div>`;
  }
  $('#obBody').innerHTML = `<div class="ob-q">${h}</div>`; $('#obBody').scrollTop = 0;
  const last = ob.i === OB.length - 1;
  $('#obFoot').innerHTML = `<span class="hint">${ob.i + 1} de ${OB.length}</span>${!ob.first ? '<button type="button" class="btn btn-light" id="obCancel">Cancelar</button>' : ''}<button type="button" class="btn btn-dark" id="obNext" ${obReady(step) && !ob.saving ? '' : 'disabled'}>${ob.saving ? 'Guardando…' : ob.i === 0 ? 'Empezar' : last ? (ob.first ? 'Entrar al campus' : 'Guardar mi plan') : 'Continuar'}<span class="arrow">${icon('arrow')}</span></button>`;
  $('#obNext').onclick = obNext;
  if ($('#obCancel')) $('#obCancel').onclick = () => { $('#ob').hidden = true; showApp(); };
}
async function obNext() {
  if (!obReady(OB[ob.i]) || ob.saving) return;
  if (ob.i < OB.length - 1) { ob.i++; return renderOb(); }
  ob.saving = true; renderOb();
  const q = ob.p;
  let tz = 'America/Lima'; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tz; } catch (e) { /* keep default */ }
  const patch = { motive: q.motive, exam: q.exam, target_month: q.target_month, level: q.level, daily_goal: q.daily_goal, reminder: q.reminder, reminder_channel: q.reminder_channel, timezone: tz };
  if (!A.profile.onboarded_at) patch.onboarded_at = new Date().toISOString();
  const { error } = await sb.from('profiles').update(patch).eq('id', A.profile.id);
  ob.saving = false;
  if (error) { renderOb(); return fail(error, 'No pudimos guardar tu plan. Inténtalo de nuevo.'); }
  Object.assign(A.profile, patch);
  $('#ob').hidden = true;
  if (ob.first) { location.hash = 'inicio'; showApp(); confetti(); toast(`Bienvenido al campus, ${firstName(A.profile.full_name)}.`); }
  else { showApp(); toast('Plan actualizado.'); }
}
$('#obBack').onclick = () => { if (ob.i > 0) { ob.i--; renderOb(); } };
$('#ob').addEventListener('click', e => {
  const b = e.target.closest('[data-ob]'); if (!b) return;
  const k = b.dataset.ob; let v = b.dataset.v; if (k === 'daily_goal') v = +v;
  ob.p[k] = v; renderOb();
  setTimeout(() => $(`#ob [data-ob="${k}"][data-v="${b.dataset.v}"]`)?.focus(), 0);
});
document.addEventListener('keydown', e => {
  if ($('#ob').hidden) return;
  if (e.key === 'Enter' && !(e.target.closest && e.target.closest('[data-ob],a,button,input'))) { e.preventDefault(); obNext(); }
});

/* ───────────── Lesson player ───────────── */
let L = null;
const lessonEl = $('#lesson'), body = $('#lessonBody'), foot = $('#lessonFoot'), footIn = $('#footIn');
async function startLesson(unitId, preview) {
  const unit = unitById(unitId); if (!unit) return;
  let q = sb.from('exercises').select('id,type,kind,payload,position,status').eq('unit_id', unitId).order('position');
  if (!preview) q = q.eq('status', 'validated');
  const { data, error } = await q;
  if (error) return fail(error);
  if (!data.length) return toast('Esta unidad todavía no tiene ejercicios.');
  const items = data.map(x => ({ ...x.payload, id: x.id, type: x.type, kind: x.kind, retry: false }));
  L = { unit, preview, items, queue: items.slice(), pos: 0, combo: 0, xp: 0, res: new Map(), start: Date.now(), answer: null, checked: false };
  lessonEl.hidden = false; document.body.classList.add('no-scroll');
  $('.preview-flag')?.remove();
  if (preview) document.body.insertAdjacentHTML('beforeend', '<span class="preview-flag">Vista previa · no se guarda nada</span>');
  renderEx();
}
function closeLesson() {
  try { speechSynthesis.cancel(); } catch (e) { /* ignore */ }
  lessonEl.hidden = true; document.body.classList.remove('no-scroll'); $('.preview-flag')?.remove(); L = null; render();
}
$('#lessonClose').addEventListener('click', () => {
  if (!L || L.finished || L.preview) return closeLesson();
  const box = document.createElement('div'); box.className = 'confirm';
  box.innerHTML = `<div class="tile"><h3 style="font-size:22px">¿Salir de la lección?</h3><p class="muted">Perderás el progreso de esta sesión.</p><div class="acts"><button class="btn btn-light btn-sm" id="stay">Seguir</button><button class="btn btn-dark btn-sm" id="leave">Salir</button></div></div>`;
  lessonEl.appendChild(box); $('#stay', box).focus();
  $('#stay', box).onclick = () => box.remove(); $('#leave', box).onclick = () => { box.remove(); closeLesson(); };
});
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const norm = s => s.toLowerCase().replace(/[’`´]/g, "'").replace(/[.!?¿¡,;:«»"]+/g, '').replace(/\s+/g, ' ').trim();
const noAcc = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const wave = () => `<div class="wave" aria-hidden="true">${Array.from({ length: 34 }, (_, i) => `<i style="height:${(18 + Math.abs(Math.sin(i * 1.7)) * 70 + (i % 3) * 6).toFixed(0)}%"></i>`).join('')}</div>`;

function setProgress() {
  const p = L.pos / L.queue.length * 100, el = $('#lessonProgress');
  el.firstElementChild.style.width = p + '%'; el.setAttribute('aria-valuenow', Math.round(p));
  $('#combo').innerHTML = L.combo >= 2 ? `<span class="pill num">${icon('flame')}${L.combo} seguidas</span>` : '';
}
function setFoot(mode, d = {}) {
  foot.className = 'l-foot' + (mode === 'good' ? ' good' : mode === 'bad' ? ' bad' : '');
  if (mode === 'check') {
    footIn.innerHTML = `<button class="btn btn-light" id="skipBtn" type="button">No lo sé</button><button class="btn btn-dark" id="checkBtn" type="button" disabled>Comprobar</button>`;
    $('#checkBtn').onclick = () => check(); $('#skipBtn').onclick = () => check(true);
  } else if (mode === 'none') footIn.innerHTML = `<p class="muted" style="font-size:14px">Toca un elemento de la izquierda y después su pareja.</p>`;
  else if (mode === 'saving') footIn.innerHTML = '';
  else if (mode === 'end') {
    footIn.innerHTML = `${L.preview ? '' : '<a class="btn btn-light" href="#repasar" id="toRev">Ver mi repaso</a>'}<button class="btn btn-dark" id="endBtn" type="button">Continuar</button>`;
    $('#endBtn').onclick = closeLesson; if ($('#toRev')) $('#toRev').onclick = () => { R.loaded = false; closeLesson(); };
  } else if (mode === 'retry') {
    footIn.innerHTML = `<p class="muted" style="font-size:14px">No pudimos guardar tu lección.</p><button class="btn btn-dark" id="retryBtn" type="button">Reintentar</button>`;
    $('#retryBtn').onclick = finish;
  } else {
    const g = mode === 'good';
    footIn.innerHTML = `<div class="fb" role="status"><span class="fb-ico">${icon(g ? 'check' : 'x')}</span><div><h3>${esc(d.title)}</h3>${!g && d.correct ? `<p class="correct">${esc(d.correct)}</p>` : ''}${d.explain ? `<p>${d.explain}</p>` : ''}</div></div>
      <button class="btn ${g ? 'btn-good' : 'btn-coral'}" id="nextBtn" type="button">Continuar</button>`;
    $('#nextBtn').onclick = next; $('#nextBtn').focus();
  }
}
const enable = on => { const b = $('#checkBtn'); if (b) b.disabled = !on; };
const optsHtml = ex => `<div class="options ${ex.two ? 'two' : ''}">${ex.options.map((o, i) => `<button class="opt" type="button" data-opt="${i}" aria-pressed="false"><kbd>${i + 1}</kbd>${esc(o)}</button>`).join('')}</div>`;

function renderEx() {
  setProgress();
  const ex = L.queue[L.pos]; L.answer = null; L.checked = false;
  const ic = ex.type === 'listen' || ex.type === 'dictation' ? 'speaker' : ex.type === 'match' ? 'puzzle' : ex.type === 'spot' ? 'search' : 'pen';
  const kind = `<span class="ex-kind">${icon(ic)}${ex.retry ? 'Segunda oportunidad · ' : ''}${esc(ex.kind)}</span>`;
  const audio = `<div class="audio-card"><button class="play" type="button" id="playN" aria-label="Escuchar">${icon('speaker')}</button>${wave()}<button class="play slow" type="button" id="playS" aria-label="Más despacio">${icon('turtle')}</button></div>`;
  let h = '';
  if (ex.type === 'choice') h = `${kind}<h2>${esc(ex.title)}</h2>${ex.fr ? `<div><p class="fr">${esc(ex.fr).replace('___', '<span class="blank"></span>')}</p>${ex.es ? `<p class="es" style="margin-top:8px">${esc(ex.es)}</p>` : ''}</div>` : ''}${optsHtml(ex)}`;
  else if (ex.type === 'listen') h = `${kind}<h2>${esc(ex.title)}</h2>${audio}${canSpeak ? '' : `<p class="transcript">${esc(ex.audio)}</p>`}<p class="fr" style="font-size:24px">${esc(ex.question)}</p>${optsHtml(ex)}`;
  else if (ex.type === 'type') h = `${kind}<h2>${esc(ex.title)}</h2><div class="type-line fr"><span>${esc(ex.before)}</span><input class="inline-input" id="typeIn" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Tu respuesta"><span>${esc(ex.after)}</span></div>${ex.hint ? `<p class="es">Verbo: <b>${esc(ex.hint)}</b></p>` : ''}`;
  else if (ex.type === 'dictation') h = `${kind}<h2>${esc(ex.title)}</h2>${audio}${canSpeak ? '' : `<p class="transcript">Sin voz francesa en este navegador: escribe en francés «${esc(ex.es)}».</p>`}
      <textarea class="answer-area" id="typeIn" rows="2" autocomplete="off" spellcheck="false" aria-label="Tu respuesta" placeholder="Escribe en francés"></textarea>
      <div class="keys" aria-label="Caracteres franceses">${['é', 'è', 'ê', 'à', 'ç', 'ù', 'ô', "'"].map(k => `<button type="button" data-key="${k}">${k}</button>`).join('')}</div>`;
  else if (ex.type === 'order') h = `${kind}<h2>${esc(ex.title)}</h2>${ex.es ? `<p class="es" style="font-size:18px;font-weight:600">«${esc(ex.es)}»</p>` : ''}<div class="line" id="line" aria-label="Tu frase"></div><div class="tiles">${ex.tiles.map((t, i) => `<button class="tile-w" type="button" data-tile="${i}">${esc(t)}</button>`).join('')}</div>`;
  else if (ex.type === 'match') { const r = shuffle(ex.pairs.map((p, i) => ({ t: p[1], i }))); h = `${kind}<h2>${esc(ex.title)}</h2><div class="match"><div class="match-col">${ex.pairs.map((p, i) => `<button class="opt" type="button" data-l="${i}">${esc(p[0])}</button>`).join('')}</div><div class="match-col">${r.map(x => `<button class="opt" type="button" data-r="${x.i}">${esc(x.t)}</button>`).join('')}</div></div>`; }
  else if (ex.type === 'spot') h = `${kind}<h2>${esc(ex.title)}</h2><div class="words">${ex.words.map((w, i) => `<button class="word" type="button" data-w="${i}" aria-pressed="false">${esc(w)}</button>`).join('')}</div>`;
  body.innerHTML = `<div class="ex">${h}</div>`; body.scrollTop = 0;
  setFoot(ex.type === 'match' ? 'none' : 'check');
  bind(ex);
}
function bind(ex) {
  $$('[data-opt]', body).forEach(b => b.onclick = () => { if (L.checked) return; $$('[data-opt]', body).forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); L.answer = +b.dataset.opt; enable(true); });
  const pn = $('#playN', body), ps = $('#playS', body);
  if (pn) pn.onclick = () => { if (!speak(ex.audio, .92, pn)) toast('Este navegador no tiene voz francesa.'); };
  if (ps) ps.onclick = () => { if (!speak(ex.audio, .62, ps)) toast('Este navegador no tiene voz francesa.'); };
  if (pn && ex.type === 'dictation' && canSpeak) setTimeout(() => speak(ex.audio, .92, pn), 350);
  const ti = $('#typeIn', body);
  if (ti) {
    ti.oninput = () => { L.answer = ti.value; enable(ti.value.trim().length > 0); };
    ti.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (L.answer && L.answer.trim() && !L.checked) check(); } };
    setTimeout(() => ti.focus(), 60);
    $$('[data-key]', body).forEach(k => k.onclick = () => { const s = ti.selectionStart ?? ti.value.length, en = ti.selectionEnd ?? ti.value.length; ti.value = ti.value.slice(0, s) + k.dataset.key + ti.value.slice(en); ti.focus(); ti.setSelectionRange(s + 1, s + 1); ti.oninput(); });
  }
  if (ex.type === 'order') {
    L.answer = []; const line = $('#line', body);
    const draw = () => {
      line.innerHTML = L.answer.map((x, p) => `<button class="tile-w" type="button" data-pos="${p}">${esc(ex.tiles[x])}</button>`).join('');
      $$('[data-tile]', body).forEach(b => b.disabled = L.answer.includes(+b.dataset.tile));
      $$('[data-pos]', line).forEach(b => b.onclick = () => { if (L.checked) return; L.answer.splice(+b.dataset.pos, 1); draw(); });
      enable(L.answer.length > 0);
    };
    $$('[data-tile]', body).forEach(b => b.onclick = () => { if (L.checked) return; L.answer.push(+b.dataset.tile); draw(); });
  }
  if (ex.type === 'match') {
    let pick = null, miss = 0, paired = 0; const Ls = $$('[data-l]', body), Rs = $$('[data-r]', body);
    Ls.forEach(b => b.onclick = () => { if (b.classList.contains('paired')) return; Ls.forEach(x => x.classList.remove('picked')); b.classList.add('picked'); pick = +b.dataset.l; });
    Rs.forEach(b => b.onclick = () => {
      if (b.classList.contains('paired')) return;
      if (pick === null) return toast('Elige primero un elemento de la izquierda.');
      const lb = Ls[pick];
      if (+b.dataset.r === pick) { lb.classList.remove('picked'); lb.classList.add('paired'); b.classList.add('paired'); lb.disabled = b.disabled = true; pick = null; if (++paired === ex.pairs.length) setTimeout(() => check(false, miss), 280); }
      else { miss++; [b, lb].forEach(x => { x.classList.remove('shake'); void x.offsetWidth; x.classList.add('shake'); }); }
    });
  }
  if (ex.type === 'spot') $$('[data-w]', body).forEach(b => b.onclick = () => { if (L.checked) return; $$('[data-w]', body).forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); L.answer = +b.dataset.w; enable(true); });
}
function correctText(ex) {
  switch (ex.type) {
    case 'choice': return ex.fr ? ex.fr.replace('___', ex.options[ex.answer]) : ex.options[ex.answer];
    case 'listen': return ex.options[ex.answer];
    case 'type': return `${ex.before} ${ex.answers[0]} ${ex.after}`;
    case 'dictation': return ex.audio;
    case 'order': return ex.answer.join(' ');
    case 'spot': return ex.words.map((w, i) => i === ex.wrong ? ex.fix : w).join(' ');
    case 'match': return ex.pairs.map(p => `${p[0]} ${p[1]}`).join(' · ');
    default: return '';
  }
}
function reviewCard(ex) {
  const front = ex.type === 'choice' && ex.fr ? ex.fr : ex.type === 'type' ? `${ex.before} ___ ${ex.after}${ex.hint ? ` (${ex.hint})` : ''}` : ex.type === 'listen' ? ex.question : (ex.type === 'order' || ex.type === 'dictation') && ex.es ? ex.es : ex.type === 'spot' ? ex.words.join(' ') : ex.title;
  const d = document.createElement('div'); d.innerHTML = ex.explain || '';
  return { exercise_id: ex.id, front, back: correctText(ex), note: d.textContent };
}
function check(skipped = false, miss = 0) {
  if (!L || L.checked) return;
  const ex = L.queue[L.pos]; let ok = false, note = '';
  if (skipped === true) ok = false;
  else if (ex.type === 'choice' || ex.type === 'listen') ok = L.answer === ex.answer;
  else if (ex.type === 'type' || ex.type === 'dictation') { const a = norm(L.answer || ''); ok = ex.answers.some(x => norm(x) === a); if (!ok && ex.answers.some(x => noAcc(norm(x)) === noAcc(a))) { ok = true; note = 'Ojo con los acentos: ' + correctText(ex); } }
  else if (ex.type === 'order') ok = L.answer.map(i => ex.tiles[i]).join(' ') === ex.answer.join(' ');
  else if (ex.type === 'spot') ok = L.answer === ex.wrong;
  else if (ex.type === 'match') ok = miss === 0;
  L.checked = true;
  if (ex.type === 'choice' || ex.type === 'listen') {
    $$('[data-opt]', body).forEach(b => { const i = +b.dataset.opt; b.disabled = true; if (i === ex.answer) b.classList.add('right'); else if (i === L.answer) b.classList.add('wrong'); });
    if (ex.type === 'listen') body.querySelector('.ex').insertAdjacentHTML('beforeend', `<p class="transcript">${esc(ex.audio)}</p>`);
  }
  if (ex.type === 'spot') { const w = $$('[data-w]', body)[ex.wrong]; w.classList.add('right'); w.textContent = ex.fix; $$('[data-w]', body).forEach(b => b.disabled = true); }
  const ti = $('#typeIn', body); if (ti) ti.disabled = true;
  // Result per exercise: first attempt decides first_try; a later success sets correct.
  const r = L.res.get(ex.id) || { exercise_id: ex.id, first_try: false, correct: false };
  if (!ex.retry) { r.first_try = ok; r.correct = ok || (ex.type === 'match'); }
  else if (ok) r.correct = true;
  L.res.set(ex.id, r);
  let g = 0;
  if (ex.type === 'match' && miss) { g = 5; L.combo = 0; }
  else if (ok) { L.combo++; g = ex.retry ? 5 : 10; const c = $('#combo'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
  else { L.combo = 0; if (!ex.retry) L.queue.push({ ...ex, retry: true }); }
  L.xp += g; setProgress(); if (g) floatXp(g);
  const T = ['¡Bien hecho!', '¡Exacto!', '¡Perfecto!', 'Muy bien'];
  if (ex.type === 'match') setFoot('good', { title: miss ? `Completado con ${miss} error${miss > 1 ? 'es' : ''}` : '¡Todo emparejado!', explain: ex.explain });
  else if (ok) setFoot('good', { title: note ? 'Casi perfecto' : L.combo >= 3 ? `${L.combo} seguidas` : T[Math.floor(Math.random() * T.length)], explain: note ? esc(note) : ex.explain });
  else setFoot('bad', { title: skipped === true ? 'La respuesta era' : 'Respuesta correcta', correct: correctText(ex), explain: (ex.explain || '') + (ex.retry ? '' : ' Volverá al final de la lección.') });
}
function floatXp(n) {
  const b = $('#nextBtn') || footIn, r = b.getBoundingClientRect();
  const el = document.createElement('div'); el.className = 'xp-float num'; el.textContent = `+${n} XP`;
  el.style.left = (r.left + r.width / 2 - 30) + 'px'; el.style.top = (r.top - 14) + 'px';
  document.body.appendChild(el); setTimeout(() => el.remove(), 1100);
}
function next() { if (!L) return; L.pos++; if (L.pos >= L.queue.length) return finish(); renderEx(); }

async function finish() {
  L.finished = true; $('#lessonProgress').firstElementChild.style.width = '100%'; $('#combo').innerHTML = '';
  const secs = Math.round((Date.now() - L.start) / 1000);
  const results = [...L.res.values()];
  const firstOk = results.filter(r => r.first_try).length;
  const acc = Math.round(firstOk / L.items.length * 100);
  const item = (c, ic, title, sub) => `<div class="end-item"><span class="medal" style="background:var(--${c});color:var(--${c}-ink)">${icon(ic)}</span><div><b>${title}</b><span class="muted">${sub}</span></div></div>`;
  const header = (xp, extra) => `<div class="end">
    <span class="ex-kind">${icon('sparkle')}Unidad ${L.unit.number} terminada</span>
    <h2>${acc === 100 ? '¡Lección perfecta!' : acc >= 75 ? '¡Muy buen trabajo!' : 'Lección completada'}</h2>
    <div class="end-stats">
      <div style="background:var(--butter);color:var(--butter-ink)"><small>XP ganados</small><b class="num" id="xpCount">+${xp}</b></div>
      <div style="background:var(--mint);color:var(--mint-ink)"><small>Aciertos</small><b class="num">${acc}%</b></div>
      <div style="background:var(--sky);color:var(--sky-ink)"><small>Tiempo</small><b class="num">${Math.floor(secs / 60)}:${pad2(secs % 60)}</b></div>
    </div><div class="end-list">${extra}</div></div>`;
  if (L.preview) {
    body.innerHTML = header(L.xp, item('butter', 'book', 'Vista previa', 'Nada se guardó. Los alumnos verán esta unidad cuando la publiques.'));
    setFoot('end'); return;
  }
  body.innerHTML = `<div class="saving"><span class="logo-mark"><svg class="icon"><use href="#i-route"/></svg></span>Guardando tu lección…</div>`;
  setFoot('saving');
  const errors = L.items.filter(ex => !(L.res.get(ex.id) || {}).first_try && ex.type !== 'match').map(reviewCard);
  const { data, error } = await sb.rpc('finish_lesson', { p_unit: L.unit.id, p_results: results, p_errors: errors, p_duration: secs });
  if (error) { console.error(error); body.innerHTML = ''; setFoot('retry'); return; }
  const badgeById = Object.fromEntries(A.badges.map(b => [b.id, b]));
  const extra = [
    data.goal_reached ? item('peach', 'flame', `Racha: ${data.streak_before} → ${data.streak} día${data.streak === 1 ? '' : 's'}`, 'Meta de hoy cumplida. Vuelve mañana.')
      : item('peach', 'flame', `${data.today_xp} / ${A.profile.daily_goal} XP hoy`, data.today_xp >= A.profile.daily_goal ? 'Meta de hoy ya cumplida.' : `Te faltan ${A.profile.daily_goal - data.today_xp} XP para tu meta de hoy.`),
    ...(data.badges || []).map(id => { const b = badgeById[id]; return b ? item(b.color, b.icon, `Insignia: ${esc(b.name)}`, esc(b.description)) : ''; }),
    data.cards ? item('lilac', 'cards', `${data.cards} tarjeta${data.cards > 1 ? 's' : ''} nueva${data.cards > 1 ? 's' : ''} en tu repaso`, 'Vocabulario de la unidad y tus errores.') : '',
    data.homework_done ? item('mint', 'check', 'Tarea entregada', A.teacher ? `${esc(firstName(A.teacher.full_name))} verá tu resultado antes de la clase.` : 'Tu profesor verá tu resultado.') : ''
  ].join('');
  body.innerHTML = header(data.xp, extra);
  setFoot('end');
  countUp($('#xpCount'), data.xp);
  confetti();
  R.loaded = false;
  refresh().then(() => { if (lessonEl.hidden) render(); });
}
function countUp(el, to) {
  if (reduced || !el) { if (el) el.textContent = '+' + to; return; }
  const t0 = performance.now(), d = 900;
  const step = t => { const p = Math.min(1, (t - t0) / d); el.textContent = '+' + Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function confetti() {
  if (reduced) return;
  const cv = $('#confetti'), ctx = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cs = getComputedStyle(document.documentElement);
  const cols = ['--coral', '--lilac-ink', '--mint-ink', '--butter-ink', '--sky-ink'].map(v => cs.getPropertyValue(v).trim());
  const P = Array.from({ length: 140 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 140, y: innerHeight * .3, vx: (Math.random() - .5) * 14, vy: -Math.random() * 13 - 4, r: Math.random() * 3, vr: (Math.random() - .5) * .3, w: 6 + Math.random() * 6, h: 4 + Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)] }));
  const t0 = performance.now();
  const f = t => { const el = t - t0; ctx.clearRect(0, 0, innerWidth, innerHeight); P.forEach(p => { p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.globalAlpha = Math.max(0, 1 - el / 2400); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); }); if (el < 2400) requestAnimationFrame(f); else ctx.clearRect(0, 0, innerWidth, innerHeight); };
  requestAnimationFrame(f);
}
function lessonKeys(e, tag) {
  if (!L) return;
  const cf = $('.confirm', lessonEl); if (cf) { if (e.key === 'Escape') cf.remove(); return; }
  if (e.key === 'Escape') return $('#lessonClose').click();
  if (tag === 'textarea' || tag === 'input') return;
  if (/^[1-4]$/.test(e.key) && !L.checked) { const b = $(`[data-opt="${+e.key - 1}"]`, body); if (b) b.click(); }
  if (e.key === 'Enter') {
    if (e.target.closest && e.target.closest('button') && !e.target.matches('#checkBtn,#nextBtn')) return;
    e.preventDefault();
    const n = $('#nextBtn'); if (n) return n.click();
    const c = $('#checkBtn'); if (c && !c.disabled) return c.click();
    const end = $('#endBtn'); if (end) end.click();
  }
}

boot().finally(() => { booted = true; });
