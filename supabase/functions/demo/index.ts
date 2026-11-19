// Supabase Edge Function « demo » (campus/db/044_demo_aislada.sql, 045_demo_datos.sql): the Campus demo.
//
// The demo is a separate world (profiles.is_demo): a teacher, Julien Moreau, and four A2 students with a
// realistic history (classes, recordings, streak, review cards, messages, absences, end of level). The
// real team never sees it, no scheduled task writes to it, the CRM ignores it.
//
// • POST { action: 'enter', as: 'lucia' | 'mateo' | 'valentina' | 'diego' | 'profesor' } from the Campus
//   (team session): makes sure the demo accounts exist, refreshes the data if older than 6 days, and
//   returns a one-time sign-in token for that demo account (no e-mail is sent: the addresses are
//   @example.com). The Campus keeps the team member's session to come back with one click.
// • POST { action: 'reset' } (team session): rebuilds the demo data now.
//
// Deploy: name « demo », Verify JWT OFF (the function checks the caller itself). No secret needed.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const SITE = 'https://pathway-languages.com';
const cors = { 'Access-Control-Allow-Origin': SITE, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// The only accounts this function can sign in to.
const ACCOUNTS: Record<string, { email: string; name: string }> = {
  profesor: { email: 'profesor.demo@example.com', name: 'Julien Moreau' },
  lucia: { email: 'lucia.demo@example.com', name: 'Lucía Ramírez' },
  mateo: { email: 'mateo.demo@example.com', name: 'Mateo Torres' },
  valentina: { email: 'valentina.demo@example.com', name: 'Valentina Quispe' },
  diego: { email: 'diego.demo@example.com', name: 'Diego Fernández' }
};
const STALE_MS = 6 * 864e5;

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const authorization = req.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) return json(401, { error: 'unauthorized' });
  const url = Deno.env.get('SUPABASE_URL')!;
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: staff } = await asUser.rpc('is_staff');
  if (staff !== true) return json(403, { error: 'team_only' });
  const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const body = await req.json().catch(() => ({})) as { action?: string; as?: string };

  // The accounts are created once (no e-mail: the address is confirmed directly).
  async function ensureAccounts() {
    for (const a of Object.values(ACCOUNTS)) {
      const { error } = await service.auth.admin.createUser({ email: a.email, email_confirm: true, user_metadata: { full_name: a.name } });
      if (error && !/already|registered|exists/i.test(error.message)) throw error;
    }
  }
  async function seed() {
    await ensureAccounts();
    const { error } = await service.rpc('demo_seed');
    if (error) throw error;
  }

  try {
    if (body.action === 'reset') {
      await seed();
      return json(200, { ok: true });
    }
    if (body.action !== 'enter' || !body.as || !ACCOUNTS[body.as]) return json(400, { error: 'invalid_request' });
    const { data: at } = await service.rpc('demo_seeded_at');
    if (!at || Date.now() - new Date(at as string).getTime() > STALE_MS) await seed();
    const { data, error } = await service.auth.admin.generateLink({ type: 'magiclink', email: ACCOUNTS[body.as].email });
    if (error || !data?.properties?.hashed_token) throw error || new Error('no_token');
    return json(200, { token_hash: data.properties.hashed_token, name: ACCOUNTS[body.as].name });
  } catch (e) {
    console.error('demo:', e instanceof Error ? e.message : e);
    return json(500, { error: 'demo_failed' });
  }
});
