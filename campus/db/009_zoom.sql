-- Campus Pathway · 009 · suivi Zoom : heure réelle des cours et enregistrements automatiques
-- À exécuter après 008 (SQL Editor → New query → Run).
-- La fonction « zoom-webhook » (supabase/functions/zoom-webhook) reçoit les avis du compte Zoom
-- Pathway : début et fin de chaque réunion, enregistrement cloud terminé. Chaque réunion est
-- rattachée au groupe dont le lien Zoom porte le même numéro (zoom.us/j/<numéro>).
-- • L'élève retrouve les enregistrements de son groupe dans « Mi curso ».
-- • L'équipe voit, séance par séance, l'heure réelle de début et si l'enregistrement est arrivé.

begin;

alter table public.class_groups
  add column if not exists zoom_meeting_id text generated always as (substring(zoom_link from '/j/([0-9]+)')) stored;
create index if not exists class_groups_zoom_meeting on public.class_groups (zoom_meeting_id);

-- Une ligne par réunion Zoom réellement tenue (uuid Zoom de l'occurrence).
create table public.zoom_meetings (
  meeting_uuid text primary key,
  meeting_id text not null,
  group_id uuid references public.class_groups (id) on delete set null,
  topic text not null default '',
  host_email text not null default '',
  started_at timestamptz,
  ended_at timestamptz,
  recording_url text,
  recording_minutes int,
  recorded_at timestamptz,
  updated_at timestamptz not null default now()
);
create index zoom_meetings_group_start on public.zoom_meetings (group_id, started_at);
alter table public.zoom_meetings enable row level security;
create policy "zoom_meetings: ceux de ses groupes" on public.zoom_meetings for select to authenticated
  using (group_id is not null and public.in_group(group_id));

-- Appelée uniquement par la fonction zoom-webhook (clé service). p_event : meeting.started,
-- meeting.ended ou recording.completed.
create function public.zoom_event(p_event text, p_meeting_id text, p_uuid text, p_topic text, p_host_email text,
  p_start timestamptz, p_end timestamptz, p_recording_url text, p_recording_minutes int) returns void
language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  if p_uuid is null or p_meeting_id is null then return; end if;
  select id into gid from class_groups where zoom_meeting_id = p_meeting_id order by created_at limit 1;
  insert into zoom_meetings as z (meeting_uuid, meeting_id, group_id, topic, host_email, started_at, ended_at, recording_url, recording_minutes, recorded_at)
  values (p_uuid, p_meeting_id, gid, coalesce(p_topic, ''), coalesce(p_host_email, ''), p_start,
    case when p_event = 'meeting.ended' then coalesce(p_end, now()) end,
    case when p_event = 'recording.completed' then p_recording_url end,
    case when p_event = 'recording.completed' then p_recording_minutes end,
    case when p_event = 'recording.completed' then now() end)
  on conflict (meeting_uuid) do update set
    group_id = coalesce(z.group_id, excluded.group_id),
    topic = coalesce(nullif(excluded.topic, ''), z.topic),
    host_email = coalesce(nullif(excluded.host_email, ''), z.host_email),
    started_at = coalesce(z.started_at, excluded.started_at),
    ended_at = coalesce(excluded.ended_at, z.ended_at),
    recording_url = coalesce(excluded.recording_url, z.recording_url),
    recording_minutes = coalesce(excluded.recording_minutes, z.recording_minutes),
    recorded_at = coalesce(excluded.recorded_at, z.recorded_at),
    updated_at = now();
end $$;
revoke execute on function public.zoom_event(text, text, text, text, text, timestamptz, timestamptz, text, int) from public, anon, authenticated;
grant execute on function public.zoom_event(text, text, text, text, text, timestamptz, timestamptz, text, int) to service_role;

-- Séances passées d'un groupe, chacune avec la réunion Zoom qui lui correspond (démarrée entre
-- 60 min avant et 90 min après l'heure prévue) : heure réelle, retard, enregistrement.
create function public._group_log(p_group uuid, p_from timestamptz, p_to timestamptz)
returns table (scheduled_at timestamptz, at timestamptz, status text, started_at timestamptz, late_min int, recording_url text, recorded boolean)
language sql stable security definer set search_path = public as $$
  select s.scheduled_at, s.actual_at, s.status, z.started_at,
    case when z.started_at is not null then greatest(0, round(extract(epoch from z.started_at - s.actual_at) / 60))::int end,
    z.recording_url, z.recording_url is not null
  from public._group_sessions(p_group, p_from, p_to) s
  left join lateral (
    select * from zoom_meetings m
    where m.group_id = p_group and m.started_at between s.actual_at - interval '60 minutes' and s.actual_at + interval '90 minutes'
    order by abs(extract(epoch from m.started_at - s.actual_at)) limit 1
  ) z on s.status <> 'cancelled'
  where s.actual_at < now()
  order by s.actual_at desc
$$;
revoke execute on function public._group_log(uuid, timestamptz, timestamptz) from public, anon, authenticated;

-- Élève : enregistrements de son groupe (60 derniers jours).
create function public.my_recordings() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('at', m.started_at, 'url', m.recording_url, 'minutes', m.recording_minutes) order by m.started_at desc), '[]'::jsonb)
  from profiles me join zoom_meetings m on m.group_id = me.group_id
  where me.id = auth.uid() and m.recording_url is not null and m.started_at > now() - interval '60 days'
$$;

-- Équipe : journal des séances passées (30 jours) de ses groupes, et réunions Zoom sans groupe (admin).
create function public.staff_class_log() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  return jsonb_build_object(
    'groups', coalesce((select jsonb_object_agg(g.id, coalesce((select jsonb_agg(to_jsonb(l)) from public._group_log(g.id, now() - interval '30 days', now()) l), '[]'::jsonb))
      from class_groups g where public.my_role() = 'admin' or g.teacher_id = auth.uid()), '{}'::jsonb),
    'unmatched', case when public.my_role() = 'admin' then coalesce((select jsonb_agg(jsonb_build_object('meeting_id', m.meeting_id, 'topic', m.topic,
        'host_email', m.host_email, 'started_at', m.started_at, 'recorded', m.recording_url is not null) order by m.started_at desc)
      from (select * from zoom_meetings where group_id is null and started_at > now() - interval '30 days' order by started_at desc limit 20) m), '[]'::jsonb) else '[]'::jsonb end);
end $$;

grant select on public.zoom_meetings to authenticated;
revoke execute on function public.my_recordings(), public.staff_class_log() from public, anon;
grant execute on function public.my_recordings(), public.staff_class_log() to authenticated;

commit;
