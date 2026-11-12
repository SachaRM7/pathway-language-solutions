-- Campus Pathway · 012 · examen de fin de niveau en deux étapes (décision de la réunion avec Ryan)
-- À exécuter après 011 (SQL Editor → New query → Run).
-- 1. Le professeur valide l'examen passé avec lui (« Validar el examen » dans « Mi grupo »).
-- 2. L'élève passe sur le Campus l'examen final du niveau (créé dans « Contenido » avec
--    « Crear el examen final », environ 15 minutes), ouvert une fois toutes les unités du niveau réussies
--    et l'étape 1 validée. Réussi avec au moins 75 %, il passe au niveau suivant.
-- Tant qu'aucun examen final n'est publié pour un niveau, la validation du professeur suffit.

begin;

alter table public.units add column if not exists is_final boolean not null default false;
create unique index if not exists units_one_final_per_level on public.units (level) where is_final;

create table public.level_validations (
  student_id uuid not null references public.profiles (id) on delete cascade,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2')),
  teacher_passed_at timestamptz,
  teacher_by uuid references public.profiles (id) on delete set null,
  final_passed_at timestamptz,
  promoted_at timestamptz,
  promoted_to text,
  primary key (student_id, level)
);
alter table public.level_validations enable row level security;
create policy "level_validations: la sienne ou celles de ses élèves" on public.level_validations for select to authenticated
  using (student_id = auth.uid() or public.teaches(student_id));

-- Examen final publié d'un niveau (null s'il n'y en a pas).
create function public._final_unit(p_level text) returns text
language sql stable security definer set search_path = public as $$
  select u.id from units u where u.level = p_level and u.is_final
    and exists (select 1 from exercises e where e.unit_id = u.id and e.status = 'validated')
$$;

-- Toutes les unités publiées du niveau (hors examen final) réussies avec au moins 75 %.
create function public._level_units_done(p_user uuid, p_level text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from units u
    where u.level = p_level and not u.is_final
      and exists (select 1 from exercises e where e.unit_id = u.id and e.status = 'validated')
      and not exists (select 1 from lesson_runs r where r.user_id = p_user and r.unit_id = u.id and r.first_try_correct * 100 >= 75 * r.total))
$$;

-- Passe l'élève au niveau suivant quand les deux étapes sont validées.
create function public._try_promote(p_user uuid, p_level text) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v level_validations;
  nxt text := case p_level when 'A1' then 'A2' when 'A2' then 'B1' when 'B1' then 'B2' end;
begin
  select * into v from level_validations where student_id = p_user and level = p_level;
  if not found or v.promoted_at is not null or v.teacher_passed_at is null then return false; end if;
  if public._final_unit(p_level) is not null and v.final_passed_at is null then return false; end if;
  update level_validations set promoted_at = now(), promoted_to = nxt where student_id = p_user and level = p_level;
  if nxt is not null then update profiles set level = nxt where id = p_user and level = p_level; end if;
  return true;
end $$;

-- Règle d'ouverture des unités (remplace celle du 006) : l'examen final ne compte pas dans la
-- chaîne des unités ; il s'ouvre quand toutes les unités du niveau sont réussies et que le
-- professeur a validé son examen.
create or replace function public.unit_access(p_user uuid, p_unit text) returns jsonb
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
  if u.is_final then
    unlocked := public._level_units_done(p_user, u.level)
      and exists (select 1 from level_validations v where v.student_id = p_user and v.level = u.level and v.teacher_passed_at is not null);
    return jsonb_build_object('unlocked', unlocked, 'passed', passed, 'cooldown_until', cooldown, 'final', true);
  end if;
  select x.id into prev from units x
    where x.level = u.level and x.number < u.number and not x.is_final
      and exists (select 1 from exercises e where e.unit_id = x.id and e.status = 'validated')
    order by x.number desc limit 1;
  unlocked := prev is null
    or exists (select 1 from lesson_runs r where r.user_id = p_user and r.unit_id = prev and r.first_try_correct * 100 >= 75 * r.total)
    or exists (select 1 from assignment_students s join assignments a on a.id = s.assignment_id where s.student_id = p_user and a.unit_id = p_unit);
  return jsonb_build_object('unlocked', unlocked, 'passed', passed, 'cooldown_until', cooldown);
