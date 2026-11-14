-- Campus Pathway · 027 · conversations WhatsApp des prospects, avec brouillons de réponse
-- À exécuter après 026 (SQL Editor → New query → Run), puis déployer la fonction « whatsapp »
-- (avec « Verify JWT » désactivé : elle vérifie elle-même chaque appel, voir SQL_A_COPIER.md).
--
-- • Les messages WhatsApp reçus par Pathway (publicités Facebook / Instagram « clic vers
--   WhatsApp », numéro du site…) arrivent dans le Campus, onglet « Prospectos » → « WhatsApp ».
--   Une conversation par numéro (wa_threads), avec ses messages (wa_messages).
-- • Pour chaque message reçu, la fonction « whatsapp » prépare un BROUILLON de réponse en espagnol
--   (tutoiement). Rien ne part tout seul : un admin l'envoie tel quel (« Enviar »), le modifie
--   (« Editar ») ou l'écarte (« Descartar »), ou écrit sa propre réponse. Le message envoyé est un
--   message normal de Pathway : une personne de l'équipe l'a relu et envoyé.
-- • WhatsApp ne laisse répondre librement que dans les 24 h qui suivent le dernier message de la
--   personne (« ventana de 24 h »). Après, il faut un modèle de message approuvé (« plantilla »),
--   pas encore géré ici : l'envoi est refusé avec une explication.
-- • Chaque numéro est relié à la fiche du CRM qui a le même WhatsApp, sinon une fiche est créée
--   (origine « WhatsApp », ou « Publicidad » avec le titre de l'annonce quand la personne arrive
--   par une publicité « clic vers WhatsApp »), avec une ligne dans l'historique.
-- • Seuls les admins voient et envoient. Aucune table n'est lisible directement ; tout passe par
--   les fonctions ci-dessous. Celles de la fonction « whatsapp » (réception, brouillons, statuts
--   de livraison) ne s'appellent qu'avec la clé service.
-- • Coût : au plus 10 brouillons par conversation et par heure. Un e-mail aux admins quand une
--   conversation attend une réponse, au plus un toutes les 30 min par conversation.

begin;

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────
create table public.wa_threads (
  id uuid primary key default gen_random_uuid(),
  -- Le numéro WhatsApp de la personne, en chiffres avec l'indicatif (ex. 51987654321).
  wa_id text not null unique check (wa_id ~ '^\d{6,20}$'),
  profile_name text check (length(profile_name) <= 120),
  prospect_id uuid references public.prospects (id) on delete set null,
  -- Première publicité « clic vers WhatsApp » d'où elle est venue (source_url, headline, ctwa_clid…).
  referral jsonb,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  needs_reply boolean not null default false,
  needs_reply_since timestamptz,
  unread int not null default 0 check (unread >= 0),
  staff_read_at timestamptz,
  handled_at timestamptz,
  handled_by uuid references public.profiles (id) on delete set null,
  emailed_at timestamptz
);
create index wa_threads_needs_reply on public.wa_threads (needs_reply_since) where needs_reply;
create index wa_threads_prospect on public.wa_threads (prospect_id) where prospect_id is not null;

