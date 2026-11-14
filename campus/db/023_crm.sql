-- Campus Pathway · 023 · prospects (CRM « Prospectos ») et origine des visiteurs du site
-- À exécuter après 022 (SQL Editor → New query → Run).
--
-- • Nouvel onglet admin « Prospectos » : chaque personne intéressée, du premier contact à
--   l'inscription, avec son origine, son étape, son responsable, sa prochaine action et son
--   historique. Seuls les comptes admin le voient (les professeurs non).
-- • Remplissage automatique : un test de niveau, une demande d'inscription ou un contact laissé
--   dans le calculateur CRS crée la fiche (ou complète celle qui a le même e-mail, sinon le même
--   WhatsApp) et ajoute une ligne à l'historique. Les fiches existantes sont créées une fois ici
--   à partir des tests et des demandes déjà reçus.
-- • L'étape n'avance que vers l'avant toute seule : test → « Test hecho » ; invitation au
--   Campus → « Inscrito » ; contrat signé ou première classe → « Activo ». L'équipe peut toujours
--   la changer à la main.
-- • Le site envoie aussi la campagne d'origine (utm_campaign, gardée 30 jours dans le
--   navigateur) avec le test, l'inscription et le calculateur : une fiche avec campagne a
--   l'origine « Publicidad ».

begin;

-- ─────────────────────────────────────────────────────────────
-- Aides
-- ─────────────────────────────────────────────────────────────
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false)
$$;

-- Ordre des étapes (« pausa » est hors de la file : toute étape automatique l'en fait sortir).
create function public._crm_rank(p_stage text) returns int
language sql immutable as $$
  select case p_stage when 'nuevo' then 1 when 'contactado' then 2 when 'test' then 3 when 'horario' then 4
    when 'inscrito' then 5 when 'activo' then 6 else 0 end
$$;
create function public._crm_stage_name(p_stage text) returns text
language sql immutable as $$
  select case p_stage when 'nuevo' then 'Nuevo' when 'contactado' then 'Contactado' when 'test' then 'Test hecho'
    when 'horario' then 'Horario propuesto' when 'inscrito' then 'Inscrito' when 'activo' then 'Activo'
    when 'pausa' then 'En pausa / Perdido' else p_stage end
$$;
-- Le WhatsApp réduit à ses chiffres, pour reconnaître la même personne.
create function public._crm_digits(p text) returns text
language sql immutable as $$
  select case when length(d) >= 6 then d end from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') d) x
$$;
create function public._crm_today() returns date
language sql stable as $$ select (now() at time zone 'America/Lima')::date $$;
create function public._crm_day(d date) returns text
language sql immutable as $$
  select extract(day from d)::int || ' ' || (array['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'])[extract(month from d)::int] || ' ' || extract(year from d)::int
$$;
-- Origine d'une nouvelle fiche : une campagne l'emporte (« ads ») ; sinon le réseau d'où vient
-- la personne, s'il est reconnu ; sinon le canal du site (test, form, calc).
create function public._crm_origin(p_signal text, p_campaign text, p_source text) returns text
language sql immutable as $$
  select case
    when nullif(trim(p_campaign), '') is not null then 'ads'
    when p_source ~* 'instagram' then 'instagram'
    when p_source ~* '(facebook|^fb\M|fb\.com)' then 'facebook'
    when p_source ~* 'tiktok' then 'tiktok'
    when p_source ~* 'superprof' then 'superprof'
    else p_signal end
$$;

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────
create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  full_name text check (length(full_name) <= 120),
  email text unique check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200),
  whatsapp text check (length(whatsapp) <= 40),
  whatsapp_key text generated always as (public._crm_digits(whatsapp)) stored,
  country text check (length(country) <= 120),
  timezone text check (length(timezone) <= 120),
  goal text check (length(goal) <= 1000),
  exam text check (length(exam) <= 60),
  exam_date date,
  level text check (level in ('A1', 'A2', 'B1', 'B2')),
  level_score int check (level_score between 0 and 100),
  plan text check (plan in ('Esencial', 'Acelerado', 'Intensivo')),
  hours int check (hours between 1 and 12),
  billing text check (billing in ('Mensual', 'Ciclo')),
  crs_score int check (crs_score between 0 and 1200),
  lang text check (lang in ('es', 'fr', 'en', 'de')),
  origin text not null default 'other' check (origin in ('test', 'form', 'calc', 'ads', 'whatsapp', 'superprof', 'instagram',
    'tiktok', 'facebook', 'referral', 'email', 'alumni', 'other')),
  campaign text check (length(campaign) <= 120),
  source text check (length(source) <= 120),
  referrer_name text check (length(referrer_name) <= 120),
  stage text not null default 'nuevo' check (stage in ('nuevo', 'contactado', 'test', 'horario', 'inscrito', 'activo', 'pausa')),
  pause_kind text check (pause_kind in ('En pausa', 'Perdido')),
  reason text check (length(reason) <= 300),
  owner_id uuid references public.profiles (id) on delete set null,
  next_action text check (length(next_action) <= 200),
  next_due date,
  student_id uuid references public.profiles (id) on delete set null,
  invited_at timestamptz,
  enrolled_at timestamptz,
  active_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  stage_changed_at timestamptz not null default now(),
  check (email is not null or whatsapp_key is not null or length(trim(full_name)) > 0)
);
create index prospects_whatsapp on public.prospects (whatsapp_key) where whatsapp_key is not null;
create index prospects_student on public.prospects (student_id) where student_id is not null;
create index prospects_due on public.prospects (next_due) where next_due is not null and archived_at is null;

