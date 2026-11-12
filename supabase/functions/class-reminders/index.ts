// Supabase Edge Function « class-reminders » : prévient chaque élève par e-mail N minutes avant
// son cours (campus/db/013_asistencia.sql). Appelée toutes les 5 minutes par pg_cron ; elle ne
// fait rien tant que le rappel est désactivé dans « Horarios » → « Reglas de asistencia ».
//
// Déploiement : Supabase → Edge Functions → Deploy a new function → Via Editor, nom
// « class-reminders », coller ce fichier, Deploy, puis désactiver « Verify JWT » (pg_cron l'appelle
// avec le secret partagé du SQL 014 ; tout autre appel automatique est refusé).
// Secret : RESEND_API_KEY (déjà ajouté). Chaque rappel ne part qu'une fois.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const FROM = 'Pathway Campus <campus@pathway-languages.com>';
const CAMPUS = 'https://pathway-languages.com/campus/#curso';
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
// Test from the Campus (admin only): the caller's own session decides, and the email goes to them.
const SITE = 'https://pathway-languages.com';
const cors = { 'Access-Control-Allow-Origin': SITE, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
async function adminCaller(req: Request): Promise<{ email: string; name: string; timezone?: string } | null> {
  const authorization = req.headers.get('Authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) return null;
  const asCaller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
  const { data: user } = await asCaller.auth.getUser();
  const { data: role } = await asCaller.rpc('my_role');
  if (!user?.user?.email || role !== 'admin') return null;
  const { data: me } = await asCaller.from('profiles').select('full_name, timezone').eq('id', user.user.id).single();
  return { email: user.user.email, name: me?.full_name || '', timezone: me?.timezone };
}
async function sendMail(key: string, to: string[], subject: string, html: string) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html })
  });
}

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

type Due = { student_id: string; name: string; email: string; timezone: string | null; group: string; teacher: string | null; scheduled_at: string; at: string; status: string };

