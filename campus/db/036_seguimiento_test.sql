-- Campus Pathway · 036 · test de niveau : la tâche de l'équipe suit les e-mails automatiques
-- À exécuter après 035 (SQL Editor → New query → Run).
--
-- Depuis 029, quelqu'un qui termine le test reçoit tout seul 3 e-mails (tout de suite, à 2 jours,
-- à 5 jours). Mais la fiche recevait encore l'ancienne tâche « Escribir con el resultado del test »
-- pour le jour même : elle passait en « Urgente » le lendemain alors que l'e-mail était déjà parti.
--
-- 1. Test avec e-mails automatiques : la tâche devient « Si no respondió a los correos
--    automáticos, escribirle », prévue 6 jours après le test (le lendemain du 3e e-mail).
--    Sans e-mails automatiques (désinscrit), l'ancienne tâche reste, pour le jour même.
-- 2. La personne répond par e-mail (onglet « Correo ») : les e-mails automatiques s'arrêtent,
--    l'historique de la fiche le dit, et la tâche d'attente est remplacée par « Responder su
--    correo » pour aujourd'hui (la réponse se prépare dans « Correo »).
-- 3. Fiches existantes : la tâche est corrigée de la même façon.
-- 4. crm_prospect renvoie « followups » : où en sont les 3 e-mails du dernier test (affiché sur
--    la fiche : envoyés, prochain envoi, arrêtés, désinscription).

begin;

-- ─── 1. Nouveau test ───
create or replace function public._crm_feed_placement(r public.placement_results) returns void
language plpgsql security definer set search_path = public as $$
declare
  f record; moved boolean; weak text;
  skill_es jsonb := '{"reading": "comprensión escrita", "listening": "comprensión oral", "grammarVocabulary": "gramática y vocabulario"}';
begin
  select * into f from public._crm_upsert('test', r.email, null, null, r.campaign, r.source, r.lang, r.created_at);
  update prospects set level = r.level, level_score = coalesce(r.overall, level_score) where id = f.p_id;
  select skill_es ->> k into weak from jsonb_each_text(coalesce(r.detail -> 'skills', '{}')) s(k, v)
    where v ~ '^\d+(\.\d+)?$' and skill_es ? k order by v::numeric limit 1;
  moved := public._crm_advance(f.p_id, 'test', r.created_at);
  perform public._crm_event(f.p_id, 'auto', format('Hizo el test de nivel%s: %s%s.%s%s',
    case r.mode when 'intensive' then ' intensivo' when 'express' then ' exprés' else '' end, r.level,
    coalesce(' (' || r.overall || '/100)', ''), coalesce(' Prioridad: ' || weak || '.', ''),
    case when moved and not f.p_new then ' Pasa a «Test hecho».' else '' end), 'test', null, r.created_at);
  if r.followup_step is not null and not exists (select 1 from email_optouts o where o.email = r.email) then
    -- The 3 automatic emails do the writing; the team steps in only if nothing comes back.
    update prospects set next_action = 'Si no respondió a los correos automáticos, escribirle',
      next_due = (r.created_at at time zone 'America/Lima')::date + 6
    where id = f.p_id and next_due is null and stage not in ('inscrito', 'activo');
  else
    perform public._crm_default_next(f.p_id, 'Escribir con el resultado del test');
  end if;
end $$;

-- ─── 2. Réponse par e-mail ───
create or replace function public._mail_stop_followups() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid; pmail text; stopped int;
begin
  if new.direction <> 'in' then return new; end if;
  select t.prospect_id, p.email into pid, pmail from mail_threads t join prospects p on p.id = t.prospect_id where t.id = new.thread_id;
  if pid is null or pmail is null then return new; end if;
  update placement_results set followup_step = null, followup_next_at = null
  where email = pmail and followup_step between 0 and 2;
  get diagnostics stopped = row_count;
  if stopped > 0 then
    insert into prospect_events (prospect_id, kind, topic, body)
    values (pid, 'auto', 'correo', 'Respondió por correo: los correos automáticos del test se detienen.');
  end if;
  update prospects set next_action = 'Responder su correo (pestaña «Correo»)', next_due = public._crm_today()
  where id = pid and stage not in ('inscrito', 'activo')
    and (next_due is null or next_action in ('Si no respondió a los correos automáticos, escribirle', 'Escribir con el resultado del test'));
  return new;
end $$;
drop trigger if exists mail_messages_stop_followups on public.mail_messages;
create trigger mail_messages_stop_followups after insert on public.mail_messages
  for each row execute function public._mail_stop_followups();

-- ─── 3. Fiches existantes ───
with latest as (select distinct on (email) id, email, created_at, followup_step from placement_results order by email, created_at desc)
update prospects p set next_action = 'Si no respondió a los correos automáticos, escribirle',
  next_due = (r.created_at at time zone 'America/Lima')::date + 6
from latest r
where r.email = p.email and p.next_action = 'Escribir con el resultado del test' and p.archived_at is null
  and p.stage not in ('inscrito', 'activo')
  and (r.followup_step is not null or exists (select 1 from email_log l where l.placement_id = r.id and l.status between 200 and 299))
  and not exists (select 1 from email_optouts o where o.email = p.email);

-- ─── 4. Sur la fiche ───
create or replace function public._crm_followups(p_email text) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when r.id is null then null else jsonb_build_object(
    'test_at', r.created_at,
    'sent', (select count(*) from email_log l where l.placement_id = r.id and l.status between 200 and 299),
    'last_sent_at', (select max(l.created_at) from email_log l where l.placement_id = r.id and l.status between 200 and 299),
    'next_step', r.followup_step,
    'next_at', r.followup_next_at,
    'optout', exists (select 1 from email_optouts o where o.email = r.email),
    'active', r.followup_step between 0 and 2 and r.created_at > now() - interval '30 days')
  end
  from (select 1) one
  left join lateral (select * from placement_results r where p_email is not null and r.email = p_email
    and (r.followup_step is not null or exists (select 1 from email_log l where l.placement_id = r.id))
    order by r.created_at desc limit 1) r on true
$$;
revoke all on function public._crm_followups(text) from public, anon, authenticated;

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
    'followups', public._crm_followups(p.email));
end $$;

commit;
