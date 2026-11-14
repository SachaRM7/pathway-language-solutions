// Supabase Edge Function « whatsapp » : la boîte WhatsApp des prospects dans le Campus
// (campus/db/027_whatsapp.sql), onglet « Prospectos » → « WhatsApp ».
//
// • GET  …/functions/v1/whatsapp : vérification du webhook par Meta (hub.verify_token = WA_VERIFY_TOKEN).
// • POST …/functions/v1/whatsapp : les messages et les statuts de livraison envoyés par WhatsApp.
//   Authentifiés par la signature X-Hub-Signature-256 (secret WA_APP_SECRET, Meta), ou, pour un
//   partenaire qui ne signe pas (360dialog), par …/whatsapp?key=<WA_WEBHOOK_KEY>. Sinon : refusé.
//   Chaque message reçu est enregistré (une seule fois, même si le webhook est rejoué), relié à sa
//   fiche du CRM, puis un BROUILLON de réponse est préparé (ANTHROPIC_API_KEY) et les admins
//   reçoivent un e-mail (RESEND_API_KEY, au plus un toutes les 30 min par conversation).
// • POST avec { action: 'send' } depuis le Campus, avec la session d'un admin : envoie un brouillon
//   (modifié ou non) ou un texte libre, seulement dans la fenêtre de 24 h. Rien ne part jamais
//   sans un admin.
// • Fournisseur : WA_PROVIDER = « meta » (par défaut, Cloud API de Meta : WA_TOKEN et
//   WA_PHONE_NUMBER_ID, version WA_GRAPH_VERSION facultative) ou « 360dialog » (WA_TOKEN = clé
//   D360-API-KEY).
// • La clé service ne sert qu'aux fonctions wa_* réservées à la fonction. Le contenu des messages
//   n'est jamais écrit dans les journaux.
//
// Déploiement : Supabase → Edge Functions → Deploy a new function → Via Editor, nom « whatsapp » ;
// coller ce fichier dans index.ts, ajouter un fichier logic.ts (même dossier) et y coller logic.ts,
// Deploy, puis DÉSACTIVER « Verify JWT » : WhatsApp n'a pas de session Supabase ; la fonction
// vérifie elle-même chaque appel. Secrets : voir campus/db/SQL_A_COPIER.md (section 027).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import Anthropic from 'npm:@anthropic-ai/sdk@1.8.0';
import { MODEL, OUTPUT_SCHEMA, createHandler, type Caller, type Env } from './logic.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const env = (): Env => ({
  verifyToken: Deno.env.get('WA_VERIFY_TOKEN') || undefined,
  appSecret: Deno.env.get('WA_APP_SECRET') || undefined,
  webhookKey: Deno.env.get('WA_WEBHOOK_KEY') || undefined,
  phoneNumberId: Deno.env.get('WA_PHONE_NUMBER_ID') || undefined,
  provider: Deno.env.get('WA_PROVIDER') || 'meta',
  token: Deno.env.get('WA_TOKEN') || undefined,
  graphVersion: Deno.env.get('WA_GRAPH_VERSION') || undefined,
  anthropicKey: Deno.env.get('ANTHROPIC_API_KEY') || undefined,
  resendKey: Deno.env.get('RESEND_API_KEY') || undefined
});

// The Campus user, read with their own session: wa_prepare_send checks again that they are admin.
async function caller(authorization: string): Promise<Caller | null> {
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: who } = await asUser.auth.getUser(authorization.slice(7));
  if (!who?.user?.id) return null;
  const { data: admin } = await asUser.rpc('is_admin');
  return { isAdmin: admin === true, rpc: (fn, args) => asUser.rpc(fn, args) };
}

async function model(system: string, user: string, timeoutMs: number) {
  const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')!, maxRetries: 0, timeout: timeoutMs });
  try {
    return await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: user }],
      output_config: { effort: 'low', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } }
    });
  } catch (e) {
    // Status only: never the conversation.
    throw { status: e instanceof Anthropic.APIError ? e.status ?? 'connection' : 'unknown' };
  }
}

// deno-lint-ignore no-explicit-any
const runtime = (globalThis as any).EdgeRuntime;
Deno.serve(createHandler({
  env,
  db: { rpc: (fn, args) => service.rpc(fn, args) },
  caller,
  model,
  fetch: (input, init) => fetch(input, init),
  background: p => { if (runtime && typeof runtime.waitUntil === 'function') { runtime.waitUntil(p); return true; } return false; },
  log: (...args) => console.error('whatsapp:', ...args)
}));
