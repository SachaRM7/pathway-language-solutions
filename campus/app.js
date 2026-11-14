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
// French typography in the lesson player: keep « ? ! : ; » » on the same line as the word before.
const nbsp = h => h.replace(/ ([?!:;»])(?=[\s<]|$)/g, '\u00a0$1').replace(/« /g, '«\u00a0');
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
  staff: { overview: [], errors: [], invitations: [], teachers: [], invitesReady: false, members: null, editing: null, confirmDel: null, groups: null, changes: [], groupEditing: null },
  schedule: null, docs: null, recordings: null,
  ed: { unit: null, items: [], open: null, confirm: null, busy: false }, seg: null, simExam: null, weekly: null, mode: 'profesor', search: ''
};
const isStaff = () => A.profile && ['teacher', 'admin'].includes(A.profile.role);
const teacherMode = () => isStaff() && A.mode === 'profesor';
try { A.mode = localStorage.getItem('campus-mode') === 'alumno' ? 'alumno' : 'profesor'; } catch (e) { /* private mode */ }

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
  if (A.profile.role === 'student' && !A.profile.onboarded_at) return openOnboarding(true);
  if (contractRequired()) return openContract({ mode: 'sign' });
  showApp();
}
sb.auth.onAuthStateChange((event, session) => {
  if (!booted) return;
  if (event === 'SIGNED_IN' && !A.session) { A.session = session; boot(); }
  if (event === 'SIGNED_OUT') { A.session = null; A.profile = null; $('#app').hidden = true; $('#tabbar').hidden = true; showLogin(''); }
});

let loginEmail = '';
// The login screen speaks the language of the site page the visitor came from (/campus/?lang=fr|en|de,
// set by the site header). The Campus itself is in Spanish, which the screen says plainly.
const LOGIN_LANG = (() => {
  let l = new URLSearchParams(location.search).get('lang');
  try { if (l) sessionStorage.setItem('pwLoginLang', l); else l = sessionStorage.getItem('pwLoginLang'); } catch (_) {}
  return ['fr', 'en', 'de'].includes(l) ? l : 'es';
})();
const LT = {
  es: { h1: 'Entra a tu campus', sub: 'Te enviamos un enlace de acceso a tu correo. Sin contraseña.', email: 'Tu correo', ph: 'nombre@correo.com', send: 'Recibir mi enlace', sending: 'Enviando…', invalid: 'Escribe un correo válido, por ejemplo nombre@correo.com.', noAccess: 'Este correo no tiene acceso al campus. Pide a Pathway que te invite.', wait: 'Espera un minuto antes de pedir otro enlace.', failed: 'No pudimos enviar el enlace. Inténtalo de nuevo.', help: '¿Problemas para entrar? Escríbenos por WhatsApp.', note: '', back: '/' },
  fr: { h1: 'Entrez dans votre Campus', sub: 'Nous vous envoyons un lien d’accès par e-mail. Sans mot de passe.', email: 'Votre e-mail', ph: 'nom@exemple.com', send: 'Recevoir mon lien', sending: 'Envoi…', invalid: 'Saisissez un e-mail valide, par exemple nom@exemple.com.', noAccess: 'Cet e-mail n’a pas accès au Campus. Demandez à Pathway de vous inviter.', wait: 'Attendez une minute avant de demander un autre lien.', failed: 'Le lien n’a pas pu être envoyé. Réessayez.', help: 'Un problème pour vous connecter\u202f? Écrivez-nous sur WhatsApp.', note: 'Une fois connecté, le Campus est en espagnol.', back: '/fr/' },
  en: { h1: 'Sign in to your Campus', sub: 'We email you a sign-in link. No password.', email: 'Your email', ph: 'name@example.com', send: 'Get my link', sending: 'Sending…', invalid: 'Enter a valid email, for example name@example.com.', noAccess: 'This email has no Campus access. Ask Pathway to invite you.', wait: 'Wait a minute before asking for another link.', failed: 'We could not send the link. Please try again.', help: 'Trouble signing in? Message us on WhatsApp.', note: 'Once signed in, the Campus is in Spanish.', back: '/en/' },
  de: { h1: 'Melden Sie sich im Campus an', sub: 'Wir senden Ihnen einen Anmeldelink per E-Mail. Ohne Passwort.', email: 'Ihre E-Mail', ph: 'name@beispiel.de', send: 'Link erhalten', sending: 'Wird gesendet…', invalid: 'Geben Sie eine gültige E-Mail ein, zum Beispiel name@beispiel.de.', noAccess: 'Diese E-Mail hat keinen Campus-Zugang. Bitten Sie Pathway um eine Einladung.', wait: 'Warten Sie eine Minute, bevor Sie einen neuen Link anfordern.', failed: 'Der Link konnte nicht gesendet werden. Bitte erneut versuchen.', help: 'Probleme bei der Anmeldung? Schreiben Sie uns auf WhatsApp.', note: 'Nach der Anmeldung ist der Campus auf Spanisch.', back: '/de/' }
}[LOGIN_LANG];
function showLogin(err, sent = false) {
  $('#app').hidden = true; $('#tabbar').hidden = true; $('#login').hidden = false;
  const box = $('#loginBox');
  $('#loginBack').href = LT.back; $('#loginHelp').textContent = LT.help;
  $('#login').lang = LOGIN_LANG;
  if (!sent) {
    box.innerHTML = `<h1>${LT.h1}</h1>
      <p class="sub">${LT.sub}</p>
      ${LT.note ? `<p class="sub login-note">${LT.note}</p>` : ''}
      ${err ? `<p class="form-error" role="alert">${esc(err)}</p>` : ''}
      <form id="loginForm" class="form" novalidate>
        <label class="field" for="loginEmail">${LT.email}<input id="loginEmail" type="email" autocomplete="email" inputmode="email" required value="${esc(loginEmail)}" placeholder="${LT.ph}"></label>
        <button class="btn btn-dark" type="submit">${LT.send}<span class="arrow">${icon('arrow')}</span></button>
      </form>`;
    $('#loginForm').onsubmit = async e => {
      e.preventDefault();
      const email = $('#loginEmail').value.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) return showLogin(LT.invalid);
      loginEmail = email;
      const btn = e.submitter || $('#loginForm button'); btn.disabled = true; btn.textContent = LT.sending;
      const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname } });
      if (error) {
        const m = /signups? not allowed|user not found/i.test(error.message) ? LT.noAccess
          : /seconds|rate/i.test(error.message) ? LT.wait
          : LT.failed;
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
        <label class="otp-label" for="loginCode">O escribe el código del correo</label>
        <div class="otp" data-otp style="--n:${OTP_LEN}">
          <input id="loginCode" class="otp-input" inputmode="numeric" autocomplete="one-time-code" maxlength="${OTP_LEN}" pattern="[0-9]*" aria-describedby="otpHint" spellcheck="false">
          <div class="otp-boxes" aria-hidden="true">${Array.from({ length: OTP_LEN }, (_, i) => `<span class="otp-box" style="--i:${i}"><b></b></span>`).join('')}<i class="otp-caret"></i></div>
        </div>
        <p class="otp-hint" id="otpHint">Pega el código del correo. Con la app Mail del iPhone, también aparece encima del teclado.</p>
        <button class="btn btn-dark" type="submit">Entrar con el código</button>
      </form>
      <button class="ob-link" type="button" id="otherEmail" style="justify-self:start">Usar otro correo</button>`;
    $('#otherEmail').onclick = () => showLogin('');
    // Login code (RareUI-style slots): typing fills a slot and moves on; Backspace clears the
    // slot in place, then steps back on the next press; arrows move the caret, which slides from
    // slot to slot; pasting or the phone's autofill drops the whole code in. One real input stays
    // underneath so « one-time-code » autofill (iPhone « From Mail ») keeps working.
    const otp = $('[data-otp]'), input = $('#loginCode'), boxes = $$('.otp-box', otp), caret = $('.otp-caret', otp);
    const HINT = 'Pega el código del correo. Con la app Mail del iPhone, también aparece encima del teclado.';
    const slots = Array(OTP_LEN).fill('');
    let cur = 0, busy = false;
    const code = () => slots.join('');
    const setStatus = st => {
      otp.classList.remove('is-error', 'is-done');
      if (st) { void otp.offsetWidth; otp.classList.add(st === 'error' ? 'is-error' : 'is-done'); }
    };
    const paint = (popAt = -1) => {
      boxes.forEach((b, i) => {
        b.firstChild.textContent = slots[i];
        b.classList.toggle('is-filled', !!slots[i]);
        b.classList.toggle('is-active', otp.classList.contains('has-focus') && i === cur);
        if (i === popAt) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
      });
      const box = boxes[cur];
      caret.style.transform = `translateX(${box.offsetLeft + box.offsetWidth / 2 - 1}px)`;
      caret.classList.toggle('is-hidden', !otp.classList.contains('has-focus') || !!slots[cur]);
      input.value = code();
    };
    const resetHint = () => { const h = $('#otpHint'); if (h.classList.contains('form-error')) { h.classList.remove('form-error'); h.textContent = HINT; } };
    const fill = (text, from) => {
      const digits = text.replace(/\D/g, '');
      if (!digits) return;
      // A full code (paste, autofill) always starts at the first slot.
      let i = digits.length >= OTP_LEN ? 0 : from;
      for (const d of digits) { if (i >= OTP_LEN) break; slots[i] = d; paint(i); i++; }
      cur = Math.min(i, OTP_LEN - 1);
      setStatus(null); resetHint(); paint();
      if (slots.every(Boolean)) submit();
    };
    const submit = async () => {
      if (busy) return;
      if (!slots.every(Boolean)) { setStatus('error'); return input.focus(); }
      busy = true; otp.classList.add('is-busy'); input.blur();
      const { error } = await sb.auth.verifyOtp({ email: loginEmail, token: code(), type: 'email' });
      busy = false; otp.classList.remove('is-busy');
      if (error) {
        setStatus('error');
        const h = $('#otpHint'); h.textContent = 'Código incorrecto o caducado. Vuelve a escribirlo o pide un correo nuevo.'; h.classList.add('form-error');
        return setTimeout(() => { slots.fill(''); cur = 0; paint(); input.focus(); }, 650);
      }
      setStatus('success');
    };
    input.addEventListener('beforeinput', e => {
      if (busy) return e.preventDefault();
      const t = e.inputType || '';
      if (t === 'deleteContentBackward' || t === 'deleteContentForward' || t === 'deleteWordBackward') {
        e.preventDefault();
        if (slots[cur]) slots[cur] = '';
        else if (cur > 0) { cur--; slots[cur] = ''; }
        setStatus(null); paint(); return;
      }
      if (t === 'insertText' && e.data) { e.preventDefault(); fill(e.data, cur); }
      // Paste, drop and autofill (insertFromPaste, insertReplacementText…) are read on « input ».
    });
    input.addEventListener('input', () => {
      const v = input.value.replace(/\D/g, '');
      if (v !== code()) { if (v.length >= OTP_LEN) fill(v, 0); else paint(); }
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); cur = Math.max(0, cur - 1); paint(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); cur = Math.min(OTP_LEN - 1, cur + 1); paint(); }
      else if (e.key === 'Home') { e.preventDefault(); cur = 0; paint(); }
      else if (e.key === 'End') { e.preventDefault(); cur = Math.min(code().length, OTP_LEN - 1); paint(); }
    });
    input.addEventListener('focus', () => { otp.classList.add('has-focus'); paint(); });
    input.addEventListener('blur', () => { otp.classList.remove('has-focus'); paint(); });
    // A tap on a slot puts the caret there.
    otp.addEventListener('pointerdown', e => {
      const x = e.clientX;
      const i = boxes.findIndex(b => { const r = b.getBoundingClientRect(); return x >= r.left - 5 && x <= r.right + 5; });
      if (i >= 0) cur = Math.min(i, code().length);
      setTimeout(() => { input.focus(); paint(); }, 0);
    });
    $('#codeForm').onsubmit = e => { e.preventDefault(); submit(); };
    paint();
    setTimeout(() => input.focus(), 60);
  }
}

// Length of the email code (Supabase → Authentication → Providers → Email → Email OTP Length).
const OTP_LEN = (window.CAMPUS_CONFIG && window.CAMPUS_CONFIG.otpLength) || 6;

async function loadAll() {
  const uid = A.session.user.id;
  const [prof, units, ex, runs, asg, xp, due, badges, mine, teacher] = await Promise.all([
    sb.from('profiles').select('*').eq('id', uid).single(),
    sb.from('units').select('*').order('level').order('number'),
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
  syncTimezone();
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
  // Their own placement test (db/019_test_nivel.sql), shown in the onboarding.
  if (!isStaff()) { const pt = await sb.rpc('my_placement'); A.placement = pt.error ? null : (pt.data || null); }
  // Units seen in class (db/018_informe_clase.sql): with the setting on, a unit opens once seen.
  if (!isStaff()) {
    const [tu, pg] = await Promise.all([sb.from('taught_units').select('unit_id'), sb.rpc('progression_settings')]);
    A.taught = tu.error ? null : new Set((tu.data || []).map(x => x.unit_id));
    A.gate = !pg.error && !!(pg.data && pg.data.taught_gate) && !!A.taught;
    const tn = await sb.from('taught_numbers').select('level,number').eq('level', A.profile.level);
    A.taughtNums = tn.error ? null : (tn.data || []).map(x => x.number); // needs db/020_manual.sql
  }
  await loadSchedule();
  await loadWeekly();
  await loadResumable();
  await loadContract();
  await loadMyThread();
  if (isStaff()) await loadStaff();
}
// The account follows the device's time zone (classes, reminders and streaks are shown in it):
// fixed at onboarding, and updated whenever the Campus opens on a device in another zone.
function syncTimezone() {
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return; }
  if (!tz || tz === A.profile.timezone) return;
  A.profile.timezone = tz;
  sb.from('profiles').update({ timezone: tz }).eq('id', A.session.user.id).then(r => { if (r && r.error) console.error(r.error); });
}
// Group, fixed timetable and level documents (campus/db/008_horarios.sql). Without the
// migration A.schedule and A.docs stay null and the campus works as before.
async function loadSchedule() {
  const [sch, docs, rec] = await Promise.all([sb.rpc('my_schedule'), sb.from('level_documents').select('*').order('position'), sb.rpc('my_recordings')]);
  A.schedule = sch.error ? null : (sch.data || null);
  A.recordings = rec.error ? null : (rec.data || []); // needs db/009_zoom.sql
  const att = await sb.rpc('my_attendance');
  A.attendance = att.error ? null : (att.data || []); // needs db/013_asistencia.sql
  const ma = isStaff() ? { error: true } : await sb.rpc('my_absences');
  A.myAbs = ma.error ? null : (ma.data || null); // needs db/017_reglas_clases.sql
  const val = await sb.from('level_validations').select('*').eq('student_id', A.session.user.id);
  A.levelVal = val.error ? null : (val.data || []); // needs db/012_fin_nivel.sql
  A.docs = docs.error ? null : (docs.data || []);
  const next = nextSession();
  if (next) { A.profile.next_class_at = next.at; A.profile.class_link = A.schedule.group.zoom_link; }
  else if (A.schedule) { A.profile.next_class_at = null; A.profile.class_link = A.schedule.group.zoom_link; }
}
// Next session still to come (or under way), cancelled ones skipped.
function nextSession() {
  const list = (A.schedule && A.schedule.sessions) || [];
  return list.find(x => x.status !== 'cancelled' && new Date(x.at).getTime() + (x.duration_min || 60) * 6e4 > Date.now()) || null;
}
async function loadWeekly() {
  const { data, error } = await sb.rpc('weekly_challenge');
  A.weekly = error ? null : data;
}
async function maybeClaimWeekly() {
  await loadWeekly();
  const w = A.weekly;
  if (!w || w.claimed || w.days < w.goal_days) return;
  const { data, error } = await sb.rpc('claim_weekly_challenge');
  if (error || !data || !data.awarded) return;
  A.weekly = data;
  toast(`Reto de la semana cumplido: +${data.bonus} XP`);
  await refresh(); render();
}
async function loadStaff() {
  const [ov, er, inv, tea] = await Promise.all([
    sb.rpc('teacher_overview'), sb.rpc('teacher_common_errors'),
    sb.from('invitations').select('*').order('created_at', { ascending: false }), sb.rpc('list_teachers')
  ]);
  if (ov.error) throw ov.error;
  A.staff.overview = ov.data || [];
  A.staff.errors = er.data || [];
  // Invitations need campus/db/003_invitations.sql; without it the form is hidden.
  A.staff.invitesReady = !inv.error && !tea.error;
  A.staff.invitations = inv.data || [];
  A.staff.teachers = tea.data || [];
  // Member management needs campus/db/004_admin_members.sql; without it the tile is hidden.
  const [grp, chg, log, foc] = await Promise.all([sb.rpc('staff_groups'), sb.rpc('list_schedule_changes'), sb.rpc('staff_class_log'), sb.rpc('teacher_focus_alerts')]);
  A.staff.focus = foc.error ? [] : (foc.data || []); // needs db/010_integridad.sql
  const [cfg, sat] = await Promise.all([sb.rpc('get_campus_settings'), sb.rpc('staff_attendance')]);
  A.staff.settings = cfg.error ? null : (cfg.data || null); // needs db/013_asistencia.sql
  A.staff.attendance = sat.error ? {} : (sat.data || {});
  const abs = await sb.rpc('staff_absences');
  A.staff.absences = abs.error ? null : (abs.data || []); // needs db/016_avisos.sql
  const rep = await sb.rpc('staff_session_reports');
  A.staff.reports = rep.error ? null : (rep.data || []); // needs db/018_informe_clase.sql
  const cts = await sb.rpc('staff_contracts');
  A.staff.contracts = cts.error ? null : (cts.data || {}); // needs db/015_contrato.sql
  const th = await sb.rpc('staff_threads');
  A.staff.threads = th.error ? null : (th.data || []); // needs db/025_mensajes.sql
  const lv = await sb.rpc('staff_level_status');
  A.staff.levels = lv.error ? null : (lv.data || []); // needs db/012_fin_nivel.sql
  A.staff.groups = grp.error ? null : (grp.data || []);
  A.staff.log = log.error ? null : (log.data || { groups: {}, unmatched: [] }); // needs db/009_zoom.sql
  A.staff.changes = chg.error ? [] : (chg.data || []);
  if (A.profile.role === 'admin') {
    const pl = await sb.from('profiles').select('id,plan,plan_start').eq('role', 'student');
    A.staff.plans = pl.error ? null : Object.fromEntries((pl.data || []).map(x => [x.id, x])); // needs db/017_reglas_clases.sql
    const mem = await sb.rpc('admin_members');
    A.staff.members = mem.error ? null : (mem.data || []);
    const enr = await sb.rpc('staff_enrollments');
    A.staff.enrollments = enr.error ? null : (enr.data || []); // needs db/021_solicitudes.sql
    await loadCrm();
  } else A.staff.prospects = null;
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
const PASS_RATE = 0.75;
const RETRY_MS = 24 * 3600e3;
const runPassed = r => r.first_try_correct >= PASS_RATE * r.total;
// Units passed with at least 75 % on the first try.
const doneUnits = () => new Set(A.runs.filter(runPassed).map(r => r.unit_id));
const playable = u => isStaff() ? (A.unitInfo[u.id]?.count || 0) > 0 : (A.unitInfo[u.id]?.validated || 0) > 0;
const unitById = id => A.units.find(u => u.id === id);
function unitState(u) {
  const runs = A.runs.filter(r => r.unit_id === u.id);
  const passed = runs.some(runPassed);
  const last = runs[runs.length - 1];
  let retryAt = null;
  if (!passed && last && !runPassed(last)) { const t = new Date(last.finished_at).getTime() + RETRY_MS; if (t > Date.now()) retryAt = t; }
  if (isStaff()) return { unlocked: true, passed, retryAt: null, prev: null };
  if (u.is_final) { const lv = finalStatus(u.level); return { unlocked: lv.unitsDone && lv.teacher, passed, retryAt, prev: null, final: lv }; }
  const prev = A.units.filter(x => x.level === u.level && x.number < u.number && playable(x) && !x.is_final).sort((a, b) => b.number - a.number)[0] || null;
  const assigned = A.assignments.some(a => a.unit_id === u.id);
  const taught = !A.gate || passed || assigned || A.taught.has(u.id);
  const unlocked = taught && (!prev || A.runs.some(r => r.unit_id === prev.id && runPassed(r)) || assigned);
  return { unlocked, passed, retryAt, prev, taught };
}
// End of level (db/012_fin_nivel.sql): teacher's exam, then the Campus final exam.
function finalStatus(level) {
  const regular = A.units.filter(x => x.level === level && !x.is_final && playable(x));
  const done = doneUnits();
  const v = (A.levelVal || []).find(x => x.level === level) || {};
  const finalUnit = A.units.find(x => x.level === level && x.is_final && playable(x)) || null;
  return { unitsDone: regular.every(x => done.has(x.id)), passedCount: regular.filter(x => done.has(x.id)).length, total: regular.length, teacher: !!v.teacher_passed_at, finalUnit, finalPassed: !!v.final_passed_at };
}
function finalTile() {
  if (A.levelVal === null || isStaff()) return '';
  const p = A.profile, f = finalStatus(p.level);
  const nextLevel = LEVELS[LEVELS.indexOf(p.level) + 1];
  const step = (ok, title, text) => `<div class="err-row"><span>${ok ? icon('check') : icon('lock')} <b>${title}</b><br><span class="muted" style="font-size:13px">${text}</span></span>${ok ? '<span class="status">Hecho</span>' : ''}</div>`;
  const st = f.finalUnit ? unitState(f.finalUnit) : null;
  return `<article class="tile"><div class="tile-head"><h2>Examen final del nivel ${p.level}</h2>${nextLevel ? `<span class="pill ghost">Para pasar a ${nextLevel}</span>` : ''}</div>
    ${step(f.unitsDone, 'Todas las unidades superadas', `${f.passedCount} de ${f.total} unidades con al menos 75 %.`)}
    ${step(f.teacher, 'Examen con tu profesor', f.teacher ? 'Tu profesor validó tu examen.' : 'En espera de la validación de tu examen con tu profesor.')}
    ${f.finalUnit ? step(f.finalPassed, 'Examen final en el campus · unos 15 min', f.finalPassed ? 'Superado.' : 'Se abre cuando los dos pasos anteriores están hechos. Necesitas 75 %.') : ''}
    ${f.finalUnit && st && st.unlocked && !f.finalPassed ? (st.retryAt ? `<p class="muted" style="margin-top:12px">Nuevo intento: ${esc(retryLabel(st.retryAt))}.</p>` : `<button class="btn btn-dark" style="margin-top:14px" type="button" data-start="${f.finalUnit.id}">${icon('trophy')}Hacer el examen final</button>`) : ''}
  </article>`;
}
const retryLabel = t => { const d = new Date(t); return `${fmtDate(d, { weekday: 'long' })} a las ${fmtDate(d, { hour: '2-digit', minute: '2-digit' })}`; };
function nextUnit() {
  const done = doneUnits();
  return A.units.filter(u => u.level === A.profile.level && !u.is_final).find(u => !done.has(u.id) && playable(u)) || null;
}
const openHomework = () => A.assignments.filter(a => !a.completed_at).sort((a, b) => (a.due_on || '9999').localeCompare(b.due_on || '9999'));

/* ───────────── Navigation ───────────── */
const SNAV = [
  { id: 'inicio', label: 'Inicio', icon: 'home' },
  { id: 'ruta', label: 'Mi ruta', icon: 'route' },
  { id: 'repasar', label: 'Repasar', icon: 'cards', count: () => A.due },
  { id: 'simulacros', label: 'Simulacros', icon: 'timer' },
  { id: 'logros', label: 'Logros', icon: 'trophy' },
  { id: 'curso', label: 'Mi curso', icon: 'calendar', when: () => A.schedule || (A.docs && A.docs.length) || (A.contract && A.contract.signed) },
  { id: 'mensajes', label: 'Mensajes', icon: 'chat', when: () => !isStaff() && M.ready, count: () => myUnread() }
];
// Staff space: one tab per job, like the student side (Inicio first, settings last).
const isAdmin = () => !!(A.profile && A.profile.role === 'admin');
const TNAV = [
  { id: 'panel', label: 'Inicio', icon: 'home' },
  { id: 'alumnos', label: 'Alumnos', icon: 'users' },
  { id: 'prospectos', label: 'Prospectos', icon: 'funnel', when: () => isAdmin() && Array.isArray(A.staff.prospects), count: () => crmDue().length },
  { id: 'mensajes', label: 'Mensajes', icon: 'chat', when: () => Array.isArray(A.staff.threads), count: () => threadsWaiting().length },
  { id: 'tareas', label: 'Tareas', icon: 'pen' },
  { id: 'horarios', label: 'Horarios', icon: 'calendar', when: () => A.staff.groups !== null, count: () => isAdmin() ? A.staff.changes.filter(c => c.status === 'pending').length : 0 },
  { id: 'contenido', label: 'Contenido', icon: 'book' },
  { id: 'cuentas', label: 'Cuentas', icon: 'user-plus', when: () => A.staff.invitesReady || (isAdmin() && !!A.staff.members) },
  { id: 'ajustes', label: 'Ajustes', icon: 'settings', when: () => isAdmin() && !!A.staff.settings }
];
const navItems = () => (teacherMode() ? TNAV : SNAV).filter(n => !n.when || n.when());
const VIEWS = { inicio: viewInicio, ruta: viewRuta, repasar: viewRepasar, simulacros: viewSimulacros, logros: viewLogros, curso: viewCurso, panel: viewPanel, alumnos: viewAlumnos, tareas: viewTareas, horarios: viewHorarios, prospectos: viewProspectos, mensajes: viewMensajes, contenido: viewContenido, cuentas: viewCuentas, ajustes: viewAjustes };
// Old links (#grupo) keep working.
const ALIASES = { grupo: 'panel' };

function currentView() {
  const raw = location.hash.slice(1), id = ALIASES[raw] || raw;
  return navItems().some(n => n.id === id) ? id : navItems()[0].id;
}
function renderNav(cur) {
  const items = navItems();
  $('#sideNav').innerHTML = items.map(it => { const c = it.count ? it.count() : 0; return `<a href="#${it.id}" ${it.id === cur ? 'aria-current="page"' : ''}>${icon(it.icon)}${it.label}${c ? `<span class="count num">${c > 99 ? '99+' : c}</span>` : ''}</a>`; }).join('');
  $('#tabbar').hidden = false;
  $('#tabbar').innerHTML = items.map(it => { const c = it.count ? it.count() : 0; return `<a href="#${it.id}" aria-label="${it.label}" ${it.id === cur ? 'aria-current="page"' : ''}>${icon(it.icon)}${c && it.id !== cur ? '<span class="dot"></span>' : ''}</a>`; }).join('');
  const p = A.profile;
  $('#promo').innerHTML = teacherMode()
    ? `<span>${p.role === 'admin' ? 'Administración' : 'Profesor'}</span><b>${esc(p.full_name)}</b><span>${A.staff.overview.length} alumno${A.staff.overview.length === 1 ? '' : 's'}</span>`
    : (p.next_class_at ? `<span>Próxima clase</span><b>${esc(cap(fmtDate(new Date(p.next_class_at), { weekday: 'long', day: 'numeric', month: 'short' })))}</b><span>${fmtDate(new Date(p.next_class_at), { hour: '2-digit', minute: '2-digit' })}${A.teacher ? ' · ' + esc(A.teacher.full_name) : ''}</span>`
      : `<span>Tu objetivo</span><b>NCLC 7</b><span>${esc(EXAMS[p.exam] || 'Examen por definir')}</span>`);
  $('#sideFoot').innerHTML = `<span>${esc(firstName(p.full_name))}</span><button type="button" data-action="menu">Mi cuenta</button>`;
}
function topBar(id, title, sub, extra = '') {
  const p = A.profile, notes = notifications();
  let seen = ''; try { seen = localStorage.getItem('campus-seen') || ''; } catch (e) { /* ignore */ }
  const unseen = notes.length && notes.map(n => n.key).join('|') !== seen;
  return `<header class="top"><div><h1 id="${id}">${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>
    <div class="top-tools">${extra}
      ${teacherMode() ? '' : `<div class="menu-wrap"><label class="search" for="campusSearch">${icon('search')}<input id="campusSearch" type="search" autocomplete="off" placeholder="Buscar una unidad, un verbo…" value="${esc(A.search)}"></label><div id="searchSlot"></div></div>`}
      ${isStaff() ? `<div class="switch" role="group" aria-label="Vista"><button type="button" data-mode="alumno" aria-pressed="${!teacherMode()}">Alumno</button><button type="button" data-mode="profesor" aria-pressed="${teacherMode()}">Profesor</button></div>` : ''}
      <button type="button" class="round tt-help" data-action="tour" aria-label="Ver el tutorial" title="Ver el tutorial">?</button>
      <div class="menu-wrap"><button type="button" class="round" data-action="bell" aria-label="Notificaciones">${icon('bell')}${unseen ? '<span class="pip"></span>' : ''}</button><div id="bellSlot"></div></div>
      <div class="menu-wrap"><button type="button" class="round ava-btn" data-action="menu" aria-label="Mi cuenta" aria-haspopup="true"><span class="ava">${esc(initials(p.full_name))}</span></button><div id="menuSlot"></div></div>
    </div></header>`;
}
function notifications() {
  const out = [];
  if (teacherMode()) {
    const inactive = A.staff.overview.filter(s => s.onboarded && (daysSince(s.last_activity) == null || daysSince(s.last_activity) >= 4)).length;
    const fresh = A.staff.overview.filter(s => !s.onboarded).length;
    if (inactive) out.push({ key: 'inactive' + inactive, ic: 'users', text: `${inactive} alumno${inactive > 1 ? 's' : ''} sin practicar desde hace 4 días o más.`, href: '#alumnos' });
    if (fresh) out.push({ key: 'fresh' + fresh, ic: 'sparkle', text: `${fresh} alumno${fresh > 1 ? 's' : ''} todavía no completó la bienvenida.`, href: '#alumnos' });
    const requests = isAdmin() ? (A.staff.enrollments || []).filter(r => !r.handled_at).length : 0;
    if (requests) out.push({ key: 'enr' + requests, ic: 'user-plus', text: `${requests} solicitud${requests > 1 ? 'es' : ''} de inscripción por atender.`, href: '#cuentas' });
    const crmN = isAdmin() && A.staff.prospects ? crmDue().length : 0;
    if (crmN) out.push({ key: 'crm' + crmToday() + crmN, ic: 'funnel', text: `${crmN} prospecto${crmN > 1 ? 's' : ''} con una acción para hoy o atrasada.`, href: '#prospectos', today: true });
    const waiting = threadsWaiting();
    if (waiting.length) out.push({ key: 'msg' + waiting.map(t => t.id + t.needs_staff_since).join(','), ic: 'chat', text: `${waiting.length} conversación${waiting.length > 1 ? 'es' : ''} de alumno${waiting.length > 1 ? 's' : ''} necesita${waiting.length > 1 ? 'n' : ''} respuesta.`, href: '#mensajes' });
    const pending = A.staff.changes.filter(c => c.status === 'pending').length;
    if (pending && A.profile.role === 'admin') out.push({ key: 'chg' + pending, ic: 'calendar', text: `${pending} cambio${pending > 1 ? 's' : ''} de horario por validar.`, href: '#horarios' });
    return out;
  }
  for (const v of A.levelVal || []) {
    if (v.promoted_at && v.promoted_to && Date.now() - new Date(v.promoted_at) < 10 * 864e5) out.push({ key: 'lvl' + v.level, ic: 'trophy', text: `¡Pasaste al nivel ${v.promoted_to}! Tus nuevas unidades ya están en «Mi ruta».`, href: '#ruta' });
  }
  for (const x of (A.schedule && A.schedule.sessions) || []) {
    if (x.status === 'planned' || new Date(x.scheduled_at) - Date.now() > 8 * 864e5) continue;
    const was = sessionLabel(x.scheduled_at);
    out.push({ key: 'ses' + x.scheduled_at + x.status, ic: 'calendar', text: x.status === 'cancelled' ? `Clase del ${was} cancelada.` : `Tu clase del ${was} pasa al ${sessionLabel(x.at)}.`, href: '#curso' });
  }
  for (const a of openHomework()) {
    const u = unitById(a.unit_id); if (!u) continue;
    const due = a.due_on ? ' · para el ' + fmtDate(new Date(a.due_on + 'T12:00:00Z'), { weekday: 'long', day: 'numeric' }, 'UTC') : '';
    out.push({ key: 'hw' + a.id, ic: 'pen', text: `${A.teacher ? esc(firstName(A.teacher.full_name)) + ' te asignó' : 'Tarea:'} la unidad ${u.number}${due}.`, start: u.id });
  }
  if (A.profile.next_class_at && new Date(A.profile.next_class_at) > new Date()) {
    const d = new Date(A.profile.next_class_at);
    out.push({ key: 'class' + A.profile.next_class_at, ic: 'video', text: `Próxima clase: ${fmtDate(d, { weekday: 'long', day: 'numeric', month: 'short' })} a las ${fmtDate(d, { hour: '2-digit', minute: '2-digit' })}.`, href: '#inicio' });
  }
  if (myUnread()) { const last = M.thread.messages[M.thread.messages.length - 1]; out.push({ key: 'msg' + (last ? last.id : ''), ic: 'chat', text: `${myUnread() === 1 ? 'Un mensaje nuevo' : `${myUnread()} mensajes nuevos`} en «Mensajes».`, href: '#mensajes' }); }
  if (A.due) out.push({ key: 'due' + A.due, ic: 'cards', text: `${A.due} tarjeta${A.due > 1 ? 's' : ''} para repasar hoy.`, href: '#repasar' });
  return out;
}
function toggleBell() {
  const slot = $('#bellSlot'); if (!slot) return;
  if (slot.innerHTML) { slot.innerHTML = ''; return; }
  closeMenus();
  const notes = notifications();
  try { localStorage.setItem('campus-seen', notes.map(n => n.key).join('|')); } catch (e) { /* ignore */ }
  $('[data-action="bell"] .pip')?.remove();
  slot.innerHTML = `<div class="menu menu-wide" role="menu"><div class="who"><b>Notificaciones</b></div>${notes.length ? notes.map(n => n.start
    ? `<button type="button" role="menuitem" data-start="${n.start}">${icon(n.ic)}<span>${n.text}</span></button>`
    : `<a role="menuitem" href="${n.href}"${n.today ? ' data-crm-today' : ''}>${icon(n.ic)}<span>${n.text}</span></a>`).join('') : '<p class="menu-empty">Nada nuevo por ahora.</p>'}</div>`;
}
function closeMenus() { for (const id of ['#menuSlot', '#bellSlot', '#searchSlot']) { const s = $(id); if (s) s.innerHTML = ''; } }
function runSearch(q) {
  A.search = q;
  const slot = $('#searchSlot'); if (!slot) return;
  const n = q.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (n.length < 2) { slot.innerHTML = ''; return; }
  const plain = t => String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const units = A.units.filter(u => playable(u) && (plain(u.title).includes(n) || `unidad ${u.number}` === n || String(u.number) === n)).slice(0, 5);
  const words = [];
  for (const u of A.units) for (const c of (u.cards || [])) if (playable(u) && (plain(c.front).includes(n) || plain(c.back).includes(n))) words.push({ u, c });
  slot.innerHTML = `<div class="menu menu-wide" role="listbox">${units.map(u => `<button type="button" data-start="${u.id}">${icon('route')}<span><b>${esc(u.title)}</b><small>Unidad ${u.number} · ${u.level}</small></span></button>`).join('')}
    ${words.slice(0, 6).map(w => `<button type="button" data-say="${esc(w.c.front)}">${icon('speaker')}<span><b>${esc(w.c.front)}</b><small>${esc(w.c.back)} · unidad ${w.u.number}</small></span></button>`).join('')}
    ${!units.length && !words.length ? `<p class="menu-empty">Sin resultados para «${esc(q.trim())}».</p>` : ''}</div>`;
}
function render() {
  if (!A.profile) return;
  const id = currentView();
  renderNav(id);
  $('#main').innerHTML = VIEWS[id]();
  bindView(id);
  document.dispatchEvent(new CustomEvent('campus:render', { detail: { view: id } }));
}
// Used by tour.js: which tour applies, and whether this account has already seen it
// (profiles.tours, db/007_tutorial.sql; the device keeps a copy if the column is missing).
window.CampusApp = {
  mode: () => teacherMode() ? 'teacher' : 'student',
  admin: () => isAdmin(),
  seen: name => {
    let local = false; try { local = !!localStorage.getItem('campus-tour-' + name); } catch (e) { /* ignore */ }
    return local || !!(A.profile && A.profile.tours && A.profile.tours[name]);
  },
  markSeen: name => {
    try { localStorage.setItem('campus-tour-' + name, '1'); } catch (e) { /* ignore */ }
    if (A.profile) A.profile.tours = { ...(A.profile.tours || {}), [name]: new Date().toISOString() };
    sb.rpc('mark_tour_seen', { p_tour: name }).then(r => { if (r && r.error) console.warn('mark_tour_seen:', r.error.message); });
  }
};
function showApp() {
  $('#login').hidden = true; $('#ob').hidden = true; $('#app').hidden = false;
  document.body.classList.remove('no-scroll');
  render();
}
window.addEventListener('hashchange', () => { flipped = false; if (crmOverlayOpen() && location.hash !== '#prospectos') crmClose(); if (A.profile && !$('#app').hidden) { render(); window.scrollTo({ top: 0 }); } });

function toggleMenu() {
  const slot = $('#menuSlot'); if (!slot) return;
  if (slot.innerHTML) { slot.innerHTML = ''; return; }
  closeMenus();
  const p = A.profile;
  slot.innerHTML = `<div class="menu" role="menu"><div class="who"><b>${esc(p.full_name)}</b>${esc(A.session.user.email)}</div>
    ${isStaff() ? '' : `<button type="button" role="menuitem" data-action="plan">${icon('target')}Mi plan</button>`}
    <button type="button" role="menuitem" data-action="logout">${icon('x')}Cerrar sesión</button></div>`;
}

/* ───────────── Student views ───────────── */
const EXAMS = { tef: 'TEF Canada', tcf: 'TCF Canada', ambos: 'TEF y TCF Canada', tefaq: 'TEFAQ (Quebec)', nose: 'Examen por definir' };
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
    <div style="display:flex;gap:10px;flex-wrap:wrap;position:relative;z-index:1">${(() => { const st = unitState(unit);
      if (st.retryAt) return `<span class="pill dark" style="height:40px;padding:0 16px">${icon('timer')}Nuevo intento: ${esc(retryLabel(st.retryAt))}</span><a class="btn btn-light btn-sm" href="#repasar">Repasar mientras tanto</a>`;
      if (!st.unlocked) return `<span class="pill dark" style="height:40px;padding:0 16px">${icon('lock')}Supera antes la unidad ${st.prev ? st.prev.number : ''}</span>`;
      return `<button class="btn btn-dark" data-start="${unit.id}">${L_RESUME.has(unit.id) ? 'Continuar la lección' : 'Empezar la lección'}<span class="arrow">${icon('arrow')}</span></button>`; })()}</div>
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
      <div class="tile-head"><h2>Camino al NCLC 7</h2><a class="pill ghost" href="https://pathway-languages.com/calculador.html" target="_blank" rel="noopener">Calculadora CRS ${icon('arrow-up')}</a></div>
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
      ${nc ? `<div class="class-row"><div class="date-block"><small>${esc(fmtDate(nc, { month: 'short' }).replace('.', '').toUpperCase())}</small><b>${fmtDate(nc, { day: 'numeric' })}</b></div><div><h3>${esc(cap(fmtDate(nc, { weekday: 'long' })))} · ${fmtDate(nc, { hour: '2-digit', minute: '2-digit' })}</h3><p class="muted" style="font-size:14px;margin-top:4px">${nextSession() && nextSession().status === 'moved' ? `Cambiada · antes: ${esc(sessionLabel(nextSession().scheduled_at))}` : 'Tu hora local'}</p></div></div>`
        : `<p class="muted" style="font-size:14px">Tu profesor aún no programó la próxima clase.</p>`}
      <div class="teacher"><span class="ava sm">${esc(initials(A.teacher?.full_name || 'P'))}</span><b>${esc(A.teacher?.full_name || 'Tu profesor')}</b>${nc && A.schedule ? `<button class="btn btn-dark btn-sm" style="margin-left:auto" type="button" data-join>Unirse</button>` : nc && p.class_link ? `<a class="btn btn-dark btn-sm" style="margin-left:auto" href="${esc(p.class_link)}" target="_blank" rel="noopener">Unirse</a>` : ''}</div>
    </article>
    ${challengeTile()}
  </div></section>`;
}

function challengeTile() {
  const w = A.weekly;
  if (!w) return `<article class="tile mint c-3">
      <p class="label" style="color:var(--mint-ink)">Repaso</p>
      <p class="big num" style="margin-top:12px">${A.due}<span style="font-size:18px;color:var(--mint-ink)"> tarjeta${A.due === 1 ? '' : 's'}</span></p>
      <p style="margin-top:8px;font-weight:600;font-size:14px">Vocabulario y errores que vuelven justo antes de que los olvides.</p>
      <a class="btn btn-dark btn-sm" style="margin-top:16px" href="#repasar">Repasar</a></article>`;
  const days = Math.min(w.days, w.goal_days);
  return `<article class="tile mint c-3">
      <p class="label" style="color:var(--mint-ink)">${A.teacher ? 'Reto de ' + esc(firstName(A.teacher.full_name)) : 'Reto de la semana'}</p>
      <p class="big num" style="margin-top:12px">${days}<span style="font-size:18px;color:var(--mint-ink)"> / ${w.goal_days} días</span></p>
      <p style="margin-top:8px;font-weight:600;font-size:14px">${w.claimed ? `Reto cumplido · +${w.bonus} XP ganados` : `Practica ${w.goal_days} días distintos esta semana · +${w.bonus} XP`}</p>
      <div class="dots">${Array.from({ length: w.goal_days }, (_, i) => `<i class="${i < days ? 'on' : ''}"></i>`).join('')}</div>
      ${w.group_size > 1 ? `<p class="group num">Grupo: ${fmt(w.group_xp)} / ${fmt(w.group_goal)} XP esta semana</p>` : `<p class="group num">${fmt(w.group_xp)} XP esta semana</p>`}
    </article>`;
}

function viewRuta() {
  const p = A.profile, segs = segmentsFor(p.level);
  if (A.seg == null) { const nu = nextUnit(); A.seg = nu ? Math.max(0, segs.findIndex(s => s.letter === nu.segment)) : 0; }
  const s = segs[A.seg], from = A.seg * 16 + 1, done = doneUnits(), nu = nextUnit();
  const cells = [];
  for (let n = from; n < from + 16; n++) {
    const u = A.units.find(x => x.level === p.level && x.number === n);
    let cls = 'soon', label = `Unidad ${n}, pronto`, inner = pad2(n), action = `data-toast="La unidad ${n} todavía no está disponible."`;
    if (u && playable(u)) {
      const st = unitState(u);
      if (st.passed) { cls = 'done'; inner = icon('check'); label = `Unidad ${n}, superada`; action = `data-start="${u.id}"`; }
      else if (st.retryAt) { cls = 'cur'; inner = icon('timer'); label = `Unidad ${n}, nuevo intento ${retryLabel(st.retryAt)}`; action = `data-toast="Necesitas 75 % para pasar. Nuevo intento: ${esc(retryLabel(st.retryAt))}."`; }
      else if (st.unlocked) { cls = 'cur'; label = `Unidad ${n}, disponible`; action = `data-start="${u.id}"`; }
      else if (!st.taught) { cls = 'locked'; inner = icon('lock'); label = `Unidad ${n}, se abre cuando la veas en clase`; action = `data-toast="La unidad ${n} se abre cuando la veas en clase con tu profesor."`; }
      else { cls = 'locked'; inner = icon('lock'); label = `Unidad ${n}, bloqueada`; action = `data-toast="Supera antes la unidad ${st.prev ? st.prev.number : n - 1} con al menos 75 %."`; }
    }
    cells.push(`<button class="u ${cls}" ${action} aria-label="${label}">${inner}</button>`);
  }
  cells.push(`<button class="u exam" data-toast="El examen ${s.letter} se desbloquea al terminar las 16 unidades del segmento." aria-label="Examen ${s.letter}">${icon('trophy')}</button>`);
  const featured = nu && nu.segment === s.letter ? nu : null;
  const fInfo = featured ? A.unitInfo[featured.id] : null;
  return `<section class="view" aria-labelledby="h-ruta">
  ${topBar('h-ruta', 'Mi ruta', `Manual ${p.level} · 64 unidades en 4 segmentos`)}
  <div class="seg-tabs" role="group" aria-label="Segmento">${segs.map((x, i) => `<button type="button" data-seg="${i}" aria-pressed="${i === A.seg}"><b>${x.letter}</b>${esc(x.name)}</button>`).join('')}</div>
  ${featured ? `<article class="tile peach unit-hero">
      <div><span class="pill">Unidad actual</span><h2>${esc(featured.title)}</h2>
        <div style="margin-top:22px;display:flex;gap:10px;flex-wrap:wrap">${unitState(featured).retryAt ? `<span class="pill dark" style="height:40px;padding:0 16px">${icon('timer')}Nuevo intento: ${esc(retryLabel(unitState(featured).retryAt))}</span>` : `<button class="btn btn-dark" data-start="${featured.id}">${L_RESUME.has(featured.id) ? 'Continuar' : 'Empezar'}<span class="arrow">${icon('arrow')}</span></button>`}</div>
        <p style="margin-top:14px;font-size:14px;font-weight:600">Supérala con al menos 75 % para abrir la siguiente unidad.</p></div>
      <div class="unit-meta"><p class="unit-no">${pad2(featured.number)}</p><div><span>En el campus</span>${fInfo?.[isStaff() ? 'count' : 'validated'] || 0} ejercicios</div>${featured.manual_time ? `<div><span>En el manual</span>${esc(featured.manual_time)}</div>` : ''}</div>
    </article>` : ''}
  <article class="tile">
    <div class="tile-head"><div><h2>Segmento ${s.letter} · ${esc(s.name)}</h2>${s.desc ? `<p class="muted" style="font-size:14px;margin-top:6px;max-width:70ch">${esc(s.desc)}</p>` : ''}</div></div>
    <div class="units">${cells.join('')}</div>
    <div class="legend"><span><i style="background:var(--ink)"></i>Hecha</span><span><i style="background:var(--coral)"></i>Siguiente</span><span><i style="background:var(--soft);box-shadow:inset 0 0 0 1px var(--line)"></i>Pronto</span><span><i style="background:var(--butter)"></i>Examen ${s.letter}</span></div>
  </article>
  ${finalTile()}</section>`;
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
  if (g > 0 && A.weekly && !A.weekly.claimed) maybeClaimWeekly();
}

function viewSimulacros() {
  const e = A.profile.exam;
  const choices = e === 'tef' || e === 'tefaq' ? ['tef'] : e === 'tcf' ? ['tcf'] : ['tcf', 'tef'];
  if (!choices.includes(A.simExam)) A.simExam = choices[0];
  const dur = A.simExam === 'tcf' ? ['35 min', '60 min', '60 min', '12 min'] : ['40 min', '60 min', '60 min', '15 min'];
  const sk = [['Compréhension orale', 'speaker', 'sky'], ['Compréhension écrite', 'book', 'lilac'], ['Expression écrite', 'pen', 'peach'], ['Expression orale', 'mic', 'butter']];
  return `<section class="view" aria-labelledby="h-sim">
  ${topBar('h-sim', 'Simulacros', 'Pruebas cronometradas en las condiciones del examen, con una estimación NCLC por competencia')}
  ${choices.length > 1 ? `<div class="seg-tabs" role="group" aria-label="Examen">${choices.map(x => `<button type="button" data-exam="${x}" aria-pressed="${x === A.simExam}"><b>${x === 'tcf' ? 'C' : 'E'}</b>${x === 'tcf' ? 'TCF Canada' : 'TEF Canada'}</button>`).join('')}</div>` : ''}
  <div class="exam-grid">${sk.map(([k, ic, c], i) => `<article class="tile ${c} exam"><div class="row"><span class="pill">${icon(ic)}${dur[i]}</span></div>
      <div style="display:flex;justify-content:center">${gauge(null)}</div>
      <div class="row"><h3>${k}</h3><button class="round" style="box-shadow:none" aria-label="Empezar ${k}" data-toast="Los simulacros en línea llegan en la próxima etapa del campus. Mientras tanto, tu profesor los organiza en clase.">${icon('arrow')}</button></div></article>`).join('')}</div>
  <p class="faint" style="font-size:13px">Tu estimación NCLC aparecerá después de tu primer simulacro. La marca naranja es tu meta, NCLC 7. Estimación orientativa en formato ${A.simExam === 'tcf' ? 'TCF' : 'TEF'} Canada; no sustituye el resultado oficial.</p>
  </section>`;
}

function gauge(v) {
  const r = 49, c = 2 * Math.PI * r;
  return `<svg class="gauge" viewBox="0 0 120 120" role="img" aria-label="${v == null ? 'Sin resultado todavía' : `NCLC ${v} de 10`}, meta NCLC 7"><circle class="t" cx="60" cy="60" r="${r}"/>${v == null ? '' : `<circle class="v" cx="60" cy="60" r="${r}" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - v / 10)).toFixed(1)}"/>`}<circle class="goal" cx="60" cy="60" r="${r}" stroke-dasharray="2.5 ${c.toFixed(1)}" transform="rotate(162 60 60)"/><text x="60" y="64" text-anchor="middle" class="num">${v == null ? '—' : v}</text><text x="60" y="82" text-anchor="middle" class="sub">NCLC</text></svg>`;
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
// Students who need a word before the next class (shared by Inicio and the notifications).
function staffAlerts() {
  const ov = A.staff.overview, alerts = [];
  for (const s of ov) {
    const ds = daysSince(s.last_activity);
    if (!s.onboarded) alerts.push({ s, kind: 'warn', text: 'Todavía no completó la bienvenida del campus.' });
    else if (ds == null || ds >= 4) alerts.push({ s, kind: 'bad', text: ds == null ? 'Aún no practicó en el campus.' : `${ds} días sin practicar.` });
    if (s.week_accuracy != null && s.week_accuracy < 60) alerts.push({ s, kind: 'warn', text: `${s.week_accuracy} % de aciertos esta semana.` });
  }
  for (const f of A.staff.focus || []) {
    const s = ov.find(x => x.id === f.student_id), u = unitById(f.unit_id);
    if (s) alerts.push({ s, kind: 'warn', text: `Salió ${f.focus_lost} ${f.focus_lost === 1 ? 'vez' : 'veces'} de la pestaña durante la unidad ${u ? u.number : ''} (${Math.round(100 * f.first_try_correct / Math.max(1, f.total))} %, ${fmtDate(new Date(f.finished_at), { weekday: 'long', day: 'numeric' })}).` });
  }
  return alerts;
}
const assignable = () => A.units.filter(u => (A.unitInfo[u.id]?.validated || 0) > 0);
const noStudentsTile = () => `<article class="tile empty"><h2>Todavía no tienes alumnos</h2><p class="muted">${A.staff.invitesReady ? 'Invita a tu primer alumno en «Cuentas»: aparecerá aquí con su progreso en cuanto entre al campus.' : 'Cuando Pathway te asigne alumnos, aparecerán aquí con su progreso.'}</p>${A.staff.invitesReady ? `<a class="btn btn-dark" style="margin-top:14px" href="#cuentas">${icon('user-plus')}Invitar a un alumno</a>` : ''}</article>`;

