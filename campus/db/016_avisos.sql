-- Campus Pathway · 016 · avertissements d'absence et absences justifiées
-- À exécuter après 015 (SQL Editor → New query → Run), puis redéployer « class-reminders » avec
-- son dernier code. Rien ne part tant que les présences (« Reglas de asistencia ») et le contrat
-- (« Contrato del alumno ») ne sont pas activés dans « Ajustes ».
--
-- • Après chaque absence injustifiée (ou chaque série de retards qui vaut une absence), l'élève
--   reçoit un e-mail d'avertissement : combien d'absences il lui reste avant l'exclusion, et au
--   dernier avertissement, les seuls motifs d'absence justifiée.
-- • Le décompte commence à la première signature du contrat, et repart à zéro à chaque passage
--   de niveau. Une séance antérieure à l'arrivée de l'élève dans son groupe ne compte pas.
-- • Le prof ou l'admin peut justifier une absence (« Alumnos » → « Ausencias ») : elle ne compte
--   plus. À la dernière absence, aucun e-mail ne part : l'admin décide de l'exclusion.

begin;

-- 1. Depuis quand l'élève est dans son groupe.
alter table public.profiles add column if not exists group_joined_at timestamptz;
create or replace function public._group_joined() returns trigger
language plpgsql as $$
begin
  if new.group_id is distinct from old.group_id then
    new.group_joined_at := case when new.group_id is null then null else now() end;
  end if;
  return new;
end $$;
drop trigger if exists profiles_group_joined on public.profiles;
create trigger profiles_group_joined before update of group_id on public.profiles
  for each row execute function public._group_joined();