create table public.prospect_events (
  id bigint generated always as identity primary key,
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  kind text not null check (kind in ('auto', 'note')),
  topic text check (length(topic) <= 30),
  body text not null check (length(body) between 1 and 2000),
  author_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index prospect_events_prospect on public.prospect_events (prospect_id, created_at desc);

-- Contacts laissés dans le calculateur CRS du site (journal brut, comme les tests et les demandes).
create table public.calculator_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(full_name) between 1 and 120),
  email text check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200),
  whatsapp text not null check (length(whatsapp) <= 40),
  whatsapp_key text generated always as (public._crm_digits(whatsapp)) stored,
  crs_score int check (crs_score between 0 and 1200),
  french_eligible text check (french_eligible in ('yes', 'no', 'unknown')),
  lang text check (lang in ('es', 'fr', 'en', 'de')),
  campaign text check (length(campaign) <= 120),
  source text check (length(source) <= 120),
  created_at timestamptz not null default now()
);
create index calculator_leads_email on public.calculator_leads (email, created_at desc);
create index calculator_leads_whatsapp on public.calculator_leads (whatsapp_key, created_at desc);

-- La campagne d'origine, gardée avec chaque test et chaque demande.
alter table public.placement_results add column campaign text check (length(campaign) <= 120), add column source text check (length(source) <= 120);
alter table public.enrollment_requests add column campaign text check (length(campaign) <= 120), add column source text check (length(source) <= 120);
-- La limite par connexion (022) couvre aussi le calculateur.
alter table public.web_submissions drop constraint web_submissions_kind_check,
  add constraint web_submissions_kind_check check (kind in ('placement', 'enrollment', 'lead'));

alter table public.prospects enable row level security;
alter table public.prospect_events enable row level security;
alter table public.calculator_leads enable row level security;
revoke all on public.prospects, public.prospect_events, public.calculator_leads from anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Remplissage automatique
-- ─────────────────────────────────────────────────────────────
create function public._crm_event(p_prospect uuid, p_kind text, p_body text, p_topic text, p_author uuid, p_at timestamptz) returns void
language sql security definer set search_path = public as $$
  insert into prospect_events (prospect_id, kind, topic, body, author_id, created_at)
  values (p_prospect, p_kind, p_topic, left(p_body, 2000), p_author, coalesce(p_at, now()));
  update prospects set updated_at = greatest(updated_at, coalesce(p_at, now())) where id = p_prospect;
$$;

-- Fait avancer l'étape, jamais reculer (une fiche en pause revient). Vrai si l'étape a changé.
create function public._crm_advance(p_prospect uuid, p_stage text, p_at timestamptz) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update prospects set stage = p_stage, pause_kind = null, reason = null, stage_changed_at = coalesce(p_at, now()),
    enrolled_at = case when p_stage in ('inscrito', 'activo') then coalesce(enrolled_at, p_at, now()) else enrolled_at end,
    active_at = case when p_stage = 'activo' then coalesce(active_at, p_at, now()) else active_at end,
    updated_at = greatest(updated_at, coalesce(p_at, now()))
  where id = p_prospect and public._crm_rank(stage) < public._crm_rank(p_stage);
  return found;
end $$;

-- Retrouve la fiche (même e-mail, sinon même WhatsApp sans e-mail différent) ou la crée.
create function public._crm_upsert(p_signal text, p_email text, p_whatsapp text, p_name text, p_campaign text, p_source text,
  p_lang text, p_at timestamptz, out p_id uuid, out p_new boolean)
language plpgsql security definer set search_path = public as $$
declare
  e text := nullif(lower(trim(coalesce(p_email, ''))), '');
  w text := public._crm_digits(p_whatsapp);
  c text := left(nullif(trim(p_campaign), ''), 120);
  s text := left(nullif(trim(p_source), ''), 120);
begin
  if e is not null then select id into p_id from prospects where email = e; end if;
  if p_id is null and w is not null then
    select id into p_id from prospects where whatsapp_key = w and (email is null or e is null) order by created_at desc limit 1;
  end if;
  p_new := p_id is null;
  if p_new then
    insert into prospects (full_name, email, whatsapp, lang, origin, campaign, source, stage, created_at, updated_at, stage_changed_at)
    values (left(nullif(trim(p_name), ''), 120), e, left(nullif(trim(p_whatsapp), ''), 40), p_lang,
      public._crm_origin(p_signal, c, s), c, s, case when p_signal = 'test' then 'test' else 'nuevo' end,
      coalesce(p_at, now()), coalesce(p_at, now()), coalesce(p_at, now()))
    returning id into p_id;
    if c is not null then
      perform public._crm_event(p_id, 'auto', format('Llegó por la campaña «%s»%s.', c, coalesce(' (' || s || ')', '')), 'campaign', null, p_at);
    end if;
  else
    update prospects set
      full_name = coalesce(nullif(full_name, ''), left(nullif(trim(p_name), ''), 120)),
      email = coalesce(email, e),
      whatsapp = coalesce(nullif(whatsapp, ''), left(nullif(trim(p_whatsapp), ''), 40)),
      lang = coalesce(lang, p_lang),
      campaign = coalesce(campaign, c),
      source = coalesce(source, s),
      archived_at = null
    where id = p_id;
  end if;
