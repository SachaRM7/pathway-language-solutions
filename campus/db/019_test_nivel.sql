-- Campus Pathway · 019 · résultat du test de positionnement relié à l'e-mail
-- À exécuter après 018 (SQL Editor → New query → Run).
--
-- • À la fin du test du site, la personne écrit son e-mail pour voir son résultat : le niveau,
--   l'indice et le détail par compétence sont enregistrés avec cet e-mail.
-- • Quand un prof ou l'admin invite un élève, le niveau se remplit tout seul dès qu'il tape son
--   e-mail (dernier test de cette adresse).
-- • Dans l'onboarding, l'élève voit son niveau sélectionné d'après son test, sans le choisir.

begin;

create table public.placement_results (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200),
  level text not null check (level in ('A1', 'A2', 'B1', 'B2')),
  overall int check (overall between 0 and 100),
  mode text check (mode in ('express', 'intensive')),
  lang text check (lang in ('es', 'fr', 'en', 'de')),
  detail jsonb check (octet_length(detail::text) < 4000),
  created_at timestamptz not null default now()
);
create index placement_results_email on public.placement_results (email, created_at desc);
alter table public.placement_results enable row level security;
revoke all on public.placement_results from anon, authenticated;

-- Envoi depuis le site (sans compte). Au plus 5 tests par adresse et par heure.
create function public.submit_placement(p_email text, p_level text, p_overall int, p_mode text, p_lang text, p_detail jsonb) returns boolean
language plpgsql security definer set search_path = public as $$
declare e text := lower(trim(coalesce(p_email, '')));
begin
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(e) > 200 then raise exception 'invalid email'; end if;
  if (select count(*) from placement_results where email = e and created_at > now() - interval '1 hour') >= 5 then return false; end if;
  insert into placement_results (email, level, overall, mode, lang, detail)
  values (e, p_level, greatest(0, least(100, p_overall)), p_mode, p_lang, p_detail);
  return true;
end $$;

-- Pour l'équipe : le dernier test d'une adresse.
create function public.placement_for_email(p_email text) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.is_staff() then (
    select jsonb_build_object('level', level, 'overall', overall, 'mode', mode, 'detail', detail, 'created_at', created_at)
    from placement_results where email = lower(trim(p_email)) order by created_at desc limit 1) end
$$;

-- Pour l'élève : son propre dernier test (même adresse que son compte).
create function public.my_placement() returns jsonb
language sql stable security definer set search_path = public, auth as $$
  select jsonb_build_object('level', r.level, 'overall', r.overall, 'created_at', r.created_at)
  from placement_results r join auth.users u on lower(u.email) = r.email
  where u.id = auth.uid() order by r.created_at desc limit 1
$$;

revoke execute on function public.submit_placement(text, text, int, text, text, jsonb) from public;
grant execute on function public.submit_placement(text, text, int, text, text, jsonb) to anon, authenticated;
revoke execute on function public.placement_for_email(text), public.my_placement() from public, anon;
grant execute on function public.placement_for_email(text), public.my_placement() to authenticated;

commit;
