-- Campus Pathway · 025 · messages élève ↔ professeur et assistant qui répond en premier
-- À exécuter après 024 (SQL Editor → New query → Run), puis redéployer « class-reminders » avec son
-- dernier code (e-mails des messages) et déployer la fonction « campus-assistant » (facultatif).
--
-- • Une conversation par élève (message_threads), avec ses messages (messages). L'élève écrit
--   depuis « Mensajes » ; son professeur (profiles.teacher_id) et les admins répondent depuis
--   leur onglet « Mensajes ». Rien ne s'efface depuis le Campus.
-- • L'assistant (fonction « campus-assistant ») répond d'abord, avec les seules données de
--   l'élève. Il n'écrit que par assistant_reply(), réservée à la clé service : personne d'autre
--   ne peut écrire en son nom. S'il ne sait pas, ou si c'est une décision du professeur, il le
--   dit et la conversation passe « Necesita respuesta ».
-- • Réglage « Respuestas del asistente » (Ajustes, admin) : désactivé au départ. Désactivé, la
--   réponse de l'assistant est un brouillon que seule l'équipe voit, avec « Enviar » (modifiable) ;
--   l'élève ne voit rien avant l'envoi. Activé, elle part tout de suite. Les questions passées au
--   professeur se comportent de la même façon dans les deux cas.
-- • Côté élève, les réponses de l'assistant sont signées « Equipo Pathway » ; l'équipe les voit
--   marquées comme écrites par l'assistant.
-- • Tout message de l'élève met la conversation en « Necesita respuesta » tant que l'assistant
--   n'a pas répondu : sans l'assistant (non déployé, en panne), le professeur reçoit tout.
-- • Limites par élève : 10 messages par heure et 30 par jour ; 20 réponses de l'assistant par jour.
-- • E-mails (fonction « class-reminders », toutes les 5 min) : le professeur reçoit un e-mail
--   groupé quand des conversations l'attendent depuis 5 min ; l'élève, quand l'équipe lui a
--   répondu et qu'il ne l'a pas lu depuis 10 min. Un e-mail par attente, jamais un par message.

begin;

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────
create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  last_student_at timestamptz,
  last_staff_at timestamptz,
  -- « Necesita respuesta » : un message de l'élève sans réponse, ou une question passée au professeur.
  needs_staff boolean not null default false,
  needs_staff_since timestamptz,
  escalated_at timestamptz,
  escalated_reason text check (length(escalated_reason) <= 300),
  handled_at timestamptz,
  handled_by uuid references public.profiles (id) on delete set null,
  -- Lu jusqu'à : côté élève, côté équipe (professeur et admins).
  student_read_at timestamptz,
  staff_read_at timestamptz,
  -- Dernier e-mail envoyé de chaque côté (un par attente).
  staff_emailed_at timestamptz,
  student_emailed_at timestamptz
);
create index message_threads_needs_staff on public.message_threads (needs_staff_since) where needs_staff;