end $$;

-- Prochaine action par défaut quand une personne se manifeste et que rien n'est prévu pour elle.
create function public._crm_default_next(p_prospect uuid, p_action text) returns void
language sql security definer set search_path = public as $$
  update prospects set next_action = p_action, next_due = public._crm_today()
  where id = p_prospect and next_due is null and stage not in ('inscrito', 'activo');
$$;

-- Test de niveau du site.
create function public._crm_feed_placement(r public.placement_results) returns void
language plpgsql security definer set search_path = public as $$
declare
  f record; moved boolean; weak text;
  skill_es jsonb := '{"reading": "comprensión escrita", "listening": "comprensión oral", "grammarVocabulary": "gramática y vocabulario"}';
begin
  select * into f from public._crm_upsert('test', r.email, null, null, r.campaign, r.source, r.lang, r.created_at);
  update prospects set level = r.level, level_score = coalesce(r.overall, level_score) where id = f.p_id;
  select skill_es ->> k into weak from jsonb_each_text(coalesce(r.detail -> 'skills', '{}')) s(k, v)
    where v ~ '^\d+(\.\d+)?$' and skill_es ? k order by v::numeric limit 1;
  moved := public._crm_advance(f.p_id, 'test', r.created_at);
  perform public._crm_event(f.p_id, 'auto', format('Hizo el test de nivel%s: %s%s.%s%s',
    case r.mode when 'intensive' then ' intensivo' when 'express' then ' exprés' else '' end, r.level,
    coalesce(' (' || r.overall || '/100)', ''), coalesce(' Prioridad: ' || weak || '.', ''),
    case when moved and not f.p_new then ' Pasa a «Test hecho».' else '' end), 'test', null, r.created_at);
  perform public._crm_default_next(f.p_id, 'Escribir con el resultado del test');
end $$;

-- Demande d'inscription du site.
create function public._crm_feed_enrollment(r public.enrollment_requests) returns void
language plpgsql security definer set search_path = public as $$
declare f record; moved boolean; plan_txt text;
begin
  select * into f from public._crm_upsert('form', r.email, r.whatsapp, r.full_name, r.campaign, r.source, r.lang, r.created_at);
  update prospects set
    full_name = coalesce(nullif(r.full_name, ''), full_name),
    whatsapp = coalesce(nullif(r.whatsapp, ''), whatsapp),
    goal = coalesce(nullif(r.objective, ''), goal),
    level = coalesce(r.level, level),
    plan = coalesce(r.plan, plan), hours = coalesce(r.hours, hours), billing = coalesce(r.billing, billing),
    timezone = coalesce(nullif(r.timezone, ''), timezone),
    exam_date = coalesce(r.exam_date, exam_date)
  where id = f.p_id;
  plan_txt := coalesce(r.plan || coalesce(' · ' || r.hours || ' h/semana', '') || coalesce(' · ' || case r.billing when 'Ciclo' then 'ciclo completo' else 'mensual' end, ''), 'ritmo por recomendar');
  moved := public._crm_advance(f.p_id, 'nuevo', r.created_at);
  perform public._crm_event(f.p_id, 'auto', format('Envió el formulario de inscripción: %s.%s%s%s%s', plan_txt,
    coalesce(' Días: ' || nullif(array_to_string(r.days, ', '), '') || '.', ''),
    coalesce(' Franjas: ' || nullif(array_to_string(r.times, ', '), '') || '.', ''),
    coalesce(' Inicio ideal: ' || public._crm_day(r.start_date) || '.', ''),
    case when moved and not f.p_new then ' Vuelve a «Nuevo».' else '' end), 'form', null, r.created_at);
  perform public._crm_default_next(f.p_id, 'Responder a la solicitud de inscripción');
end $$;

-- Contact laissé dans le calculateur CRS.
create function public._crm_feed_lead(r public.calculator_leads) returns void
language plpgsql security definer set search_path = public as $$
declare f record; moved boolean;
begin
  select * into f from public._crm_upsert('calc', r.email, r.whatsapp, r.full_name, r.campaign, r.source, r.lang, r.created_at);
  update prospects set crs_score = coalesce(r.crs_score, crs_score), goal = coalesce(goal, 'Entrada exprés') where id = f.p_id;
  moved := public._crm_advance(f.p_id, 'nuevo', r.created_at);
  perform public._crm_event(f.p_id, 'auto', format('Dejó su WhatsApp en la calculadora CRS%s.%s',
    case when r.crs_score is not null then format(' (puntaje estimado %s%s)', r.crs_score,
      case r.french_eligible when 'yes' then ', con NCLC 7 en francés' when 'no' then ', sin NCLC 7 en francés todavía' else '' end)
      else ' (sin resultados de idioma vigentes)' end,
    case when moved and not f.p_new then ' Vuelve a «Nuevo».' else '' end), 'calc', null, r.created_at);
  perform public._crm_default_next(f.p_id, 'Escribir por WhatsApp (calculadora CRS)');
