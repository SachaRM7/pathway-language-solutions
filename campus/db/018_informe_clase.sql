-- Campus Pathway · 018 · rapport de fin de cours et déblocage des unités
-- À exécuter après 017 (SQL Editor → New query → Run). Rien ne change pour les élèves tant que
-- l'admin n'active pas « Abrir las unidades según el informe de clase » dans « Ajustes ».
--
-- • À la fin de chaque cours, le prof remplit un court rapport : les unités vues (ou survolées)
--   pendant le cours. Ces unités sont alors « vues en classe » pour l'élève.
-- • Une unité s'ouvre quand elle a été vue en classe ET que l'unité précédente est réussie
--   (75 %). Exemple : le prof a vu l'unité 5, mais l'élève en est à l'unité 2 : il doit d'abord
--   réussir 2, 3 et 4. Et même s'il réussit la 5, la 6 reste fermée tant qu'elle n'est pas vue.
-- • Une unité donnée en devoir par le prof compte comme vue.
-- • L'onboarding propose aussi le TEFAQ.

begin;

-- L'onboarding propose aussi le TEFAQ (Québec).
alter table public.profiles drop constraint if exists profiles_exam_check;
alter table public.profiles add constraint profiles_exam_check check (exam in ('tef', 'tcf', 'ambos', 'tefaq', 'nose'));

insert into public.campus_settings (key, value) values ('progression', '{"taught_gate": false}') on conflict (key) do nothing;

-- Les réglages modifiables par l'admin : on ajoute « progression » (remplace celle du 015).
create or replace function public.set_campus_setting(p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v jsonb := p_value;
begin
  if public.my_role() <> 'admin' then raise exception 'admin only'; end if;
  if p_key not in ('attendance', 'reminder', 'contract', 'progression') then raise exception 'unknown setting'; end if;
  if p_key = 'attendance' and (v->>'enabled')::boolean and not coalesce((public._setting('attendance')->>'enabled')::boolean, false) then
    v := v || jsonb_build_object('since', now());
  end if;
  update campus_settings set value = public._setting(p_key) || v, updated_at = now() where key = p_key;
end $$;

-- Les élèves lisent ce réglage (pour savoir pourquoi une unité est fermée).
create function public.progression_settings() returns jsonb
language sql stable security definer set search_path = public as $$
  select public._setting('progression')
$$;

create table public.session_reports (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.class_groups (id) on delete cascade,
  scheduled_at timestamptz not null,
  teacher_id uuid references public.profiles (id) on delete set null,
  unit_ids text[] not null default '{}',
  note text,
  created_at timestamptz not null default now(),
  unique (group_id, scheduled_at)
);
alter table public.session_reports enable row level security;
revoke all on public.session_reports from anon, authenticated;
grant select on public.session_reports to authenticated;
create policy "session_reports: ceux de ses groupes" on public.session_reports for select to authenticated
  using (public.in_group(group_id));

create table public.taught_units (
  student_id uuid not null references public.profiles (id) on delete cascade,
  unit_id text not null references public.units (id) on delete cascade,
  first_at timestamptz not null default now(),
  primary key (student_id, unit_id)
);
alter table public.taught_units enable row level security;
revoke all on public.taught_units from anon, authenticated;
grant select on public.taught_units to authenticated;
create policy "taught_units: les siennes ou celles de ses élèves" on public.taught_units for select to authenticated
  using (student_id = auth.uid() or public.teaches(student_id));

-- Le prof du groupe (ou l'admin) enregistre le rapport d'un cours terminé.
create function public.save_session_report(p_group uuid, p_scheduled timestamptz, p_units text[], p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare g class_groups;
begin
  select * into g from class_groups where id = p_group;
  if not found or not (public.my_role() = 'admin' or g.teacher_id = auth.uid()) then raise exception 'not your group'; end if;
  if not exists (select 1 from public._group_sessions(p_group, now() - interval '30 days', now() + interval '1 day') s
                 where s.scheduled_at = p_scheduled and s.status <> 'cancelled') then raise exception 'unknown class'; end if;
  if exists (select 1 from unnest(coalesce(p_units, '{}')) x where not exists (select 1 from units u where u.id = x)) then raise exception 'unknown unit'; end if;
  insert into session_reports (group_id, scheduled_at, teacher_id, unit_ids, note)
  values (p_group, p_scheduled, auth.uid(), coalesce(p_units, '{}'), nullif(left(trim(coalesce(p_note, '')), 1000), ''))
  on conflict (group_id, scheduled_at) do update set unit_ids = excluded.unit_ids, note = excluded.note, teacher_id = excluded.teacher_id, created_at = now();
  insert into taught_units (student_id, unit_id)
  select p.id, x from profiles p cross join unnest(coalesce(p_units, '{}')) x
  where p.group_id = p_group and p.role = 'student'
  on conflict do nothing;
end $$;

-- Les cours terminés des 14 derniers jours, avec leur rapport s'il existe.
create function public.staff_session_reports() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  return coalesce((select jsonb_agg(x order by x->>'at' desc) from (
    select jsonb_build_object('group_id', g.id, 'group', g.name, 'level', g.level, 'scheduled_at', s.scheduled_at, 'at', s.actual_at,
      'students', (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.full_name)), '[]'::jsonb) from profiles p where p.group_id = g.id and p.role = 'student'),
      'report', (select jsonb_build_object('unit_ids', r.unit_ids, 'note', r.note, 'created_at', r.created_at) from session_reports r where r.group_id = g.id and r.scheduled_at = s.scheduled_at)) x
    from class_groups g
    cross join lateral public._group_sessions(g.id, now() - interval '14 days', now()) s
    where (public.my_role() = 'admin' or g.teacher_id = auth.uid()) and s.status <> 'cancelled'
      and s.actual_at + make_interval(mins => s.duration_min) < now()) t), '[]'::jsonb);
end $$;

-- Règle d'ouverture des unités (remplace celle du 012) : avec le réglage activé, une unité doit
-- aussi avoir été vue en classe (rapport du prof) ou donnée en devoir.
create or replace function public.unit_access(p_user uuid, p_unit text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  u units;
  prev text;
  last_run lesson_runs;
  passed boolean;
  cooldown timestamptz;
  unlocked boolean;
  assigned boolean;
  taught boolean;
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
  assigned := exists (select 1 from assignment_students s join assignments a on a.id = s.assignment_id where s.student_id = p_user and a.unit_id = p_unit);
  taught := not coalesce((public._setting('progression')->>'taught_gate')::boolean, false)
    or passed or assigned or exists (select 1 from taught_units t where t.student_id = p_user and t.unit_id = p_unit);
  unlocked := taught and (prev is null
    or exists (select 1 from lesson_runs r where r.user_id = p_user and r.unit_id = prev and r.first_try_correct * 100 >= 75 * r.total)
    or assigned);
  return jsonb_build_object('unlocked', unlocked, 'passed', passed, 'cooldown_until', cooldown, 'taught', taught);
end $$;

revoke execute on function public.save_session_report(uuid, timestamptz, text[], text), public.staff_session_reports(), public.progression_settings() from public, anon;
grant execute on function public.save_session_report(uuid, timestamptz, text[], text), public.staff_session_reports(), public.progression_settings() to authenticated;

commit;
