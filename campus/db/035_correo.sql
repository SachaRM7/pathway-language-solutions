-- Campus Pathway · 035 · « Correo » : la boîte de réception de l'équipe dans le Campus
-- À exécuter après 034, puis déployer la fonction « mail » (Verify JWT désactivé : pg_cron l'appelle
-- avec le secret partagé ; le Campus l'appelle avec la session d'un admin, vérifiée par la fonction).
--
-- • Toutes les 2 minutes, la fonction lit la boîte Zoho (IMAP, mot de passe d'application
--   ZOHO_SMTP_PASSWORD) et importe les e-mails de vraies personnes reçus sur contact@, contacto@,
--   ryan@ ou abdrahim@. Newsletters, notifications, rebonds, réponses automatiques et nos propres
--   adresses restent dans Zoho.
-- • Chaque e-mail est rangé dans une conversation (même fil que chez la personne), relié à sa
--   fiche de Prospectos ou de Difusión si l'adresse correspond, et reçoit un BROUILLON de réponse
--   préparé par l'IA. Rien ne part sans un admin : « Enviar » (avec l'adresse d'envoi choisie),
--   « Editar » ou « Descartar ». La réponse part par Zoho (SMTP) et est rangée dans ses « Envoyés ».
-- • Les e-mails restent dans Zoho : le Campus en garde une copie de travail (texte seulement).

begin;

create table public.mail_threads (
  id uuid primary key default gen_random_uuid(),
  contact_email text not null check (contact_email = lower(contact_email) and length(contact_email) between 3 and 254),
  contact_name text check (length(contact_name) <= 200),
  subject text check (length(subject) <= 300),
  subject_key text check (length(subject_key) <= 200),
  mailbox text check (length(mailbox) <= 254),
  prospect_id uuid references public.prospects (id) on delete set null,
  outreach_contact_id uuid references public.outreach_contacts (id) on delete set null,
  last_message_at timestamptz,
  last_inbound_at timestamptz,
  needs_reply boolean not null default false,
  needs_reply_since timestamptz,
  unread int not null default 0,
  handled_at timestamptz,
  handled_by uuid references public.profiles (id) on delete set null,
  sending_at timestamptz,
  created_at timestamptz not null default now()
);
create index mail_threads_recent on public.mail_threads (last_message_at desc);
create index mail_threads_contact on public.mail_threads (contact_email, subject_key);

create table public.mail_messages (
  id bigint generated always as identity primary key,
  thread_id uuid not null references public.mail_threads (id) on delete cascade,
  direction text not null check (direction in ('in', 'out')),
  kind text not null default 'mail' check (kind in ('mail', 'draft', 'discarded')),
  from_email text check (length(from_email) <= 254),
  from_name text check (length(from_name) <= 200),
  to_email text check (length(to_email) <= 254),
  subject text check (length(subject) <= 300),
  body text not null check (length(body) <= 30000),
  message_id text check (length(message_id) <= 500),
  in_reply_to text check (length(in_reply_to) <= 500),
  refs text check (length(refs) <= 4000),
  imap_uid bigint,
  drafted_by_ai boolean not null default false,
  note text check (length(note) <= 300),
  flagged boolean not null default false,
  edited boolean not null default false,
  author_id uuid references public.profiles (id) on delete set null,
  status text check (status in ('received', 'sent', 'failed')),
  error text check (length(error) <= 300),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create unique index mail_messages_msgid on public.mail_messages (message_id) where message_id is not null;
create index mail_messages_thread on public.mail_messages (thread_id, created_at);

create table public.mail_sync (
  mailbox text primary key,
  uidvalidity bigint,
  last_uid bigint not null default 0,
  last_run_at timestamptz,
  last_ok_at timestamptz,
  last_error text check (length(last_error) <= 300)
);

alter table public.mail_threads enable row level security;
alter table public.mail_messages enable row level security;
alter table public.mail_sync enable row level security;
revoke all on public.mail_threads, public.mail_messages, public.mail_sync from anon, authenticated;

create function public._mail_senders() returns text[]
language sql immutable as $$ select array['ryan@pathway-languages.com', 'abdrahim@pathway-languages.com', 'contacto@pathway-languages.com', 'contact@pathway-languages.com'] $$;

create function public._mail_thread_json(t public.mail_threads) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', t.id, 'email', t.contact_email, 'name', t.contact_name, 'subject', t.subject, 'mailbox', t.mailbox,
    'needs_reply', t.needs_reply, 'needs_reply_since', t.needs_reply_since, 'unread', t.unread,
    'last_message_at', t.last_message_at, 'last_inbound_at', t.last_inbound_at, 'handled_at', t.handled_at,
    'handled_by', (select full_name from profiles where id = t.handled_by),
    'prospect', (select jsonb_build_object('id', p.id, 'name', p.full_name, 'stage', p.stage, 'level', p.level) from prospects p where p.id = t.prospect_id),
    'outreach', (select jsonb_build_object('id', c.id, 'name', c.name, 'status', c.status) from outreach_contacts c where c.id = t.outreach_contact_id),
    'drafts', (select count(*) from mail_messages m where m.thread_id = t.id and m.kind = 'draft'),
    'flagged', exists (select 1 from mail_messages m where m.thread_id = t.id and m.kind = 'draft' and m.flagged),
    'last', (select jsonb_build_object('direction', m.direction, 'kind', m.kind, 'body', left(m.body, 160), 'at', m.created_at)
      from mail_messages m where m.thread_id = t.id and m.kind <> 'discarded' order by m.created_at desc, m.id desc limit 1))
