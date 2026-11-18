-- Campus Pathway · 041 · « Mi agenda » et réunions avec les intéressés
-- À exécuter après 040 (SQL Editor → New query → Run), puis déployer la fonction « meetings ».
--
-- • Mi agenda (espace Profesor, chaque membre de l'équipe) : ses cours (horaires des élèves, cours
--   déplacés, rattrapages), ses réunions avec les intéressés et ses moments indisponibles (chaque
--   semaine, ou une fois). Réglages : lien Zoom personnel, adresse d'envoi des invitations, « hago
--   reuniones con interesados », lien d'abonnement privé pour voir l'agenda dans le calendrier du
--   téléphone (fonction « meetings », ?feed=<jeton>).
-- • Réunion : quand un intéressé a envoyé ses disponibilités (037), meeting_suggestions croise ses
--   créneaux (dans son fuseau) avec l'agenda réel des personnes qui font les réunions, et propose
--   les premiers créneaux libres. meeting_propose enregistre la réunion (« propuesta ») ; la
--   fonction « meetings » envoie l'invitation (Confirmo / Necesito otro horario, ajout au calendrier).
-- • meeting_respond (page reunion.html, sans compte, jeton de la réunion) : confirmer, ou demander un
--   autre horaire (retour à la page des disponibilités).
-- • meeting_mark : « Se hizo », « No vino », « Cancelar » ; la fiche et sa prochaine action suivent.

begin;

-- ─── Réglages de chaque membre de l'équipe ───
create table if not exists public.staff_agenda (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  zoom_link text check (zoom_link is null or zoom_link ~ '^https://[^\s]+$' and length(zoom_link) <= 300),
  sender_email text check (sender_email is null or sender_email in ('ryan@pathway-languages.com', 'abdrahim@pathway-languages.com', 'contacto@pathway-languages.com')),
  hosts_meetings boolean not null default false,
  feed_token uuid not null default gen_random_uuid() unique,
  updated_at timestamptz not null default now()
);
alter table public.staff_agenda enable row level security;
revoke all on public.staff_agenda from anon, authenticated;

-- Moments indisponibles : chaque semaine (weekday + heures, dans le fuseau de la personne) ou une fois.
create table if not exists public.agenda_blocks (
  id bigint generated always as identity primary key,
  staff_id uuid not null references public.profiles (id) on delete cascade,
  weekday int check (weekday between 1 and 7),
  start_time time, end_time time,
  starts_at timestamptz, ends_at timestamptz,
  note text check (length(note) <= 120),
  created_at timestamptz not null default now(),
  check ((weekday is not null and start_time is not null and end_time is not null and end_time > start_time and starts_at is null and ends_at is null)
      or (weekday is null and start_time is null and end_time is null and starts_at is not null and ends_at > starts_at))
);
create index if not exists agenda_blocks_staff on public.agenda_blocks (staff_id);
alter table public.agenda_blocks enable row level security;
revoke all on public.agenda_blocks from anon, authenticated;

