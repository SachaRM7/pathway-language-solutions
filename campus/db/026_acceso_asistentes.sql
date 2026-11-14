-- Campus Pathway · 026 · accès limité et journalisé pour les assistants IA de l'équipe
-- À exécuter après 025 (SQL Editor → New query → Run), puis déployer la fonction « pathway-mcp »
-- (avec « Verify JWT » désactivé : elle vérifie ses propres clés, voir SQL_A_COPIER.md).
--
-- • Les assistants de l'équipe (bots Claude Code ou Codex sur AppuBot, hors du Campus) passent par
--   un serveur MCP, la fonction « pathway-mcp ». Chacun a sa clé, créée par un admin dans
--   « Ajustes » → « Accesos de asistentes », avec un seul rôle :
--     admisiones  : prospects (liste, fiche, note, brouillon de message, prochaine action) ;
--     seguimiento : élèves « à risque » et résumé de la semaine par professeur, sans coordonnées ;
--     gestion     : chiffres du mois (élèves actifs, inscriptions, cours, heures par professeur) ;
--     marketing   : chiffres par origine et par campagne, sans nom, e-mail ni téléphone.
-- • La clé n'est montrée qu'une fois, à la création ; seule son empreinte SHA-256 est gardée.
--   Elle expire après 90 jours et peut être révoquée à tout moment.
-- • Un assistant ne fait jamais rien « en admin » : il n'invite pas, n'archive pas, ne change pas
--   d'étape et n'envoie rien. Il lit, et il laisse des notes ou des brouillons (nouveau type
--   « draft » dans l'historique d'un prospect) que l'équipe relit, copie et envoie elle-même.
-- • Chaque appel est inscrit au registre (agent_actions), consultable par les admins. Au plus
--   60 appels par heure et par clé.
-- • Les fonctions de lecture ne sont appelables qu'avec la clé service (par la fonction
--   pathway-mcp), et chacune revérifie la clé et son rôle.

begin;

-- Pour tirer la clé au hasard (déjà présent sur Supabase, dans le schéma « extensions »).
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────
create table public.agent_tokens (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  scope text not null check (scope in ('admisiones', 'seguimiento', 'gestion', 'marketing')),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  token_hint text not null check (length(token_hint) <= 16),
  active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  expires_at timestamptz not null default now() + interval '90 days',
  revoked_at timestamptz,
  revoked_by uuid references public.profiles (id) on delete set null
);

create table public.agent_actions (
  id bigint generated always as identity primary key,
  token_id uuid references public.agent_tokens (id) on delete set null,
  token_name text check (length(token_name) <= 80),
  scope text check (length(scope) <= 20),
  tool text not null check (length(tool) between 1 and 64),
  args_summary text check (length(args_summary) <= 1000),
  status text not null check (status in ('ok', 'error', 'invalid', 'forbidden', 'unknown_tool', 'rate_limited', 'not_found')),
  detail text check (length(detail) <= 300),
  created_at timestamptz not null default now()
);
create index agent_actions_token on public.agent_actions (token_id, created_at desc);
create index agent_actions_recent on public.agent_actions (created_at desc);

alter table public.agent_tokens enable row level security;
alter table public.agent_actions enable row level security;
revoke all on public.agent_tokens, public.agent_actions from anon, authenticated;

-- Historique d'un prospect : brouillons de message et auteur « assistant ».
alter table public.prospect_events drop constraint if exists prospect_events_kind_check;
alter table public.prospect_events add constraint prospect_events_kind_check check (kind in ('auto', 'note', 'draft'));
alter table public.prospect_events add column if not exists agent text check (length(agent) <= 80);

-- La fiche renvoie aussi l'assistant auteur d'une ligne (remplace celle du 023).
create or replace function public.crm_prospect(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p prospects;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into p from prospects where id = p_id;
  if not found then return null; end if;
  return public._crm_json(p) || jsonb_build_object(
    'events', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'kind', e.kind, 'topic', e.topic, 'body', e.body,
        'author', (select full_name from profiles where id = e.author_id), 'agent', e.agent, 'created_at', e.created_at) order by e.created_at desc, e.id desc)
      from prospect_events e where e.prospect_id = p.id), '[]'::jsonb),
    'tests', coalesce((select jsonb_agg(jsonb_build_object('level', r.level, 'overall', r.overall, 'mode', r.mode, 'created_at', r.created_at) order by r.created_at desc)
      from placement_results r where p.email is not null and r.email = p.email), '[]'::jsonb),
    'requests', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'created_at', r.created_at, 'handled_at', r.handled_at) order by r.created_at desc)
      from enrollment_requests r where p.email is not null and r.email = p.email), '[]'::jsonb));
end $$;

-- ─────────────────────────────────────────────────────────────
-- Administration des clés (admins seulement)
-- ─────────────────────────────────────────────────────────────
create function public._agent_hash(p_token text) returns text
language sql immutable as $$ select encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex') $$;