end $$;

-- Examen final réussi : étape 2 validée, puis passage au niveau suivant si l'étape 1 l'est aussi.
create function public._after_final_run() returns trigger
language plpgsql security definer set search_path = public as $$
declare lvl text;
begin
  select level into lvl from units where id = new.unit_id and is_final;
  if lvl is null or new.first_try_correct * 100 < 75 * new.total then return new; end if;
  insert into level_validations (student_id, level, final_passed_at) values (new.user_id, lvl, now())
  on conflict (student_id, level) do update set final_passed_at = coalesce(level_validations.final_passed_at, now());
  perform public._try_promote(new.user_id, lvl);
  return new;
end $$;
create trigger lesson_runs_final after insert on public.lesson_runs
  for each row execute function public._after_final_run();

-- Professeur de l'élève ou admin : étape 1, l'examen passé avec le professeur est validé.
create function public.validate_teacher_exam(p_student uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare lvl text; promoted boolean;
begin
  if not public.teaches(p_student) then raise exception 'not your student'; end if;
  select level into lvl from profiles where id = p_student and role = 'student';
  if lvl is null then raise exception 'student not found'; end if;
  insert into level_validations (student_id, level, teacher_passed_at, teacher_by) values (p_student, lvl, now(), auth.uid())
  on conflict (student_id, level) do update set teacher_passed_at = coalesce(level_validations.teacher_passed_at, now()), teacher_by = coalesce(level_validations.teacher_by, auth.uid());
  promoted := public._try_promote(p_student, lvl);
  return jsonb_build_object('level', lvl, 'promoted', promoted, 'needs_final', not promoted and public._final_unit(lvl) is not null);
end $$;

-- Équipe : où en est chaque élève dans son niveau.
create function public.staff_level_status() returns table (student_id uuid, level text, units_done boolean, has_final boolean,
  teacher_passed_at timestamptz, final_passed_at timestamptz, last_promotion timestamptz, last_promotion_to text)
language sql stable security definer set search_path = public as $$
  select p.id, p.level, public._level_units_done(p.id, p.level), public._final_unit(p.level) is not null,
    v.teacher_passed_at, v.final_passed_at,
    (select max(promoted_at) from level_validations x where x.student_id = p.id),
    (select x.promoted_to from level_validations x where x.student_id = p.id and x.promoted_at is not null order by x.promoted_at desc limit 1)
  from profiles p left join level_validations v on v.student_id = p.id and v.level = p.level
  where p.role = 'student' and public.teaches(p.id)
$$;

-- Équipe : créer l'examen final d'un niveau (unité n° 100, hors des 64 unités du manuel).
-- Ses exercices s'ajoutent ensuite dans l'éditeur, comme pour une unité.
create function public.create_final_unit(p_level text, p_title text) returns text
language plpgsql security definer set search_path = public as $$
declare v_id text := lower(p_level) || '-final';
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  if p_level not in ('A1', 'A2', 'B1', 'B2') then raise exception 'bad level'; end if;
  if exists (select 1 from units where id = v_id) then return v_id; end if;
  insert into units (id, level, segment, number, title, is_final)
  values (v_id, p_level, 'D', 100, left(coalesce(nullif(trim(p_title), ''), 'Examen final ' || p_level), 160), true);
  return v_id;
end $$;

grant select on public.level_validations to authenticated;
revoke execute on function public._final_unit(text), public._level_units_done(uuid, text), public._try_promote(uuid, text) from public, anon, authenticated;
revoke execute on function public.validate_teacher_exam(uuid), public.staff_level_status(), public.create_final_unit(text, text) from public, anon;
grant execute on function public.validate_teacher_exam(uuid), public.staff_level_status(), public.create_final_unit(text, text) to authenticated;

commit;