$$;

-- ─────────────────────────────────────────────────────────────
-- Synchronisation (fonction « mail », clé service)
-- ─────────────────────────────────────────────────────────────
create function public.mail_sync_state(p_box text) returns jsonb
language sql stable security definer set search_path = public as $$
  select to_jsonb(s) from mail_sync s where s.mailbox = p_box
$$;
create function public.mail_sync_save(p_box text, p_uidvalidity bigint, p_last_uid bigint, p_error text) returns void
language sql security definer set search_path = public as $$
  insert into mail_sync (mailbox, uidvalidity, last_uid, last_run_at, last_ok_at, last_error)
  values (p_box, p_uidvalidity, coalesce(p_last_uid, 0), now(), case when p_error is null then now() end, left(p_error, 300))
  on conflict (mailbox) do update set uidvalidity = coalesce(excluded.uidvalidity, mail_sync.uidvalidity),
    last_uid = greatest(coalesce(excluded.last_uid, 0), case when excluded.uidvalidity is distinct from mail_sync.uidvalidity then 0 else mail_sync.last_uid end),
    last_run_at = now(), last_ok_at = case when p_error is null then now() else mail_sync.last_ok_at end, last_error = left(p_error, 300)
$$;

-- Un e-mail reçu : rangé dans sa conversation, relié aux fiches. Renvoie de quoi préparer le brouillon.
create function public.mail_ingest(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_from text := lower(trim(p ->> 'from_email'));
  v_msgid text := nullif(trim(p ->> 'message_id'), '');
  v_key text := left(coalesce(p ->> 'subject_key', ''), 200);
  v_at timestamptz := coalesce((p ->> 'at')::timestamptz, now());
  v_draft boolean := coalesce((p ->> 'draft')::boolean, true);
  t mail_threads; m mail_messages; pr prospects; oc outreach_contacts;
begin
  if v_from is null or v_from !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid from'; end if;
  if v_msgid is not null and exists (select 1 from mail_messages where message_id = v_msgid) then
    return jsonb_build_object('duplicate', true);
  end if;
  -- Même fil : la réponse cite un de nos messages, sinon même personne et même sujet (60 jours).
  select th.* into t from mail_messages x join mail_threads th on th.id = x.thread_id
  where x.message_id is not null and x.message_id = any (array(select jsonb_array_elements_text(coalesce(p -> 'refs_list', '[]'::jsonb))))
  order by x.created_at desc limit 1;
  if not found then
    select * into t from mail_threads where contact_email = v_from and subject_key = v_key and last_message_at > now() - interval '60 days'
    order by last_message_at desc limit 1;
  end if;
  select * into pr from prospects where lower(email) = v_from and archived_at is null order by updated_at desc limit 1;
  select * into oc from outreach_contacts where public._outreach_email(contact) = v_from and archived_at is null order by updated_at desc limit 1;
  if t.id is null then
    insert into mail_threads (contact_email, contact_name, subject, subject_key, mailbox, prospect_id, outreach_contact_id, created_at)
    values (v_from, left(nullif(trim(p ->> 'from_name'), ''), 200), left(p ->> 'subject', 300), v_key, lower(p ->> 'to_email'), pr.id, oc.id, v_at)
    returning * into t;
  end if;
  insert into mail_messages (thread_id, direction, kind, from_email, from_name, to_email, subject, body, message_id, in_reply_to, refs, imap_uid, status, created_at)
  values (t.id, 'in', 'mail', v_from, left(nullif(trim(p ->> 'from_name'), ''), 200), left(lower(p ->> 'to_email'), 254), left(p ->> 'subject', 300),
    left(coalesce(nullif(p ->> 'body', ''), '(correo sin texto)'), 30000), v_msgid, left(p ->> 'in_reply_to', 500), left(p ->> 'refs', 4000),
    (p ->> 'uid')::bigint, 'received', v_at)
  returning * into m;
  update mail_threads set last_message_at = greatest(coalesce(last_message_at, v_at), v_at), last_inbound_at = greatest(coalesce(last_inbound_at, v_at), v_at),
    needs_reply = true, needs_reply_since = coalesce(case when needs_reply then needs_reply_since end, v_at), unread = unread + 1,
    handled_at = null, handled_by = null, contact_name = coalesce(contact_name, left(nullif(trim(p ->> 'from_name'), ''), 200)),
    mailbox = coalesce(case when lower(p ->> 'to_email') = any (public._mail_senders()) then lower(p ->> 'to_email') end, mailbox),
    prospect_id = coalesce(prospect_id, pr.id), outreach_contact_id = coalesce(outreach_contact_id, oc.id)
  where id = t.id returning * into t;
  if t.prospect_id is not null then
    insert into prospect_events (prospect_id, kind, topic, body) values (t.prospect_id, 'auto', 'mail', 'Escribió un correo: «' || left(coalesce(p ->> 'subject', 'sin asunto'), 120) || '».');
    update prospects set updated_at = now() where id = t.prospect_id;
  end if;
  if t.outreach_contact_id is not null then
    insert into outreach_events (contact_id, kind, topic, body) values (t.outreach_contact_id, 'auto', 'mail', 'Respondió por correo: «' || left(coalesce(p ->> 'subject', 'sin asunto'), 120) || '». Ver «Correo».');
    update outreach_contacts set updated_at = now(), status = case when status = 'contactado' then 'respondio' else status end,
      replied_at = coalesce(replied_at, now()) where id = t.outreach_contact_id;
  end if;
  return jsonb_build_object('thread_id', t.id, 'message_id', m.id, 'draft', v_draft) || public._mail_context(t.id);
end $$;

-- Ce qu'il faut à l'IA pour un brouillon : le fil, la fiche, la difusión.
create function public._mail_context(p_thread uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('contact_email', t.contact_email, 'contact_name', t.contact_name, 'subject', t.subject, 'mailbox', t.mailbox,
    'history', coalesce((select jsonb_agg(jsonb_build_object('direction', x.direction, 'body', left(x.body, 2000), 'at', x.created_at) order by x.created_at)
      from (select * from mail_messages where thread_id = t.id and kind = 'mail' order by created_at desc limit 7) x), '[]'::jsonb),
    'prospect', (select jsonb_build_object('nombre', p.full_name, 'etapa', p.stage, 'nivel_test', p.level, 'puntaje_test', p.level_score, 'pais', p.country,
        'objetivo', p.goal, 'examen', p.exam, 'ritmo', p.plan, 'horas', p.hours, 'origen', p.origin, 'puntaje_crs', p.crs_score) from prospects p where p.id = t.prospect_id),
    'outreach', (select jsonb_build_object('sitio', c.name, 'url', c.url, 'estado', c.status, 'angulo', c.angle) from outreach_contacts c where c.id = t.outreach_contact_id))
  from mail_threads t where t.id = p_thread
$$;

-- Brouillon de l'IA (remplace le brouillon IA pas encore touché de la même conversation).
create function public.mail_draft_insert(p_thread uuid, p_subject text, p_body text, p_from text, p_note text, p_flagged boolean) returns bigint
language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  delete from mail_messages where thread_id = p_thread and kind = 'draft' and drafted_by_ai and not edited;
  insert into mail_messages (thread_id, direction, kind, from_email, subject, body, drafted_by_ai, note, flagged)
  values (p_thread, 'out', 'draft', case when p_from = any (public._mail_senders()) then p_from end, left(p_subject, 300), left(p_body, 30000), true, left(p_note, 300), coalesce(p_flagged, false))
  returning id into v;
  return v;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Campus (admins)
-- ─────────────────────────────────────────────────────────────
create function public.mail_threads_list() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return coalesce((select jsonb_agg(public._mail_thread_json(t) order by t.needs_reply desc, t.last_message_at desc nulls last)
    from (select * from mail_threads order by last_message_at desc nulls last limit 200) t), '[]'::jsonb);
end $$;

create function public.mail_thread(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t mail_threads;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  update mail_threads set unread = 0 where id = p_id returning * into t;
  if not found then return null; end if;
  return public._mail_thread_json(t) || jsonb_build_object('senders', to_jsonb(public._mail_senders()),
    'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'direction', m.direction, 'kind', m.kind, 'from_email', m.from_email, 'from_name', m.from_name,
      'to_email', m.to_email, 'subject', m.subject, 'body', m.body, 'drafted_by_ai', m.drafted_by_ai, 'note', m.note, 'flagged', m.flagged, 'edited', m.edited,
      'status', m.status, 'error', m.error, 'author', (select full_name from profiles where id = m.author_id), 'created_at', m.created_at, 'sent_at', m.sent_at)
      order by m.created_at, m.id) from mail_messages m where m.thread_id = t.id and m.kind <> 'discarded'), '[]'::jsonb));