-- Crée une clé et la renvoie en clair, une seule fois : seule son empreinte est gardée.
create function public.agent_token_create(p_name text, p_scope text, p_days int default 90) returns jsonb
language plpgsql security definer set search_path = public as $$
declare tok text; t agent_tokens;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if length(trim(coalesce(p_name, ''))) not between 1 and 80 then raise exception 'name required (80 characters max)'; end if;
  if p_scope is null or p_scope not in ('admisiones', 'seguimiento', 'gestion', 'marketing') then raise exception 'invalid scope'; end if;
  if coalesce(p_days, 90) not between 1 and 365 then raise exception 'invalid duration'; end if;
  if (select count(*) from agent_tokens where active and expires_at > now()) >= 20 then raise exception 'too many active tokens'; end if;
  tok := 'pwa_' || encode(extensions.gen_random_bytes(32), 'hex');
  insert into agent_tokens (name, scope, token_hash, token_hint, created_by, expires_at)
  values (trim(p_name), p_scope, public._agent_hash(tok), left(tok, 8) || '…', auth.uid(), now() + make_interval(days => coalesce(p_days, 90)))
  returning * into t;
  return jsonb_build_object('id', t.id, 'name', t.name, 'scope', t.scope, 'hint', t.token_hint, 'expires_at', t.expires_at, 'token', tok);
end $$;

-- Liste des clés, sans empreinte.
create function public.agent_tokens_list() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'scope', t.scope, 'hint', t.token_hint,
      'status', case when not t.active then 'revoked' when t.expires_at <= now() then 'expired' else 'active' end,
      'created_by', (select full_name from profiles where id = t.created_by), 'created_at', t.created_at,
      'last_used_at', t.last_used_at, 'expires_at', t.expires_at, 'revoked_at', t.revoked_at,
      'calls_24h', (select count(*) from agent_actions a where a.token_id = t.id and a.created_at > now() - interval '24 hours'))
    order by (t.active and t.expires_at > now()) desc, t.created_at desc) from agent_tokens t), '[]'::jsonb);
end $$;

create function public.agent_token_revoke(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  update agent_tokens set active = false, revoked_at = now(), revoked_by = auth.uid() where id = p_id and active;
  if not found then raise exception 'not found'; end if;
end $$;

-- Registre : les dernières actions (100 par défaut, 200 au plus).
create function public.agent_actions_list(p_limit int default 100) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'token', coalesce(a.token_name, '—'), 'scope', a.scope, 'tool', a.tool,
      'args', a.args_summary, 'status', a.status, 'detail', a.detail, 'created_at', a.created_at) order by a.created_at desc, a.id desc)
    from (select * from agent_actions order by created_at desc, id desc limit greatest(1, least(coalesce(p_limit, 100), 200))) a), '[]'::jsonb);
end $$;

