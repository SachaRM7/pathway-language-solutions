// Supabase Edge Function « zoom-webhook » : reçoit les avis du compte Zoom Pathway
// (début et fin de réunion, enregistrement cloud terminé) et les range dans le Campus
// (campus/db/009_zoom.sql, fonction zoom_event).
//
// Déploiement : Supabase → Edge Functions → Deploy a new function → Via Editor,
// nom « zoom-webhook », coller ce fichier, Deploy. Puis, dans les réglages de la fonction,
// désactiver « Verify JWT » (« Enforce JWT verification ») : c'est Zoom qui appelle, pas un
// utilisateur connecté ; chaque appel est vérifié avec la signature Zoom ci-dessous.
// Secret à ajouter (Edge Functions → Secrets) : ZOOM_WEBHOOK_SECRET = le « Secret Token »
// de l'app Zoom (onglet Features → Event Subscriptions). SUPABASE_URL et
// SUPABASE_SERVICE_ROLE_KEY sont fournis par Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const encoder = new TextEncoder();
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
  return Array.from(signature, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Comparaison en temps constant, pour ne rien laisser deviner de la signature attendue.
function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Lien de lecture sans demander le code : Zoom indique de l'ajouter en « pwd » au lien de partage.
function recordingLink(object: Record<string, any>): string | null {
  const base = object.share_url || (object.recording_files || []).find((f: any) => f.play_url)?.play_url;
  if (!base) return null;
  const pass = object.recording_play_passcode;
  if (!pass || /[?&]pwd=/.test(base)) return base;
  return `${base}${base.includes('?') ? '&' : '?'}pwd=${encodeURIComponent(pass)}`;
}

Deno.serve(async req => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const secret = Deno.env.get('ZOOM_WEBHOOK_SECRET');
  if (!secret) return json(500, { error: 'missing_secret' });

  const raw = await req.text();
  let body: Record<string, any>;
  try { body = JSON.parse(raw); } catch { return json(400, { error: 'bad_json' }); }

  // Zoom vérifie l'adresse en envoyant un jeton à chiffrer avec le Secret Token.
  if (body.event === 'endpoint.url_validation') {
    const plainToken = String(body.payload?.plainToken ?? '');
    return json(200, { plainToken, encryptedToken: await hmacHex(secret, plainToken) });
  }

  const timestamp = req.headers.get('x-zm-request-timestamp') ?? '';
  const signature = req.headers.get('x-zm-signature') ?? '';
  const fresh = Math.abs(Date.now() / 1000 - Number(timestamp)) < 300;
  if (!fresh || !sameText(signature, `v0=${await hmacHex(secret, `v0:${timestamp}:${raw}`)}`)) {
    return json(401, { error: 'bad_signature' });
  }

  const event = String(body.event ?? '');
  if (!['meeting.started', 'meeting.ended', 'recording.completed'].includes(event)) return json(200, { ignored: event });

  const object = body.payload?.object ?? {};
  const files = (object.recording_files || []) as Array<Record<string, any>>;
  const minutes = event === 'recording.completed'
    ? Math.round(Math.max(0, ...files.map(f => (Date.parse(f.recording_end) - Date.parse(f.recording_start)) / 60000).filter(Number.isFinite))) || object.duration || null
    : null;

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { error } = await supabase.rpc('zoom_event', {
    p_event: event,
    p_meeting_id: object.id != null ? String(object.id) : null,
    p_uuid: object.uuid ?? null,
    p_topic: object.topic ?? '',
    p_host_email: object.host_email ?? '',
    p_start: object.start_time ?? null,
    p_end: object.end_time ?? null,
    p_recording_url: event === 'recording.completed' ? recordingLink(object) : null,
    p_recording_minutes: minutes
  });
  if (error) return json(500, { error: 'store_failed' });
  return json(200, { ok: true });
});
