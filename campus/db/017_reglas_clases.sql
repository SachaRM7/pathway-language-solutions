-- Campus Pathway · 017 · règles des cours particuliers (réunion Ryan, Abdrahim, Sacha)
-- À exécuter après 016 (SQL Editor → New query → Run), puis redéployer « class-reminders » avec
-- son dernier code. Remplace les avertissements « exclusion » du 016 par les règles suivantes :
--
-- • Chaque élève a une formule : « mensual » (mois de 4 semaines à partir de sa date de début) ou
--   « ciclo ». L'admin la règle dans « Cuentas » → « Miembros ».
-- • Absence justifiée : prévenue depuis le Campus au moins 48 h avant (justifiée d'office), ou
--   justifiée jusqu'à 72 h après avec un justificatif (validé par le prof ou l'admin). L'heure
--   est à rattraper : le prof programme un cours de rattrapage.
-- • Absence non justifiée : l'heure est perdue. L'élève reçoit un e-mail après chaque absence.
-- • Formule mensuelle : à 3 absences non justifiées sur les mêmes 4 semaines, le mois n'est pas
--   validé : pas de passage au niveau suivant ; pour continuer, il repaie le mois et refait ses
--   heures (l'admin le note par « Mes pagado de nuevo », qui fait repartir les 4 semaines).
-- • Formule cycle : aucune sanction, mais les heures perdues ne se rattrapent pas.

begin;

-- 1. Formule et date de début de chaque élève.
alter table public.profiles add column if not exists plan text check (plan in ('mensual', 'ciclo'));
alter table public.profiles add column if not exists plan_start date;
create function public.set_student_plan(p_user uuid, p_plan text, p_start date) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() is distinct from 'admin' then raise exception 'admin only'; end if;
  if p_plan is not null and p_plan not in ('mensual', 'ciclo') then raise exception 'invalid plan'; end if;
  update profiles set plan = p_plan, plan_start = case when p_plan is null then null else coalesce(p_start, current_date) end
  where id = p_user and role = 'student';
end $$;

-- 2. Cours de rattrapage d'une absence justifiée.
create table public.makeup_sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.class_groups (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  replaces_at timestamptz not null,
  at timestamptz not null,
  duration_min int not null check (duration_min between 15 and 240),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, group_id, replaces_at)
);
alter table public.makeup_sessions enable row level security;
revoke all on public.makeup_sessions from anon, authenticated;
grant select on public.makeup_sessions to authenticated;
create policy "makeup_sessions: les siens ou ceux de ses élèves" on public.makeup_sessions for select to authenticated
  using (student_id = auth.uid() or public.teaches(student_id));

-- Les séances d'un groupe comprennent désormais les rattrapages (status « makeup »). Remplace celle du 008.
create or replace function public._group_sessions(p_group uuid, p_from timestamptz, p_to timestamptz)
returns table (scheduled_at timestamptz, actual_at timestamptz, duration_min int, status text, change_id uuid)
language sql stable security definer set search_path = public as $$
  with g as (select timezone from class_groups where id = p_group),
  base as (
    select ((d::date + s.start_time) at time zone g.timezone) as at, s.duration_min
    from g, group_slots s,
      generate_series((p_from at time zone g.timezone)::date - 14, (p_to at time zone g.timezone)::date + 14, interval '1 day') d
    where s.group_id = p_group and extract(isodow from d) = s.weekday
  ),
  allx as (
    select b.at as sat, coalesce(c.new_at, b.at) as aat, b.duration_min as dur,
      case when c.id is null then 'planned' when c.new_at is null then 'cancelled' else 'moved' end as st, c.id as cid
    from base b
    left join schedule_changes c on c.group_id = p_group and c.original_at = b.at and c.status = 'approved'
    union all
    select m.at, m.at, m.duration_min, 'makeup', null::uuid from makeup_sessions m where m.group_id = p_group
  )
  select sat, aat, dur, st, cid from allx where aat >= p_from and aat < p_to order by aat
$$;

-- 3. Les séances terminées où l'élève n'était pas à l'heure, avec leur durée (remplace celle du 016).
drop function if exists public._absence_record(uuid);
create function public._absence_record(p_student uuid)
returns table (group_id uuid, scheduled_at timestamptz, at timestamptz, clicked_at timestamptz, status text, reason text, duration_min int)
language plpgsql stable security definer set search_path = public as $$
declare t timestamptz := public._absence_period(p_student); g uuid;
begin
  if t is null or not isfinite(t) then return; end if;
  select p.group_id into g from profiles p where p.id = p_student;
  return query
    select g, s.scheduled_at, s.actual_at, j.clicked_at, x.st, e.reason, s.duration_min
    from public._group_sessions(g, t, now()) s
    left join class_joins j on j.student_id = p_student and j.group_id = g and j.scheduled_at = s.scheduled_at
    left join absence_excuses e on e.student_id = p_student and e.group_id = g and e.scheduled_at = s.scheduled_at
    cross join lateral (select public._attendance_status(s.actual_at, j.clicked_at) st) x
    where s.status <> 'cancelled' and s.actual_at + make_interval(mins => s.duration_min) < now() and x.st <> 'present'
    order by s.actual_at;