end $$;

-- Invitation au Campus (flux existant) : la fiche du même e-mail passe à « Inscrito » ;
-- quand la personne crée son compte, la fiche est reliée à son profil.
create function public._crm_feed_invitation(r public.invitations, p_sent boolean, p_accepted boolean) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid; uid uuid; moved boolean; teacher text;
begin
  if r.role <> 'student' then return; end if;
  select id into pid from prospects where email = r.email;
  if pid is null then return; end if;
  if p_sent then
    select full_name into teacher from profiles where id = r.teacher_id;
    update prospects set invited_at = r.created_at, full_name = coalesce(nullif(full_name, ''), r.full_name), archived_at = null
    where id = pid;
    moved := public._crm_advance(pid, 'inscrito', r.created_at);
    perform public._crm_event(pid, 'auto', format('Invitación al Campus enviada (nivel %s%s).%s', r.level, coalesce(', con ' || teacher, ''),
      case when moved then ' Pasa a «Inscrito».' else '' end), 'invite', r.created_by, r.created_at);
    update prospects set next_action = 'Comprobar que entró al Campus', next_due = (r.created_at at time zone 'America/Lima')::date + 3
    where id = pid and stage = 'inscrito';
  end if;
  if p_accepted then
    select id into uid from auth.users where lower(email) = r.email;
    update prospects set student_id = coalesce(student_id, uid) where id = pid;
    perform public._crm_event(pid, 'auto', 'Creó su cuenta en el Campus.', 'account', null, r.accepted_at);
  end if;
end $$;

