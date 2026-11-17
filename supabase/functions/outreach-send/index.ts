// Supabase Edge Function « outreach-send » : envoie un brouillon de difusión par le SMTP de Zoho.
// campus/db/031_difusion_envio.sql. Appelée par le Campus (« Prospectos » → « Difusión » →
// « Enviar desde ryan@ ») avec la session de l'admin ; les fonctions SQL revérifient le rôle.
//
// • outreach_send_prepare : brouillon de correo pas encore envoyé, contact actif avec une adresse,
//   20 envois sur 24 h glissantes au plus (retry_at : quand le suivant pourra partir), verrou de
//   2 minutes contre le double clic.
// • Envoi SMTP (TLS implicite, port 465) avec le compte principal Zoho ; l'expéditeur est l'alias
//   ryan@. Texte brut UTF-8, avec une ligne de désinscription.
// • outreach_send_done : la fiche passe à « Contactado » (relance à 7 jours). En cas d'échec,
//   outreach_send_failed lève le verrou et garde la raison dans l'historique.
//
// Déploiement : nom « outreach-send », Verify JWT ACTIVÉ. Secret à ajouter : ZOHO_SMTP_PASSWORD
// (mot de passe d'application Zoho du compte principal). Réglages facultatifs : ZOHO_SMTP_HOST,
// ZOHO_SMTP_PORT, ZOHO_SMTP_USER, OUTREACH_FROM_EMAIL, OUTREACH_FROM_NAME.
//
// Ce fichier n'importe rien : la construction du message et le dialogue SMTP se testent avec Node.

const SITE = 'https://pathway-languages.com';
const cors = {
  'Access-Control-Allow-Origin': SITE,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export const FOOTER = '\n\n—\nPathway Language Solutions · https://pathway-languages.com\nSi prefieres no recibir más mensajes nuestros, respóndenos «no» y no volveremos a escribirte.';

const b64 = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();
const encodeWord = (s: string) => /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`;

export type Mail = { fromName: string; fromEmail: string; to: string; subject: string; text: string; date?: Date; id?: string };

// Message RFC 5322 en texte brut, corps en base64 (pas de ligne commençant par un point).
export function buildMessage(m: Mail): string {
  const domain = m.fromEmail.split('@')[1] || 'pathway-languages.com';
  const body = (m.text.replace(/\r\n?/g, '\n').trim() + FOOTER).replace(/\n/g, '\r\n');
  const encoded = b64(body).replace(/.{1,76}/g, '$&\r\n');
  return [
    `From: ${encodeWord(oneLine(m.fromName))} <${m.fromEmail}>`,
    `To: <${oneLine(m.to)}>`,
    `Reply-To: <${m.fromEmail}>`,
    `Subject: ${encodeWord(oneLine(m.subject))}`,
    `Date: ${(m.date || new Date()).toUTCString()}`,
    `Message-ID: <${m.id || crypto.randomUUID()}@${domain}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encoded
  ].join('\r\n');
}

export interface Conn { read(p: Uint8Array): Promise<number | null>; write(p: Uint8Array): Promise<number>; close(): void }
export class SmtpError extends Error { code: number; constructor(code: number, message: string) { super(message); this.code = code; } }

// Dialogue SMTP minimal : EHLO, AUTH LOGIN, MAIL FROM, RCPT TO, DATA, QUIT.
export async function smtpSend(conn: Conn, o: { user: string; password: string; from: string; to: string; message: string; helo?: string }) {
  const enc = new TextEncoder(), dec = new TextDecoder();
  let buf = '';
  const readReply = async (): Promise<{ code: number; text: string }> => {
    for (;;) {
      const lines = buf.split('\r\n');
      for (let i = 0; i < lines.length - 1; i++) {
        if (/^\d{3} /.test(lines[i]) || /^\d{3}$/.test(lines[i])) {
          const text = lines.slice(0, i + 1).join('\n');
          buf = lines.slice(i + 1).join('\r\n');
          return { code: Number(lines[i].slice(0, 3)), text };
        }
      }
      const chunk = new Uint8Array(4096);
      const n = await conn.read(chunk);
      if (n === null) throw new SmtpError(0, 'connection closed');
      buf += dec.decode(chunk.subarray(0, n));
    }
  };
  const send = async (line: string) => { await conn.write(enc.encode(line + '\r\n')); };
  const expect = async (ok: number[], step: string) => {
    const r = await readReply();
    if (!ok.includes(r.code)) throw new SmtpError(r.code, `${step}: ${r.text.slice(0, 200)}`);
    return r;
  };
  try {
    await expect([220], 'greeting');
    await send(`EHLO ${o.helo || 'pathway-languages.com'}`); await expect([250], 'EHLO');
    await send('AUTH LOGIN'); await expect([334], 'AUTH');
    await send(b64(o.user)); await expect([334], 'AUTH user');
    await send(b64(o.password)); await expect([235], 'AUTH password');
    await send(`MAIL FROM:<${o.from}>`); await expect([250], 'MAIL FROM');
    await send(`RCPT TO:<${o.to}>`); await expect([250, 251], 'RCPT TO');
    await send('DATA'); await expect([354], 'DATA');
    await conn.write(enc.encode(o.message.replace(/\r\n\./g, '\r\n..') + '\r\n.\r\n'));
    await expect([250], 'message');
    try { await send('QUIT'); } catch { /* ignore */ }
  } finally {
    try { conn.close(); } catch { /* already closed */ }
  }
}

