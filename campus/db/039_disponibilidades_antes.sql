-- Campus Pathway · 039 · disponibilités envoyées avant le 1er e-mail du test
-- À exécuter après 038 (SQL Editor → New query → Run), puis redéployer « placement-followups ».
--
-- Depuis 038, la page de résultat permet d'envoyer ses disponibilités tout de suite, souvent avant
-- le 1er e-mail (il part dans les 5 minutes). meeting_request_submit arrêtait alors TOUTES les
-- relances, y compris le 1er e-mail : la personne ne recevait jamais son résultat par e-mail.
--
-- • meeting_request_submit n'arrête plus que les rappels (e-mails 2 et 3) : le 1er part quand même.
-- • followups_due dit si des disponibilités ont déjà été reçues (has_meeting) : le 1er e-mail donne
--   alors le résultat et « Recibimos tus disponibilidades » au lieu du bouton.
-- • followup_sent : après ce 1er e-mail, plus rien n'est envoyé si des disponibilités existent.

begin;

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
  -- The reminders stop; the first email (their result) still goes if it has not yet.
  update placement_results set followup_step = null, followup_next_at = null where email = r.email and followup_step between 1 and 2;

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

drop function if exists public.followups_due(integer);
create function public.followups_due(p_limit integer default 20)
returns table (id uuid, email text, level text, overall integer, mode text, lang text, detail jsonb, step integer, unsub_token uuid,
  full_name text, created_at timestamptz, has_meeting boolean)
language sql stable security definer set search_path = public, auth as $$
  select r.id, r.email, r.level, r.overall, r.mode, coalesce(r.lang, 'es'), r.detail, r.followup_step,
    r.unsub_token, p.full_name, r.created_at, exists (select 1 from meeting_requests m where m.placement_id = r.id)
  from placement_results r
  left join prospects p on p.email = r.email
  where r.followup_step between 0 and 2
    and r.followup_next_at <= now()
    and r.created_at > now() - interval '30 days'
    and not exists (select 1 from email_optouts o where o.email = r.email)
    and not exists (select 1 from enrollment_requests e where lower(e.email) = r.email)
    and not exists (select 1 from auth.users u where lower(u.email) = r.email)
    and (p.id is null or (p.archived_at is null and p.stage in ('nuevo', 'test')))
  order by r.followup_next_at
  limit greatest(1, least(p_limit, 100))
$$;
revoke all on function public.followups_due(integer) from public, anon, authenticated;
grant execute on function public.followups_due(integer) to service_role;

create or replace function public.followup_sent(p_id uuid, p_step integer, p_status integer, p_error text default null) returns void
language plpgsql security definer set search_path = public as $$
declare ok boolean := p_status between 200 and 299; pid uuid;
begin
  insert into email_log (placement_id, kind, step, status, error) values (p_id, 'placement_followup', p_step, p_status, left(p_error, 500));
  if ok then
    update placement_results set followup_step = p_step + 1, followup_attempts = 0,
      followup_next_at = case p_step when 0 then now() + interval '2 days' when 1 then now() + interval '3 days' else null end
    where id = p_id and followup_step = p_step;
    -- Availability already received: the result email was the last one.
    if exists (select 1 from meeting_requests m where m.placement_id = p_id) then
      update placement_results set followup_step = null, followup_next_at = null where id = p_id;
    end if;
    select p.id into pid from prospects p join placement_results r on r.email = p.email where r.id = p_id;
    if pid is not null then
      insert into prospect_events (prospect_id, kind, topic, body)
      values (pid, 'auto', 'correo', format('Correo automático %s/3 enviado tras el test de nivel.', p_step + 1));
    end if;
  else
    update placement_results set followup_attempts = followup_attempts + 1,
      followup_step = case when followup_attempts + 1 >= 3 then null else followup_step end,
      followup_next_at = case when followup_attempts + 1 >= 3 then null else now() + interval '1 hour' end
    where id = p_id;
  end if;
  delete from email_log where created_at < now() - interval '180 days';
end $$;

commit;
