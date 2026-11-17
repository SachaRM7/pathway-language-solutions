-- Campus Pathway · 030 · difusión : les sites, chaînes et communautés à démarcher pour des liens
-- et des mentions, avec un assistant « difusion » qui prépare les messages.
-- À exécuter après 029, puis redéployer la fonction « pathway-mcp » (Verify JWT désactivé).
--
-- • Une fiche par contact (blog, média, forum, chaîne YouTube, podcast, page Facebook…), avec son
--   statut : por_contactar → contactado → respondio → enlace (lien obtenu), ou rechazado / descartado.
-- • L'équipe la gère dans « Prospectos » → « Difusión » (admins seulement).
-- • Le nouveau rôle de clé « difusion » (bot sur AppuBot) lit les fiches, complète le moyen de
--   contact, ajoute des sites trouvés, laisse des notes et des BROUILLONS de message, fixe la
--   prochaine relance et signale un lien obtenu après l'avoir vu en ligne. Il n'envoie rien, ne
--   marque jamais « contactado » (c'est l'humain qui envoie) et ne supprime rien.
-- • Limites : 10 notes ou brouillons d'assistant par fiche et par jour ; 15 nouvelles fiches
--   d'assistant par jour ; 60 appels par heure et par clé (comme les autres rôles).

begin;

create table public.outreach_contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  url text not null check (url ~* '^https?://[^\s]+$' and length(url) <= 500),
  url_key text generated always as (lower(regexp_replace(regexp_replace(url, '^https?://(www\.)?', '', 'i'), '[/#?]+$', ''))) stored,
  kind text not null default 'blog' check (kind in ('blog', 'medio', 'foro', 'youtube', 'podcast', 'facebook', 'reddit', 'red', 'otro')),
  country text check (length(country) <= 60),
  audience text check (length(audience) <= 120),
  contact text check (length(contact) <= 300),
  angle text check (length(angle) <= 800),
  priority smallint not null default 2 check (priority between 1 and 3),
  status text not null default 'por_contactar' check (status in ('por_contactar', 'contactado', 'respondio', 'enlace', 'rechazado', 'descartado')),
  link_url text check (link_url is null or (link_url ~* '^https?://[^\s]+$' and length(link_url) <= 500)),
  next_action text check (length(next_action) <= 200),
  next_due date,
  contacted_at timestamptz,
  replied_at timestamptz,
  link_at timestamptz,
  added_by_agent text check (length(added_by_agent) <= 80),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);
create unique index outreach_contacts_url on public.outreach_contacts (url_key);
create index outreach_contacts_status on public.outreach_contacts (status, priority) where archived_at is null;

