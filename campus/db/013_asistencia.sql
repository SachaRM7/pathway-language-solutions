-- Campus Pathway · 013 · présences et rappel avant le cours
-- À exécuter après 012 (SQL Editor → New query → Run), puis déployer la fonction « class-reminders ».
-- Tout est désactivé au départ : l'admin active et règle chaque point dans « Horarios » →
-- « Reglas de asistencia » (ouverture du lien, seuil d'absence, palier de retard, rappel).
-- • Présence : le lien Zoom n'est plus montré aux élèves ; ils entrent au cours avec le bouton du
--   Campus, ouvert N minutes avant le début. L'heure du premier clic fait foi : au-delà du seuil,
--   l'élève est compté absent (comme dans les instituts qui suivent leurs cours ainsi).
-- • Rappel : un e-mail part N minutes avant chaque cours (fonction class-reminders, toutes les 5 min).

begin;

create table public.campus_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.campus_settings enable row level security;
insert into public.campus_settings (key, value) values
  ('attendance', '{"enabled": false, "since": null, "open_min": 60, "absent_after_min": 10, "late_after_min": null}'),
  ('reminder', '{"enabled": false, "before_min": 60}')
on conflict (key) do nothing;

create function public._setting(p_key text) returns jsonb
language sql stable security definer set search_path = public as $$
  select value from campus_settings where key = p_key
$$;

-- Admin : lire et modifier les règles.
create function public.get_campus_settings() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.is_staff() then (select jsonb_object_agg(key, value) from campus_settings) end
$$;
create function public.set_campus_setting(p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v jsonb := p_value;
begin
  if public.my_role() <> 'admin' then raise exception 'admin only'; end if;
  if p_key not in ('attendance', 'reminder') then raise exception 'unknown setting'; end if;
  -- Les présences ne comptent qu'à partir de leur activation : rien n'est reproché pour avant.
  if p_key = 'attendance' and (v->>'enabled')::boolean and not coalesce((public._setting('attendance')->>'enabled')::boolean, false) then
    v := v || jsonb_build_object('since', now());
  end if;
  update campus_settings set value = public._setting(p_key) || v, updated_at = now() where key = p_key;
end $$;

-- Le lien Zoom n'est plus lisible directement par les élèves (il passe par join_class).
revoke select on public.class_groups from authenticated;
grant select (id, name, teacher_id, level, timezone, created_at) on public.class_groups to authenticated;

-- Premier clic de chaque élève sur « Entrar a la clase », séance par séance.
create table public.class_joins (
  student_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid not null references public.class_groups (id) on delete cascade,
  scheduled_at timestamptz not null,
  clicked_at timestamptz not null default now(),
  primary key (student_id, group_id, scheduled_at)
);
alter table public.class_joins enable row level security;
create policy "class_joins: les siennes ou celles de ses élèves" on public.class_joins for select to authenticated
  using (student_id = auth.uid() or public.teaches(student_id));

-- Statut d'une présence selon les règles.
create function public._attendance_status(p_at timestamptz, p_clicked timestamptz) returns text
language sql stable security definer set search_path = public as $$
  select case
    when p_clicked is null then 'absent'
    when p_clicked > p_at + make_interval(mins => coalesce((s->>'absent_after_min')::int, 10)) then 'absent'
    when (s->>'late_after_min') is not null and p_clicked > p_at + make_interval(mins => (s->>'late_after_min')::int) then 'late'
    else 'present' end
  from (select public._setting('attendance') s) x
$$;

-- Élève : son groupe et ses prochaines séances (remplace celle du 008). Avec les présences
-- activées, le lien Zoom n'est pas donné ici : il passe par join_class.
create or replace function public.my_schedule() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'group', jsonb_build_object('id', g.id, 'name', g.name, 'timezone', g.timezone,
      'zoom_link', case when coalesce((public._setting('attendance')->>'enabled')::boolean, false) then null else g.zoom_link end,
      'teacher', (select full_name from profiles t where t.id = g.teacher_id)),
    'attendance', public._setting('attendance') - 'since',
    'sessions', coalesce((select jsonb_agg(jsonb_build_object('scheduled_at', x.scheduled_at, 'at', x.actual_at,
        'duration_min', x.duration_min, 'status', x.status) order by x.actual_at)
      from (select * from public._group_sessions(g.id, now() - interval '3 hours', now() + interval '21 days') limit 8) x), '[]'::jsonb))
  from profiles me join class_groups g on g.id = me.group_id
  where me.id = auth.uid()
$$;

-- Élève : entrer au cours. Ouvert de N minutes avant le début jusqu'à la fin ; le premier clic
-- est enregistré. Renvoie le lien, ou l'heure d'ouverture.
create function public.join_class() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  g class_groups;
  s record;
  cfg jsonb := public._setting('attendance');
  open_min int := coalesce((cfg->>'open_min')::int, 60);
  nxt timestamptz;
begin
  select c.* into g from profiles me join class_groups c on c.id = me.group_id where me.id = auth.uid();
  if not found then return jsonb_build_object('open', false, 'reason', 'no_group'); end if;
  if g.zoom_link is null then return jsonb_build_object('open', false, 'reason', 'no_link'); end if;
  select * into s from public._group_sessions(g.id, now() - interval '6 hours', now() + interval '1 day') x
   where x.status <> 'cancelled' and now() between x.actual_at - make_interval(mins => open_min) and x.actual_at + make_interval(mins => x.duration_min)
   order by x.actual_at limit 1;
  if s.scheduled_at is null then
    select min(x.actual_at) into nxt from public._group_sessions(g.id, now(), now() + interval '14 days') x where x.status <> 'cancelled';
    return jsonb_build_object('open', false, 'reason', 'closed', 'opens_at', nxt - make_interval(mins => open_min), 'next_at', nxt);
  end if;
  insert into class_joins (student_id, group_id, scheduled_at) values (auth.uid(), g.id, s.scheduled_at) on conflict do nothing;
  return jsonb_build_object('open', true, 'link', g.zoom_link, 'at', s.actual_at,
    'status', case when coalesce((cfg->>'enabled')::boolean, false) then public._attendance_status(s.actual_at,
      (select clicked_at from class_joins j where j.student_id = auth.uid() and j.group_id = g.id and j.scheduled_at = s.scheduled_at)) end);
end $$;

-- Présences d'un groupe sur une période : une ligne par séance passée et par élève du groupe.
create function public._group_attendance(p_group uuid, p_from timestamptz, p_to timestamptz)
returns table (student_id uuid, full_name text, at timestamptz, clicked_at timestamptz, status text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, s.actual_at, j.clicked_at, public._attendance_status(s.actual_at, j.clicked_at)
  from public._group_sessions(p_group, greatest(p_from, coalesce((public._setting('attendance')->>'since')::timestamptz, 'infinity')), p_to) s
  join profiles p on p.group_id = p_group and p.role = 'student'
  left join class_joins j on j.student_id = p.id and j.group_id = p_group and j.scheduled_at = s.scheduled_at
  where s.status <> 'cancelled' and s.actual_at + make_interval(mins => coalesce((public._setting('attendance')->>'absent_after_min')::int, 10)) < now()
$$;

-- Élève : ses présences des 60 derniers jours.
create function public.my_attendance() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('at', a.at, 'clicked_at', a.clicked_at, 'status', a.status) order by a.at desc), '[]'::jsonb)
  from profiles me, public._group_attendance(me.group_id, now() - interval '60 days', now()) a
  where me.id = auth.uid() and a.student_id = me.id
