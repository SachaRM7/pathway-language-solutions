// Supabase Edge Function « weekly-report » : envoie chaque lundi aux admins le bilan de la
// semaine précédente (campus/db/011_informe.sql, appelée par pg_cron).
//
// Déploiement : Supabase → Edge Functions → Deploy a new function → Via Editor,
// nom « weekly-report », coller ce fichier, Deploy, puis désactiver « Verify JWT » dans ses
// réglages (pg_cron l'appelle sans compte, avec le secret partagé du SQL 014). Elle n'envoie qu'un rapport par semaine, même
// appelée plusieurs fois. Secret : RESEND_API_KEY (déjà ajouté pour Resend). SUPABASE_URL et
// SUPABASE_SERVICE_ROLE_KEY sont fournis par Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const FROM = 'Pathway Campus <campus@pathway-languages.com>';
const CAMPUS = 'https://pathway-languages.com/campus/#horarios';
const TZ = 'America/Lima';
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
// Test from the Campus (admin only): the caller's own session decides, and the email goes to them.
const SITE = 'https://pathway-languages.com';
const cors = { 'Access-Control-Allow-Origin': SITE, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
async function adminCaller(req: Request): Promise<{ email: string; name: string } | null> {
  const authorization = req.headers.get('Authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) return null;
  const asCaller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
  const { data: user } = await asCaller.auth.getUser();
  const { data: role } = await asCaller.rpc('my_role');
  if (!user?.user?.email || role !== 'admin') return null;
  const { data: me } = await asCaller.from('profiles').select('full_name').eq('id', user.user.id).single();
  return { email: user.user.email, name: me?.full_name || '' };
}
async function sendMail(key: string, to: string[], subject: string, html: string) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html })
  });
}

const esc = (v: unknown) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const day = (iso: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, ...opts }).format(new Date(iso));
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

type Group = { name: string; teacher: string | null; level: string; has_zoom: boolean; planned: number; held: number; recorded: number; late: number; moved: number; cancelled: number; missing: string[] };
type Report = { from: string; to: string; week: string; groups: Group[]; pending_changes: number; inactive: { name: string; teacher: string | null }[]; units_done: number; focus: { name: string; unit: string; times: number }[]; no_group: number; unmatched: number };

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

