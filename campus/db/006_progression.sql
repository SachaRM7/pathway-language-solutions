-- Campus Pathway · 006 · progression des unités (décision de la réunion avec Ryan)
-- À exécuter après 005 (SQL Editor → New query → Run).
-- • Une unité s'ouvre quand la précédente (même niveau, publiée) est réussie avec au moins 75 % de bonnes réponses
--   du premier coup. La première unité publiée du niveau est toujours ouverte ; une unité donnée en devoir aussi.
-- • En cas d'échec (moins de 75 %), la même unité est bloquée 24 heures avant une nouvelle tentative.
-- • Une unité commencée et quittée peut être reprise là où l'élève s'était arrêté.
-- Les professeurs et les admins ne sont pas bloqués.

begin;

create function public.unit_access(p_user uuid, p_unit text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  u units;
  prev text;
  last_run lesson_runs;
  passed boolean;
  cooldown timestamptz;
  unlocked boolean;
begin
  select * into u from units where id = p_unit;
  if not found then return jsonb_build_object('unlocked', false, 'passed', false); end if;
  if exists (select 1 from profiles where id = p_user and role in ('teacher', 'admin')) then
    return jsonb_build_object('unlocked', true, 'passed', false);
  end if;
  passed := exists (select 1 from lesson_runs r where r.user_id = p_user and r.unit_id = p_unit and r.first_try_correct * 100 >= 75 * r.total);
  select * into last_run from lesson_runs r where r.user_id = p_user and r.unit_id = p_unit order by r.finished_at desc limit 1;
  if not passed and last_run.id is not null and last_run.finished_at + interval '24 hours' > now() then
    cooldown := last_run.finished_at + interval '24 hours';
  end if;
  select x.id into prev from units x
    where x.level = u.level and x.number < u.number
      and exists (select 1 from exercises e where e.unit_id = x.id and e.status = 'validated')
    order by x.number desc limit 1;
  unlocked := prev is null
    or exists (select 1 from lesson_runs r where r.user_id = p_user and r.unit_id = prev and r.first_try_correct * 100 >= 75 * r.total)
    or exists (select 1 from assignment_students s join assignments a on a.id = s.assignment_id where s.student_id = p_user and a.unit_id = p_unit);
  return jsonb_build_object('unlocked', unlocked, 'passed', passed, 'cooldown_until', cooldown);
end $$;

-- Garde-fou côté serveur : une leçon ne peut être enregistrée que sur une unité ouverte et hors délai de 24 h.
create function public._check_unit_access() returns trigger
language plpgsql security definer set search_path = public as $$
declare a jsonb := public.unit_access(new.user_id, new.unit_id);
begin
  if not coalesce((a ->> 'unlocked')::boolean, false) then raise exception 'unit locked'; end if;
  if a ->> 'cooldown_until' is not null then raise exception 'unit cooldown'; end if;
  return new;
end $$;
create trigger lesson_runs_access before insert on public.lesson_runs
  for each row execute function public._check_unit_access();

-- Reprise d'une unité commencée.
create table public.lesson_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  unit_id text not null references public.units (id) on delete cascade,
  state jsonb not null check (octet_length(state::text) < 20000),
  updated_at timestamptz not null default now(),
  primary key (user_id, unit_id)
);
alter table public.lesson_progress enable row level security;
create policy "lesson_progress: le sien" on public.lesson_progress for select to authenticated using (user_id = auth.uid());
grant select on public.lesson_progress to authenticated;

create function public.save_lesson_progress(p_unit text, p_state jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into lesson_progress (user_id, unit_id, state) values (auth.uid(), p_unit, p_state)
  on conflict (user_id, unit_id) do update set state = excluded.state, updated_at = now();
end $$;

create function public.clear_lesson_progress(p_unit text) returns void
language sql security definer set search_path = public as $$
  delete from lesson_progress where user_id = auth.uid() and unit_id = p_unit
$$;

revoke execute on function public.unit_access(uuid, text), public._check_unit_access() from public, anon, authenticated;
revoke execute on function public.save_lesson_progress(text, jsonb), public.clear_lesson_progress(text) from public, anon;
grant execute on function public.save_lesson_progress(text, jsonb), public.clear_lesson_progress(text) to authenticated;

commit;
