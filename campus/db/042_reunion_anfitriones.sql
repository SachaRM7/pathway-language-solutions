-- Campus Pathway · 042 · qui peut faire les réunions (formulaire « Proponer una reunión »)
-- À exécuter après 041 (SQL Editor → New query → Run).
--
-- meeting_hosts : les membres de l'équipe qui font les réunions avec les intéressés (Mi agenda →
-- « Hago reuniones con interesados »), avec leur lien Zoom, leur adresse d'envoi et leur fuseau,
-- pour préremplir la proposition sur la fiche.

begin;

create or replace function public.meeting_hosts() returns jsonb
language sql stable security definer set search_path = public as $$
  select case when public.is_admin() then coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.full_name, 'zoom_link', a.zoom_link,
    'sender_email', a.sender_email, 'timezone', public._staff_tz(p.id), 'hosts_meetings', a.hosts_meetings) order by p.full_name), '[]'::jsonb) end
  from profiles p join staff_agenda a on a.profile_id = p.id
  where p.role in ('teacher', 'admin')
$$;

commit;

notify pgrst, 'reload schema';