create table public.wa_messages (
  id bigint generated always as identity primary key,
  thread_id uuid not null references public.wa_threads (id) on delete cascade,
  direction text not null check (direction in ('in', 'out')),
  -- inbound : reçu ; draft : brouillon pas encore envoyé ; sent : envoyé (ou en cours, ou échoué) ;
  -- discarded : brouillon écarté (par un admin, ou remplacé par un brouillon plus récent).
  kind text not null check (kind in ('inbound', 'draft', 'sent', 'discarded')),
  body text not null check (length(btrim(body)) between 1 and 4096),
  -- text, audio, image, video, document, sticker, location, contacts, interactive, button, reaction…
  media_type text not null default 'text' check (media_type ~ '^[a-z_]{1,20}$'),
  -- Identifiant WhatsApp du message (wamid…) : un message reçu deux fois n'est gardé qu'une fois.
  provider_id text check (length(provider_id) <= 200),
  status text check (status in ('pending', 'sent', 'delivered', 'read', 'failed')),
  status_at timestamptz,
  error text check (length(error) <= 300),
  drafted_by_ai boolean not null default false,
  edited boolean not null default false,
  author_id uuid references public.profiles (id) on delete set null,
  -- Pour l'équipe, à côté du brouillon : ce qui demande une décision (en français).
  note text check (length(note) <= 300),
  flagged boolean not null default false,
  reply_to bigint references public.wa_messages (id) on delete set null,
  referral jsonb,
  -- Envoyé depuis l'application WhatsApp Business du téléphone (numéro en « coexistence »).
  from_app boolean not null default false,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  check ((direction = 'in') = (kind = 'inbound')),
  check (status is null or direction = 'out'),
  check (kind <> 'sent' or status is not null)
);
create unique index wa_messages_provider on public.wa_messages (provider_id) where provider_id is not null;
create index wa_messages_thread on public.wa_messages (thread_id, id);
create index wa_messages_ai_recent on public.wa_messages (thread_id, created_at) where drafted_by_ai;
-- Un seul brouillon automatique par message reçu (les nouveaux essais du webhook n'en refont pas).
create unique index wa_messages_one_ai_draft on public.wa_messages (reply_to) where drafted_by_ai and reply_to is not null;

alter table public.wa_threads enable row level security;
alter table public.wa_messages enable row level security;
revoke all on public.wa_threads, public.wa_messages from anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Aides
-- ─────────────────────────────────────────────────────────────
-- Fenêtre de 24 h : ouverte tant que le dernier message de la personne a moins de 24 h.
create function public._wa_window_open(t public.wa_threads) returns boolean
language sql stable as $$ select coalesce(t.last_inbound_at > now() - interval '24 hours', false) $$;

-- Brouillons automatiques de la dernière heure (les écartés comptent aussi).
create function public._wa_draft_quota(p_thread uuid) returns int
language sql stable security definer set search_path = public as $$
  select greatest(0, 10 - (select count(*)::int from wa_messages where thread_id = p_thread and drafted_by_ai and created_at > now() - interval '1 hour'))
$$;

create function public._wa_msg_json(m public.wa_messages) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', m.id, 'direction', m.direction, 'kind', m.kind, 'body', m.body, 'media_type', m.media_type,
    'status', m.status, 'status_at', m.status_at, 'error', m.error, 'drafted_by_ai', m.drafted_by_ai, 'edited', m.edited,
    'author', (select full_name from profiles where id = m.author_id), 'mine', m.author_id = auth.uid(),
    'note', m.note, 'flagged', m.flagged, 'from_app', m.from_app, 'reply_to', m.reply_to,
    'created_at', m.created_at, 'sent_at', m.sent_at)
$$;

create function public._wa_thread_json(t public.wa_threads) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', t.id, 'wa_id', t.wa_id, 'phone', '+' || t.wa_id, 'name', t.profile_name,
    'prospect', (select jsonb_build_object('id', p.id, 'name', p.full_name, 'stage', p.stage, 'level', p.level, 'origin', p.origin, 'campaign', p.campaign)
      from prospects p where p.id = t.prospect_id),
    'referral', t.referral, 'created_at', t.created_at, 'last_message_at', t.last_message_at,
    'last_inbound_at', t.last_inbound_at, 'last_outbound_at', t.last_outbound_at,
    'window_open', public._wa_window_open(t), 'window_ends_at', t.last_inbound_at + interval '24 hours',
    'needs_reply', t.needs_reply, 'needs_reply_since', t.needs_reply_since, 'unread', t.unread,
    'handled_at', t.handled_at, 'handled_by', (select full_name from profiles where id = t.handled_by),
    'drafts', (select count(*) from wa_messages m where m.thread_id = t.id and m.kind = 'draft'),
    'flagged', exists (select 1 from wa_messages m where m.thread_id = t.id and m.kind = 'draft' and m.flagged),
    'note', (select m.note from wa_messages m where m.thread_id = t.id and m.kind = 'draft' and m.note is not null order by m.id desc limit 1),
    'last', (select jsonb_build_object('body', left(m.body, 160), 'direction', m.direction, 'kind', m.kind, 'status', m.status,
        'media_type', m.media_type, 'created_at', m.created_at)
      from wa_messages m where m.thread_id = t.id and m.kind <> 'discarded' order by m.id desc limit 1))
$$;

-- ─────────────────────────────────────────────────────────────
-- Pour l'administration (et seulement elle)
-- ─────────────────────────────────────────────────────────────
-- Les conversations : celles qui attendent une réponse d'abord.
create function public.wa_threads_list() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return coalesce((select jsonb_agg(public._wa_thread_json(t) order by t.needs_reply desc, t.last_message_at desc nulls last)
    from (select * from wa_threads order by needs_reply desc, last_message_at desc nulls last limit 300) t), '[]'::jsonb);
