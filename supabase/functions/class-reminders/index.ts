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

export function renderReminder(d: Due): { subject: string; html: string } {
  const tz = d.timezone || 'America/Lima';
  const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es', { timeZone: tz, ...o }).format(new Date(iso));
  const hour = fmt(d.at, { hour: '2-digit', minute: '2-digit' });
  const minutes = Math.max(5, Math.round((Date.parse(d.at) - Date.now()) / 60000 / 5) * 5);
  const when = minutes >= 55 && minutes <= 65 ? '1 hora' : `${minutes} minutos`;
  const first = (d.name || '').split(/\s+/)[0] || '';
  const moved = d.status === 'moved' ? `<p style="margin:0 0 14px;padding:10px 14px;background:#fff3ec;border-radius:10px;font-size:14px">Esta clase cambió de horario: antes era el ${esc(fmt(d.scheduled_at, { weekday: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }))}.</p>` : '';
  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#f5efe4;font-family:Arial,Helvetica,sans-serif;color:#122b26">
  <div style="max-width:520px;margin:0 auto;padding:28px 20px">
    <p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#50625c;margin:0">Pathway Campus</p>
    <h1 style="font-size:24px;margin:8px 0 14px">${first ? `${esc(first)}, tu` : 'Tu'} clase empieza en ${when}</h1>
    ${moved}
    <p style="margin:0 0 6px;font-size:16px"><b>${esc(fmt(d.at, { weekday: 'long', day: 'numeric', month: 'long' }))} a las ${esc(hour)}</b> (tu hora local)</p>
    <p style="margin:0 0 20px;font-size:15px;color:#50625c">${esc(d.group)}${d.teacher ? ` · con ${esc(d.teacher)}` : ''}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px"><tr><td style="border-radius:999px;background:#122b26;"><a href="${CAMPUS}" style="display:inline-block;padding:14px 22px;font:bold 15px/1 Arial,Helvetica,sans-serif;color:#f5efe4;text-decoration:none;white-space:nowrap;border-radius:999px;">Entrar a la clase</a></td></tr></table>
    <p style="margin:0;font-size:13px;color:#50625c">Entra siempre por el campus: así tu asistencia queda registrada.</p>
  </div></body></html>`;
  return { subject: `Tu clase empieza en ${when} · ${hour}`, html };
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
