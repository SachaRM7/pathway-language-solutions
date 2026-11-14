// Supabase Edge Function « campus-assistant » : répond en premier aux questions pratiques d'un
// élève dans « Mensajes » (campus/db/025_mensajes.sql), avec ses seules données, et passe le
// reste à son professeur.
//
// • Appelée par le Campus, avec la session de l'élève, juste après qu'il a écrit. Toutes les
//   données sont lues avec CETTE session : les règles d'accès (RLS) de la base s'appliquent,
//   l'assistant ne peut donc rien lire d'un autre élève.
// • Réglage « Respuestas del asistente » (Ajustes) : désactivé (par défaut), la réponse est un
//   brouillon que l'équipe relit et envoie ; activé, elle part tout de suite. L'élève la voit
//   signée « Equipo Pathway ».
// • La clé service ne sert qu'à une chose : écrire la réponse de l'assistant et l'état de la
//   conversation, par assistant_reply().
// • Sans clé ANTHROPIC_API_KEY, si l'API ne répond pas, si l'élève a atteint ses 20 réponses du
//   jour ou si la réponse n'est pas sûre : pas de réponse inventée, la question passe au
//   professeur avec « Le pasamos tu pregunta a tu profesor. ». La messagerie marche sans elle.
// • Le contenu des messages n'est jamais écrit dans les journaux.
//
// Déploiement : Supabase → Edge Functions → Deploy a new function → Via Editor, nom
// « campus-assistant » ; coller ce fichier dans index.ts, ajouter un fichier logic.ts (même
// dossier) et y coller logic.ts, Deploy. Secret : ANTHROPIC_API_KEY (voir db/SQL_A_COPIER.md).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import Anthropic from 'npm:@anthropic-ai/sdk@1.8.0';
import { MODEL, DAILY_CAP, SYSTEM_PROMPT, OUTPUT_SCHEMA, applyMode, buildContext, buildUserContent, decide, fallback, type Decision, type Raw } from './logic.ts';