-- La fiche d'un élève : déjà reliée, sinon celle de l'e-mail de son compte (et on la relie).
create function public._crm_for_student(p_student uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  select id into pid from prospects where student_id = p_student limit 1;
  if pid is null then
    select p.id into pid from prospects p join auth.users u on lower(u.email) = p.email where u.id = p_student;
    if pid is not null then update prospects set student_id = p_student where id = pid; end if;
  end if;
  update prospects set full_name = (select nullif(full_name, '') from profiles where id = p_student)
  where id = pid and coalesce(full_name, '') = '';
  return pid;
end $$;

-- Contrat signé (015) ou première classe (013) : la fiche passe à « Activo ».
create function public._crm_feed_active(p_student uuid, p_body text, p_topic text, p_at timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := public._crm_for_student(p_student);
begin
  if pid is null or exists (select 1 from prospects where id = pid and stage = 'activo') then return; end if;
  perform public._crm_advance(pid, 'activo', p_at);
  update prospects set next_action = null, next_due = null where id = pid and stage = 'activo';
  perform public._crm_event(pid, 'auto', p_body || ' Pasa a «Activo».', p_topic, null, p_at);
end $$;

create function public._crm_on_placement() returns trigger
language plpgsql security definer set search_path = public as $$
begin perform public._crm_feed_placement(new); return new; end $$;
create function public._crm_on_enrollment() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then perform public._crm_feed_enrollment(new); return new; end if;
  -- « Marcar como atendida » dans « Solicitudes de inscripción » : la personne a été contactée.
  if new.handled_at is not null and old.handled_at is null then
    declare pid uuid;
    begin
      select id into pid from prospects where email = new.email;
      if pid is not null and public._crm_advance(pid, 'contactado', new.handled_at) then
        perform public._crm_event(pid, 'auto', 'Solicitud de inscripción marcada como atendida. Pasa a «Contactado».', 'form', new.handled_by, new.handled_at);
      end if;
    end;
  end if;
  return new;
end $$;
create function public._crm_on_lead() returns trigger
language plpgsql security definer set search_path = public as $$
begin perform public._crm_feed_lead(new); return new; end $$;
create function public._crm_on_invitation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public._crm_feed_invitation(new,
    tg_op = 'INSERT' or new.created_at is distinct from old.created_at,
    new.accepted_at is not null and (tg_op = 'INSERT' or old.accepted_at is null));
  return new;
end $$;
create function public._crm_on_contract() returns trigger
language plpgsql security definer set search_path = public as $$
begin perform public._crm_feed_active(new.student_id, 'Firmó el contrato en el Campus.', 'contract', new.signed_at); return new; end $$;
create function public._crm_on_class() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public._crm_feed_active(new.student_id,
    format('Primera clase: entró a la clase del %s.', public._crm_day((new.scheduled_at at time zone 'America/Lima')::date)), 'class', new.clicked_at);
  return new;
end $$;

create trigger placement_results_crm after insert on public.placement_results for each row execute function public._crm_on_placement();
create trigger enrollment_requests_crm after insert or update of handled_at on public.enrollment_requests for each row execute function public._crm_on_enrollment();
create trigger calculator_leads_crm after insert on public.calculator_leads for each row execute function public._crm_on_lead();
create trigger invitations_crm after insert or update on public.invitations for each row execute function public._crm_on_invitation();
create trigger contract_signatures_crm after insert on public.contract_signatures for each row execute function public._crm_on_contract();
create trigger class_joins_crm after insert on public.class_joins for each row execute function public._crm_on_class();

-- ─────────────────────────────────────────────────────────────
-- Envois du site (sans compte) : la campagne s'ajoute en fin de liste, avec une valeur par défaut,
-- pour que la version précédente du site continue de fonctionner.
-- ─────────────────────────────────────────────────────────────
drop function public.submit_placement(text, text, int, text, text, jsonb);
create function public.submit_placement(p_email text, p_level text, p_overall int, p_mode text, p_lang text, p_detail jsonb,
  p_campaign text default null, p_source text default null) returns boolean
language plpgsql security definer set search_path = public as $$
declare e text := lower(trim(coalesce(p_email, '')));
begin
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(e) > 200 then raise exception 'invalid email'; end if;
  if (select count(*) from placement_results where email = e and created_at > now() - interval '1 hour') >= 5 then return false; end if;
  if not public.web_submission_allowed('placement') then return false; end if;
  insert into placement_results (email, level, overall, mode, lang, detail, campaign, source)
  values (e, p_level, greatest(0, least(100, p_overall)), p_mode, p_lang, p_detail,
    left(nullif(trim(p_campaign), ''), 120), left(nullif(trim(p_source), ''), 120));
  return true;
end $$;

drop function public.submit_enrollment(text, text, text, text, text, text, int, text, text, date, text[], text[], date, text, text);
create function public.submit_enrollment(
  p_name text, p_email text, p_whatsapp text, p_objective text, p_level text, p_plan text, p_hours int,
  p_billing text, p_timezone text, p_start_date date, p_days text[], p_times text[], p_exam_date date,
  p_comments text, p_lang text, p_campaign text default null, p_source text default null) returns boolean
language plpgsql security definer set search_path = public as $$
declare e text := lower(trim(coalesce(p_email, '')));
begin
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(e) > 200 then raise exception 'invalid email'; end if;
  if length(trim(coalesce(p_name, ''))) = 0 then raise exception 'name required'; end if;
  if (select count(*) from enrollment_requests where email = e and created_at > now() - interval '1 hour') >= 5 then return false; end if;
  if not public.web_submission_allowed('enrollment') then return false; end if;
  insert into enrollment_requests (full_name, email, whatsapp, objective, level, plan, hours, billing, timezone,
    start_date, days, times, exam_date, comments, lang, campaign, source)
  values (left(trim(p_name), 120), e, left(p_whatsapp, 40), left(p_objective, 1000),
    case when p_level in ('A1', 'A2', 'B1', 'B2') then p_level end,
    case when p_plan in ('Esencial', 'Acelerado', 'Intensivo') then p_plan end,
    case when p_hours between 2 and 6 then p_hours end,
    case when p_billing in ('Mensual', 'Ciclo') then p_billing end,
    left(p_timezone, 120), p_start_date, (coalesce(p_days, '{}'))[1:8], (coalesce(p_times, '{}'))[1:3], p_exam_date,
    left(nullif(trim(p_comments), ''), 1000),
    case when p_lang in ('es', 'fr', 'en', 'de') then p_lang else 'es' end,
    left(nullif(trim(p_campaign), ''), 120), left(nullif(trim(p_source), ''), 120));
  return true;
end $$;

-- Calculateur CRS : nom, WhatsApp (obligatoire), e-mail (facultatif), score estimé.
-- Au plus 5 envois par e-mail ou WhatsApp et par heure, et 15 par connexion et par heure.
create function public.submit_lead(p_name text, p_whatsapp text, p_email text default null, p_crs int default null,
  p_french_eligible text default null, p_lang text default 'es', p_campaign text default null, p_source text default null) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  e text := nullif(lower(trim(coalesce(p_email, ''))), '');
  w text := left(trim(coalesce(p_whatsapp, '')), 40);
  wk text := public._crm_digits(p_whatsapp);
begin
  if length(trim(coalesce(p_name, ''))) = 0 then raise exception 'name required'; end if;
  if wk is null then raise exception 'whatsapp required'; end if;
  if e is not null and (e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(e) > 200) then raise exception 'invalid email'; end if;
  if (select count(*) from calculator_leads where created_at > now() - interval '1 hour'
      and (whatsapp_key = wk or (e is not null and email = e))) >= 5 then return false; end if;
  if not public.web_submission_allowed('lead') then return false; end if;
  insert into calculator_leads (full_name, email, whatsapp, crs_score, french_eligible, lang, campaign, source)
  values (left(trim(p_name), 120), e, w, case when p_crs between 0 and 1200 then p_crs end,
    case when p_french_eligible in ('yes', 'no', 'unknown') then p_french_eligible end,
    case when p_lang in ('es', 'fr', 'en', 'de') then p_lang else 'es' end,
    left(nullif(trim(p_campaign), ''), 120), left(nullif(trim(p_source), ''), 120));
  return true;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Pour l'administration (et seulement elle)
-- ─────────────────────────────────────────────────────────────
create function public._crm_json(p public.prospects) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', p.id, 'name', p.full_name, 'email', p.email, 'whatsapp', p.whatsapp, 'country', p.country, 'timezone', p.timezone,
    'goal', p.goal, 'exam', p.exam, 'exam_date', p.exam_date, 'level', p.level, 'level_score', p.level_score,
    'plan', p.plan, 'hours', p.hours, 'billing', p.billing, 'crs_score', p.crs_score, 'lang', p.lang,
    'origin', p.origin, 'campaign', p.campaign, 'source', p.source, 'referrer_name', p.referrer_name,
    'stage', p.stage, 'pause_kind', p.pause_kind, 'reason', p.reason,
    'owner_id', p.owner_id, 'owner', (select full_name from profiles where id = p.owner_id),
    'next_action', p.next_action, 'next_due', p.next_due,
    'student_id', p.student_id, 'student_name', (select full_name from profiles where id = p.student_id),
    'invited_at', p.invited_at, 'enrolled_at', p.enrolled_at, 'active_at', p.active_at, 'archived_at', p.archived_at,
    'created_at', p.created_at, 'updated_at', p.updated_at, 'stage_changed_at', p.stage_changed_at)
$$;

-- Liste (filtres facultatifs : origin, owner — un id ou 'none' —, stage, q, today, archived).
create function public.crm_prospects(p_filter jsonb default '{}') returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare f jsonb := coalesce(p_filter, '{}'); q text := nullif(lower(trim(f ->> 'q')), '');
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return coalesce((select jsonb_agg(public._crm_json(p) order by p.updated_at desc) from prospects p
    where (case when (f ->> 'archived')::boolean then p.archived_at is not null else p.archived_at is null end)
      and (f ->> 'origin' is null or p.origin = f ->> 'origin')
      and (f ->> 'stage' is null or p.stage = f ->> 'stage')
      and (f ->> 'owner' is null or (f ->> 'owner' = 'none' and p.owner_id is null) or p.owner_id::text = f ->> 'owner')
      and (not coalesce((f ->> 'today')::boolean, false) or p.next_due <= public._crm_today())
      and (q is null or lower(concat_ws(' ', p.full_name, p.email, p.whatsapp, p.country, p.campaign)) like '%' || q || '%'
        or (public._crm_digits(q) is not null and p.whatsapp_key like '%' || public._crm_digits(q) || '%'))
    ), '[]'::jsonb);
end $$;

-- Une fiche avec son historique, ses tests et ses demandes.
create function public.crm_prospect(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p prospects;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into p from prospects where id = p_id;
  if not found then return null; end if;
  return public._crm_json(p) || jsonb_build_object(
    'events', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'kind', e.kind, 'topic', e.topic, 'body', e.body,
        'author', (select full_name from profiles where id = e.author_id), 'created_at', e.created_at) order by e.created_at desc, e.id desc)
      from prospect_events e where e.prospect_id = p.id), '[]'::jsonb),
    'tests', coalesce((select jsonb_agg(jsonb_build_object('level', r.level, 'overall', r.overall, 'mode', r.mode, 'created_at', r.created_at) order by r.created_at desc)
      from placement_results r where p.email is not null and r.email = p.email), '[]'::jsonb),
    'requests', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'created_at', r.created_at, 'handled_at', r.handled_at) order by r.created_at desc)
      from enrollment_requests r where p.email is not null and r.email = p.email), '[]'::jsonb));
