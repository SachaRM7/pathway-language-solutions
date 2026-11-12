-- Campus Pathway · 008 · groupes, horaires fixes, changements validés et programme par niveau
-- À exécuter après 007 (SQL Editor → New query → Run).
-- • Chaque élève appartient à un groupe (un cours privé = un groupe d'un élève) avec un professeur,
--   un lien Zoom et un horaire hebdomadaire fixe. Le « Prochain cours » de l'élève en découle.
-- • Un professeur ne déplace ni n'annule un cours lui-même : il fait une demande que l'admin valide.
--   Les demandes de l'admin sont validées d'office. Tout reste enregistré.
-- • Les documents du programme (manuel, cahiers…) sont rangés par niveau dans le stockage privé
--   « programa » : chaque élève voit ceux de son niveau dès son arrivée, sans que personne les envoie.

begin;

-- Groupes et horaires ─────────────────────────────────────────────────────────────────────────────
create table public.class_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 80),
  teacher_id uuid references public.profiles (id) on delete set null,
  level text not null default 'A2' check (level in ('A1', 'A2', 'B1', 'B2')),
  zoom_link text,
  timezone text not null default 'America/Lima',
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists group_id uuid references public.class_groups (id) on delete set null;

-- Créneaux hebdomadaires, à l'heure du fuseau du groupe. weekday : 1 = lundi … 7 = dimanche.
create table public.group_slots (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.class_groups (id) on delete cascade,
  weekday int not null check (weekday between 1 and 7),
  start_time time not null,
  duration_min int not null default 60 check (duration_min between 15 and 240)
);

-- Demandes de changement : déplacer (new_at) ou annuler (new_at null) une séance précise.
create table public.schedule_changes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.class_groups (id) on delete cascade,
  original_at timestamptz not null,
  new_at timestamptz,
  reason text not null default '' check (length(reason) <= 300),
  requested_by uuid references public.profiles (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index schedule_changes_one_open on public.schedule_changes (group_id, original_at) where status <> 'rejected';

alter table public.class_groups enable row level security;
alter table public.group_slots enable row level security;
alter table public.schedule_changes enable row level security;

create function public.in_group(p_group uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and group_id = p_group)
      or exists (select 1 from class_groups where id = p_group and teacher_id = auth.uid())
      or public.my_role() = 'admin'
$$;

create policy "class_groups: les siens" on public.class_groups for select to authenticated using (public.in_group(id));
create policy "group_slots: ceux de ses groupes" on public.group_slots for select to authenticated using (public.in_group(group_id));
create policy "schedule_changes: ceux de ses groupes" on public.schedule_changes for select to authenticated using (public.in_group(group_id));

-- Séances d'un groupe entre deux dates : l'horaire fixe, avec les changements validés appliqués.
-- status : planned (à l'heure prévue), moved (déplacée à actual_at), cancelled.
create function public._group_sessions(p_group uuid, p_from timestamptz, p_to timestamptz)
returns table (scheduled_at timestamptz, actual_at timestamptz, duration_min int, status text, change_id uuid)
language sql stable security definer set search_path = public as $$
  with g as (select timezone from class_groups where id = p_group),
  base as (
    select ((d::date + s.start_time) at time zone g.timezone) as at, s.duration_min
    from g, group_slots s,
      generate_series((p_from at time zone g.timezone)::date - 14, (p_to at time zone g.timezone)::date + 14, interval '1 day') d
    where s.group_id = p_group and extract(isodow from d) = s.weekday
  )
  select b.at, coalesce(c.new_at, b.at), b.duration_min,
    case when c.id is null then 'planned' when c.new_at is null then 'cancelled' else 'moved' end, c.id
  from base b
  left join schedule_changes c on c.group_id = p_group and c.original_at = b.at and c.status = 'approved'
  where coalesce(c.new_at, b.at) >= p_from and coalesce(c.new_at, b.at) < p_to
  order by 2
$$;

-- Élève : son groupe et ses prochaines séances (les annulées sont signalées, pas cachées).
create function public.my_schedule() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'group', jsonb_build_object('id', g.id, 'name', g.name, 'zoom_link', g.zoom_link, 'timezone', g.timezone,
      'teacher', (select full_name from profiles t where t.id = g.teacher_id)),
    'sessions', coalesce((select jsonb_agg(jsonb_build_object('scheduled_at', x.scheduled_at, 'at', x.actual_at,
        'duration_min', x.duration_min, 'status', x.status) order by x.actual_at)
      from (select * from public._group_sessions(g.id, now() - interval '3 hours', now() + interval '21 days') limit 8) x), '[]'::jsonb))
  from profiles me join class_groups g on g.id = me.group_id
  where me.id = auth.uid()
$$;

-- Équipe : ses groupes (tous pour l'admin) avec l'horaire, les élèves et le bilan du mois en cours.
create function public.staff_groups() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  month_start timestamptz := date_trunc('month', now());
  month_end timestamptz := date_trunc('month', now()) + interval '1 month';
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', g.id, 'name', g.name, 'level', g.level, 'zoom_link', g.zoom_link, 'timezone', g.timezone,
      'teacher_id', g.teacher_id, 'teacher', (select full_name from profiles t where t.id = g.teacher_id),
      'slots', coalesce((select jsonb_agg(jsonb_build_object('weekday', s.weekday, 'start_time', to_char(s.start_time, 'HH24:MI'), 'duration_min', s.duration_min)
        order by s.weekday, s.start_time) from group_slots s where s.group_id = g.id), '[]'::jsonb),
      'members', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'full_name', p.full_name) order by p.full_name)
        from profiles p where p.group_id = g.id), '[]'::jsonb),
      'month', (select jsonb_build_object(
          'planned', count(*) filter (where x.status <> 'cancelled'),
          'moved', count(*) filter (where x.status = 'moved'),
          'cancelled', count(*) filter (where x.status = 'cancelled'),
          'done', count(*) filter (where x.status <> 'cancelled' and x.actual_at < now()))
        from public._group_sessions(g.id, month_start, month_end) x),
      'upcoming', coalesce((select jsonb_agg(jsonb_build_object('scheduled_at', x.scheduled_at, 'at', x.actual_at, 'status', x.status) order by x.actual_at)
        from (select * from public._group_sessions(g.id, now() - interval '3 hours', now() + interval '28 days') limit 12) x), '[]'::jsonb)
    ) order by g.name)
    from class_groups g
    where public.my_role() = 'admin' or g.teacher_id = auth.uid()), '[]'::jsonb);