// What waits for a decision, each line with a link to the tab where it is handled.
function todoItems() {
  const out = [], admin = isAdmin();
  const waiting = threadsWaiting().length;
  if (waiting) out.push({ ic: 'chat', text: `${waiting} conversación${waiting > 1 ? 'es' : ''} por responder`, href: '#mensajes' });
  const requests = admin ? (A.staff.enrollments || []).filter(r => !r.handled_at).length : 0;
  if (requests) out.push({ ic: 'user-plus', text: `${requests} solicitud${requests > 1 ? 'es' : ''} de inscripción por atender`, href: '#cuentas' });
  if (admin && A.staff.prospects) {
    const due = crmDue(), late = due.filter(p => p.next_due < crmToday()).length;
    if (due.length) out.push({ ic: 'funnel', text: `${due.length} prospecto${due.length > 1 ? 's' : ''} para hoy${late ? ` (${late} atrasado${late > 1 ? 's' : ''})` : ''}`, href: '#prospectos', today: true });
  }
  const pending = A.staff.changes.filter(c => c.status === 'pending').length;
  if (admin && pending) out.push({ ic: 'calendar', text: `${pending} cambio${pending > 1 ? 's' : ''} de horario por validar`, href: '#horarios' });
  if (admin && A.staff.groups && A.staff.members) {
    const inGroup = new Set(A.staff.groups.flatMap(g => g.members.map(m => m.id)));
    const n = A.staff.members.filter(m => m.role === 'student' && !inGroup.has(m.id)).length;
    if (n) out.push({ ic: 'users', text: `${n} alumno${n > 1 ? 's' : ''} sin grupo, sin horario`, href: '#horarios' });
  }
  const noZoom = (A.staff.groups || []).filter(g => !g.zoom_link).length;
  if (noZoom) out.push({ ic: 'video', text: `${noZoom} grupo${noZoom > 1 ? 's' : ''} sin enlace de Zoom`, href: '#horarios' });
  const lost = (A.staff.log && A.staff.log.unmatched || []).length;
  if (lost) out.push({ ic: 'video', text: `${lost} reunión${lost > 1 ? 'es' : ''} de Zoom sin grupo`, href: '#horarios' });
  const ready = (A.staff.levels || []).filter(x => x.units_done && !x.teacher_passed_at).length;
  if (ready) out.push({ ic: 'trophy', text: `${ready} alumno${ready > 1 ? 's' : ''} con el nivel terminado: validar el examen`, href: '#alumnos' });
  if (A.staff.invitesReady) {
    const joined = new Set((A.staff.members || []).filter(m => m.onboarded).map(m => String(m.email).toLowerCase()));
    const open = A.staff.invitations.filter(i => !joined.has(String(i.email).toLowerCase())).length;
    if (open) out.push({ ic: 'user-plus', text: `${open} invitación${open > 1 ? 'es' : ''} sin respuesta`, href: '#cuentas' });
  }
  const noReport = (A.staff.reports || []).filter(x => !x.report).length;
  if (noReport) out.push({ ic: 'pen', text: `${noReport} clase${noReport > 1 ? 's' : ''} sin informe`, href: '#panel' });
  const abs = A.staff.absences || [];
  const toReview = abs.reduce((n, s) => n + s.record.filter(r => !r.reason && r.request && r.request.status === 'pending').length + (s.requests || []).filter(q => q.status === 'pending').length, 0);
  if (toReview) out.push({ ic: 'pen', text: `${toReview} justificativo${toReview > 1 ? 's' : ''} por revisar`, href: '#alumnos' });
  const toMake = abs.reduce((n, s) => n + s.record.filter(r => r.reason && !r.makeup).length, 0);
  if (toMake) out.push({ ic: 'calendar', text: `${toMake} clase${toMake > 1 ? 's' : ''} por recuperar`, href: '#alumnos' });
  for (const s of abs) if (s.month && s.month.failed) out.push({ ic: 'users', text: `${s.name}: mes no validado`, href: '#alumnos' });
  if (isAdmin() && A.staff.plans) {
    const n = Object.values(A.staff.plans).filter(p => !p.plan).length;
    if (n) out.push({ ic: 'user-plus', text: `${n} alumno${n > 1 ? 's' : ''} sin fórmula (mensual o ciclo)`, href: '#cuentas' });
  }
  if (contractOn() && A.staff.contracts) {
    const n = A.staff.overview.filter(s => contractState(s.id) !== 'ok').length;
    if (n) out.push({ ic: 'pen', text: `${n} alumno${n > 1 ? 's' : ''} sin el contrato firmado`, href: '#alumnos' });
  }
  const drafts = A.units.filter(u => { const inf = A.unitInfo[u.id]; return inf && inf.count && inf.validated < inf.count; }).length;
  if (admin && drafts) out.push({ ic: 'book', text: `${drafts} unidad${drafts > 1 ? 'es' : ''} en borrador`, href: '#contenido' });
  return out;
}

function viewPanel() {
  const ov = A.staff.overview;
  const active = ov.filter(s => s.week_xp > 0).length;
  const open = ov.reduce((a, s) => a + s.homework_open, 0);
  const acc = ov.filter(s => s.week_accuracy != null);
  const avgAcc = acc.length ? Math.round(acc.reduce((a, s) => a + s.week_accuracy, 0) / acc.length) : null;
  const alerts = staffAlerts(), todo = todoItems(), canAssign = assignable().length > 0;
  const upcoming = (A.staff.groups || []).flatMap(g => g.upcoming.filter(x => x.status !== 'cancelled' && new Date(x.at) > Date.now()).map(x => ({ g, x })))
    .sort((a, b) => new Date(a.x.at) - new Date(b.x.at)).slice(0, 5);
  return `<section class="view" aria-labelledby="h-panel">
  ${topBar('h-panel', 'Inicio', 'Lo que pasó entre clases, antes de la próxima')}
  <div class="bento staff">
    ${reportTile()}
    ${ov.length ? `<article class="tile sky c-4 kpi"><p class="label" style="color:var(--sky-ink)">Activos esta semana</p><p class="big num">${active}<span style="font-size:20px;color:var(--sky-ink)"> / ${ov.length}</span></p></article>
    <article class="tile mint c-4 kpi"><p class="label" style="color:var(--mint-ink)">Tareas pendientes</p><p class="big num">${open}</p></article>
    <article class="tile peach c-4 kpi"><p class="label" style="color:var(--peach-ink)">Aciertos a la primera</p><p class="big num">${avgAcc == null ? '—' : avgAcc + '%'}</p></article>
    <article class="tile c-7"><div class="tile-head"><h2>Necesitan atención</h2>${alerts.length ? `<span class="pill ghost num">${alerts.length}</span>` : ''}</div>
      ${alerts.length ? `<div class="alerts">${alerts.map(a => `<div class="alert"><span class="ava">${esc(initials(a.s.full_name))}</span><p><b>${esc(a.s.full_name)}</b><br>${a.text}</p>${canAssign ? `<button class="btn btn-dark btn-sm" type="button" data-hw-student="${a.s.id}">Asignar tarea</button>` : ''}</div>`).join('')}</div>` : '<p class="muted">Todo el grupo está al día.</p>'}</article>` : noStudentsTile()}
    <article class="tile ${ov.length ? 'c-5' : 'c-6'}"><div class="tile-head"><h2>Por revisar</h2>${todo.length ? `<span class="pill ghost num">${todo.length}</span>` : ''}</div>
      ${todo.length ? `<div class="todo">${todo.map(t => `<a class="todo-row" href="${t.href}"${t.today ? ' data-crm-today' : ''}>${icon(t.ic)}<span>${t.text}</span>${icon('arrow')}</a>`).join('')}</div>` : '<p class="muted">Nada pendiente por ahora.</p>'}</article>
    ${A.staff.groups !== null ? `<article class="tile c-6"><div class="tile-head"><h2>Próximas clases</h2><a class="pill ghost" href="#horarios">Horarios</a></div>
      ${upcoming.length ? upcoming.map(({ g, x }) => `<div class="err-row"><span><b>${esc(cap(sessionLabel(x.at)))}</b><br><span class="muted" style="font-size:13px">${esc(g.name)}${g.teacher ? ' · ' + esc(g.teacher) : ''}</span></span>${x.status === 'moved' ? '<span class="status warn">Cambiada</span>' : ''}</div>`).join('') : '<p class="muted">Sin clases próximas.</p>'}</article>` : ''}
    ${ov.length ? `<article class="tile c-6"><div class="tile-head"><h2>Errores frecuentes</h2><span class="pill ghost">30 días</span></div>
      ${A.staff.errors.length ? A.staff.errors.map(e => { const c = reviewCard({ id: e.exercise_id, type: e.type, ...e.payload }); return `<div class="err-row"><span><s>${esc(c.front)}</s> → <b>${esc(c.back)}</b></span><span class="pill ghost num">${e.students} alumno${e.students === 1 ? '' : 's'}</span></div>`; }).join('') : '<p class="muted">Aún no hay errores registrados.</p>'}</article>` : ''}
  </div></section>`;
}

// End-of-class report (db/018_informe_clase.sql): the units seen today open for the student.
function reportTile() {
  const list = A.staff.reports;
  if (!list || !list.length) return '';
  const due = list.filter(x => !x.report), done = list.filter(x => x.report).slice(0, 4);
  const k = x => `${x.group_id}|${x.scheduled_at}`;
  const who = x => esc(x.students.map(p => p.name).join(', ') || x.group);
  const numsOf = r => r ? (r.unit_numbers && r.unit_numbers.length ? r.unit_numbers : (r.unit_ids || []).map(id => (unitById(id) || {}).number).filter(Boolean)) : [];
  const form = x => {
    const sel = new Set(A.staff.reportSel || numsOf(x.report));
    const name = n => { const u = A.units.find(v => v.level === x.level && v.number === n && !v.is_final); return u ? u.title : ''; };
    const chosen = [...sel].sort((a, b) => a - b);
    return `<form class="form report-form" data-report-form="${esc(k(x))}" data-level="${esc(x.level)}">
      <p style="font-size:14px"><b>${who(x)}</b> · ${esc(cap(sessionLabel(x.at)))}</p>
      <div class="field">Unidades vistas hoy (nivel ${esc(x.level)})${'ABCD'.split('').map((g, i) => `<div class="unit-seg"><span>Segmento ${g}</span><div class="unit-picks" role="group" aria-label="Segmento ${g}">${Array.from({ length: 16 }, (_, j) => i * 16 + j + 1).map(n => `<button type="button" class="u-pick" data-pick="${n}" aria-pressed="${sel.has(n)}" title="${esc(name(n) || 'Unidad ' + n)}">${n}</button>`).join('')}</div></div>`).join('')}</div>
      <p class="muted" style="font-size:13px">${chosen.length ? chosen.map(n => `${n}${name(n) ? '. ' + esc(name(n)) : ''}`).join(' · ') : 'Toca los números de las unidades que viste o repasaste en clase: sus páginas del manual y sus ejercicios se abren para el alumno.'}</p>
      <label class="field" for="rpNote">Nota (opcional)<input id="rpNote" maxlength="500" value="${esc((x.report && x.report.note) || '')}" placeholder="Lo que trabajaron, lo que falta…"></label>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-dark btn-sm" type="submit">Guardar el informe</button><button class="btn btn-light btn-sm" type="button" data-report-cancel>Cancelar</button></div></form>`;
  };
  const row = x => A.staff.reportFor === k(x) ? form(x) : `<div class="err-row"><span><b>${who(x)}</b><br><span class="muted" style="font-size:13px">${esc(cap(sessionLabel(x.at)))}${x.report ? ` · unidades ${numsOf(x.report).sort((a, b) => a - b).join(', ') || '—'}` : ''}</span></span>
      <span class="row-act">${x.report ? '<span class="status">Informado</span>' : '<span class="status warn">Sin informe</span>'}<button class="btn ${x.report ? 'btn-light' : 'btn-dark'} btn-sm" type="button" data-report="${esc(k(x))}">${x.report ? 'Editar' : 'Informar'}</button></span></div>`;
  return `<article class="tile"><div class="tile-head"><h2>Informe de clase</h2>${due.length ? `<span class="pill warn num">${due.length} por informar</span>` : '<span class="pill ghost">Al día</span>'}</div>
    <p class="muted" style="font-size:14px;margin:-6px 0 12px">Al terminar cada clase, marca las unidades que vieron: ${A.staff.settings && A.staff.settings.progression && A.staff.settings.progression.taught_gate ? 'se abren para el alumno, que debe superar sus ejercicios en orden.' : 'quedan anotadas (la apertura por informe se activa en «Ajustes»).'}</p>
    ${due.map(row).join('')}${done.length ? `<p class="label" style="margin-top:12px">Últimos informes</p>${done.map(row).join('')}` : ''}</article>`;
}

function viewAlumnos() {
  const ov = A.staff.overview;
  const showCt = A.staff.contracts != null && (contractOn() || Object.keys(A.staff.contracts).length > 0);
  const rows = ov.map(s => {
    const ds = daysSince(s.last_activity);
    const st = !s.onboarded ? '<span class="status warn">Sin empezar</span>' : ds == null || ds >= 4 ? '<span class="status bad">Inactivo</span>' : s.week_accuracy != null && s.week_accuracy < 60 ? '<span class="status warn">Dificultad</span>' : '<span class="status">Al día</span>';
    return `<tr><td><span class="who"><span class="ava sm">${esc(initials(s.full_name))}</span>${esc(s.full_name)}</span></td><td>${s.level}</td><td class="num">${s.streak ? `${s.streak} día${s.streak === 1 ? '' : 's'}` : '<span class="faint">—</span>'}</td><td>${ds == null ? '<span class="faint">Nunca</span>' : ds === 0 ? 'Hoy' : ds === 1 ? 'Ayer' : `Hace ${ds} días`}</td><td class="num">${s.week_accuracy == null ? '<span class="faint">—</span>' : s.week_accuracy + ' %'}</td><td class="num">${s.homework_done} / ${s.homework_done + s.homework_open}</td>${showCt ? `<td>${contractCell(s)}</td>` : ''}<td>${st}</td></tr>`;
  }).join('');
  return `<section class="view" aria-labelledby="h-alumnos">
  ${topBar('h-alumnos', 'Alumnos', `${ov.length} alumno${ov.length === 1 ? '' : 's'} · su avance y el paso de nivel`)}
  <div class="bento staff">
    ${ov.length ? `<article class="tile"><div class="tile-head"><h2>Avance</h2><span class="pill ghost">Esta semana</span></div><div class="table-wrap"><table><thead><tr><th>Alumno</th><th>Nivel</th><th>Racha</th><th>Última actividad</th><th>Aciertos</th><th>Tareas</th>${showCt ? '<th>Contrato</th>' : ''}<th>Estado</th></tr></thead><tbody>${rows}</tbody></table></div></article>
    ${absencesTile()}
    ${levelTile()}` : noStudentsTile()}
  </div></section>`;
}

// Absences that count toward the exclusion (db/016_avisos.sql); the teacher can justify one.
function absencesTile() {
  const list = A.staff.absences;
  if (!list || !list.length) return '';
  const motives = ((A.contract && A.contract.contract && A.contract.contract.motives) || []).filter(Boolean);
  const keyOf = (s, r) => `${s.student_id}|${r.group_id}|${r.scheduled_at}`;
  const day = d => fmtDate(new Date(d), { day: 'numeric', month: 'short' }).replace('.', '');
  const reqBtns = q => `<button class="btn btn-dark btn-sm" type="button" data-req="${q.id}" data-ok="1">Aceptar</button><button class="btn btn-light btn-sm" type="button" data-req="${q.id}" data-ok="0">Rechazar</button>`;
  const row = (s, r) => {
    const k = keyOf(s, r), q = r.request, deadline = Date.parse(r.at) + 72 * 3600e3;
    const sub = [r.clicked_at ? `Entró a las ${fmtDate(new Date(r.clicked_at), { hour: '2-digit', minute: '2-digit' })}` : 'No entró por el campus'];
    if (r.reason) sub.push(`justificada: ${esc(r.reason)}`);
    else if (q && q.status === 'pending') sub.push(`${q.kind === 'aviso' ? 'avisó' : 'justificativo'}: ${esc(q.reason)}${q.note ? ` («${esc(q.note)}»)` : ''}`);
    else if (Date.now() < deadline) sub.push(`puede justificarla hasta el ${esc(shortWhen(deadline))}`);
    if (r.makeup) sub.push(`recuperación el ${esc(shortWhen(r.makeup.at))}`);
    const when = `<b>${esc(cap(sessionLabel(r.at)))}</b><br><span class="muted" style="font-size:13px">${sub.join(' · ')}</span>`;
    if (A.staff.excusing === k) return `<form class="form excuse-form" data-excuse-form="${esc(k)}">
        <p style="font-size:14px">${when}</p>
        <label class="field" for="exReason">Motivo<select id="exReason">${motives.map(m => `<option>${esc(m)}</option>`).join('')}<option value="__otro">Otro motivo…</option></select></label>
        <label class="field" for="exNote">Nota (comprobante, detalle)<input id="exNote" maxlength="300" placeholder="Certificado médico recibido el…"></label>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-dark btn-sm" type="submit">Justificar</button><button class="btn btn-light btn-sm" type="button" data-excuse-cancel>Cancelar</button></div></form>`;
    if (A.staff.makeupFor === k) {
      const d = new Date(Date.now() + 2 * 864e5), v = r.makeup ? new Date(r.makeup.at) : d, local = `${v.getFullYear()}-${pad2(v.getMonth() + 1)}-${pad2(v.getDate())}T${r.makeup ? pad2(v.getHours()) + ':' + pad2(v.getMinutes()) : '19:00'}`;
      return `<form class="form excuse-form" data-makeup-form="${esc(k)}">
        <p style="font-size:14px">${when}</p>
        <div class="form-2"><label class="field" for="mkAt">Recuperación (tu hora local)<input id="mkAt" type="datetime-local" required value="${local}"></label>
          <label class="field" for="mkDur">Duración (min)<input id="mkDur" type="number" min="15" max="240" step="15" value="${(r.makeup && r.makeup.duration_min) || r.duration_min || 60}"></label></div>
        <p class="muted" style="font-size:13px">La clase aparece en el horario del alumno, con su recordatorio, y cuenta para la asistencia.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-dark btn-sm" type="submit">Programar</button><button class="btn btn-light btn-sm" type="button" data-makeup-cancel>Cancelar</button></div></form>`;
    }
    let tag, acts = '';
    if (r.reason) {
      tag = r.makeup ? '<span class="status">Por recuperar · programada</span>' : '<span class="status warn">Por recuperar</span>';
      acts = `<button class="btn ${r.makeup ? 'btn-light' : 'btn-dark'} btn-sm" type="button" data-makeup="${esc(k)}">${r.makeup ? 'Cambiar' : 'Programar la recuperación'}</button>${r.makeup ? `<button class="btn btn-light btn-sm" type="button" data-makeup-del="${esc(k)}">Quitar</button>` : ''}<button class="btn btn-light btn-sm" type="button" data-unexcuse="${esc(k)}" title="La ausencia vuelve a contar">Quitar la justificación</button>`;
    } else if (q && q.status === 'pending') {
      tag = '<span class="status warn">Por revisar</span>';
      acts = `${q.file_path ? `<button class="btn btn-light btn-sm" type="button" data-proof="${esc(q.file_path)}">Ver el comprobante</button>` : ''}${reqBtns(q)}`;
    } else {
      tag = r.status === 'late' ? '<span class="status warn">Tarde</span>' : `<span class="status bad">${Date.now() < deadline ? 'Ausente' : 'Hora perdida'}</span>`;
      acts = `${q && q.status === 'rejected' ? '<span class="muted" style="font-size:12px">rechazado</span>' : ''}<button class="btn btn-light btn-sm" type="button" data-excuse="${esc(k)}">Justificar</button>`;
    }
    return `<div class="err-row${r.reason ? ' excused' : ''}"><span>${when}</span><span class="row-act">${tag}${acts}</span></div>`;
  };
  const block = s => {
    const plan = s.plan === 'mensual' ? `<span class="pill ghost">Mensual · desde el ${esc(day(s.plan_start))}</span>` : s.plan === 'ciclo' ? '<span class="pill ghost">Ciclo</span>' : `<a class="pill warn" href="#cuentas">Sin fórmula</a>`;
    const m = s.month;
    const month = !m ? '' : m.failed
      ? `<p class="abs-alert">Mes no validado (del ${esc(day(m.failed_from))} al ${esc(day(Date.parse(m.failed_to) - 1000))}): ${m.max} ausencias sin justificar. No pasa de nivel; para seguir, paga de nuevo el mes y rehace sus horas.${isAdmin() ? ` <button class="btn btn-dark btn-sm" type="button" data-month-reset="${s.student_id}">Mes pagado de nuevo</button>` : ''}</p>`
      : `<p class="muted" style="font-size:13px;margin:2px 0 4px"><b class="${m.total >= m.max - 1 && m.total ? 'warn-text' : ''}">${m.total} / ${m.max}</b> ausencias sin justificar en sus 4 semanas (del ${esc(day(m.from))} al ${esc(day(Date.parse(m.to) - 1000))}).</p>`;
    const upcoming = (s.requests || []).filter(q => Date.parse(q.scheduled_at) > Date.now() - 864e5).map(q => `<div class="err-row"><span><b>${esc(cap(sessionLabel(q.scheduled_at)))}</b><br><span class="muted" style="font-size:13px">Avisó que no vendrá: ${esc(q.reason)}${q.note ? ` («${esc(q.note)}»)` : ''}</span></span><span class="row-act">${q.status === 'approved' ? '<span class="status">Avisó a tiempo · por recuperar</span>' : q.status === 'rejected' ? '<span class="status bad">Rechazado</span>' : `<span class="status warn">Aviso tardío</span>${reqBtns(q)}`}</span></div>`).join('');
    return `<div class="abs-student"><div class="abs-head"><b>${esc(s.name)}</b>${plan}</div>
      ${month}${s.lost_minutes ? `<p class="muted" style="font-size:13px;margin:0 0 4px">Horas perdidas: <b>${hoursText(s.lost_minutes)}</b> (no se recuperan).</p>` : ''}
      ${upcoming}
      ${s.record.length ? s.record.map(r => row(s, r)).join('') : '<p class="muted" style="font-size:14px">Ninguna ausencia ni retraso.</p>'}</div>`;
  };
  return `<article class="tile"><div class="tile-head"><h2>Ausencias</h2></div>
    <p class="muted" style="font-size:14px;margin:-6px 0 12px">El alumno avisa desde el campus (48 h antes: se justifica sola) o envía su comprobante en las 72 h siguientes: acéptalo o recházalo aquí. Una ausencia justificada se recupera: programa la clase. Sin justificar, la hora se pierde.</p>
    ${list.map(block).join('')}</article>`;
}

