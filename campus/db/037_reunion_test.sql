-- Campus Pathway · 037 · après le test : la personne envoie ses disponibilités pour la réunion
-- À exécuter après 036 (SQL Editor → New query → Run), puis redéployer « placement-followups ».
--
-- Les e-mails du test (029) ne proposent plus de rythme ni de date : ils donnent le résultat et
-- invitent à compléter le test par une réunion personnalisée sur Zoom avec un professeur (partie
-- orale, objectif, disponibilités et date de début, fonctionnement des cours et du Campus,
-- inscription, tarifs et paiement). Le bouton mène à pathway-languages.com/disponibilidad.html,
-- où la personne coche ses moments libres (jour × matin / après-midi / soir), son fuseau horaire,
-- et peut laisser son WhatsApp et un message.
--
-- • meeting_request_submit (appelée par la page, sans compte) : le jeton est celui des e-mails du
--   test (placement_results.unsub_token). 5 envois au plus par test.
-- • Effets : la demande est gardée (meeting_requests), les e-mails automatiques s'arrêtent, la fiche
--   reçoit le WhatsApp et le fuseau s'ils manquaient, une ligne d'historique et la tâche « Proponer
--   la reunión por Zoom (envió sus disponibilidades) » pour aujourd'hui (« Urgente » dans le Campus).
-- • crm_prospect renvoie « meetings » (les disponibilités envoyées) pour la fiche.

begin;

create table if not exists public.meeting_requests (
  id bigint generated always as identity primary key,
  placement_id uuid references public.placement_results (id) on delete set null,
  prospect_id uuid references public.prospects (id) on delete set null,
  email text not null,
  slots jsonb not null,
  timezone text check (length(timezone) <= 64),
  whatsapp text check (length(whatsapp) <= 40),
  note text check (length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists meeting_requests_prospect on public.meeting_requests (prospect_id, created_at desc);
alter table public.meeting_requests enable row level security;
revoke all on public.meeting_requests from anon, authenticated;

create or replace function public.meeting_request_submit(p_token uuid, p_slots jsonb, p_timezone text default null,
  p_whatsapp text default null, p_note text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  r placement_results; pid uuid; parts jsonb; tz text; wa text; note text; summary text;
  days text[] := array['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
  part_es jsonb := '{"manana": "mañana", "tarde": "tarde", "noche": "noche"}';
begin
  select * into r from placement_results where unsub_token = p_token;
  if not found then return jsonb_build_object('ok', false, 'error', 'token'); end if;
  if (select count(*) from meeting_requests where placement_id = r.id) >= 5 then return jsonb_build_object('ok', false, 'error', 'too_many'); end if;
  if p_slots is null or jsonb_typeof(p_slots) <> 'array' or jsonb_array_length(p_slots) > 21 then return jsonb_build_object('ok', false, 'error', 'slots'); end if;
  select jsonb_agg(jsonb_build_object('day', d, 'part', p) order by d, array_position(array['manana', 'tarde', 'noche'], p)) into parts
  from (select distinct (s ->> 'day')::int d, s ->> 'part' p from jsonb_array_elements(p_slots) s
        where (s ->> 'day') ~ '^[1-7]$' and (s ->> 'part') in ('manana', 'tarde', 'noche')) x;
  if parts is null then return jsonb_build_object('ok', false, 'error', 'slots'); end if;
  tz := nullif(left(trim(coalesce(p_timezone, '')), 64), '');
  if tz is not null and tz !~ '^[A-Za-z]+(/[A-Za-z0-9_+-]+){1,2}$' then tz := null; end if;
  wa := nullif(left(trim(regexp_replace(coalesce(p_whatsapp, ''), '[^0-9+ ()-]', '', 'g')), 40), '');
  if wa is not null and length(regexp_replace(wa, '\D', '', 'g')) < 6 then wa := null; end if;
  note := nullif(left(trim(coalesce(p_note, '')), 1000), '');
  select id into pid from prospects where email = r.email;

  insert into meeting_requests (placement_id, prospect_id, email, slots, timezone, whatsapp, note)
  values (r.id, pid, r.email, parts, tz, wa, note);
  -- They answered: the automatic emails stop.
  update placement_results set followup_step = null, followup_next_at = null where email = r.email and followup_step between 0 and 2;

  if pid is not null then
    select string_agg(days[(x ->> 'day')::int] || ' ' || (part_es ->> (x ->> 'part')), ', ') into summary from jsonb_array_elements(parts) x;
    update prospects set whatsapp = coalesce(nullif(whatsapp, ''), wa), timezone = coalesce(nullif(timezone, ''), tz),
      next_action = 'Proponer la reunión por Zoom (envió sus disponibilidades)', next_due = public._crm_today(), updated_at = now()
    where id = pid and stage not in ('inscrito', 'activo');
    insert into prospect_events (prospect_id, kind, topic, body)
    values (pid, 'auto', 'test', left(format('Envió sus disponibilidades para la reunión con un profesor: %s%s.%s%s',
      summary, coalesce(' (hora de ' || tz || ')', ''), coalesce(' WhatsApp: ' || wa || '.', ''), coalesce(' Mensaje: «' || note || '»', '')), 1500));
  end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.meeting_request_submit(uuid, jsonb, text, text, text) from public;
grant execute on function public.meeting_request_submit(uuid, jsonb, text, text, text) to anon, authenticated;

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
      from meeting_requests m where m.prospect_id = p.id or (p.email is not null and m.email = p.email)), '[]'::jsonb));
end $$;

commit;