-- ─────────────────────────────────────────────────────────────
-- Pour la fonction pathway-mcp (clé service seulement)
-- ─────────────────────────────────────────────────────────────
-- La clé valide (active, non expirée), et le nombre d'appels de la dernière heure. Null sinon.
create function public.agent_session(p_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t agent_tokens;
begin
  select * into t from agent_tokens where token_hash = p_hash and active and expires_at > now();
  if not found then return null; end if;
  update agent_tokens set last_used_at = now() where id = t.id;
  return jsonb_build_object('id', t.id, 'name', t.name, 'scope', t.scope, 'expires_at', t.expires_at, 'limit', 60,
    'calls_last_hour', (select count(*) from agent_actions a where a.token_id = t.id and a.created_at > now() - interval '1 hour' and a.status <> 'rate_limited'));
end $$;

-- Chaque outil revérifie la clé, son rôle et la limite horaire.
create function public._agent_require(p_hash text, p_scope text) returns public.agent_tokens
language plpgsql security definer set search_path = public as $$
declare t agent_tokens;
begin
  select * into t from agent_tokens where token_hash = p_hash and active and expires_at > now();
  if not found then raise exception 'agent: unauthorized'; end if;
  if t.scope <> p_scope then raise exception 'agent: forbidden'; end if;
  if (select count(*) from agent_actions a where a.token_id = t.id and a.created_at > now() - interval '1 hour' and a.status <> 'rate_limited') >= 60 then
    raise exception 'agent: rate_limited';
  end if;
  return t;
end $$;

-- Inscrit un appel au registre (résumé des arguments déjà raccourci par la fonction).
create function public.agent_log(p_hash text, p_tool text, p_args text, p_status text, p_detail text default null) returns void
language plpgsql security definer set search_path = public as $$
declare t agent_tokens;
begin
  select * into t from agent_tokens where token_hash = p_hash;
  insert into agent_actions (token_id, token_name, scope, tool, args_summary, status, detail)
  values (t.id, t.name, t.scope, left(coalesce(nullif(p_tool, ''), '?'), 64), left(p_args, 1000),
    case when p_status in ('ok', 'error', 'invalid', 'forbidden', 'unknown_tool', 'rate_limited', 'not_found') then p_status else 'error' end,
    left(p_detail, 300));
end $$;

-- Lecture des arguments (déjà validés par la fonction ; revérifiés ici).
create function public._agent_text(p_args jsonb, p_key text, p_max int, p_required boolean default false) returns text
language plpgsql immutable as $$
declare v text := nullif(trim(coalesce(p_args ->> p_key, '')), '');
begin
  if v is null and p_required then raise exception 'agent: invalid % (required)', p_key; end if;
  if length(v) > p_max then raise exception 'agent: invalid % (% characters max)', p_key, p_max; end if;
  return v;
end $$;
create function public._agent_int(p_args jsonb, p_key text, p_min int, p_max int, p_default int) returns int
language plpgsql immutable as $$
declare v text := p_args ->> p_key;
begin
  if v is null then return p_default; end if;
  if v !~ '^-?\d{1,6}$' or v::int not between p_min and p_max then raise exception 'agent: invalid % (between % and %)', p_key, p_min, p_max; end if;
  return v::int;
end $$;
create function public._agent_uuid(p_args jsonb, p_key text) returns uuid
language plpgsql immutable as $$
declare v text := p_args ->> p_key;
begin
  if v is null or v !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise exception 'agent: invalid % (uuid)', p_key; end if;
  return v::uuid;
end $$;
create function public._agent_date(p_args jsonb, p_key text) returns date
language plpgsql stable as $$
declare v text := p_args ->> p_key;
begin
  if v is null then return null; end if;
  if v !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'agent: invalid % (YYYY-MM-DD)', p_key; end if;
  return v::date;
exception when datetime_field_overflow or invalid_datetime_format then
  raise exception 'agent: invalid % (YYYY-MM-DD)', p_key;
end $$;

-- ─────────────────────────────────────────────────────────────
-- admisiones
-- ─────────────────────────────────────────────────────────────
create function public._agent_prospect_brief(p public.prospects) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', p.id, 'name', p.full_name, 'email', p.email, 'whatsapp', p.whatsapp, 'country', p.country,
    'lang', p.lang, 'level', p.level, 'origin', p.origin, 'campaign', p.campaign, 'stage', p.stage,
    'next_action', p.next_action, 'next_due', p.next_due, 'overdue', p.next_due < public._crm_today(),
    'owner', (select full_name from profiles where id = p.owner_id), 'created_at', p.created_at, 'updated_at', p.updated_at)
$$;

-- Une fiche non archivée, sinon « not found ».
create function public._agent_prospect(p_id uuid) returns public.prospects
language plpgsql stable security definer set search_path = public as $$
declare p prospects;
begin
  select * into p from prospects where id = p_id and archived_at is null;
  if not found then raise exception 'agent: not_found prospect'; end if;
  return p;
end $$;