function viewTareas() {
  const ov = A.staff.overview, units = assignable();
  const studentOpts = ov.map(s => `<option value="${s.id}">${esc(s.full_name)}</option>`).join('');
  const pick = A.staff.hwPick;
  const now = new Date(Date.now() + 2 * 864e5); const localDefault = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}T18:00`;
  return `<section class="view" aria-labelledby="h-tareas">
  ${topBar('h-tareas', 'Tareas', 'Lo que el alumno practica entre dos clases')}
  <div class="bento staff">
    ${!ov.length ? noStudentsTile() : `<article class="tile c-6"><div class="tile-head"><h2>Asignar una tarea</h2></div>
      <p class="muted" style="font-size:14px;margin:-6px 0 16px">El alumno la ve en su inicio y en sus avisos.</p>
      ${units.length ? `<form id="hwForm" class="form">
        <label class="field" for="hwUnit">Unidad<select id="hwUnit" required>${units.map(u => `<option value="${u.id}">${u.level} · Unidad ${u.number} · ${esc(u.title)}</option>`).join('')}</select></label>
        <label class="field" for="hwDate">Para el<input id="hwDate" type="date"></label>
        <div class="field">Alumnos<div class="chips">${ov.map((s, i) => `<label for="hw${i}"><input type="checkbox" id="hw${i}" value="${s.id}" ${pick === s.id ? 'checked' : ''}><span>${esc(s.full_name)}</span></label>`).join('')}</div></div>
        <button class="btn btn-dark" type="submit">Asignar</button>
      </form>` : '<p class="muted">Publica al menos una unidad en «Contenido» para poder asignarla.</p>'}</article>
    <article class="tile c-6"><div class="tile-head"><h2>Anotar un error de la clase</h2></div>
      <p class="muted" style="font-size:14px;margin:-6px 0 16px">Se convierte en una tarjeta de repaso del alumno.</p>
      <form id="errForm" class="form">
        <label class="field" for="errStudent">Alumno<select id="errStudent" required>${studentOpts}</select></label>
        <label class="field" for="errWrong">Lo que dijo<input id="errWrong" required maxlength="300" placeholder="J'ai allé au cinéma."></label>
        <label class="field" for="errRight">Corrección<input id="errRight" required maxlength="300" placeholder="Je suis allé au cinéma."></label>
        <label class="field" for="errWhy">Explicación<input id="errWhy" maxlength="500" placeholder="Aller forma el passé composé con être."></label>
        <button class="btn btn-dark" type="submit">${icon('plus')}Añadir al repaso</button>
      </form></article>
    ${A.staff.groups !== null ? '' : `<article class="tile c-6"><div class="tile-head"><h2>Programar la próxima clase</h2></div>
      <form id="classForm" class="form">
        <label class="field" for="clStudent">Alumno<select id="clStudent" required>${studentOpts}</select></label>
        <div class="form-2"><label class="field" for="clAt">Fecha y hora (tu hora local)<input id="clAt" type="datetime-local" required value="${localDefault}"></label>
          <label class="field" for="clLink">Enlace de la clase<input id="clLink" type="url" placeholder="https://zoom.us/j/…"></label></div>
        <button class="btn btn-dark" type="submit">Guardar</button>
      </form></article>`}`}
  </div></section>`;
}

function viewCuentas() {
  const admin = isAdmin();
  return `<section class="view" aria-labelledby="h-cuentas">
  ${topBar('h-cuentas', 'Cuentas', admin ? 'Invitar a alumnos y profesores, y gestionar sus cuentas' : 'Invitar a tus alumnos al campus')}
  <div class="bento staff">${enrollTile()}${inviteTile()}${membersTile()}</div></section>`;
}

function progressionTile() {
  const st = A.staff.settings;
  if (!st || !st.progression || !isAdmin()) return '';
  const on = !!st.progression.taught_gate;
  return `<article class="tile c-6"><div class="tile-head"><h2>Apertura de las unidades</h2><span class="pill ghost">${on ? 'Según el informe' : 'Libre'}</span></div>
    <form id="pgForm" class="form">
      <label class="check-row" for="pgGate"><input id="pgGate" type="checkbox" ${on ? 'checked' : ''}>Abrir cada unidad (sus ejercicios y sus páginas del manual) solo cuando el profesor la marca en su informe de clase</label>
      <p class="muted" style="font-size:13px">Para los ejercicios, el alumno debe además superar las unidades en orden (75 %). Las unidades ya superadas o dadas como tarea siguen abiertas. Sin esta opción, el manual se lee entero y cada unidad se abre al superar la anterior.</p>
      <button class="btn btn-dark" type="submit">Guardar</button>
    </form></article>`;
}
// « Respuestas del asistente » (db/025_mensajes.sql): off = drafts the team sends; on = posted at once.
function assistantTile() {
  const st = A.staff.settings;
  if (!st || !st.assistant || !isAdmin()) return '';
  const on = !!st.assistant.auto_reply;
  return `<article class="tile c-6"><div class="tile-head"><h2>Respuestas del asistente</h2><span class="pill ghost">${on ? 'Automáticas' : 'Borradores por revisar'}</span></div>
    <form id="asForm" class="form">
      <label class="check-row" for="asAuto"><input id="asAuto" type="checkbox" ${on ? 'checked' : ''}>Enviar al alumno, sin revisión, las respuestas que el asistente prepara en «Mensajes»</label>
      <p class="muted" style="font-size:13px">Desactivado: cada respuesta del asistente queda como borrador en la conversación, visible solo para el equipo, con «Enviar» y «Editar»; el alumno no ve nada antes del envío. Activado: la respuesta sale al instante. En los dos casos, lo que decide el profesor (horarios, justificativos, precios, nivel) se le pasa con un correo, y el alumno ve las respuestas firmadas «Equipo Pathway».</p>
      <button class="btn btn-dark" type="submit">Guardar</button>
    </form></article>`;
}
function viewAjustes() {
  return `<section class="view" aria-labelledby="h-ajustes">
  ${topBar('h-ajustes', 'Ajustes', 'Asistencia, recordatorios y correos automáticos')}
  <div class="bento staff">${rulesTile()}${contractTile()}${progressionTile()}${assistantTile()}
    <article class="tile c-6"><div class="tile-head"><h2>Correos automáticos</h2></div>
      <div class="err-row"><span><b>Informe del lunes</b><br><span class="muted" style="font-size:13px">Cada lunes a las 8:00 (hora de Lima), en francés, a las cuentas de administración: clases dadas, grabaciones, retrasos, cambios y alumnos sin actividad.</span></span></div>
      <div class="err-row"><span><b>Aviso de ausencia</b><br><span class="muted" style="font-size:13px">Al alumno, después de cada ausencia sin justificar: puede justificarla en 72 h, si no la hora se pierde; en la fórmula mensual, dónde está respecto a las ausencias que invalidan el mes. Se activa con la asistencia y el contrato.</span></span></div>
      <div class="err-row"><span><b>Recordatorio de clase</b><br><span class="muted" style="font-size:13px">A cada alumno, antes de cada clase, en su hora local. Se activa en «Reglas de asistencia».</span></span></div>
      <div class="err-row"><span><b>Acceso al campus</b><br><span class="muted" style="font-size:13px">El código de 6 cifras para entrar, enviado por Supabase.</span></span></div>
      <button class="btn btn-light" style="margin-top:14px" type="button" data-mail-test>Enviarme los correos de prueba</button>
      <p class="muted" style="font-size:13px;margin-top:10px">La prueba te envía solo a ti el informe del lunes, un recordatorio de clase y un aviso de ausencia de ejemplo.</p></article>
  </div></section>`;
}

// End of level (db/012_fin_nivel.sql): step 1 is validated here by the teacher.
function levelTile() {
  const list = A.staff.levels;
  if (!list || !list.length) return '';
  const name = id => (A.staff.overview.find(s => s.id === id) || {}).full_name || '—';
  const rows = list.slice().sort((a, b) => (b.units_done - a.units_done) || name(a.student_id).localeCompare(name(b.student_id))).map(x => {
    const recent = x.last_promotion && Date.now() - new Date(x.last_promotion) < 14 * 864e5;
    const state = x.teacher_passed_at
      ? (x.has_final ? (x.final_passed_at ? '<span class="status">Nivel superado</span>' : '<span class="status warn">Falta el examen del campus</span>') : '<span class="status">Validado</span>')
      : `<button class="btn ${x.units_done ? 'btn-dark' : 'btn-light'} btn-sm" type="button" data-validate-level="${x.student_id}" data-name="${esc(name(x.student_id))}" data-level="${x.level}" data-done="${x.units_done ? 1 : 0}">Validar el examen ${x.level}</button>`;
    return `<div class="err-row"><span><b>${esc(name(x.student_id))}</b> · ${x.level}<br><span class="muted" style="font-size:13px">${x.units_done ? 'Todas las unidades superadas' : 'Unidades en curso'}${x.has_final ? ' · examen final en el campus' : ''}${recent ? ` · pasó a ${esc(x.last_promotion_to || '')} hace poco` : ''}</span></span>${state}</div>`;
  }).join('');
  return `<article class="tile c-6"><div class="tile-head"><h2>Fin de nivel</h2></div>
    <p class="muted" style="font-size:14px;margin:-6px 0 12px">Paso 1: valida aquí el examen que el alumno hizo contigo. Paso 2: el examen final del campus, si el nivel tiene uno publicado. Con los dos, el alumno pasa solo al nivel siguiente.</p>${rows}</article>`;
}

// Enrollment requests sent from the website form (db/021_solicitudes.sql).
const ENR_LANG = { es: 'español', fr: 'francés', en: 'inglés', de: 'alemán' };
const enrPlan = r => r.plan ? `${r.plan}${r.hours ? ` · ${r.hours} h/semana` : ''}${r.billing ? ` · ${r.billing === 'Ciclo' ? 'ciclo completo' : 'mensual'}` : ''}` : 'Ritmo por recomendar';
const enrDay = d => d ? fmtDate(new Date(d + 'T12:00:00Z'), { day: 'numeric', month: 'short', year: 'numeric' }, 'UTC') : '—';
function enrollTile() {
  const list = A.staff.enrollments;
  if (!isAdmin() || !list) return '';
  const open = list.filter(r => !r.handled_at);
  const shown = A.staff.enrAll ? list : open;
  const detail = r => {
    const wa = String(r.whatsapp || '').replace(/[^\d]/g, '');
    const rows = [
      ['Correo', `<a href="mailto:${esc(r.email)}">${esc(r.email)}</a>`],
      ['WhatsApp', r.whatsapp ? `<a href="https://wa.me/${wa}" target="_blank" rel="noopener">${esc(r.whatsapp)}</a>` : '—'],
      ['Objetivo', esc(r.objective || '—')],
      ['Nivel del test', r.level ? esc(r.level) : 'sin test de nivel'],
      ['Fórmula', esc(enrPlan(r))],
      ['Zona horaria', esc(r.timezone || '—')],
      ['Inicio ideal', esc(enrDay(r.start_date))],
      ['Días posibles', esc((r.days || []).join(', ') || '—')],
      ['Franjas', esc((r.times || []).join(', ') || '—')],
      ['Examen TEF / TCF', esc(r.exam_date ? enrDay(r.exam_date) : 'sin fecha')],
      ['Precisiones', esc(r.comments || '—')],
      ['Idioma del sitio', esc(ENR_LANG[r.lang] || r.lang || '—')],
      ['Recibida', esc(fmtDate(new Date(r.created_at), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))]
    ];
    if (r.handled_at) rows.push(['Atendida', esc(`${fmtDate(new Date(r.handled_at), { day: 'numeric', month: 'short' })}${r.handled_by ? ` · ${r.handled_by}` : ''}`)]);
    return `<dl class="enr-detail">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
  };
  const prospectOf = r => (A.staff.prospects || []).find(p => p.email === r.email);
  const row = r => {
    const on = A.staff.enrOpen === r.id, pr = prospectOf(r);
    return `<div class="enr-row${r.handled_at ? ' done' : ''}"><div class="err-row"><span style="min-width:0"><b>${esc(r.name)}</b><br><span class="muted" style="font-size:13px">${esc(r.email)} · ${esc(enrPlan(r))}${r.level ? ` · test ${esc(r.level)}` : ''} · ${esc(fmtDate(new Date(r.created_at), { day: 'numeric', month: 'short' }))}</span></span>
      <span class="row-act">${r.handled_at ? '<span class="status">Atendida</span>' : ''}<button class="btn btn-light btn-sm" type="button" data-enr-open="${r.id}" aria-expanded="${on}">${on ? 'Cerrar' : 'Ver'}</button>${pr ? `<a class="btn btn-light btn-sm" href="#prospectos" data-crm-goto="${pr.id}" title="Ficha en Prospectos">${icon('funnel')}Prospecto</a>` : ''}${A.staff.invitesReady ? `<button class="btn btn-dark btn-sm" type="button" data-enr-invite="${r.id}">${icon('user-plus')}Invitar</button>` : ''}${r.handled_at ? `<button class="btn btn-light btn-sm" type="button" data-enr-done="${r.id}" data-on="0">Reabrir</button>` : `<button class="btn btn-light btn-sm" type="button" data-enr-done="${r.id}" data-on="1">${icon('check')}Marcar como atendida</button>`}</span></div>
      ${on ? detail(r) : ''}</div>`;
  };
  return `<article class="tile" id="solicitudes"><div class="tile-head"><h2>Solicitudes de inscripción</h2><span class="pill ${open.length ? 'warn' : 'ghost'} num">${open.length} por atender</span></div>
    <p class="muted" style="font-size:14px;margin:-6px 0 12px">Llegan del formulario de inscripción del sitio (también abren un mensaje de WhatsApp). «Invitar» completa la invitación con el correo, el nombre y el nivel del test.</p>
    ${shown.length ? shown.map(row).join('') : `<p class="muted">${list.length ? 'Todas las solicitudes están atendidas.' : 'Todavía no hay solicitudes.'}</p>`}
    ${list.length > open.length ? `<button class="btn btn-light btn-sm" style="margin-top:12px" type="button" data-enr-all>${A.staff.enrAll ? 'Ver solo las pendientes' : `Ver también las atendidas (${list.length - open.length})`}</button>` : ''}</article>`;
}