-- Les présences d'un groupe ne comptent qu'à partir de l'arrivée de l'élève (remplace celle du 013).
create or replace function public._group_attendance(p_group uuid, p_from timestamptz, p_to timestamptz)
returns table (student_id uuid, full_name text, at timestamptz, clicked_at timestamptz, status text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, s.actual_at, j.clicked_at, public._attendance_status(s.actual_at, j.clicked_at)
  from public._group_sessions(p_group, greatest(p_from, coalesce((public._setting('attendance')->>'since')::timestamptz, 'infinity')), p_to) s
  join profiles p on p.group_id = p_group and p.role = 'student'
  left join class_joins j on j.student_id = p.id and j.group_id = p_group and j.scheduled_at = s.scheduled_at
  where s.status <> 'cancelled' and s.actual_at + make_interval(mins => coalesce((public._setting('attendance')->>'absent_after_min')::int, 10)) < now()
    and s.actual_at >= coalesce(p.group_joined_at, '-infinity'::timestamptz)
$$;

-- 2. Les motifs d'absence justifiée, cités dans le contrat et dans le dernier avertissement.
update public.campus_settings
set value = jsonb_build_object('motives', jsonb_build_array(
    'Enfermedad o accidente, con certificado médico',
    'Fallecimiento de un familiar cercano',
    'Cita oficial de inmigración o trámite administrativo, con comprobante')) || value
where key = 'contract' and not value ? 'motives';

-- 3. Absences justifiées par le prof ou l'admin.
create table public.absence_excuses (
  student_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid not null references public.class_groups (id) on delete cascade,
  scheduled_at timestamptz not null,
  reason text not null,
  note text,
  excused_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (student_id, group_id, scheduled_at)
);
alter table public.absence_excuses enable row level security;
revoke all on public.absence_excuses from anon, authenticated;
grant select on public.absence_excuses to authenticated;
create policy "absence_excuses: les siennes ou celles de ses élèves" on public.absence_excuses for select to authenticated
  using (student_id = auth.uid() or public.teaches(student_id));

-- 4. Début du décompte : première signature du contrat, arrivée dans le groupe, dernier passage
--    de niveau et activation des présences, la plus récente. Null tant que rien ne compte.
create function public._absence_period(p_student uuid) returns timestamptz
language sql stable security definer set search_path = public as $$
  select case when coalesce((public._setting('attendance')->>'enabled')::boolean, false)
               and (public._setting('attendance')->>'since') is not null
               and exists (select 1 from contract_signatures c where c.student_id = p.id)
    then greatest((public._setting('attendance')->>'since')::timestamptz,
                  (select min(signed_at) from contract_signatures c where c.student_id = p.id),
                  coalesce(p.group_joined_at, '-infinity'::timestamptz),
                  coalesce((select max(promoted_at) from level_validations v where v.student_id = p.id), '-infinity'::timestamptz)) end
  from profiles p where p.id = p_student and p.group_id is not null
$$;

-- Les séances terminées de la période où l'élève n'était pas à l'heure (retard ou absence).
create function public._absence_record(p_student uuid)
returns table (group_id uuid, scheduled_at timestamptz, at timestamptz, clicked_at timestamptz, status text, reason text)
language plpgsql stable security definer set search_path = public as $$
declare t timestamptz := public._absence_period(p_student); g uuid;
begin
  if t is null or not isfinite(t) then return; end if;
  select p.group_id into g from profiles p where p.id = p_student;
  return query
    select g, s.scheduled_at, s.actual_at, j.clicked_at, x.st, e.reason
    from public._group_sessions(g, t, now()) s
    left join class_joins j on j.student_id = p_student and j.group_id = g and j.scheduled_at = s.scheduled_at
    left join absence_excuses e on e.student_id = p_student and e.group_id = g and e.scheduled_at = s.scheduled_at
    cross join lateral (select public._attendance_status(s.actual_at, j.clicked_at) st) x
    where s.status <> 'cancelled' and s.actual_at + make_interval(mins => s.duration_min) < now() and x.st <> 'present'
    order by s.actual_at;
end $$;

-- Le compte : absences injustifiées + une absence par série de N retards injustifiés.
create function public._absence_totals(p_student uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c jsonb := public._setting('contract'); per int; mx int; a int; l int; last_at timestamptz; last_kind text;
begin
  per := greatest(1, coalesce((c->>'lates_per_absence')::int, 3));
  mx := greatest(1, coalesce((c->>'max_absences')::int, 3));
  select count(*) filter (where r.status = 'absent' and r.reason is null),
         count(*) filter (where r.status = 'late' and r.reason is null)
    into a, l from public._absence_record(p_student) r;
  select r.at, r.status into last_at, last_kind from public._absence_record(p_student) r where r.reason is null order by r.at desc limit 1;
  return jsonb_build_object('absences', a, 'lates', l, 'lates_per_absence', per, 'max', mx,
    'total', a + l / per, 'period_start', public._absence_period(p_student), 'last_at', last_at, 'last_kind', last_kind);
end $$;

-- 5. Avertissements envoyés (un par palier et par période).
create table public.absence_warnings (
  student_id uuid not null references public.profiles (id) on delete cascade,
  period_start timestamptz not null,
  n int not null,
  sent_at timestamptz not null default now(),
  primary key (student_id, period_start, n)
);
alter table public.absence_warnings enable row level security;
revoke all on public.absence_warnings from anon, authenticated;
grant select on public.absence_warnings to authenticated;
create policy "absence_warnings: les siens ou ceux de ses élèves" on public.absence_warnings for select to authenticated
  using (student_id = auth.uid() or public.teaches(student_id));

-- Pour la fonction class-reminders (clé service) : les avertissements à envoyer maintenant.
create function public.due_absence_warnings() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare out jsonb := '[]'::jsonb; r record; t jsonb;
begin
  if not coalesce((public._setting('contract')->>'enabled')::boolean, false)
     or not coalesce((public._setting('attendance')->>'enabled')::boolean, false) then return out; end if;
  for r in select p.id, p.full_name, p.timezone, u.email, g.name as group_name,
                  (select full_name from profiles x where x.id = g.teacher_id) as teacher
           from profiles p join class_groups g on g.id = p.group_id join auth.users u on u.id = p.id
           where p.role = 'student' and u.email is not null loop
    t := public._absence_totals(r.id);
    if (t->>'total')::int >= 1 and (t->>'total')::int < (t->>'max')::int
       and not exists (select 1 from absence_warnings w where w.student_id = r.id and w.period_start = (t->>'period_start')::timestamptz and w.n = (t->>'total')::int) then
      out := out || jsonb_build_array(t || jsonb_build_object('student_id', r.id, 'name', r.full_name, 'email', r.email, 'timezone', r.timezone,
        'group', r.group_name, 'teacher', r.teacher, 'n', (t->>'total')::int, 'motives', coalesce(public._setting('contract')->'motives', '[]'::jsonb)));
    end if;
  end loop;
  return out;
end $$;
create function public.claim_absence_warning(p_student uuid, p_period timestamptz, p_n int) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  insert into absence_warnings (student_id, period_start, n) values (p_student, p_period, p_n);
  return true;
exception when unique_violation then
  return false;
end $$;

-- 6. Équipe : le décompte de chaque élève, ses absences et ses retards de la période.
create function public.staff_absences() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  return coalesce((select jsonb_agg(public._absence_totals(p.id) || jsonb_build_object('student_id', p.id, 'name', p.full_name,
      'record', coalesce((select jsonb_agg(jsonb_build_object('group_id', r.group_id, 'scheduled_at', r.scheduled_at, 'at', r.at,
          'clicked_at', r.clicked_at, 'status', r.status, 'reason', r.reason) order by r.at desc) from public._absence_record(p.id) r), '[]'::jsonb),
      'warnings', coalesce((select jsonb_agg(jsonb_build_object('n', w.n, 'sent_at', w.sent_at) order by w.n) from absence_warnings w
          where w.student_id = p.id and w.period_start = public._absence_period(p.id)), '[]'::jsonb)) order by p.full_name)
    from profiles p where p.role = 'student' and p.group_id is not null and public.teaches(p.id)
      and public._absence_period(p.id) is not null), '[]'::jsonb);
end $$;
create function public.excuse_absence(p_student uuid, p_group uuid, p_scheduled timestamptz, p_reason text, p_note text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.teaches(p_student) then raise exception 'not your student'; end if;
  if length(trim(coalesce(p_reason, ''))) < 2 then raise exception 'reason required'; end if;
  insert into absence_excuses (student_id, group_id, scheduled_at, reason, note, excused_by)
  values (p_student, p_group, p_scheduled, left(trim(p_reason), 200), nullif(left(trim(coalesce(p_note, '')), 500), ''), auth.uid())
  on conflict (student_id, group_id, scheduled_at) do update set reason = excluded.reason, note = excluded.note, excused_by = excluded.excused_by, created_at = now();
end $$;
create function public.unexcuse_absence(p_student uuid, p_group uuid, p_scheduled timestamptz) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.teaches(p_student) then raise exception 'not your student'; end if;
  delete from absence_excuses where student_id = p_student and group_id = p_group and scheduled_at = p_scheduled;
end $$;

-- L'élève voit aussi quelles absences ont été justifiées (remplace celle du 013).
create or replace function public.my_attendance() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('at', s.actual_at, 'clicked_at', j.clicked_at, 'status', x.st, 'excused', e.reason) order by s.actual_at desc), '[]'::jsonb)
  from profiles me
  cross join lateral public._group_sessions(me.group_id,
    greatest(now() - interval '60 days', coalesce((public._setting('attendance')->>'since')::timestamptz, 'infinity'), coalesce(me.group_joined_at, '-infinity'::timestamptz)), now()) s
  left join class_joins j on j.student_id = me.id and j.group_id = me.group_id and j.scheduled_at = s.scheduled_at
  left join absence_excuses e on e.student_id = me.id and e.group_id = me.group_id and e.scheduled_at = s.scheduled_at
  cross join lateral (select public._attendance_status(s.actual_at, j.clicked_at) st) x
  where me.id = auth.uid() and me.group_id is not null and s.status <> 'cancelled'
    and s.actual_at + make_interval(mins => coalesce((public._setting('attendance')->>'absent_after_min')::int, 10)) < now()
$$;

-- 7. L'élève voit son propre décompte (remplace celle du 015).
create or replace function public.contract_status() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'contract', public._setting('contract'),
    'attendance', (select jsonb_build_object('open_min', a->'open_min', 'absent_after_min', a->'absent_after_min', 'late_after_min', a->'late_after_min')
                   from (select public._setting('attendance') a) x),
    'signed', (select jsonb_build_object('body', body, 'signed_name', signed_name, 'signature', signature, 'signed_at', signed_at)
               from contract_signatures where student_id = auth.uid() order by signed_at desc limit 1),
    'absences', case when public._absence_period(auth.uid()) is not null then public._absence_totals(auth.uid()) end)
  where auth.uid() is not null
$$;

revoke execute on function public._group_joined(), public._absence_period(uuid), public._absence_record(uuid), public._absence_totals(uuid),
  public.due_absence_warnings(), public.claim_absence_warning(uuid, timestamptz, int) from public, anon, authenticated;
grant execute on function public.due_absence_warnings(), public.claim_absence_warning(uuid, timestamptz, int) to service_role;
revoke execute on function public.staff_absences(), public.excuse_absence(uuid, uuid, timestamptz, text, text),
  public.unexcuse_absence(uuid, uuid, timestamptz) from public, anon;
grant execute on function public.staff_absences(), public.excuse_absence(uuid, uuid, timestamptz, text, text),
  public.unexcuse_absence(uuid, uuid, timestamptz) to authenticated;

commit;