create table public.messages (
  id bigint generated always as identity primary key,
  thread_id uuid not null references public.message_threads (id) on delete cascade,
  author_kind text not null check (author_kind in ('student', 'staff', 'assistant')),
  author_id uuid references public.profiles (id) on delete set null,
  body text not null check (length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  -- Assistant : le message de l'élève auquel il répond, et s'il l'a passé au professeur.
  reply_to bigint references public.messages (id) on delete set null,
  escalated boolean not null default false,
  assistant_kind text check (assistant_kind in ('answer', 'handoff', 'fallback')),
  note text check (length(note) <= 300),
  -- Brouillon de l'assistant (réglage « Respuestas del asistente » désactivé) : pending tant que
  -- l'équipe ne l'a ni envoyé (sent) ni écarté (discarded). L'élève ne voit que les envoyés.
  draft_state text check (draft_state in ('pending', 'sent', 'discarded')),
  sent_by uuid references public.profiles (id) on delete set null,
  edited boolean not null default false,
  check (author_kind <> 'assistant' or (author_id is null and assistant_kind is not null)),
  check (draft_state is null or (author_kind = 'assistant' and assistant_kind = 'answer'))
);
create index messages_thread on public.messages (thread_id, id);
create index messages_author_recent on public.messages (author_id, created_at);
create unique index messages_one_assistant_reply on public.messages (reply_to) where author_kind = 'assistant';

alter table public.message_threads enable row level security;
alter table public.messages enable row level security;

-- ─────────────────────────────────────────────────────────────
-- Règles d'accès : l'élève, sa conversation ; le professeur, celles de ses élèves ; l'admin, toutes.
-- ─────────────────────────────────────────────────────────────
create function public._thread_student(p_thread uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select student_id from message_threads where id = p_thread
$$;

create function public.can_read_thread(p_thread uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from message_threads t where t.id = p_thread
    and ((t.student_id = auth.uid() and public.my_role() = 'student') or public.teaches(t.student_id)))
$$;

-- Qui écrit : « student » pour l'élève dans sa conversation, « staff » pour son professeur ou un
-- admin. Toute autre personne est refusée.
create function public._message_author_kind(p_thread uuid) returns text
language plpgsql stable security definer set search_path = public as $$
declare s uuid := public._thread_student(p_thread);
begin
  if auth.uid() is null or s is null then raise exception 'not_your_thread'; end if;
  if s = auth.uid() and public.my_role() = 'student' then return 'student'; end if;
  if public.is_staff() and public.teaches(s) then return 'staff'; end if;
  raise exception 'not_your_thread';
end $$;

create policy "message_threads: la sienne ou celles de ses élèves" on public.message_threads for select to authenticated
  using ((student_id = auth.uid() and public.my_role() = 'student') or public.teaches(student_id));
-- Un brouillon de l'assistant non envoyé n'est visible que par l'équipe.
create policy "messages: ceux de ses conversations" on public.messages for select to authenticated
  using (public.can_read_thread(thread_id) and (draft_state is null or draft_state = 'sent' or public.is_staff()));
create policy "messages: écrire en son nom" on public.messages for insert to authenticated
  with check (author_id = auth.uid() and author_kind in ('student', 'staff') and author_kind = public._message_author_kind(thread_id));

revoke all on public.message_threads, public.messages from anon, authenticated;
grant select on public.message_threads, public.messages to authenticated;
-- Seuls la conversation et le texte s'écrivent : l'auteur, son type et la date sont fixés par le
-- déclencheur ci-dessous. Ni modification ni suppression depuis le Campus.
grant insert (thread_id, body) on public.messages to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Réglage « Respuestas del asistente » (désactivé : brouillons à envoyer par l'équipe)
-- ─────────────────────────────────────────────────────────────
insert into public.campus_settings (key, value) values ('assistant', '{"auto_reply": false}') on conflict (key) do nothing;

-- Les réglages modifiables par l'admin : on ajoute « assistant » (remplace celle du 018).
create or replace function public.set_campus_setting(p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v jsonb := p_value;
begin
  if public.my_role() <> 'admin' then raise exception 'admin only'; end if;
  if p_key not in ('attendance', 'reminder', 'contract', 'progression', 'assistant') then raise exception 'unknown setting'; end if;
  if p_key = 'attendance' and (v->>'enabled')::boolean and not coalesce((public._setting('attendance')->>'enabled')::boolean, false) then
    v := v || jsonb_build_object('since', now());
  end if;
  if p_key = 'assistant' then v := jsonb_build_object('auto_reply', coalesce((v->>'auto_reply')::boolean, false)); end if;
  update campus_settings set value = public._setting(p_key) || v, updated_at = now() where key = p_key;
end $$;

-- Lu par la fonction campus-assistant (avec la session de l'élève) et par le Campus.
create function public.assistant_auto_reply() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((public._setting('assistant')->>'auto_reply')::boolean, false)
$$;

-- ─────────────────────────────────────────────────────────────
-- Écriture : auteur, limites et état de la conversation
-- ─────────────────────────────────────────────────────────────
create function public._message_limits(p_thread uuid, p_kind text, p_author uuid) returns void
language plpgsql stable security definer set search_path = public as $$
declare h int; d int;
begin
  if p_kind = 'student' then
    select count(*) filter (where created_at > now() - interval '1 hour'), count(*) into h, d
      from messages where author_id = p_author and author_kind = 'student' and created_at > now() - interval '24 hours';
    if h >= 10 then raise exception 'rate_limit_hour'; end if;
    if d >= 30 then raise exception 'rate_limit_day'; end if;
  elsif p_kind = 'staff' then
    select count(*) into d from messages where author_id = p_author and created_at > now() - interval '24 hours';
    if d >= 300 then raise exception 'rate_limit_day'; end if;
  else
    select count(*) into d from messages where thread_id = p_thread and author_kind = 'assistant' and created_at > now() - interval '24 hours';
    if d >= 40 then raise exception 'rate_limit_day'; end if;
  end if;
end $$;

-- Avant l'écriture (droits de l'appelant) : depuis le Campus, l'auteur est toujours la personne
-- connectée ; un message « assistant » ne passe que par assistant_reply().
create function public._message_before() returns trigger
language plpgsql set search_path = public as $$
begin
  new.created_at := now();
  if current_user in ('authenticated', 'anon') then
    new.author_id := auth.uid();
    new.author_kind := public._message_author_kind(new.thread_id);
    new.reply_to := null; new.escalated := false; new.assistant_kind := null; new.note := null;
    if new.author_kind = 'student' and length(btrim(new.body)) > 1000 then raise exception 'message_too_long'; end if;
  elsif new.author_kind = 'assistant' then
    if coalesce(current_setting('pathway.assistant_reply', true), '') <> 'on' then raise exception 'assistant_only_via_assistant_reply'; end if;
    new.author_id := null;
  elsif new.author_id is null then
    raise exception 'author_required';
  end if;
  new.body := btrim(new.body);
  perform public._message_limits(new.thread_id, new.author_kind, new.author_id);
  return new;
end $$;
create trigger messages_before before insert on public.messages for each row execute function public._message_before();

-- Après l'écriture : l'état de la conversation (« Necesita respuesta », lu, dernier message).
create function public._message_after() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.author_kind = 'student' then
    update message_threads set last_message_at = new.created_at, last_student_at = new.created_at, student_read_at = new.created_at,
      needs_staff = true, needs_staff_since = case when needs_staff then needs_staff_since else new.created_at end,
      handled_at = null, handled_by = null
    where id = new.thread_id;
  elsif new.author_kind = 'staff' then
    update message_threads set last_message_at = new.created_at, last_staff_at = new.created_at, staff_read_at = new.created_at,
      needs_staff = false, needs_staff_since = null, escalated_at = null, escalated_reason = null,
      handled_at = new.created_at, handled_by = new.author_id
    where id = new.thread_id;
  elsif new.draft_state = 'pending' then
    -- Brouillon : l'équipe doit le relire et l'envoyer, comme une question passée au professeur.
    update message_threads set last_message_at = new.created_at,
      needs_staff = true, needs_staff_since = coalesce(case when needs_staff then needs_staff_since end, new.created_at),
      escalated_at = coalesce(escalated_at, new.created_at),
      escalated_reason = coalesce(escalated_reason, 'Respuesta preparada por el asistente: revísala y envíala'),
      handled_at = null, handled_by = null
    where id = new.thread_id;
  elsif new.escalated then
    update message_threads set last_message_at = new.created_at,
      needs_staff = true, needs_staff_since = coalesce(case when needs_staff then needs_staff_since end, new.created_at),
      escalated_at = coalesce(escalated_at, new.created_at), escalated_reason = coalesce(new.note, escalated_reason),
      handled_at = null, handled_by = null
    where id = new.thread_id;
  else
    -- Réponse de l'assistant : la conversation n'attend plus personne, sauf une question déjà
    -- passée au professeur ou un message plus récent de l'élève.
    update message_threads t set last_message_at = new.created_at,
      needs_staff = false, needs_staff_since = null
    where t.id = new.thread_id and t.escalated_at is null
      and not exists (select 1 from messages m where m.thread_id = t.id and m.author_kind = 'student' and m.id > coalesce(new.reply_to, 0));
    update message_threads set last_message_at = new.created_at where id = new.thread_id and last_message_at is distinct from new.created_at;
  end if;
  return null;
end $$;
create trigger messages_after after insert on public.messages for each row execute function public._message_after();

-- ─────────────────────────────────────────────────────────────
-- Fonctions du Campus
-- ─────────────────────────────────────────────────────────────
-- Ouvre (crée au besoin) la conversation d'un élève : la sienne pour l'élève, celle d'un de ses
-- élèves pour le professeur ou l'admin.
create function public.open_thread(p_student uuid default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare s uuid := coalesce(p_student, auth.uid()); t uuid;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if not ((s = auth.uid() and public.my_role() = 'student')
          or (public.is_staff() and public.teaches(s) and exists (select 1 from profiles where id = s and role = 'student'))) then
    raise exception 'not_your_student';
  end if;
  insert into message_threads (student_id) values (s) on conflict (student_id) do nothing;
  select id into t from message_threads where student_id = s;
  return t;
end $$;

-- L'élève voit les réponses de l'assistant comme venant de l'équipe (« team ») ; l'équipe voit
-- qu'elles sont de l'assistant, avec le brouillon, qui l'a envoyé et s'il a été modifié.
create function public._message_json(m public.messages, p_staff boolean) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', m.id, 'body', m.body, 'created_at', m.created_at,
    'author', case when m.author_kind = 'staff' then (select full_name from profiles where id = m.author_id) end,
    'mine', m.author_id = auth.uid(), 'escalated', m.escalated)
    || case when p_staff then jsonb_build_object('kind', m.author_kind, 'reply_to', m.reply_to, 'assistant_kind', m.assistant_kind, 'note', m.note,
         'draft_state', m.draft_state, 'edited', m.edited, 'sent_by', (select full_name from profiles where id = m.sent_by))
       else jsonb_build_object('kind', case when m.author_kind = 'assistant' then 'team' else m.author_kind end,
         'handed_over', m.author_kind = 'assistant' and m.escalated and m.assistant_kind = 'handoff') end
$$;
-- Visible par l'élève : tout sauf les brouillons non envoyés.
create function public._visible_to_student(m public.messages) returns boolean
language sql immutable as $$ select m.draft_state is null or m.draft_state = 'sent' $$;

-- Élève : sa conversation (null tant qu'il n'a rien écrit) et ses 100 derniers messages.
create function public.my_thread() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', t.id, 'needs_staff', t.needs_staff, 'escalated', t.escalated_at is not null,
    'auto_reply', public.assistant_auto_reply(),
    'unread', (select count(*) from messages m where m.thread_id = t.id and m.author_kind <> 'student' and public._visible_to_student(m)
               and m.created_at > coalesce(t.student_read_at, '-infinity')),
    'teacher', (select p.full_name from profiles p join profiles s on s.teacher_id = p.id where s.id = t.student_id),
    'messages', coalesce((select jsonb_agg(public._message_json(x.m, false) order by (x.m).id) from
      (select m from messages m where m.thread_id = t.id and public._visible_to_student(m) order by m.id desc limit 100) x), '[]'::jsonb))
  from message_threads t where t.student_id = auth.uid() and public.my_role() = 'student'
$$;

-- Équipe : les conversations de ses élèves (toutes pour l'admin), « Necesita respuesta » d'abord.
create function public.staff_threads() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'student_id', s.id, 'name', s.full_name, 'level', s.level,
      'teacher', (select full_name from profiles p where p.id = s.teacher_id),
      'needs_staff', t.needs_staff, 'needs_staff_since', t.needs_staff_since, 'escalated_at', t.escalated_at,
      'escalated_reason', t.escalated_reason, 'last_message_at', t.last_message_at, 'handled_at', t.handled_at,
      'unread', (select count(*) from messages m where m.thread_id = t.id and m.author_kind = 'student' and m.created_at > coalesce(t.staff_read_at, '-infinity')),
      'drafts', (select count(*) from messages m where m.thread_id = t.id and m.draft_state = 'pending'),
      'last', (select jsonb_build_object('kind', m.author_kind, 'body', left(m.body, 140), 'escalated', m.escalated, 'draft_state', m.draft_state)
               from messages m where m.thread_id = t.id and m.draft_state is distinct from 'discarded' order by m.id desc limit 1))
    order by t.needs_staff desc, case when t.needs_staff then t.needs_staff_since end asc, t.last_message_at desc nulls last), '[]'::jsonb)
  from message_threads t join profiles s on s.id = t.student_id
  where public.is_staff() and public.teaches(t.student_id)
$$;

-- Les 200 derniers messages d'une conversation, pour l'équipe (avec le motif des passages au professeur).
create function public.thread_messages(p_thread uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.can_read_thread(p_thread) then raise exception 'not_your_thread'; end if;
  return coalesce((select jsonb_agg(public._message_json(x.m, public.is_staff()) order by (x.m).id) from
    (select m from messages m where m.thread_id = p_thread and (public.is_staff() or public._visible_to_student(m)) order by m.id desc limit 200) x), '[]'::jsonb);
end $$;

-- Lu jusqu'à maintenant, du côté de la personne connectée.
create function public.mark_thread_read(p_thread uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.can_read_thread(p_thread) then raise exception 'not_your_thread'; end if;
  if public.is_staff() then update message_threads set staff_read_at = now() where id = p_thread;
  else update message_threads set student_read_at = now() where id = p_thread; end if;
end $$;

-- Équipe : « Marcar como resuelta » (ou la rouvrir).
create function public.set_thread_handled(p_thread uuid, p_handled boolean default true) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_staff() and public.can_read_thread(p_thread)) then raise exception 'not_your_thread'; end if;
  if p_handled then
    update message_threads set needs_staff = false, needs_staff_since = null, escalated_at = null, escalated_reason = null,
      handled_at = now(), handled_by = auth.uid(), staff_read_at = now() where id = p_thread;
  else
    update message_threads set needs_staff = true, needs_staff_since = now(), handled_at = null, handled_by = null where id = p_thread;
  end if;
end $$;

-- Le fuseau du professeur, pour l'assistant (remplace celle du 001).
create or replace function public.my_teacher() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', t.id, 'full_name', t.full_name, 'timezone', t.timezone)
  from profiles me join profiles t on t.id = me.teacher_id where me.id = auth.uid()
$$;

-- ─────────────────────────────────────────────────────────────
-- Assistant (clé service uniquement) : écrit sa réponse et met à jour la conversation.
-- p_kind : answer (réponse), handoff (passée au professeur par l'assistant), fallback (phrase
-- neutre quand l'assistant ne peut pas répondre). Au plus 20 réponses par élève et par jour.
-- ─────────────────────────────────────────────────────────────
-- p_draft : brouillon (l'équipe l'envoie). Une réponse « answer » est toujours un brouillon tant
-- que le réglage « Respuestas del asistente » est désactivé.
create function public.assistant_reply(p_message bigint, p_body text, p_escalate boolean, p_kind text, p_reason text default null, p_draft boolean default false) returns bigint
language plpgsql security definer set search_path = public as $$
declare m messages; n int; out_id bigint; is_draft boolean := p_kind = 'answer' and (coalesce(p_draft, false) or not public.assistant_auto_reply());
begin
  select * into m from messages where id = p_message;
  if not found or m.author_kind <> 'student' then raise exception 'unknown_question'; end if;
  if p_kind not in ('answer', 'handoff', 'fallback') then raise exception 'invalid_kind'; end if;
  if length(btrim(coalesce(p_body, ''))) not between 1 and 1200 then raise exception 'invalid_body'; end if;
  if p_kind <> 'fallback' then
    select count(*) into n from messages where thread_id = m.thread_id and author_kind = 'assistant'
      and assistant_kind in ('answer', 'handoff') and created_at > now() - interval '24 hours';
    if n >= 20 then raise exception 'assistant_cap'; end if;
  end if;
  perform set_config('pathway.assistant_reply', 'on', true);
  insert into messages (thread_id, author_kind, body, reply_to, escalated, assistant_kind, note, draft_state)
  values (m.thread_id, 'assistant', p_body, m.id, (coalesce(p_escalate, false) or p_kind <> 'answer') and not is_draft, p_kind,
          nullif(left(btrim(coalesce(p_reason, '')), 300), ''), case when is_draft then 'pending' end)
  on conflict (reply_to) where author_kind = 'assistant' do nothing
  returning id into out_id;
  perform set_config('pathway.assistant_reply', 'off', true);
  return out_id;
end $$;

-- Pour la fonction campus-assistant, avec la session de l'élève : sa question a-t-elle déjà une
-- réponse (brouillon compris, que l'élève ne voit pas) et combien de réponses de l'assistant
-- a-t-il eues en 24 h (limite de 20). Rien d'autre ne sort.
create function public.assistant_status(p_message bigint) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'answered', exists (select 1 from messages a where a.reply_to = q.id and a.author_kind = 'assistant'),
    'used', (select count(*) from messages a where a.thread_id = q.thread_id and a.author_kind = 'assistant'
             and a.assistant_kind in ('answer', 'handoff') and a.created_at > now() - interval '24 hours'))
  from messages q join message_threads t on t.id = q.thread_id
  where q.id = p_message and q.author_kind = 'student' and t.student_id = auth.uid()
$$;

-- Équipe : envoyer un brouillon de l'assistant, tel quel ou modifié (p_body). Il apparaît alors à
-- l'élève signé « Equipo Pathway », à l'heure de l'envoi, et compte comme une réponse de l'équipe.
create function public.send_draft(p_message bigint, p_body text default null) returns void
language plpgsql security definer set search_path = public as $$
declare m messages; b text := nullif(btrim(coalesce(p_body, '')), '');
begin
  select * into m from messages where id = p_message;
  if not found or m.draft_state is distinct from 'pending' then raise exception 'not_a_draft'; end if;
  if not (public.is_staff() and public.can_read_thread(m.thread_id)) then raise exception 'not_your_thread'; end if;
  if b is not null and length(b) > 2000 then raise exception 'message_too_long'; end if;
  update messages set draft_state = 'sent', sent_by = auth.uid(), created_at = now(),
    body = coalesce(b, body), edited = b is not null and b <> body
  where id = p_message;
  update message_threads t set needs_staff = false, needs_staff_since = null, escalated_at = null, escalated_reason = null,
    handled_at = now(), handled_by = auth.uid()
  where t.id = m.thread_id and not exists (select 1 from messages x where x.thread_id = t.id and x.draft_state = 'pending');
  update message_threads set last_message_at = now(), last_staff_at = now(), staff_read_at = now() where id = m.thread_id;
end $$;
-- Équipe : écarter un brouillon (rien n'est envoyé ; la conversation reste à traiter).
create function public.discard_draft(p_message bigint) returns void
language plpgsql security definer set search_path = public as $$
declare m messages;
begin
  select * into m from messages where id = p_message;
  if not found or m.draft_state is distinct from 'pending' then raise exception 'not_a_draft'; end if;
  if not (public.is_staff() and public.can_read_thread(m.thread_id)) then raise exception 'not_your_thread'; end if;
  update messages set draft_state = 'discarded', sent_by = auth.uid() where id = p_message;
end $$;

-- ─────────────────────────────────────────────────────────────
-- E-mails (fonction class-reminders, clé service uniquement)
-- ─────────────────────────────────────────────────────────────
-- Conversations qui attendent l'équipe depuis 5 min (non lues depuis), avec leurs destinataires :
-- le professeur de l'élève, ou les admins s'il n'en a pas. Et élèves à qui l'équipe a répondu il
-- y a plus de 10 min sans qu'ils l'aient lu.
create function public.due_message_emails() returns jsonb
language sql stable security definer set search_path = public, auth as $$
  select jsonb_build_object(
    'staff', coalesce((select jsonb_agg(jsonb_build_object('thread', t.id, 'student', s.full_name, 'since', t.needs_staff_since,
        'escalated', t.escalated_at is not null,
        'recipients', coalesce((select jsonb_agg(jsonb_build_object('email', u.email, 'name', p.full_name, 'timezone', p.timezone))
            from profiles p join auth.users u on u.id = p.id
            where case when exists (select 1 from profiles tt where tt.id = s.teacher_id and tt.role in ('teacher', 'admin'))
                       then p.id = s.teacher_id else p.role = 'admin' end and u.email is not null), '[]'::jsonb)))
      from message_threads t join profiles s on s.id = t.student_id
      where t.needs_staff and t.needs_staff_since <= now() - interval '5 minutes'
        and (t.staff_emailed_at is null or t.staff_emailed_at < t.needs_staff_since)
        and (t.staff_read_at is null or t.staff_read_at < t.needs_staff_since)), '[]'::jsonb),
    'students', coalesce((select jsonb_agg(jsonb_build_object('thread', t.id, 'email', u.email, 'name', s.full_name,
        'staff', (select p.full_name from (select * from messages m where m.thread_id = t.id and m.author_kind <> 'student'
                    and public._visible_to_student(m) order by m.created_at desc limit 1) l join profiles p on p.id = l.author_id)))
      from message_threads t join profiles s on s.id = t.student_id join auth.users u on u.id = s.id
      where t.last_staff_at is not null and t.last_staff_at <= now() - interval '10 minutes'
        and t.last_staff_at > coalesce(t.student_read_at, '-infinity')
        and (t.student_emailed_at is null or t.student_emailed_at < t.last_staff_at) and u.email is not null), '[]'::jsonb))
$$;

-- Réserve l'e-mail d'une conversation (une seule fois par attente) ; release_message_email le rend
-- de nouveau dû si l'envoi échoue.
create function public.claim_message_email(p_thread uuid, p_side text) returns boolean
language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  if p_side = 'staff' then
    update message_threads set staff_emailed_at = now() where id = p_thread and needs_staff
      and (staff_emailed_at is null or staff_emailed_at < needs_staff_since) returning true into ok;
  elsif p_side = 'student' then
    update message_threads set student_emailed_at = now() where id = p_thread and last_staff_at is not null
      and (student_emailed_at is null or student_emailed_at < last_staff_at) returning true into ok;
  end if;
  return coalesce(ok, false);
end $$;
create function public.release_message_email(p_thread uuid, p_side text) returns void
language sql security definer set search_path = public as $$
  update message_threads set staff_emailed_at = case when p_side = 'staff' then null else staff_emailed_at end,
    student_emailed_at = case when p_side = 'student' then null else student_emailed_at end where id = p_thread
$$;

-- ─────────────────────────────────────────────────────────────
-- Droits
-- ─────────────────────────────────────────────────────────────
revoke execute on function public._thread_student(uuid), public._message_author_kind(uuid), public._message_limits(uuid, text, uuid),
  public._message_before(), public._message_after(), public._message_json(public.messages, boolean),
  public.assistant_reply(bigint, text, boolean, text, text, boolean), public.due_message_emails(),
  public.claim_message_email(uuid, text), public.release_message_email(uuid, text) from public, anon, authenticated;
-- Le déclencheur et les règles d'accès appellent ces deux fonctions pour la personne connectée.
grant execute on function public._message_author_kind(uuid), public._message_limits(uuid, text, uuid) to authenticated;
grant execute on function public.assistant_reply(bigint, text, boolean, text, text, boolean), public.due_message_emails(),
  public.claim_message_email(uuid, text), public.release_message_email(uuid, text), public.assistant_auto_reply() to service_role;
revoke execute on function public.can_read_thread(uuid), public.open_thread(uuid), public.my_thread(), public.staff_threads(),
  public.thread_messages(uuid), public.mark_thread_read(uuid), public.set_thread_handled(uuid, boolean),
  public.send_draft(bigint, text), public.discard_draft(bigint), public.assistant_auto_reply(), public.assistant_status(bigint), public._visible_to_student(public.messages) from public, anon;
grant execute on function public.can_read_thread(uuid), public.open_thread(uuid), public.my_thread(), public.staff_threads(),
  public.thread_messages(uuid), public.mark_thread_read(uuid), public.set_thread_handled(uuid, boolean),
  public.send_draft(bigint, text), public.discard_draft(bigint), public.assistant_auto_reply(), public.assistant_status(bigint), public._visible_to_student(public.messages) to authenticated;

commit;

-- Le Campus voit les nouvelles fonctions tout de suite.
notify pgrst, 'reload schema';