function inviteTile() {
  if (!A.staff.invitesReady) return '';
  const admin = A.profile.role === 'admin';
  const teacherName = id => (A.staff.teachers.find(t => t.id === id) || {}).full_name || '—';
  const list = A.staff.invitations;
  const byEmail = Object.fromEntries((A.staff.members || []).map(m => [String(m.email).toLowerCase(), m]));
  const byName = Object.fromEntries(A.staff.overview.map(m => [m.full_name, m]));
  const joined = i => { const m = byEmail[i.email] || byName[i.full_name]; return !!(m && m.onboarded); };
  const memberId = i => (byEmail[i.email] || {}).id || '';
  const open = list.filter(i => !joined(i)).length;
  return `<article class="tile c-6"><div class="tile-head"><h2>Invitar a un alumno</h2></div>
      <p class="muted" style="font-size:14px;margin:-6px 0 16px">Recibe un correo para entrar al campus. Su nombre, su nivel y su profesor ya quedan configurados.</p>
      <form id="invForm" class="form" novalidate>
        <p class="muted" id="invTest" style="font-size:13px;margin:0 0 10px" hidden></p>
        <div class="form-2"><label class="field" for="invEmail">Correo<input id="invEmail" type="email" inputmode="email" autocomplete="off" required placeholder="alumno@correo.com"></label>
          <label class="field" for="invName">Nombre y apellido<input id="invName" required maxlength="120" placeholder="Valentina Rojas"></label></div>
        <div class="form-2"><label class="field" for="invLevel">Nivel<select id="invLevel">${LEVELS.map(l => `<option ${l === 'A2' ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          ${admin ? `<label class="field" for="invTeacher">Profesor<select id="invTeacher">${A.staff.teachers.map(t => `<option value="${t.id}" ${t.id === A.profile.id ? 'selected' : ''}>${esc(t.full_name)}</option>`).join('')}</select></label>`
            : `<div class="field">Profesor<input value="${esc(A.profile.full_name)}" disabled></div>`}</div>
        ${admin ? `<label class="field" for="invRole">Tipo de cuenta<select id="invRole"><option value="student" selected>Alumno</option><option value="teacher">Profesor</option></select></label>` : ''}
        <button class="btn btn-dark" type="submit">${icon('plus')}Enviar la invitación</button>
      </form></article>
    <article class="tile c-6"><div class="tile-head"><h2>Invitaciones</h2><span class="pill ghost num">${open} pendiente${open === 1 ? '' : 's'}</span></div>
      ${list.length ? list.slice(0, 12).map(i => `<div class="err-row"><span><b>${esc(i.full_name)}</b><br><span class="muted" style="font-size:13px">${esc(i.email)} · ${i.role === 'teacher' ? 'Profesor' : `${i.level} · ${esc(teacherName(i.teacher_id))}`}</span></span>
        ${joined(i) ? '<span class="status">Activa</span>' : `<span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;align-items:center"><span class="status warn">Enviada</span><button class="btn btn-light btn-sm" type="button" data-resend="${esc(i.email)}">Reenviar</button>${!i.accepted_at ? `<button class="btn btn-light btn-sm" type="button" data-cancel-inv="${esc(i.email)}">Cancelar</button>` : memberId(i) ? `<button class="btn btn-light btn-sm" type="button" data-cancel-member="${memberId(i)}" data-cancel-name="${esc(i.full_name)}">Cancelar</button>` : ''}</span>`}</div>`).join('')
        : '<p class="muted">Todavía no has invitado a nadie.</p>'}</article>`;
}

function membersTile() {
  const list = A.staff.members;
  if (A.profile.role !== 'admin' || !list) return '';
  const teachers = A.staff.teachers;
  const row = m => {
    const last = daysSince(m.last_activity);
    const pl = A.staff.plans && A.staff.plans[m.id];
    const meta = `${esc(m.email)} · ${m.role === 'admin' ? 'Administración' : m.role === 'teacher' ? 'Profesor' : `${m.level} · ${esc(m.teacher_name || 'sin profesor')}${pl ? ` · ${pl.plan === 'mensual' ? `mensual desde el ${esc(fmtDate(new Date(pl.plan_start + 'T12:00:00Z'), { day: 'numeric', month: 'short' }, 'UTC'))}` : pl.plan === 'ciclo' ? 'ciclo' : 'sin fórmula'}` : ''}`} · ${!m.onboarded ? 'sin empezar' : last == null ? 'sin actividad' : last === 0 ? 'activo hoy' : `hace ${last} día${last === 1 ? '' : 's'}`}`;
    if (A.staff.editing === m.id) {
      return `<form class="member-edit form" data-member-form="${m.id}">
        <div class="form-2"><label class="field" for="mName">Nombre<input id="mName" required maxlength="120" value="${esc(m.full_name)}"></label>
          <label class="field" for="mRole">Tipo de cuenta<select id="mRole"><option value="student" ${m.role === 'student' ? 'selected' : ''}>Alumno</option><option value="teacher" ${m.role === 'teacher' ? 'selected' : ''}>Profesor</option></select></label></div>
        <div class="form-2"><label class="field" for="mLevel">Nivel<select id="mLevel">${LEVELS.map(l => `<option ${l === m.level ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
          <label class="field" for="mTeacher">Profesor<select id="mTeacher"><option value="">Sin profesor</option>${teachers.filter(t => t.id !== m.id).map(t => `<option value="${t.id}" ${t.id === m.teacher_id ? 'selected' : ''}>${esc(t.full_name)}</option>`).join('')}</select></label></div>
        ${m.role === 'student' && A.staff.plans ? (() => { const pl = A.staff.plans[m.id] || {}; return `<div class="form-2"><label class="field" for="mPlan">Fórmula<select id="mPlan"><option value="">Sin definir</option><option value="mensual" ${pl.plan === 'mensual' ? 'selected' : ''}>Mensual (4 semanas)</option><option value="ciclo" ${pl.plan === 'ciclo' ? 'selected' : ''}>Ciclo completo</option></select></label>
          <label class="field" for="mPlanStart">Inicio<input id="mPlanStart" type="date" value="${esc(pl.plan_start || '')}"></label></div>`; })() : ''}
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-dark btn-sm" type="submit">Guardar</button><button class="btn btn-light btn-sm" type="button" data-member-cancel>Cancelar</button></div>
      </form>`;
    }
    const confirming = A.staff.confirmDel === m.id;
    return `<div class="err-row"><span style="min-width:0"><b>${esc(m.full_name)}</b><br><span class="muted" style="font-size:13px">${meta}</span></span>
      <span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${confirming
        ? `<button class="btn btn-coral btn-sm" type="button" data-member-delete="${m.id}">Eliminar definitivamente</button><button class="btn btn-light btn-sm" type="button" data-member-cancel>No</button>`
        : m.role === 'admin' ? '<span class="status">Admin</span>'
        : `<button class="btn btn-light btn-sm" type="button" data-member-edit="${m.id}">Editar</button><button class="btn btn-light btn-sm" type="button" data-member-ask="${m.id}">Eliminar</button>`}</span></div>
      ${confirming ? `<p class="form-error" style="margin:0 0 12px">Se borran la cuenta de ${esc(m.full_name)} y todo su progreso. No se puede deshacer.</p>` : ''}`;
  };
  return `<article class="tile"><div class="tile-head"><h2>Miembros</h2><span class="pill ghost num">${list.length} cuenta${list.length === 1 ? '' : 's'}</span></div>
    <p class="muted" style="font-size:14px;margin:-6px 0 12px">Solo tú ves esta lista: cambia el nombre, el nivel, el profesor o el tipo de cuenta, o elimina una cuenta.</p>
    ${list.length ? list.map(row).join('') : '<p class="muted">Todavía no hay alumnos ni profesores.</p>'}</article>`;
}

/* ───────────── Prospectos (db/023_crm.sql): only admins ───────────── */
// Every lead from the first contact to the enrolment. The website test, the enrollment form and
// the CRS calculator create or complete the prospects by themselves; the team adds the others.
const CRM_STAGES = [
  { id: 'nuevo', name: 'Nuevo', color: 'var(--coral)' },
  { id: 'contactado', name: 'Contactado', color: 'var(--sky-ink)' },
  { id: 'test', name: 'Test hecho', color: 'var(--lilac-ink)' },
  { id: 'horario', name: 'Horario propuesto', color: 'var(--butter-ink)' },
  { id: 'inscrito', name: 'Inscrito', color: 'var(--mint-ink)' },
  { id: 'activo', name: 'Activo', color: 'var(--ink)' },
  { id: 'pausa', name: 'En pausa / Perdido', color: 'var(--ink-3)' }
];
// [label, chip colour, arrives by itself from the website]
const CRM_ORIGINS = {
  test: ['Test de nivel', 'lilac', true], form: ['Formulario de inscripción', 'mint', true], calc: ['Calculadora CRS', 'sky', true], ads: ['Publicidad', 'peach', true],
  whatsapp: ['WhatsApp', 'mint', false], superprof: ['Superprof', 'butter', false], instagram: ['Instagram', 'peach', false], tiktok: ['TikTok', 'stone', false],
  facebook: ['Facebook', 'sky', false], referral: ['Recomendación', 'lilac', false], email: ['Correo', 'stone', false], alumni: ['Antiguo alumno', 'butter', false], other: ['Otro', 'stone', false]
};
const CRM_AV = ['peach', 'lilac', 'mint', 'butter', 'sky'];
const CRM_OWNER_COLORS = ['var(--coral)', 'var(--sky-ink)', 'var(--mint-ink)', 'var(--lilac-ink)', 'var(--butter-ink)'];
const crmPhone = () => matchMedia('(max-width: 719px)').matches;
const C = { q: '', origin: '', owner: '', today: false, view: null, open: null, detail: null, editing: false, pause: false, lastFocus: null, drag: null };
const crmToday = () => dayKey(new Date());
const crmList = () => A.staff.prospects || [];
const crmById = id => crmList().find(p => p.id === id);
const crmDue = () => crmList().filter(p => p.next_due && p.next_due <= crmToday());
const crmName = p => p.name || p.email || p.whatsapp || 'Sin nombre';
const crmOwners = () => (A.staff.teachers || []).filter(t => t.role === 'admin');
const crmOwnerColor = id => CRM_OWNER_COLORS[Math.max(0, crmOwners().findIndex(o => o.id === id)) % CRM_OWNER_COLORS.length];
const crmHash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const crmDay = d => d ? fmtDate(new Date(d.length === 10 ? d + 'T12:00:00Z' : d), { day: 'numeric', month: 'short' }, d.length === 10 ? 'UTC' : tzOf()).replace('.', '') : '';
const crmDue1 = d => !d ? '' : d < crmToday() ? 'late' : d === crmToday() ? 'today' : '';
const crmDueLabel = d => !d ? '' : d < crmToday() ? `Atrasado · ${crmDay(d)}` : d === crmToday() ? 'Hoy' : crmDay(d);
const crmPlan = p => p.plan ? `${p.plan}${p.hours ? ` · ${p.hours} h/semana` : ''}${p.billing ? ` · ${p.billing === 'Ciclo' ? 'ciclo completo' : 'mensual'}` : ''}` : '';
const crmOriginChip = p => { const [n, c] = CRM_ORIGINS[p.origin] || CRM_ORIGINS.other; return `<span class="crm-chip ${c}">${n}${p.campaign ? ' · ' + esc(p.campaign) : ''}${p.referrer_name ? ' · de ' + esc(p.referrer_name) : ''}</span>`; };

async function loadCrm() {
  const r = await sb.rpc('crm_prospects');
  A.staff.prospects = r.error ? null : (r.data || []); // needs db/023_crm.sql
}
function crmVisible() {
  const q = C.q.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''), today = crmToday();
  const digits = q.replace(/\D/g, '');
  return crmList().filter(p => {
    if (C.origin && p.origin !== C.origin) return false;
    if (C.owner && (C.owner === 'none' ? p.owner_id : p.owner_id !== C.owner)) return false;
    if (C.today && !(p.next_due && p.next_due <= today)) return false;
    if (!q) return true;
    const hay = [p.name, p.email, p.whatsapp, p.country, p.campaign].join(' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return hay.includes(q) || (digits.length >= 3 && String(p.whatsapp || '').replace(/\D/g, '').includes(digits));
  });
}
function crmCard(p, drag) {
  const sub = p.stage === 'activo' ? (p.active_at ? `Alumno desde el ${crmDay(p.active_at)}` : 'Alumno') : p.stage === 'pausa' ? `${p.pause_kind || 'En pausa'}${p.reason ? ' · ' + p.reason : ''}` : '';
  return `<div class="crm-card" role="button" tabindex="0" ${drag ? 'draggable="true"' : ''} data-crm-open="${p.id}" aria-label="Abrir la ficha de ${esc(crmName(p))}">
    <span class="crm-card-top"><span class="ava sm crm-av ${CRM_AV[crmHash(p.id) % CRM_AV.length]}" aria-hidden="true">${esc(initials(crmName(p)))}</span><span class="crm-card-name">${esc(crmName(p))}</span>${p.level ? `<span class="crm-lvl" title="Nivel del test">${esc(p.level)}</span>` : ''}</span>
    <span class="crm-chips">${crmOriginChip(p)}${p.plan ? `<span class="crm-chip stone">${esc(p.plan)}${p.hours ? ` ${p.hours} h` : ''}</span>` : ''}</span>
    ${sub ? `<span class="crm-next">${esc(sub)}</span>` : ''}
    ${p.next_action ? `<span class="crm-next ${crmDue1(p.next_due)}"><span aria-hidden="true">→</span><span>${esc(p.next_action)}${p.next_due ? ` · ${crmDueLabel(p.next_due)}` : ''}</span></span>` : ''}
    <span class="crm-owner">${p.owner_id ? `<i style="background:${crmOwnerColor(p.owner_id)}" aria-hidden="true">${esc(initials(p.owner || '?')[0] || '?')}</i>${esc(firstName(p.owner))}` : 'Sin responsable'}</span>
  </div>`;
}
function crmBody() {
  const list = crmVisible(), board = C.view === 'board';
  const by = id => list.filter(p => p.stage === id);
  if (!crmList().length) return `<article class="tile empty"><h2>Todavía no hay prospectos</h2><p class="muted">Los que hacen el test de nivel, envían el formulario de inscripción o dejan su WhatsApp en la calculadora CRS aparecen aquí solos. Los demás se añaden con «Añadir prospecto».</p></article>`;
  if (board) {
    return `<div class="crm-board-wrap"><div class="crm-board">${CRM_STAGES.map(s => `<section class="crm-col" data-stage="${s.id}" aria-labelledby="crm-col-${s.id}">
      <div class="crm-col-head"><span class="crm-dot" style="background:${s.color}" aria-hidden="true"></span><h2 id="crm-col-${s.id}">${s.name}</h2><span class="crm-n num">${by(s.id).length}</span></div>
      <div class="crm-col-list">${by(s.id).map(p => crmCard(p, true)).join('') || '<p class="crm-empty">Nadie en esta etapa</p>'}</div></section>`).join('')}</div></div>`;
  }
  const groups = CRM_STAGES.filter(s => by(s.id).length);
  return groups.length ? `<div class="crm-list">${groups.map(s => `<section class="crm-group" aria-labelledby="crm-g-${s.id}"><h2 id="crm-g-${s.id}"><span class="crm-dot" style="background:${s.color}" aria-hidden="true"></span><span>${s.name}</span><span class="crm-n num">${by(s.id).length}</span></h2>
    <div class="crm-col-list">${by(s.id).map(p => crmCard(p, false)).join('')}</div></section>`).join('')}</div>` : '<p class="crm-empty">Ningún prospecto con estos filtros.</p>';
}
function crmKpis() {
  const list = crmList(), month = crmToday().slice(0, 7);
  const inMonth = d => d && dayKey(new Date(d)).slice(0, 7) === month;
  const fresh = list.filter(p => inMonth(p.created_at)).length;
  const enrolled = list.filter(p => inMonth(p.enrolled_at)).length;
  const counts = {};
  for (const p of list) if (p.enrolled_at) counts[p.origin] = (counts[p.origin] || 0) + 1;
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const due = crmDue().length, mName = MONTHS_L[+month.slice(5) - 1];
  return [
    [`Nuevos en ${mName}`, fresh, fresh === 1 ? 'prospecto' : 'prospectos'],
    [`Inscritos en ${mName}`, enrolled, fresh ? `${Math.round(enrolled / fresh * 100)} % de los nuevos` : 'sin nuevos este mes'],
    ['Origen que más inscribe', best ? (CRM_ORIGINS[best[0]] || CRM_ORIGINS.other)[0] : '—', best ? `${best[1]} ${best[1] === 1 ? 'inscrito' : 'inscritos'}` : 'todavía nadie inscrito'],
    ['Para hoy', due, due ? 'acciones pendientes o atrasadas' : 'todo al día']
  ].map(([l, v, s], i) => `<div class="tile crm-kpi${i === 3 && due ? ' due' : ''}"><span class="label">${l}</span><strong class="${typeof v === 'string' ? 'txt' : 'num'}">${esc(v)}</strong><small>${esc(s)}</small></div>`).join('');
}
function viewProspectos() {
  if (!C.view) C.view = crmPhone() ? 'list' : 'board';
  const owners = crmOwners();
  return `<section class="view" aria-labelledby="h-crm">
  ${topBar('h-crm', 'Prospectos', 'Del primer contacto a la inscripción. Solo administración.', `<button class="btn btn-dark btn-sm crm-add-top" type="button" data-crm-add>${icon('plus')}Añadir prospecto</button>`)}
  <section class="crm-kpis" aria-label="Resumen del mes">${crmKpis()}</section>
  <div class="crm-tools tile">
    <label class="crm-search" for="crmQ">${icon('search')}<input id="crmQ" type="search" autocomplete="off" placeholder="Nombre, correo o WhatsApp" aria-label="Buscar un prospecto" value="${esc(C.q)}"></label>
    <select id="crmOrigin" aria-label="Origen"><option value="">Todos los orígenes</option>${Object.entries(CRM_ORIGINS).map(([k, [n]]) => `<option value="${k}" ${C.origin === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
    <select id="crmOwner" aria-label="Responsable"><option value="">Todos los responsables</option>${owners.map(o => `<option value="${o.id}" ${C.owner === o.id ? 'selected' : ''}>${esc(o.full_name)}</option>`).join('')}<option value="none" ${C.owner === 'none' ? 'selected' : ''}>Sin responsable</option></select>
    <button type="button" class="crm-toggle" id="crmToday" aria-pressed="${C.today}">${icon('calendar')}Para hoy${crmDue().length ? ` <span class="num">${crmDue().length}</span>` : ''}</button>
    <div class="switch crm-view" role="group" aria-label="Vista"><button type="button" data-crm-view="board" aria-pressed="${C.view === 'board'}">Tablero</button><button type="button" data-crm-view="list" aria-pressed="${C.view === 'list'}">Lista</button></div>
    <button class="btn btn-dark btn-sm crm-add" type="button" data-crm-add>${icon('plus')}Añadir prospecto</button>
  </div>
  <div id="crmBody">${crmBody()}</div>
  <p class="muted crm-foot">${C.view === 'board' && !crmPhone() ? 'Arrastra una tarjeta a otra columna para cambiar su etapa, o ábrela para ver su ficha. ' : ''}Las etapas avanzan solas con el test, la invitación al Campus, el contrato firmado y la primera clase.</p>
  </section>`;
}
const crmRefreshBody = () => { const b = $('#crmBody'); if (b) b.innerHTML = crmBody(); };

// Side sheet: the person, the next action, the fields and the history.
function crmWaLink(p) {
  const n = String(p.whatsapp || '').replace(/\D/g, '');
  if (n.length < 6) return '';
  const me = firstName(A.profile.full_name), hi = `Hola${p.name ? ' ' + firstName(p.name) : ''}, soy ${me} de Pathway.`;
  const body = p.stage === 'activo' || p.stage === 'inscrito' ? '¿Cómo vas con el Campus? Si necesitas algo para tus clases, aquí estoy.'
    : p.level ? `Vi tu resultado del test de nivel (${p.level}). ¿Te parece si coordinamos una llamada corta para proponerte un horario y un ritmo?`
    : p.plan ? `Recibimos tu solicitud de inscripción (${crmPlan(p)}). ¿Te parece si te propongo un horario?`
    : p.origin === 'calc' ? `Vi que calculaste tu puntaje CRS${p.crs_score ? ` (${p.crs_score})` : ''}. Con el francés puedes sumar muchos puntos: ¿quieres hacer el test de nivel gratis? https://pathway-languages.com/test-placement.html`
    : 'Te escribo por tu proyecto con el francés. ¿Te parece si coordinamos una llamada corta?';
  return `https://wa.me/${n}?text=${encodeURIComponent(hi + ' ' + body)}`;
}
function crmSheet() {
  const p = C.detail || crmById(C.open);
  if (!p) return '';
  const owners = crmOwners(), wa = crmWaLink(p);
  const canInvite = A.staff.invitesReady && !p.student_id && p.stage !== 'activo';
  const strong = ['horario', 'inscrito'].includes(p.stage);
  const evIcon = e => e.kind === 'note' ? `<span class="crm-t-ico stone" aria-hidden="true">${icon('pen')}</span>` : `<span class="crm-t-ico lilac" aria-hidden="true">${icon('sparkle')}</span>`;
  const kv = [
    ['WhatsApp', p.whatsapp ? (wa ? `<a href="${esc(wa)}" target="_blank" rel="noopener">${esc(p.whatsapp)}</a>` : esc(p.whatsapp)) : '—'],
    ['Correo', p.email ? `<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>` : '—'],
    ['País', esc(p.country || '—')], ['Zona horaria', esc(p.timezone || '—')],
    ['Objetivo', esc(p.goal || '—')], ['Examen', esc([p.exam, p.exam_date ? crmDay(p.exam_date) + ' ' + p.exam_date.slice(0, 4) : ''].filter(Boolean).join(' · ') || '—')],
    ['Nivel del test', p.level ? `${esc(p.level)}${p.level_score != null ? ` · ${p.level_score}/100` : ''}` : 'Sin test todavía'],
    ['Ritmo deseado', esc(crmPlan(p) || '—')],
    ...(p.crs_score ? [['Puntaje CRS', `${p.crs_score}`]] : []),
    ['Origen', `${(CRM_ORIGINS[p.origin] || CRM_ORIGINS.other)[0]}${p.campaign ? ` · campaña «${esc(p.campaign)}»` : ''}${p.source ? ` · ${esc(p.source)}` : ''}${p.referrer_name ? ` · recomendado por ${esc(p.referrer_name)}` : ''}`],
    ['En el Campus', p.student_id ? esc(p.student_name || 'Cuenta creada') : p.invited_at ? `Invitado el ${crmDay(p.invited_at)}` : 'Todavía no'],
    ['Creado', crmDay(p.created_at)]
  ];
  const edit = C.editing ? `<form class="form crm-edit" id="crmEditForm" novalidate>
      <div class="form-2"><label class="field" for="ceName">Nombre y apellido<input id="ceName" maxlength="120" value="${esc(p.name || '')}"></label>
        <label class="field" for="ceWa">WhatsApp<input id="ceWa" type="tel" maxlength="40" value="${esc(p.whatsapp || '')}"></label></div>
      <div class="form-2"><label class="field" for="ceEmail">Correo<input id="ceEmail" type="email" maxlength="200" value="${esc(p.email || '')}"></label>
        <label class="field" for="ceCountry">País o ciudad<input id="ceCountry" maxlength="120" value="${esc(p.country || '')}"></label></div>
      <label class="field" for="ceGoal">Objetivo<input id="ceGoal" maxlength="300" value="${esc(p.goal || '')}"></label>
      <div class="form-2"><label class="field" for="ceExam">Examen<select id="ceExam"><option value="">Por definir</option>${['TEF Canada', 'TCF Canada', 'TEFAQ', 'TCF Québec'].map(x => `<option ${p.exam === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <label class="field" for="ceExamDate">Fecha del examen<input id="ceExamDate" type="date" value="${esc(p.exam_date || '')}"></label></div>
      <div class="form-2"><label class="field" for="ceLevel">Nivel<select id="ceLevel"><option value="">Sin nivel</option>${LEVELS.map(l => `<option ${p.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="field" for="cePlan">Fórmula<select id="cePlan"><option value="">Por definir</option>${['Esencial', 'Acelerado', 'Intensivo'].map(x => `<option ${p.plan === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div>
      <div class="form-2"><label class="field" for="ceHours">Horas por semana<input id="ceHours" type="number" min="1" max="12" value="${esc(p.hours ?? '')}"></label>
        <label class="field" for="ceBilling">Pago<select id="ceBilling"><option value="">Por definir</option><option value="Mensual" ${p.billing === 'Mensual' ? 'selected' : ''}>Mensual</option><option value="Ciclo" ${p.billing === 'Ciclo' ? 'selected' : ''}>Ciclo completo</option></select></label></div>
      <div class="form-2"><label class="field" for="ceOrigin">Origen<select id="ceOrigin">${Object.entries(CRM_ORIGINS).map(([k, [n]]) => `<option value="${k}" ${p.origin === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="field" for="ceRef">Recomendado por<input id="ceRef" maxlength="120" value="${esc(p.referrer_name || '')}" placeholder="Si llegó por recomendación"></label></div>
      <div class="crm-row"><button class="btn btn-dark btn-sm" type="submit">Guardar la ficha</button><button class="btn btn-light btn-sm" type="button" data-crm-edit="0">Cancelar</button></div>
    </form>` : `<dl class="crm-kv">${kv.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    <div class="crm-row"><button class="btn btn-light btn-sm" type="button" data-crm-edit="1">${icon('pen')}Editar la ficha</button></div>`;
  return `<div class="crm-sheet-head"><span class="ava crm-av ${CRM_AV[crmHash(p.id) % CRM_AV.length]}" aria-hidden="true">${esc(initials(crmName(p)))}</span>
      <div style="min-width:0"><h2 id="crmName">${esc(crmName(p))}</h2><p>${p.country ? `<span>${esc(p.country)}</span>` : ''}${crmOriginChip(p)}</p></div>
      <button class="round" type="button" data-crm-close aria-label="Cerrar la ficha">${icon('x')}</button></div>
    <section class="crm-box" aria-labelledby="crmStageT"><h3 id="crmStageT">Etapa</h3>
      <div class="crm-stage-pick" role="group" aria-labelledby="crmStageT">${CRM_STAGES.map(s => `<button type="button" data-crm-stage="${s.id}" aria-pressed="${s.id === p.stage}">${s.name}</button>`).join('')}</div>
      ${p.stage === 'pausa' ? `<form class="crm-row crm-pause" id="crmPauseForm"><label class="field" for="cpKind">Estado<select id="cpKind"><option ${p.pause_kind !== 'Perdido' ? 'selected' : ''}>En pausa</option><option ${p.pause_kind === 'Perdido' ? 'selected' : ''}>Perdido</option></select></label>
        <label class="field" for="cpReason">Motivo<input id="cpReason" maxlength="300" value="${esc(p.reason || '')}" placeholder="Ej.: vuelve en enero"></label><button class="btn btn-dark btn-sm" type="submit">Guardar</button></form>` : ''}
      <div class="crm-row">${wa ? `<a class="btn btn-light btn-sm" href="${esc(wa)}" target="_blank" rel="noopener">${icon('chat')}Abrir WhatsApp</a>` : '<button class="btn btn-light btn-sm" type="button" disabled title="Sin número de WhatsApp">Sin WhatsApp</button>'}
        ${canInvite ? `<button class="btn ${strong ? 'btn-coral' : 'btn-light'} btn-sm" type="button" data-crm-invite>${icon('user-plus')}${p.invited_at ? 'Volver a invitar' : 'Invitar al Campus'}</button>` : ''}</div>
      <p class="muted crm-note">${wa ? '«Abrir WhatsApp» prepara un mensaje en español; tú decides si lo envías. ' : ''}${canInvite ? '«Invitar al Campus» abre la invitación con el correo, el nombre y el nivel del test.' : p.student_id ? 'Ya tiene su cuenta en el Campus.' : ''}</p></section>
    <section class="crm-box" aria-labelledby="crmNextT"><h3 id="crmNextT">Próxima acción</h3>
      <form class="form" id="crmNextForm" novalidate>
        <div class="crm-row"><label class="field crm-grow" for="cnWhat">Qué hacer<input id="cnWhat" maxlength="200" value="${esc(p.next_action || '')}" placeholder="Ej.: relanzar por WhatsApp"></label>
          <label class="field" for="cnDue">Fecha<input id="cnDue" type="date" value="${esc(p.next_due || '')}"></label></div>
        <label class="field" for="cnOwner">Responsable<select id="cnOwner"><option value="">Sin responsable</option>${owners.map(o => `<option value="${o.id}" ${o.id === p.owner_id ? 'selected' : ''}>${esc(o.full_name)}</option>`).join('')}</select></label>
        <div class="crm-row"><button class="btn btn-dark btn-sm" type="submit">Guardar</button>${p.next_action || p.next_due ? '<button class="btn btn-light btn-sm" type="button" data-crm-done>' + icon('check') + 'Hecho</button>' : ''}</div>
      </form></section>
    <section class="crm-box" aria-labelledby="crmFichaT"><h3 id="crmFichaT">Ficha</h3>${edit}</section>
    <section class="crm-box" aria-labelledby="crmHistT"><h3 id="crmHistT">Historial</h3>
      ${C.detail ? `<ul class="crm-timeline">${(C.detail.events || []).map(e => `<li>${evIcon(e)}<span>${esc(e.body)}<small>${esc(crmDay(e.created_at))} · ${e.kind === 'note' ? `nota${e.author ? ' de ' + esc(firstName(e.author)) : ''}` : `<span class="crm-auto">automático</span>${e.author ? ' · ' + esc(firstName(e.author)) : ''}`}</small></span></li>`).join('') || '<li class="muted">Sin movimientos todavía.</li>'}</ul>` : '<p class="muted">Cargando…</p>'}
      <form class="form" id="crmNoteForm" novalidate><label class="field" for="crmNote">Añadir una nota<textarea id="crmNote" maxlength="2000" rows="3" placeholder="Ej.: llamada de 10 min, quiere empezar en diciembre"></textarea></label>
        <div class="crm-row"><button class="btn btn-dark btn-sm" type="submit">Añadir la nota</button></div></form></section>
    <div class="crm-row crm-sheet-foot"><button class="btn btn-light btn-sm" type="button" data-crm-archive>${icon('archive')}Archivar la ficha</button><span class="muted">Desaparece del tablero sin borrarse.</span></div>`;
}
async function crmOpen(id) {
  if (!crmById(id)) return;
  if (C.open !== id) { C.editing = false; C.detail = null; }
  if (!C.open) C.lastFocus = document.activeElement;
  C.open = id;
  const sheet = $('#crmSheet');
  sheet.innerHTML = crmSheet();
  if (sheet.hidden) {
    sheet.hidden = false; $('#crmScrim').hidden = false; $('#crmModal').hidden = true;
    document.body.classList.add('no-scroll'); $('#app').inert = true; $('#tabbar').inert = true;
    sheet.scrollTop = 0; $('[data-crm-close]', sheet)?.focus();
  }
  const { data, error } = await sb.rpc('crm_prospect', { p_id: id });
  if (C.open !== id) return;
  if (error) return fail(error, 'No se pudo cargar la ficha.');
  C.detail = data; crmRedrawSheet();
}
// Redraw the sheet in place, keeping the focus on the same control when it still exists.
function crmRedrawSheet() {
  const sheet = $('#crmSheet'); if (!sheet || sheet.hidden) return;
  const f = document.activeElement, key = f && sheet.contains(f) ? (f.id ? '#' + f.id : [...f.attributes].filter(a => a.name.startsWith('data-crm')).map(a => `[${a.name}="${a.value}"]`).join('')) : '';
  const top = sheet.scrollTop;
  sheet.innerHTML = crmSheet(); sheet.scrollTop = top;
  if (key) { try { $(key, sheet)?.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
}
function crmClose() {
  const sheet = $('#crmSheet'), modal = $('#crmModal');
  if (sheet.hidden && modal.hidden) return;
  const id = C.open, back = C.lastFocus;
  sheet.hidden = true; modal.hidden = true; $('#crmScrim').hidden = true; sheet.innerHTML = ''; modal.innerHTML = '';
  $('#app').inert = false; $('#tabbar').inert = false; document.body.classList.remove('no-scroll');
  C.open = null; C.detail = null; C.editing = false; C.lastFocus = null;
  const card = id && $(`[data-crm-open="${id}"]`);
  (card || (back && back.isConnected ? back : null) || $('#main'))?.focus({ preventScroll: !!card });
}
const crmOverlayOpen = () => !$('#crmSheet').hidden || !$('#crmModal').hidden;
// Saves a change and keeps the board, the sheet and the counters in step.
async function crmSave(id, patch, msg) {
  const { data, error } = await sb.rpc('crm_update_prospect', { p_id: id, p: patch });
  if (error) {
    const m = String(error.message || '');
    return fail(error, /email already used/.test(m) ? 'Ese correo ya está en otra ficha.' : /invalid email/.test(m) ? 'Escribe un correo válido.' : 'No se pudo guardar el cambio.');
  }
  const list = A.staff.prospects || [], i = list.findIndex(p => p.id === id);
  if (i >= 0) list[i] = data;
  if (msg) toast(msg);
  if (currentView() === 'prospectos') { crmRefreshBody(); const k = $('.crm-kpis'); if (k) k.innerHTML = crmKpis(); }
  renderNav(currentView());
  if (C.open === id) {
    const r = await sb.rpc('crm_prospect', { p_id: id });
    if (!r.error && C.open === id) { C.detail = r.data; crmRedrawSheet(); }
  }
  return data;
}
function crmModalOpen() {
  const owners = crmOwners();
  const modal = $('#crmModal');
  C.lastFocus = document.activeElement;
  modal.innerHTML = `<div class="crm-modal-head"><h2 id="crmModalTitle">Añadir prospecto</h2><button class="round" type="button" data-crm-close aria-label="Cerrar">${icon('x')}</button></div>
    <p class="muted">Los que hacen el test, envían el formulario o usan la calculadora aparecen solos. Aquí se añaden los que llegan por otros canales.</p>
    <form class="form" id="crmAddForm" novalidate>
      <label class="field" for="caName">Nombre y apellido<input id="caName" required maxlength="120" placeholder="Ej.: Ana Vargas" aria-describedby="caErr"></label>
      <div class="form-2"><label class="field" for="caWa">WhatsApp<input id="caWa" type="tel" maxlength="40" placeholder="+51 9…"></label>
        <label class="field" for="caEmail">Correo<input id="caEmail" type="email" maxlength="200" placeholder="opcional"></label></div>
      <div class="form-2"><label class="field" for="caOrigin">Origen<select id="caOrigin">${Object.entries(CRM_ORIGINS).filter(([, v]) => !v[2]).map(([k, [n]]) => `<option value="${k}">${n}</option>`).join('')}</select></label>
        <label class="field" for="caOwner">Responsable<select id="caOwner">${owners.map(o => `<option value="${o.id}" ${o.id === A.profile.id ? 'selected' : ''}>${esc(o.full_name)}</option>`).join('')}</select></label></div>
      <label class="field" for="caRef" id="caRefWrap" hidden>Recomendado por<input id="caRef" maxlength="120" placeholder="Ej.: Lucía Romero (alumna)"></label>
      <label class="field" for="caGoal">Objetivo<input id="caGoal" maxlength="300" placeholder="Ej.: Entrada exprés, TEF en 2027"></label>
      <p class="form-error" id="caErr" hidden></p>
      <div class="crm-row"><button class="btn btn-dark" type="submit">${icon('plus')}Añadir</button><button class="btn btn-light" type="button" data-crm-close>Cancelar</button></div>
    </form>`;
  modal.hidden = false; $('#crmScrim').hidden = false;
  document.body.classList.add('no-scroll'); $('#app').inert = true; $('#tabbar').inert = true;
  $('#caName').focus();
  $('#caOrigin').onchange = () => { $('#caRefWrap').hidden = $('#caOrigin').value !== 'referral'; };
  $('#crmAddForm').onsubmit = async e => {
    e.preventDefault();
    const err = $('#caErr'), name = $('#caName').value.trim(), email = $('#caEmail').value.trim();
    const say = (m, el) => { err.textContent = m; err.hidden = false; el.setAttribute('aria-invalid', 'true'); el.focus(); };
    if (!name) return say('Escribe al menos el nombre.', $('#caName'));
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return say('Escribe un correo válido o déjalo vacío.', $('#caEmail'));
    const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true;
    const { data, error } = await sb.rpc('crm_create_prospect', { p: { name, email, whatsapp: $('#caWa').value.trim(), origin: $('#caOrigin').value, owner_id: $('#caOwner').value || null, goal: $('#caGoal').value.trim(), referrer_name: $('#caOrigin').value === 'referral' ? $('#caRef').value.trim() : '' } });
    btn.disabled = false;
    if (error) return fail(error, 'No se pudo añadir el prospecto.');
    await loadCrm();
    crmClose(); render();
    if (data.existing) { toast(`${crmName(data)} ya estaba en Prospectos: abrimos su ficha.`); crmOpen(data.id); }
    else toast(`${crmName(data)} añadido a «Nuevo».`);
  };
}
// Opens the existing invitation form of «Cuentas», filled in from the prospect.
function crmInvite() {
  const p = C.detail || crmById(C.open); if (!p) return;
  A.staff.invitePrefill = { prospect: p.id, email: p.email || '', name: p.name || '', level: p.level || '' };
  crmClose();
  if (location.hash === '#cuentas') render(); else location.hash = 'cuentas';
}
function bindCrm() {
  const q = $('#crmQ');
  if (!q) return;
  q.oninput = () => { C.q = q.value; crmRefreshBody(); };
  $('#crmOrigin').onchange = e => { C.origin = e.target.value; crmRefreshBody(); };
  $('#crmOwner').onchange = e => { C.owner = e.target.value; crmRefreshBody(); };
  $('#crmToday').onclick = e => { C.today = !C.today; e.currentTarget.setAttribute('aria-pressed', String(C.today)); crmRefreshBody(); };
  $$('[data-crm-view]').forEach(b => b.onclick = () => { C.view = b.dataset.crmView; render(); $(`[data-crm-view="${C.view}"]`)?.focus(); });
  $$('[data-crm-add]').forEach(b => b.onclick = crmModalOpen);
  const body = $('#crmBody');
  body.onclick = e => { const c = e.target.closest('[data-crm-open]'); if (c) crmOpen(c.dataset.crmOpen); };
  body.onkeydown = e => { const c = e.target.closest('[data-crm-open]'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); crmOpen(c.dataset.crmOpen); } };
  // Drag and drop between the columns of the board (desktop).
  body.ondragstart = e => { const c = e.target.closest('.crm-card[draggable]'); if (!c) return; C.drag = c.dataset.crmOpen; c.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', C.drag); } catch (err) { /* ignore */ } };
  body.ondragover = e => { const col = e.target.closest('.crm-col'); if (!col || !C.drag) return; e.preventDefault(); $$('.crm-col.drop').forEach(x => x !== col && x.classList.remove('drop')); col.classList.add('drop'); };
  body.ondragleave = e => { const col = e.target.closest('.crm-col'); if (col && !col.contains(e.relatedTarget)) col.classList.remove('drop'); };
  body.ondragend = () => { C.drag = null; $$('.crm-col.drop, .crm-card.dragging').forEach(x => x.classList.remove('drop', 'dragging')); };
  body.ondrop = async e => {
    const col = e.target.closest('.crm-col'), id = C.drag;
    $$('.crm-col.drop').forEach(x => x.classList.remove('drop')); C.drag = null;
    if (!col || !id) return;
    e.preventDefault();
    const p = crmById(id), stage = col.dataset.stage;
    if (!p || p.stage === stage) return;
    p.stage = stage; crmRefreshBody(); // moves at once; the server answer follows
    const s = CRM_STAGES.find(x => x.id === stage);
    const saved = await crmSave(id, { stage }, `${crmName(p)} → ${s.name}`);
    if (!saved) { await loadCrm(); crmRefreshBody(); }
  };
}
// Sheet and dialog: clicks, forms and keyboard (they live outside #main).
function bindCrmOverlay() {
  const sheet = $('#crmSheet'), modal = $('#crmModal');
  $('#crmScrim').onclick = crmClose;
  const trap = (root, e) => {
    if (e.key !== 'Tab') return;
    const f = $$('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]', root).filter(el => el.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  };
  sheet.addEventListener('keydown', e => trap(sheet, e));
  modal.addEventListener('keydown', e => trap(modal, e));
  modal.addEventListener('click', e => { if (e.target.closest('[data-crm-close]')) crmClose(); });
  sheet.addEventListener('click', async e => {
    const t = e.target.closest('[data-crm-close],[data-crm-stage],[data-crm-edit],[data-crm-invite],[data-crm-done],[data-crm-archive]');
    if (!t) return;
    const id = C.open, p = C.detail || crmById(id);
    if (t.matches('[data-crm-close]')) return crmClose();
    if (t.matches('[data-crm-stage]')) {
      const stage = t.dataset.crmStage; if (!p || p.stage === stage) return;
      t.disabled = true;
      return crmSave(id, { stage }, `${crmName(p)} → ${CRM_STAGES.find(s => s.id === stage).name}`);
    }
    if (t.matches('[data-crm-edit]')) { C.editing = t.dataset.crmEdit === '1'; crmRedrawSheet(); if (C.editing) $('#ceName')?.focus(); else $('[data-crm-edit="1"]')?.focus(); return; }
    if (t.matches('[data-crm-invite]')) return crmInvite();
    if (t.matches('[data-crm-done]')) {
      t.disabled = true;
      await sb.rpc('crm_add_note', { p_id: id, p_body: `Hecho: ${p.next_action || 'próxima acción'}.` });
      return crmSave(id, { next_action: '', next_due: '' }, 'Próxima acción marcada como hecha.');
    }
    if (t.matches('[data-crm-archive]')) {
      t.disabled = true;
      const { error } = await sb.rpc('crm_archive_prospect', { p_id: id, p_archived: true });
      if (error) { t.disabled = false; return fail(error, 'No se pudo archivar la ficha.'); }
      A.staff.prospects = crmList().filter(x => x.id !== id);
      toast(`Ficha de ${crmName(p)} archivada.`); crmClose(); render();
    }
  });
  sheet.addEventListener('submit', async e => {
    e.preventDefault();
    const id = C.open, f = e.target, btn = f.querySelector('button[type=submit]');
    if (f.id === 'crmNextForm') {
      btn.disabled = true;
      await crmSave(id, { next_action: $('#cnWhat').value, next_due: $('#cnDue').value, owner_id: $('#cnOwner').value }, 'Próxima acción guardada.');
    } else if (f.id === 'crmPauseForm') {
      btn.disabled = true;
      await crmSave(id, { pause_kind: $('#cpKind').value, reason: $('#cpReason').value }, 'Estado guardado.');
    } else if (f.id === 'crmNoteForm') {
      const v = $('#crmNote').value.trim();
      if (!v) { $('#crmNote').focus(); return toast('Escribe la nota.'); }
      btn.disabled = true;
      const { error } = await sb.rpc('crm_add_note', { p_id: id, p_body: v });
      if (error) { btn.disabled = false; return fail(error, 'No se pudo añadir la nota.'); }
      toast('Nota añadida.');
      const r = await sb.rpc('crm_prospect', { p_id: id });
      if (!r.error && C.open === id) { C.detail = r.data; crmRedrawSheet(); $('#crmNote')?.focus(); }
    } else if (f.id === 'crmEditForm') {
      const email = $('#ceEmail').value.trim();
      if (email && !/^\S+@\S+\.\S+$/.test(email)) { $('#ceEmail').focus(); return toast('Escribe un correo válido.'); }
      btn.disabled = true;
      C.editing = false;
      const ok = await crmSave(id, { name: $('#ceName').value, whatsapp: $('#ceWa').value, email, country: $('#ceCountry').value, goal: $('#ceGoal').value, exam: $('#ceExam').value, exam_date: $('#ceExamDate').value, level: $('#ceLevel').value, plan: $('#cePlan').value, hours: $('#ceHours').value, billing: $('#ceBilling').value, origin: $('#ceOrigin').value, referrer_name: $('#ceRef').value }, 'Ficha guardada.');
      if (!ok) { C.editing = true; btn.disabled = false; }
    }
  });
}

/* ───────────── Horarios fijos y programa (db/008_horarios.sql) ───────────── */
const WEEKDAYS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const TIMEZONES = [['America/Lima', 'Lima, Bogotá'], ['America/Mexico_City', 'Ciudad de México'], ['America/Santiago', 'Santiago'], ['America/Argentina/Buenos_Aires', 'Buenos Aires'], ['America/Caracas', 'Caracas'], ['America/Toronto', 'Montreal, Toronto'], ['America/Vancouver', 'Vancouver'], ['Europe/Paris', 'París']];
const tzName = tz => (TIMEZONES.find(t => t[0] === tz) || [tz, tz])[1];
const sessionLabel = at => { const d = new Date(at); return `${fmtDate(d, { weekday: 'long', day: 'numeric', month: 'short' }).replace('.', '')} a las ${fmtDate(d, { hour: '2-digit', minute: '2-digit' })}`; };
const slotsText = g => g.slots.length ? g.slots.map(s => `${WEEKDAYS[s.weekday].slice(0, 3)} ${s.start_time}`).join(' · ') + ` · ${g.slots[0].duration_min} min (hora de ${tzName(g.timezone)})` : 'Sin horario';
const sessionRow = x => {
  const st = x.status === 'cancelled' ? '<span class="status bad">Cancelada</span>' : x.status === 'moved' ? '<span class="status warn">Cambiada</span>' : x.status === 'makeup' ? '<span class="status">Recuperación</span>' : '';
  return `<div class="err-row"><span>${x.status === 'cancelled' ? `<s>${esc(cap(sessionLabel(x.scheduled_at)))}</s>` : `<b>${esc(cap(sessionLabel(x.at)))}</b>`}${x.status === 'moved' ? `<br><span class="muted" style="font-size:13px">Antes: ${esc(sessionLabel(x.scheduled_at))}</span>` : ''}</span>${st}</div>`;
};

function viewCurso() {
  const s = A.schedule, docs = A.docs || [];
  const next = nextSession();
  return `<section class="view" aria-labelledby="h-curso">
  ${topBar('h-curso', 'Mi curso', `Nivel ${esc(A.profile.level)} · tus clases y los documentos de tu programa`)}
  <div class="bento">
    <article class="tile c-6"><div class="tile-head"><h2>Tus próximas clases</h2>${s ? `<span class="pill ghost">${esc(s.group.name)}</span>` : ''}</div>
      ${s ? `${s.sessions.length ? s.sessions.slice(0, 6).map(studentSessionRow).join('') : '<p class="muted">Tu horario aparecerá aquí.</p>'}
        <p class="muted" style="font-size:13px;margin-top:12px">Horario fijo de tu grupo, en tu hora local. Si una clase cambia, lo verás aquí y en tus avisos.</p>
        ${next ? `<button class="btn btn-dark" style="margin-top:14px" type="button" data-join>${icon('video')}Entrar a la clase</button>${attendanceOn() ? `<p class="muted" style="font-size:13px;margin-top:10px">El enlace se abre ${esc(minutesText(s.attendance.open_min))} antes de la clase. Entra siempre por aquí: tu asistencia se registra con tu clic, y después de ${s.attendance.absent_after_min} minutos de clase cuenta como ausencia.</p>` : ''}` : ''}`
        : '<p class="muted">Pathway te asignará pronto a un grupo con su horario.</p>'}</article>
    <article class="tile c-6"><div class="tile-head"><h2>Tu programa</h2><span class="pill ghost">${esc(A.profile.level)}</span></div>
      ${docs.length ? docs.map(d => { const open = manualOpenNums(d); const n = d.unit_pages ? d.unit_pages.filter(Boolean).length : 0; return `<div class="err-row"><span>${icon('book')} <b>${esc(d.title)}</b>${open && n ? `<br><span class="muted" style="font-size:13px">${[...open].filter(x => d.unit_pages[x - 1]).length} de ${n} unidades abiertas · se abren al verlas en clase</span>` : ''}</span><button class="btn btn-light btn-sm" type="button" data-doc="${esc(d.path)}">Leer</button></div>`; }).join('')
        : '<p class="muted">Los documentos de tu nivel aparecerán aquí.</p>'}</article>
    ${attendanceTile()}
    ${A.contract && A.contract.signed ? `<article class="tile c-6"><div class="tile-head"><h2>Tu compromiso</h2><span class="pill ghost">${contractSignedNow() ? 'Firmado' : 'Versión anterior'}</span></div>
      <p class="muted" style="font-size:14px">Las reglas de asistencia de tu curso, firmadas el ${esc(longDate(A.contract.signed.signed_at))}.</p>
      <button class="btn btn-light" style="margin-top:14px" type="button" data-ct-mine>${icon('pen')}Ver mi compromiso</button></article>` : ''}
    ${A.recordings ? `<article class="tile c-6"><div class="tile-head"><h2>Tus clases grabadas</h2><span class="pill ghost num">${A.recordings.length}</span></div>
      ${A.recordings.length ? A.recordings.slice(0, 12).map(r => `<div class="err-row"><span>${icon('video')} <b>${esc(cap(sessionLabel(r.at)))}</b>${r.minutes ? `<br><span class="muted" style="font-size:13px">${r.minutes} min</span>` : ''}</span><a class="btn btn-light btn-sm" href="${esc(r.url)}" target="_blank" rel="noopener">Ver</a></div>`).join('')
        : '<p class="muted">Cada clase aparece aquí, grabada, poco después de terminar.</p>'}</article>` : ''}
  </div></section>`;
}

function viewHorarios() {
  const admin = A.profile.role === 'admin';
  const groups = A.staff.groups || [];
  const changes = A.staff.changes;
  const pending = changes.filter(c => c.status === 'pending');
  const ed = A.staff.groupEditing;
  const inGroup = new Set(groups.flatMap(g => g.members.map(m => m.id)));
  const noGroup = admin && A.staff.members ? A.staff.members.filter(m => m.role === 'student' && !inGroup.has(m.id)) : [];
  const changeRow = c => `<div class="err-row"><span><b>${esc(c.group)}</b> · ${c.new_at ? `mover la clase del ${esc(sessionLabel(c.original_at))} al ${esc(sessionLabel(c.new_at))}` : `cancelar la clase del ${esc(sessionLabel(c.original_at))}`}<br><span class="muted" style="font-size:13px">${esc(c.requested_by || '—')}${c.reason ? ' · ' + esc(c.reason) : ''}</span></span>
    ${c.status === 'pending' ? (admin ? `<span style="display:flex;gap:6px"><button class="btn btn-dark btn-sm" type="button" data-chg="${c.id}" data-ok="1">Aprobar</button><button class="btn btn-light btn-sm" type="button" data-chg="${c.id}" data-ok="0">Rechazar</button></span>` : '<span class="status warn">Pendiente</span>')
      : c.status === 'approved' ? '<span class="status">Aprobado</span>' : '<span class="status bad">Rechazado</span>'}</div>`;
  const groupTile = g => ed === g.id ? groupForm(g) : `<article class="tile c-6"><div class="tile-head"><h2>${esc(g.name)}</h2><span class="pill ghost">${esc(g.level)}</span></div>
      <p style="font-weight:600">${esc(slotsText(g))}</p>
      <p class="muted" style="font-size:14px;margin-top:6px">${esc(g.teacher || 'Sin profesor')} · ${g.members.length ? g.members.map(m => esc(m.full_name)).join(', ') : 'sin alumnos'}</p>
      <div class="chips" style="margin-top:12px"><span class="pill ghost num">${g.month.planned} clases este mes</span>${A.staff.log ? '' : `<span class="pill ghost num">${g.month.done} pasadas</span>`}${g.month.moved ? `<span class="pill ghost num">${g.month.moved} movida${g.month.moved > 1 ? 's' : ''}</span>` : ''}${g.month.cancelled ? `<span class="pill ghost num">${g.month.cancelled} cancelada${g.month.cancelled > 1 ? 's' : ''}</span>` : ''}</div>
      ${groupAttendance(g)}
      ${logBlock(g)}
      <div style="margin-top:10px">${g.upcoming.filter(x => new Date(x.at) > Date.now()).slice(0, 3).map(sessionRow).join('') || '<p class="muted">Sin clases próximas.</p>'}</div>
      ${g.zoom_link ? '' : '<p class="form-error" style="margin-top:8px">Falta el enlace de Zoom.</p>'}
      ${admin ? `<button class="btn btn-light btn-sm" style="margin-top:12px" type="button" data-group-edit="${g.id}">Editar</button>` : ''}</article>`;
  const askable = groups.map(g => [g, g.upcoming.filter(x => x.status === 'planned' && new Date(x.at) > Date.now())]).filter(([, l]) => l.length);
  // Shown on top when someone is missing a group; otherwise a quiet confirmation after the groups.
  const noGroupTile = admin && A.staff.members ? `<article class="tile c-6"><div class="tile-head"><h2>Alumnos sin grupo</h2><span class="pill ghost num">${noGroup.length}</span></div>
      ${noGroup.length ? `<p class="muted" style="font-size:14px;margin:-6px 0 10px">Sin grupo no tienen horario ni próxima clase.</p>${noGroup.map(m => `<div class="err-row"><span><b>${esc(m.full_name)}</b> · ${m.level}</span></div>`).join('')}` : '<p class="muted">Todos los alumnos tienen un grupo.</p>'}</article>` : '';
  const now = new Date(Date.now() + 864e5); const localDefault = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}T19:00`;
  return `<section class="view" aria-labelledby="h-horarios">
  ${topBar('h-horarios', 'Horarios', admin ? 'Grupos, horarios fijos y cambios por validar' : 'Tus grupos y sus horarios fijos')}
  <div class="bento staff">
    ${(admin ? pending.length : changes.length) ? `<article class="tile c-6"><div class="tile-head"><h2>${admin ? 'Cambios por validar' : 'Tus solicitudes'}</h2><span class="pill ghost num">${pending.length} pendiente${pending.length === 1 ? '' : 's'}</span></div>
      ${(admin ? pending : changes.slice(0, 8)).map(changeRow).join('')}</article>` : ''}
    ${unmatchedTile()}
    ${noGroup.length ? noGroupTile : ''}
    ${askable.length ? `<article class="tile c-6"><div class="tile-head"><h2>${admin ? 'Mover o cancelar una clase' : 'Solicitar un cambio'}</h2></div>
      <p class="muted" style="font-size:14px;margin:-6px 0 16px">${admin ? 'Como admin, el cambio se aplica directamente.' : 'El horario es fijo: el cambio se aplica cuando Pathway lo aprueba.'}</p>
      <form id="chgForm" class="form">
        <label class="field" for="chgSession">Clase<select id="chgSession" required>${askable.map(([g, l]) => `<optgroup label="${esc(g.name)}">${l.slice(0, 8).map(x => `<option value="${g.id}|${x.scheduled_at}">${esc(cap(sessionLabel(x.at)))}</option>`).join('')}</optgroup>`).join('')}</select></label>
        <div class="form-2"><label class="field" for="chgKind">Cambio<select id="chgKind"><option value="move">Mover</option><option value="cancel">Cancelar</option></select></label>
          <label class="field" for="chgAt">Nueva fecha y hora (tu hora local)<input id="chgAt" type="datetime-local" value="${localDefault}"></label></div>
        <label class="field" for="chgWhy">Motivo<input id="chgWhy" maxlength="300" required placeholder="Feriado, cita médica…"></label>
        <button class="btn btn-dark" type="submit">${admin ? 'Aplicar el cambio' : 'Enviar la solicitud'}</button>
      </form></article>` : ''}
    ${groups.map(groupTile).join('')}
    ${noGroup.length ? '' : noGroupTile}
    ${admin ? (ed === 'new' ? groupForm(null) : `<article class="tile c-6 empty"><h2>Nuevo grupo</h2><p class="muted">Un grupo por horario: una clase privada es un grupo de un alumno.</p><button class="btn btn-dark" style="margin-top:14px" type="button" data-group-edit="new">${icon('plus')}Crear un grupo</button></article>`) : ''}
    ${!groups.length && !admin ? '<article class="tile empty"><h2>Todavía no tienes grupos</h2><p class="muted">Pathway crea los grupos con su horario fijo; aparecerán aquí.</p></article>' : ''}
  </div></section>`;
}

// Zoom follow-up (db/009_zoom.sql): real start time and recording of the last classes.
function logBlock(g) {
  const log = A.staff.log && A.staff.log.groups[g.id];
  if (!log) return '';
  const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
  const inMonth = log.filter(x => x.status !== 'cancelled' && new Date(x.at) >= month);
  const held = inMonth.filter(x => x.started_at).length, rec = inMonth.filter(x => x.recorded).length, late = inMonth.filter(x => x.late_min > 10).length;
  const row = x => {
    if (x.status === 'cancelled') return '';
    const st = !x.started_at ? '<span class="status bad">Sin conexión Zoom</span>' : x.recorded ? '<span class="status">Grabada</span>' : '<span class="status warn">Sin grabación</span>';
    const when = x.started_at ? `Empezó a las ${fmtDate(new Date(x.started_at), { hour: '2-digit', minute: '2-digit' })}${x.late_min > 5 ? ` · ${x.late_min} min tarde` : ''}` : 'Zoom no registró esta clase';
    return `<div class="err-row"><span><b>${esc(cap(sessionLabel(x.at)))}</b><br><span class="muted" style="font-size:13px">${esc(when)}</span></span>${st}${x.recording_url ? ` <a class="btn btn-light btn-sm" href="${esc(x.recording_url)}" target="_blank" rel="noopener">Ver</a>` : ''}</div>`;
  };
  return `<div class="chips" style="margin-top:8px"><span class="pill ghost num">${held} con Zoom</span><span class="pill ghost num">${rec} grabada${rec === 1 ? '' : 's'}</span>${late ? `<span class="pill ghost num">${late} con retraso</span>` : ''}</div>
    <p class="label" style="margin-top:14px">Últimas clases</p>${log.slice(0, 3).map(row).join('') || '<p class="muted" style="font-size:14px">Todavía no hay clases pasadas.</p>'}
    <p class="label" style="margin-top:14px">Próximas</p>`;
}
function unmatchedTile() {
  const list = A.staff.log && A.staff.log.unmatched;
  if (!list || !list.length) return '';
  return `<article class="tile c-6"><div class="tile-head"><h2>Reuniones Zoom sin grupo</h2><span class="pill ghost num">${list.length}</span></div>
    <p class="muted" style="font-size:14px;margin:-6px 0 10px">Su enlace no corresponde a ningún grupo: pega el enlace de Zoom correcto en el grupo para que cuenten.</p>
    ${list.map(m => `<div class="err-row"><span><b>${esc(m.topic || 'Reunión ' + m.meeting_id)}</b><br><span class="muted" style="font-size:13px">${esc(cap(sessionLabel(m.started_at)))} · ${esc(m.host_email || '—')} · n.º ${esc(m.meeting_id)}</span></span>${m.recorded ? '<span class="status">Grabada</span>' : ''}</div>`).join('')}</article>`;
}

// Attendance and reminders (db/013_asistencia.sql). Rules are edited by the admin in Horarios.
const attendanceOn = () => !!(A.schedule && A.schedule.attendance && A.schedule.attendance.enabled);
const minutesText = m => (m % 60 === 0 ? `${m / 60} h` : `${m} min`);
const ATT = { present: ['Presente', ''], late: ['Tarde', 'warn'], absent: ['Ausente', 'bad'] };
function attendanceTile() {
  if (!attendanceOn() || !A.attendance) return '';
  const n = k => A.attendance.filter(a => a.status === k && !a.excused).length, nEx = A.attendance.filter(a => a.excused && a.status !== 'present').length;
  return `<article class="tile c-6"><div class="tile-head"><h2>Tu asistencia</h2><span class="pill ghost">60 días</span></div>
    ${myAbsenceSummary()}
    <div class="chips"><span class="pill ghost num">${n('present')} presente${n('present') === 1 ? '' : 's'}</span>${n('late') ? `<span class="pill ghost num">${n('late')} tarde</span>` : ''}<span class="pill ghost num">${n('absent')} ausencia${n('absent') === 1 ? '' : 's'}</span>${nEx ? `<span class="pill ghost num">${nEx} justificada${nEx === 1 ? '' : 's'}</span>` : ''}</div>
    ${A.attendance.slice(0, 10).map(attendanceRow).join('') || '<p class="muted">Tus clases aparecerán aquí.</p>'}</article>`;
}

/* ───────────── Ausencias: avisar 48 h antes, justificar 72 h después (db/017_reglas_clases.sql) ───────────── */
const sameAt = (a, b) => Date.parse(a) === Date.parse(b);
const myMotives = () => ((A.myAbs && A.myAbs.motives) || (A.contract && A.contract.contract && A.contract.contract.motives) || []).filter(Boolean);
const myRequest = at => ((A.myAbs && A.myAbs.requests) || []).find(r => sameAt(r.scheduled_at, at));
const hoursText = min => min % 60 === 0 ? `${min / 60} h` : `${Math.floor(min / 60) ? Math.floor(min / 60) + ' h ' : ''}${min % 60} min`;
const shortWhen = at => fmtDate(new Date(at), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(/\./g, '');
function motiveFields(p, motives) {
  return `<label class="field" for="${p}Reason">Motivo<select id="${p}Reason">${motives.map(m => `<option>${esc(m)}</option>`).join('')}<option value="__otro">Otro motivo…</option></select></label>
    <label class="field" for="${p}Note">Detalle<input id="${p}Note" maxlength="300" placeholder="Lo que tu profesor debe saber"></label>`;
}
// Upcoming class, for the student: « No podré asistir » (justified by itself 48 h ahead).
function studentSessionRow(x) {
  const row = sessionRow(x);
  if (!A.myAbs || x.status === 'cancelled' || new Date(x.at) <= Date.now()) return row;
  const r = myRequest(x.scheduled_at);
  const tag = r ? (r.status === 'approved' ? '<span class="status">Avisaste · se reprograma</span>' : r.status === 'pending' ? '<span class="status warn">Aviso enviado · tu profesor decide</span>' : '<span class="status bad">Aviso rechazado</span>') : '';
  const early = new Date(x.at) - Date.now() >= 48 * 3600e3;
  if (A.notifyFor && sameAt(A.notifyFor, x.scheduled_at)) return row + `<form class="form excuse-form" data-notify-form="${esc(x.scheduled_at)}">
      ${motiveFields('nt', myMotives())}
      <p class="muted" style="font-size:13px">${early ? 'Avisas con más de 48 h: tu hora se reprogramará, sin comprobante.' : 'Faltan menos de 48 h: tu profesor decidirá. Si es por un motivo válido, después podrás enviar el comprobante.'}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-dark btn-sm" type="submit">Avisar a mi profesor</button><button class="btn btn-light btn-sm" type="button" data-notify-cancel>Cancelar</button></div></form>`;
  return row.replace(/<\/div>$/, '') + `<span class="row-act">${tag || `<button class="btn btn-light btn-sm" type="button" data-notify="${esc(x.scheduled_at)}">No podré asistir</button>`}</span></div>`;
}
function myAbsenceSummary() {
  const m = A.myAbs; if (!m) return '';
  const out = [];
  const mo = m.plan === 'mensual' && m.month;
  if (mo && mo.failed) out.push(`<p class="abs-mine near"><b>Mes no validado</b><span>${mo.max} ausencias sin justificar en 4 semanas: no pasas al nivel siguiente. Para seguir, paga de nuevo el mes y rehaz sus horas.</span></p>`);
  else if (mo) out.push(`<p class="abs-mine ${mo.total >= mo.max - 1 && mo.total ? 'near' : ''}"><b class="num">${mo.total} / ${mo.max}</b><span>ausencias sin justificar en tus 4 semanas (del ${fmtDate(new Date(mo.from), { day: 'numeric', month: 'short' })} al ${fmtDate(new Date(Date.parse(mo.to) - 1000), { day: 'numeric', month: 'short' })}). A la ${mo.max}.ª, tu mes no se valida.</span></p>`);
  if (m.lost_minutes) out.push(`<p class="abs-mine"><b class="num">${hoursText(m.lost_minutes)}</b><span>perdidas por ausencias sin justificar. No se recuperan.</span></p>`);
  if (m.to_makeup) out.push(`<p class="muted" style="font-size:13px;margin:-6px 0 12px">${m.to_makeup === 1 ? 'Tienes 1 clase por recuperar' : `Tienes ${m.to_makeup} clases por recuperar`}: tu profesor te propondrá una fecha.</p>`);
  return out.join('');
}
function attendanceRow(a) {
  const when = `<b>${esc(cap(sessionLabel(a.at)))}</b>${a.makeup ? ' <span class="muted">· recuperación</span>' : ''}<br><span class="muted" style="font-size:13px">${a.clicked_at ? `Entraste a las ${fmtDate(new Date(a.clicked_at), { hour: '2-digit', minute: '2-digit' })}` : 'No entraste por el campus'}${a.excused && a.status !== 'present' ? ` · ${esc(a.excused)}` : ''}</span>`;
  if (a.status === 'present') return `<div class="err-row"><span>${when}</span><span class="status">Presente</span></div>`;
  if (a.excused) return `<div class="err-row"><span>${when}</span><span class="status">Justificada</span></div>`;
  const r = A.myAbs && myRequest(a.scheduled_at), deadline = Date.parse(a.at) + 72 * 3600e3, open = A.myAbs && Date.now() < deadline;
  if (A.justifyFor && sameAt(A.justifyFor, a.scheduled_at)) return `<form class="form excuse-form" data-justify-form="${esc(a.scheduled_at)}">
      <p style="font-size:14px">${when}</p>
      ${motiveFields('js', myMotives())}
      <label class="field" for="jsFile">Comprobante (PDF o foto)<input id="jsFile" type="file" accept="application/pdf,image/*" required></label>
      <p class="muted" style="font-size:13px">Tu profesor lo revisa. Si lo acepta, tu hora se reprograma.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-dark btn-sm" type="submit">Enviar el justificativo</button><button class="btn btn-light btn-sm" type="button" data-justify-cancel>Cancelar</button></div></form>`;
  let tag;
  if (r && r.status === 'pending') tag = '<span class="status warn">Comprobante enviado</span>';
  else if (open) tag = `${r && r.status === 'rejected' ? '<span class="status bad">Rechazado</span>' : `<span class="status ${a.status === 'late' ? 'warn' : 'bad'}">${a.status === 'late' ? 'Tarde' : 'Ausente'}</span>`}<button class="btn btn-light btn-sm" type="button" data-justify="${esc(a.scheduled_at)}" title="Hasta el ${esc(shortWhen(deadline))}">Justificar</button>`;
  else tag = a.status === 'late' ? '<span class="status warn">Tarde</span>' : `<span class="status bad">${A.myAbs ? 'Hora perdida' : 'Ausente'}</span>`;
  return `<div class="err-row"><span>${when}${open && !r ? `<br><span class="muted" style="font-size:12px">Puedes justificarla hasta el ${esc(shortWhen(deadline))}</span>` : ''}</span><span class="row-act">${tag}</span></div>`;
}
function groupAttendance(g) {
  const cfg = A.staff.settings && A.staff.settings.attendance;
  if (!cfg || !cfg.enabled) return '';
  const rows = (A.staff.attendance || {})[g.id] || [];
  if (!rows.length) return '<p class="label" style="margin-top:14px">Asistencia del mes</p><p class="muted" style="font-size:14px">Aún no hay clases desde la activación.</p>';
  return `<p class="label" style="margin-top:14px">Asistencia del mes</p>${rows.map(r => `<div class="err-row"><span><b>${esc(r.name)}</b><br><span class="muted" style="font-size:13px">${r.present} presente${r.present === 1 ? '' : 's'}${r.late ? ` · ${r.late} tarde` : ''} · ${r.absent} ausencia${r.absent === 1 ? '' : 's'}</span></span>${r.absent >= 3 ? `<span class="status bad">${r.absent} ausencias</span>` : r.last ? `<span class="status ${ATT[r.last.status][1]}">Última: ${ATT[r.last.status][0].toLowerCase()}</span>` : ''}</div>`).join('')}`;
}
function rulesTile() {
  const st = A.staff.settings;
  if (!st || A.profile.role !== 'admin') return '';
  const a = st.attendance || {}, r = st.reminder || {};
  return `<article class="tile c-6"><div class="tile-head"><h2>Reglas de asistencia</h2><span class="pill ghost">${a.enabled ? 'Activas' : 'Desactivadas'}</span></div>
    <form id="rulesForm" class="form">
      <label class="check-row" for="raOn"><input id="raOn" type="checkbox" ${a.enabled ? 'checked' : ''}>Registrar la asistencia por el botón del campus (el enlace de Zoom deja de mostrarse a los alumnos)</label>
      <div class="form-2"><label class="field" for="raOpen">El enlace se abre (min antes)<input id="raOpen" type="number" min="0" max="240" step="5" value="${a.open_min ?? 60}"></label>
        <label class="field" for="raAbsent">Ausente después de (min)<input id="raAbsent" type="number" min="1" max="120" value="${a.absent_after_min ?? 10}"></label></div>
      <label class="field" for="raLate">«Tarde» después de (min, vacío = sin tarde)<input id="raLate" type="number" min="1" max="120" value="${a.late_after_min ?? ''}"></label>
      <label class="check-row" for="rrOn"><input id="rrOn" type="checkbox" ${r.enabled ? 'checked' : ''}>Enviar un correo de recordatorio a cada alumno</label>
      <label class="field" for="rrBefore">Recordatorio (min antes de la clase)<input id="rrBefore" type="number" min="15" max="1440" step="5" value="${r.before_min ?? 60}"></label>
      <p class="muted" style="font-size:13px">La asistencia solo cuenta desde su activación. El recordatorio va por correo, en español, con el botón para entrar por el campus.</p>
      <button class="btn btn-dark" type="submit">Guardar las reglas</button>
    </form></article>`;
}
async function joinClass() {
  const win = window.open('', '_blank');
  const { data, error } = await sb.rpc('join_class');
  if (error || !data) {
    const link = A.schedule && A.schedule.group.zoom_link;
    if (link) { if (win) win.location = link; else location.href = link; return; }
    if (win) win.close(); return fail(error, 'No se pudo abrir la clase.');
  }
  if (!data.open) {
    if (win) win.close();
    return toast(data.reason === 'closed' && data.opens_at ? `El enlace se abre el ${sessionLabel(data.opens_at)}.` : data.reason === 'no_link' ? 'Tu grupo todavía no tiene enlace de clase.' : 'Todavía no tienes grupo.');
  }
  if (win) win.location = data.link; else location.href = data.link;
  if (data.status === 'absent') toast('Entraste después del límite: esta clase cuenta como ausencia.');
  else if (data.status === 'late') toast('Entraste tarde: queda registrado.');
}

function groupForm(g) {
  const students = (A.staff.members || []).filter(m => m.role === 'student');
  const members = new Set(g ? g.members.map(m => m.id) : []);
  const slots = g ? g.slots : [];
  const slotRow = i => { const s = slots[i] || {}; return `<div class="form-2" style="grid-template-columns:1.3fr 1fr 1fr"><label class="field" for="gsDay${i}">Día ${i + 1}<select id="gsDay${i}"><option value="">—</option>${WEEKDAYS.slice(1).map((d, k) => `<option value="${k + 1}" ${s.weekday === k + 1 ? 'selected' : ''}>${d}</option>`).join('')}</select></label><label class="field" for="gsTime${i}">Hora<input id="gsTime${i}" type="time" value="${esc(s.start_time || '19:00')}"></label><label class="field" for="gsDur${i}">Minutos<input id="gsDur${i}" type="number" min="15" max="240" step="15" value="${s.duration_min || 60}"></label></div>`; };
  return `<article class="tile"><div class="tile-head"><h2>${g ? 'Editar ' + esc(g.name) : 'Nuevo grupo'}</h2></div>
    <form id="groupForm" class="form" data-group-id="${g ? g.id : ''}">
      <div class="form-2"><label class="field" for="gName">Nombre<input id="gName" required maxlength="80" value="${esc(g ? g.name : '')}" placeholder="Lucía · A2 · lun y mié"></label>
        <label class="field" for="gTeacher">Profesor<select id="gTeacher">${A.staff.teachers.map(t => `<option value="${t.id}" ${(g ? g.teacher_id : A.profile.id) === t.id ? 'selected' : ''}>${esc(t.full_name)}</option>`).join('')}</select></label></div>
      <div class="form-2"><label class="field" for="gLevel">Nivel<select id="gLevel">${LEVELS.map(l => `<option ${l === (g ? g.level : 'A2') ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="field" for="gTz">Zona horaria del horario<select id="gTz">${TIMEZONES.map(([v, n]) => `<option value="${v}" ${v === (g ? g.timezone : 'America/Lima') ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
      <label class="field" for="gZoom">Enlace de Zoom<input id="gZoom" type="url" value="${esc(g && g.zoom_link || '')}" placeholder="https://zoom.us/j/…"></label>
      ${[0, 1, 2, 3].map(slotRow).join('')}
      <div class="field">Alumnos <span class="muted" style="font-weight:400">(pasan al nivel y al profesor del grupo)</span><div class="chips">${students.map((m, i) => `<label for="gm${i}"><input type="checkbox" id="gm${i}" value="${m.id}" ${members.has(m.id) ? 'checked' : ''}><span>${esc(m.full_name)}</span></label>`).join('') || '<span class="muted">Todavía no hay alumnos.</span>'}</div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-dark" type="submit">Guardar</button><button class="btn btn-light" type="button" data-group-cancel>Cancelar</button>${g ? `<button class="btn btn-light" type="button" data-group-delete="${g.id}" style="margin-left:auto">Eliminar el grupo</button>` : ''}</div>
    </form></article>`;
}

function docsTile() {
  if (A.profile.role !== 'admin' || A.docs === null) return '';
  return `<article class="tile"><div class="tile-head"><h2>Documentos del programa</h2><span class="pill ghost num">${A.docs.length}</span></div>
    <p class="muted" style="font-size:14px;margin:-6px 0 12px">Cada alumno lee los documentos de su nivel en «Mi curso», dentro del campus, sin descargarlos. En un manual, el campus encuentra solo la primera página de cada unidad: con «Apertura de las unidades» activada, el alumno lee solo las unidades vistas en clase.</p>
    ${LEVELS.map(l => { const list = A.docs.filter(d => d.level === l); return `<p class="label" style="margin-top:12px">${l}</p>${list.map(d => `<div class="err-row"><span>${esc(d.title)}<br><span class="muted" style="font-size:13px">${d.unit_pages ? `Manual · ${d.unit_pages.filter(Boolean).length} unidades · se abre al ritmo de las clases` : 'page_count' in d && d.page_count ? 'Se lee entero' : 'Sin analizar'}</span></span><span style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${'page_count' in d && !d.unit_pages ? `<button class="btn btn-light btn-sm" type="button" data-doc-scan="${d.id}">Detectar las unidades</button>` : ''}<button class="btn btn-light btn-sm" type="button" data-doc="${esc(d.path)}">Abrir</button><button class="btn btn-light btn-sm" type="button" data-doc-delete="${d.id}" data-doc-path="${esc(d.path)}">Quitar</button></span></div>`).join('') || '<p class="muted" style="font-size:14px">Ningún documento.</p>'}`; }).join('')}
    <form id="docForm" class="form" style="margin-top:18px">
      <div class="form-2"><label class="field" for="docLevel">Nivel<select id="docLevel">${LEVELS.map(l => `<option>${l}</option>`).join('')}</select></label>
        <label class="field" for="docTitle">Título<input id="docTitle" required maxlength="120" placeholder="Manual del alumno A2"></label></div>
      <label class="field" for="docFile">Archivo (PDF)<input id="docFile" type="file" accept="application/pdf" required></label>
      <button class="btn btn-dark" type="submit">${icon('plus')}Añadir el documento</button>
    </form></article>`;
}

async function openDoc(path) {
  const win = window.open('', '_blank');
  const { data, error } = await sb.storage.from('programa').createSignedUrl(path, 3600);
  if (error || !data) { if (win) win.close(); return fail(error, 'No se pudo abrir el documento.'); }
  if (win) win.location = data.signedUrl; else location.href = data.signedUrl;
}

function bindSchedule(id) {
  $$('[data-report]').forEach(b => b.onclick = () => { A.staff.reportFor = b.dataset.report; A.staff.reportSel = null; render(); });
  $$('[data-report-cancel]').forEach(b => b.onclick = () => { A.staff.reportFor = null; A.staff.reportSel = null; render(); });
  $$('[data-pick]').forEach(b => b.onclick = () => {
    const x = (A.staff.reports || []).find(r => `${r.group_id}|${r.scheduled_at}` === A.staff.reportFor);
    const n = +b.dataset.pick;
    const sel = new Set(A.staff.reportSel || (x && x.report ? (x.report.unit_numbers && x.report.unit_numbers.length ? x.report.unit_numbers : (x.report.unit_ids || []).map(id => (unitById(id) || {}).number).filter(Boolean)) : []));
    if (sel.has(n)) sel.delete(n); else sel.add(n);
    A.staff.reportSel = [...sel]; const note = $('#rpNote') ? $('#rpNote').value : ''; render(); if ($('#rpNote')) $('#rpNote').value = note;
    $(`[data-pick="${b.dataset.pick}"]`)?.focus();
  });
  const rpf = $('[data-report-form]');
  if (rpf) rpf.onsubmit = async e => {
    e.preventDefault();
    const [group, at] = rpf.dataset.reportForm.split('|');
    const x = (A.staff.reports || []).find(r => `${r.group_id}|${r.scheduled_at}` === rpf.dataset.reportForm);
    const nums = A.staff.reportSel || (x && x.report ? (x.report.unit_numbers && x.report.unit_numbers.length ? x.report.unit_numbers : (x.report.unit_ids || []).map(id => (unitById(id) || {}).number).filter(Boolean)) : []);
    if (!nums.length && !$('#rpNote').value.trim()) return toast('Marca al menos una unidad.');
    const btn = rpf.querySelector('button[type=submit]'); btn.disabled = true;
    let { error } = await sb.rpc('save_class_report', { p_group: group, p_scheduled: at, p_numbers: nums, p_note: $('#rpNote').value.trim() });
    if (error && /save_class_report|PGRST202|function/i.test(error.message || '')) {
      // Without db/020_manual.sql: units with exercises only.
      const ids = A.units.filter(u => u.level === rpf.dataset.level && !u.is_final && nums.includes(u.number)).map(u => u.id);
      ({ error } = await sb.rpc('save_session_report', { p_group: group, p_scheduled: at, p_units: ids, p_note: $('#rpNote').value.trim() }));
    }
    if (error) { btn.disabled = false; return fail(error, 'No se pudo guardar el informe.'); }
    A.staff.reportFor = null; A.staff.reportSel = null; toast('Informe guardado.'); await refresh(); render();
  };
  const asf = $('#asForm');
  if (asf) asf.onsubmit = async e => {
    e.preventDefault();
    const auto = $('#asAuto').checked;
    const { error } = await sb.rpc('set_campus_setting', { p_key: 'assistant', p_value: { auto_reply: auto } });
    if (error) return fail(error);
    A.staff.settings.assistant = { auto_reply: auto }; render();
    toast(auto ? 'Las respuestas del asistente salen al instante.' : 'Las respuestas del asistente quedan como borrador para el equipo.'); await refresh(); render();
  };
  const pgf = $('#pgForm');
  if (pgf) pgf.onsubmit = async e => {
    e.preventDefault();
    const { error } = await sb.rpc('set_campus_setting', { p_key: 'progression', p_value: { taught_gate: $('#pgGate').checked } });
    if (error) return fail(error);
    toast('Guardado.'); await refresh(); render();
  };
  // Student: tell ahead, justify after.
  $$('[data-notify]').forEach(b => b.onclick = () => { A.notifyFor = b.dataset.notify; render(); $('#ntReason')?.focus(); });
  $$('[data-notify-cancel]').forEach(b => b.onclick = () => { A.notifyFor = null; render(); });
  $$('[data-justify]').forEach(b => b.onclick = () => { A.justifyFor = b.dataset.justify; render(); $('#jsReason')?.focus(); });
  $$('[data-justify-cancel]').forEach(b => b.onclick = () => { A.justifyFor = null; render(); });
  const reasonOf = (p) => { const sel = $(`#${p}Reason`), note = $(`#${p}Note`); const other = sel.value === '__otro'; return { reason: other ? note.value.trim() : sel.value, note: other ? '' : note.value.trim() }; };
  const ntf = $('[data-notify-form]');
  if (ntf) ntf.onsubmit = async e => {
    e.preventDefault();
    const { reason, note } = reasonOf('nt');
    if (reason.length < 2) return toast('Escribe el motivo en «Detalle».');
    const btn = ntf.querySelector('button[type=submit]'); btn.disabled = true;
    const { data, error } = await sb.rpc('notify_absence', { p_scheduled: ntf.dataset.notifyForm, p_reason: reason, p_note: note });
    if (error) { btn.disabled = false; return fail(error, 'No se pudo enviar el aviso.'); }
    A.notifyFor = null; toast(data === 'approved' ? 'Aviso enviado: tu clase se reprogramará.' : 'Aviso enviado: tu profesor decidirá.'); await refresh(); render();
  };
  const jsf = $('[data-justify-form]');
  if (jsf) jsf.onsubmit = async e => {
    e.preventDefault();
    const { reason, note } = reasonOf('js');
    if (reason.length < 2) return toast('Escribe el motivo en «Detalle».');
    const file = $('#jsFile').files[0];
    if (!file) return toast('Adjunta el comprobante.');
    if (file.size > 8 * 1024 * 1024) return toast('El archivo pesa más de 8 MB.');
    const btn = jsf.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Enviando…';
    const path = `${A.session.user.id}/${Date.now()}-${file.name.normalize('NFD').replace(/[^\w.-]+/g, '_').slice(-60)}`;
    const up = await sb.storage.from('justificantes').upload(path, file, { contentType: file.type || 'application/octet-stream' });
    if (up.error) { btn.disabled = false; btn.textContent = 'Enviar el justificativo'; return fail(up.error, 'No se pudo subir el comprobante.'); }
    const { error } = await sb.rpc('justify_absence', { p_scheduled: jsf.dataset.justifyForm, p_reason: reason, p_note: note, p_file: path });
    if (error) { btn.disabled = false; btn.textContent = 'Enviar el justificativo'; return fail(error, /deadline/.test(error.message || '') ? 'Pasaron las 72 h: ya no se puede justificar.' : 'No se pudo enviar el justificativo.'); }
    A.justifyFor = null; toast('Justificativo enviado: tu profesor lo revisará.'); await refresh(); render();
  };
  // Staff: decide, see the proof, make up the class, reset a month.
  $$('[data-req]').forEach(b => b.onclick = async () => {
    b.disabled = true;
    const ok = b.dataset.ok === '1';
    const { error } = await sb.rpc('decide_absence_request', { p_id: b.dataset.req, p_ok: ok });
    if (error) { b.disabled = false; return fail(error); }
    toast(ok ? 'Aceptado: la clase queda por recuperar.' : 'Rechazado: la hora se pierde.'); await refresh(); render();
  });
  $$('[data-proof]').forEach(b => b.onclick = async () => {
    const win = window.open('', '_blank');
    const { data, error } = await sb.storage.from('justificantes').createSignedUrl(b.dataset.proof, 600);
    if (error || !data) { if (win) win.close(); return fail(error, 'No se pudo abrir el comprobante.'); }
    if (win) win.location = data.signedUrl; else location.href = data.signedUrl;
  });
  $$('[data-makeup]').forEach(b => b.onclick = () => { A.staff.makeupFor = b.dataset.makeup; render(); $('#mkAt')?.focus(); });
  $$('[data-makeup-cancel]').forEach(b => b.onclick = () => { A.staff.makeupFor = null; render(); });
  $$('[data-makeup-del]').forEach(b => b.onclick = async () => {
    const [student, group, at] = b.dataset.makeupDel.split('|');
    b.disabled = true;
    const { error } = await sb.rpc('cancel_makeup', { p_student: student, p_group: group, p_replaces: at });
    if (error) { b.disabled = false; return fail(error); }
    toast('Recuperación quitada.'); await refresh(); render();
  });
  const mkf = $('[data-makeup-form]');
  if (mkf) mkf.onsubmit = async e => {
    e.preventDefault();
    const [student, group, at] = mkf.dataset.makeupForm.split('|');
    const when = new Date($('#mkAt').value);
    if (isNaN(when)) return toast('Elige la fecha y la hora.');
    const { error } = await sb.rpc('schedule_makeup', { p_student: student, p_group: group, p_replaces: at, p_at: when.toISOString(), p_duration: parseInt($('#mkDur').value, 10) || 60 });
    if (error) return fail(error, 'No se pudo programar la recuperación.');
    A.staff.makeupFor = null; toast('Recuperación programada: el alumno la ve en su horario.'); await refresh(); render();
  };
  $$('[data-month-reset]').forEach(b => b.onclick = async () => {
    if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = 'Confirmar: sus 4 semanas empiezan hoy'; return; }
    b.disabled = true;
    const now = new Date(), today = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    const { error } = await sb.rpc('set_student_plan', { p_user: b.dataset.monthReset, p_plan: 'mensual', p_start: today });
    if (error) { b.disabled = false; return fail(error); }
    toast('Mes pagado de nuevo: sus 4 semanas empiezan hoy.'); await refresh(); render();
  });
  $$('[data-excuse]').forEach(b => b.onclick = () => { A.staff.excusing = b.dataset.excuse; render(); $('#exReason')?.focus(); });
  $$('[data-excuse-cancel]').forEach(b => b.onclick = () => { A.staff.excusing = null; render(); });
  $$('[data-unexcuse]').forEach(b => b.onclick = async () => {
    const [student, group, at] = b.dataset.unexcuse.split('|');
    b.disabled = true;
    const { error } = await sb.rpc('unexcuse_absence', { p_student: student, p_group: group, p_scheduled: at });
    if (error) { b.disabled = false; return fail(error); }
    toast('La ausencia vuelve a contar.'); await refresh(); render();
  });
  const exf = $('[data-excuse-form]');
  if (exf) {
    const sel = $('#exReason'), note = $('#exNote');
    sel.onchange = () => { note.placeholder = sel.value === '__otro' ? 'Escribe el motivo' : 'Certificado médico recibido el…'; note.required = sel.value === '__otro'; };
    exf.onsubmit = async e => {
      e.preventDefault();
      const [student, group, at] = exf.dataset.excuseForm.split('|');
      const other = sel.value === '__otro', reason = other ? note.value.trim() : sel.value;
      if (reason.length < 2) return toast('Escribe el motivo.');
      const btn = exf.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Guardando…';
      const { error } = await sb.rpc('excuse_absence', { p_student: student, p_group: group, p_scheduled: at, p_reason: reason, p_note: other ? '' : note.value.trim() });
      if (error) { btn.disabled = false; btn.textContent = 'Justificar'; return fail(error, 'No se pudo justificar la ausencia.'); }
      A.staff.excusing = null; toast('Ausencia justificada: ya no cuenta.'); await refresh(); render();
    };
  }
  $$('[data-ct-view]').forEach(b => b.onclick = () => viewStudentContract(b.dataset.ctView));
  $$('[data-ct-mine]').forEach(b => b.onclick = () => openContract({ mode: 'view', doc: A.contract.signed }));
  $$('[data-ct-preview]').forEach(b => b.onclick = () => openContract({ mode: 'preview', who: { name: 'Nombre del alumno', email: 'alumno@correo.com', level: 'A2' } }));
  const ctf = $('#ctForm');
  if (ctf) ctf.onsubmit = async e => {
    e.preventDefault();
    const n = (sel, d) => Math.max(1, Math.min(20, parseInt($(sel).value, 10) || d));
    const { error } = await sb.rpc('set_campus_setting', { p_key: 'contract', p_value: { enabled: $('#ctOn').checked, max_absences: n('#ctMax', 3), lates_per_absence: n('#ctLates', 3), ...($('#ctMotives') ? { motives: $('#ctMotives').value.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 12) } : {}) } });
    if (error) return fail(error, 'No se pudo guardar el contrato.');
    toast('Contrato guardado.'); await refresh(); render();
  };
  $$('[data-doc]').forEach(b => b.onclick = () => { const d = (A.docs || []).find(x => x.path === b.dataset.doc); if (d) openReader(d); });
  $$('[data-doc-scan]').forEach(b => b.onclick = async () => {
    const d = (A.docs || []).find(x => x.id === b.dataset.docScan); if (!d) return;
    b.disabled = true;
    try {
      const signed = await sb.storage.from('programa').createSignedUrl(d.path, 3600);
      if (signed.error) throw signed.error;
      const n = await scanDocument(d, { url: signed.data.signedUrl }, b);
      toast(n ? `${n} unidades encontradas en «${d.title}».` : `No hay unidades en «${d.title}»: se leerá entero.`);
    } catch (e) { b.disabled = false; b.textContent = 'Detectar las unidades'; return fail(e, 'No se pudo analizar el documento.'); }
    await refresh(); render();
  });
  $$('[data-join]').forEach(b => b.onclick = () => joinClass());
  {
    $$('[data-doc-delete]').forEach(b => b.onclick = async () => {
      b.disabled = true;
      await sb.storage.from('programa').remove([b.dataset.docPath]);
      const { error } = await sb.from('level_documents').delete().eq('id', b.dataset.docDelete);
      if (error) { b.disabled = false; return fail(error); }
      toast('Documento quitado.'); await refresh(); render();
    });
    const df = $('#docForm');
    if (df) df.onsubmit = async e => {
      e.preventDefault();
      const file = $('#docFile').files[0], level = $('#docLevel').value, title = $('#docTitle').value.trim();
      if (!file || !title) return toast('Elige un archivo y un título.');
      const slug = title.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'documento';
      const path = `${level}/${Date.now()}-${slug}.pdf`;
      const btn = df.querySelector('button[type=submit]'); btn.disabled = true;
      const up = await sb.storage.from('programa').upload(path, file, { contentType: 'application/pdf' });
      if (up.error) { btn.disabled = false; return fail(up.error, 'No se pudo subir el archivo.'); }
      const { error } = await sb.from('level_documents').insert({ level, title, path, position: A.docs.filter(d => d.level === level).length });
      if (error) { btn.disabled = false; return fail(error); }
      let found = 0;
      try {
        const row = await sb.from('level_documents').select('id').eq('path', path).single();
        if (row.data) found = await scanDocument({ id: row.data.id }, { data: new Uint8Array(await file.arrayBuffer()) }, btn);
      } catch (e) { console.error(e); }
      toast(`«${title}» añadido al programa ${level}${found ? ` · ${found} unidades encontradas` : ''}.`); await refresh(); render();
    };
  }
  $$('[data-final-create]').forEach(b => b.onclick = async () => {
    b.disabled = true;
    const { data, error } = await sb.rpc('create_final_unit', { p_level: b.dataset.finalCreate, p_title: '' });
    if (error) { b.disabled = false; return fail(error); }
    toast('Examen final creado: añade sus ejercicios y publícalo.'); await refresh(); render();
  });
  $$('[data-validate-level]').forEach(b => b.onclick = async () => {
    if (b.dataset.done !== '1' && !confirm(`${b.dataset.name} todavía no superó todas las unidades del ${b.dataset.level}. ¿Validar de todos modos su examen con el profesor?`)) return;
    b.disabled = true;
    const { data, error } = await sb.rpc('validate_teacher_exam', { p_student: b.dataset.validateLevel });
    if (error) { b.disabled = false; return fail(error); }
    toast(data.promoted ? `${b.dataset.name} pasa al nivel siguiente.` : `Examen validado. ${b.dataset.name} podrá hacer el examen final del campus${data.needs_final ? ' cuando termine sus unidades' : ''}.`);
    await refresh(); render();
  });
  $$('[data-group-edit]').forEach(b => b.onclick = () => { A.staff.groupEditing = b.dataset.groupEdit; render(); });
  $$('[data-group-cancel]').forEach(b => b.onclick = () => { A.staff.groupEditing = null; render(); });
  $$('[data-group-delete]').forEach(b => b.onclick = async () => {
    if (!confirm('¿Eliminar este grupo? Sus alumnos se quedan sin horario.')) return;
    const { error } = await sb.rpc('delete_group', { p_id: b.dataset.groupDelete });
    if (error) return fail(error);
    A.staff.groupEditing = null; toast('Grupo eliminado.'); await refresh(); render();
  });
  $$('[data-chg]').forEach(b => b.onclick = async () => {
    b.disabled = true;
    const { error } = await sb.rpc('decide_schedule_change', { p_id: b.dataset.chg, p_approve: b.dataset.ok === '1' });
    if (error) { b.disabled = false; return fail(error); }
    toast(b.dataset.ok === '1' ? 'Cambio aprobado: los alumnos ya lo ven.' : 'Cambio rechazado.'); await refresh(); render();
  });
  $$('[data-mail-test]').forEach(b => b.onclick = async () => {
    b.disabled = true;
    const results = await Promise.all(['weekly-report', 'class-reminders'].map(fn => sb.functions.invoke(fn, { body: { test: true } })));
    b.disabled = false;
    const ok = results.filter(r => !r.error && r.data && r.data.ok).length;
    toast(ok === 2 ? `Enviados a ${results[0].data.to}: informe del lunes y recordatorio.` : ok ? 'Solo se envió uno de los dos correos: revisa los registros de las funciones en Supabase.' : 'No se pudo enviar: revisa que las funciones estén desplegadas.');
  });
  const rf = $('#rulesForm');
  if (rf) rf.onsubmit = async e => {
    e.preventDefault();
    const num = (id, d) => { const v = $(id).value.trim(); return v === '' ? d : Math.max(0, Math.round(+v)); };
    const att = { enabled: $('#raOn').checked, open_min: num('#raOpen', 60), absent_after_min: num('#raAbsent', 10), late_after_min: num('#raLate', null) };
    if (att.late_after_min != null && att.late_after_min >= att.absent_after_min) return toast('«Tarde» debe ser menor que «Ausente».');
    const a = await sb.rpc('set_campus_setting', { p_key: 'attendance', p_value: att });
    const r = await sb.rpc('set_campus_setting', { p_key: 'reminder', p_value: { enabled: $('#rrOn').checked, before_min: num('#rrBefore', 60) } });
    if (a.error || r.error) return fail(a.error || r.error);
    toast('Reglas guardadas.'); await refresh(); render();
  };
  const gf = $('#groupForm');
  if (gf) gf.onsubmit = async e => {
    e.preventDefault();
    const slots = [0, 1, 2, 3].map(i => ({ weekday: +$('#gsDay' + i).value, start_time: $('#gsTime' + i).value, duration_min: +$('#gsDur' + i).value || 60 })).filter(s => s.weekday && s.start_time);
    if (!slots.length) return toast('Añade al menos un día con su hora.');
    const { error } = await sb.rpc('save_group', {
      p_id: gf.dataset.groupId || null, p_name: $('#gName').value.trim(), p_teacher: $('#gTeacher').value || null, p_level: $('#gLevel').value,
      p_zoom: $('#gZoom').value.trim(), p_timezone: $('#gTz').value, p_slots: slots, p_members: $$('#groupForm .chips input:checked').map(c => c.value)
    });
    if (error) return fail(error, 'No se pudo guardar el grupo.');
    A.staff.groupEditing = null; toast('Grupo guardado: el horario ya aparece a sus alumnos.'); await refresh(); render();
  };
  const cf = $('#chgForm');
  if (cf) {
    const sync = () => { $('#chgAt').disabled = $('#chgKind').value === 'cancel'; };
    $('#chgKind').onchange = sync; sync();
    cf.onsubmit = async e => {
      e.preventDefault();
      const [group, original] = $('#chgSession').value.split('|');
      const cancel = $('#chgKind').value === 'cancel';
      const at = cancel ? null : new Date($('#chgAt').value);
      if (!cancel && (!at || isNaN(at))) return toast('Elige la nueva fecha y hora.');
      if (!cancel && at < new Date()) return toast('La nueva fecha ya pasó.');
      const { error } = await sb.rpc('request_schedule_change', { p_group: group, p_original_at: original, p_new_at: at ? at.toISOString() : null, p_reason: $('#chgWhy').value.trim() });
      if (error) return fail(error, /duplicate|unique/.test(error.message || '') ? 'Ya hay una solicitud para esa clase.' : 'No se pudo enviar el cambio.');
      toast(A.profile.role === 'admin' ? 'Cambio aplicado.' : 'Solicitud enviada: el cambio se aplica cuando Pathway lo apruebe.'); await refresh(); render();
    };
  }
}

async function sendInvite(email) {
  const { data, error } = await sb.functions.invoke('invite-student', { body: { email } });
  if (error) return { ok: false };
  return { ok: true, status: data && data.status };
}

function viewContenido() {
  if (A.ed.unit) return viewEditor();
  const docsOn = isAdmin() && A.docs !== null;
  if (!A.contTab || (A.contTab === 'docs' && !docsOn)) A.contTab = (LEVELS.find(l => A.units.some(u => u.level === l && !u.is_final)) || 'A2');
  const tab = A.contTab, levels = tab === 'docs' ? [] : [tab];
  // A level has 64 units: show one segment (16 units) at a time; the final exam stays visible.
  const seg = A.contSeg || 'A', segOf = u => 'ABCD'[Math.min(3, Math.floor((u.number - 1) / 16))];
  const inSeg = u => u.is_final || segOf(u) === seg;
  const segChips = l => `<div class="seg-chips" role="group" aria-label="Segmento">${'ABCD'.split('').map(x => { const n = A.units.filter(u => u.level === l && !u.is_final && segOf(u) === x).length; return `<button type="button" data-cont-seg="${x}" aria-pressed="${x === seg}">${x}<small>${n}</small></button>`; }).join('')}</div>`;
  const stat = l => { const list = A.units.filter(u => u.level === l); const live = list.filter(u => { const inf = A.unitInfo[u.id]; return inf && inf.count && inf.validated === inf.count; }).length; return { n: list.length, live }; };
  const tabs = `<div class="seg-tabs" role="group" aria-label="Nivel">${LEVELS.map(l => { const st = stat(l); return `<button type="button" data-cont="${l}" aria-pressed="${tab === l}"><b>${l}</b>${st.n ? `${st.live} / ${st.n} publicadas` : 'Sin unidades'}</button>`; }).join('')}${docsOn ? `<button type="button" data-cont="docs" aria-pressed="${tab === 'docs'}"><b>${icon('book')}</b>Documentos</button>` : ''}</div>`;
  if (tab === 'docs') return `<section class="view" aria-labelledby="h-cont">
  ${topBar('h-cont', 'Contenido', 'Los documentos del programa que cada alumno ve en «Mi curso».')}
  ${tabs}
  ${docsTile()}
  </section>`;
  return `<section class="view" aria-labelledby="h-cont">
  ${topBar('h-cont', 'Contenido', 'Los alumnos solo ven las unidades publicadas')}
  ${tabs}
  ${levels.map(l => `<article class="tile"><div class="tile-head"><h2>Nivel ${l} · segmento ${seg}</h2>${segChips(l)}</div>
    ${A.units.some(u => u.level === l) ? '' : `<p class="muted">Todavía no hay unidades ${l}. Créalas abajo.</p>`}
    ${A.units.some(u => u.level === l && !u.is_final && inSeg(u)) ? '' : A.units.some(u => u.level === l) ? `<p class="muted">Todavía no hay unidades en el segmento ${seg}.</p>` : ''}
    ${A.units.filter(u => u.level === l && inSeg(u)).map(u => { const inf = A.unitInfo[u.id] || { count: 0, validated: 0 }; const live = inf.count && inf.validated === inf.count;
      return `<div class="unit-row"><span class="no">${u.is_final ? icon('trophy') : pad2(u.number)}</span><div class="meta"><b>${esc(u.title)}</b><span>${inf.count} ejercicio${inf.count === 1 ? '' : 's'}${u.manual_time ? ' · manual: ' + esc(u.manual_time) : ''}</span></div>
        <span class="state-chip ${live ? 'live' : 'draft'}">${live ? 'Publicada' : 'Borrador'}</span>
        <button class="btn btn-light btn-sm" data-edit-unit="${u.id}">Editar</button>
        ${inf.count ? `<button class="btn btn-light btn-sm" data-preview="${u.id}">Probar</button><button class="btn ${live ? 'btn-light' : 'btn-dark'} btn-sm" data-publish="${u.id}" data-status="${live ? 'draft' : 'validated'}">${live ? 'Volver a borrador' : 'Publicar'}</button>` : ''}</div>`; }).join('')}
    ${'is_final' in (A.units[0] || {}) && !A.units.some(u => u.level === l && u.is_final) ? `<div class="unit-row"><span class="no">${icon('trophy')}</span><div class="meta"><b>Examen final ${l}</b><span>Unos 15 minutos en el campus, tras el examen con el profesor. Sin él, la validación del profesor basta para pasar de nivel.</span></div><button class="btn btn-dark btn-sm" type="button" data-final-create="${l}">Crear el examen final</button></div>` : ''}
  </article>`).join('')}
  <article class="tile"><div class="tile-head"><h2>Nueva unidad</h2></div>
    <form id="newUnitForm" class="form" novalidate>
      <div class="form-2"><label class="field" for="nuLevel">Nivel<select id="nuLevel">${LEVELS.map(l => `<option ${l === tab ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="field" for="nuNumber">Número (1 a 64)<input id="nuNumber" type="number" inputmode="numeric" min="1" max="64" required></label></div>
      <label class="field" for="nuTitle">Título<input id="nuTitle" maxlength="160" required placeholder="Le présent des verbes en -ir"></label>
      <button class="btn btn-dark" type="submit">${icon('plus')}Crear la unidad</button>
    </form></article>
  </section>`;
}

/* ───────────── Content editor ───────────── */
const EX_TYPES = {
  choice: { label: 'Opción múltiple', kind: 'Conjugación', icon: 'pen' },
  type: { label: 'Escribir la respuesta', kind: 'Conjugación', icon: 'pen' },
  listen: { label: 'Comprensión oral', kind: 'Comprensión oral', icon: 'speaker' },
  order: { label: 'Ordenar la frase', kind: 'Construcción', icon: 'pen' },
  match: { label: 'Unir parejas', kind: 'Vocabulario', icon: 'puzzle' },
  dictation: { label: 'Dictado', kind: 'Dictado', icon: 'speaker' },
  spot: { label: 'Detectar el error', kind: 'Detecta el error', icon: 'search' }
};
// Explanations are stored as HTML with <b>; the editor shows **bold** instead.
const toStars = h => String(h || '').replace(/<b>(.*?)<\/b>/gi, '**$1**').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const fromStars = t => esc(String(t || '').trim()).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const lines = t => String(t || '').split('\n').map(x => x.trim()).filter(Boolean);
const exSummary = x => { const p = x.payload || {}; return p.fr || p.question || p.es || (p.before ? `${p.before} ___ ${p.after || ''}` : '') || (p.words || []).join(' ') || (p.pairs || []).map(q => q.join(' = ')).join(' · ') || p.title || ''; };

async function loadEditor(unitId) {
  const { data, error } = await sb.from('exercises').select('id,position,type,kind,payload,status').eq('unit_id', unitId).order('position');
  if (error) return fail(error);
  A.ed.unit = unitId; A.ed.items = data; A.ed.confirm = null; A.ed.busy = false;
  if (currentView() === 'contenido') render();
}

function exForm(type, x) {
  const p = (x && x.payload) || {};
  const opts = p.options || ['', '', '', ''];
  const f = (id, label, value, ph = '', attrs = '') => `<label class="field" for="${id}">${label}<input id="${id}" value="${esc(value || '')}" placeholder="${esc(ph)}" ${attrs}></label>`;
  const ta = (id, label, value, ph = '', rows = 3) => `<label class="field" for="${id}">${label}<textarea id="${id}" class="ed-area" rows="${rows}" placeholder="${esc(ph)}">${esc(value || '')}</textarea></label>`;
  const optionsBlock = `<div class="field">Opciones · marca la correcta<div class="ed-options">${opts.map((o, i) => `<label class="ed-opt"><input type="radio" name="edAnswer" value="${i}" ${(p.answer || 0) === i ? 'checked' : ''} aria-label="Respuesta correcta ${i + 1}"><input class="ed-opt-text" data-opt-i="${i}" value="${esc(o)}" placeholder="Opción ${i + 1}"></label>`).join('')}</div><span class="ed-hint">Deja vacías las opciones que no necesites (mínimo 2).</span></div>`;
  let body = '';
  if (type === 'choice') body = f('edFr', 'Frase en francés (opcional) · usa ___ para el hueco', p.fr, 'Nous ___ français au travail.') + f('edEs', 'Traducción (opcional)', p.es, 'Hablamos francés en el trabajo.') + optionsBlock;
  else if (type === 'type') body = `<div class="form-2">${f('edBefore', 'Antes del hueco', p.before, 'Tu')}${f('edAfter', 'Después del hueco', p.after, 'dans un bureau.')}</div>` + f('edHint', 'Pista (opcional)', p.hint, 'travailler') + ta('edAnswers', 'Respuestas aceptadas · una por línea', (p.answers || []).join('\n'), 'travailles', 2);
  else if (type === 'listen') body = ta('edAudio', 'Texto que se escucha (en francés)', p.audio, 'Bonjour ! Je m’appelle Camille…') + f('edQuestion', 'Pregunta', p.question, '¿Qué hace Camille a mediodía?') + optionsBlock;
  else if (type === 'order') body = f('edEs', 'Frase en español', p.es, 'Por la noche, veo una película.') + ta('edAnswer', 'Frase correcta · un bloque por línea, en orden', (p.answer || []).join('\n'), 'Le soir,\nje\nregarde\nun\nfilm.', 5) + ta('edExtra', 'Bloques trampa (opcional) · uno por línea', (p.tiles || []).filter(t => !(p.answer || []).includes(t)).join('\n'), 'regardes', 2);
  else if (type === 'match') body = ta('edPairs', 'Parejas · una por línea, separadas por =', (p.pairs || []).map(q => q.join(' = ')).join('\n'), 'nous = aimons\nvous = aimez', 5);
  else if (type === 'dictation') body = f('edAudio', 'Frase que se escucha (en francés)', p.audio, 'J’écoute de la musique.') + f('edEs', 'Traducción (se muestra si no hay voz)', p.es, 'Escucho música.');
  else if (type === 'spot') body = f('edSentence', 'Frase con el error', (p.words || []).join(' '), 'Ils mangez avec leurs collègues.') + `<div class="form-2">${f('edWrong', 'Palabra incorrecta', (p.words || [])[p.wrong] || '', 'mangez')}${f('edFix', 'Corrección', p.fix, 'mangent')}</div>`;
  return `<form class="form ed-form" id="exForm" data-type="${type}" data-id="${x ? x.id : ''}" novalidate>
    <div class="ed-form-head"><span class="ex-kind">${icon(EX_TYPES[type].icon)}${EX_TYPES[type].label}</span></div>
    <div class="form-2">${f('edKind', 'Etiqueta', x ? x.kind : EX_TYPES[type].kind, 'Conjugación')}${f('edTitle', 'Consigna', p.title, 'Completa la frase')}</div>
    ${body}
    ${ta('edExplain', 'Explicación tras responder · **texto** en negrita', toStars(p.explain), 'Con **nous**, los verbos en -er terminan en **-ons**.', 2)}
    <p class="form-error" id="exErr" hidden></p>
    <div class="ed-actions"><button class="btn btn-dark btn-sm" type="submit">Guardar</button><button class="btn btn-light btn-sm" type="button" data-ed-close>Cancelar</button></div>
  </form>`;
}

function readExForm(form) {
  const type = form.dataset.type, v = id => (form.querySelector('#' + id) || {}).value || '';
  const p = { title: v('edTitle').trim(), explain: fromStars(v('edExplain')) };
  const err = m => { throw new Error(m); };
  if (!p.title) err('Escribe la consigna.');
  if (type === 'choice' || type === 'listen') {
    const raw = [...form.querySelectorAll('[data-opt-i]')].map(i => i.value.trim());
    const picked = +(form.querySelector('input[name=edAnswer]:checked') || { value: 0 }).value;
    if (!raw[picked]) err('La opción marcada como correcta está vacía.');
    const kept = raw.map((o, i) => ({ o, i })).filter(z => z.o);
    if (kept.length < 2) err('Escribe al menos dos opciones.');
    p.options = kept.map(z => z.o); p.answer = kept.findIndex(z => z.i === picked);
    p.two = p.options.every(o => o.length <= 28);
  }
  if (type === 'choice') { if (v('edFr').trim()) p.fr = v('edFr').trim(); if (v('edEs').trim()) p.es = v('edEs').trim(); if (p.fr && !p.fr.includes('___') && !p.es) { /* plain sentence is fine */ } }
  if (type === 'listen') { p.audio = v('edAudio').trim(); p.question = v('edQuestion').trim(); if (!p.audio) err('Escribe el texto que se escucha.'); if (!p.question) err('Escribe la pregunta.'); }
  if (type === 'type') { p.before = v('edBefore').trim(); p.after = v('edAfter').trim(); if (v('edHint').trim()) p.hint = v('edHint').trim(); p.answers = lines(v('edAnswers')); if (!p.answers.length) err('Escribe al menos una respuesta aceptada.'); if (!p.before && !p.after) err('Escribe la frase alrededor del hueco.'); }
  if (type === 'order') { p.es = v('edEs').trim(); p.answer = lines(v('edAnswer')); if (p.answer.length < 2) err('La frase necesita al menos dos bloques.'); const extra = lines(v('edExtra')); const all = [...p.answer, ...extra]; for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; } p.tiles = all; }
  if (type === 'match') { p.pairs = lines(v('edPairs')).map(l => l.split('=').map(z => z.trim())); if (p.pairs.some(q => q.length !== 2 || !q[0] || !q[1])) err('Cada línea debe tener la forma «izquierda = derecha».'); if (p.pairs.length < 2 || p.pairs.length > 8) err('Entre 2 y 8 parejas.'); }
  if (type === 'dictation') { p.audio = v('edAudio').trim(); if (!p.audio) err('Escribe la frase del dictado.'); p.answers = [p.audio]; if (v('edEs').trim()) p.es = v('edEs').trim(); }
  if (type === 'spot') { p.words = v('edSentence').trim().split(/\s+/).filter(Boolean); const w = v('edWrong').trim(); p.fix = v('edFix').trim(); p.wrong = p.words.indexOf(w); if (p.words.length < 2) err('Escribe la frase completa.'); if (p.wrong < 0) err('La palabra incorrecta debe aparecer tal cual en la frase.'); if (!p.fix) err('Escribe la corrección.'); }
  return { type, kind: v('edKind').trim() || EX_TYPES[type].kind, payload: p };
}

function viewEditor() {
  const u = unitById(A.ed.unit);
  if (!u) { A.ed.unit = null; return viewContenido(); }
  const items = A.ed.items, open = A.ed.open;
  const drafts = items.filter(x => x.status !== 'validated').length;
  const row = (x, i) => {
    if (open === x.id) return `<div class="ed-row is-open">${exForm(x.type, x)}</div>`;
    const confirming = A.ed.confirm === x.id;
    return `<div class="ed-row"><span class="no">${i + 1}</span><div class="meta"><b>${esc(EX_TYPES[x.type] ? EX_TYPES[x.type].label : x.type)} · ${esc(x.kind)}</b><span>${esc(exSummary(x))}</span>${x.status !== 'validated' ? '<span class="state-chip draft" style="margin-top:6px">Borrador</span>' : ''}</div>
      <span class="ed-tools">${confirming
        ? `<button class="btn btn-coral btn-sm" type="button" data-ed-delete="${x.id}">Eliminar</button><button class="btn btn-light btn-sm" type="button" data-ed-close>No</button>`
        : `<button class="round sm" type="button" data-ed-move="${x.id}" data-dir="-1" aria-label="Subir" ${i === 0 ? 'disabled' : ''}><span style="display:inline-flex;transform:rotate(-90deg)">${icon('arrow')}</span></button><button class="round sm" type="button" data-ed-move="${x.id}" data-dir="1" aria-label="Bajar" ${i === items.length - 1 ? 'disabled' : ''}><span style="display:inline-flex;transform:rotate(90deg)">${icon('arrow')}</span></button><button class="btn btn-light btn-sm" type="button" data-ed-open="${x.id}">Editar</button><button class="btn btn-light btn-sm" type="button" data-ed-ask="${x.id}">Eliminar</button>`}</span></div>`;
  };
  return `<section class="view" aria-labelledby="h-ed">
  <header class="top"><div><button class="ob-link" type="button" data-ed-back style="margin-bottom:8px">← Volver al contenido</button><h1 id="h-ed">Unidad ${u.number} · ${u.level}</h1><p>${items.length} ejercicio${items.length === 1 ? '' : 's'}${drafts ? ` · ${drafts} en borrador: los alumnos no los ven hasta «Publicar»` : ''}</p></div>
    <div class="top-tools">${items.length ? `<button class="btn btn-light btn-sm" data-preview="${u.id}">Probar</button><button class="btn btn-dark btn-sm" data-publish="${u.id}" data-status="validated">Publicar</button>` : ''}</div></header>
  <article class="tile"><form id="unitForm" class="form" novalidate>
    <div class="form-2"><label class="field" for="uTitle">Título de la unidad<input id="uTitle" maxlength="160" value="${esc(u.title)}"></label>
      <label class="field" for="uTime">Duración en el manual (opcional)<input id="uTime" maxlength="40" value="${esc(u.manual_time || '')}" placeholder="1 h – 1 h 30"></label></div>
    <div><button class="btn btn-dark btn-sm" type="submit">Guardar la unidad</button></div>
  </form></article>
  <article class="tile"><div class="tile-head"><h2>Ejercicios</h2></div>
    ${items.length ? items.map(row).join('') : '<p class="muted" style="margin-bottom:12px">Todavía no hay ejercicios. Añade el primero.</p>'}
    ${String(open).startsWith('new:') ? `<div class="ed-row is-open">${exForm(open.slice(4), null)}</div>` : ''}
    <div class="ed-add"><p class="label">Añadir un ejercicio</p><div class="chips">${Object.entries(EX_TYPES).map(([k, t]) => `<button class="btn btn-light btn-sm" type="button" data-ed-new="${k}">${icon(t.icon)}${t.label}</button>`).join('')}</div></div>
  </article></section>`;
}

/* ───────────── Events ───────────── */
function bindEditor() {
  const nu = $('#newUnitForm');
  if (nu) nu.onsubmit = async e => {
    e.preventDefault();
    const n = +$('#nuNumber').value, title = $('#nuTitle').value.trim();
    if (!(n >= 1 && n <= 64)) return toast('El número va de 1 a 64.');
    if (!title) return toast('Escribe el título.');
    const { data, error } = await sb.rpc('save_unit', { p_id: null, p_level: $('#nuLevel').value, p_number: n, p_title: title, p_manual_time: null });
    if (error) return fail(error, /exists/.test(error.message || '') ? 'Esa unidad ya existe.' : 'No se pudo crear la unidad.');
    await refresh(); toast('Unidad creada.'); A.ed.open = null; await loadEditor(data);
  };
  const uf = $('#unitForm');
  if (uf) uf.onsubmit = async e => {
    e.preventDefault();
    const { error } = await sb.rpc('save_unit', { p_id: A.ed.unit, p_level: null, p_number: null, p_title: $('#uTitle').value, p_manual_time: $('#uTime').value });
    if (error) return fail(error, 'No se pudo guardar la unidad.');
    await refresh(); toast('Unidad guardada.'); render();
  };
  const xf = $('#exForm');
  if (xf) {
    xf.onsubmit = async e => {
      e.preventDefault();
      if (A.ed.busy) return;
      let ex; const box = $('#exErr');
      try { ex = readExForm(xf); } catch (er) { box.textContent = er.message; box.hidden = false; return; }
      A.ed.busy = true;
      const { error } = await sb.rpc('save_exercise', { p_id: xf.dataset.id || null, p_unit: A.ed.unit, p_type: ex.type, p_kind: ex.kind, p_payload: ex.payload });
      A.ed.busy = false;
      if (error) { box.textContent = 'No se pudo guardar. Revisa los campos.'; box.hidden = false; return; }
      toast(xf.dataset.id ? 'Ejercicio guardado.' : 'Ejercicio añadido en borrador.');
      A.ed.open = null; await refresh(); await loadEditor(A.ed.unit);
    };
    setTimeout(() => xf.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }), 30);
  }
}

/* ───────────── Mensajes (db/025_mensajes.sql): the student writes, the assistant answers first, the teacher replies ───────────── */
// M.thread: the student's own conversation (null until the first message); M.open and
// M.messages: the conversation the staff member is reading; M.drafts: unsent text per thread;
// M.editing: the assistant draft being edited before « Enviar ».
// Students see the assistant's answers signed « Equipo Pathway » (the database gives them as
// kind « team »); only the team sees that the assistant wrote them, and its unsent drafts.
const M = { ready: false, thread: null, typing: false, busy: false, open: null, messages: null, drafts: {}, editing: null };
const TEAM = 'Equipo Pathway';
const ASSISTANT_LABEL = 'Asistente Pathway · respuesta automática';
const HANDED = 'Se lo pasamos a tu profesor';
const MSG_SUGG = ['¿A qué hora es mi próxima clase?', '¿Cómo entro a mi clase de Zoom?', '¿Cuántas ausencias llevo este mes?', '¿Cómo aviso que no podré asistir?'];
const myUnread = () => (M.thread && M.thread.unread) || 0;
const threadsWaiting = () => (A.staff.threads || []).filter(t => t.needs_staff);
const msgWhen = iso => {
  const d = new Date(iso), k = dayKey(d), t = todayKey(), hm = fmtDate(d, { hour: '2-digit', minute: '2-digit' });
  return k === t ? hm : k === addDays(t, -1) ? `ayer ${hm}` : `${fmtDate(d, { day: 'numeric', month: 'short' }).replace('.', '')} ${hm}`;
};
const msgBody = s => esc(s).replace(/\n/g, '<br>');
async function loadMyThread() {
  if (isStaff()) { M.ready = false; M.thread = null; return; }
  const r = await sb.rpc('my_thread');
  M.ready = !r.error;
  M.thread = r.error ? null : (r.data || null);
}
const msgError = e => {
  const m = (e && e.message) || '';
  if (/rate_limit_hour/.test(m)) return 'Enviaste muchos mensajes en una hora. Espera un poco: tu profesor ya tiene tus preguntas.';
  if (/rate_limit_day/.test(m)) return 'Llegaste al límite de mensajes de hoy. Mañana podrás escribir de nuevo.';
  if (/message_too_long/.test(m)) return 'Tu mensaje es demasiado largo: 1000 caracteres como máximo.';
  return 'No se pudo enviar el mensaje. Inténtalo de nuevo.';
};

// One message. staff: the staff member's view (the student on the left, the team on the right).
function msgItem(m, staff, studentName) {
  const ours = staff ? m.kind !== 'student' : m.kind === 'student';
  const draft = staff && m.kind === 'assistant' ? m.draft_state : null;
  const who = m.kind === 'assistant'
    ? `${icon('sparkle')}${draft === 'pending' ? 'Borrador del asistente · el alumno todavía no lo ve' : draft === 'discarded' ? 'Borrador del asistente · descartado' : draft === 'sent' ? `Asistente Pathway · revisada${m.edited ? ' y editada' : ''} por ${esc(m.sent_by || 'el equipo')}` : ASSISTANT_LABEL}`
    : m.kind === 'team' ? TEAM
    : m.kind === 'staff' ? `${esc(m.author || TEAM)}${staff && m.mine ? ' · tú' : staff ? '' : ' · tu profesor'}`
    : staff ? esc(studentName) : '';
  let flag = '';
  if (staff && m.kind === 'assistant' && m.escalated) flag = `<p class="msg-flag">${icon('users')}<span>Pasada al profesor${m.note ? ` · ${esc(m.note)}` : ''}</span></p>`;
  if (!staff && m.handed_over) flag = `<p class="msg-flag">${icon('users')}<span>${HANDED}</span></p>`;
  if (staff && draft === 'pending' && M.editing === m.id) {
    return `<div class="msg ours k-assistant is-draft is-editing"><p class="msg-who">${who}</p>
      <form class="msg-draft-edit" data-draft-form="${m.id}"><label class="sr-only" for="draftText">Texto de la respuesta</label>
        <textarea id="draftText" rows="4" maxlength="2000">${esc(m.body)}</textarea>
        <div class="msg-draft-acts"><button class="btn btn-dark btn-sm" type="submit">${icon('arrow')}Enviar</button><button class="btn btn-light btn-sm" type="button" data-draft-cancel>Cancelar</button></div></form></div>`;
  }
  const acts = draft === 'pending' ? `<div class="msg-draft-acts"><button class="btn btn-dark btn-sm" type="button" data-draft-send="${m.id}">${icon('arrow')}Enviar</button><button class="btn btn-light btn-sm" type="button" data-draft-edit="${m.id}">${icon('pen')}Editar</button><button class="btn btn-light btn-sm" type="button" data-draft-discard="${m.id}">Descartar</button></div>` : '';
  return `<div class="msg ${ours ? 'ours' : 'theirs'} k-${m.kind}${draft === 'pending' ? ' is-draft' : draft === 'discarded' ? ' is-discarded' : ''}">${who ? `<p class="msg-who">${who}</p>` : ''}
    <div class="msg-bubble">${msgBody(m.body)}</div>${flag}${acts}<p class="msg-time"><time datetime="${esc(m.created_at)}">${esc(msgWhen(m.created_at))}</time></p></div>`;
}
function studentLog() {
  const list = (M.thread && M.thread.messages) || [];
  if (!list.length) return `<div class="msg-empty">${icon('chat')}<p><b>Escribe tu primera pregunta.</b><br>Por ejemplo: «¿A qué hora es mi próxima clase?». Te respondemos aquí, y tu profesor ve toda la conversación.</p></div>`;
  const last = list[list.length - 1];
  return list.map(m => msgItem(m, false)).join('')
    + (M.typing && M.thread && M.thread.auto_reply ? `<div class="msg theirs k-team typing"><p class="msg-who">${TEAM}</p><div class="msg-bubble"><span class="msg-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="sr-only">${TEAM} está escribiendo…</span></div></div>`
      : last.kind === 'student' && !M.typing ? `<p class="msg-sys">${icon('users')}<span>Te responderemos aquí. Te avisamos por correo.</span></p>` : '');
}
const composer = (label, ph, max) => `<form class="chat-form" id="chatForm" novalidate>
    <label class="sr-only" for="chatText">${label}</label>
    <textarea id="chatText" rows="2" maxlength="${max}" placeholder="${esc(ph)}" aria-describedby="chatHint"></textarea>
    <button class="btn btn-dark chat-send" type="submit">${icon('arrow')}<span>Enviar</span></button>
    <p class="chat-hint" id="chatHint"><span>Ctrl + Enter para enviar</span><span class="num" id="chatCount">0 / ${max}</span></p></form>`;

function viewMensajes() { return teacherMode() ? viewMensajesStaff() : viewMensajesStudent(); }
function viewMensajesStudent() {
  const teacher = (M.thread && M.thread.teacher) || (A.teacher && A.teacher.full_name) || '';
  return `<section class="view" aria-labelledby="h-mensajes">
  ${topBar('h-mensajes', 'Mensajes', teacher ? `Tus preguntas para ${esc(teacher)}, en un solo lugar` : 'Tus preguntas para tu profesor, en un solo lugar')}
  <div class="bento">
    <article class="tile chat-tile c-8"><div class="tile-head"><h2>Tu conversación</h2>${teacher ? `<span class="pill ghost">${icon('users')}${esc(teacher)}</span>` : ''}</div>
      <div class="chat-log" id="chatLog" role="log" aria-label="Conversación con tu profesor" tabindex="0">${studentLog()}</div>
      ${composer('Tu mensaje', 'Escribe tu pregunta…', 1000)}
    </article>
    <article class="tile lilac c-4 chat-how"><p class="label" style="color:var(--lilac-ink)">Cómo funciona</p>
      <ol class="how">
        <li><b>Escribe tu pregunta aquí</b>, en vez de WhatsApp: tus clases, cómo entrar a Zoom, tus ausencias, las reglas del curso.</li>
        <li><b>El equipo Pathway te responde</b> con los datos de tu curso. Lo que decide tu profesor (cambiar una clase, aceptar un justificativo, un precio especial, tu nivel) se lo pasamos a tu profesor.</li>
        <li><b>Todas las respuestas llegan aquí</b> y te avisamos por correo.</li>
      </ol>
      <p class="label" style="margin-top:18px;color:var(--lilac-ink)">Pregunta rápida</p>
      <div class="chat-sugg">${MSG_SUGG.map(q => `<button type="button" data-sugg="${esc(q)}">${esc(q)}</button>`).join('')}</div>
    </article>
  </div></section>`;
}

function threadRow(t) {
  const last = t.last || {}, prefix = last.draft_state === 'pending' ? 'Borrador: ' : last.kind === 'assistant' ? 'Asistente: ' : last.kind === 'staff' ? 'Equipo: ' : '';
  return `<button type="button" class="msg-row${t.id === M.open ? ' on' : ''}" data-thread="${t.id}"${t.id === M.open ? ' aria-current="true"' : ''}>
    <span class="ava sm">${esc(initials(t.name))}</span>
    <span class="msg-row-main"><b>${esc(t.name)}</b><small>${esc(prefix + (last.body || 'Sin mensajes todavía'))}</small></span>
    <span class="msg-row-side">${t.last_message_at ? `<small>${esc(msgWhen(t.last_message_at))}</small>` : ''}${t.drafts ? '<span class="status warn">Borrador por enviar</span>' : t.needs_staff ? '<span class="status warn">Necesita respuesta</span>' : ''}${t.unread ? `<span class="count num" title="Sin leer">${t.unread}<span class="sr-only"> sin leer</span></span>` : ''}</span></button>`;
}
function msgListHtml() {
  const list = A.staff.threads || [];
  const wait = list.filter(t => t.needs_staff), rest = list.filter(t => !t.needs_staff);
  if (!list.length) return '<p class="muted">Todavía no hay mensajes. Cuando un alumno escriba desde su Campus, su conversación aparecerá aquí.</p>';
  return `${wait.length ? `<p class="label">Necesitan respuesta</p><div class="msg-list">${wait.map(threadRow).join('')}</div>` : ''}
    ${rest.length ? `<p class="label"${wait.length ? ' style="margin-top:14px"' : ''}>${wait.length ? 'Otras conversaciones' : 'Todas al día'}</p><div class="msg-list">${rest.map(threadRow).join('')}</div>` : ''}`;
}
function staffLog(t) {
  if (!M.messages) return '<p class="muted">Cargando…</p>';
  return M.messages.length ? M.messages.map(m => msgItem(m, true, t.name)).join('') : `<p class="muted">Todavía no hay mensajes. Escribe el primero a ${esc(firstName(t.name))}.</p>`;
}
function viewMensajesStaff() {
  const list = A.staff.threads || [];
  const t = M.open ? list.find(x => x.id === M.open) : null;
  if (M.open && !t) M.open = null;
  const wait = threadsWaiting().length;
  const have = new Set(list.map(x => x.student_id));
  const others = A.staff.overview.filter(s => !have.has(s.id));
  const thread = t ? `<article class="tile msg-thread-tile" aria-labelledby="msgThreadName">
      <div class="tile-head msg-thread-head"><button type="button" class="round msg-back" data-thread-close aria-label="Volver a las conversaciones">${icon('arrow')}</button>
        <div class="msg-thread-title"><h2 id="msgThreadName" tabindex="-1">${esc(t.name)}</h2><p class="muted">${esc(t.level)}${isAdmin() && t.teacher ? ' · ' + esc(t.teacher) : ''}</p></div>
        ${t.needs_staff ? '<span class="pill warn">Necesita respuesta</span>' : '<span class="pill ghost">Al día</span>'}</div>
      ${t.drafts ? `<p class="msg-reason">${icon('sparkle')}<span><b>El asistente preparó una respuesta.</b> Revísala, edítala si hace falta y envíala: el alumno no la ve antes.</span></p>`
        : t.needs_staff && t.escalated_reason ? `<p class="msg-reason">${icon('sparkle')}<span><b>El asistente te la pasó:</b> ${esc(t.escalated_reason)}</span></p>` : ''}
      <div class="chat-log" id="chatLog" role="log" aria-label="Conversación con ${esc(t.name)}" tabindex="0">${staffLog(t)}</div>
      ${composer('Tu respuesta', `Responde a ${firstName(t.name)}…`, 2000)}
      ${t.needs_staff ? `<div class="msg-actions"><button class="btn btn-light btn-sm" type="button" data-thread-done>${icon('check')}Marcar como resuelta</button><span class="muted">Si ya lo resolviste por otro medio.</span></div>` : ''}
    </article>`
    : `<article class="tile msg-thread-tile empty"><h2>Elige una conversación</h2><p class="muted">Verás lo que escribió el alumno y lo que le contestó el asistente, y podrás responderle. Las que necesitan respuesta están arriba.</p></article>`;
  return `<section class="view" aria-labelledby="h-mensajes">
  ${topBar('h-mensajes', 'Mensajes', wait ? `${wait} conversación${wait > 1 ? 'es necesitan' : ' necesita'} respuesta` : 'Las preguntas de tus alumnos: el asistente responde primero')}
  <div class="msg-layout${t ? ' has-open' : ''}">
    <article class="tile msg-list-tile"><div class="tile-head"><h2>Conversaciones</h2>${wait ? `<span class="pill warn num">${wait} por responder</span>` : ''}</div>
      <div id="msgList">${msgListHtml()}</div>
      ${others.length ? `<form id="msgNew" class="form msg-new"><label class="field" for="msgNewStudent">Escribir a un alumno<select id="msgNewStudent">${others.map(s => `<option value="${s.id}">${esc(s.full_name)}</option>`).join('')}</select></label><button class="btn btn-light btn-sm" type="submit">${icon('chat')}Abrir la conversación</button></form>` : ''}
    </article>
    ${thread}
  </div></section>`;
}

const scrollLog = () => { const log = $('#chatLog'); if (log) log.scrollTop = log.scrollHeight; };
function paintChat() {
  const log = $('#chatLog');
  if (log) { log.innerHTML = teacherMode() ? staffLog((A.staff.threads || []).find(x => x.id === M.open) || {}) : studentLog(); scrollLog(); }
  if (teacherMode() && $('#msgList')) { $('#msgList').innerHTML = msgListHtml(); bindThreadRows(); }
  if (teacherMode()) bindDrafts();
  renderNav(currentView());
}
async function markMineRead() {
  if (teacherMode() || !M.thread || !myUnread()) return;
  M.thread.unread = 0; renderNav(currentView());
  const r = await sb.rpc('mark_thread_read', { p_thread: M.thread.id });
  if (r.error) console.error(r.error);
}
// The assistant answers (or passes the question on) by itself; the Campus only waits for it.
// Without the function, or if it fails, the question simply waits for the teacher.
async function askAssistant(messageId) {
  try {
    await Promise.race([sb.functions.invoke('campus-assistant', { body: { message_id: messageId } }), new Promise(r => setTimeout(r, 30000))]);
  } catch (e) { console.warn('campus-assistant:', e && e.message); }
}
function setSending(on) { const b = $('#chatForm .chat-send'); if (b) b.disabled = on; }
async function sendStudentMessage(text) {
  M.busy = true; setSending(true);
  try {
    let id = M.thread && M.thread.id;
    if (!id) { const r = await sb.rpc('open_thread'); if (r.error) return fail(r.error, msgError(r.error)); id = r.data; }
    const { data, error } = await sb.from('messages').insert({ thread_id: id, body: text }).select().single();
    if (error) return fail(error, msgError(error));
    M.drafts.me = '';
    if ($('#chatText')) { $('#chatText').value = ''; $('#chatText').dispatchEvent(new Event('input')); }
    await loadMyThread(); M.typing = true; paintChat();
    await askAssistant(data.id);
    M.typing = false; await loadMyThread(); paintChat(); markMineRead();
  } finally { M.typing = false; M.busy = false; setSending(false); }
}
async function loadOpenThread() {
  const r = await sb.rpc('thread_messages', { p_thread: M.open });
  if (r.error) { fail(r.error, 'No se pudo abrir la conversación.'); M.messages = []; return; }
  M.messages = r.data || [];
}
async function openThread(id, focus = 'text') {
  M.open = id; M.messages = null; M.editing = null; render();
  await loadOpenThread();
  const t = (A.staff.threads || []).find(x => x.id === id);
  if (t && t.unread) { t.unread = 0; sb.rpc('mark_thread_read', { p_thread: id }).then(r => { if (r.error) console.error(r.error); }); }
  if (M.open !== id) return;
  render();
  if (focus === 'text') $('#chatText')?.focus({ preventScroll: true }); else $('#msgThreadName')?.focus();
}
function closeThread() {
  const id = M.open; M.open = null; M.messages = null; M.editing = null; render();
  $(`[data-thread="${id}"]`)?.focus();
}
async function refreshStaffMessages() {
  const r = await sb.rpc('staff_threads');
  if (!r.error) A.staff.threads = r.data || [];
  if (M.open) await loadOpenThread();
}
async function sendStaffMessage(text) {
  M.busy = true; setSending(true);
  try {
    const { error } = await sb.from('messages').insert({ thread_id: M.open, body: text }).select().single();
    if (error) return fail(error, msgError(error));
    M.drafts[M.open] = '';
    await refreshStaffMessages(); render(); $('#chatText')?.focus({ preventScroll: true });
    toast('Respuesta enviada. El alumno la ve en su Campus.');
  } finally { M.busy = false; setSending(false); }
}
// Drafts of the assistant (setting « Respuestas del asistente » off): send as is, edit then send,
// or discard. A sent draft reaches the student signed « Equipo Pathway ».
async function sendDraft(id, body) {
  M.busy = true;
  try {
    const { error } = await sb.rpc('send_draft', { p_message: +id, p_body: body == null ? null : body });
    if (error) return fail(error, msgError(error));
    M.editing = null; await refreshStaffMessages(); render(); toast('Respuesta enviada al alumno, firmada «Equipo Pathway».');
  } finally { M.busy = false; }
}
function bindDrafts() {
  $$('[data-draft-send]').forEach(b => b.onclick = () => { b.disabled = true; sendDraft(b.dataset.draftSend, null); });
  $$('[data-draft-edit]').forEach(b => b.onclick = () => { M.editing = +b.dataset.draftEdit; paintChat(); const t = $('#draftText'); if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } });
  $$('[data-draft-cancel]').forEach(b => b.onclick = () => { const id = M.editing; M.editing = null; paintChat(); $(`[data-draft-edit="${id}"]`)?.focus(); });
  $$('[data-draft-discard]').forEach(b => b.onclick = async () => {
    b.disabled = true;
    const { error } = await sb.rpc('discard_draft', { p_message: +b.dataset.draftDiscard });
    if (error) { b.disabled = false; return fail(error, 'No se pudo descartar el borrador.'); }
    await refreshStaffMessages(); render(); toast('Borrador descartado: el alumno no lo verá.');
  });
  const df = $('[data-draft-form]');
  if (df) {
    df.onsubmit = e => { e.preventDefault(); const v = $('#draftText').value.trim(); if (!v) return toast('Escribe la respuesta.'); sendDraft(df.dataset.draftForm, v); };
    $('#draftText').addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); df.querySelector('[data-draft-cancel]').click(); } });
  }
}
function bindThreadRows() { $$('[data-thread]').forEach(b => b.onclick = () => openThread(b.dataset.thread)); }
function bindMessages() {
  const f = $('#chatForm'), ta = $('#chatText');
  if (f && ta) {
    const key = teacherMode() ? M.open : 'me';
    ta.value = M.drafts[key] || '';
    const sync = () => {
      M.drafts[key] = ta.value;
      const c = $('#chatCount'); if (c) c.textContent = `${ta.value.length} / ${ta.maxLength}`;
      ta.style.height = 'auto'; ta.style.height = Math.min(220, ta.scrollHeight + 2) + 'px';
    };
    ta.addEventListener('input', sync); sync();
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); f.requestSubmit(); } });
    f.onsubmit = e => {
      e.preventDefault();
      const text = ta.value.trim();
      if (!text) { toast('Escribe tu mensaje.'); ta.focus(); return; }
      if (M.busy) return;
      return teacherMode() ? sendStaffMessage(text) : sendStudentMessage(text);
    };
  }
  $$('[data-sugg]').forEach(b => b.onclick = () => { const t = $('#chatText'); if (!t) return; t.value = b.dataset.sugg; t.dispatchEvent(new Event('input')); t.focus(); });
  bindThreadRows();
  const back = $('[data-thread-close]'); if (back) back.onclick = closeThread;
  const done = $('[data-thread-done]');
  if (done) done.onclick = async () => {
    done.disabled = true;
    const { error } = await sb.rpc('set_thread_handled', { p_thread: M.open, p_handled: true });
    if (error) { done.disabled = false; return fail(error, 'No se pudo marcar la conversación.'); }
    await refreshStaffMessages(); render(); toast('Conversación marcada como resuelta.');
  };
  bindDrafts();
  const nf = $('#msgNew');
  if (nf) nf.onsubmit = async e => {
    e.preventDefault();
    const { data, error } = await sb.rpc('open_thread', { p_student: $('#msgNewStudent').value });
    if (error) return fail(error, 'No se pudo abrir la conversación.');
    await refreshStaffMessages(); openThread(data);
  };
  scrollLog();
  markMineRead();
}
// While « Mensajes » is open: new messages every 20 s (only when the tab is visible).
let msgPoll = 0;
function pollMessages(id) {
  clearInterval(msgPoll);
  if (id !== 'mensajes') return;
  msgPoll = setInterval(async () => {
    if (document.hidden || M.busy || M.editing || currentView() !== 'mensajes') return;
    if (teacherMode()) {
      const before = JSON.stringify([A.staff.threads, M.messages]);
      await refreshStaffMessages();
      if (JSON.stringify([A.staff.threads, M.messages]) !== before && currentView() === 'mensajes') paintChat();
    } else {
      const before = JSON.stringify(M.thread);
      await loadMyThread();
      if (JSON.stringify(M.thread) !== before && currentView() === 'mensajes') { paintChat(); markMineRead(); }
    }
  }, 20000);
}

function bindView(id) {
  bindSchedule(id);
  if (id === 'mensajes') bindMessages();
  pollMessages(id);
  if (id === 'contenido') bindEditor();
  if (id === 'prospectos') bindCrm();
  {
    const inf = $('#invForm');
    if (inf && $('#invEmail')) {
      let last = '';
      const lookup = async () => {
        const email = $('#invEmail').value.trim().toLowerCase();
        if (email === last) return; last = email;
        const note = $('#invTest');
        if (!/^\S+@\S+\.\S+$/.test(email)) { note.hidden = true; return; }
        const { data, error } = await sb.rpc('placement_for_email', { p_email: email });
        if (error || $('#invEmail').value.trim().toLowerCase() !== email) return;
        if (data && data.level) {
          $('#invLevel').value = data.level;
          note.innerHTML = `${icon('check')} Test de nivel del ${esc(fmtDate(new Date(data.created_at), { day: 'numeric', month: 'short', year: 'numeric' }))}: <b>${esc(data.level)}</b>${data.overall != null ? ` (${data.overall}/100)` : ''}. Nivel completado.`;
        } else note.textContent = 'Este correo no hizo el test de nivel del sitio: elige el nivel a mano.';
        note.hidden = false;
      };
      $('#invEmail').addEventListener('input', () => { clearTimeout(inf._t); inf._t = setTimeout(lookup, 450); });
      $('#invEmail').addEventListener('blur', lookup);
      // «Invitar al Campus» from a prospect (db/023_crm.sql): the form arrives filled in.
      const pre = A.staff.invitePrefill;
      if (pre && !pre.shown) {
        pre.shown = true;
        $('#invEmail').value = pre.email; $('#invName').value = pre.name;
        if (pre.level && $('#invLevel')) $('#invLevel').value = pre.level;
        if ($('#invRole')) $('#invRole').value = 'student';
        if (pre.email) $('#invEmail').dispatchEvent(new Event('input', { bubbles: true }));
        setTimeout(() => { inf.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); (pre.email ? $('#invName') : $('#invEmail')).focus({ preventScroll: true }); }, 60);
        toast(`Invitación preparada para ${pre.name || pre.email}: revisa el nivel y el profesor, y envíala.`);
      }
    }
    if (inf) inf.onsubmit = async e => {
      e.preventDefault();
      const email = $('#invEmail').value.trim().toLowerCase(), name = $('#invName').value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) return toast('Escribe un correo válido.');
      if (!name) return toast('Escribe el nombre del alumno.');
      const btn = inf.querySelector('button[type=submit]'); btn.disabled = true;
      const role = $('#invRole') ? $('#invRole').value : 'student';
      // The prospect gets this email first, so the invitation is linked to it (db/023_crm.sql).
      const pre = A.staff.invitePrefill;
      if (pre && role === 'student' && email !== pre.email && isAdmin()) await sb.rpc('crm_update_prospect', { p_id: pre.prospect, p: { email } });
      const { data, error } = await sb.rpc('create_invitation', { p_email: email, p_full_name: name, p_level: $('#invLevel').value, p_teacher: $('#invTeacher') ? $('#invTeacher').value : null, p_role: role });
      if (error) { btn.disabled = false; return fail(error, 'No se pudo preparar la invitación.'); }
      A.staff.invitePrefill = null;
      if (data && data.existing_account) toast(`${name} ya tenía cuenta: su perfil quedó actualizado.`);
      else {
        const sent = await sendInvite(email);
        toast(sent.ok ? `Invitación enviada a ${email}.` : 'Invitación guardada, pero el correo no salió. Revisa el envío de correos de Supabase o usa «Reenviar».');
      }
      await refresh(); render();
    };
    $$('[data-enr-open]').forEach(b => b.onclick = () => { A.staff.enrOpen = A.staff.enrOpen === b.dataset.enrOpen ? null : b.dataset.enrOpen; render(); });
    $$('[data-enr-all]').forEach(b => b.onclick = () => { A.staff.enrAll = !A.staff.enrAll; render(); });
    $$('[data-enr-done]').forEach(b => b.onclick = async () => {
      b.disabled = true;
      const on = b.dataset.on === '1';
      const { error } = await sb.rpc('set_enrollment_handled', { p_id: b.dataset.enrDone, p_handled: on });
      if (error) { b.disabled = false; return fail(error, 'No se pudo actualizar la solicitud.'); }
      toast(on ? 'Solicitud marcada como atendida.' : 'Solicitud reabierta.'); await refresh(); render();
    });
    $$('[data-enr-invite]').forEach(b => b.onclick = () => {
      const r = (A.staff.enrollments || []).find(x => x.id === b.dataset.enrInvite);
      if (!r || !$('#invForm')) return;
      $('#invEmail').value = r.email;
      $('#invName').value = r.name;
      if (r.level && $('#invLevel')) $('#invLevel').value = r.level;
      if ($('#invRole')) $('#invRole').value = 'student';
      $('#invEmail').dispatchEvent(new Event('input', { bubbles: true }));
      $('#invForm').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      $('#invName').focus({ preventScroll: true });
      toast(`Invitación preparada para ${r.name}: revisa el nivel y el profesor, y envíala.`);
    });
    $$('[data-resend]').forEach(b => b.onclick = async () => {
      b.disabled = true;
      const sent = await sendInvite(b.dataset.resend);
      b.disabled = false;
      toast(sent.ok ? (sent.status === 'already_registered' ? 'Esta persona ya tiene cuenta: puede entrar con su correo.' : `Invitación reenviada a ${b.dataset.resend}.`) : 'El correo no salió. Revisa el envío de correos de Supabase.');
    });
    $$('[data-member-edit]').forEach(b => b.onclick = () => { A.staff.editing = b.dataset.memberEdit; A.staff.confirmDel = null; render(); $('#mName')?.focus(); });
    $$('[data-member-ask]').forEach(b => b.onclick = () => { A.staff.confirmDel = b.dataset.memberAsk; A.staff.editing = null; render(); });
    $$('[data-member-cancel]').forEach(b => b.onclick = () => { A.staff.editing = null; A.staff.confirmDel = null; render(); });
    $$('[data-member-delete]').forEach(b => b.onclick = async () => {
      b.disabled = true;
      const m = (A.staff.members || []).find(x => x.id === b.dataset.memberDelete);
      const { error } = await sb.rpc('admin_delete_member', { p_user: b.dataset.memberDelete });
      A.staff.confirmDel = null;
      if (error) { b.disabled = false; return fail(error, 'No se pudo eliminar la cuenta.'); }
      toast(`Cuenta de ${m ? m.full_name : 'este miembro'} eliminada.`); await refresh(); render();
    });
    const mf = $('[data-member-form]');
    if (mf) {
      const syncTeacher = () => { const t = $('#mTeacher'), l = $('#mLevel'), student = $('#mRole').value === 'student'; t.disabled = !student; l.closest('.field').style.opacity = student ? '' : '.5'; };
      $('#mRole').onchange = syncTeacher; syncTeacher();
      mf.onsubmit = async e => {
        e.preventDefault();
        const name = $('#mName').value.trim();
        if (!name) return toast('Escribe un nombre.');
        const { error } = await sb.rpc('admin_update_member', { p_user: mf.dataset.memberForm, p_full_name: name, p_level: $('#mLevel').value, p_teacher: $('#mTeacher').value || null, p_role: $('#mRole').value });
        if (error) return fail(error, 'No se pudieron guardar los cambios.');
        if ($('#mPlan') && $('#mRole').value === 'student') {
          const r = await sb.rpc('set_student_plan', { p_user: mf.dataset.memberForm, p_plan: $('#mPlan').value || null, p_start: $('#mPlanStart').value || null });
          if (r.error) return fail(r.error, 'No se pudo guardar la fórmula.');
        }
        A.staff.editing = null; toast('Cambios guardados.'); await refresh(); render();
      };
    }
    $$('[data-cancel-member]').forEach(b => b.onclick = async () => {
      if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = 'Confirmar'; b.classList.add('btn-coral'); return; }
      b.disabled = true;
      const { error } = await sb.rpc('admin_delete_member', { p_user: b.dataset.cancelMember });
      if (error) { b.disabled = false; return fail(error, 'No se pudo cancelar la invitación.'); }
      toast(`Invitación de ${b.dataset.cancelName} cancelada.`); await refresh(); render();
    });
    $$('[data-cancel-inv]').forEach(b => b.onclick = async () => {
      const { error } = await sb.rpc('cancel_invitation', { p_email: b.dataset.cancelInv });
      if (error) return fail(error);
      toast('Invitación cancelada.'); await refresh(); render();
    });
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
  const ct = e.target.closest('[data-crm-today],[data-crm-goto]');
  if (ct) {
    if (ct.matches('[data-crm-today]')) { C.today = true; C.q = ''; C.origin = ''; C.owner = ''; }
    if (ct.matches('[data-crm-goto]')) { const id = ct.dataset.crmGoto; setTimeout(() => crmOpen(id), 80); }
    if (location.hash === '#prospectos') { e.preventDefault(); closeMenus(); render(); }
  }
  const t = e.target.closest('[data-start],[data-toast],[data-say],[data-rate],[data-seg],[data-cont],[data-cont-seg],[data-exam],[data-action],[data-preview],[data-publish],[data-mode],[data-hw-student],[data-edit-unit],[data-ed-back],[data-ed-open],[data-ed-new],[data-ed-close],[data-ed-ask],[data-ed-delete],[data-ed-move],#flash');
  if (!e.target.closest('.menu-wrap')) closeMenus();
  if (!t) return;
  if (t.matches('[data-mode]')) {
    A.mode = t.dataset.mode; try { localStorage.setItem('campus-mode', A.mode); } catch (err) { /* ignore */ }
    location.hash = navItems()[0].id; render(); return;
  }
  if (t.matches('[data-hw-student]')) {
    A.staff.hwPick = t.dataset.hwStudent;
    if (location.hash === '#tareas') render(); else location.hash = 'tareas';
    setTimeout(() => $('#hwUnit')?.focus(), 50);
    return;
  }
  if (t.matches('[data-say]')) { e.stopPropagation(); if (!speak(t.dataset.say, .9, t)) toast('Este navegador no tiene voz francesa.'); return; }
  if (t.matches('[data-start]')) { closeMenus(); return startLesson(t.dataset.start, false); }
  if (t.matches('[data-preview]')) return startLesson(t.dataset.preview, true);
  if (t.matches('[data-edit-unit]')) { A.ed.open = null; window.scrollTo({ top: 0 }); return loadEditor(t.dataset.editUnit); }
  if (t.matches('[data-ed-back]')) { A.ed.unit = null; A.ed.open = null; render(); window.scrollTo({ top: 0 }); return; }
  if (t.matches('[data-ed-open]')) { A.ed.open = t.dataset.edOpen; A.ed.confirm = null; return render(); }
  if (t.matches('[data-ed-new]')) { A.ed.open = 'new:' + t.dataset.edNew; A.ed.confirm = null; return render(); }
  if (t.matches('[data-ed-close]')) { A.ed.open = null; A.ed.confirm = null; return render(); }
  if (t.matches('[data-ed-ask]')) { A.ed.confirm = t.dataset.edAsk; A.ed.open = null; return render(); }
  if (t.matches('[data-ed-delete]')) {
    t.disabled = true;
    const { error } = await sb.rpc('delete_exercise', { p_id: t.dataset.edDelete });
    if (error) { t.disabled = false; return fail(error); }
    toast('Ejercicio eliminado.'); await refresh(); return loadEditor(A.ed.unit);
  }
  if (t.matches('[data-ed-move]')) {
    if (A.ed.busy) return; A.ed.busy = true;
    const { error } = await sb.rpc('move_exercise', { p_id: t.dataset.edMove, p_dir: +t.dataset.dir });
    A.ed.busy = false;
    if (error) return fail(error);
    return loadEditor(A.ed.unit);
  }
  if (t.matches('[data-toast]')) return toast(t.dataset.toast);
  if (t.matches('[data-seg]')) { A.seg = +t.dataset.seg; render(); return; }
  if (t.matches('[data-cont]')) { A.contTab = t.dataset.cont; render(); return; }
  if (t.matches('[data-cont-seg]')) { A.contSeg = t.dataset.contSeg; render(); return; }
  if (t.matches('[data-exam]')) { A.simExam = t.dataset.exam; render(); return; }
  if (t.matches('[data-rate]')) return rate(+t.dataset.rate);
  if (t.id === 'flash') return flip();
  if (t.matches('[data-publish]')) {
    t.disabled = true;
    const { error } = await sb.rpc('set_unit_status', { p_unit: t.dataset.publish, p_status: t.dataset.status });
    if (error) { t.disabled = false; return fail(error); }
    toast(t.dataset.status === 'validated' ? 'Unidad publicada: los alumnos ya pueden hacerla.' : 'Unidad devuelta a borrador.');
    await refresh(); if (A.ed.unit) return loadEditor(A.ed.unit); render(); return;
  }
  const a = t.dataset.action;
  if (a === 'menu') { e.stopPropagation(); toggleMenu(); return; }
  if (a === 'bell') { e.stopPropagation(); toggleBell(); return; }
  if (a === 'logout') { await sb.auth.signOut(); return; }
  if (a === 'plan') { $('#menuSlot').innerHTML = ''; return openOnboarding(false); }
});
document.addEventListener('input', e => { if (e.target.id === 'campusSearch') runSearch(e.target.value); });
document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (!$('#lesson').hidden) return lessonKeys(e, tag);
  if (!$('#ob').hidden || !$('#contract').hidden) return;
  if (crmOverlayOpen()) { if (e.key === 'Escape') { e.preventDefault(); crmClose(); } return; }
  if (e.key === 'Escape' && (document.querySelector('#bellSlot .menu, #menuSlot .menu, #searchSlot .menu'))) { closeMenus(); return; }
  if (e.key === 'Escape' && currentView() === 'mensajes' && teacherMode() && M.open) { e.preventDefault(); closeThread(); return; }
  if (e.key === 'Escape') closeMenus();
  if (e.key === 'Enter' && e.target.id === 'campusSearch') { const first = $('#searchSlot [data-start]'); if (first) first.click(); }
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
  { id: 'examen', c: 'sky', word: 'TCF · TEF', st: [['TCF Canada', 'recomendado'], ['TEF Canada', '4 pruebas']], key: 'exam', title: '¿Qué examen vas a presentar?', sub: 'IRCC acepta el TCF Canada y el TEF Canada; el TEFAQ sirve para los programas de Quebec. Tus simulacros seguirán el formato que elijas, y puedes cambiarlo después.',
    opts: [{ v: 'tcf', t: 'TCF Canada', d: 'El que recomendamos · simulacros con el formato del TCF', ic: 'timer', rec: true }, { v: 'tef', t: 'TEF Canada', d: 'Simulacros con el formato del TEF', ic: 'timer' }, { v: 'ambos', t: 'Los dos', d: 'Simulacros de los dos formatos', ic: 'cards' }, { v: 'tefaq', t: 'TEFAQ', d: 'Para Quebec · simulacros con el formato del TEF', ic: 'target' }, { v: 'nose', t: 'Aún no lo sé', d: 'Lo decides con tu profesor', ic: 'users' }] },
  { id: 'fecha', c: 'butter', word: String(new Date().getFullYear() + 1), st: [['Fecha objetivo', 'aproximada']], key: 'target_month', title: '¿Cuándo quieres presentarlo?', sub: 'Una fecha aproximada basta para organizar tu ritmo.' },
  { id: 'nivel', c: 'mint', word: 'A2', st: [['Nivel de partida', 'según tu test']], key: 'level', title: 'Tu nivel de partida' },
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
  if (step.id === 'examen' && ob.p.exam === 'tefaq') return 'TEFAQ';
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
    const pt = A.placement;
    const why = pt ? `Según tu test de nivel del ${fmtDate(new Date(pt.created_at), { day: 'numeric', month: 'long' })}${pt.overall != null ? ` (${pt.overall}/100)` : ''}.` : (A.teacher ? `Según la evaluación de ${esc(firstName(A.teacher.full_name))}.` : 'Según tu evaluación inicial.');
    h = `<h1>${step.title}</h1><p class="sub">${why} Empiezas aquí: tus unidades y tu manual son los de este nivel.</p><div class="lvl-pick locked">${LEVELS.map(l => `<button type="button" aria-pressed="${ob.p.level === l}" ${ob.p.level === l ? 'aria-current="true"' : 'disabled'}>${l}<small>${{ A1: 'Principiante', A2: 'Elemental', B1: 'Intermedio', B2: 'Avanzado' }[l]}</small></button>`).join('')}</div>
      <p class="ob-link" style="text-decoration:none">¿Crees que no es tu nivel? Coméntalo con tu profesor en tu primera clase.</p>`;
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
  if (ob.first && contractRequired()) return openContract({ mode: 'sign', first: true });
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

