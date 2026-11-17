-- Campus Pathway · 032 · difusión : cupo de 20 envíos sobre 24 h glissantes, avec l'heure du prochain envoi
-- À exécuter après 031. Le Campus affiche « Quedan N de 20 » sous « Enviar desde ryan@ » et, à la
-- limite, le jour et l'heure où le suivant pourra partir (outreach-send renvoie retry_at).

begin;

create or replace function public._outreach_quota() returns jsonb
language sql stable security definer set search_path = public as $$
  with s as (select created_at from outreach_events where kind = 'auto' and topic = 'sent' and created_at > now() - interval '24 hours')
  select jsonb_build_object('used', (select count(*) from s), 'limit', 20,
    'next_at', case when (select count(*) from s) >= 20 then (select created_at + interval '24 hours' from s order by created_at offset (select count(*) from s) - 20 limit 1) end)
$$;

create function public.outreach_send_quota() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return public._outreach_quota();
end $$;

create or replace function public.outreach_send_prepare(p_event bigint) returns jsonb
language plpgsql security definer set search_path = public as $$
declare e outreach_events; c outreach_contacts; v_to text; v_subject text; q jsonb;
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
  q := public._outreach_quota();
  if (q ->> 'used')::int >= 20 then
    raise exception 'daily limit %', to_char((q ->> 'next_at')::timestamptz at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
  end if;
  update outreach_contacts set sending_at = now() where id = c.id and (sending_at is null or sending_at < now() - interval '2 minutes');
  if not found then raise exception 'already sending'; end if;
  return jsonb_build_object('contact_id', c.id, 'name', c.name, 'to', v_to, 'subject', v_subject, 'text', public._outreach_text(e.body));
end $$;

revoke execute on function public._outreach_quota(), public.outreach_send_quota() from public, anon;
revoke execute on function public._outreach_quota() from authenticated;
grant execute on function public.outreach_send_quota() to authenticated;

commit;

notify pgrst, 'reload schema';
