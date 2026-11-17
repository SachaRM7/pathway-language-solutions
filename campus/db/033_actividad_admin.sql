-- Campus Pathway · 033 · espace « Admin » : ce que l'équipe a fait ces derniers jours
-- À exécuter après 032. Alimente le bloc « Hecho » de la Bandeja (Campus → mode Admin → Inicio) :
-- une ligne par action, avec la date, la personne et un lien vers l'endroit où elle a été faite.
-- Sources : solicitudes atendidas, cambios de horario aprobados o rechazados, invitaciones enviadas
-- y aceptadas, notas y movimientos en Prospectos, envíos y estados en Difusión, respuestas de WhatsApp.

begin;

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
        where e.created_at > since and e.author_id is not null and e.kind in ('auto', 'note')
      union all
      select e.created_at, e.author_id, 'captacion', c.name || ': ' || left(e.body, 140), '#difusion'
        from outreach_events e join outreach_contacts c on c.id = e.contact_id
        where e.created_at > since and e.author_id is not null and e.kind in ('auto', 'note')
      union all
      select m.sent_at, m.author_id, 'captacion', 'Respondió por WhatsApp a ' || coalesce(t.profile_name, 'un prospecto'), '#whatsapp'
        from wa_messages m join wa_threads t on t.id = m.thread_id
        where m.direction = 'out' and m.author_id is not null and m.sent_at > since
    ) a where a.at is not null
    order by a.at desc limit 60) s), '[]'::jsonb);
end $$;

revoke execute on function public.admin_activity(int) from public, anon;
grant execute on function public.admin_activity(int) to authenticated;

commit;

notify pgrst, 'reload schema';