/* ───────────── Contrato del alumno (db/015_contrato.sql) ───────────── */
// The student signs once the onboarding is done (or at the next login), then again whenever the
// text changes: the rules come from « Ajustes » and the attendance rules, so a change there is a
// new version. What is signed is the exact text below, kept with the signature as proof.
const CT = { mode: 'sign', strokes: [], drawing: false, keys: new Set(), name: '', busy: false, first: false, done: false };
const SIG_W = 600, SIG_H = 200;
async function sha256(t) {
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  catch (e) { return null; }
}
const contractOn = () => !!(A.contract && A.contract.contract && A.contract.contract.enabled);
function contractClauses() {
  const c = (A.contract && A.contract.contract) || {}, a = (A.contract && A.contract.attendance) || {};
  const open = minutesText(a.open_min ?? 60), absent = a.absent_after_min ?? 10, late = a.late_after_min;
  const max = c.max_absences ?? 3, lates = c.lates_per_absence ?? 3;
  const motives = (Array.isArray(c.motives) ? c.motives : []).map(m => String(m).trim()).filter(Boolean);
  const lateWhen = late ? `más de ${late} minutos después del inicio` : 'después de la hora de inicio';
  return [
    { title: 'Tu curso', text: 'Pathway Language Solutions («Pathway») te acompaña en tu curso de francés: clases particulares en vivo con tu profesor, en tu horario fijo, y práctica en el campus entre clases. Este compromiso fija las reglas de asistencia que aceptas al empezar.' },
    { key: true, title: 'Puntualidad y asistencia', text: `Entras a cada clase con el botón «Entrar a la clase» del campus, que se abre ${open} antes del inicio. Cuenta la hora de tu primer clic: si entras ${lateWhen}, es un retraso; si entras más de ${absent} minutos después del inicio, o si no entras, es una ausencia.` },
    { title: 'Retrasos', text: lates === 1 ? 'Cada retraso cuenta como una ausencia sin justificar.' : `Cada ${lates} retrasos cuentan como una ausencia sin justificar.` },
    { key: true, title: 'Avisar o justificar una ausencia', text: `Si sabes que no podrás venir, avisa desde el campus al menos 48 horas antes: tu hora se reprograma. Si no pudiste avisar, justifica tu ausencia desde el campus en las 72 horas siguientes al inicio de la clase, con un comprobante.${motives.length ? ` Los únicos motivos válidos son: ${motives.join('; ')}.` : ''} Una ausencia justificada se recupera en otra clase.` },
    { key: true, title: 'Ausencias sin justificar', text: 'Una ausencia que no se avisa ni se justifica a tiempo es una hora perdida: no se recupera ni se reembolsa. Después de cada una, recibes un correo.' },
    { key: true, title: 'Fórmula mensual', text: `Un mes son 4 semanas desde tu fecha de inicio. ${max === 1 ? 'Con una ausencia sin justificar' : `Con ${max} ausencias sin justificar en las mismas 4 semanas`}, tu mes no se valida: no pasas al nivel siguiente y, para seguir, pagas de nuevo el mes y rehaces todas sus horas, aunque hayas tenido buena nota.` },
    { key: true, title: 'Ciclo completo', text: 'Si te inscribiste por un ciclo completo, pagaste una tarifa reducida a cambio de tu compromiso de asistir a clase durante todo el ciclo. No es reembolsable: las horas perdidas no se recuperan, y no hay reembolso si al final del ciclo no alcanzas el nivel.' },
    { title: 'Clases movidas o canceladas', text: 'Una clase que Pathway mueve o cancela nunca cuenta como ausencia.' },
    { title: 'Trabajo personal', text: 'Los ejercicios y los exámenes del campus son personales: no compartes tu cuenta ni tus respuestas. El campus registra si sales de la pestaña durante una unidad, y tu profesor lo ve.' },
    { title: 'Grabaciones y documentos', text: 'Las clases grabadas y los documentos del programa son para tu uso personal: no se comparten ni se publican.' },
    { title: 'Firma electrónica', text: 'Firmas este compromiso de forma electrónica. Pathway guarda el texto firmado, tu firma, la fecha y los datos técnicos de la conexión. Puedes volver a leerlo cuando quieras en «Mi curso».' }
  ];
}
const CT_HEAD = 'COMPROMISO DEL ALUMNO · PATHWAY LANGUAGE SOLUTIONS';
const contractBody = () => [CT_HEAD, ...contractClauses().map((c, i) => `${i + 1}. ${c.title}\n${c.text}`)].join('\n\n');
const parseBody = body => String(body || '').split('\n\n').slice(1).map(p => { const [t, ...rest] = p.split('\n'); return { title: t.replace(/^\d+\.\s*/, ''), text: rest.join(' ') }; });
// Signed for the current text?
const contractSignedNow = () => !!(A.contract && A.contract.signed && A.contract.signed.body === contractBody());
const contractRequired = () => !!(A.profile && A.profile.role === 'student' && contractOn() && !contractSignedNow());
async function loadContract() {
  const r = await sb.rpc('contract_status');
  A.contract = r.error ? null : (r.data || null); // needs db/015_contrato.sql
  A.contractHash = A.contract ? await sha256(contractBody()) : null;
}