end $$;

create function public.mail_draft_save(p_id bigint, p_subject text, p_body text, p_from text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if length(trim(coalesce(p_body, ''))) = 0 or length(p_body) > 30000 or length(p_subject) > 300 then raise exception 'invalid text'; end if;
  if p_from is not null and not (p_from = any (public._mail_senders())) then raise exception 'invalid sender'; end if;
  update mail_messages set subject = left(trim(p_subject), 300), body = p_body, from_email = coalesce(p_from, from_email), edited = true, author_id = auth.uid()
  where id = p_id and kind = 'draft';
  if not found then raise exception 'not found'; end if;
end $$;

-- Un brouillon écrit par l'équipe (pas d'IA, ou après « Descartar »).
create function public.mail_draft_new(p_thread uuid, p_subject text, p_body text, p_from text) returns bigint
language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if not exists (select 1 from mail_threads where id = p_thread) then raise exception 'not found'; end if;
  if length(trim(coalesce(p_body, ''))) = 0 or length(p_body) > 30000 then raise exception 'invalid text'; end if;
  if p_from is not null and not (p_from = any (public._mail_senders())) then raise exception 'invalid sender'; end if;
  insert into mail_messages (thread_id, direction, kind, from_email, subject, body, author_id, edited)
  values (p_thread, 'out', 'draft', p_from, left(trim(p_subject), 300), p_body, auth.uid(), true) returning id into v;
  return v;
