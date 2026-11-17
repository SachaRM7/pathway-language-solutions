-- Campus Pathway · 031 · difusión : envoi direct d'un brouillon de correo depuis le Campus
-- À exécuter après 030, puis déployer la fonction « outreach-send » (Verify JWT activé) et
-- ajouter le secret ZOHO_SMTP_PASSWORD (mot de passe d'application Zoho du compte principal).
--
-- • Un admin relit le brouillon dans la fiche (et peut le corriger), puis « Enviar desde ryan@ » :
--   la fonction envoie le message par le SMTP de Zoho et la fiche passe à « Contactado », avec
--   la relance prévue à 7 jours.
-- • Garde-fous : seulement les brouillons de correo pas encore envoyés, d'un contact actif avec
--   une adresse e-mail ; un envoi à la fois par fiche (verrou de 2 minutes) ; 20 envois par
--   jour au plus. L'assistant ne peut toujours rien envoyer : ces fonctions sont réservées aux admins.

begin;

alter table public.outreach_contacts add column if not exists sending_at timestamptz;

create function public._outreach_subject(p_body text) returns text
language sql immutable as $$ select substring(p_body from '^Asunto: ([^\n]+)\n\n') $$;
create function public._outreach_text(p_body text) returns text
language sql immutable as $$ select case when p_body ~ '^Asunto: [^\n]+\n\n' then regexp_replace(p_body, '^Asunto: [^\n]+\n\n', '') else p_body end $$;
create function public._outreach_email(p_contact text) returns text
language sql immutable as $$ select lower(substring(coalesce(p_contact, '') from '[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+')) $$;

-- Corrige un brouillon pas encore envoyé (objet et texte).
create function public.outreach_draft_update(p_event bigint, p_subject text, p_body text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare e outreach_events; c outreach_contacts; s text := nullif(trim(coalesce(p_subject, '')), ''); b text := nullif(trim(coalesce(p_body, '')), '');
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into e from outreach_events where id = p_event and kind = 'draft';
  if not found then raise exception 'not found'; end if;
  select * into c from outreach_contacts where id = e.contact_id and archived_at is null;
  if not found then raise exception 'not found'; end if;
  if c.contacted_at is not null and c.contacted_at >= e.created_at then raise exception 'already sent'; end if;
  if b is null or length(b) > 3000 or length(s) > 150 then raise exception 'invalid text'; end if;
  update outreach_events set body = case when s is not null then 'Asunto: ' || s || E'\n\n' || b else b end where id = p_event;
  update outreach_contacts set updated_at = now() where id = c.id;
  return jsonb_build_object('ok', true);
end $$;

-- Vérifie qu'un brouillon peut partir, pose le verrou et renvoie ce qu'il faut envoyer.
create function public.outreach_send_prepare(p_event bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare e outreach_events; c outreach_contacts; v_to text; v_subject text;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into e from outreach_events where id = p_event and kind = 'draft';
  if not found then raise exception 'not found'; end if;
  select * into c from outreach_contacts where id = e.contact_id and archived_at is null;
  if not found then raise exception 'not found'; end if;
  if e.topic <> 'email' then raise exception 'not an email draft'; end if;
  if c.status not in ('por_contactar', 'contactado', 'respondio') then raise exception 'contact closed'; end if;
  if c.contacted_at is not null and c.contacted_at >= e.created_at then raise exception 'already sent'; end if;
  v_to := public._outreach_email(c.contact);
  if v_to is null then raise exception 'no email'; end if;
  v_subject := public._outreach_subject(e.body);
  if v_subject is null then raise exception 'no subject'; end if;
  if (select count(*) from outreach_events where kind = 'auto' and topic = 'sent' and created_at > now() - interval '24 hours') >= 20 then
    raise exception 'daily limit';
  end if;
  update outreach_contacts set sending_at = now() where id = c.id and (sending_at is null or sending_at < now() - interval '2 minutes');
  if not found then raise exception 'already sending'; end if;
  return jsonb_build_object('contact_id', c.id, 'name', c.name, 'to', v_to, 'subject', v_subject, 'text', public._outreach_text(e.body));
end $$;

-- Après un envoi réussi : « Contactado », relance à 7 jours, ligne d'historique.
create function public.outreach_send_done(p_event bigint, p_from text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare e outreach_events; c outreach_contacts; r jsonb;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into e from outreach_events where id = p_event and kind = 'draft';
  if not found then raise exception 'not found'; end if;
  select * into c from outreach_contacts where id = e.contact_id;
  r := public.outreach_set_status(c.id, 'contactado');
  update outreach_contacts set sending_at = null where id = c.id;
  insert into outreach_events (contact_id, kind, topic, body, author_id)
  values (c.id, 'auto', 'sent', format('Correo enviado desde %s a %s: «%s».', left(coalesce(p_from, '?'), 120), public._outreach_email(c.contact), public._outreach_subject(e.body)), auth.uid());
  return r;
end $$;

-- Après un échec : on lève le verrou et on garde la raison dans l'historique.
create function public.outreach_send_failed(p_event bigint, p_error text) returns void
language plpgsql security definer set search_path = public as $$
declare e outreach_events;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into e from outreach_events where id = p_event;
  if not found then return; end if;
  update outreach_contacts set sending_at = null where id = e.contact_id;
  insert into outreach_events (contact_id, kind, topic, body, author_id)
  values (e.contact_id, 'auto', 'error', 'Envío fallido: ' || left(coalesce(nullif(trim(p_error), ''), 'error desconocido'), 300), auth.uid());
end $$;

revoke execute on function public._outreach_subject(text), public._outreach_text(text), public._outreach_email(text),
  public.outreach_draft_update(bigint, text, text), public.outreach_send_prepare(bigint), public.outreach_send_done(bigint, text),
  public.outreach_send_failed(bigint, text) from public, anon;
grant execute on function public.outreach_draft_update(bigint, text, text), public.outreach_send_prepare(bigint), public.outreach_send_done(bigint, text),
  public.outreach_send_failed(bigint, text) to authenticated;
revoke execute on function public._outreach_subject(text), public._outreach_text(text), public._outreach_email(text) from authenticated;

commit;

notify pgrst, 'reload schema';