end $$;

-- Une conversation et ses 200 derniers messages ; l'ouvrir la marque comme lue. Les brouillons
-- remplacés automatiquement par un plus récent n'apparaissent pas.
create function public.wa_thread(p_thread uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t wa_threads;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  update wa_threads set unread = 0, staff_read_at = now() where id = p_thread returning * into t;
  if not found then return null; end if;
  return public._wa_thread_json(t) || jsonb_build_object('messages', coalesce((select jsonb_agg(public._wa_msg_json(m) order by m.id)
    from (select * from wa_messages where thread_id = t.id and not (kind = 'discarded' and author_id is null)
          order by id desc limit 200) m), '[]'::jsonb));
end $$;

-- Modifier le texte d'un brouillon (sans l'envoyer).
create function public.wa_edit_draft(p_message bigint, p_body text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare m wa_messages; b text := btrim(coalesce(p_body, ''));
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if length(b) = 0 then raise exception 'empty_message'; end if;
  if length(b) > 4096 then raise exception 'message_too_long'; end if;
  update wa_messages set body = b, edited = edited or body <> b where id = p_message and kind = 'draft' returning * into m;
  if not found then raise exception 'draft_not_found'; end if;
  return public._wa_msg_json(m);
end $$;

-- Écarter un brouillon : il reste visible, barré, pour l'équipe ; la personne ne le reçoit jamais.
create function public.wa_discard_draft(p_message bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  update wa_messages set kind = 'discarded', author_id = auth.uid() where id = p_message and kind = 'draft';
  if not found then raise exception 'draft_not_found'; end if;
end $$;

-- « Marcar como resuelta » (répondu par un autre moyen) ou la remettre « por responder ».
create function public.wa_set_done(p_thread uuid, p_done boolean default true) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  update wa_threads set needs_reply = not coalesce(p_done, true),
    needs_reply_since = case when coalesce(p_done, true) then null else coalesce(needs_reply_since, now()) end,
    handled_at = case when coalesce(p_done, true) then now() end,
    handled_by = case when coalesce(p_done, true) then auth.uid() end
  where id = p_thread;
  if not found then raise exception 'not found'; end if;
end $$;

-- Préparer un envoi (appelée par la fonction « whatsapp » avec la session de l'admin) : un
-- brouillon (texte modifié ou non), un envoi échoué à réessayer, ou un texte libre. Le message
-- passe à « sent » en attente (pending) ; la fonction l'envoie puis appelle wa_mark_sent ou
-- wa_mark_failed. Refusé hors de la fenêtre de 24 h.
create function public.wa_prepare_send(p_thread uuid, p_message bigint default null, p_body text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t wa_threads; m wa_messages; b text := nullif(btrim(coalesce(p_body, '')), '');
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into t from wa_threads where id = p_thread for update;
  if not found then raise exception 'not found'; end if;
  if not public._wa_window_open(t) then raise exception 'window_closed'; end if;
  if b is not null and length(b) > 4096 then raise exception 'message_too_long'; end if;
  if p_message is not null then
    select * into m from wa_messages where id = p_message and thread_id = p_thread for update;
    if not found then raise exception 'draft_not_found'; end if;
    if m.kind = 'draft' then
      update wa_messages set kind = 'sent', status = 'pending', status_at = now(), error = null, author_id = auth.uid(),
        body = coalesce(b, body), edited = edited or (b is not null and b <> body)
      where id = m.id returning * into m;
    elsif m.kind = 'sent' and m.status = 'failed' then
      update wa_messages set status = 'pending', status_at = now(), error = null, author_id = auth.uid() where id = m.id returning * into m;
    else
      raise exception 'not_sendable';
    end if;
  else
    if b is null then raise exception 'empty_message'; end if;
    insert into wa_messages (thread_id, direction, kind, body, status, status_at, author_id)
    values (p_thread, 'out', 'sent', b, 'pending', now(), auth.uid()) returning * into m;
  end if;
  return jsonb_build_object('message_id', m.id, 'to', t.wa_id, 'body', m.body);
end $$;

-- ─────────────────────────────────────────────────────────────
-- Pour la fonction « whatsapp » (clé service seulement)
-- ─────────────────────────────────────────────────────────────
-- Un message reçu. p : wa_id, name, provider_id, body, media_type, at, referral, wants_reply
-- (faux pour une réaction), draftable (texte que l'on peut lire). Rejouer le même provider_id ne
-- crée rien (les fournisseurs renvoient un webhook tant qu'ils n'ont pas reçu de réponse 200).
create function public.wa_inbound(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  w text := regexp_replace(coalesce(p ->> 'wa_id', ''), '\D', '', 'g');
  v_name text := left(nullif(btrim(p ->> 'name'), ''), 120);
  v_pid text := left(nullif(btrim(p ->> 'provider_id'), ''), 200);
  v_body text := left(coalesce(nullif(btrim(p ->> 'body'), ''), '[mensaje]'), 4096);
  v_media text := coalesce(nullif(p ->> 'media_type', ''), 'text');
  v_at timestamptz := least(coalesce(nullif(p ->> 'at', '')::timestamptz, now()), now());
  v_ref jsonb := case when jsonb_typeof(p -> 'referral') = 'object' then p -> 'referral' end;
  v_wants boolean := coalesce((p ->> 'wants_reply')::boolean, true);
  v_draftable boolean := coalesce((p ->> 'draftable')::boolean, v_media = 'text');
  t wa_threads; m wa_messages; prev_in timestamptz; new_thread boolean := false;
  pid uuid; f record; c text; s text; preview text; linked boolean := false;
begin
  if w !~ '^\d{6,20}$' then raise exception 'invalid wa_id'; end if;
  if v_media !~ '^[a-z_]{1,20}$' then v_media := 'unsupported'; end if;
  -- Déjà reçu : on dit seulement s'il manque encore son brouillon (premier essai interrompu).
  if v_pid is not null then
    select * into m from wa_messages where provider_id = v_pid;
    if found then
      return jsonb_build_object('duplicate', true, 'thread_id', m.thread_id, 'message_id', m.id,
        'draft_wanted', m.kind = 'inbound' and v_draftable and v_wants and m.created_at > now() - interval '15 minutes'
          and not exists (select 1 from wa_messages d where d.reply_to = m.id and d.drafted_by_ai)
          and not exists (select 1 from wa_messages n where n.thread_id = m.thread_id and n.kind = 'inbound' and n.id > m.id)
          and public._wa_draft_quota(m.thread_id) > 0);
    end if;
  end if;

  insert into wa_threads (wa_id, profile_name) values (w, v_name) on conflict (wa_id) do nothing returning * into t;
  new_thread := found;
  if not new_thread then select * into t from wa_threads where wa_id = w for update; end if;
  prev_in := t.last_inbound_at;

  insert into wa_messages (thread_id, direction, kind, body, media_type, provider_id, referral, created_at)
  values (t.id, 'in', 'inbound', v_body, v_media, v_pid, v_ref, v_at)
  on conflict (provider_id) where provider_id is not null do nothing returning * into m;
  if not found then
    select * into m from wa_messages where provider_id = v_pid;
    return jsonb_build_object('duplicate', true, 'thread_id', m.thread_id, 'message_id', m.id, 'draft_wanted', false);
  end if;

  update wa_threads set
    profile_name = coalesce(v_name, profile_name),
    referral = coalesce(referral, v_ref),
    last_message_at = greatest(last_message_at, v_at),
    last_inbound_at = greatest(last_inbound_at, v_at),
    unread = unread + case when v_wants then 1 else 0 end,
    needs_reply = needs_reply or v_wants,
    needs_reply_since = case when v_wants then coalesce(case when needs_reply then needs_reply_since end, v_at) else needs_reply_since end,
    handled_at = case when v_wants then null else handled_at end,
    handled_by = case when v_wants then null else handled_by end
  where id = t.id returning * into t;

  -- La fiche du CRM : déjà reliée, sinon le même WhatsApp (numéro complet, ou enregistré sans
  -- l'indicatif), sinon une nouvelle fiche.
  preview := left(regexp_replace(v_body, '\s+', ' ', 'g'), 140);
  c := case when v_ref is not null then left(coalesce(nullif(btrim(v_ref ->> 'headline'), ''),
    'Anuncio ' || nullif(btrim(v_ref ->> 'source_id'), ''), 'Anuncio de clic a WhatsApp'), 120) end;
  s := left('whatsapp' || coalesce(' · ' || nullif(btrim(v_ref ->> 'source_url'), ''), ''), 120);
  if t.prospect_id is not null and exists (select 1 from prospects where id = t.prospect_id) then
    pid := t.prospect_id;
  else
    select id into pid from prospects where whatsapp_key = w order by archived_at nulls first, created_at desc limit 1;
    if pid is null then
      select id into pid from prospects where length(whatsapp_key) >= 8 and w like '%' || whatsapp_key
      order by archived_at nulls first, created_at desc limit 1;
    end if;
    if pid is null then
      select * into f from public._crm_upsert('whatsapp', null, '+' || w, v_name, c, s, 'es', v_at);
      pid := f.p_id;
      perform public._crm_event(pid, 'auto', format('Escribió por WhatsApp: «%s».', preview), 'whatsapp', null, v_at);
      perform public._crm_default_next(pid, 'Responder por WhatsApp');
    else
      linked := true;
    end if;
    update wa_threads set prospect_id = pid where id = t.id returning * into t;
  end if;
  if linked then
    update prospects set full_name = coalesce(nullif(full_name, ''), v_name), whatsapp = coalesce(nullif(whatsapp, ''), '+' || w),
      archived_at = null where id = pid;
    perform public._crm_event(pid, 'auto', format('Escribió por WhatsApp: «%s».', preview), 'whatsapp', null, v_at);
    perform public._crm_default_next(pid, 'Responder por WhatsApp');
  elsif not new_thread and prev_in is not null and v_at - prev_in > interval '3 days' and v_wants then
    perform public._crm_event(pid, 'auto', format('Volvió a escribir por WhatsApp: «%s».', preview), 'whatsapp', null, v_at);
    perform public._crm_default_next(pid, 'Responder por WhatsApp');
  end if;
  -- Une publicité « clic vers WhatsApp » pour une fiche qui existait déjà : on garde la campagne.
  if v_ref is not null and (linked or not new_thread) and not exists (select 1 from wa_messages x where x.thread_id = t.id and x.referral is not null and x.id <> m.id) then
    update prospects set campaign = coalesce(campaign, c), source = coalesce(source, s) where id = pid;
    perform public._crm_event(pid, 'auto', format('Llegó por un anuncio de WhatsApp «%s»%s.', c,
      coalesce(' (' || nullif(btrim(v_ref ->> 'source_url'), '') || ')', '')), 'campaign', null, v_at);
  end if;
  update prospects set updated_at = greatest(updated_at, v_at) where id = pid;

  return jsonb_build_object('duplicate', false, 'thread_id', t.id, 'message_id', m.id, 'new_thread', new_thread, 'prospect_id', pid,
    'draft_wanted', v_draftable and v_wants and public._wa_draft_quota(t.id) > 0);
end $$;

-- Un message envoyé depuis l'application WhatsApp Business du téléphone (coexistence) : gardé
-- dans l'historique ; la conversation n'attend plus de réponse.
create function public.wa_outbound_echo(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  w text := regexp_replace(coalesce(p ->> 'wa_id', ''), '\D', '', 'g');
  v_pid text := left(nullif(btrim(p ->> 'provider_id'), ''), 200);
  v_at timestamptz := least(coalesce(nullif(p ->> 'at', '')::timestamptz, now()), now());
  t wa_threads; m wa_messages;
begin
  if w !~ '^\d{6,20}$' then raise exception 'invalid wa_id'; end if;
  select * into t from wa_threads where wa_id = w for update;
  if not found then return jsonb_build_object('ignored', true); end if;
  insert into wa_messages (thread_id, direction, kind, body, media_type, provider_id, status, status_at, from_app, created_at, sent_at)
  values (t.id, 'out', 'sent', left(coalesce(nullif(btrim(p ->> 'body'), ''), '[mensaje]'), 4096),
    case when coalesce(p ->> 'media_type', 'text') ~ '^[a-z_]{1,20}$' then coalesce(p ->> 'media_type', 'text') else 'unsupported' end,
    v_pid, 'sent', v_at, true, v_at, v_at)
  on conflict (provider_id) where provider_id is not null do nothing returning * into m;
  if not found then return jsonb_build_object('duplicate', true); end if;
  update wa_messages set kind = 'discarded' where thread_id = t.id and kind = 'draft' and drafted_by_ai and not edited;
  update wa_threads set last_message_at = greatest(last_message_at, v_at), last_outbound_at = greatest(last_outbound_at, v_at),
    needs_reply = false, needs_reply_since = null, handled_at = v_at, handled_by = null
  where id = t.id;
  return jsonb_build_object('duplicate', false, 'message_id', m.id);
end $$;

-- Ce que la fonction lit pour préparer le brouillon : les 20 derniers messages échangés et
-- quelques données de la fiche (jamais l'e-mail ; le numéro ne sert qu'à l'e-mail à l'équipe).
create function public.wa_context(p_thread uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('thread_id', t.id, 'name', t.profile_name, 'phone', '+' || t.wa_id, 'referral', t.referral,
    'last_inbound_at', t.last_inbound_at,
    'history', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'direction', h.direction, 'body', h.body, 'media_type', h.media_type, 'at', h.created_at) order by h.id)
      from (select * from wa_messages where thread_id = t.id and kind in ('inbound', 'sent') and coalesce(status, '') <> 'failed' order by id desc limit 20) h), '[]'::jsonb),
    'prospect', (select jsonb_build_object('name', p.full_name, 'country', p.country, 'goal', p.goal, 'exam', p.exam, 'exam_date', p.exam_date,
        'level', p.level, 'level_score', p.level_score, 'plan', p.plan, 'hours', p.hours, 'billing', p.billing, 'crs_score', p.crs_score,
        'stage', public._crm_stage_name(p.stage), 'origin', p.origin, 'campaign', p.campaign,
        'in_campus', p.student_id is not null,
        'last_test', (select jsonb_build_object('level', r.level, 'overall', r.overall, 'at', r.created_at) from placement_results r
          where p.email is not null and r.email = p.email order by r.created_at desc limit 1))
      from prospects p where p.id = t.prospect_id))
  from wa_threads t where t.id = p_thread
$$;

-- Enregistrer le brouillon préparé pour un message reçu. Il remplace les brouillons automatiques
-- encore en attente et pas modifiés de la conversation. Rien si un message plus récent a déjà le
-- sien, ou si la limite de 10 par heure est atteinte (exception draft_cap).
create function public.wa_save_draft(p_inbound bigint, p_body text, p_note text default null, p_flagged boolean default false) returns bigint
language plpgsql security definer set search_path = public as $$
declare m wa_messages; d wa_messages; b text := left(btrim(coalesce(p_body, '')), 4096);
begin
  select * into m from wa_messages where id = p_inbound and kind = 'inbound';
  if not found then raise exception 'not found'; end if;
  perform 1 from wa_threads where id = m.thread_id for update;
  if length(b) = 0 then raise exception 'empty_message'; end if;
  if public._wa_draft_quota(m.thread_id) <= 0 then raise exception 'draft_cap'; end if;
  if exists (select 1 from wa_messages x where x.thread_id = m.thread_id and x.drafted_by_ai and x.reply_to > m.id) then return null; end if;
  update wa_messages set kind = 'discarded' where thread_id = m.thread_id and kind = 'draft' and drafted_by_ai and not edited;
  insert into wa_messages (thread_id, direction, kind, body, drafted_by_ai, note, flagged, reply_to)
  values (m.thread_id, 'out', 'draft', b, true, left(nullif(btrim(p_note), ''), 300), coalesce(p_flagged, false), m.id)
  on conflict (reply_to) where drafted_by_ai and reply_to is not null do nothing returning * into d;
  return d.id;
end $$;

-- Résultat de l'envoi par le fournisseur.
create function public.wa_mark_sent(p_message bigint, p_provider_id text) returns void
language plpgsql security definer set search_path = public as $$
declare m wa_messages; who text; moved boolean;
begin
  update wa_messages set status = 'sent', status_at = now(), sent_at = now(), error = null,
    provider_id = coalesce(left(nullif(btrim(p_provider_id), ''), 200), provider_id)
  where id = p_message and kind = 'sent' and status = 'pending' returning * into m;
  if not found then return; end if;
  -- Les brouillons automatiques encore en attente n'ont plus lieu d'être.
  update wa_messages set kind = 'discarded' where thread_id = m.thread_id and kind = 'draft' and drafted_by_ai and not edited;
  update wa_threads set last_outbound_at = now(), last_message_at = now(), needs_reply = false, needs_reply_since = null,
    handled_at = now(), handled_by = m.author_id
  where id = m.thread_id;
  -- Première réponse à une fiche « Nuevo » : elle passe à « Contactado ».
  declare pid uuid := (select prospect_id from wa_threads where id = m.thread_id);
  begin
    if pid is not null then
      moved := public._crm_advance(pid, 'contactado', now());
      if moved then
        select full_name into who from profiles where id = m.author_id;
        perform public._crm_event(pid, 'auto', format('Respondido por WhatsApp%s. Pasa a «Contactado».', coalesce(' por ' || who, '')), 'whatsapp', m.author_id, null);
      end if;
      update prospects set next_action = null, next_due = null, updated_at = now() where id = pid and next_action = 'Responder por WhatsApp';
    end if;
  end;
end $$;

create function public.wa_mark_failed(p_message bigint, p_error text) returns void
language sql security definer set search_path = public as $$
  update wa_messages set status = 'failed', status_at = now(), error = left(coalesce(nullif(btrim(p_error), ''), 'Error desconocido'), 300)
  where id = p_message and kind = 'sent' and status = 'pending'
$$;

-- Statut de livraison (webhook « statuses ») : sent → delivered → read ; failed, sauf après read.
create function public.wa_status(p_provider_id text, p_status text, p_at timestamptz default null, p_error text default null) returns boolean
language plpgsql security definer set search_path = public as $$
declare r int := case p_status when 'sent' then 1 when 'delivered' then 2 when 'read' then 3 when 'failed' then 4 end;
begin
  if r is null or nullif(btrim(coalesce(p_provider_id, '')), '') is null then return false; end if;
  update wa_messages set status = p_status, status_at = least(coalesce(p_at, now()), now()),
    error = case when p_status = 'failed' then left(coalesce(nullif(btrim(p_error), ''), 'Error de entrega'), 300) else error end
  where provider_id = p_provider_id and direction = 'out'
    and (case status when 'pending' then 0 when 'sent' then 1 when 'delivered' then 2 when 'read' then 3 when 'failed' then 4 else 0 end) < r
    and not (p_status = 'failed' and status = 'read');
  return found;
end $$;

-- E-mail aux admins : au plus un toutes les 30 min par conversation qui attend une réponse.
create function public.wa_claim_email(p_thread uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  update wa_threads set emailed_at = now()
  where id = p_thread and needs_reply and (emailed_at is null or emailed_at < now() - interval '30 minutes') returning true into ok;
  return coalesce(ok, false);
end $$;
create function public.wa_release_email(p_thread uuid) returns void
language sql security definer set search_path = public as $$ update wa_threads set emailed_at = null where id = p_thread $$;
create function public.wa_staff_recipients() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('email', u.email, 'name', p.full_name) order by p.full_name), '[]'::jsonb)
  from profiles p join auth.users u on u.id = p.id where p.role = 'admin' and u.email is not null
$$;

-- ─────────────────────────────────────────────────────────────
-- Droits
-- ─────────────────────────────────────────────────────────────
revoke execute on function public._wa_window_open(public.wa_threads), public._wa_draft_quota(uuid), public._wa_msg_json(public.wa_messages),
  public._wa_thread_json(public.wa_threads), public.wa_inbound(jsonb), public.wa_outbound_echo(jsonb), public.wa_context(uuid),
  public.wa_save_draft(bigint, text, text, boolean), public.wa_mark_sent(bigint, text), public.wa_mark_failed(bigint, text),
  public.wa_status(text, text, timestamptz, text), public.wa_claim_email(uuid), public.wa_release_email(uuid), public.wa_staff_recipients()
  from public, anon, authenticated;
grant execute on function public.wa_inbound(jsonb), public.wa_outbound_echo(jsonb), public.wa_context(uuid),
  public.wa_save_draft(bigint, text, text, boolean), public.wa_mark_sent(bigint, text), public.wa_mark_failed(bigint, text),
  public.wa_status(text, text, timestamptz, text), public.wa_claim_email(uuid), public.wa_release_email(uuid), public.wa_staff_recipients()
  to service_role;

revoke execute on function public.wa_threads_list(), public.wa_thread(uuid), public.wa_edit_draft(bigint, text), public.wa_discard_draft(bigint),
  public.wa_set_done(uuid, boolean), public.wa_prepare_send(uuid, bigint, text) from public, anon;
grant execute on function public.wa_threads_list(), public.wa_thread(uuid), public.wa_edit_draft(bigint, text), public.wa_discard_draft(bigint),
  public.wa_set_done(uuid, boolean), public.wa_prepare_send(uuid, bigint, text) to authenticated;

commit;

-- Le Campus voit les nouvelles fonctions tout de suite.
notify pgrst, 'reload schema';