create table if not exists public.prospect_meetings (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects (id) on delete cascade,
  host_id uuid not null references public.profiles (id),
  starts_at timestamptz not null,
  duration_min int not null default 30 check (duration_min between 10 and 120),
  zoom_link text check (zoom_link is null or zoom_link ~ '^https://[^\s]+$'),
  sender_email text,
  timezone text,                 -- the person's, for the emails and the page
  lang text not null default 'es',
  status text not null default 'propuesta' check (status in ('propuesta', 'confirmada', 'otro_horario', 'hecha', 'no_vino', 'cancelada')),
  token uuid not null default gen_random_uuid() unique,
  invite_sent_at timestamptz,
  invite_error text,
  reminded_day_at timestamptz,
  reminded_hour_at timestamptz,
  responded_at timestamptz,
  note text check (length(note) <= 1000),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists prospect_meetings_prospect on public.prospect_meetings (prospect_id, starts_at desc);
create index if not exists prospect_meetings_host on public.prospect_meetings (host_id, starts_at);
alter table public.prospect_meetings enable row level security;
revoke all on public.prospect_meetings from anon, authenticated;

-- ─── Occupation d'une personne de l'équipe (cours, réunions, indisponibilités) ───
create or replace function public._staff_tz(p_staff uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(timezone, ''), 'America/Lima') from profiles where id = p_staff
$$;
revoke all on function public._staff_tz(uuid) from public, anon, authenticated;

-- Every event of a staff member between two instants: kind, title, start, end, status, ids.
create or replace function public._agenda_events(p_staff uuid, p_from timestamptz, p_to timestamptz)
returns table (kind text, title text, starts_at timestamptz, ends_at timestamptz, status text, ref text, detail text)
language sql stable security definer set search_path = public as $$
  select 'clase', coalesce((select string_agg(pr.full_name, ', ') from profiles pr where pr.group_id = g.id), g.name),
    s.actual_at, s.actual_at + make_interval(mins => s.duration_min), s.status, g.id::text, g.zoom_link
  from class_groups g, lateral public._group_sessions(g.id, p_from - interval '4 hours', p_to) s
  where g.teacher_id = p_staff and s.status <> 'cancelled' and s.actual_at < p_to and s.actual_at + make_interval(mins => s.duration_min) > p_from
  union all
  select 'reunion', coalesce(nullif(p.full_name, ''), p.email, 'Interesado'), m.starts_at, m.starts_at + make_interval(mins => m.duration_min), m.status, m.prospect_id::text, m.zoom_link
  from prospect_meetings m join prospects p on p.id = m.prospect_id
  where m.host_id = p_staff and m.status in ('propuesta', 'confirmada', 'hecha', 'no_vino') and m.starts_at < p_to and m.starts_at + make_interval(mins => m.duration_min) > p_from
  union all
  select 'bloqueo', coalesce(b.note, 'No disponible'), b.starts_at, b.ends_at, 'once', b.id::text, null
  from agenda_blocks b where b.staff_id = p_staff and b.weekday is null and b.starts_at < p_to and b.ends_at > p_from
  union all
  select 'bloqueo', coalesce(b.note, 'No disponible'), (d::date + b.start_time) at time zone public._staff_tz(p_staff), (d::date + b.end_time) at time zone public._staff_tz(p_staff), 'weekly', b.id::text, null
  from agenda_blocks b, generate_series((p_from at time zone public._staff_tz(p_staff))::date - 1, (p_to at time zone public._staff_tz(p_staff))::date + 1, interval '1 day') d
  where b.staff_id = p_staff and b.weekday is not null and extract(isodow from d) = b.weekday
    and (d::date + b.start_time) at time zone public._staff_tz(p_staff) < p_to and (d::date + b.end_time) at time zone public._staff_tz(p_staff) > p_from
$$;
revoke all on function public._agenda_events(uuid, timestamptz, timestamptz) from public, anon, authenticated;

-- Busy: a class, a block, or a meeting still on (proposed or confirmed).
create or replace function public._staff_busy(p_staff uuid, p_from timestamptz, p_to timestamptz) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public._agenda_events(p_staff, p_from, p_to) e
    where e.kind <> 'reunion' or e.status in ('propuesta', 'confirmada'))
$$;
revoke all on function public._staff_busy(uuid, timestamptz, timestamptz) from public, anon, authenticated;

