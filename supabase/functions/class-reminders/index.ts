// Supabase Edge Function « class-reminders » : prévient chaque élève par e-mail N minutes avant
// son cours (campus/db/013_asistencia.sql). Appelée toutes les 5 minutes par pg_cron ; elle ne
// fait rien tant que le rappel est désactivé dans « Horarios » → « Reglas de asistencia ».
//
// Déploiement : Supabase → Edge Functions → Deploy a new function → Via Editor, nom
// « class-reminders », coller ce fichier, Deploy, puis désactiver « Verify JWT ».
// Secret : RESEND_API_KEY (déjà ajouté). Chaque rappel ne part qu'une fois.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const FROM = 'Pathway Campus <campus@pathway-languages.com>';
const CAMPUS = 'https://pathway-languages.com/campus/#curso';
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
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
    <p style="margin:0 0 22px"><a href="${CAMPUS}" style="background:#122b26;color:#f5efe4;padding:13px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Entrar a la clase desde el campus</a></p>
    <p style="margin:0;font-size:13px;color:#50625c">Entra siempre por el campus: así tu asistencia queda registrada.</p>
  </div></body></html>`;
  return { subject: `Tu clase empieza en ${when} · ${hour}`, html };
}

Deno.serve(async req => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
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
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [d.email], subject, html })
    });
    if (res.ok) sent++;
    else await supabase.from('class_reminders_sent').delete().eq('student_id', d.student_id).eq('scheduled_at', d.scheduled_at);
  }
  return json(200, { sent, due: due.length });
});