create table public.outreach_events (
  id bigint generated always as identity primary key,
  contact_id uuid not null references public.outreach_contacts (id) on delete cascade,
  kind text not null check (kind in ('auto', 'note', 'draft')),
  topic text check (length(topic) <= 20),
  body text not null check (length(body) between 1 and 4000),
  agent text check (length(agent) <= 80),
  author_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index outreach_events_contact on public.outreach_events (contact_id, created_at desc);

alter table public.outreach_contacts enable row level security;
alter table public.outreach_events enable row level security;
revoke all on public.outreach_contacts, public.outreach_events from anon, authenticated;

-- Nouveau rôle de clé.
alter table public.agent_tokens drop constraint if exists agent_tokens_scope_check;
alter table public.agent_tokens add constraint agent_tokens_scope_check check (scope in ('admisiones', 'seguimiento', 'gestion', 'marketing', 'difusion'));

create or replace function public.agent_token_create(p_name text, p_scope text, p_days int default 90) returns jsonb
language plpgsql security definer set search_path = public as $$
declare tok text; t agent_tokens;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if length(trim(coalesce(p_name, ''))) not between 1 and 80 then raise exception 'name required (80 characters max)'; end if;
  if p_scope is null or p_scope not in ('admisiones', 'seguimiento', 'gestion', 'marketing', 'difusion') then raise exception 'invalid scope'; end if;
  if coalesce(p_days, 90) not between 1 and 365 then raise exception 'invalid duration'; end if;
  if (select count(*) from agent_tokens where active and expires_at > now()) >= 20 then raise exception 'too many active tokens'; end if;
  tok := 'pwa_' || encode(extensions.gen_random_bytes(32), 'hex');
  insert into agent_tokens (name, scope, token_hash, token_hint, created_by, expires_at)
  values (trim(p_name), p_scope, public._agent_hash(tok), left(tok, 8) || '…', auth.uid(), now() + make_interval(days => coalesce(p_days, 90)))
  returning * into t;
  return jsonb_build_object('id', t.id, 'name', t.name, 'scope', t.scope, 'hint', t.token_hint, 'expires_at', t.expires_at, 'token', tok);
end $$;

-- ─────────────────────────────────────────────────────────────
-- Commun
-- ─────────────────────────────────────────────────────────────
create function public._outreach_json(c public.outreach_contacts) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', c.id, 'name', c.name, 'url', c.url, 'kind', c.kind, 'country', c.country, 'audience', c.audience,
    'contact', c.contact, 'angle', c.angle, 'priority', c.priority, 'status', c.status, 'link_url', c.link_url,
    'next_action', c.next_action, 'next_due', c.next_due, 'overdue', c.next_due < public._crm_today(),
    'contacted_at', c.contacted_at, 'replied_at', c.replied_at, 'link_at', c.link_at, 'added_by_agent', c.added_by_agent,
    'created_at', c.created_at, 'updated_at', c.updated_at,
    'drafts_pending', (select count(*) from outreach_events e where e.contact_id = c.id and e.kind = 'draft'
       and e.created_at > coalesce(c.contacted_at, '-infinity'::timestamptz)),
    'last_event_at', (select max(e.created_at) from outreach_events e where e.contact_id = c.id))
$$;

create function public._outreach_status_label(s text) returns text
language sql immutable as $$
  select case s when 'por_contactar' then 'Por contactar' when 'contactado' then 'Contactado' when 'respondio' then 'Respondió'
    when 'enlace' then 'Enlace obtenido' when 'rechazado' then 'Rechazado' when 'descartado' then 'Descartado' else s end
$$;

-- Lecture et contrôle des champs d'une fiche (création et modification), pour l'équipe et l'assistant.
create function public._outreach_clean(p_old public.outreach_contacts, p jsonb) returns public.outreach_contacts
language plpgsql stable as $$
declare c outreach_contacts := p_old; v text;
begin
  if p ? 'name' then c.name := nullif(trim(p ->> 'name'), ''); end if;
  if p ? 'url' then c.url := nullif(trim(p ->> 'url'), ''); end if;
  if p ? 'kind' then c.kind := coalesce(nullif(trim(p ->> 'kind'), ''), 'otro'); end if;
  if p ? 'country' then c.country := nullif(trim(p ->> 'country'), ''); end if;
  if p ? 'audience' then c.audience := nullif(trim(p ->> 'audience'), ''); end if;
  if p ? 'contact' then c.contact := nullif(trim(p ->> 'contact'), ''); end if;
  if p ? 'angle' then c.angle := nullif(trim(p ->> 'angle'), ''); end if;
  if p ? 'link_url' then c.link_url := nullif(trim(p ->> 'link_url'), ''); end if;
  if p ? 'next_action' then c.next_action := nullif(trim(p ->> 'next_action'), ''); end if;
  if p ? 'next_due' then
    v := nullif(trim(p ->> 'next_due'), '');
    if v is not null and v !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'invalid next_due (YYYY-MM-DD)'; end if;
    c.next_due := v::date;
  end if;
  if p ? 'priority' then
    v := p ->> 'priority';
    if v !~ '^[123]$' then raise exception 'invalid priority (1, 2 or 3)'; end if;
    c.priority := v::smallint;
  end if;
  if c.name is null or length(c.name) > 120 then raise exception 'invalid name (1 to 120 characters)'; end if;
  if c.url is null or c.url !~* '^https?://[^\s]+$' or length(c.url) > 500 then raise exception 'invalid url (http(s)://…)'; end if;
  if c.kind not in ('blog', 'medio', 'foro', 'youtube', 'podcast', 'facebook', 'reddit', 'red', 'otro') then raise exception 'invalid kind'; end if;
  if c.link_url is not null and (c.link_url !~* '^https?://[^\s]+$' or length(c.link_url) > 500) then raise exception 'invalid link_url (http(s)://…)'; end if;
  if length(c.country) > 60 or length(c.audience) > 120 or length(c.contact) > 300 or length(c.angle) > 800 or length(c.next_action) > 200 then
    raise exception 'invalid text (too long)';
  end if;
  return c;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Équipe (admins), depuis le Campus