$$;

-- Équipe : présences du mois par groupe et par élève, avec les dernières séances.
create function public.staff_attendance() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  return coalesce((select jsonb_object_agg(g.id, coalesce((
      select jsonb_agg(jsonb_build_object('student_id', x.student_id, 'name', x.full_name,
        'present', x.present, 'late', x.late, 'absent', x.absent, 'last', x.last) order by x.full_name)
      from (select a.student_id, a.full_name,
              count(*) filter (where a.status = 'present') present,
              count(*) filter (where a.status = 'late') late,
              count(*) filter (where a.status = 'absent') absent,
              (jsonb_agg(jsonb_build_object('at', a.at, 'clicked_at', a.clicked_at, 'status', a.status) order by a.at desc))
                -> 0 last
            from public._group_attendance(g.id, date_trunc('month', now()), now()) a
            group by a.student_id, a.full_name) x), '[]'::jsonb))
    from class_groups g where public.my_role() = 'admin' or g.teacher_id = auth.uid()), '{}'::jsonb);
end $$;

-- Rappels : séances qui commencent dans N minutes (± 5), élèves pas encore prévenus.
create table public.class_reminders_sent (
  student_id uuid not null references public.profiles (id) on delete cascade,
  scheduled_at timestamptz not null,
  sent_at timestamptz not null default now(),
  primary key (student_id, scheduled_at)
);
alter table public.class_reminders_sent enable row level security;

create function public.due_reminders() returns jsonb
language sql stable security definer set search_path = public, auth as $$
  with cfg as (select public._setting('reminder') r)
  select coalesce(jsonb_agg(jsonb_build_object('student_id', p.id, 'name', p.full_name, 'email', u.email, 'timezone', p.timezone,
      'group', g.name, 'teacher', (select full_name from profiles t where t.id = g.teacher_id),
      'scheduled_at', s.scheduled_at, 'at', s.actual_at, 'status', s.status)), '[]'::jsonb)
  from cfg, class_groups g
  cross join lateral public._group_sessions(g.id, now(), now() + interval '6 hours') s
  join profiles p on p.group_id = g.id and p.role = 'student'
  join auth.users u on u.id = p.id
  where coalesce((cfg.r->>'enabled')::boolean, false)
    and s.status <> 'cancelled'
    and s.actual_at between now() + make_interval(mins => coalesce((cfg.r->>'before_min')::int, 60) - 5)
                        and now() + make_interval(mins => coalesce((cfg.r->>'before_min')::int, 60) + 5)
    and u.email is not null
    and not exists (select 1 from class_reminders_sent r where r.student_id = p.id and r.scheduled_at = s.scheduled_at)
$$;

-- Réserve un rappel (false s'il est déjà parti).
create function public.claim_reminder(p_student uuid, p_scheduled timestamptz) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  insert into class_reminders_sent (student_id, scheduled_at) values (p_student, p_scheduled);
  return true;
exception when unique_violation then
  return false;
end $$;

revoke execute on function public._setting(text), public._attendance_status(timestamptz, timestamptz),
  public._group_attendance(uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.due_reminders(), public.claim_reminder(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.due_reminders(), public.claim_reminder(uuid, timestamptz) to service_role;
revoke execute on function public.get_campus_settings(), public.set_campus_setting(text, jsonb), public.join_class(),
  public.my_attendance(), public.staff_attendance() from public, anon;
grant execute on function public.get_campus_settings(), public.set_campus_setting(text, jsonb), public.join_class(),
  public.my_attendance(), public.staff_attendance() to authenticated;

commit;

-- Rappels : vérification toutes les 5 minutes (ne fait rien tant que le rappel est désactivé).
select cron.unschedule('pathway-class-reminders') where exists (select 1 from cron.job where jobname = 'pathway-class-reminders');
select cron.schedule('pathway-class-reminders', '*/5 * * * *', $job$
  select net.http_post(
    url := 'https://ynflykxalfynxoupkxmy.supabase.co/functions/v1/class-reminders',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb)
$job$);