end $$;

-- 4. Demandes de l'élève : prévenir avant, ou justifier après.
create table public.absence_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid not null references public.class_groups (id) on delete cascade,
  scheduled_at timestamptz not null,
  kind text not null check (kind in ('aviso', 'justificativo')),
  reason text not null,
  note text,
  file_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  unique (student_id, group_id, scheduled_at)
);
alter table public.absence_requests enable row level security;
revoke all on public.absence_requests from anon, authenticated;
grant select on public.absence_requests to authenticated;
create policy "absence_requests: les siennes ou celles de ses élèves" on public.absence_requests for select to authenticated
  using (student_id = auth.uid() or public.teaches(student_id));

-- Prévenir d'une absence : 48 h avant ou plus, elle est justifiée d'office ; moins, elle attend le prof.
create function public.notify_absence(p_scheduled timestamptz, p_reason text, p_note text) returns text
language plpgsql security definer set search_path = public as $$
declare me profiles; s record; ok boolean;
begin
  select * into me from profiles where id = auth.uid();
  if not found or me.role <> 'student' or me.group_id is null then raise exception 'no group'; end if;
  if length(trim(coalesce(p_reason, ''))) < 2 then raise exception 'reason required'; end if;
  select * into s from public._group_sessions(me.group_id, now(), now() + interval '90 days') x
   where x.scheduled_at = p_scheduled and x.status <> 'cancelled' limit 1;
  if s.scheduled_at is null then raise exception 'unknown class'; end if;
  ok := s.actual_at - now() >= interval '48 hours';
  insert into absence_requests (student_id, group_id, scheduled_at, kind, reason, note, status, decided_at)
  values (me.id, me.group_id, p_scheduled, 'aviso', left(trim(p_reason), 200), nullif(left(trim(coalesce(p_note, '')), 500), ''),
          case when ok then 'approved' else 'pending' end, case when ok then now() end)
  on conflict (student_id, group_id, scheduled_at) do update set kind = 'aviso', reason = excluded.reason, note = excluded.note,
    status = excluded.status, decided_at = excluded.decided_at, created_at = now()
  where absence_requests.status <> 'approved';
  if ok then
    insert into absence_excuses (student_id, group_id, scheduled_at, reason, note)
    values (me.id, me.group_id, p_scheduled, 'Aviso 48 h antes · ' || left(trim(p_reason), 170), nullif(left(trim(coalesce(p_note, '')), 500), ''))
    on conflict (student_id, group_id, scheduled_at) do nothing;
  end if;
  return case when ok then 'approved' else 'pending' end;
end $$;

-- Justifier une absence, jusqu'à 72 h après le début du cours, avec un justificatif.
create function public.justify_absence(p_scheduled timestamptz, p_reason text, p_note text, p_file text) returns text
language plpgsql security definer set search_path = public as $$
declare me profiles; s record;
begin
  select * into me from profiles where id = auth.uid();
  if not found or me.role <> 'student' or me.group_id is null then raise exception 'no group'; end if;
  if length(trim(coalesce(p_reason, ''))) < 2 then raise exception 'reason required'; end if;
  if p_file is not null and p_file not like me.id::text || '/%' then raise exception 'invalid file'; end if;
  select * into s from public._group_sessions(me.group_id, now() - interval '10 days', now()) x
   where x.scheduled_at = p_scheduled and x.status <> 'cancelled' limit 1;
  if s.scheduled_at is null then raise exception 'unknown class'; end if;
  if now() > s.actual_at + interval '72 hours' then raise exception 'deadline_passed'; end if;
  insert into absence_requests (student_id, group_id, scheduled_at, kind, reason, note, file_path)
  values (me.id, me.group_id, p_scheduled, 'justificativo', left(trim(p_reason), 200), nullif(left(trim(coalesce(p_note, '')), 500), ''), p_file)
  on conflict (student_id, group_id, scheduled_at) do update set kind = 'justificativo', reason = excluded.reason, note = excluded.note,
    file_path = coalesce(excluded.file_path, absence_requests.file_path), status = 'pending', decided_by = null, decided_at = null, created_at = now()
  where absence_requests.status <> 'approved';
  return 'pending';