const SITE = 'https://pathway-languages.com';
const cors = { 'Access-Control-Allow-Origin': SITE, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// A missing migration or table only removes that part of the context.
async function safe<T>(p: PromiseLike<{ data: T | null; error: unknown }>): Promise<T | null> {
  try { const { data, error } = await p; return error ? null : data; } catch { return null; }
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const authorization = req.headers.get('Authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) return json(401, { error: 'unauthorized' });
  const url = Deno.env.get('SUPABASE_URL')!;
  // The student's own session: everything below is read under the database's access rules.
  const asStudent = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: who } = await asStudent.auth.getUser(authorization.slice(7));
  const uid = who?.user?.id;
  if (!uid) return json(401, { error: 'unauthorized' });
  const { data: role } = await asStudent.rpc('my_role');
  if (role !== 'student') return json(403, { error: 'students_only' });

  let messageId = 0;
  try { messageId = Number((await req.json()).message_id); } catch { /* invalid body */ }
  if (!Number.isSafeInteger(messageId) || messageId <= 0) return json(400, { error: 'invalid_message' });

  // The question: the student's own, recent, not answered yet.
  const { data: q } = await asStudent.from('messages').select('id, thread_id, author_kind, author_id, body, created_at').eq('id', messageId).maybeSingle();
  if (!q || q.author_kind !== 'student' || q.author_id !== uid) return json(404, { error: 'unknown_message' });
  if (Date.now() - Date.parse(q.created_at) > 15 * 60000) return json(409, { error: 'too_old' });
  // Already answered (a draft included, which the student cannot read) and answers used in 24 h.
  const { data: st } = await asStudent.rpc('assistant_status', { p_message: q.id });
  if (!st) return json(404, { error: 'unknown_message' });
  if (st.answered) return json(200, { status: 'already_answered' });

  // « Respuestas del asistente » (Ajustes): off → the answer is a draft the team sends.
  const { data: autoReply } = await asStudent.rpc('assistant_auto_reply');
  const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const post = async (decision: Decision) => {
    let d = applyMode(decision, autoReply === true);
    let { error } = await service.rpc('assistant_reply', { p_message: q.id, p_body: d.body, p_escalate: d.escalate, p_kind: d.kind, p_reason: d.reason, p_draft: d.draft });
    if (error && /assistant_cap/.test(error.message || '') && d.kind !== 'fallback') {
      d = applyMode(fallback('Límite diario del asistente'), autoReply === true);
      ({ error } = await service.rpc('assistant_reply', { p_message: q.id, p_body: d.body, p_escalate: true, p_kind: 'fallback', p_reason: d.reason }));
    }
    if (error) { console.error('assistant_reply failed', error.code || ''); return json(500, { error: 'save_failed' }); }
    return json(200, { status: d.draft ? 'draft' : d.kind, escalated: d.escalate });
  };

  if (Number(st.used) >= DAILY_CAP) return post(fallback('Límite diario del asistente'));
  const key = Deno.env.get('ANTHROPIC_API_KEY');
  if (!key) return post(fallback('Asistente sin clave (ANTHROPIC_API_KEY)'));

  // The student's data, read with their session.
  const profile = await safe<Record<string, unknown>>(asStudent.from('profiles').select('*').eq('id', uid).single());
  const level = (profile?.level as string) || 'A2';
  const groupId = (profile?.group_id as string) || null;
  const [schedule, teacher, attendance, absences, contract, progression, taught, runs, report, history] = await Promise.all([
    safe(asStudent.rpc('my_schedule')), safe(asStudent.rpc('my_teacher')), safe(asStudent.rpc('my_attendance')),
    safe(asStudent.rpc('my_absences')), safe(asStudent.rpc('contract_status')), safe(asStudent.rpc('progression_settings')),
    safe<{ number: number }[]>(asStudent.from('taught_numbers').select('number').eq('level', level)),
    safe<{ unit_id: string; total: number; first_try_correct: number }[]>(asStudent.from('lesson_runs').select('unit_id, total, first_try_correct').eq('user_id', uid)),
    groupId ? safe<{ scheduled_at: string; unit_numbers: number[] }[]>(asStudent.from('session_reports').select('scheduled_at, unit_numbers').eq('group_id', groupId).order('scheduled_at', { ascending: false }).limit(1)) : Promise.resolve(null),
    safe<{ author_kind: string; body: string }[]>(asStudent.from('messages').select('author_kind, body').eq('thread_id', q.thread_id).lt('id', q.id).order('id', { ascending: false }).limit(6))
  ]);
  const raw: Raw = {
    profile: profile as Raw['profile'], teacher: teacher as Raw['teacher'], schedule: schedule as Raw['schedule'],
    attendance: attendance as Raw['attendance'], absences: absences as Raw['absences'], contract: contract as Raw['contract'],
    progression: progression as Raw['progression'], taughtNumbers: taught ? taught.map(t => t.number) : null,
    lastReport: report && report[0] ? report[0] : null,
    unitsPassed: runs ? new Set(runs.filter(r => r.first_try_correct >= 0.75 * r.total).map(r => r.unit_id)).size : null
  };
  const ctx = buildContext(raw);
  const past = (history || []).reverse().map(h => ({ kind: h.author_kind, body: h.body }));

  let reply: Anthropic.Message | null = null;
  try {
    const client = new Anthropic({ apiKey: key, maxRetries: 1, timeout: 25_000 });
    reply = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserContent(ctx, past, q.body) }],
      output_config: { effort: 'low', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } }
    });
  } catch (e) {
    // Status only: never the question or the context.
    const status = e instanceof Anthropic.APIError ? e.status ?? 'connection' : 'unknown';
    console.error('anthropic call failed', status);
    return post(fallback(e instanceof Anthropic.RateLimitError ? 'Asistente saturado' : 'Asistente no disponible'));
  }
  return post(decide(reply, ctx, q.body));
});
