// Supabase Edge Function « mail » : la boîte de réception de l'équipe dans le Campus (« Captación »
// → « Correo », campus/db/035_correo.sql).
//
// • POST { action: 'sync' } avec x-cron-secret (pg_cron, toutes les 2 minutes) : lit la boîte Zoho en
//   IMAP, importe les e-mails de vraies personnes (pas les newsletters, notifications, rebonds,
//   réponses automatiques ni nos propres adresses) et prépare un brouillon de réponse par l'IA.
// • POST { action: 'send', id, from } avec la session d'un admin : envoie le brouillon par Zoho
//   (SMTP) depuis l'adresse choisie, dans le même fil que chez la personne, puis le range dans les
//   « Envoyés » de Zoho (IMAP).
// • POST { action: 'redraft', thread_id } avec la session d'un admin : nouveau brouillon de l'IA.
//
// Déploiement : nom « mail », Verify JWT DÉSACTIVÉ (pg_cron n'a pas de session ; chaque action
// vérifie elle-même le secret partagé ou la session d'admin). Secrets : ZOHO_SMTP_PASSWORD (mot de
// passe d'application du compte principal) et ANTHROPIC_API_KEY (déjà là). Facultatif : ZOHO_SMTP_USER.

import Anthropic from 'npm:@anthropic-ai/sdk@1.8.0';
import PostalMime from 'npm:postal-mime@2.7.6';
import { Imap, MODEL, OUTPUT_SCHEMA, SENDERS, SENDER_NAMES, SYSTEM_PROMPT, buildMessage, buildUserContent, clip, decideDraft, emailOf,
  fromAPerson, headerMap, msgIds, normSubject, replySubject, senderFor, sentFolder, smtpSend, stripQuoted, type DraftContext } from './logic.ts';