-- ─── Mi agenda ───
create or replace function public.my_agenda(p_from timestamptz, p_to timestamptz, p_staff uuid default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare who uuid := coalesce(p_staff, auth.uid()); s staff_agenda;
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  if who <> auth.uid() and not public.is_admin() then raise exception 'admin only'; end if;
  if p_to <= p_from or p_to - p_from > interval '45 days' then raise exception 'bad range'; end if;
  insert into staff_agenda (profile_id, hosts_meetings) values (who, (select role = 'admin' from profiles where id = who)) on conflict do nothing;
  select * into s from staff_agenda where profile_id = who;
  return jsonb_build_object(
    'staff', who, 'timezone', public._staff_tz(who),
    'settings', jsonb_build_object('zoom_link', s.zoom_link, 'sender_email', s.sender_email, 'hosts_meetings', s.hosts_meetings,
      'feed_token', case when who = auth.uid() then s.feed_token end),
    'events', coalesce((select jsonb_agg(jsonb_build_object('kind', e.kind, 'title', e.title, 'starts_at', e.starts_at, 'ends_at', e.ends_at,
      'status', e.status, 'ref', e.ref, 'zoom', e.detail) order by e.starts_at) from public._agenda_events(who, p_from, p_to) e), '[]'::jsonb),
    'blocks', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'weekday', b.weekday, 'start_time', b.start_time, 'end_time', b.end_time,
      'starts_at', b.starts_at, 'ends_at', b.ends_at, 'note', b.note) order by b.weekday nulls last, b.start_time, b.starts_at)
      from agenda_blocks b where b.staff_id = who and (b.weekday is not null or b.ends_at > now())), '[]'::jsonb),
    'people', case when public.is_admin() then (select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.full_name, 'role', p.role) order by p.full_name)
      from profiles p where p.role in ('teacher', 'admin')) end);
end $$;