const sigPath = () => CT.strokes.map(s => (s.length === 1 ? [s[0], [s[0][0] + 0.5, s[0][1]]] : s).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')).join('');
const sigSvg = d => /^[MLQ0-9 .,-]+$/.test(d || '') ? `<svg class="sig" viewBox="0 0 ${SIG_W} ${SIG_H}" role="img" aria-label="Firma"><path d="${d}"/></svg>` : '';
const inkOk = () => { const pts = CT.strokes.flat(); if (pts.length < 12) return false; const xs = pts.map(p => p[0]); return Math.max(...xs) - Math.min(...xs) > 60; };
const longDate = d => fmtDate(new Date(d), { day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = d => fmtDate(new Date(d), { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
function stampSvg(at) {
  const d = new Date(at || Date.now());
  return `<svg class="stamp" viewBox="0 0 200 200" role="img" aria-label="Sello: compromiso firmado">
    <defs><path id="stampRing" d="M100,100 m-73,0 a73,73 0 1,1 146,0 a73,73 0 1,1 -146,0"/>
      <filter id="stampInk" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.2"/></filter></defs>
    <g filter="url(#stampInk)">
      <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" stroke-width="5"/>
      <circle cx="100" cy="100" r="86" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <circle cx="100" cy="100" r="61" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <text font-size="12.5" font-weight="700" fill="currentColor"><textPath href="#stampRing" startOffset="4" textLength="438" lengthAdjust="spacing">PATHWAY LANGUAGE SOLUTIONS • COMPROMISO •</textPath></text>
      <text x="100" y="101" text-anchor="middle" font-size="25" font-weight="800" fill="currentColor" letter-spacing="1.5">FIRMADO</text>
      <text x="100" y="124" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor" letter-spacing="1.5">${pad2(d.getDate())} · ${pad2(d.getMonth() + 1)} · ${d.getFullYear()}</text>
    </g></svg>`;
}

// mode: 'sign' (the student), 'preview' (staff, nothing saved), 'view' (a signed copy).
function openContract(opts) {
  Object.assign(CT, { mode: opts.mode, first: !!opts.first, doc: opts.doc || null, who: opts.who || { name: A.profile.full_name, email: A.session.user.email, level: A.profile.level }, strokes: [], keys: new Set(), name: '', busy: false, done: false });
  $('#app').hidden = true; $('#tabbar').hidden = true; closeMenus();
  const el = $('#contract');
  el.hidden = false; document.body.classList.add('no-scroll');
  renderContract();
  el.scrollTop = 0;
}
function closeContract() { $('#contract').hidden = true; $('#contract').innerHTML = ''; document.body.classList.remove('no-scroll'); }
function renderContract() {
  const sign = CT.mode !== 'view', who = CT.who;
  const clauses = sign ? contractClauses() : parseBody(CT.doc.body);
  const keyIdx = clauses.map((c, i) => c.key ? i : -1).filter(i => i >= 0);
  const renewing = CT.mode === 'sign' && A.contract && A.contract.signed;
  const label = CT.mode === 'preview' ? 'Vista previa · no se guarda nada' : CT.mode === 'view' ? 'Copia firmada' : renewing ? 'Nueva versión' : 'Último paso';
  const when = shortDate(sign ? Date.now() : CT.doc.signed_at);
  $('#contract').innerHTML = `<div class="ct-top"><span class="ob-logo"><span class="logo-mark"><svg class="icon"><use href="#i-route"/></svg></span>Pathway</span>
      <span class="ct-step">${label}</span>
      ${CT.mode === 'sign' ? '' : `<button type="button" class="round ct-close" data-ct="close" aria-label="Cerrar">${icon('x')}</button>`}</div>
    <div class="ct-stage">
      ${CT.mode === 'sign' ? `<div class="ct-intro"><h1>${renewing ? 'Tu compromiso cambió' : 'Tu compromiso con Pathway'}</h1><p>${renewing ? 'Las reglas de tu curso se actualizaron. Léelas y firma la nueva versión para seguir.' : 'Antes de empezar, lee las reglas de tu curso. Marca las reglas clave y firma con el dedo o el ratón.'}</p></div>` : ''}
      <div class="paper-wrap" id="ctWrap">
        <article class="paper" id="ctPaper">
          <header class="pp-head"><p class="pp-org">Pathway Language Solutions</p><h2 class="pp-title">Compromiso del alumno</h2>
            <dl class="pp-meta"><div><dt>Alumno</dt><dd>${esc(who.name || '—')}</dd></div><div><dt>Nivel</dt><dd>${esc(who.level || '—')}</dd></div><div><dt>Correo</dt><dd>${esc(who.email || '—')}</dd></div></dl></header>
          <ol class="pp-clauses">${clauses.map((c, i) => `<li class="${c.key ? 'key' : ''}"><h3><span class="pp-n">${i + 1}</span>${esc(c.title)}</h3><p>${esc(c.text)}</p>
            ${sign && c.key ? `<label class="pp-ack" for="ctAck${i}"><input type="checkbox" id="ctAck${i}" data-ack="${i}"><span>Lo entiendo y lo acepto</span></label>` : ''}</li>`).join('')}</ol>
          <section class="pp-sign" aria-label="Firma">
            <div class="pp-field"><span class="pp-label">Fecha</span><span class="pp-value">${esc(when)}</span></div>
            <div class="pp-field pp-sigbox"><span class="pp-label">Firma del alumno</span>
              ${sign ? `<div class="pad" id="ctPadBox"><canvas id="ctPad" aria-label="Firma aquí con el dedo o el ratón"></canvas><span class="pad-x" aria-hidden="true">×</span><span class="pad-hint" id="ctHint">Firma aquí</span><button type="button" class="pad-clear" data-ct="clear">Borrar</button></div>
                <label class="pp-name" for="ctName"><span class="pp-label">Nombre completo</span><input id="ctName" autocomplete="name" maxlength="120" placeholder="${esc(who.name || 'Tu nombre y apellido')}"></label>`
                : `<div class="pad done">${sigSvg(CT.doc.signature)}<span class="pad-x" aria-hidden="true">×</span></div><p class="pp-signed">${esc(CT.doc.signed_name)}</p>`}
            </div>
            <div class="stamp-slot" id="ctStamp">${CT.mode === 'view' ? stampSvg(CT.doc.signed_at) : ''}</div>
          </section>
          ${CT.mode === 'view' ? `<p class="pp-proof">Firmado electrónicamente el ${esc(fmtDate(new Date(CT.doc.signed_at), { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }))}${CT.doc.ip ? ` · IP ${esc(CT.doc.ip)}` : ''}${CT.doc.user_agent ? ` · ${esc(CT.doc.user_agent)}` : ''}</p>` : ''}
        </article>
        <span class="fold fold-tr" aria-hidden="true"></span><span class="fold fold-bl" aria-hidden="true"></span>
      </div>
    </div>
    ${sign ? `<div class="ct-foot" id="ctFoot"><p class="ct-need" id="ctNeed" aria-live="polite"></p><button type="button" class="btn btn-coral" id="ctSign" disabled>${icon('pen')}Firmar el compromiso</button></div>` : ''}`;
  CT.keyIdx = keyIdx;
  if (sign) { setupPad(); $('#ctName').oninput = e => { CT.name = e.target.value; updateContract(); }; $('#ctSign').onclick = signContract; updateContract(); }
}
function updateContract() {
  const missing = CT.keyIdx.filter(i => !CT.keys.has(i)).length, named = CT.name.trim().length >= 3, inked = inkOk();
  const need = [];
  if (missing) need.push(`marcar ${missing === 1 ? '1 regla clave' : `${missing} reglas clave`}`);
  if (!named) need.push('escribir tu nombre');
  if (!inked) need.push('firmar');
  const n = $('#ctNeed'); if (n) n.textContent = need.length ? `Falta ${need.join(', ')}.` : 'Todo listo.';
  const b = $('#ctSign'); if (b && !CT.busy && !CT.done) b.disabled = need.length > 0;
  const h = $('#ctHint'); if (h) h.hidden = CT.strokes.length > 0;
}
function setupPad() {
  const cv = $('#ctPad'); if (!cv) return;
  const ctx = cv.getContext('2d');
  const draw = () => {
    const r = cv.getBoundingClientRect(), sx = r.width / SIG_W, sy = r.height / SIG_H;
    ctx.clearRect(0, 0, r.width, r.height);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1d2b53'; ctx.lineWidth = 2.6;
    for (const s of CT.strokes) {
      ctx.beginPath(); ctx.moveTo(s[0][0] * sx, s[0][1] * sy);
      if (s.length === 1) ctx.lineTo(s[0][0] * sx + 0.5, s[0][1] * sy);
      for (let i = 1; i < s.length - 1; i++) { const mx = (s[i][0] + s[i + 1][0]) / 2, my = (s[i][1] + s[i + 1][1]) / 2; ctx.quadraticCurveTo(s[i][0] * sx, s[i][1] * sy, mx * sx, my * sy); }
      if (s.length > 1) ctx.lineTo(s[s.length - 1][0] * sx, s[s.length - 1][1] * sy);
      ctx.stroke();
    }
  };
  const fit = () => { const r = cv.getBoundingClientRect(), d = window.devicePixelRatio || 1; cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); ctx.setTransform(d, 0, 0, d, 0, 0); draw(); };
  const pt = e => { const r = cv.getBoundingClientRect(); return [Math.max(0, Math.min(SIG_W, (e.clientX - r.left) / r.width * SIG_W)), Math.max(0, Math.min(SIG_H, (e.clientY - r.top) / r.height * SIG_H))]; };
  cv.onpointerdown = e => { if (CT.done) return; e.preventDefault(); cv.setPointerCapture(e.pointerId); CT.drawing = true; CT.strokes.push([pt(e)]); draw(); updateContract(); };
  cv.onpointermove = e => {
    if (!CT.drawing) return;
    const s = CT.strokes[CT.strokes.length - 1];
    for (const ev of (e.getCoalescedEvents ? e.getCoalescedEvents() : [e])) s.push(pt(ev));
    if (s.length > 1500) s.splice(1, s.length - 1500);
    draw();
  };
  cv.onpointerup = cv.onpointercancel = () => { if (CT.drawing) { CT.drawing = false; updateContract(); } };
  CT.redraw = draw;
  fit();
  if (window.ResizeObserver) new ResizeObserver(fit).observe(cv);
}
async function signContract() {
  if (CT.busy || CT.done) return;
  CT.busy = true;
  const btn = $('#ctSign'); btn.disabled = true; btn.innerHTML = 'Firmando…';
  if (CT.mode === 'sign') {
    const { error } = await sb.rpc('sign_contract', { p_body: contractBody(), p_name: CT.name.trim(), p_signature: sigPath() });
    if (error) { CT.busy = false; btn.innerHTML = `${icon('pen')}Firmar el compromiso`; updateContract(); return fail(error, 'No se pudo guardar tu firma. Inténtalo de nuevo.'); }
    await loadContract();
  }
  CT.busy = false; CT.done = true;
  $('#ctPaper').classList.add('signed');
  $$('#contract [data-ack], #ctName').forEach(x => { x.disabled = true; });
  const slot = $('#ctStamp'); slot.innerHTML = `<span class="stamp-shadow"></span>${stampSvg()}<span class="stamp-ink"></span>`;
  slot.classList.add('drop');
  setTimeout(() => $('#ctWrap')?.classList.add('thud'), reduced ? 0 : 430);
  setTimeout(() => {
    const f = $('#ctFoot'); if (!f) return;
    f.classList.add('done');
    f.innerHTML = `<p class="ct-ok">${icon('check')}<span><b>${CT.mode === 'preview' ? 'Así lo verá el alumno' : 'Compromiso firmado'}</b>${CT.mode === 'preview' ? 'No se guardó nada.' : 'Puedes releerlo cuando quieras en «Mi curso».'}</span></p>
      <button type="button" class="btn ct-enter" data-ct="enter">${CT.mode === 'preview' ? 'Volver a Ajustes' : 'Entrar al campus'}${icon('arrow')}</button>`;
    f.querySelector('[data-ct="enter"]').focus();
  }, reduced ? 200 : 1350);
}
$('#contract').addEventListener('click', e => {
  const b = e.target.closest('[data-ct],[data-ack]'); if (!b) return;
  if (b.matches('[data-ack]')) { const i = +b.dataset.ack; if (b.checked) CT.keys.add(i); else CT.keys.delete(i); return updateContract(); }
  const act = b.dataset.ct;
  if (act === 'clear') { CT.strokes = []; CT.redraw && CT.redraw(); return updateContract(); }
  if (act === 'close') { closeContract(); return showApp(); }
  if (act === 'enter') {
    const first = CT.first, preview = CT.mode === 'preview';
    closeContract();
    if (first) { location.hash = 'inicio'; showApp(); confetti(); toast(`Bienvenido al campus, ${firstName(A.profile.full_name)}.`); }
    else { showApp(); if (!preview) toast('Compromiso firmado.'); }
  }
});
async function viewStudentContract(id) {
  const { data, error } = await sb.rpc('staff_contract', { p_student: id });
  if (error || !data) return fail(error, 'No se pudo abrir el contrato.');
  const s = A.staff.overview.find(x => x.id === id) || {}, m = (A.staff.members || []).find(x => x.id === id) || {};
  openContract({ mode: 'view', doc: data, who: { name: s.full_name || m.full_name, email: m.email || '', level: s.level || m.level } });
}
// Staff: where each student stands with the current text.
function contractState(id) {
  const c = A.staff.contracts && A.staff.contracts[id];
  if (!c) return 'none';
  return c.body_sha256 === A.contractHash ? 'ok' : 'old';
}
function contractCell(s) {
  const st = contractState(s.id);
  if (st === 'ok') return `<button type="button" class="status link" data-ct-view="${s.id}">Firmado</button>`;
  if (st === 'old') return `<button type="button" class="status warn link" data-ct-view="${s.id}">Versión anterior</button>`;
  return contractOn() ? '<span class="status warn">Pendiente</span>' : '<span class="faint">—</span>';
}
function contractTile() {
  const st = A.staff.settings, c = (A.contract && A.contract.contract) || (st && st.contract);
  if (!c || A.profile.role !== 'admin' || A.staff.contracts == null) return '';
  const ov = A.staff.overview, signed = ov.filter(s => contractState(s.id) === 'ok').length;
  return `<article class="tile c-6"><div class="tile-head"><h2>Contrato del alumno</h2><span class="pill ghost">${c.enabled ? 'Activo' : 'Desactivado'}</span></div>
    <form id="ctForm" class="form">
      <label class="check-row" for="ctOn"><input id="ctOn" type="checkbox" ${c.enabled ? 'checked' : ''}>Pedir la firma al terminar la bienvenida (los alumnos ya inscritos firman en su próxima conexión)</label>
      <div class="form-2"><label class="field" for="ctMax">Ausencias sin justificar que invalidan el mes<input id="ctMax" type="number" min="1" max="20" value="${c.max_absences ?? 3}"></label>
        <label class="field" for="ctLates">Retrasos que valen una ausencia<input id="ctLates" type="number" min="1" max="20" value="${c.lates_per_absence ?? 3}"></label></div>
      ${'motives' in c ? `<label class="field" for="ctMotives">Motivos de ausencia justificada (uno por línea)<textarea id="ctMotives" rows="4" maxlength="1200">${esc((c.motives || []).join('\n'))}</textarea></label>` : ''}
      <p class="muted" style="font-size:13px">El contrato también cita las reglas de asistencia (apertura del enlace, retraso, ausencia). Si cambias una regla, cada alumno firma la nueva versión en su próxima conexión.</p>
      <p style="font-weight:600;font-size:14px">${signed} de ${ov.length} alumno${ov.length === 1 ? '' : 's'} firmaron la versión actual.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-dark" type="submit">Guardar</button><button class="btn btn-light" type="button" data-ct-preview>Ver el contrato</button></div>
    </form></article>`;
}

/* ───────────── Lector del programa (db/020_manual.sql) ───────────── */
// Documents are read inside the Campus (no download button). For a manual, the first page of
// each unit is found when it is uploaded; with « Apertura de las unidades » on, the student only
// sees the pages of the units seen in class, plus the opening pages of the book.
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
let pdfjsReady = null;
function loadPdfjs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (!pdfjsReady) pdfjsReady = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PDFJS + 'pdf.min.js';
    s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; resolve(window.pdfjsLib); };
    s.onerror = () => { pdfjsReady = null; reject(new Error('No se pudo cargar el lector.')); };
    document.head.appendChild(s);
  });
  return pdfjsReady;
}
// « SEGMENT A · UNITÉ 1 » opens each unit of the Pathway manuals (letter-spaced in the PDF:
// « S E G M E N T A · U N I T É 1 »), so the spaces are removed before matching.
const UNIT_RE = /SEGMENT[A-D][·•.\-–]UNIT[ÉE](\d{1,2})(?!\d)/i;
const unitOnPage = items => {
  for (const it of items) { const m = String(it.str || '').replace(/\s+/g, '').match(UNIT_RE); if (m) return +m[1]; }
  return null;
};
async function scanUnits(pdf, onProgress) {
  const starts = Array(64).fill(null);
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const n = unitOnPage(tc.items);
    if (n && n >= 1 && n <= 64 && !starts[n - 1]) starts[n - 1] = i;
    page.cleanup();
    if (onProgress && (i % 8 === 0 || i === pdf.numPages)) onProgress(i, pdf.numPages);
  }
  return starts.filter(Boolean).length >= 4 ? starts : null;
}
async function scanDocument(doc, source, label) {
  const lib = await loadPdfjs();
  const pdf = await lib.getDocument(source).promise;
  const starts = await scanUnits(pdf, (i, n) => { if (label) label.textContent = `Analizando… ${i} / ${n}`; });
  const { error } = await sb.rpc('set_document_pages', { p_id: doc.id, p_unit_pages: starts, p_page_count: pdf.numPages });
  pdf.destroy();
  if (error) throw error;
  return starts ? starts.filter(Boolean).length : 0;
}
// Unit numbers the student may read (null = everything).
function manualOpenNums(doc) {
  if (isStaff() || !A.gate || !doc.unit_pages) return null;
  const set = new Set(A.taughtNums || []);
  for (const u of A.units) {
    if (u.level !== doc.level || u.is_final) continue;
    if ((A.taught && A.taught.has(u.id)) || A.runs.some(r => r.unit_id === u.id && runPassed(r)) || A.assignments.some(a => a.unit_id === u.id)) set.add(u.number);
  }
  return set;
}
const RD = { doc: null, pdf: null, io: null, token: 0 };
function closeReader() {
  RD.token++;
  if (RD.io) RD.io.disconnect();
  if (RD.pdf) RD.pdf.destroy();
  Object.assign(RD, { doc: null, pdf: null, io: null });
  $('#reader').hidden = true; $('#reader').innerHTML = '';
  document.body.classList.remove('no-scroll');
}
async function openReader(doc) {
  const token = ++RD.token;
  RD.doc = doc;
  const el = $('#reader');
  el.hidden = false; document.body.classList.add('no-scroll');
  el.innerHTML = `<div class="rd-top"><button type="button" class="round" data-rd="close" aria-label="Cerrar">${icon('x')}</button><div class="rd-title"><b>${esc(doc.title)}</b><span id="rdInfo">Abriendo…</span></div><label class="rd-jump" for="rdJump" hidden><span class="sr">Ir a</span><select id="rdJump"></select></label></div>
    <div class="rd-scroll" id="rdScroll"><div class="rd-pages" id="rdPages"><p class="rd-loading">Abriendo el documento…</p></div></div>`;
  try {
    const [lib, signed] = await Promise.all([loadPdfjs(), sb.storage.from('programa').createSignedUrl(doc.path, 3600)]);
    if (signed.error || !signed.data) throw signed.error || new Error('url');
    const pdf = await lib.getDocument({ url: signed.data.signedUrl, disableAutoFetch: true, disableStream: true }).promise;
    if (token !== RD.token) { pdf.destroy(); return; }
    RD.pdf = pdf;
    const first = await pdf.getPage(1), vp = first.getViewport({ scale: 1 });
    const ratio = vp.height / vp.width;
    const open = manualOpenNums(doc), total = pdf.numPages;
    // Ranges: opening pages, then each unit (open or locked).
    const starts = (doc.unit_pages || []).map((p, i) => ({ n: i + 1, p })).filter(x => x.p && x.p <= total).sort((a, b) => a.p - b.p);
    const blocks = [];
    if (!starts.length) blocks.push({ kind: 'pages', from: 1, to: total });
    else {
      if (starts[0].p > 1) blocks.push({ kind: 'pages', from: 1, to: starts[0].p - 1, label: 'Presentación' });
      starts.forEach((s, i) => {
        const to = i + 1 < starts.length ? starts[i + 1].p - 1 : total;
        const ok = !open || open.has(s.n);
        const last = blocks[blocks.length - 1];
        if (!ok && last && last.kind === 'locked') { last.toUnit = s.n; last.pages += to - s.p + 1; }
        else if (!ok) blocks.push({ kind: 'locked', fromUnit: s.n, toUnit: s.n, pages: to - s.p + 1 });
        else blocks.push({ kind: 'pages', from: s.p, to, unit: s.n });
      });
    }
    const title = n => { const u = A.units.find(x => x.level === doc.level && x.number === n && !x.is_final); return u ? ` · ${esc(u.title)}` : ''; };
    const readable = blocks.filter(b => b.kind === 'pages').reduce((a, b) => a + b.to - b.from + 1, 0);
    const openUnits = starts.length ? blocks.filter(b => b.unit).length : 0;
    $('#rdInfo').textContent = open ? `${openUnits} de ${starts.length} unidades abiertas · ${readable} de ${total} páginas` : `${total} páginas`;
    let html = '';
    for (const b of blocks) {
      if (b.kind === 'locked') {
        html += `<section class="rd-locked" id="rd-u${b.fromUnit}"><span class="rd-lock">${icon('lock')}</span><b>${b.fromUnit === b.toUnit ? `Unidad ${b.fromUnit}` : `Unidades ${b.fromUnit} a ${b.toUnit}`}</b><p>${b.pages} página${b.pages === 1 ? '' : 's'} · ${b.fromUnit === b.toUnit ? 'se abre cuando la veas' : 'se abren cuando las veas'} en clase con tu profesor.</p></section>`;
        continue;
      }
      if (b.unit) html += `<h2 class="rd-unit" id="rd-u${b.unit}">Unidad ${b.unit}${title(b.unit)}</h2>`;
      else if (b.label) html += `<h2 class="rd-unit" id="rd-intro">${b.label}</h2>`;
      for (let p = b.from; p <= b.to; p++) html += `<div class="rd-page" data-p="${p}" style="aspect-ratio:1/${ratio.toFixed(4)}"><span class="rd-pn">${p}</span></div>`;
    }
    $('#rdPages').innerHTML = html;
    const jump = blocks.filter(b => b.kind === 'pages' && (b.unit || b.label));
    if (jump.length > 1) {
      $('#rdJump').innerHTML = jump.map(b => `<option value="${b.unit ? 'rd-u' + b.unit : 'rd-intro'}">${b.unit ? `Unidad ${b.unit}` : b.label}</option>`).join('');
      $('#rdJump').closest('label').hidden = false;
      $('#rdJump').onchange = e => document.getElementById(e.target.value)?.scrollIntoView({ block: 'start' });
    }
    const draw = async box => {
      if (box.dataset.done) return; box.dataset.done = '1';
      try {
        const page = await pdf.getPage(+box.dataset.p);
        if (token !== RD.token) return;
        const w = box.clientWidth, d = Math.min(2, window.devicePixelRatio || 1);
        const v = page.getViewport({ scale: (w * d) / page.getViewport({ scale: 1 }).width });
        const c = document.createElement('canvas'); c.width = Math.round(v.width); c.height = Math.round(v.height);
        await page.render({ canvasContext: c.getContext('2d'), viewport: v }).promise;
        if (token !== RD.token) return;
        box.prepend(c); box.classList.add('ready'); page.cleanup();
      } catch (e) { box.dataset.done = ''; }
    };
    RD.io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) draw(en.target); }), { root: $('#rdScroll'), rootMargin: '900px 0px' });
    $$('#rdPages .rd-page').forEach(b => RD.io.observe(b));
  } catch (e) {
    if (token !== RD.token) return;
    console.error(e);
    $('#rdPages').innerHTML = '<p class="rd-loading">No se pudo abrir el documento. Revisa tu conexión e inténtalo de nuevo.</p>';
    $('#rdInfo').textContent = '';
  }
}
$('#reader').addEventListener('click', e => { if (e.target.closest('[data-rd="close"]')) { closeReader(); render(); } });
$('#reader').addEventListener('contextmenu', e => e.preventDefault());
$('#reader').addEventListener('dragstart', e => e.preventDefault());
document.addEventListener('keydown', e => {
  if ($('#reader').hidden) return;
  if (e.key === 'Escape') { closeReader(); render(); }
  if ((e.ctrlKey || e.metaKey) && /^[sp]$/i.test(e.key)) e.preventDefault();
});