const SITE = 'https://pathway-languages.com';
const cors = { 'Access-Control-Allow-Origin': SITE, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const env = (k: string, d = '') => (Deno.env.get(k) || d).trim();
const URL_ = env('SUPABASE_URL'), SERVICE = env('SUPABASE_SERVICE_ROLE_KEY'), ANON = env('SUPABASE_ANON_KEY');
const USER = env('ZOHO_SMTP_USER', 'contact@pathway-languages.com'), PASS = env('ZOHO_SMTP_PASSWORD');
const IMAP_HOST = env('ZOHO_IMAP_HOST', 'imappro.zoho.com'), SMTP_HOST = env('ZOHO_SMTP_HOST', 'smtppro.zoho.com');
const BOX = 'INBOX', MAX_PER_RUN = 15, MAX_DRAFTS_PER_RUN = 6, MAX_SIZE = 4_000_000, BACKFILL_DAYS = 7;

async function rpc(fn: string, args: Record<string, unknown>, auth?: string) {
  const key = auth ? ANON : SERVICE;
  const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: key, Authorization: auth || `Bearer ${SERVICE}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  const t = await r.text();
  if (!r.ok) { let m = t; try { m = JSON.parse(t).message || t; } catch { /* plain */ } throw new Error(String(m)); }
  return t ? JSON.parse(t) : null;
}
async function imap() {
  const c = new Imap(await Deno.connectTls({ hostname: IMAP_HOST, port: 993 }));
  await c.greeting(); await c.login(USER, PASS);
  return c;
}

// ─── AI draft ───
async function draft(threadId: string, ctx: DraftContext & { mailbox?: string | null }) {
  const key = env('ANTHROPIC_API_KEY');
  if (!key) return;
  const from = senderFor(ctx.mailbox);
  try {
    const client = new Anthropic({ apiKey: key, maxRetries: 0, timeout: 40_000 });
    const reply = await client.messages.create({
      model: MODEL, max_tokens: 1200, system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserContent(ctx) }],
      output_config: { effort: 'low', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } }
    // deno-lint-ignore no-explicit-any
    } as any);
    // deno-lint-ignore no-explicit-any
    const d = decideDraft(reply as any, ctx, SENDERS[from]);
    if (!d.ok) { console.warn('draft refused', d.why); return; }
    await rpc('mail_draft_insert', { p_thread: threadId, p_subject: replySubject(ctx.subject), p_body: d.body, p_from: from, p_note: d.note, p_flagged: d.flagged });
  } catch (e) {
    console.error('draft failed', e instanceof Anthropic.APIError ? e.status : (e instanceof Error ? e.message : 'unknown'));
  }
}

// ─── Sync ───
async function sync() {
  if (!PASS) return { error: 'not_configured' };
  const state = await rpc('mail_sync_state', { p_box: BOX });
  const c = await imap();
  let last = 0, validity = 0, imported = 0, skipped = 0, drafts = 0;
  try {
    const sel = await c.select(BOX);
    validity = sel.uidvalidity;
    const fresh = !state || Number(state.uidvalidity) !== validity;
    last = fresh ? 0 : Number(state.last_uid) || 0;
    let uids: number[];
    if (fresh) {
      const d = new Date(Date.now() - BACKFILL_DAYS * 864e5);
      const since = `${d.getUTCDate()}-${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]}-${d.getUTCFullYear()}`;
      uids = await c.search(`SINCE ${since}`);
      if (!uids.length) last = Math.max(0, sel.uidnext - 1);
    } else {
      uids = (await c.search(`UID ${last + 1}:*`)).filter(u => u > last);
    }
    uids.sort((a, b) => a - b);
    for (const uid of uids.slice(0, MAX_PER_RUN)) {
      const head = await c.fetch(uid, 'BODY.PEEK[HEADER]');
      const h = headerMap(new TextDecoder('latin1').decode(head.data || new Uint8Array()));
      const person = fromAPerson(h);
      if (!person.ok) { skipped++; last = uid; await rpc('mail_sync_save', { p_box: BOX, p_uidvalidity: validity, p_last_uid: last, p_error: null }); continue; }
      let subject = '', text = '', fromName = '', to = '', date = '';
      if (head.size <= MAX_SIZE) {
        const full = await c.fetch(uid, 'BODY.PEEK[]');
        const parsed = await PostalMime.parse(full.data || new Uint8Array());
        subject = parsed.subject || '';
        fromName = parsed.from?.name || '';
        to = (parsed.to || []).map((a: { address?: string }) => a.address || '').find((a: string) => SENDERS[a.toLowerCase()]) || emailOf(h['to']);
        date = parsed.date || '';
        text = parsed.text || (parsed.html ? parsed.html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : '');
        if ((parsed.attachments || []).length) text += `\n\n[${parsed.attachments.length} archivo(s) adjunto(s): ábrelos en Zoho]`;
      } else {
        subject = h['subject'] || ''; to = emailOf(h['to']);
        text = '[Correo con archivos grandes: ábrelo en Zoho para leerlo entero]';
      }
      const refs = [...msgIds(h['references']), ...msgIds(h['in-reply-to'])];
      const at = date && !Number.isNaN(Date.parse(date)) ? new Date(Math.min(Date.parse(date), Date.now())).toISOString() : new Date().toISOString();
      const res = await rpc('mail_ingest', { p: {
        from_email: emailOf(h['from']), from_name: fromName, to_email: to || emailOf(h['to']), subject: clip(subject, 300), subject_key: normSubject(subject),
        body: clip(stripQuoted(text), 29000), message_id: msgIds(h['message-id'])[0] || null, in_reply_to: msgIds(h['in-reply-to'])[0] || null,
        refs: refs.join(' ').slice(0, 4000), refs_list: refs, uid, at } });
      last = uid; imported += res && !res.duplicate ? 1 : 0;
      await rpc('mail_sync_save', { p_box: BOX, p_uidvalidity: validity, p_last_uid: last, p_error: null });
      if (res && !res.duplicate && drafts < MAX_DRAFTS_PER_RUN) { drafts++; await draft(res.thread_id, res); }
    }
    await rpc('mail_sync_save', { p_box: BOX, p_uidvalidity: validity, p_last_uid: last, p_error: null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('sync failed', msg);
    await rpc('mail_sync_save', { p_box: BOX, p_uidvalidity: validity || null, p_last_uid: last, p_error: msg.slice(0, 280) }).catch(() => {});
    return { error: 'sync_failed', imported, skipped };
  } finally { await c.logout(); }
  return { ok: true, imported, skipped, drafts };
}

// ─── Send ───
async function send(auth: string, id: number, from: string) {
  if (!PASS) return json(503, { error: 'not_configured' });
  let job: { to: string; name: string | null; subject: string; body: string; from: string; in_reply_to: string | null; references: string | null; thread_id: string };
  try { job = await rpc('mail_send_prepare', { p_id: id, p_from: from }, auth); } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    const code = /admin only/.test(m) ? 'forbidden' : /already sending/.test(m) ? 'already_sending' : /daily limit/.test(m) ? 'daily_limit' : /invalid sender/.test(m) ? 'invalid_sender' : /not found/.test(m) ? 'not_found' : 'error';
    return json(code === 'forbidden' ? 403 : 409, { error: code });
  }
  const subject = replySubject(job.subject);
  const messageId = `<${crypto.randomUUID()}@pathway-languages.com>`;
  const message = buildMessage({ from: job.from, fromName: SENDER_NAMES[job.from] || 'Pathway LS', to: job.to, subject, text: job.body, inReplyTo: job.in_reply_to, references: job.references, id: messageId });
  try {
    const conn = await Deno.connectTls({ hostname: SMTP_HOST, port: 465 });
    await smtpSend(conn, { user: USER, password: PASS, from: job.from, to: job.to, message });
  } catch (e) {
    const code = (e as { code?: number }).code || 0, msg = e instanceof Error ? e.message : String(e);
    console.error('smtp failed', code, msg);
    const why = code === 535 ? 'Zoho rechazó la contraseña de aplicación' : `Zoho no aceptó el envío (${msg.slice(0, 120)})`;
    await rpc('mail_send_failed', { p_id: id, p_error: why }, auth).catch(() => {});
    return json(502, { error: code === 535 ? 'smtp_auth' : 'smtp_failed', detail: why });
  }
  await rpc('mail_send_done', { p_id: id, p_from: job.from, p_message_id: messageId, p_subject: subject }, auth).catch(e => console.error('send_done', e));
  // A copy in Zoho's « Envoyés », so the mailbox stays complete (best effort).
  try { const c = await imap(); try { const box = sentFolder(await c.list()); if (box) await c.append(box, new TextEncoder().encode(message)); } finally { await c.logout(); } }
  catch (e) { console.warn('append sent failed', e instanceof Error ? e.message : e); }
  return json(200, { status: 'sent', to: job.to, from: job.from });
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty */ }
  if (body.action === 'sync') {
    const ok = await rpc('check_cron_secret', { p_secret: req.headers.get('x-cron-secret') || '' }).catch(() => false);
    if (ok !== true) return json(401, { error: 'unauthorized' });
    return json(200, await sync());
  }
  const auth = req.headers.get('Authorization') || '';
  if (!/^Bearer \S+/.test(auth)) return json(401, { error: 'unauthorized' });
  const admin = await rpc('is_admin', {}, auth).catch(() => false);
  if (admin !== true) return json(403, { error: 'forbidden' });
  if (body.action === 'send') return send(auth, Number(body.id), String(body.from || '').toLowerCase());
  if (body.action === 'redraft') {
    const ctx = await rpc('_mail_context', { p_thread: String(body.thread_id || '') }).catch(() => null);
    if (!ctx) return json(404, { error: 'not_found' });
    await draft(String(body.thread_id), ctx);
    return json(200, { ok: true });
  }
  if (body.action === 'sync_now') return json(200, await sync());
  return json(400, { error: 'unknown_action' });
});
