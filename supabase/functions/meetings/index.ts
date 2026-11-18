// Supabase Edge Function « meetings » (campus/db/041_agenda_reuniones.sql): the free meeting with a
// teacher after the level test, and the team's calendar subscription.
//
// • POST { action: 'invite', meeting_id } from the Campus (admin session): sends the invitation of a
//   meeting proposed on a prospect's card (meeting_propose), from the chosen address (ryan@,
//   abdrahim@ or contacto@, replies land in « Correo »), with « Confirmo » / « otro horario »
//   (reunion.html), a Google Calendar link and an .ics file. Result kept by meeting_invite_result.
// • POST with x-cron-secret (pg_cron, every 5 minutes): reminders, the day before (with the confirm
//   button if still unconfirmed) and 1 hour before (Zoom button); the host gets one 1 hour before.
// • GET ?feed=<token>: the agenda of a team member as an iCalendar feed (classes, meetings, blocks),
//   to subscribe from a phone's calendar (Campus → Mi agenda).
//
// Deploy: name « meetings », Verify JWT OFF (calendar apps and pg_cron have no Supabase session; the
// function checks each call itself). Secret: RESEND_API_KEY (already set).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { fromHeader, feedIcs, renderHostReminder, renderInvite, renderReminder, type Meeting } from './emails.ts';

const SITE = 'https://pathway-languages.com';
const cors = { 'Access-Control-Allow-Origin': SITE, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
const json = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const b64 = (s: string) => { let bin = ''; for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b); return btoa(bin); };

async function resend(key: string, o: { from: string; replyTo: string; to: string; subject: string; html: string; ics?: string }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: o.from, to: [o.to], reply_to: o.replyTo, subject: o.subject, html: o.html,
      ...(o.ics ? { attachments: [{ filename: 'reunion-pathway.ics', content: b64(o.ics) }] } : {}) })
  });
  return { ok: r.ok, status: r.status, error: r.ok ? null : (await r.text().catch(() => '')).slice(0, 300) };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = new URL(req.url);
  const service = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // Calendar subscription.
  if (req.method === 'GET') {
    const token = url.searchParams.get('feed') || '';
    if (!UUID.test(token)) return new Response('Not found', { status: 404 });
    const { data, error } = await service.rpc('agenda_feed', { p_token: token });
    if (error || !data) return new Response('Not found', { status: 404 });
    return new Response(feedIcs(data), { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, max-age=300' } });
  }
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return json(500, { error: 'missing_resend_key' });

  // Reminders (pg_cron).
  const secret = req.headers.get('x-cron-secret');
  if (secret) {
    const { data: allowed } = await service.rpc('check_cron_secret', { p_secret: secret });
    if (allowed !== true) return json(401, { error: 'unauthorized' });
    const { data: due, error } = await service.rpc('meetings_reminders_due');
    if (error) return json(500, { error: 'query_failed' });
    let sent = 0, failed = 0;
    for (const d of (due || []) as { id: string; kind: 'day' | 'hour' }[]) {
      const { data: m } = await service.rpc('meeting_mail_data', { p_id: d.id });
      if (!m) continue;
      // Marked first: a failed send is not retried every 5 minutes.
      await service.rpc('meeting_reminded', { p_id: d.id, p_kind: d.kind });
      const sender = fromHeader((m as Meeting).sender_email);
      const mail = renderReminder(m as Meeting, d.kind, SITE);
      const r = await resend(key, { ...sender, to: (m as Meeting).email, subject: mail.subject, html: mail.html });
      if (r.ok) sent++; else { failed++; console.error('meetings: reminder failed', r.status); }
      if (d.kind === 'hour' && (m as Meeting).host_email) {
        const h = renderHostReminder(m as Meeting, SITE);
        await sleep(600);
        await resend(key, { from: 'Pathway Campus <campus@pathway-languages.com>', replyTo: 'contacto@pathway-languages.com', to: (m as Meeting).host_email!, subject: h.subject, html: h.html });
      }
      await sleep(600);
    }
    return json(200, { sent, failed });
  }

  // Invitation (Campus, admin).
  const authorization = req.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) return json(401, { error: 'unauthorized' });
  const asUser = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: isAdmin } = await asUser.rpc('is_admin');
  if (isAdmin !== true) return json(403, { error: 'admins_only' });
  const body = await req.json().catch(() => ({})) as { action?: string; meeting_id?: string };
  if (body.action !== 'invite' || !UUID.test(String(body.meeting_id || ''))) return json(400, { error: 'invalid_request' });
  const { data: m, error } = await service.rpc('meeting_mail_data', { p_id: body.meeting_id });
  if (error || !m) return json(404, { error: 'not_found' });
  if ((m as Meeting).status !== 'propuesta') return json(409, { error: 'not_proposed' });
  const mail = renderInvite(m as Meeting, SITE);
  const r = await resend(key, { ...fromHeader((m as Meeting).sender_email), to: (m as Meeting).email, subject: mail.subject, html: mail.html, ics: mail.ics });
  await service.rpc('meeting_invite_result', { p_id: body.meeting_id, p_ok: r.ok, p_error: r.error });
  if (!r.ok) { console.error('meetings: invite failed', r.status); return json(502, { error: 'send_failed' }); }
  return json(200, { ok: true, to: (m as Meeting).email });
});
