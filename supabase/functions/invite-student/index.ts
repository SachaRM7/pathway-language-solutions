// Supabase Edge Function « invite-student » : envoie l'e-mail d'invitation au Campus.
// Appelée par le Campus après create_invitation (campus/db/003_invitations.sql), qui enregistre
// déjà le nom, le niveau et le professeur. Seuls les professeurs et l'admin peuvent l'utiliser.
//
// Déploiement : Supabase → Edge Functions → Deploy a new function → Via Editor,
// nom « invite-student », coller ce fichier, Deploy. Aucun secret à ajouter :
// SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY sont fournis par Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const SITE = 'https://pathway-languages.com';
const CAMPUS = `${SITE}/campus/`;
const cors = {
  'Access-Control-Allow-Origin': SITE,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'method_not_allowed' });

  const authorization = req.headers.get('Authorization') ?? '';
  const url = Deno.env.get('SUPABASE_URL')!;
  const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
  const { data: staff, error: staffError } = await asCaller.rpc('is_staff');
  if (staffError || staff !== true) return reply(403, { error: 'staff_only' });

  let email = '';
  try { email = String((await req.json()).email ?? '').trim().toLowerCase(); } catch { /* invalid body */ }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return reply(400, { error: 'invalid_email' });

  // The invitation must have been prepared by this caller (or visible to them) with create_invitation.
  const { data: invitation } = await asCaller.from('invitations').select('email, full_name').eq('email', email).maybeSingle();
  if (!invitation) return reply(404, { error: 'invitation_not_found' });

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: CAMPUS, data: { full_name: invitation.full_name } });
  if (error) {
    if (/already (been )?registered|already exists/i.test(error.message)) return reply(200, { status: 'already_registered' });
    return reply(502, { error: 'invite_failed', message: error.message });
  }
  return reply(200, { status: 'invited' });
});
