// Supabase Edge Function « placement-followups » : envoie les trois e-mails qui suivent le test de
// niveau du site (campus/db/029_relances_embudo.sql, 037) — le résultat et l'invitation à compléter le
// test avec un professeur tout de suite, puis deux rappels à 2 et 5 jours (emails.ts).
// Appelée toutes les 5 minutes par pg_cron avec le secret partagé (SQL 014). Rien ne part pour une
// personne inscrite, élève, passée à une autre étape du suivi ou désinscrite.
//
// Déploiement : nom « placement-followups », « Verify JWT » désactivé (pg_cron l'appelle avec le
// secret partagé ; tout autre appel automatique est refusé).
// Secrets : RESEND_API_KEY (déjà ajouté).
// Test (admin du Campus uniquement) : POST { "test": true, "level": "B1", "lang": "es" } envoie les
// trois e-mails d'exemple à l'adresse de l'admin connecté.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { renderFollowup, type Due } from './emails.ts';

const FROM = 'Pathway Language Solutions <hola@pathway-languages.com>';
const REPLY_TO = 'contacto@pathway-languages.com';
const SITE = 'https://pathway-languages.com';
const cors = { 'Access-Control-Allow-Origin': SITE, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const links = () => ({ site: SITE });

async function send(key: string, to: string, subject: string, html: string, unsubscribeUrl: string) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM, to: [to], reply_to: REPLY_TO, subject, html,
      headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:${REPLY_TO}?subject=baja>` }
    })
  });
}

async function adminEmail(req: Request): Promise<string | null> {
  const authorization = req.headers.get('Authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) return null;
  const asCaller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
  const { data: user } = await asCaller.auth.getUser();
  const { data: role } = await asCaller.rpc('my_role');
  return user?.user?.email && role === 'admin' ? user.user.email : null;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const body = await req.json().catch(() => ({}));
  const key = Deno.env.get('RESEND_API_KEY');

  // Example emails, sent only to the admin who asks.
  if (body && body.test) {
    const to = await adminEmail(req);
    if (!to) return json(403, { error: 'admin_only' });
    if (!key) return json(500, { error: 'missing_resend_key' });
    const level = ['A1', 'A2', 'B1', 'B2'].includes(body.level) ? body.level : 'A2';
    const lang = ['es', 'fr', 'en', 'de'].includes(body.lang) ? body.lang : 'es';
    const statuses: number[] = [];
    for (const step of [0, 1, 2]) {
      const mail = renderFollowup({ id: '', email: to, level, overall: 40, mode: 'express', lang, step, unsub_token: '00000000-0000-0000-0000-000000000000', full_name: null,
        detail: { skills: { reading: 45, listening: 30, grammarVocabulary: 52 } } }, links());
      const res = await send(key, to, `[Prueba ${step + 1}/3] ${mail.subject}`, mail.html, mail.unsubscribeUrl);
      statuses.push(res.status);
      await sleep(600);
    }
    return statuses.every(s => s >= 200 && s < 300) ? json(200, { ok: true, test: true, to }) : json(502, { error: 'send_failed', statuses });
  }

  // Automatic run: only pg_cron, which sends the shared secret (db/014_cron_secreto.sql).
  const { data: allowed } = await supabase.rpc('check_cron_secret', { p_secret: req.headers.get('x-cron-secret') ?? '' });
  if (allowed !== true) return json(401, { error: 'unauthorized' });
  const { data, error } = await supabase.rpc('followups_due', { p_limit: 20 });
  if (error) return json(500, { error: 'query_failed' });
  const due = (data || []) as Due[];
  if (!due.length) return json(200, { sent: 0 });
  if (!key) return json(500, { error: 'missing_resend_key' });

  let sent = 0, failed = 0;
  for (const d of due) {
    const { data: claimed } = await supabase.rpc('claim_followup', { p_id: d.id, p_step: d.step });
    if (claimed !== true) continue;
    let status = 0, err: string | null = null;
    try {
      const mail = renderFollowup(d, links());
      const res = await send(key, d.email, mail.subject, mail.html, mail.unsubscribeUrl);
      status = res.status;
      if (!res.ok) err = (await res.text().catch(() => '')).slice(0, 300);
    } catch (e) { err = String(e).slice(0, 300); }
    await supabase.rpc('followup_sent', { p_id: d.id, p_step: d.step, p_status: status, p_error: err });
    if (status >= 200 && status < 300) sent++; else failed++;
    await sleep(600); // Resend: at most 2 emails per second
  }
  return json(200, { sent, failed });
});
