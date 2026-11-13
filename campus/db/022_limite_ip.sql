-- Campus Pathway · 022 · limite par connexion pour le test et l'inscription du site
-- À exécuter après 021 (SQL Editor → New query → Run).
--
-- • Jusqu'ici, le test de niveau et le formulaire d'inscription étaient limités à 5 envois par
--   adresse e-mail et par heure. Quelqu'un pouvait donc envoyer des tests au nom de beaucoup
--   d'adresses différentes.
-- • Désormais, chaque connexion (adresse IP) est aussi limitée : 30 tests et 15 demandes
--   d'inscription par heure. Les chiffres sont larges parce qu'au Pérou beaucoup de téléphones
--   partagent la même adresse IP chez l'opérateur.
-- • L'adresse IP n'est jamais stockée en clair : seulement une empreinte (SHA-256), effacée
--   au bout de 24 heures.

begin;

create table public.web_submissions (
  ip_hash text not null,
  kind text not null check (kind in ('placement', 'enrollment')),
  created_at timestamptz not null default now()
);
create index web_submissions_ip on public.web_submissions (ip_hash, kind, created_at desc);
alter table public.web_submissions enable row level security;
revoke all on public.web_submissions from anon, authenticated;

-- Vrai si cette connexion peut encore envoyer (et note l'envoi). Sans adresse IP lisible, on laisse passer.
create function public.web_submission_allowed(p_kind text) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  h json := nullif(current_setting('request.headers', true), '')::json;
  ip text := nullif(trim(coalesce(h ->> 'cf-connecting-ip', h ->> 'x-real-ip', split_part(coalesce(h ->> 'x-forwarded-for', ''), ',', 1))), '');
  hashed text;
  max_per_hour int := case p_kind when 'placement' then 30 else 15 end;
begin
  if ip is null then return true; end if;
  hashed := encode(sha256(convert_to('pathway:' || ip, 'UTF8')), 'hex');
  delete from web_submissions where created_at < now() - interval '24 hours';
  if (select count(*) from web_submissions where ip_hash = hashed and kind = p_kind and created_at > now() - interval '1 hour') >= max_per_hour then
    return false;
  end if;
  insert into web_submissions (ip_hash, kind) values (hashed, p_kind);
  return true;
end $$;
revoke execute on function public.web_submission_allowed(text) from public, anon, authenticated;

-- Test de niveau : même fonction qu'en 019, plus la limite par connexion.
create or replace function public.submit_placement(p_email text, p_level text, p_overall int, p_mode text, p_lang text, p_detail jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare e text := lower(trim(coalesce(p_email, '')));
begin
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(e) > 200 then raise exception 'invalid email'; end if;
  if (select count(*) from placement_results where email = e and created_at > now() - interval '1 hour') >= 5 then return false; end if;
  if not public.web_submission_allowed('placement') then return false; end if;
  insert into placement_results (email, level, overall, mode, lang, detail)
  values (e, p_level, greatest(0, least(100, p_overall)), p_mode, p_lang, p_detail);
  return true;
end $$;

-- Inscription : même fonction qu'en 021, plus la limite par connexion.
create or replace function public.submit_enrollment(
  p_name text, p_email text, p_whatsapp text, p_objective text, p_level text, p_plan text, p_hours int,
  p_billing text, p_timezone text, p_start_date date, p_days text[], p_times text[], p_exam_date date,
  p_comments text, p_lang text) returns boolean
language plpgsql security definer set search_path = public as $$
declare e text := lower(trim(coalesce(p_email, '')));
begin
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(e) > 200 then raise exception 'invalid email'; end if;
  if length(trim(coalesce(p_name, ''))) = 0 then raise exception 'name required'; end if;
  if (select count(*) from enrollment_requests where email = e and created_at > now() - interval '1 hour') >= 5 then return false; end if;
  if not public.web_submission_allowed('enrollment') then return false; end if;
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

commit;