/* ───────────── Lesson player ───────────── */
let L = null;
const lessonEl = $('#lesson'), body = $('#lessonBody'), foot = $('#lessonFoot'), footIn = $('#footIn');
const L_RESUME = new Set();
async function loadResumable() {
  if (isStaff() && teacherMode()) return;
  const { data } = await sb.from('lesson_progress').select('unit_id').eq('user_id', A.session.user.id);
  L_RESUME.clear(); (data || []).forEach(r => L_RESUME.add(r.unit_id));
}
function saveProgress() {
  if (!L || L.preview || L.finished) return;
  const state = { queue: L.queue.map(x => ({ id: x.id, retry: !!x.retry })), pos: L.pos, combo: L.combo, xp: L.xp, res: [...L.res.values()], elapsed: Date.now() - L.start, focusLost: L.focusLost || 0 };
  L_RESUME.add(L.unit.id);
  sb.rpc('save_lesson_progress', { p_unit: L.unit.id, p_state: state }).then(r => { if (r && r.error) console.error(r.error); });
}
async function startLesson(unitId, preview) {
  const unit = unitById(unitId); if (!unit) return;
  if (!preview) {
    const st = unitState(unit);
    if (st.retryAt) return toast(`Necesitas 75 % para pasar esta unidad. Nuevo intento: ${retryLabel(st.retryAt)}.`);
    if (!st.taught) return toast('Esta unidad se abre cuando la veas en clase con tu profesor.');
    if (!st.unlocked) return toast(`Supera antes la unidad ${st.prev ? st.prev.number : ''} con al menos 75 %.`);
  }
  let q = sb.from('exercises').select('id,type,kind,payload,position,status').eq('unit_id', unitId).order('position');
  if (!preview) q = q.eq('status', 'validated');
  const { data, error } = await q;
  if (error) return fail(error);
  if (!data.length) return toast('Esta unidad todavía no tiene ejercicios.');
  const items = data.map(x => ({ ...x.payload, id: x.id, type: x.type, kind: x.kind, retry: false }));
  L = { unit, preview, items, queue: items.slice(), pos: 0, combo: 0, xp: 0, res: new Map(), start: Date.now(), answer: null, checked: false };
  if (!preview) {
    const { data: saved } = await sb.from('lesson_progress').select('state').eq('user_id', A.session.user.id).eq('unit_id', unitId).limit(1);
    const st = saved && saved[0] && saved[0].state;
    const byId = Object.fromEntries(items.map(x => [x.id, x]));
    if (st && Array.isArray(st.queue) && st.queue.every(q => byId[q.id]) && st.pos > 0 && st.pos < st.queue.length) {
      L.queue = st.queue.map(q => ({ ...byId[q.id], retry: q.retry }));
      L.pos = st.pos; L.combo = st.combo || 0; L.xp = st.xp || 0; L.start = Date.now() - (st.elapsed || 0); L.focusLost = st.focusLost || 0;
      L.res = new Map((st.res || []).map(r => [r.exercise_id, r]));
      setTimeout(() => toast(`Retomamos donde lo dejaste: ejercicio ${L.pos + 1} de ${L.queue.length}.`), 300);
    }
  }
  lessonEl.hidden = false; document.body.classList.add('no-scroll');
  $('.preview-flag')?.remove(); lessonEl.classList.toggle('preview', !!preview);
  if (preview) document.body.insertAdjacentHTML('beforeend', '<span class="preview-flag">Vista previa · no se guarda nada</span>');
  renderEx();
  if (!preview) integrityNotice();
}