// Same look as the Campus login email (supabase/templates/magic-link.html): Pathway logo, white
// card with a lilac band and a big coral word, black pill buttons, Pathway footer.
const LOGO = 'https://pathway-languages.com/campus/email/logo.png';
const FONT = 'Arial,Helvetica,sans-serif';
function layout(o: { lang: string; title: string; preview: string; tag: string; hero: string; body: string }): string {
  return `<!doctype html>
<html lang="${o.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(o.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f2f2f0;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(o.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f2f2f0;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
    <tr><td style="padding:0 4px 20px;">
      <img src="${LOGO}" width="148" height="42" alt="Pathway" style="display:block;border:0;width:148px;height:42px;">
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:28px;overflow:hidden;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="background:#ebe7ff;padding:32px 32px 0;border-radius:28px 28px 0 0;">
          <p style="margin:0 0 6px;font:700 13px/1.4 ${FONT};color:#5946c8;letter-spacing:.02em;">${esc(o.tag)}</p>
          <p style="margin:0;font:800 60px/0.9 ${FONT};letter-spacing:-3px;color:#f05a36;">${esc(o.hero)}</p>
        </td></tr>
        <tr><td style="padding:32px;">${o.body}</td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:20px 8px 0;font:400 12px/1.6 ${FONT};color:#9b9ba3;text-align:center;">
      Pathway Language Solutions · <a href="https://pathway-languages.com/" style="color:#9b9ba3;">pathway-languages.com</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}
const h1 = (t: string) => `<h1 style="margin:0 0 12px;font:800 26px/1.2 ${FONT};letter-spacing:-.5px;color:#141414;">${t}</h1>`;
const para = (t: string, extra = '') => `<p style="margin:0 0 20px;font:400 16px/1.6 ${FONT};color:#5f5f66;${extra}">${t}</p>`;
const small = (t: string) => `<p style="margin:0;font:400 13px/1.6 ${FONT};color:#9b9ba3;">${t}</p>`;
const panel = (inner: string, bg = '#f6f6f5') => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;"><tr><td style="padding:20px;background:${bg};border-radius:20px;">${inner}</td></tr></table>`;
const button = (href: string, label: string) => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;"><tr><td style="background:#141414;border-radius:999px;"><a href="${href}" style="display:inline-block;padding:16px 30px;font:700 16px/1 ${FONT};color:#ffffff;text-decoration:none;white-space:nowrap;border-radius:999px;">${label} &rarr;</a></td></tr></table>`;

export function renderReminder(d: Due): { subject: string; html: string } {
  const tz = d.timezone || 'America/Lima';
  const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es', { timeZone: tz, ...o }).format(new Date(iso));
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const hour = fmt(d.at, { hour: '2-digit', minute: '2-digit' });
  const minutes = Math.max(5, Math.round((Date.parse(d.at) - Date.now()) / 60000 / 5) * 5);
  const when = minutes >= 55 && minutes <= 65 ? '1 hora' : `${minutes} minutos`;
  const first = (d.name || '').split(/\s+/)[0] || '';
  const moved = d.status === 'moved'
    ? panel(`<p style="margin:0;font:400 14px/1.5 ${FONT};color:#9a3412;">Esta clase cambió de horario: antes era el ${esc(fmt(d.scheduled_at, { weekday: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }))}.</p>`, '#fff1ea')
    : '';
  const body = h1(`${first ? `${esc(first)}, tu` : 'Tu'} clase empieza en ${when}`)
    + para('Te esperamos en tu clase en vivo. Entra por el campus: así tu asistencia queda registrada.')
    + moved
    + panel(`<p style="margin:0 0 6px;font:700 12px/1.4 ${FONT};color:#9b9ba3;letter-spacing:.06em;">TU CLASE</p>
        <p style="margin:0 0 4px;font:800 22px/1.3 ${FONT};color:#141414;">${esc(cap(fmt(d.at, { weekday: 'long', day: 'numeric', month: 'long' })))}</p>
        <p style="margin:0 0 10px;font:700 18px/1.4 ${FONT};color:#141414;">${esc(hour)} <span style="font-weight:400;font-size:14px;color:#5f5f66;">· tu hora local</span></p>
        <p style="margin:0;font:400 15px/1.5 ${FONT};color:#5f5f66;">${esc(d.group)}${d.teacher ? ` · con ${esc(d.teacher)}` : ''}</p>`)
    + button(CAMPUS, 'Entrar a la clase')
    + small('El enlace de la clase se abre en el campus antes de empezar. Si no puedes asistir, avisa a tu profesor.');
  return {
    subject: `Tu clase empieza en ${when} · ${hour}`,
    html: layout({ lang: 'es', title: 'Tu clase empieza pronto', preview: `Tu clase empieza a las ${hour} (tu hora local). Entra por el campus.`, tag: 'CAMPUS PATHWAY', hero: 'En vivo', body })
  };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const body = await req.json().catch(() => ({}));

  // Test copy: an example reminder (class in one hour), sent only to the admin who asked.
  if (body && body.test) {
    const caller = await adminCaller(req);
    if (!caller) return json(403, { error: 'admin_only' });
    const key = Deno.env.get('RESEND_API_KEY');
    if (!key) return json(500, { error: 'missing_resend_key' });
    const at = new Date(Date.now() + 60 * 60000).toISOString();
    const { subject, html } = renderReminder({ student_id: '', name: caller.name, email: caller.email, timezone: caller.timezone || 'America/Lima', group: 'Grupo de prueba', teacher: 'Pathway', scheduled_at: at, at, status: 'planned' });
    const sent = await sendMail(key, [caller.email], `[Prueba] ${subject}`, html);
    return sent.ok ? json(200, { ok: true, test: true, to: caller.email }) : json(502, { error: 'send_failed', status: sent.status });
  }

  // Automatic run: only pg_cron, which sends the shared secret (db/014_cron_secreto.sql).
  const { data: allowed } = await supabase.rpc('check_cron_secret', { p_secret: req.headers.get('x-cron-secret') ?? '' });
  if (allowed !== true) return json(401, { error: 'unauthorized' });
  const { data, error } = await supabase.rpc('due_reminders');
  if (error) return json(500, { error: 'query_failed' });
  const due = (data || []) as Due[];
  if (!due.length) return json(200, { sent: 0 });
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return json(500, { error: 'missing_resend_key' });

  let sent = 0;
  for (const d of due) {
    const { data: claimed } = await supabase.rpc('claim_reminder', { p_student: d.student_id, p_scheduled: d.scheduled_at });
    if (claimed !== true) continue;
    const { subject, html } = renderReminder(d);
    const res = await sendMail(key, [d.email], subject, html);
    if (res.ok) sent++;
    else await supabase.from('class_reminders_sent').delete().eq('student_id', d.student_id).eq('scheduled_at', d.scheduled_at);
  }
  return json(200, { sent, due: due.length });
});