end $$;

create function public.mail_draft_discard(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  update mail_messages set kind = 'discarded', author_id = coalesce(author_id, auth.uid()) where id = p_id and kind = 'draft';
end $$;

-- « Ya está » : la conversation n'attend plus de réponse (répondue ailleurs, rien à dire…).
create function public.mail_thread_done(p_id uuid, p_done boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  update mail_threads set needs_reply = not p_done, needs_reply_since = case when p_done then null else coalesce(needs_reply_since, now()) end,
    handled_at = case when p_done then now() end, handled_by = case when p_done then auth.uid() end where id = p_id;
end $$;

-- Envoi (appelé par la fonction « mail » avec la session de l'admin).
create function public.mail_send_prepare(p_id bigint, p_from text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare m mail_messages; t mail_threads; v_from text := lower(trim(coalesce(p_from, '')));
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if not (v_from = any (public._mail_senders())) then raise exception 'invalid sender'; end if;
  select * into m from mail_messages where id = p_id and kind = 'draft';
  if not found then raise exception 'not found'; end if;
  if length(trim(m.body)) = 0 then raise exception 'invalid text'; end if;
  if (select count(*) from mail_messages where direction = 'out' and kind = 'mail' and sent_at > now() - interval '24 hours') >= 150 then raise exception 'daily limit'; end if;
  update mail_threads set sending_at = now() where id = m.thread_id and (sending_at is null or sending_at < now() - interval '2 minutes') returning * into t;
  if not found then raise exception 'already sending'; end if;
  return jsonb_build_object('thread_id', t.id, 'to', t.contact_email, 'name', t.contact_name, 'subject', coalesce(nullif(trim(m.subject), ''), t.subject), 'body', m.body, 'from', v_from,
    'in_reply_to', (select x.message_id from mail_messages x where x.thread_id = t.id and x.kind = 'mail' and x.message_id is not null order by x.created_at desc, x.id desc limit 1),
    'references', (select string_agg(x.message_id, ' ' order by x.created_at) from (select * from mail_messages where thread_id = t.id and kind = 'mail' and message_id is not null order by created_at desc limit 10) x));
end $$;

create function public.mail_send_done(p_id bigint, p_from text, p_message_id text, p_subject text) returns void
language plpgsql security definer set search_path = public as $$
declare m mail_messages; t mail_threads;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  update mail_messages set kind = 'mail', status = 'sent', sent_at = now(), created_at = now(), from_email = p_from, message_id = left(p_message_id, 500),
    subject = left(p_subject, 300), author_id = auth.uid(), error = null
  where id = p_id and kind = 'draft' returning * into m;
  if not found then raise exception 'not found'; end if;
  delete from mail_messages where thread_id = m.thread_id and kind = 'draft' and drafted_by_ai and not edited;
  update mail_threads set sending_at = null, needs_reply = false, needs_reply_since = null, handled_at = now(), handled_by = auth.uid(), last_message_at = now()
  where id = m.thread_id returning * into t;
  if t.prospect_id is not null then
    insert into prospect_events (prospect_id, kind, topic, body, author_id) values (t.prospect_id, 'auto', 'mail', 'Respuesta enviada por correo desde ' || p_from || '.', auth.uid());
    update prospects set updated_at = now(), stage = case when stage = 'nuevo' then 'contactado' else stage end where id = t.prospect_id;
  end if;
  if t.outreach_contact_id is not null then
    insert into outreach_events (contact_id, kind, topic, body, author_id) values (t.outreach_contact_id, 'auto', 'mail', 'Respuesta enviada por correo desde ' || p_from || '.', auth.uid());
  end if;
end $$;

create function public.mail_send_failed(p_id bigint, p_error text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  update mail_messages set error = left(p_error, 300) where id = p_id;
  update mail_threads set sending_at = null where id = (select thread_id from mail_messages where id = p_id);
end $$;

-- « Hecho » : les réponses envoyées apparaissent aussi.
create or replace function public.admin_activity(p_days int default 7) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare since timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_days, 7), 30)));
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return coalesce((select jsonb_agg(x order by (x ->> 'at') desc) from (
    select jsonb_build_object('at', a.at, 'who', (select full_name from profiles where id = a.who), 'area', a.area, 'text', a.txt, 'href', a.href) x
    from (
      select r.handled_at at, r.handled_by who, 'inscripciones' area, 'Atendió la solicitud de inscripción de ' || r.full_name txt, '#cuentas' href
        from enrollment_requests r where r.handled_at > since
      union all
      select c.decided_at, c.decided_by, 'clases', (case when c.status = 'approved' then 'Aprobó' else 'Rechazó' end) || ' el cambio de clase de ' || g.name
          || case when c.new_at is null then ' (cancelación)' else '' end, '#horarios'
        from schedule_changes c join class_groups g on g.id = c.group_id where c.decided_at > since and c.status in ('approved', 'rejected')
      union all
      select i.created_at, i.created_by, 'inscripciones', 'Invitó a ' || i.full_name || ' al Campus', '#cuentas'
        from invitations i where i.created_at > since
      union all
      select i.accepted_at, null, 'inscripciones', i.full_name || ' aceptó la invitación y entró al Campus', '#cuentas'
        from invitations i where i.accepted_at > since
      union all
      select e.created_at, e.author_id, 'captacion', coalesce(p.full_name, p.email, 'Prospecto') || ': ' || left(e.body, 140), '#prospectos'
        from prospect_events e join prospects p on p.id = e.prospect_id
        where e.created_at > since and e.author_id is not null and e.kind in ('auto', 'note') and coalesce(e.topic, '') <> 'mail'
      union all
      select e.created_at, e.author_id, 'captacion', c.name || ': ' || left(e.body, 140), '#difusion'
        from outreach_events e join outreach_contacts c on c.id = e.contact_id
        where e.created_at > since and e.author_id is not null and e.kind in ('auto', 'note') and coalesce(e.topic, '') <> 'mail'
      union all
      select m.sent_at, m.author_id, 'captacion', 'Respondió por WhatsApp a ' || coalesce(t.profile_name, 'un prospecto'), '#whatsapp'
        from wa_messages m join wa_threads t on t.id = m.thread_id
        where m.direction = 'out' and m.author_id is not null and m.sent_at > since
      union all
      select m.sent_at, m.author_id, 'captacion', 'Respondió por correo a ' || coalesce(t.contact_name, t.contact_email) || ' (desde ' || split_part(m.from_email, '@', 1) || '@)', '#correo'
        from mail_messages m join mail_threads t on t.id = m.thread_id
        where m.direction = 'out' and m.kind = 'mail' and m.sent_at > since
    ) a where a.at is not null
    order by a.at desc limit 60) s), '[]'::jsonb);
end $$;

revoke execute on function public._mail_senders(), public._mail_thread_json(public.mail_threads), public.mail_sync_state(text),
  public.mail_sync_save(text, bigint, bigint, text), public.mail_ingest(jsonb), public._mail_context(uuid),
  public.mail_draft_insert(uuid, text, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.mail_sync_state(text), public.mail_sync_save(text, bigint, bigint, text), public.mail_ingest(jsonb),
  public._mail_context(uuid), public.mail_draft_insert(uuid, text, text, text, text, boolean) to service_role;
revoke execute on function public.mail_threads_list(), public.mail_thread(uuid), public.mail_draft_save(bigint, text, text, text),
  public.mail_draft_new(uuid, text, text, text), public.mail_draft_discard(bigint), public.mail_thread_done(uuid, boolean),
  public.mail_send_prepare(bigint, text), public.mail_send_done(bigint, text, text, text), public.mail_send_failed(bigint, text) from public, anon;
grant execute on function public.mail_threads_list(), public.mail_thread(uuid), public.mail_draft_save(bigint, text, text, text),
  public.mail_draft_new(uuid, text, text, text), public.mail_draft_discard(bigint), public.mail_thread_done(uuid, boolean),
  public.mail_send_prepare(bigint, text), public.mail_send_done(bigint, text, text, text), public.mail_send_failed(bigint, text) to authenticated;

-- Toutes les 2 minutes, avec le secret partagé (db/014_cron_secreto.sql).
select cron.unschedule('pathway-mail-sync') where exists (select 1 from cron.job where jobname = 'pathway-mail-sync');
select cron.schedule('pathway-mail-sync', '*/2 * * * *', $job$
  select net.http_post(
    url := 'https://ynflykxalfynxoupkxmy.supabase.co/functions/v1/mail',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'pathway_cron_secret')),
    body := '{"action":"sync"}'::jsonb,
    timeout_milliseconds := 120000);
$job$);

commit;

notify pgrst, 'reload schema';
