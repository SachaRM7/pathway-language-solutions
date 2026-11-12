// Supabase Edge Function « weekly-report » : envoie chaque lundi aux admins le bilan de la
// semaine précédente (campus/db/011_informe.sql, appelée par pg_cron).
//
// Déploiement : Supabase → Edge Functions → Deploy a new function → Via Editor,
// nom « weekly-report », coller ce fichier, Deploy, puis désactiver « Verify JWT » dans ses
// réglages (pg_cron l'appelle sans compte). Elle n'envoie qu'un rapport par semaine, même
// appelée plusieurs fois. Secret : RESEND_API_KEY (déjà ajouté pour Resend). SUPABASE_URL et
// SUPABASE_SERVICE_ROLE_KEY sont fournis par Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const FROM = 'Pathway Campus <campus@pathway-languages.com>';
const CAMPUS = 'https://pathway-languages.com/campus/#horarios';
const TZ = 'America/Lima';
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const day = (iso: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, ...opts }).format(new Date(iso));
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

type Group = { name: string; teacher: string | null; level: string; has_zoom: boolean; planned: number; held: number; recorded: number; late: number; moved: number; cancelled: number; missing: string[] };
type Report = { from: string; to: string; week: string; groups: Group[]; pending_changes: number; inactive: { name: string; teacher: string | null }[]; units_done: number; focus: { name: string; unit: string; times: number }[]; no_group: number; unmatched: number };