export function renderReport(r: Report): { subject: string; html: string } {
  const last = new Date(Date.parse(r.to) - 1000).toISOString();
  const period = `du ${day(r.from, { day: 'numeric', month: 'long' })} au ${day(last, { day: 'numeric', month: 'long' })}`;
  const total = r.groups.reduce((a, g) => ({ planned: a.planned + g.planned, held: a.held + g.held, recorded: a.recorded + g.recorded, late: a.late + g.late }), { planned: 0, held: 0, recorded: 0, late: 0 });
  const red = '#c2410c';
  const kpi = (n: number, label: string, bad = false) => `<td width="25%" valign="top" style="padding:14px 12px;background:#f6f6f5;border-radius:16px;"><p style="margin:0;font:800 28px/1 ${FONT};color:${bad ? red : '#141414'};">${n}</p><p style="margin:6px 0 0;font:400 12px/1.35 ${FONT};color:#5f5f66;">${label}</p></td>`;
  const kpis = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border-collapse:separate;border-spacing:6px 0;table-layout:fixed;"><tr>${kpi(total.planned, 'cours prévus')}${kpi(total.held, 'tenus sur Zoom', total.held < total.planned)}${kpi(total.recorded, 'enregistrés', total.recorded < total.held)}${kpi(total.late, 'retards du prof', total.late > 0)}</tr></table>`;
  const alerts = [
    r.pending_changes ? `${plural(r.pending_changes, 'changement d’horaire attend', 'changements d’horaire attendent')} votre validation.` : '',
    r.no_group ? `${plural(r.no_group, 'élève n’a', 'élèves n’ont')} pas de groupe, donc pas d’horaire.` : '',
    r.unmatched ? `${plural(r.unmatched, 'réunion Zoom ne correspond', 'réunions Zoom ne correspondent')} à aucun groupe.` : ''
  ].filter(Boolean);
  const stat = (label: string, value: string, ok: boolean) => `<span style="white-space:nowrap;">${label} <b style="color:${ok ? '#141414' : red};">${value}</b></span>`;
  const group = (g: Group) => panel(`<p style="margin:0 0 2px;font:800 17px/1.3 ${FONT};color:#141414;">${esc(g.name)}</p>
      <p style="margin:0 0 10px;font:400 13px/1.4 ${FONT};color:#5f5f66;">${esc(g.teacher || 'Sans professeur')} · ${esc(g.level)}${g.has_zoom ? '' : ` · <b style="color:${red};">sans lien Zoom</b>`}</p>
      <p style="margin:0;font:400 14px/1.9 ${FONT};color:#5f5f66;">${[stat('Prévus', String(g.planned), true), stat('Sur Zoom', String(g.held), g.held === g.planned), stat('Enregistrés', String(g.recorded), g.recorded === g.held), stat('Retards', String(g.late), g.late === 0), stat('Déplacés / annulés', g.moved + g.cancelled ? `${g.moved} / ${g.cancelled}` : '—', true)].join(' &nbsp;·&nbsp; ')}</p>
      ${g.missing.length ? `<p style="margin:8px 0 0;font:400 13px/1.5 ${FONT};color:${red};">Sans trace Zoom : ${g.missing.map(m => esc(day(m, { weekday: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }))).join(', ')}</p>` : ''}`);
  const h2 = (t: string) => `<h2 style="margin:4px 0 10px;font:800 18px/1.3 ${FONT};color:#141414;">${t}</h2>`;
  const body = h1(`Semaine ${esc(period)}`)
    + para('Le bilan de vos cours, enregistrements et élèves, préparé automatiquement par le Campus.')
    + kpis
    + (alerts.length ? panel(alerts.map(a => `<p style="margin:2px 0;font:400 14px/1.5 ${FONT};color:#9a3412;">• ${esc(a)}</p>`).join(''), '#fff1ea') : '')
    + h2('Par groupe')
    + (r.groups.length ? r.groups.map(group).join('') : panel(`<p style="margin:0;font:400 14px/1.5 ${FONT};color:#5f5f66;">Aucun groupe pour l’instant : créez-les dans « Horarios ».</p>`))
    + h2('Élèves sans activité sur le Campus')
    + para(r.inactive.length ? r.inactive.map(s => `${esc(s.name)}${s.teacher ? ` <span style="color:#9b9ba3;">(${esc(s.teacher)})</span>` : ''}`).join(', ') : 'Aucun : tout le monde a travaillé.', 'font-size:15px;')
    + (r.focus.length ? h2('Sorties d’onglet pendant une unité') + para(r.focus.map(f => `${esc(f.name)} : ${plural(f.times, 'fois', 'fois')}`).join(', '), 'font-size:15px;') : '')
    + para(`${plural(r.units_done, 'unité terminée', 'unités terminées')} sur le Campus cette semaine.`, 'font-size:15px;')
    + button(CAMPUS, 'Ouvrir « Horarios »')
    + small('« Sur Zoom » : cours dont Zoom a signalé le début entre 1 h avant et 1 h 30 après l’heure prévue. « Retards » : cours commencés plus de 5 minutes après l’heure prévue.');
  return {
    subject: `Pathway · semaine ${period} : ${total.held}/${total.planned} cours tenus, ${total.recorded} enregistrés`,
    html: layout({ lang: 'fr', title: `Rapport du lundi · semaine ${period}`, preview: `${total.held}/${total.planned} cours tenus sur Zoom, ${total.recorded} enregistrés, ${plural(total.late, 'retard', 'retards')}.`, tag: 'PATHWAY CAMPUS · RAPPORT DU LUNDI', hero: 'Bilan', body })
  };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return json(500, { error: 'missing_resend_key' });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const body = await req.json().catch(() => ({}));

  // Test copy: the current report, sent only to the admin who asked, without using up the week.
  if (body && body.test) {
    const caller = await adminCaller(req);
    if (!caller) return json(403, { error: 'admin_only' });
    const { data: report, error } = await supabase.rpc('weekly_report_data', { p_from: null });
    if (error || !report) return json(500, { error: 'report_failed' });
    const { subject, html } = renderReport(report);
    const sent = await sendMail(key, [caller.email], `[Prueba] ${subject}`, html);
    return sent.ok ? json(200, { ok: true, test: true, to: caller.email }) : json(502, { error: 'send_failed', status: sent.status });
  }

  // Automatic run: only pg_cron, which sends the shared secret (db/014_cron_secreto.sql).
  const { data: allowed } = await supabase.rpc('check_cron_secret', { p_secret: req.headers.get('x-cron-secret') ?? '' });
  if (allowed !== true) return json(401, { error: 'unauthorized' });

  const { data: report, error } = await supabase.rpc('weekly_report_data', { p_from: null });
  if (error || !report) return json(500, { error: 'report_failed' });
  const { data: emails } = await supabase.rpc('report_recipients');
  const to = (emails || []).filter(Boolean);
  if (!to.length) return json(200, { skipped: 'no_admin_email' });

  // One report per week, whoever calls the function and however many times.
  const { data: claimed } = await supabase.rpc('claim_weekly_report', { p_week: report.week, p_recipients: to.length });
  if (claimed !== true) return json(200, { skipped: 'already_sent', week: report.week });

  const { subject, html } = renderReport(report);
  const sent = await sendMail(key, to, subject, html);
  if (!sent.ok) {
    await supabase.from('weekly_reports').delete().eq('week_start', report.week); // lets the next call retry
    return json(502, { error: 'send_failed', status: sent.status });
  }
  return json(200, { ok: true, week: report.week, recipients: to.length });
});
