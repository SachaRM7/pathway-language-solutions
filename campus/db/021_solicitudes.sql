-- Campus Pathway · 021 · demandes d'inscription envoyées depuis le site
-- À exécuter après 020 (SQL Editor → New query → Run).
--
-- • À la fin du formulaire d'inscription du site (4 langues), la demande est enregistrée ici
--   (nom, e-mail, WhatsApp, objectif, niveau du test, formule, fuseau, début, jours, créneaux,
--   date d'examen, précisions, langue), puis WhatsApp s'ouvre comme avant.
-- • Le site l'envoie sans compte, au plus 5 demandes par adresse et par heure ; personne ne
--   peut lire la table depuis le site.
-- • L'équipe la voit dans le Campus (« Cuentas » → « Solicitudes de inscripción »), invite
--   l'élève d'un clic (e-mail, nom et niveau préremplis) et la marque comme traitée.

begin;

create table public.enrollment_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(full_name) between 1 and 120),
  email text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200),
  whatsapp text check (length(whatsapp) <= 40),
  objective text check (length(objective) <= 1000),
  level text check (level in ('A1', 'A2', 'B1', 'B2')),
  plan text check (plan in ('Esencial', 'Acelerado', 'Intensivo')),
  hours int check (hours between 2 and 6),
  billing text check (billing in ('Mensual', 'Ciclo')),
  timezone text check (length(timezone) <= 120),
  start_date date,
  days text[] check (cardinality(days) <= 8),
  times text[] check (cardinality(times) <= 3),
  exam_date date,
  comments text check (length(comments) <= 1000),
  lang text check (lang in ('es', 'fr', 'en', 'de')),
  created_at timestamptz not null default now(),
  handled_at timestamptz,
  handled_by uuid references auth.users (id) on delete set null
);
create index enrollment_requests_open on public.enrollment_requests (created_at desc) where handled_at is null;
create index enrollment_requests_email on public.enrollment_requests (email, created_at desc);
alter table public.enrollment_requests enable row level security;
revoke all on public.enrollment_requests from anon, authenticated;

-- Envoi depuis le site (sans compte). Au plus 5 demandes par adresse et par heure.
create function public.submit_enrollment(
  p_name text, p_email text, p_whatsapp text, p_objective text, p_level text, p_plan text, p_hours int,
  p_billing text, p_timezone text, p_start_date date, p_days text[], p_times text[], p_exam_date date,
  p_comments text, p_lang text) returns boolean
language plpgsql security definer set search_path = public as $$
declare e text := lower(trim(coalesce(p_email, '')));
begin
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(e) > 200 then raise exception 'invalid email'; end if;
  if length(trim(coalesce(p_name, ''))) = 0 then raise exception 'name required'; end if;
  if (select count(*) from enrollment_requests where email = e and created_at > now() - interval '1 hour') >= 5 then return false; end if;
  insert into enrollment_requests (full_name, email, whatsapp, objective, level, plan, hours, billing, timezone,
    start_date, days, times, exam_date, comments, lang)
  values (left(trim(p_name), 120), e, left(p_whatsapp, 40), left(p_objective, 1000),
    case when p_level in ('A1', 'A2', 'B1', 'B2') then p_level end,
    case when p_plan in ('Esencial', 'Acelerado', 'Intensivo') then p_plan end,
    case when p_hours between 2 and 6 then p_hours end,
    case when p_billing in ('Mensual', 'Ciclo') then p_billing end,
    left(p_timezone, 120), p_start_date, (coalesce(p_days, '{}'))[1:8], (coalesce(p_times, '{}'))[1:3], p_exam_date,
    left(nullif(trim(p_comments), ''), 1000),
    case when p_lang in ('es', 'fr', 'en', 'de') then p_lang else 'es' end);
  return true;
end $$;

-- Pour l'équipe : les demandes, les plus récentes d'abord (les traitées depuis plus de 60 jours disparaissent de la liste).
create function public.staff_enrollments() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', r.id, 'name', r.full_name, 'email', r.email, 'whatsapp', r.whatsapp, 'objective', r.objective,
      'level', r.level, 'plan', r.plan, 'hours', r.hours, 'billing', r.billing, 'timezone', r.timezone,
      'start_date', r.start_date, 'days', r.days, 'times', r.times, 'exam_date', r.exam_date,
      'comments', r.comments, 'lang', r.lang, 'created_at', r.created_at, 'handled_at', r.handled_at,
      'handled_by', (select p.full_name from profiles p where p.id = r.handled_by)) order by r.created_at desc)
    from enrollment_requests r
    where r.handled_at is null or r.handled_at > now() - interval '60 days'), '[]'::jsonb);
end $$;

-- Pour l'équipe : marquer une demande comme traitée (ou la rouvrir).
create function public.set_enrollment_handled(p_id uuid, p_handled boolean default true) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  update enrollment_requests
    set handled_at = case when p_handled then now() end, handled_by = case when p_handled then auth.uid() end
    where id = p_id;
end $$;

revoke execute on function public.submit_enrollment(text, text, text, text, text, text, int, text, text, date, text[], text[], date, text, text) from public;
grant execute on function public.submit_enrollment(text, text, text, text, text, text, int, text, text, date, text[], text[], date, text, text) to anon, authenticated;
revoke execute on function public.staff_enrollments(), public.set_enrollment_handled(uuid, boolean) from public, anon;
grant execute on function public.staff_enrollments(), public.set_enrollment_handled(uuid, boolean) to authenticated;

commit;