end $$;

-- Le prof ou l'admin accepte ou refuse une demande.
create function public.decide_absence_request(p_id uuid, p_ok boolean) returns void
language plpgsql security definer set search_path = public as $$
declare r absence_requests;
begin
  select * into r from absence_requests where id = p_id;
  if not found or not public.teaches(r.student_id) then raise exception 'not your student'; end if;
  update absence_requests set status = case when p_ok then 'approved' else 'rejected' end, decided_by = auth.uid(), decided_at = now() where id = p_id;
  if p_ok then
    insert into absence_excuses (student_id, group_id, scheduled_at, reason, note, excused_by)
    values (r.student_id, r.group_id, r.scheduled_at, r.reason, r.note, auth.uid())
    on conflict (student_id, group_id, scheduled_at) do update set reason = excluded.reason, note = excluded.note, excused_by = excluded.excused_by;
  else
    delete from absence_excuses where student_id = r.student_id and group_id = r.group_id and scheduled_at = r.scheduled_at;
  end if;
end $$;

-- Justificatifs : stockage privé, un dossier par élève ; l'élève dépose, ses profs lisent.
insert into storage.buckets (id, name, public) values ('justificantes', 'justificantes', false) on conflict (id) do nothing;
create policy "justificantes: l'élève dépose dans son dossier" on storage.objects for insert to authenticated
  with check (bucket_id = 'justificantes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "justificantes: l'élève et ses profs lisent" on storage.objects for select to authenticated
  using (bucket_id = 'justificantes' and ((storage.foldername(name))[1] = auth.uid()::text
    or public.teaches(case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' then ((storage.foldername(name))[1])::uuid end)));

-- Le prof ou l'admin programme le rattrapage d'une absence justifiée.
create function public.schedule_makeup(p_student uuid, p_group uuid, p_replaces timestamptz, p_at timestamptz, p_duration int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.teaches(p_student) then raise exception 'not your student'; end if;
  if not exists (select 1 from absence_excuses where student_id = p_student and group_id = p_group and scheduled_at = p_replaces) then
    raise exception 'absence not justified';
  end if;
  insert into makeup_sessions (group_id, student_id, replaces_at, at, duration_min, created_by)
  values (p_group, p_student, p_replaces, p_at, greatest(15, least(240, coalesce(p_duration, 60))), auth.uid())
  on conflict (student_id, group_id, replaces_at) do update set at = excluded.at, duration_min = excluded.duration_min, created_by = excluded.created_by;
end $$;
create function public.cancel_makeup(p_student uuid, p_group uuid, p_replaces timestamptz) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.teaches(p_student) then raise exception 'not your student'; end if;
  delete from makeup_sessions where student_id = p_student and group_id = p_group and replaces_at = p_replaces;
end $$;

-- 5. Formule mensuelle : les 4 semaines en cours, et un mois non validé (3 absences non justifiées
--    sur une même période de 4 semaines depuis la date de début).
create function public._month_status(p_student uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p profiles; c jsonb := public._setting('contract'); per int; mx int; t0 timestamptz; cur timestamptz;
  a int; l int; f timestamptz;
begin
  select * into p from profiles where id = p_student;
  if not found or p.plan is distinct from 'mensual' or p.plan_start is null then return null; end if;
  per := greatest(1, coalesce((c->>'lates_per_absence')::int, 3));
  mx := greatest(1, coalesce((c->>'max_absences')::int, 3));
  t0 := p.plan_start::timestamp at time zone coalesce(nullif(p.timezone, ''), 'America/Lima');
  cur := t0 + floor(greatest(0, extract(epoch from now() - t0)) / (28 * 86400)) * interval '28 days';
  select count(*) filter (where r.status = 'absent'), count(*) filter (where r.status = 'late') into a, l
    from public._absence_record(p_student) r where r.reason is null and r.at >= cur;
  select min(w) into f from (
    select t0 + floor(extract(epoch from r.at - t0) / (28 * 86400)) * interval '28 days' w,
           count(*) filter (where r.status = 'absent') + count(*) filter (where r.status = 'late') / per n
    from public._absence_record(p_student) r where r.reason is null and r.at >= t0
    group by 1) x where x.n >= mx;
  return jsonb_build_object('from', cur, 'to', cur + interval '28 days', 'absences', a, 'lates', l, 'lates_per_absence', per,
    'total', a + l / per, 'max', mx, 'failed', f is not null, 'failed_from', f, 'failed_to', f + interval '28 days');
end $$;
create function public._month_failed(p_student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((public._month_status(p_student)->>'failed')::boolean, false)
$$;

-- Pas de passage de niveau avec un mois non validé (remplace celle du 012).
create or replace function public._try_promote(p_user uuid, p_level text) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v level_validations;
  nxt text := case p_level when 'A1' then 'A2' when 'A2' then 'B1' when 'B1' then 'B2' end;
begin
  select * into v from level_validations where student_id = p_user and level = p_level;
  if not found or v.promoted_at is not null or v.teacher_passed_at is null then return false; end if;
  if public._final_unit(p_level) is not null and v.final_passed_at is null then return false; end if;
  if public._month_failed(p_user) then return false; end if;
  update level_validations set promoted_at = now(), promoted_to = nxt where student_id = p_user and level = p_level;
  if nxt is not null then update profiles set level = nxt where id = p_user and level = p_level; end if;
  return true;
end $$;

-- 6. Un e-mail après chaque absence non justifiée (remplace les avertissements du 016).
create table public.absence_notices (
  student_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid not null references public.class_groups (id) on delete cascade,
  scheduled_at timestamptz not null,
  sent_at timestamptz not null default now(),
  primary key (student_id, group_id, scheduled_at)
);
alter table public.absence_notices enable row level security;
revoke all on public.absence_notices from anon, authenticated;
grant select on public.absence_notices to authenticated;
create policy "absence_notices: les siens ou ceux de ses élèves" on public.absence_notices for select to authenticated
  using (student_id = auth.uid() or public.teaches(student_id));

create function public.due_absence_notices() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare out jsonb := '[]'::jsonb; p record; r record; m jsonb;
begin
  if not coalesce((public._setting('contract')->>'enabled')::boolean, false)
     or not coalesce((public._setting('attendance')->>'enabled')::boolean, false) then return out; end if;
  for p in select x.id, x.full_name, x.timezone, x.plan, u.email, (select full_name from profiles t where t.id = g.teacher_id) as teacher
           from profiles x join class_groups g on g.id = x.group_id join auth.users u on u.id = x.id
           where x.role = 'student' and u.email is not null loop
    m := null;
    for r in select * from public._absence_record(p.id) a
             where a.status = 'absent' and a.reason is null and a.at > now() - interval '3 days'
               and not exists (select 1 from absence_notices n where n.student_id = p.id and n.group_id = a.group_id and n.scheduled_at = a.scheduled_at)
               and not exists (select 1 from absence_requests q where q.student_id = p.id and q.group_id = a.group_id and q.scheduled_at = a.scheduled_at and q.status <> 'rejected') loop
      if m is null then m := coalesce(public._month_status(p.id), 'null'::jsonb); end if;
      out := out || jsonb_build_array(jsonb_build_object('student_id', p.id, 'name', p.full_name, 'email', p.email, 'timezone', p.timezone,
        'teacher', p.teacher, 'plan', p.plan, 'group_id', r.group_id, 'scheduled_at', r.scheduled_at, 'at', r.at,
        'deadline', r.at + interval '72 hours', 'duration_min', r.duration_min, 'month', m,
        'motives', coalesce(public._setting('contract')->'motives', '[]'::jsonb)));
    end loop;
  end loop;
  return out;
end $$;
create function public.claim_absence_notice(p_student uuid, p_group uuid, p_scheduled timestamptz) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  insert into absence_notices (student_id, group_id, scheduled_at) values (p_student, p_group, p_scheduled);
  return true;
exception when unique_violation then
  return false;
end $$;

-- 7. Équipe : formule, mois, heures perdues, demandes et rattrapages de chaque élève (remplace celle du 016).
create or replace function public.staff_absences() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  return coalesce((select jsonb_agg(public._absence_totals(p.id) || jsonb_build_object('student_id', p.id, 'name', p.full_name,
      'plan', p.plan, 'plan_start', p.plan_start, 'month', public._month_status(p.id),
      'lost_minutes', (select coalesce(sum(r.duration_min), 0) from public._absence_record(p.id) r where r.status = 'absent' and r.reason is null),
      'record', coalesce((select jsonb_agg(jsonb_build_object('group_id', r.group_id, 'scheduled_at', r.scheduled_at, 'at', r.at,
          'clicked_at', r.clicked_at, 'status', r.status, 'reason', r.reason, 'duration_min', r.duration_min,
          'request', (select to_jsonb(q) - 'student_id' from absence_requests q where q.student_id = p.id and q.group_id = r.group_id and q.scheduled_at = r.scheduled_at),
          'makeup', (select jsonb_build_object('at', m.at, 'duration_min', m.duration_min) from makeup_sessions m where m.student_id = p.id and m.group_id = r.group_id and m.replaces_at = r.scheduled_at))
          order by r.at desc) from public._absence_record(p.id) r), '[]'::jsonb),
      'notices', (select count(*) from absence_notices n where n.student_id = p.id),
      'requests', coalesce((select jsonb_agg(to_jsonb(q) - 'student_id' order by q.scheduled_at desc) from absence_requests q
          where q.student_id = p.id and q.kind = 'aviso' and q.scheduled_at > now() - interval '1 day'), '[]'::jsonb)) order by p.full_name)
    from profiles p where p.role = 'student' and p.group_id is not null and public.teaches(p.id)
      and public._absence_period(p.id) is not null), '[]'::jsonb);
end $$;

-- 8. L'élève : ses demandes, ses rattrapages, son mois et ses heures perdues.
create function public.my_absences() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'plan', me.plan, 'plan_start', me.plan_start, 'month', public._month_status(me.id),
    'lost_minutes', (select coalesce(sum(r.duration_min), 0) from public._absence_record(me.id) r where r.status = 'absent' and r.reason is null),
    'requests', coalesce((select jsonb_agg(jsonb_build_object('scheduled_at', q.scheduled_at, 'kind', q.kind, 'reason', q.reason, 'status', q.status, 'created_at', q.created_at))
       from absence_requests q where q.student_id = me.id and q.group_id = me.group_id and q.scheduled_at > now() - interval '60 days'), '[]'::jsonb),
    'makeups', coalesce((select jsonb_agg(jsonb_build_object('replaces_at', m.replaces_at, 'at', m.at, 'duration_min', m.duration_min) order by m.at)
       from makeup_sessions m where m.student_id = me.id and m.group_id = me.group_id), '[]'::jsonb),
    'to_makeup', (select count(*) from absence_excuses e where e.student_id = me.id and e.group_id = me.group_id
       and not exists (select 1 from makeup_sessions m where m.student_id = me.id and m.group_id = e.group_id and m.replaces_at = e.scheduled_at)),
    'motives', coalesce(public._setting('contract')->'motives', '[]'::jsonb))
  from profiles me where me.id = auth.uid()
$$;

-- Ses présences avec la séance exacte, pour justifier (remplace celle du 016).
create or replace function public.my_attendance() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('scheduled_at', s.scheduled_at, 'at', s.actual_at, 'clicked_at', j.clicked_at, 'status', x.st,
      'excused', e.reason, 'makeup', s.status = 'makeup') order by s.actual_at desc), '[]'::jsonb)
  from profiles me
  cross join lateral public._group_sessions(me.group_id,
    greatest(now() - interval '60 days', coalesce((public._setting('attendance')->>'since')::timestamptz, 'infinity'), coalesce(me.group_joined_at, '-infinity'::timestamptz)), now()) s
  left join class_joins j on j.student_id = me.id and j.group_id = me.group_id and j.scheduled_at = s.scheduled_at
  left join absence_excuses e on e.student_id = me.id and e.group_id = me.group_id and e.scheduled_at = s.scheduled_at
  cross join lateral (select public._attendance_status(s.actual_at, j.clicked_at) st) x
  where me.id = auth.uid() and me.group_id is not null and s.status <> 'cancelled'
    and s.actual_at + make_interval(mins => coalesce((public._setting('attendance')->>'absent_after_min')::int, 10)) < now()
$$;

revoke execute on function public._absence_record(uuid), public._month_status(uuid), public._month_failed(uuid),
  public.due_absence_notices(), public.claim_absence_notice(uuid, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.due_absence_notices(), public.claim_absence_notice(uuid, uuid, timestamptz) to service_role;
revoke execute on function public.set_student_plan(uuid, text, date), public.notify_absence(timestamptz, text, text),
  public.justify_absence(timestamptz, text, text, text), public.decide_absence_request(uuid, boolean),
  public.schedule_makeup(uuid, uuid, timestamptz, timestamptz, int), public.cancel_makeup(uuid, uuid, timestamptz),
  public.my_absences() from public, anon;
grant execute on function public.set_student_plan(uuid, text, date), public.notify_absence(timestamptz, text, text),
  public.justify_absence(timestamptz, text, text, text), public.decide_absence_request(uuid, boolean),
  public.schedule_makeup(uuid, uuid, timestamptz, timestamptz, int), public.cancel_makeup(uuid, uuid, timestamptz),
  public.my_absences() to authenticated;

commit;