-- Au plus 10 notes ou brouillons d'assistant par fiche et par jour.
create function public._agent_write_quota(p_id uuid) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if (select count(*) from prospect_events where prospect_id = p_id and agent is not null and kind in ('note', 'draft')
      and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'agent: rate_limited (10 notes or drafts per prospect per day)';
  end if;
end $$;

create function public.agent_list_prospects(p_hash text, p_args jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  a jsonb := coalesce(p_args, '{}');
  v_view text; v_days int; v_limit int;
  today date := public._crm_today();
  rows jsonb;
begin
  perform public._agent_require(p_hash, 'admisiones');
  v_view := coalesce(public._agent_text(a, 'view', 20), 'para_hoy');
  v_days := public._agent_int(a, 'days', 1, 60, 7);
  v_limit := public._agent_int(a, 'limit', 1, 50, 25);
  if v_view not in ('nuevos', 'para_hoy', 'abiertos') then raise exception 'agent: invalid view (nuevos, para_hoy, abiertos)'; end if;
  select coalesce(jsonb_agg(public._agent_prospect_brief(p) order by x.ord1, x.ord2 desc), '[]'::jsonb) into rows from (
    select q.id, case when v_view = 'para_hoy' then q.next_due - today else 0 end ord1,
      case when v_view = 'nuevos' then q.created_at else q.updated_at end ord2
    from prospects q
    where q.archived_at is null and (
      (v_view = 'nuevos' and q.stage = 'nuevo' and q.created_at >= now() - make_interval(days => v_days))
      or (v_view = 'para_hoy' and q.next_due <= today)
      or (v_view = 'abiertos' and q.stage in ('nuevo', 'contactado', 'test', 'horario')))
    order by ord1, ord2 desc limit v_limit) x join prospects p on p.id = x.id;
  return jsonb_build_object('view', v_view, 'today', today, 'count', jsonb_array_length(rows), 'prospects', rows);
end $$;

create function public.agent_get_prospect(p_hash text, p_args jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p prospects;
begin
  perform public._agent_require(p_hash, 'admisiones');
  p := public._agent_prospect(public._agent_uuid(p_args, 'prospect_id'));
  return public._agent_prospect_brief(p) || jsonb_build_object(
    'timezone', p.timezone, 'goal', p.goal, 'exam', p.exam, 'exam_date', p.exam_date, 'level_score', p.level_score,
    'plan', p.plan, 'hours', p.hours, 'billing', p.billing, 'crs_score', p.crs_score, 'source', p.source,
    'referrer_name', p.referrer_name, 'pause_kind', p.pause_kind, 'reason', p.reason,
    'in_campus', p.student_id is not null, 'invited_at', p.invited_at, 'enrolled_at', p.enrolled_at, 'active_at', p.active_at,
    'events', coalesce((select jsonb_agg(jsonb_build_object('kind', e.kind, 'topic', e.topic, 'body', left(e.body, 1000),
        'by', case when e.agent is not null then 'asistente «' || e.agent || '»' when e.author_id is not null then (select full_name from profiles where id = e.author_id)
          when e.kind = 'auto' then 'automático' else 'equipo' end,
        'at', e.created_at) order by e.created_at desc, e.id desc)
      from (select * from prospect_events where prospect_id = p.id order by created_at desc, id desc limit 40) e), '[]'::jsonb),
    'tests', coalesce((select jsonb_agg(jsonb_build_object('level', r.level, 'overall', r.overall, 'mode', r.mode, 'at', r.created_at) order by r.created_at desc)
      from placement_results r where p.email is not null and r.email = p.email), '[]'::jsonb),
    'requests', coalesce((select jsonb_agg(jsonb_build_object('at', r.created_at, 'handled', r.handled_at is not null) order by r.created_at desc)
      from enrollment_requests r where p.email is not null and r.email = p.email), '[]'::jsonb));
end $$;

create function public.agent_add_note(p_hash text, p_args jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t agent_tokens; p prospects; ev prospect_events;
begin
  t := public._agent_require(p_hash, 'admisiones');
  p := public._agent_prospect(public._agent_uuid(p_args, 'prospect_id'));
  perform public._agent_write_quota(p.id);
  insert into prospect_events (prospect_id, kind, topic, body, agent)
  values (p.id, 'note', 'note', public._agent_text(p_args, 'text', 2000, true), t.name) returning * into ev;
  update prospects set updated_at = now() where id = p.id;
  return jsonb_build_object('ok', true, 'event_id', ev.id, 'at', ev.created_at);
end $$;

create function public.agent_save_draft(p_hash text, p_args jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  t agent_tokens; p prospects; ev prospect_events; ch text; subj text; txt text;
begin
  t := public._agent_require(p_hash, 'admisiones');
  ch := coalesce(public._agent_text(p_args, 'channel', 20), 'whatsapp');
  subj := public._agent_text(p_args, 'subject', 150);
  txt := public._agent_text(p_args, 'text', 1800, true);
  p := public._agent_prospect(public._agent_uuid(p_args, 'prospect_id'));
  if ch not in ('whatsapp', 'email') then raise exception 'agent: invalid channel (whatsapp, email)'; end if;
  perform public._agent_write_quota(p.id);
  insert into prospect_events (prospect_id, kind, topic, body, agent)
  values (p.id, 'draft', ch, case when ch = 'email' and subj is not null then 'Asunto: ' || subj || E'\n\n' || txt else txt end, t.name)
  returning * into ev;
  update prospects set updated_at = now() where id = p.id;
  return jsonb_build_object('ok', true, 'event_id', ev.id, 'at', ev.created_at, 'channel', ch,
    'note', 'Brouillon enregistré dans la fiche : un membre de l''équipe le relira et l''enverra lui-même.');
end $$;

create function public.agent_set_next_action(p_hash text, p_args jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  t agent_tokens; p prospects; act text; due date;
  today date := public._crm_today();
begin
  t := public._agent_require(p_hash, 'admisiones');
  act := public._agent_text(p_args, 'action', 200, true);
  due := public._agent_date(p_args, 'due');
  p := public._agent_prospect(public._agent_uuid(p_args, 'prospect_id'));
  if due is null then raise exception 'agent: invalid due (required, YYYY-MM-DD)'; end if;
  if due < today or due > today + 120 then raise exception 'agent: invalid due (between % and %)', today, today + 120; end if;
  perform public._agent_write_quota(p.id);
  update prospects set next_action = act, next_due = due, updated_at = now() where id = p.id returning * into p;
  insert into prospect_events (prospect_id, kind, topic, body, agent)
  values (p.id, 'auto', 'next', format('Próxima acción: «%s» para el %s.', act, public._crm_day(due)), t.name);
  return jsonb_build_object('ok', true, 'prospect', public._agent_prospect_brief(p));
end $$;

-- ─────────────────────────────────────────────────────────────
-- seguimiento
-- ─────────────────────────────────────────────────────────────
-- Cours passés de tous les groupes sur une période : tenu (Zoom, présence d'un élève ou rapport
-- du prof) ou manqué, et rapport fait ou non.
create function public._agent_classes(p_from timestamptz, p_to timestamptz, p_group uuid default null)
returns table (group_id uuid, teacher_id uuid, scheduled_at timestamptz, at timestamptz, duration_min int, status text, held boolean, reported boolean)
language sql stable security definer set search_path = public as $$
  select g.id, g.teacher_id, s.scheduled_at, s.actual_at, s.duration_min, s.status,
    s.status <> 'cancelled' and (
      exists (select 1 from zoom_meetings m where m.group_id = g.id and m.started_at between s.actual_at - interval '60 minutes' and s.actual_at + interval '90 minutes')
      or exists (select 1 from session_reports r where r.group_id = g.id and r.scheduled_at = s.scheduled_at)
      or exists (select 1 from class_joins j where j.group_id = g.id and j.scheduled_at = s.scheduled_at)),
    exists (select 1 from session_reports r where r.group_id = g.id and r.scheduled_at = s.scheduled_at)
  from class_groups g
  cross join lateral public._group_sessions(g.id, p_from, least(p_to, now())) s
  where (p_group is null or g.id = p_group) and s.actual_at + make_interval(mins => s.duration_min) < now()
$$;

-- Un élève par ligne, avec ce qui peut l'inquiéter : absences des 4 semaines en cours (fenêtre
-- de la formule mensuelle, sinon les 28 derniers jours), inactivité, unités vues en classe pas
-- encore réussies, rapports de cours manquants. Pas de coordonnées.
create function public._agent_risk()
returns table (student_id uuid, teacher_id uuid, info jsonb, score int)
language plpgsql stable security definer set search_path = public as $$
declare r record; m jsonb; w_from timestamptz; w_to timestamptz; a int; l int; j int; mk int; last_at timestamptz;
  runs int; pend int; miss int; reasons jsonb; sc int; tracked boolean;
  per int := greatest(1, coalesce((public._setting('contract') ->> 'lates_per_absence')::int, 3));
begin
  for r in select p.id, p.full_name, p.level, p.plan, p.teacher_id, p.group_id, p.onboarded_at,
                  (select full_name from profiles t where t.id = coalesce(g.teacher_id, p.teacher_id)) teacher, g.name group_name, g.teacher_id g_teacher
           from profiles p left join class_groups g on g.id = p.group_id
           where p.role = 'student' loop
    m := public._month_status(r.id);
    w_from := coalesce((m ->> 'from')::timestamptz, now() - interval '28 days');
    w_to := coalesce((m ->> 'to')::timestamptz, now());
    tracked := public._absence_period(r.id) is not null;
    select count(*) filter (where x.status = 'absent' and x.reason is null), count(*) filter (where x.status = 'late' and x.reason is null),
           count(*) filter (where x.reason is not null)
      into a, l, j from public._absence_record(r.id) x where x.at >= w_from;
    select count(*) into mk from absence_excuses e where e.student_id = r.id and e.group_id = r.group_id
      and not exists (select 1 from makeup_sessions s where s.student_id = r.id and s.group_id = e.group_id and s.replaces_at = e.scheduled_at);
    select max(x.created_at) into last_at from xp_events x where x.user_id = r.id;
    select count(*) into runs from lesson_runs x where x.user_id = r.id and x.finished_at > now() - interval '14 days';
    select count(*) into pend from (
      select t.unit_id from taught_units t where t.student_id = r.id
      union select a2.unit_id from assignment_students s2 join assignments a2 on a2.id = s2.assignment_id where s2.student_id = r.id) u
      where not exists (select 1 from lesson_runs x where x.user_id = r.id and x.unit_id = u.unit_id and x.first_try_correct * 100 >= 75 * x.total);
    miss := 0;
    if r.group_id is not null then
      select count(*) into miss from public._agent_classes(now() - interval '14 days', now(), r.group_id) c
        where c.status <> 'cancelled' and not c.reported;
    end if;
    reasons := '[]'::jsonb; sc := 0;
    if a + l / per >= 1 then reasons := reasons || to_jsonb('absences'::text); sc := sc + 3 * a + l; end if;
    if coalesce((m ->> 'failed')::boolean, false) then reasons := reasons || to_jsonb('month_not_validated'::text); sc := sc + 5; end if;
    if r.onboarded_at is not null and (last_at is null or last_at < now() - interval '7 days') then
      reasons := reasons || to_jsonb('inactive_7_days'::text); sc := sc + 2;
    end if;
    if pend >= 2 then reasons := reasons || to_jsonb('units_seen_in_class_not_passed'::text); sc := sc + pend; end if;
    if miss >= 2 then reasons := reasons || to_jsonb('class_reports_missing'::text); sc := sc + 1; end if;
    if r.group_id is null then reasons := reasons || to_jsonb('no_group'::text); sc := sc + 1; end if;
    student_id := r.id; teacher_id := coalesce(r.g_teacher, r.teacher_id); score := sc;
    info := jsonb_build_object('name', r.full_name, 'teacher', r.teacher, 'group', r.group_name, 'level', r.level, 'plan', r.plan,
      'window', jsonb_build_object('from', w_from, 'to', w_to), 'attendance_tracked', tracked,
      'absences_unjustified', a, 'lates_unjustified', l, 'absences_justified', j, 'makeups_pending', mk,
      'month_not_validated', coalesce((m ->> 'failed')::boolean, false),
      'last_activity', last_at, 'days_inactive', case when last_at is not null then extract(day from now() - last_at)::int end,
      'lessons_last_14_days', runs, 'units_seen_in_class_not_passed', pend, 'class_reports_missing_14_days', miss,
      'reasons', reasons, 'score', sc);
    return next;
  end loop;
end $$;

create function public.agent_students_at_risk(p_hash text, p_args jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_limit int; rows jsonb;
begin
  perform public._agent_require(p_hash, 'seguimiento');
  v_limit := public._agent_int(coalesce(p_args, '{}'), 'limit', 1, 100, 50);
  select coalesce(jsonb_agg(x.info order by x.score desc, x.info ->> 'name'), '[]'::jsonb) into rows
    from (select * from public._agent_risk() r where r.score > 0 order by r.score desc limit v_limit) x;
  return jsonb_build_object('generated_at', now(), 'count', jsonb_array_length(rows), 'students', rows);
end $$;

-- Semaine du lundi au dimanche, à l'heure de Lima ; par défaut la semaine précédente.
create function public.agent_weekly_summary(p_hash text, p_args jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  a jsonb := coalesce(p_args, '{}');
  d date; who text;
  w0 date; f timestamptz; t timestamptz; rows jsonb; risk jsonb;
begin
  perform public._agent_require(p_hash, 'seguimiento');
  d := public._agent_date(a, 'week_start');
  who := lower(public._agent_text(a, 'teacher', 80));
  select coalesce(jsonb_object_agg(r.teacher_id, r.n), '{}'::jsonb) into risk
    from (select x.teacher_id, count(*) n from public._agent_risk() x where x.score > 0 and x.teacher_id is not null group by 1) r;
  w0 := coalesce(date_trunc('week', d)::date, date_trunc('week', public._crm_today())::date - 7);
  if w0 < public._crm_today() - 400 or w0 > public._crm_today() then raise exception 'agent: invalid week_start (within the last 400 days)'; end if;
  f := w0::timestamp at time zone 'America/Lima'; t := f + interval '7 days';
  select coalesce(jsonb_agg(x order by x ->> 'teacher'), '[]'::jsonb) into rows from (
    select jsonb_build_object('teacher', tp.full_name,
      'groups', (select count(*) from class_groups g where g.teacher_id = tp.id),
      'students', (select count(*) from profiles s join class_groups g on g.id = s.group_id where s.role = 'student' and g.teacher_id = tp.id),
      'classes_planned', count(c.at) filter (where c.status <> 'cancelled'),
      'classes_held', count(c.at) filter (where c.held),
      'classes_missed', count(c.at) filter (where c.status <> 'cancelled' and not c.held),
      'classes_cancelled', count(c.at) filter (where c.status = 'cancelled'),
      'classes_moved', count(c.at) filter (where c.status = 'moved'),
      'makeups', count(c.at) filter (where c.status = 'makeup'),
      'hours_taught', round(coalesce(sum(c.duration_min) filter (where c.held), 0) / 60.0, 1),
      'class_reports_done', count(c.at) filter (where c.status <> 'cancelled' and c.reported),
      'class_reports_missing', count(c.at) filter (where c.status <> 'cancelled' and not c.reported),
      'attendance', (select jsonb_build_object('present', count(*) filter (where x.status = 'present'), 'late', count(*) filter (where x.status = 'late'),
            'absent', count(*) filter (where x.status = 'absent'))
          from class_groups g cross join lateral public._group_attendance(g.id, f, t) x where g.teacher_id = tp.id),
      'absences_justified', (select count(*) from absence_excuses e join class_groups g on g.id = e.group_id
          where g.teacher_id = tp.id and e.scheduled_at >= f and e.scheduled_at < t),
      'students_inactive', coalesce((select jsonb_agg(s.full_name order by s.full_name) from profiles s join class_groups g on g.id = s.group_id
          where s.role = 'student' and g.teacher_id = tp.id and s.onboarded_at is not null
            and not exists (select 1 from xp_events e where e.user_id = s.id and e.created_at >= f and e.created_at < t)), '[]'::jsonb),
      'students_at_risk', coalesce((risk ->> tp.id::text)::int, 0)) x
    from profiles tp
    left join public._agent_classes(f, t) c on c.teacher_id = tp.id
    where tp.role in ('teacher', 'admin') and exists (select 1 from class_groups g where g.teacher_id = tp.id)
      and (who is null or lower(tp.full_name) like '%' || who || '%')
    group by tp.id, tp.full_name) s(x);
  return jsonb_build_object('week_start', w0, 'week_end', w0 + 6, 'complete', t <= now(), 'teachers', rows);
end $$;

-- ─────────────────────────────────────────────────────────────
-- gestion
-- ─────────────────────────────────────────────────────────────
create function public.agent_monthly_report(p_hash text, p_args jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  m text; m0 date; f timestamptz; t timestamptz;
begin
  perform public._agent_require(p_hash, 'gestion');
  m := public._agent_text(coalesce(p_args, '{}'), 'month', 7);
  if m is not null and m !~ '^\d{4}-(0[1-9]|1[0-2])$' then raise exception 'agent: invalid month (YYYY-MM)'; end if;
  m0 := coalesce((m || '-01')::date, date_trunc('month', public._crm_today())::date);
  if m0 > public._crm_today() or m0 < date_trunc('month', public._crm_today())::date - interval '24 months' then
    raise exception 'agent: invalid month (within the last 24 months)';
  end if;
  f := m0::timestamp at time zone 'America/Lima'; t := (m0 + interval '1 month')::timestamp at time zone 'America/Lima';
  return jsonb_build_object('month', to_char(m0, 'YYYY-MM'), 'complete', t <= now(),
    'students', jsonb_build_object(
      'active', (select count(distinct s.id) from profiles s where s.role = 'student' and (
          exists (select 1 from class_joins j where j.student_id = s.id and j.clicked_at >= f and j.clicked_at < t)
          or exists (select 1 from xp_events x where x.user_id = s.id and x.created_at >= f and x.created_at < t))),
      'with_group_now', (select count(*) from profiles where role = 'student' and group_id is not null),
      'total_now', (select count(*) from profiles where role = 'student'),
      'new_campus_accounts', (select count(*) from profiles where role = 'student' and created_at >= f and created_at < t),
      'new_enrolments_crm', (select count(*) from prospects where enrolled_at >= f and enrolled_at < t),
      'new_active_crm', (select count(*) from prospects where active_at >= f and active_at < t),
      'contracts_signed', (select count(distinct student_id) from contract_signatures where signed_at >= f and signed_at < t),
      'level_promotions', (select count(*) from level_validations where promoted_at >= f and promoted_at < t)),
    'classes', (select jsonb_build_object('planned', count(*) filter (where c.status <> 'cancelled'), 'held', count(*) filter (where c.held),
        'missed', count(*) filter (where c.status <> 'cancelled' and not c.held), 'cancelled', count(*) filter (where c.status = 'cancelled'),
        'moved', count(*) filter (where c.status = 'moved'), 'makeups', count(*) filter (where c.status = 'makeup'),
        'hours_held', round(coalesce(sum(c.duration_min) filter (where c.held), 0) / 60.0, 1),
        'reports_missing', count(*) filter (where c.status <> 'cancelled' and not c.reported))
      from public._agent_classes(f, t) c),
    'attendance', (select jsonb_build_object('present', count(*) filter (where x.status = 'present'), 'late', count(*) filter (where x.status = 'late'),
        'absent', count(*) filter (where x.status = 'absent'))
      from class_groups g cross join lateral public._group_attendance(g.id, f, t) x),
    'teachers', coalesce((select jsonb_agg(x order by x ->> 'teacher') from (
      select jsonb_build_object('teacher', coalesce(tp.full_name, 'Sin profesor'),
        'groups', (select count(*) from class_groups g where g.teacher_id is not distinct from c.teacher_id),
        'classes_held', count(*) filter (where c.held), 'classes_missed', count(*) filter (where c.status <> 'cancelled' and not c.held),
        'hours_held', round(coalesce(sum(c.duration_min) filter (where c.held), 0) / 60.0, 1),
        'reports_done', count(*) filter (where c.reported)) x
      from public._agent_classes(f, t) c left join profiles tp on tp.id = c.teacher_id
      group by c.teacher_id, tp.full_name) s(x)), '[]'::jsonb));
end $$;

-- ─────────────────────────────────────────────────────────────
-- marketing
-- ─────────────────────────────────────────────────────────────
-- Par semaine (lundi, heure de Lima), origine et campagne : nouveaux prospects, tests de niveau,
-- passages à « Inscrito » et à « Activo ». Aucune donnée personnelle.
create function public.agent_campaign_stats(p_hash text, p_args jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  a jsonb := coalesce(p_args, '{}');
  n int; o text; w0 date; f timestamptz; rows jsonb; totals jsonb;
begin
  perform public._agent_require(p_hash, 'marketing');
  n := public._agent_int(a, 'weeks', 1, 26, 8);
  o := public._agent_text(a, 'origin', 20);
  w0 := date_trunc('week', public._crm_today())::date - 7 * (n - 1);
  f := w0::timestamp at time zone 'America/Lima';
  if o is not null and o not in ('test', 'form', 'calc', 'ads', 'whatsapp', 'superprof', 'instagram', 'tiktok', 'facebook', 'referral', 'email', 'alumni', 'other') then
    raise exception 'agent: invalid origin';
  end if;
  with ev as (
    select p.origin, coalesce(p.campaign, '') campaign, 'new' k, p.created_at at_ from prospects p where p.created_at >= f
    union all select p.origin, coalesce(p.campaign, ''), 'test', e.created_at from prospect_events e join prospects p on p.id = e.prospect_id
      where e.kind = 'auto' and e.topic = 'test' and e.created_at >= f
    union all select p.origin, coalesce(p.campaign, ''), 'inscrito', p.enrolled_at from prospects p where p.enrolled_at >= f
    union all select p.origin, coalesce(p.campaign, ''), 'activo', p.active_at from prospects p where p.active_at >= f
  ), x as (
    select date_trunc('week', at_ at time zone 'America/Lima')::date wk, origin, campaign,
      count(*) filter (where k = 'new') new_prospects, count(*) filter (where k = 'test') tests,
      count(*) filter (where k = 'inscrito') inscritos, count(*) filter (where k = 'activo') activos
    from ev where o is null or origin = o group by 1, 2, 3
  )
  select coalesce(jsonb_agg(jsonb_build_object('week', wk, 'origin', origin, 'campaign', nullif(campaign, ''), 'new_prospects', new_prospects,
      'tests', tests, 'inscritos', inscritos, 'activos', activos) order by wk desc, origin, campaign), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object('origin', y.origin, 'new_prospects', y.np, 'tests', y.ts, 'inscritos', y.ins, 'activos', y.act,
        'conversion_to_inscrito_pct', case when y.np > 0 then round(100.0 * y.ins / y.np) end) order by y.np desc)
      from (select origin, sum(new_prospects) np, sum(tests) ts, sum(inscritos) ins, sum(activos) act from x group by origin) y), '[]'::jsonb)
    into rows, totals from x;
  return jsonb_build_object('from_week', w0, 'weeks', n, 'origin', o, 'rows', rows, 'totals_by_origin', totals);
end $$;

-- ─────────────────────────────────────────────────────────────
-- Droits
-- ─────────────────────────────────────────────────────────────
revoke execute on function public._agent_hash(text), public.agent_session(text), public._agent_require(text, text),
  public.agent_log(text, text, text, text, text), public._agent_text(jsonb, text, int, boolean), public._agent_int(jsonb, text, int, int, int),
  public._agent_uuid(jsonb, text), public._agent_date(jsonb, text), public._agent_prospect_brief(public.prospects),
  public._agent_prospect(uuid), public._agent_write_quota(uuid), public._agent_classes(timestamptz, timestamptz, uuid), public._agent_risk(),
  public.agent_list_prospects(text, jsonb), public.agent_get_prospect(text, jsonb), public.agent_add_note(text, jsonb),
  public.agent_save_draft(text, jsonb), public.agent_set_next_action(text, jsonb), public.agent_students_at_risk(text, jsonb),
  public.agent_weekly_summary(text, jsonb), public.agent_monthly_report(text, jsonb), public.agent_campaign_stats(text, jsonb)
  from public, anon, authenticated;
grant execute on function public.agent_session(text), public.agent_log(text, text, text, text, text),
  public.agent_list_prospects(text, jsonb), public.agent_get_prospect(text, jsonb), public.agent_add_note(text, jsonb),
  public.agent_save_draft(text, jsonb), public.agent_set_next_action(text, jsonb), public.agent_students_at_risk(text, jsonb),
  public.agent_weekly_summary(text, jsonb), public.agent_monthly_report(text, jsonb), public.agent_campaign_stats(text, jsonb)
  to service_role;

revoke execute on function public.agent_token_create(text, text, int), public.agent_tokens_list(), public.agent_token_revoke(uuid),
  public.agent_actions_list(int) from public, anon;
grant execute on function public.agent_token_create(text, text, int), public.agent_tokens_list(), public.agent_token_revoke(uuid),
  public.agent_actions_list(int) to authenticated;

commit;

notify pgrst, 'reload schema';