end $$;

-- Admin : créer ou modifier un groupe, son horaire et ses élèves.
create function public.save_group(p_id uuid, p_name text, p_teacher uuid, p_level text, p_zoom text, p_timezone text,
  p_slots jsonb, p_members uuid[]) returns uuid
language plpgsql security definer set search_path = public as $$
declare gid uuid := p_id;
begin
  if public.my_role() <> 'admin' then raise exception 'admin only'; end if;
  if p_teacher is not null and not exists (select 1 from profiles where id = p_teacher and role in ('teacher', 'admin')) then
    raise exception 'teacher not found';
  end if;
  if p_timezone is null or not exists (select 1 from pg_timezone_names where name = p_timezone) then raise exception 'bad timezone'; end if;
  if gid is null then
    insert into class_groups (name, teacher_id, level, zoom_link, timezone)
    values (trim(p_name), p_teacher, p_level, nullif(trim(p_zoom), ''), p_timezone) returning id into gid;
  else
    update class_groups set name = trim(p_name), teacher_id = p_teacher, level = p_level,
      zoom_link = nullif(trim(p_zoom), ''), timezone = p_timezone where id = gid;
    if not found then raise exception 'group not found'; end if;
  end if;
  delete from group_slots where group_id = gid;
  insert into group_slots (group_id, weekday, start_time, duration_min)
  select gid, (s->>'weekday')::int, (s->>'start_time')::time, coalesce((s->>'duration_min')::int, 60)
  from jsonb_array_elements(coalesce(p_slots, '[]'::jsonb)) s;
  update profiles set group_id = null where group_id = gid and not (id = any (coalesce(p_members, '{}')));
  update profiles set group_id = gid, level = p_level, teacher_id = coalesce(p_teacher, teacher_id)
   where id = any (coalesce(p_members, '{}')) and role = 'student';
  return gid;
end $$;