create or replace function public.agenda_settings_save(p_zoom_link text, p_sender_email text, p_hosts_meetings boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  insert into staff_agenda (profile_id, zoom_link, sender_email, hosts_meetings)
  values (auth.uid(), nullif(trim(p_zoom_link), ''), nullif(trim(lower(p_sender_email)), ''), coalesce(p_hosts_meetings, false))
  on conflict (profile_id) do update set zoom_link = excluded.zoom_link, sender_email = excluded.sender_email,
    hosts_meetings = excluded.hosts_meetings, updated_at = now();
end $$;

create or replace function public.agenda_feed_reset() returns uuid
language plpgsql security definer set search_path = public as $$
declare t uuid := gen_random_uuid();
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  insert into staff_agenda (profile_id, feed_token) values (auth.uid(), t)
  on conflict (profile_id) do update set feed_token = t, updated_at = now();
  return t;
end $$;

create or replace function public.agenda_block_add(p_weekday int, p_start time, p_end time, p_starts_at timestamptz, p_ends_at timestamptz, p_note text) returns bigint
language plpgsql security definer set search_path = public as $$
declare i bigint;
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  if (select count(*) from agenda_blocks where staff_id = auth.uid()) >= 60 then raise exception 'too many blocks'; end if;
  insert into agenda_blocks (staff_id, weekday, start_time, end_time, starts_at, ends_at, note)
  values (auth.uid(), p_weekday, p_start, p_end, p_starts_at, p_ends_at, nullif(left(trim(coalesce(p_note, '')), 120), ''))
  returning id into i;
  return i;
end $$;

create or replace function public.agenda_block_delete(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  delete from agenda_blocks where id = p_id and staff_id = auth.uid();
end $$;

-- ─── Créneaux proposés pour la réunion ───
-- Their slots (day × morning 8–12 / afternoon 12–18 / evening 18–22, in their time zone) over the
-- next 14 days, every 30 minutes, from 12 h from now; kept when the host is free (and between 7:00
-- and 22:00 for the host). One per host and day, the earliest first.
create or replace function public.meeting_suggestions(p_prospect uuid, p_duration int default 30, p_limit int default 6) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  req meeting_requests; tz text; dur int := greatest(10, least(coalesce(p_duration, 30), 120));
  win jsonb := '{"manana": ["08:00", "12:00"], "tarde": ["12:00", "18:00"], "noche": ["18:00", "22:00"]}';
  res jsonb := '[]'; h record; dday date; s jsonb; t time; cand timestamptz; seen text[] := '{}'; key text; htz text; hl time;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into req from meeting_requests m where m.prospect_id = p_prospect or m.email = (select email from prospects where id = p_prospect)
    order by m.created_at desc limit 1;
  if req.id is null then return '[]'; end if;
  tz := coalesce(req.timezone, (select nullif(timezone, '') from prospects where id = p_prospect), 'America/Lima');
  for dday in select generate_series((now() at time zone tz)::date, (now() at time zone tz)::date + 14, interval '1 day')::date loop
    for s in select x from jsonb_array_elements(req.slots) x where (x ->> 'day')::int = extract(isodow from dday)::int loop
      t := (win -> (s ->> 'part') ->> 0)::time;
      while t + make_interval(mins => dur) <= (win -> (s ->> 'part') ->> 1)::time loop
        cand := (dday + t) at time zone tz;
        if cand > now() + interval '12 hours' then
          for h in select p.id, p.full_name from profiles p join staff_agenda a on a.profile_id = p.id
                   where a.hosts_meetings and p.role in ('teacher', 'admin') order by p.full_name loop
            key := h.id::text || dday::text;
            htz := public._staff_tz(h.id); hl := (cand at time zone htz)::time;
            if not (key = any(seen)) and hl >= '07:00' and hl + make_interval(mins => dur) <= '22:00'
               and not public._staff_busy(h.id, cand - interval '10 minutes', cand + make_interval(mins => dur + 10)) then
              seen := seen || key;
              res := res || jsonb_build_array(jsonb_build_object('host_id', h.id, 'host', h.full_name, 'starts_at', cand,
                'host_timezone', htz, 'timezone', tz));
            end if;
          end loop;
        end if;
        t := t + interval '30 minutes';
      end loop;
    end loop;
    exit when jsonb_array_length(res) >= greatest(1, least(p_limit, 12));
  end loop;
  return (select coalesce(jsonb_agg(x order by (x ->> 'starts_at')::timestamptz), '[]') from (select x from jsonb_array_elements(res) x order by (x ->> 'starts_at')::timestamptz limit greatest(1, least(p_limit, 12))) y);
end $$;

-- ─── Proposer, répondre, conclure ───
create or replace function public._meeting_json(m prospect_meetings) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', m.id, 'prospect_id', m.prospect_id, 'host_id', m.host_id, 'host', (select full_name from profiles where id = m.host_id),
    'starts_at', m.starts_at, 'duration_min', m.duration_min, 'zoom_link', m.zoom_link, 'sender_email', m.sender_email, 'timezone', m.timezone,
    'status', m.status, 'invite_sent_at', m.invite_sent_at, 'invite_error', m.invite_error, 'responded_at', m.responded_at, 'note', m.note, 'created_at', m.created_at)
$$;
revoke all on function public._meeting_json(prospect_meetings) from public, anon, authenticated;

create or replace function public.meeting_propose(p_prospect uuid, p_host uuid, p_starts_at timestamptz, p_duration int, p_zoom_link text, p_sender_email text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p prospects; req meeting_requests; m prospect_meetings; z text; snd text; tz text;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into p from prospects where id = p_prospect;
  if not found then raise exception 'not found'; end if;
  if p.email is null then raise exception 'no email'; end if;
  if p_starts_at < now() + interval '30 minutes' then raise exception 'too soon'; end if;
  if not exists (select 1 from profiles where id = p_host and role in ('teacher', 'admin')) then raise exception 'bad host'; end if;
  if public._staff_busy(p_host, p_starts_at, p_starts_at + make_interval(mins => greatest(10, least(coalesce(p_duration, 30), 120)))) then raise exception 'host busy'; end if;
  z := nullif(trim(coalesce(p_zoom_link, (select zoom_link from staff_agenda where profile_id = p_host), '')), '');
  if z is null or z !~ '^https://[^\s]+$' then raise exception 'zoom link'; end if;
  snd := coalesce(nullif(trim(lower(p_sender_email)), ''), (select sender_email from staff_agenda where profile_id = p_host), 'contacto@pathway-languages.com');
  if snd not in ('ryan@pathway-languages.com', 'abdrahim@pathway-languages.com', 'contacto@pathway-languages.com') then raise exception 'bad sender'; end if;
  select * into req from meeting_requests r where r.prospect_id = p.id or r.email = p.email order by r.created_at desc limit 1;
  tz := coalesce(req.timezone, nullif(p.timezone, ''), 'America/Lima');
  -- A new proposal replaces the one still waiting for an answer.
  update prospect_meetings set status = 'cancelada', updated_at = now() where prospect_id = p.id and status in ('propuesta', 'otro_horario');
  insert into prospect_meetings (prospect_id, host_id, starts_at, duration_min, zoom_link, sender_email, timezone, lang, created_by)
  values (p.id, p_host, p_starts_at, greatest(10, least(coalesce(p_duration, 30), 120)), z, snd, tz,
    coalesce((select r.lang from placement_results r where r.email = p.email order by r.created_at desc limit 1), p.lang, 'es'), auth.uid())
  returning * into m;
  update prospects set next_action = 'Esperar su confirmación de la reunión', next_due = (m.starts_at at time zone 'America/Lima')::date, updated_at = now()
  where id = p.id and stage not in ('inscrito', 'activo');
  insert into prospect_events (prospect_id, kind, topic, body, author_id)
  values (p.id, 'auto', 'reunion', format('Reunión propuesta con %s: %s (hora de %s).', (select full_name from profiles where id = p_host),
    to_char(m.starts_at at time zone tz, 'DD/MM HH24:MI'), tz), auth.uid());
  return public._meeting_json(m);
end $$;

-- The invitation was sent (or not) by the « meetings » function.
create or replace function public.meeting_invite_result(p_id uuid, p_ok boolean, p_error text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update prospect_meetings set invite_sent_at = case when p_ok then now() else invite_sent_at end,
    invite_error = case when p_ok then null else left(p_error, 300) end, updated_at = now() where id = p_id;
end $$;
revoke all on function public.meeting_invite_result(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.meeting_invite_result(uuid, boolean, text) to service_role;

-- What the invitation and reminder emails need (service only).
create or replace function public.meeting_mail_data(p_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select public._meeting_json(m) || jsonb_build_object('token', m.token, 'lang', m.lang, 'email', p.email,
    'name', coalesce(nullif(p.full_name, ''), null), 'host_email', (select u.email from auth.users u where u.id = m.host_id),
    'host_timezone', public._staff_tz(m.host_id))
  from prospect_meetings m join prospects p on p.id = m.prospect_id where m.id = p_id
$$;
revoke all on function public.meeting_mail_data(uuid) from public, anon, authenticated;
grant execute on function public.meeting_mail_data(uuid) to service_role;

-- Page reunion.html (no account): read, confirm, or ask for another time.
create or replace function public.meeting_public(p_token uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('starts_at', m.starts_at, 'duration_min', m.duration_min, 'timezone', m.timezone, 'lang', m.lang,
    'status', m.status, 'zoom_link', case when m.status in ('propuesta', 'confirmada') then m.zoom_link end,
    'host', split_part((select full_name from profiles where id = m.host_id), ' ', 1),
    'availability_token', (select r.unsub_token from placement_results r where r.email = p.email order by r.created_at desc limit 1))
  from prospect_meetings m join prospects p on p.id = m.prospect_id where m.token = p_token
$$;
revoke all on function public.meeting_public(uuid) from public;
grant execute on function public.meeting_public(uuid) to anon, authenticated;

create or replace function public.meeting_respond(p_token uuid, p_answer text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare m prospect_meetings;
begin
  select * into m from prospect_meetings where token = p_token;
  if not found then return jsonb_build_object('ok', false, 'error', 'token'); end if;
  if p_answer not in ('confirm', 'other') then return jsonb_build_object('ok', false, 'error', 'answer'); end if;
  if m.status not in ('propuesta', 'confirmada') then return jsonb_build_object('ok', false, 'error', 'closed', 'status', m.status); end if;
  if m.starts_at < now() then return jsonb_build_object('ok', false, 'error', 'past'); end if;
  if p_answer = 'confirm' then
    if m.status = 'confirmada' then return jsonb_build_object('ok', true, 'status', 'confirmada'); end if;
    update prospect_meetings set status = 'confirmada', responded_at = now(), updated_at = now() where id = m.id;
    update prospects set next_action = format('Reunión confirmada (%s)', (select full_name from profiles where id = m.host_id)),
      next_due = (m.starts_at at time zone 'America/Lima')::date, updated_at = now()
    where id = m.prospect_id and stage not in ('inscrito', 'activo');
    insert into prospect_events (prospect_id, kind, topic, body) values (m.prospect_id, 'auto', 'reunion',
      format('Confirmó la reunión del %s (hora de %s).', to_char(m.starts_at at time zone m.timezone, 'DD/MM HH24:MI'), m.timezone));
  else
    update prospect_meetings set status = 'otro_horario', responded_at = now(), updated_at = now() where id = m.id;
    update prospects set next_action = 'Proponer otra hora para la reunión (pidió otro horario)', next_due = public._crm_today(), updated_at = now()
    where id = m.prospect_id and stage not in ('inscrito', 'activo');
    insert into prospect_events (prospect_id, kind, topic, body) values (m.prospect_id, 'auto', 'reunion',
      format('Pidió otro horario en lugar del %s.', to_char(m.starts_at at time zone m.timezone, 'DD/MM HH24:MI')));
  end if;
  return jsonb_build_object('ok', true, 'status', case when p_answer = 'confirm' then 'confirmada' else 'otro_horario' end);
end $$;
revoke all on function public.meeting_respond(uuid, text) from public;
grant execute on function public.meeting_respond(uuid, text) to anon, authenticated;

create or replace function public.meeting_mark(p_id uuid, p_status text, p_note text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare m prospect_meetings; who text := (select full_name from profiles where id = auth.uid());
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if p_status not in ('hecha', 'no_vino', 'cancelada') then raise exception 'bad status'; end if;
  update prospect_meetings set status = p_status, note = coalesce(nullif(left(trim(coalesce(p_note, '')), 1000), ''), note), updated_at = now()
  where id = p_id returning * into m;
  if not found then raise exception 'not found'; end if;
  update prospects set
    next_action = case p_status when 'hecha' then 'Proponer el horario de clases e inscribir' when 'no_vino' then 'Reprogramar la reunión (no se conectó)' else 'Proponer otra hora para la reunión' end,
    next_due = public._crm_today(), updated_at = now()
  where id = m.prospect_id and stage not in ('inscrito', 'activo');
  insert into prospect_events (prospect_id, kind, topic, body, author_id) values (m.prospect_id, 'note', 'reunion',
    left(case p_status when 'hecha' then 'Reunión hecha.' when 'no_vino' then 'No se conectó a la reunión.' else 'Reunión cancelada.' end
      || coalesce(' ' || nullif(trim(coalesce(p_note, '')), ''), ''), 1500), auth.uid());
  return public._meeting_json(m);
end $$;

-- Reminders: the « meetings » function asks which are due (service only), then marks them.
create or replace function public.meetings_reminders_due() returns table (id uuid, kind text)
language sql stable security definer set search_path = public as $$
  select m.id, 'day' from prospect_meetings m
  where m.status in ('propuesta', 'confirmada') and m.reminded_day_at is null and m.invite_sent_at is not null
    and m.starts_at between now() + interval '20 hours' and now() + interval '26 hours' and m.created_at < m.starts_at - interval '26 hours'
  union all
  select m.id, 'hour' from prospect_meetings m
  where m.status = 'confirmada' and m.reminded_hour_at is null and m.starts_at between now() + interval '40 minutes' and now() + interval '75 minutes'
$$;
revoke all on function public.meetings_reminders_due() from public, anon, authenticated;
grant execute on function public.meetings_reminders_due() to service_role;

create or replace function public.meeting_reminded(p_id uuid, p_kind text) returns void
language sql security definer set search_path = public as $$
  update prospect_meetings set reminded_day_at = case when p_kind = 'day' then now() else reminded_day_at end,
    reminded_hour_at = case when p_kind = 'hour' then now() else reminded_hour_at end, updated_at = now() where id = p_id
$$;
revoke all on function public.meeting_reminded(uuid, text) from public, anon, authenticated;
grant execute on function public.meeting_reminded(uuid, text) to service_role;

-- Calendar subscription (service only): the agenda of the owner of a feed token, 30 days back, 120 ahead.
create or replace function public.agenda_feed(p_token uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', p.full_name, 'timezone', public._staff_tz(p.id),
    'events', coalesce((select jsonb_agg(jsonb_build_object('kind', e.kind, 'title', e.title, 'starts_at', e.starts_at, 'ends_at', e.ends_at, 'status', e.status, 'ref', e.ref, 'zoom', e.detail))
      from public._agenda_events(p.id, now() - interval '30 days', now() + interval '120 days') e), '[]'::jsonb))
  from staff_agenda a join profiles p on p.id = a.profile_id where a.feed_token = p_token
$$;
revoke all on function public.agenda_feed(uuid) from public, anon, authenticated;
grant execute on function public.agenda_feed(uuid) to service_role;

-- ─── Sur la fiche ───
create or replace function public.crm_prospect(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare p prospects;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into p from prospects where id = p_id;
  if not found then return null; end if;
  return public._crm_json(p) || jsonb_build_object(
    'events', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'kind', e.kind, 'topic', e.topic, 'body', e.body,
        'author', (select full_name from profiles where id = e.author_id), 'agent', e.agent, 'created_at', e.created_at) order by e.created_at desc, e.id desc)
      from prospect_events e where e.prospect_id = p.id), '[]'::jsonb),
    'tests', coalesce((select jsonb_agg(jsonb_build_object('level', r.level, 'overall', r.overall, 'mode', r.mode, 'created_at', r.created_at) order by r.created_at desc)
      from placement_results r where p.email is not null and r.email = p.email), '[]'::jsonb),
    'requests', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'created_at', r.created_at, 'handled_at', r.handled_at) order by r.created_at desc)
      from enrollment_requests r where p.email is not null and r.email = p.email), '[]'::jsonb),
    'followups', public._crm_followups(p.email),
    'meetings', coalesce((select jsonb_agg(jsonb_build_object('slots', m.slots, 'timezone', m.timezone, 'whatsapp', m.whatsapp, 'note', m.note, 'created_at', m.created_at) order by m.created_at desc)
      from meeting_requests m where m.prospect_id = p.id or (p.email is not null and m.email = p.email)), '[]'::jsonb),
    'zoom_meetings', coalesce((select jsonb_agg(public._meeting_json(x) order by x.starts_at desc) from prospect_meetings x where x.prospect_id = p.id), '[]'::jsonb));
end $$;

-- Bandeja: the meetings of the coming days and the invitations still unanswered.
create or replace function public.meetings_overview() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.is_admin() then coalesce(jsonb_agg(public._meeting_json(m) || jsonb_build_object('name', coalesce(nullif(p.full_name, ''), p.email)) order by m.starts_at), '[]'::jsonb) end
  from prospect_meetings m join prospects p on p.id = m.prospect_id
  where (m.status in ('propuesta', 'confirmada', 'otro_horario') and m.starts_at > now() - interval '3 hours' and m.starts_at < now() + interval '14 days')
     or (m.status in ('propuesta', 'confirmada') and m.starts_at <= now() - interval '3 hours' and m.starts_at > now() - interval '3 days')
$$;

-- Everyone on the team who already exists hosts meetings if admin (Ryan, Abdrahim…); editable in Mi agenda.
insert into public.staff_agenda (profile_id, hosts_meetings)
select id, role = 'admin' from public.profiles where role in ('teacher', 'admin') on conflict do nothing;

commit;

notify pgrst, 'reload schema';