-- ─────────────────────────────────────────────────────────────
create function public.outreach_list() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return coalesce((select jsonb_agg(public._outreach_json(c) order by c.priority, c.updated_at desc)
    from outreach_contacts c where c.archived_at is null), '[]'::jsonb);
end $$;

create function public.outreach_contact(p_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c outreach_contacts;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into c from outreach_contacts where id = p_id and archived_at is null;
  if not found then return null; end if;
  return public._outreach_json(c) || jsonb_build_object('events', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'kind', e.kind,
      'topic', e.topic, 'body', e.body, 'agent', e.agent, 'author', (select full_name from profiles where id = e.author_id), 'created_at', e.created_at)
      order by e.created_at desc, e.id desc) from outreach_events e where e.contact_id = c.id), '[]'::jsonb));
end $$;

-- Crée (p_id null) ou modifie une fiche. Une URL déjà présente renvoie la fiche existante.
create function public.outreach_save(p_id uuid, p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c outreach_contacts; old outreach_contacts;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if p_id is null then
    c := public._outreach_clean(null::outreach_contacts, coalesce(p, '{}'));
    select * into old from outreach_contacts where url_key = lower(regexp_replace(regexp_replace(c.url, '^https?://(www\.)?', '', 'i'), '[/#?]+$', ''));
    if found then
      if old.archived_at is not null then update outreach_contacts set archived_at = null, updated_at = now() where id = old.id returning * into old; end if;
      return public._outreach_json(old) || jsonb_build_object('existing', true);
    end if;
    insert into outreach_contacts (name, url, kind, country, audience, contact, angle, priority, link_url, next_action, next_due, created_by)
    values (c.name, c.url, coalesce(c.kind, 'blog'), c.country, c.audience, c.contact, c.angle, coalesce(c.priority, 2), c.link_url, c.next_action, c.next_due, auth.uid())
    returning * into c;
    insert into outreach_events (contact_id, kind, topic, body, author_id) values (c.id, 'auto', 'new', 'Ficha creada.', auth.uid());
    return public._outreach_json(c);
  end if;
  select * into old from outreach_contacts where id = p_id and archived_at is null;
  if not found then raise exception 'not found'; end if;
  c := public._outreach_clean(old, coalesce(p, '{}'));
  update outreach_contacts set name = c.name, url = c.url, kind = c.kind, country = c.country, audience = c.audience, contact = c.contact,
    angle = c.angle, priority = c.priority, link_url = c.link_url, next_action = c.next_action, next_due = c.next_due, updated_at = now()
  where id = p_id returning * into c;
  return public._outreach_json(c);
exception when unique_violation then raise exception 'url already used';
end $$;

-- Change le statut. « contactado » note la date et prévoit une relance à 7 jours si rien n'est prévu.
create function public.outreach_set_status(p_id uuid, p_status text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c outreach_contacts; today date := public._crm_today();
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if p_status not in ('por_contactar', 'contactado', 'respondio', 'enlace', 'rechazado', 'descartado') then raise exception 'invalid status'; end if;
  select * into c from outreach_contacts where id = p_id and archived_at is null;
  if not found then raise exception 'not found'; end if;
  if c.status = p_status and p_status <> 'contactado' then return public._outreach_json(c); end if;
  update outreach_contacts set status = p_status, updated_at = now(),
    contacted_at = case when p_status = 'contactado' then now() else contacted_at end,
    replied_at = case when p_status = 'respondio' and replied_at is null then now() else replied_at end,
    link_at = case when p_status = 'enlace' and link_at is null then now() else link_at end,
    next_action = case when p_status = 'contactado' and (c.status <> 'contactado' or next_due is null or next_due <= today) then 'Relanzar si no responde'
      when p_status in ('enlace', 'rechazado', 'descartado') then null else next_action end,
    next_due = case when p_status = 'contactado' and (c.status <> 'contactado' or next_due is null or next_due <= today) then today + 7
      when p_status in ('enlace', 'rechazado', 'descartado') then null else next_due end
  where id = p_id returning * into c;
  insert into outreach_events (contact_id, kind, topic, body, author_id)
  values (c.id, 'auto', 'status', 'Estado: ' || public._outreach_status_label(p_status) || '.'
    || case when p_status = 'contactado' and c.next_due is not null then ' Relance prevista el ' || public._crm_day(c.next_due) || '.' else '' end, auth.uid());
  return public._outreach_json(c);
end $$;

create function public.outreach_note(p_id uuid, p_text text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t text := nullif(trim(coalesce(p_text, '')), '');
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  if t is null or length(t) > 2000 then raise exception 'invalid text (1 to 2000 characters)'; end if;
  if not exists (select 1 from outreach_contacts where id = p_id and archived_at is null) then raise exception 'not found'; end if;
  insert into outreach_events (contact_id, kind, topic, body, author_id) values (p_id, 'note', 'note', t, auth.uid());
  update outreach_contacts set updated_at = now() where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

create function public.outreach_archive(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  update outreach_contacts set archived_at = now(), updated_at = now() where id = p_id and archived_at is null;
  if not found then raise exception 'not found'; end if;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Assistant « difusion » (fonction pathway-mcp, clé service seulement)
-- ─────────────────────────────────────────────────────────────
create function public._agent_outreach(p_id uuid) returns public.outreach_contacts
language plpgsql stable security definer set search_path = public as $$
declare c outreach_contacts;
begin
  select * into c from outreach_contacts where id = p_id and archived_at is null;
  if not found then raise exception 'agent: not_found contact'; end if;
  return c;
end $$;

create function public._agent_outreach_quota(p_id uuid) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if (select count(*) from outreach_events where contact_id = p_id and agent is not null and kind in ('note', 'draft')
      and created_at > now() - interval '24 hours') >= 10 then
    raise exception 'agent: rate_limited (10 notes or drafts per contact per day)';
  end if;
end $$;

-- view : por_preparar (por contactar, sin borrador pendiente), para_hoy (relance prévue aujourd'hui
-- ou en retard), contactados (en attente de réponse), todos (sauf descartados et rechazados).
create function public.agent_outreach_list(p_hash text, p_args jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare a jsonb := coalesce(p_args, '{}'); v_view text; v_kind text; v_limit int; today date := public._crm_today(); rows jsonb;
begin
  perform public._agent_require(p_hash, 'difusion');
  v_view := coalesce(public._agent_text(a, 'view', 20), 'por_preparar');
  v_kind := public._agent_text(a, 'kind', 20);
  v_limit := public._agent_int(a, 'limit', 1, 50, 20);
  if v_view not in ('por_preparar', 'para_hoy', 'contactados', 'todos') then raise exception 'agent: invalid view (por_preparar, para_hoy, contactados, todos)'; end if;
  select coalesce(jsonb_agg(public._outreach_json(c) order by c.priority, c.next_due nulls last, c.created_at), '[]'::jsonb) into rows from (
    select * from outreach_contacts x
    where x.archived_at is null and (v_kind is null or x.kind = v_kind) and (
      (v_view = 'por_preparar' and x.status = 'por_contactar' and not exists (select 1 from outreach_events e where e.contact_id = x.id and e.kind = 'draft'))
      or (v_view = 'para_hoy' and x.next_due <= today and x.status in ('por_contactar', 'contactado', 'respondio'))
      or (v_view = 'contactados' and x.status = 'contactado')
      or (v_view = 'todos' and x.status not in ('descartado', 'rechazado')))
    order by x.priority, x.next_due nulls last, x.created_at limit v_limit) c;
  return jsonb_build_object('view', v_view, 'today', today, 'count', jsonb_array_length(rows), 'contacts', rows);
end $$;

create function public.agent_outreach_get(p_hash text, p_args jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare c outreach_contacts;
begin
  perform public._agent_require(p_hash, 'difusion');
  c := public._agent_outreach(public._agent_uuid(p_args, 'contact_id'));
  return public._outreach_json(c) || jsonb_build_object('events', coalesce((select jsonb_agg(jsonb_build_object('kind', e.kind, 'topic', e.topic,
      'body', left(e.body, 1500), 'by', case when e.agent is not null then 'asistente «' || e.agent || '»' when e.author_id is not null then (select full_name from profiles where id = e.author_id) else 'automático' end,
      'at', e.created_at) order by e.created_at desc, e.id desc)
    from (select * from outreach_events where contact_id = c.id order by created_at desc, id desc limit 30) e), '[]'::jsonb));
end $$;

create function public.agent_outreach_add(p_hash text, p_args jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t agent_tokens; c outreach_contacts; old outreach_contacts; a jsonb := coalesce(p_args, '{}');
begin
  t := public._agent_require(p_hash, 'difusion');
  c := public._outreach_clean(null::outreach_contacts, jsonb_strip_nulls(jsonb_build_object('name', a ->> 'name', 'url', a ->> 'url', 'kind', a ->> 'kind',
    'country', a ->> 'country', 'audience', a ->> 'audience', 'contact', a ->> 'contact', 'angle', a ->> 'angle', 'priority', a ->> 'priority')));
  select * into old from outreach_contacts where url_key = lower(regexp_replace(regexp_replace(c.url, '^https?://(www\.)?', '', 'i'), '[/#?]+$', ''));
  if found then
    return jsonb_build_object('ok', false, 'existing', true, 'archived', old.archived_at is not null,
      'contact', case when old.archived_at is null then public._outreach_json(old) end,
      'note', 'Ce site est déjà dans la liste' || case when old.archived_at is not null then ' (archivé par l''équipe : ne pas le reproposer).' else '.' end);
  end if;
  if (select count(*) from outreach_contacts where added_by_agent is not null and created_at > now() - interval '24 hours') >= 15 then
    raise exception 'agent: rate_limited (15 new contacts per day)';
  end if;
  insert into outreach_contacts (name, url, kind, country, audience, contact, angle, priority, added_by_agent)
  values (c.name, c.url, coalesce(c.kind, 'otro'), c.country, c.audience, c.contact, c.angle, coalesce(c.priority, 3), t.name)
  returning * into c;
  insert into outreach_events (contact_id, kind, topic, body, agent) values (c.id, 'auto', 'new', 'Ficha propuesta por el asistente.', t.name);
  return jsonb_build_object('ok', true, 'contact', public._outreach_json(c));
exception when unique_violation then raise exception 'agent: invalid url (already in the list)';
end $$;

-- Complète une fiche : moyen de contact, audience, approche, priorité. Rien d'autre.
create function public.agent_outreach_update(p_hash text, p_args jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t agent_tokens; c outreach_contacts; old outreach_contacts; a jsonb := coalesce(p_args, '{}'); changes text[] := '{}';
begin
  t := public._agent_require(p_hash, 'difusion');
  old := public._agent_outreach(public._agent_uuid(a, 'contact_id'));
  perform public._agent_outreach_quota(old.id);
  c := public._outreach_clean(old, jsonb_strip_nulls(jsonb_build_object('contact', a ->> 'contact', 'audience', a ->> 'audience',
    'angle', a ->> 'angle', 'priority', a ->> 'priority', 'country', a ->> 'country')));
  if c.contact is distinct from old.contact then changes := changes || ('contacto: ' || coalesce(c.contact, '—')); end if;
  if c.audience is distinct from old.audience then changes := changes || ('audiencia: ' || coalesce(c.audience, '—')); end if;
  if c.angle is distinct from old.angle then changes := changes || 'ángulo actualizado'::text; end if;
  if c.priority is distinct from old.priority then changes := changes || ('prioridad: ' || c.priority); end if;
  if c.country is distinct from old.country then changes := changes || ('país: ' || coalesce(c.country, '—')); end if;
  if cardinality(changes) = 0 then return jsonb_build_object('ok', true, 'changed', false, 'contact', public._outreach_json(old)); end if;
  update outreach_contacts set contact = c.contact, audience = c.audience, angle = c.angle, priority = c.priority, country = c.country, updated_at = now()
  where id = old.id returning * into c;
  insert into outreach_events (contact_id, kind, topic, body, agent) values (c.id, 'auto', 'update', 'Ficha completada: ' || array_to_string(changes, ' · ') || '.', t.name);
  return jsonb_build_object('ok', true, 'changed', true, 'contact', public._outreach_json(c));
end $$;

create function public.agent_outreach_note(p_hash text, p_args jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t agent_tokens; c outreach_contacts; ev outreach_events;
begin
  t := public._agent_require(p_hash, 'difusion');
  c := public._agent_outreach(public._agent_uuid(p_args, 'contact_id'));
  perform public._agent_outreach_quota(c.id);
  insert into outreach_events (contact_id, kind, topic, body, agent)
  values (c.id, 'note', 'note', public._agent_text(p_args, 'text', 2000, true), t.name) returning * into ev;
  update outreach_contacts set updated_at = now() where id = c.id;
  return jsonb_build_object('ok', true, 'event_id', ev.id, 'at', ev.created_at);
end $$;

create function public.agent_outreach_draft(p_hash text, p_args jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t agent_tokens; c outreach_contacts; ev outreach_events; ch text; subj text; txt text;
begin
  t := public._agent_require(p_hash, 'difusion');
  ch := coalesce(public._agent_text(p_args, 'channel', 20), 'email');
  subj := public._agent_text(p_args, 'subject', 150);
  txt := public._agent_text(p_args, 'text', 3000, true);
  c := public._agent_outreach(public._agent_uuid(p_args, 'contact_id'));
  if ch not in ('email', 'formulario', 'facebook', 'youtube', 'instagram', 'foro', 'reddit', 'otro') then
    raise exception 'agent: invalid channel (email, formulario, facebook, youtube, instagram, foro, reddit, otro)';
  end if;
  perform public._agent_outreach_quota(c.id);
  insert into outreach_events (contact_id, kind, topic, body, agent)
  values (c.id, 'draft', ch, case when subj is not null then 'Asunto: ' || subj || E'\n\n' || txt else txt end, t.name) returning * into ev;
  update outreach_contacts set updated_at = now() where id = c.id;
  return jsonb_build_object('ok', true, 'event_id', ev.id, 'at', ev.created_at, 'channel', ch,
    'note', 'Brouillon enregistré dans la fiche : l''équipe le relit et l''envoie elle-même.');
end $$;

create function public.agent_outreach_followup(p_hash text, p_args jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t agent_tokens; c outreach_contacts; act text; due date; today date := public._crm_today();
begin
  t := public._agent_require(p_hash, 'difusion');
  act := public._agent_text(p_args, 'action', 200, true);
  due := public._agent_date(p_args, 'due');
  c := public._agent_outreach(public._agent_uuid(p_args, 'contact_id'));
  if due is null then raise exception 'agent: invalid due (required, YYYY-MM-DD)'; end if;
  if due < today or due > today + 120 then raise exception 'agent: invalid due (between % and %)', today, today + 120; end if;
  perform public._agent_outreach_quota(c.id);
  update outreach_contacts set next_action = act, next_due = due, updated_at = now() where id = c.id returning * into c;
  insert into outreach_events (contact_id, kind, topic, body, agent)
  values (c.id, 'auto', 'next', format('Próxima acción: «%s» para el %s.', act, public._crm_day(due)), t.name);
  return jsonb_build_object('ok', true, 'contact', public._outreach_json(c));
end $$;

-- Lien vers pathway-languages.com vu en ligne par l'assistant : statut « enlace ».
create function public.agent_outreach_link(p_hash text, p_args jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t agent_tokens; c outreach_contacts; lnk text;
begin
  t := public._agent_require(p_hash, 'difusion');
  lnk := public._agent_text(p_args, 'link_url', 500, true);
  if lnk !~* '^https?://[^\s]+$' then raise exception 'agent: invalid link_url (http(s)://…)'; end if;
  c := public._agent_outreach(public._agent_uuid(p_args, 'contact_id'));
  perform public._agent_outreach_quota(c.id);
  update outreach_contacts set status = 'enlace', link_url = lnk, link_at = coalesce(link_at, now()), next_action = null, next_due = null, updated_at = now()
  where id = c.id returning * into c;
  insert into outreach_events (contact_id, kind, topic, body, agent) values (c.id, 'auto', 'status', 'Enlace visto en línea: ' || lnk, t.name);
  return jsonb_build_object('ok', true, 'contact', public._outreach_json(c));
end $$;

-- ─────────────────────────────────────────────────────────────
-- Droits
-- ─────────────────────────────────────────────────────────────
revoke execute on function public._outreach_json(public.outreach_contacts), public._outreach_status_label(text),
  public._outreach_clean(public.outreach_contacts, jsonb), public._agent_outreach(uuid), public._agent_outreach_quota(uuid),
  public.agent_outreach_list(text, jsonb), public.agent_outreach_get(text, jsonb), public.agent_outreach_add(text, jsonb),
  public.agent_outreach_update(text, jsonb), public.agent_outreach_note(text, jsonb), public.agent_outreach_draft(text, jsonb),
  public.agent_outreach_followup(text, jsonb), public.agent_outreach_link(text, jsonb),
  public.outreach_list(), public.outreach_contact(uuid), public.outreach_save(uuid, jsonb), public.outreach_set_status(uuid, text),
  public.outreach_note(uuid, text), public.outreach_archive(uuid)
  from public, anon, authenticated;
grant execute on function public.agent_outreach_list(text, jsonb), public.agent_outreach_get(text, jsonb), public.agent_outreach_add(text, jsonb),
  public.agent_outreach_update(text, jsonb), public.agent_outreach_note(text, jsonb), public.agent_outreach_draft(text, jsonb),
  public.agent_outreach_followup(text, jsonb), public.agent_outreach_link(text, jsonb)
  to service_role;
grant execute on function public.outreach_list(), public.outreach_contact(uuid), public.outreach_save(uuid, jsonb), public.outreach_set_status(uuid, text),
  public.outreach_note(uuid, text), public.outreach_archive(uuid)
  to authenticated;

commit;

notify pgrst, 'reload schema';