/* Integrity (db/010_integridad.sql): leaving the tab while a question is open is counted,
   shown to the student and kept with the finished lesson for the teacher. Leaving the unit
   to come back later stays allowed (the exit button saves the progress). */
const graded = () => L && !L.preview && !L.finished && !lessonEl.hidden;
function integrityNotice() {
  let seen = false; try { seen = localStorage.getItem('campus-integrity') === '1'; } catch (e) { /* ignore */ }
  if (seen) return;
  const box = document.createElement('div'); box.className = 'confirm';
  box.innerHTML = `<div class="tile"><h3 style="font-size:22px">Antes de empezar</h3><p class="muted">Esta unidad cuenta para abrir la siguiente. Responde sin salir de esta pestaña: si cambias de pestaña o de aplicación mientras una pregunta está abierta, queda registrado y tu profesor lo verá.</p><p class="muted" style="margin-top:8px">Puedes salir de la unidad con la ✕ cuando quieras: tu avance se guarda.</p><div class="acts"><button class="btn btn-dark btn-sm" id="intOk">Entendido</button></div></div>`;
  lessonEl.appendChild(box); $('#intOk', box).focus();
  $('#intOk', box).onclick = () => { box.remove(); try { localStorage.setItem('campus-integrity', '1'); } catch (e) { /* ignore */ } };
}
function goneAway() {
  if (!graded() || L.checked || L.awayAt) return;
  L.awayAt = Date.now(); lessonEl.classList.add('is-away');
}
function cameBack() {
  if (!L || !L.awayAt) return;
  const away = Date.now() - L.awayAt; L.awayAt = null; lessonEl.classList.remove('is-away');
  if (!graded() || away < 2000) return;
  L.focusLost = (L.focusLost || 0) + 1; saveProgress();
  $('.confirm.integrity', lessonEl)?.remove();
  const box = document.createElement('div'); box.className = 'confirm integrity';
  box.innerHTML = `<div class="tile"><h3 style="font-size:22px">Saliste de la lección</h3><p class="muted">Cambiaste de pestaña o de aplicación con una pregunta abierta. Queda registrado: ${L.focusLost} ${L.focusLost === 1 ? 'vez' : 'veces'} en esta unidad. Tu profesor lo verá con tu resultado.</p><div class="acts"><button class="btn btn-dark btn-sm" id="intBack">Seguir con la lección</button></div></div>`;
  lessonEl.appendChild(box); $('#intBack', box).focus(); $('#intBack', box).onclick = () => box.remove();
}
document.addEventListener('visibilitychange', () => (document.hidden ? goneAway() : cameBack()));
window.addEventListener('blur', goneAway);
window.addEventListener('focus', cameBack);
// Basic protection of the content: no copy, cut or context menu inside a lesson (answers can still be typed).
for (const type of ['copy', 'cut', 'contextmenu']) {
  lessonEl.addEventListener(type, e => { if (L && !L.preview && !e.target.closest('input, textarea')) e.preventDefault(); });
}
function closeLesson() {
  try { speechSynthesis.cancel(); } catch (e) { /* ignore */ }
  lessonEl.hidden = true; document.body.classList.remove('no-scroll'); $('.preview-flag')?.remove(); L = null; render();
}
$('#lessonClose').addEventListener('click', () => {
  if (!L || L.finished || L.preview) return closeLesson();
  const box = document.createElement('div'); box.className = 'confirm';
  box.innerHTML = `<div class="tile"><h3 style="font-size:22px">¿Salir de la lección?</h3><p class="muted">${L.preview ? 'Es una vista previa: no se guarda nada.' : 'Tu avance queda guardado: podrás continuar donde lo dejaste.'}</p><div class="acts"><button class="btn btn-light btn-sm" id="stay">Seguir</button><button class="btn btn-dark btn-sm" id="leave">Salir</button></div></div>`;
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
    footIn.innerHTML = nbsp(`<div class="fb" role="status"><span class="fb-ico">${icon(g ? 'check' : 'x')}</span><div><h3>${esc(d.title)}</h3>${!g && d.correct ? `<p class="correct">${esc(d.correct)}</p>` : ''}${d.explain ? `<p>${d.explain}</p>` : ''}</div></div>
      <button class="btn ${g ? 'btn-good' : 'btn-coral'}" id="nextBtn" type="button">Continuar</button>`);
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
  if (ex.type === 'choice') h = `${kind}<h2>${esc(ex.title)}</h2>${ex.fr ? `<div><p class="fr">${esc(ex.fr).replace('___', '<span class="blank"></span>')}</p>${ex.es ? `<p class="es" style="margin-top:8px">${esc(ex.es)}</p>` : ''}</div>` : ex.es ? `<p class="es" style="font-size:18px;font-weight:600">${esc(ex.es)}</p>` : ''}${optsHtml(ex)}`;
  else if (ex.type === 'listen') h = `${kind}<h2>${esc(ex.title)}</h2>${audio}${canSpeak ? '' : `<p class="transcript">${esc(ex.audio)}</p>`}<p class="fr" style="font-size:24px">${esc(ex.question)}</p>${optsHtml(ex)}`;
  else if (ex.type === 'type') h = `${kind}<h2>${esc(ex.title)}</h2><div class="type-line fr"><span>${esc(ex.before)}</span><input class="inline-input" id="typeIn" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Tu respuesta"><span${/^[,.]/.test(ex.after || '') ? ' class="tight"' : ''}>${esc(ex.after)}</span></div>${ex.hint ? `<p class="es">Verbo: <b>${esc(ex.hint)}</b></p>` : ''}`;
  else if (ex.type === 'dictation') h = `${kind}<h2>${esc(ex.title)}</h2>${audio}${canSpeak ? '' : `<p class="transcript">Sin voz francesa en este navegador: escribe en francés «${esc(ex.es)}».</p>`}
      <textarea class="answer-area" id="typeIn" rows="2" autocomplete="off" spellcheck="false" aria-label="Tu respuesta" placeholder="Escribe en francés"></textarea>
      <div class="keys" aria-label="Caracteres franceses">${['é', 'è', 'ê', 'à', 'ç', 'ù', 'ô', "'"].map(k => `<button type="button" data-key="${k}">${k}</button>`).join('')}</div>`;
  else if (ex.type === 'order') h = `${kind}<h2>${esc(ex.title)}</h2>${ex.es ? `<p class="es" style="font-size:18px;font-weight:600">«${esc(ex.es)}»</p>` : ''}<div class="line" id="line" aria-label="Tu frase"></div><div class="tiles">${ex.tiles.map((t, i) => `<button class="tile-w" type="button" data-tile="${i}">${esc(t)}</button>`).join('')}</div>`;
  else if (ex.type === 'match') { const r = shuffle(ex.pairs.map((p, i) => ({ t: p[1], i }))); h = `${kind}<h2>${esc(ex.title)}</h2><div class="match"><div class="match-col">${ex.pairs.map((p, i) => `<button class="opt" type="button" data-l="${i}">${esc(p[0])}</button>`).join('')}</div><div class="match-col">${r.map(x => `<button class="opt" type="button" data-r="${x.i}">${esc(x.t)}</button>`).join('')}</div></div>`; }
  else if (ex.type === 'spot') h = `${kind}<h2>${esc(ex.title)}</h2><div class="words">${ex.words.map((w, i) => `<button class="word" type="button" data-w="${i}" aria-pressed="false">${esc(w)}</button>`).join('')}</div>`;
  body.innerHTML = `<div class="ex">${nbsp(h)}</div>`; body.scrollTop = 0;
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
    if (ex.type === 'listen') body.querySelector('.ex').insertAdjacentHTML('beforeend', nbsp(`<p class="transcript">${esc(ex.audio)}</p>`));
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
function next() { if (!L) return; L.pos++; if (L.pos >= L.queue.length) return finish(); saveProgress(); renderEx(); }

async function finish() {
  L.finished = true; $('#lessonProgress').firstElementChild.style.width = '100%'; $('#combo').innerHTML = '';
  const secs = Math.round((Date.now() - L.start) / 1000);
  const results = [...L.res.values()];
  const firstOk = results.filter(r => r.first_try).length;
  const acc = Math.round(firstOk / L.items.length * 100);
  const item = (c, ic, title, sub) => `<div class="end-item"><span class="medal" style="background:var(--${c});color:var(--${c}-ink)">${icon(ic)}</span><div><b>${title}</b><span class="muted">${sub}</span></div></div>`;
  const header = (xp, extra) => `<div class="end">
    <span class="ex-kind">${icon('sparkle')}Unidad ${L.unit.number} terminada</span>
    <h2>${acc === 100 ? '¡Lección perfecta!' : acc >= 75 ? '¡Unidad superada!' : 'Aún no superada'}</h2>
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
  if (error) {
    console.error(error); body.innerHTML = ''; setFoot('retry');
    if (/cooldown|locked/.test(error.message || '')) toast('Esta unidad está bloqueada por ahora: tu intento no se guardó.');
    return;
  }
  sb.rpc('clear_lesson_progress', { p_unit: L.unit.id }).then(r => { if (r && r.error) console.error(r.error); }); L_RESUME.delete(L.unit.id);
  if (L.focusLost) sb.rpc('record_focus_lost', { p_unit: L.unit.id, p_count: L.focusLost }).then(r => { if (r && r.error) console.error(r.error); });
  const passed = data.first_try >= PASS_RATE * data.total;
  const pct = Math.round(data.first_try / data.total * 100);
  const nextU = A.units.filter(x => x.level === L.unit.level && x.number > L.unit.number && playable(x)).sort((a, b) => a.number - b.number)[0];
  const badgeById = Object.fromEntries(A.badges.map(b => [b.id, b]));
  const extra = [
    passed ? item('mint', 'check', `Unidad superada · ${pct} %`, nextU ? `La unidad ${nextU.number} ya está abierta.` : 'Has abierto el camino a la siguiente unidad en cuanto se publique.')
      : item('peach', 'timer', `${pct} % · necesitas 75 % para pasar`, `Podrás volver a intentarlo el ${retryLabel(Date.now() + RETRY_MS)}. Mientras tanto, repasa tus errores en «Repasar».`),
    data.goal_reached ? item('peach', 'flame', `Racha: ${data.streak_before} → ${data.streak} día${data.streak === 1 ? '' : 's'}`, 'Meta de hoy cumplida. Vuelve mañana.')
      : item('peach', 'flame', `${data.today_xp} / ${A.profile.daily_goal} XP hoy`, data.today_xp >= A.profile.daily_goal ? 'Meta de hoy ya cumplida.' : `Te faltan ${A.profile.daily_goal - data.today_xp} XP para tu meta de hoy.`),
    ...(data.badges || []).map(id => { const b = badgeById[id]; return b ? item(b.color, b.icon, `Insignia: ${esc(b.name)}`, esc(b.description)) : ''; }),
    data.cards ? item('lilac', 'cards', `${data.cards} tarjeta${data.cards > 1 ? 's' : ''} nueva${data.cards > 1 ? 's' : ''} en tu repaso`, 'Vocabulario de la unidad y tus errores.') : '',
    L.focusLost ? item('peach', 'lock', `Saliste ${L.focusLost} ${L.focusLost === 1 ? 'vez' : 'veces'} de la pestaña`, 'Durante preguntas abiertas. Tu profesor lo verá con tu resultado.') : '',
    data.homework_done ? item('mint', 'check', 'Tarea entregada', A.teacher ? `${esc(firstName(A.teacher.full_name))} verá tu resultado antes de la clase.` : 'Tu profesor verá tu resultado.') : ''
  ].join('');
  body.innerHTML = header(data.xp, extra);
  setFoot('end');
  countUp($('#xpCount'), data.xp);
  if (passed) confetti();
  R.loaded = false;
  refresh().then(() => { if (lessonEl.hidden) render(); return maybeClaimWeekly(); });
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

bindCrmOverlay();
boot().finally(() => { booted = true; });