export function renderReport(r: Report): { subject: string; html: string } {
  const last = new Date(Date.parse(r.to) - 1000).toISOString();
  const period = `du ${day(r.from, { day: 'numeric', month: 'long' })} au ${day(last, { day: 'numeric', month: 'long' })}`;
  const total = r.groups.reduce((a, g) => ({ planned: a.planned + g.planned, held: a.held + g.held, recorded: a.recorded + g.recorded, late: a.late + g.late }), { planned: 0, held: 0, recorded: 0, late: 0 });
  const cell = 'padding:8px 10px;border-bottom:1px solid #e6e1d8;font-size:14px;';
  const warn = (ok: boolean, text: string) => ok ? esc(text) : `<b style="color:#a34e3b">${esc(text)}</b>`;
  const rows = r.groups.map(g => `<tr>
      <td style="${cell}"><b>${esc(g.name)}</b><br><span style="color:#50625c;font-size:12px">${esc(g.teacher || 'Sans professeur')} · ${esc(g.level)}${g.has_zoom ? '' : ' · sans lien Zoom'}</span></td>
      <td style="${cell}text-align:center">${g.planned}</td>
      <td style="${cell}text-align:center">${warn(g.held === g.planned, String(g.held))}</td>
      <td style="${cell}text-align:center">${warn(g.recorded === g.held, String(g.recorded))}</td>
      <td style="${cell}text-align:center">${warn(g.late === 0, String(g.late))}</td>
      <td style="${cell}text-align:center">${g.moved + g.cancelled ? `${g.moved} / ${g.cancelled}` : '—'}</td></tr>
    ${g.missing.length ? `<tr><td colspan="6" style="${cell}color:#a34e3b;font-size:12px">Sans trace Zoom : ${g.missing.map(m => esc(day(m, { weekday: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }))).join(', ')}</td></tr>` : ''}`).join('');
  const alerts = [
    r.pending_changes ? `${plural(r.pending_changes, 'changement d’horaire attend', 'changements d’horaire attendent')} votre validation.` : '',
    r.no_group ? `${plural(r.no_group, 'élève n’a', 'élèves n’ont')} pas de groupe, donc pas d’horaire.` : '',
    r.unmatched ? `${plural(r.unmatched, 'réunion Zoom ne correspond', 'réunions Zoom ne correspondent')} à aucun groupe.` : ''
  ].filter(Boolean);
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f5efe4;font-family:Arial,Helvetica,sans-serif;color:#122b26">
  <div style="max-width:680px;margin:0 auto;padding:28px 20px">
    <p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#50625c;margin:0">Pathway Campus · rapport du lundi</p>
    <h1 style="font-size:24px;margin:8px 0 4px">Semaine ${esc(period)}</h1>
    <p style="margin:0 0 20px;color:#50625c">${plural(total.planned, 'cours prévu', 'cours prévus')} · ${total.held} tenus sur Zoom · ${total.recorded} enregistrés · ${plural(total.late, 'retard', 'retards')} du professeur · ${plural(r.units_done, 'unité terminée', 'unités terminées')} sur le Campus</p>
    ${alerts.length ? `<div style="background:#fff3ec;border-radius:10px;padding:12px 16px;margin-bottom:18px">${alerts.map(a => `<p style="margin:4px 0;font-size:14px">• ${esc(a)}</p>`).join('')}</div>` : ''}
    <table style="width:100%;border-collapse:collapse;background:#fffaf2;border-radius:12px;overflow:hidden">
      <tr style="background:#122b26;color:#f5efe4;font-size:12px"><th style="padding:8px 10px;text-align:left">Groupe</th><th style="padding:8px">Prévus</th><th style="padding:8px">Sur Zoom</th><th style="padding:8px">Enregistrés</th><th style="padding:8px">Retards</th><th style="padding:8px">Déplacés / annulés</th></tr>
      ${rows || `<tr><td colspan="6" style="${cell}">Aucun groupe pour l’instant.</td></tr>`}
    </table>
    <h2 style="font-size:17px;margin:24px 0 8px">Élèves sans aucune activité sur le Campus cette semaine</h2>
    <p style="margin:0;font-size:14px">${r.inactive.length ? r.inactive.map(s => `${esc(s.name)}${s.teacher ? ` <span style="color:#50625c">(${esc(s.teacher)})</span>` : ''}`).join(', ') : 'Aucun : tout le monde a travaillé.'}</p>
    ${r.focus.length ? `<h2 style="font-size:17px;margin:24px 0 8px">Sorties d’onglet pendant une unité</h2><p style="margin:0;font-size:14px">${r.focus.map(f => `${esc(f.name)} : ${plural(f.times, 'fois', 'fois')}`).join(', ')}</p>` : ''}
    <p style="margin:28px 0 0"><a href="${CAMPUS}" style="background:#122b26;color:#f5efe4;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:bold">Ouvrir « Horarios » dans le Campus</a></p>
    <p style="margin:24px 0 0;font-size:12px;color:#50625c">« Sur Zoom » : cours dont Zoom a signalé le début entre 1 h avant et 1 h 30 après l’heure prévue. « Retards » : cours commencés plus de 5 minutes après l’heure prévue.</p>
  </div></body></html>`;
  return { subject: `Pathway · semaine ${period} : ${total.held}/${total.planned} cours tenus, ${total.recorded} enregistrés`, html };
}

Deno.serve(async req => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return json(500, { error: 'missing_resend_key' });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: report, error } = await supabase.rpc('weekly_report_data', { p_from: null });
  if (error || !report) return json(500, { error: 'report_failed' });
  const { data: emails } = await supabase.rpc('report_recipients');
  const to = (emails || []).filter(Boolean);
  if (!to.length) return json(200, { skipped: 'no_admin_email' });

  // One report per week, whoever calls the function and however many times.
  const { data: claimed } = await supabase.rpc('claim_weekly_report', { p_week: report.week, p_recipients: to.length });
  if (claimed !== true) return json(200, { skipped: 'already_sent', week: report.week });

  const { subject, html } = renderReport(report);
  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html })
  });
  if (!sent.ok) {
    await supabase.from('weekly_reports').delete().eq('week_start', report.week); // lets the next call retry
    return json(502, { error: 'send_failed', status: sent.status });
  }
  return json(200, { ok: true, week: report.week, recipients: to.length });
});