end $$;

-- Ajouter une personne arrivée par un autre canal. Si l'e-mail ou le WhatsApp est déjà connu,
-- la fiche existante est renvoyée (existing = true) sans rien changer.
create function public.crm_create_prospect(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  e text := nullif(lower(trim(coalesce(p ->> 'email', ''))), '');
  wk text := public._crm_digits(p ->> 'whatsapp');
  o text := coalesce(nullif(p ->> 'origin', ''), 'other');
  v_owner uuid := coalesce(nullif(p ->> 'owner_id', '')::uuid, auth.uid());
  pid uuid; rec prospects;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if length(trim(coalesce(p ->> 'name', ''))) = 0 then raise exception 'name required'; end if;
  if e is not null and e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid email'; end if;
  if not exists (select 1 from profiles where id = v_owner and role = 'admin') then raise exception 'owner must be an admin'; end if;
  if e is not null then select id into pid from prospects where email = e; end if;
  if pid is null and wk is not null then select id into pid from prospects where whatsapp_key = wk order by created_at desc limit 1; end if;
  if pid is not null then
    select * into rec from prospects where id = pid;
    return public._crm_json(rec) || jsonb_build_object('existing', true);
  end if;
  insert into prospects (full_name, email, whatsapp, country, goal, exam, origin, campaign, referrer_name, owner_id, next_action, next_due)
  values (left(trim(p ->> 'name'), 120), e, left(nullif(trim(p ->> 'whatsapp'), ''), 40), left(nullif(trim(p ->> 'country'), ''), 120),
    left(nullif(trim(p ->> 'goal'), ''), 1000), left(nullif(trim(p ->> 'exam'), ''), 60), o,
    left(nullif(trim(p ->> 'campaign'), ''), 120), left(nullif(trim(p ->> 'referrer_name'), ''), 120), v_owner,
    'Primer contacto', public._crm_today())
  returning * into rec;
  perform public._crm_event(rec.id, 'auto', 'Añadido a mano.', 'manual', auth.uid(), null);
  select * into rec from prospects where id = rec.id;
  return public._crm_json(rec) || jsonb_build_object('existing', false);
end $$;

-- Modifier une fiche : seules les clés présentes changent (une valeur vide efface le champ).
create function public.crm_update_prospect(p_id uuid, p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  prev prospects; cur prospects; me uuid := auth.uid();
  e text := nullif(lower(trim(coalesce(p ->> 'email', ''))), '');
  v_owner uuid := nullif(p ->> 'owner_id', '')::uuid;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into prev from prospects where id = p_id for update;
  if not found then raise exception 'not found'; end if;
  if p ? 'owner_id' and v_owner is not null and not exists (select 1 from profiles where id = v_owner and role = 'admin') then
    raise exception 'owner must be an admin';
  end if;
  if p ? 'email' and e is not null then
    if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid email'; end if;
    if exists (select 1 from prospects where email = e and id <> p_id) then raise exception 'email already used by another prospect'; end if;
  end if;
  update prospects set
    full_name = case when p ? 'name' then left(nullif(trim(p ->> 'name'), ''), 120) else full_name end,
    email = case when p ? 'email' then e else email end,
    whatsapp = case when p ? 'whatsapp' then left(nullif(trim(p ->> 'whatsapp'), ''), 40) else whatsapp end,
    country = case when p ? 'country' then left(nullif(trim(p ->> 'country'), ''), 120) else country end,
    timezone = case when p ? 'timezone' then left(nullif(trim(p ->> 'timezone'), ''), 120) else timezone end,
    goal = case when p ? 'goal' then left(nullif(trim(p ->> 'goal'), ''), 1000) else goal end,
    exam = case when p ? 'exam' then left(nullif(trim(p ->> 'exam'), ''), 60) else exam end,
    exam_date = case when p ? 'exam_date' then nullif(p ->> 'exam_date', '')::date else exam_date end,
    level = case when p ? 'level' then nullif(p ->> 'level', '') else level end,
    plan = case when p ? 'plan' then nullif(p ->> 'plan', '') else plan end,
    hours = case when p ? 'hours' then nullif(p ->> 'hours', '')::int else hours end,
    billing = case when p ? 'billing' then nullif(p ->> 'billing', '') else billing end,
    origin = case when p ? 'origin' then coalesce(nullif(p ->> 'origin', ''), origin) else origin end,
    campaign = case when p ? 'campaign' then left(nullif(trim(p ->> 'campaign'), ''), 120) else campaign end,
    referrer_name = case when p ? 'referrer_name' then left(nullif(trim(p ->> 'referrer_name'), ''), 120) else referrer_name end,
    stage = case when p ? 'stage' then p ->> 'stage' else stage end,
    pause_kind = case when p ? 'pause_kind' then nullif(p ->> 'pause_kind', '') else pause_kind end,
    reason = case when p ? 'reason' then left(nullif(trim(p ->> 'reason'), ''), 300) else reason end,
    owner_id = case when p ? 'owner_id' then v_owner else owner_id end,
    next_action = case when p ? 'next_action' then left(nullif(trim(p ->> 'next_action'), ''), 200) else next_action end,
    next_due = case when p ? 'next_due' then nullif(p ->> 'next_due', '')::date else next_due end,
    updated_at = now()
  where id = p_id returning * into cur;
  -- Une fiche hors de « pausa » n'a pas de motif de pause ; en « pausa », « En pausa » par défaut.
  update prospects set
    pause_kind = case when stage = 'pausa' then coalesce(pause_kind, 'En pausa') end,
    reason = case when stage = 'pausa' then reason end,
    stage_changed_at = case when stage <> prev.stage then now() else stage_changed_at end,
    enrolled_at = case when stage in ('inscrito', 'activo') then coalesce(enrolled_at, now()) else enrolled_at end,
    active_at = case when stage = 'activo' then coalesce(active_at, now()) else active_at end
  where id = p_id returning * into cur;
  if cur.stage <> prev.stage then
    perform public._crm_event(p_id, 'auto', format('Pasó a «%s»%s.', public._crm_stage_name(cur.stage),
      case when cur.stage = 'pausa' then ' · ' || cur.pause_kind || coalesce(': ' || cur.reason, '') else '' end), 'stage', me, null);
  elsif cur.stage = 'pausa' and (cur.pause_kind is distinct from prev.pause_kind or cur.reason is distinct from prev.reason) then
    perform public._crm_event(p_id, 'auto', format('%s%s.', cur.pause_kind, coalesce(': ' || cur.reason, '')), 'stage', me, null);
  end if;
  if cur.owner_id is distinct from prev.owner_id then
    perform public._crm_event(p_id, 'auto', coalesce('Responsable: ' || (select full_name from profiles where id = cur.owner_id) || '.', 'Sin responsable.'), 'owner', me, null);
  end if;
  select * into cur from prospects where id = p_id;
  return public._crm_json(cur);
end $$;

-- Ajouter une note à l'historique.
create function public.crm_add_note(p_id uuid, p_body text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare ev prospect_events;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if length(trim(coalesce(p_body, ''))) = 0 then raise exception 'empty note'; end if;
  if not exists (select 1 from prospects where id = p_id) then raise exception 'not found'; end if;
  insert into prospect_events (prospect_id, kind, topic, body, author_id) values (p_id, 'note', 'note', left(trim(p_body), 2000), auth.uid())
  returning * into ev;
  update prospects set updated_at = now() where id = p_id;
  return jsonb_build_object('id', ev.id, 'kind', ev.kind, 'body', ev.body, 'created_at', ev.created_at,
    'author', (select full_name from profiles where id = ev.author_id));
end $$;

-- Archiver (ou ressortir) une fiche : elle disparaît du tableau sans être effacée.
create function public.crm_archive_prospect(p_id uuid, p_archived boolean default true) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  update prospects set archived_at = case when p_archived then now() end, updated_at = now() where id = p_id;
  if found then perform public._crm_event(p_id, 'auto', case when p_archived then 'Fiche archivée.' else 'Fiche restaurée.' end, 'archive', auth.uid(), null); end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Fiches à partir de ce qui est déjà arrivé (une seule fois)
-- ─────────────────────────────────────────────────────────────
do $$
declare r record; x record; rp placement_results; re enrollment_requests; ri invitations;
begin
  for r in select 'placement' k, id, created_at from placement_results
           union all select 'enrollment', id, created_at from enrollment_requests
           order by created_at loop
    if r.k = 'placement' then
      select * into rp from placement_results where id = r.id; perform public._crm_feed_placement(rp);
    else
      select * into re from enrollment_requests where id = r.id; perform public._crm_feed_enrollment(re);
      if re.handled_at is not null then
        perform public._crm_advance((select id from prospects where email = re.email), 'contactado', re.handled_at);
      end if;
    end if;
  end loop;
  -- Ceux qui ont déjà été invités, ont signé ou suivi une classe.
  for ri in select * from invitations where role = 'student' and email in (select email from prospects where email is not null) order by created_at loop
    perform public._crm_feed_invitation(ri, true, ri.accepted_at is not null);
  end loop;
  for x in select distinct on (student_id) student_id, signed_at from contract_signatures order by student_id, signed_at loop
    perform public._crm_feed_active(x.student_id, 'Firmó el contrato en el Campus.', 'contract', x.signed_at);
  end loop;
  for x in select distinct on (student_id) student_id, scheduled_at, clicked_at from class_joins order by student_id, clicked_at loop
    perform public._crm_feed_active(x.student_id, format('Primera clase: entró a la clase del %s.', public._crm_day((x.scheduled_at at time zone 'America/Lima')::date)), 'class', x.clicked_at);
  end loop;
  -- Une demande déjà traitée ou une fiche déjà inscrite n'attend pas de « primer mensaje » aujourd'hui.
  update prospects set next_action = null, next_due = null where stage in ('contactado', 'activo') and next_action in
    ('Escribir con el resultado del test', 'Responder a la solicitud de inscripción');
end $$;

-- ─────────────────────────────────────────────────────────────
-- Droits
-- ─────────────────────────────────────────────────────────────
revoke execute on function public._crm_rank(text), public._crm_stage_name(text), public._crm_digits(text), public._crm_today(),
  public._crm_day(date), public._crm_origin(text, text, text), public._crm_event(uuid, text, text, text, uuid, timestamptz),
  public._crm_advance(uuid, text, timestamptz), public._crm_upsert(text, text, text, text, text, text, text, timestamptz),
  public._crm_default_next(uuid, text), public._crm_feed_placement(public.placement_results),
  public._crm_feed_enrollment(public.enrollment_requests), public._crm_feed_lead(public.calculator_leads),
  public._crm_feed_invitation(public.invitations, boolean, boolean), public._crm_for_student(uuid),
  public._crm_feed_active(uuid, text, text, timestamptz), public._crm_json(public.prospects),
  public._crm_on_placement(), public._crm_on_enrollment(), public._crm_on_lead(), public._crm_on_invitation(),
  public._crm_on_contract(), public._crm_on_class() from public, anon, authenticated;

revoke execute on function public.submit_placement(text, text, int, text, text, jsonb, text, text),
  public.submit_enrollment(text, text, text, text, text, text, int, text, text, date, text[], text[], date, text, text, text, text),
  public.submit_lead(text, text, text, int, text, text, text, text) from public;
grant execute on function public.submit_placement(text, text, int, text, text, jsonb, text, text),
  public.submit_enrollment(text, text, text, text, text, text, int, text, text, date, text[], text[], date, text, text, text, text),
  public.submit_lead(text, text, text, int, text, text, text, text) to anon, authenticated;

revoke execute on function public.is_admin(), public.crm_prospects(jsonb), public.crm_prospect(uuid), public.crm_create_prospect(jsonb),
  public.crm_update_prospect(uuid, jsonb), public.crm_add_note(uuid, text), public.crm_archive_prospect(uuid, boolean) from public, anon;
grant execute on function public.is_admin(), public.crm_prospects(jsonb), public.crm_prospect(uuid), public.crm_create_prospect(jsonb),
  public.crm_update_prospect(uuid, jsonb), public.crm_add_note(uuid, text), public.crm_archive_prospect(uuid, boolean) to authenticated;

commit;

-- Le site appelle les nouvelles versions des fonctions tout de suite.
notify pgrst, 'reload schema';