create function public.delete_group(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() <> 'admin' then raise exception 'admin only'; end if;
  delete from class_groups where id = p_id;
end $$;

-- Professeur du groupe ou admin : demander à déplacer (p_new_at) ou annuler (p_new_at null) une séance.
-- La séance doit exister dans l'horaire fixe. Une demande de l'admin est validée d'office.
create function public.request_schedule_change(p_group uuid, p_original_at timestamptz, p_new_at timestamptz, p_reason text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  admin boolean := public.my_role() = 'admin';
  cid uuid;
begin
  if not admin and not exists (select 1 from class_groups where id = p_group and teacher_id = auth.uid()) then
    raise exception 'not your group';
  end if;
  if not exists (select 1 from public._group_sessions(p_group, p_original_at - interval '1 minute', p_original_at + interval '1 minute') x
                 where x.scheduled_at = p_original_at and x.status = 'planned') then
    raise exception 'no such session';
  end if;
  if p_original_at < now() - interval '1 day' then raise exception 'session in the past'; end if;
  if p_new_at is not null and p_new_at < now() then raise exception 'new time in the past'; end if;
  insert into schedule_changes (group_id, original_at, new_at, reason, requested_by, status, decided_by, decided_at)
  values (p_group, p_original_at, p_new_at, left(coalesce(trim(p_reason), ''), 300), auth.uid(),
    case when admin then 'approved' else 'pending' end, case when admin then auth.uid() end, case when admin then now() end)
  returning id into cid;
  return cid;
end $$;

-- Admin : valider ou refuser une demande.
create function public.decide_schedule_change(p_id uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() <> 'admin' then raise exception 'admin only'; end if;
  update schedule_changes set status = case when p_approve then 'approved' else 'rejected' end, decided_by = auth.uid(), decided_at = now()
   where id = p_id and status = 'pending';
  if not found then raise exception 'not pending'; end if;
end $$;

-- Équipe : les demandes de ses groupes (toutes pour l'admin), en attente d'abord.
create function public.list_schedule_changes() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'group_id', c.group_id, 'group', g.name,
      'original_at', c.original_at, 'new_at', c.new_at, 'reason', c.reason, 'status', c.status, 'created_at', c.created_at,
      'requested_by', (select full_name from profiles p where p.id = c.requested_by))
    order by (c.status = 'pending') desc, c.created_at desc), '[]'::jsonb)
  from (select * from schedule_changes order by created_at desc limit 60) c
  join class_groups g on g.id = c.group_id
  where public.is_staff() and (public.my_role() = 'admin' or g.teacher_id = auth.uid())
$$;

-- Programme par niveau ──────────────────────────────────────────────────────────────────────────────
create table public.level_documents (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('A1', 'A2', 'B1', 'B2')),
  title text not null check (length(trim(title)) between 1 and 120),
  path text not null unique,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.level_documents enable row level security;
create policy "level_documents: son niveau, tout pour l'équipe" on public.level_documents for select to authenticated
  using (public.is_staff() or level = (select level from profiles where id = auth.uid()));
create policy "level_documents: l'admin gère" on public.level_documents for all to authenticated
  using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- Fichiers : stockage privé « programa », un dossier par niveau (A1/…, A2/…).
insert into storage.buckets (id, name, public) values ('programa', 'programa', false) on conflict (id) do nothing;
create policy "programa: lire son niveau" on storage.objects for select to authenticated
  using (bucket_id = 'programa' and (public.is_staff() or (storage.foldername(name))[1] = (select level from public.profiles where id = auth.uid())));
create policy "programa: l'admin dépose" on storage.objects for insert to authenticated
  with check (bucket_id = 'programa' and public.my_role() = 'admin');
create policy "programa: l'admin supprime" on storage.objects for delete to authenticated
  using (bucket_id = 'programa' and public.my_role() = 'admin');

grant select on public.class_groups, public.group_slots, public.schedule_changes, public.level_documents to authenticated;
grant insert, update, delete on public.level_documents to authenticated;
revoke execute on function public._group_sessions(uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.my_schedule(), public.staff_groups(), public.save_group(uuid, text, uuid, text, text, text, jsonb, uuid[]),
  public.delete_group(uuid), public.request_schedule_change(uuid, timestamptz, timestamptz, text),
  public.decide_schedule_change(uuid, boolean), public.list_schedule_changes(), public.in_group(uuid) from public, anon;
grant execute on function public.my_schedule(), public.staff_groups(), public.save_group(uuid, text, uuid, text, text, text, jsonb, uuid[]),
  public.delete_group(uuid), public.request_schedule_change(uuid, timestamptz, timestamptz, text),
  public.decide_schedule_change(uuid, boolean), public.list_schedule_changes(), public.in_group(uuid) to authenticated;

commit;