// Erreur SQL ou SMTP → code court pour le Campus.
export function errorCode(message: string): string {
  const m = String(message || '');
  for (const [k, re] of [['already_sent', /already sent/], ['no_email', /no email/], ['no_subject', /no subject/], ['daily_limit', /daily limit/],
    ['already_sending', /already sending/], ['contact_closed', /contact closed/], ['not_email_draft', /not an email draft/],
    ['forbidden', /admin only/], ['not_found', /not found/]] as [string, RegExp][]) if (re.test(m)) return k;
  return 'error';
}

const D = (globalThis as any).Deno;
if (D && typeof D.serve === 'function') {
  D.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
    if (req.method !== 'POST') return reply(405, { error: 'method_not_allowed' });
    const env = (k: string, d = '') => D.env.get(k) || d;
    const password = env('ZOHO_SMTP_PASSWORD');
    if (!password) return reply(503, { error: 'not_configured' });
    let eventId = 0;
    try { eventId = Number((await req.json()).event_id); } catch { /* invalid body */ }
    if (!Number.isInteger(eventId) || eventId <= 0) return reply(400, { error: 'invalid_event' });

    const url = env('SUPABASE_URL'), anon = env('SUPABASE_ANON_KEY'), auth = req.headers.get('Authorization') || '';
    const rpc = async (fn: string, body: Record<string, unknown>) => {
      const r = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: anon, Authorization: auth, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const t = await r.text();
      if (!r.ok) { let m = t; try { m = JSON.parse(t).message || t; } catch { /* plain text */ } throw new Error(String(m)); }
      return t ? JSON.parse(t) : null;
    };

    let job: { to: string; subject: string; text: string; name: string };
    try { job = await rpc('outreach_send_prepare', { p_event: eventId }); } catch (e) {
      const msg = e instanceof Error ? e.message : String(e), code = errorCode(msg);
      const retryAt = code === 'daily_limit' ? (/daily limit (\S+)/.exec(msg) || [])[1] || null : null;
      return reply(code === 'forbidden' ? 403 : code === 'not_found' ? 404 : code === 'daily_limit' ? 429 : 409, { error: code, retry_at: retryAt });
    }
    const fromEmail = env('OUTREACH_FROM_EMAIL', 'ryan@pathway-languages.com'), fromName = env('OUTREACH_FROM_NAME', 'Ryan - Pathway LS');
    try {
      const conn = await D.connectTls({ hostname: env('ZOHO_SMTP_HOST', 'smtppro.zoho.com'), port: Number(env('ZOHO_SMTP_PORT', '465')) });
      await smtpSend(conn, { user: env('ZOHO_SMTP_USER', 'contact@pathway-languages.com'), password, from: fromEmail, to: job.to,
        message: buildMessage({ fromName, fromEmail, to: job.to, subject: job.subject, text: job.text }) });
    } catch (e) {
      const code = e instanceof SmtpError ? e.code : 0, msg = e instanceof Error ? e.message : String(e);
      console.error('smtp failed', code, msg);
      const why = code === 535 ? 'Zoho rechazó la contraseña de aplicación' : code === 553 || code === 550 ? `Zoho rechazó el envío (${msg.slice(0, 120)})` : `Error de conexión con Zoho (${msg.slice(0, 120)})`;
      try { await rpc('outreach_send_failed', { p_event: eventId, p_error: why }); } catch (err) { console.error('unlock failed', err); }
      return reply(502, { error: code === 535 ? 'smtp_auth' : 'smtp_failed', detail: why });
    }
    try {
      const contact = await rpc('outreach_send_done', { p_event: eventId, p_from: fromEmail });
      return reply(200, { status: 'sent', to: job.to, from: fromEmail, contact });
    } catch (e) {
      console.error('send_done failed', e);
      return reply(200, { status: 'sent', to: job.to, from: fromEmail, warning: 'status_not_updated' });
    }
  });
}
