-- Campus Pathway · 044 · un « monde démo » séparé du vrai Campus
--
-- Les comptes de démonstration (profiles.is_demo) forment un monde à part :
--   - l'équipe réelle ne les voit nulle part (listes, alertes, Bandeja, rapports, bots) ;
--   - un compte démo ne voit que la démo ;
--   - aucune tâche programmée ne leur écrit (rappels, absences, messagerie) ;
--   - leurs actions ne créent pas de fiche dans le CRM.
--
-- La règle centrale est « même monde » : un membre de l'équipe ne voit un élève ou un groupe que s'ils sont
-- tous les deux réels, ou tous les deux démo. Sans utilisateur connecté (tâches programmées), on est dans
-- le monde réel.
--
-- Les fonctions existantes sont corrigées par remplacement de texte ciblé : chaque correction vérifie que
-- le texte d'origine est présent exactement une fois, sinon toute la migration échoue sans rien changer.

alter table public.profiles add column if not exists is_demo boolean not null default false;

create or replace function public._is_demo(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_demo from public.profiles where id = p), false)
$$;

create or replace function public._demo_me() returns boolean
language sql stable security definer set search_path = public as $$
  select public._is_demo(auth.uid())
$$;

create or replace function public._same_world(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public._is_demo(p) = public._demo_me()
$$;

revoke all on function public._is_demo(uuid), public._demo_me(), public._same_world(uuid) from public, anon;
grant execute on function public._is_demo(uuid), public._demo_me(), public._same_world(uuid) to authenticated;

-- Remplacement ciblé dans le code d'une fonction existante.
create or replace function pg_temp._patch(fn regprocedure, a text, b text) returns void
language plpgsql as $$
declare d text := pg_get_functiondef(fn); n int;
begin
  n := (length(d) - length(replace(d, a, ''))) / length(a);
  if n <> 1 then raise exception 'patch %: % occurrence(s) of «%»', fn, n, left(a, 80); end if;
  execute replace(d, a, b);
end $$;

-- 1. Qui voit quel élève : un admin ne voit que les élèves de son monde.
select pg_temp._patch('public.teaches(uuid)',
  $x$me.role = 'admin' or (me.role = 'teacher'$x$,
  $x$(me.role = 'admin' and public._same_world(student)) or (me.role = 'teacher'$x$);

-- 2. Écrans fondés sur les groupes (horaires, présences, cours, rapports de cours, changements).
select pg_temp._patch('public.staff_groups()',
  $x$public.my_role() = 'admin' or g.teacher_id = auth.uid()$x$,
  $x$(public.my_role() = 'admin' and public._same_world(g.teacher_id)) or g.teacher_id = auth.uid()$x$);
select pg_temp._patch('public.staff_attendance()',
  $x$public.my_role() = 'admin' or g.teacher_id = auth.uid()$x$,
  $x$(public.my_role() = 'admin' and public._same_world(g.teacher_id)) or g.teacher_id = auth.uid()$x$);
select pg_temp._patch('public.staff_class_log()',
  $x$public.my_role() = 'admin' or g.teacher_id = auth.uid()$x$,
  $x$(public.my_role() = 'admin' and public._same_world(g.teacher_id)) or g.teacher_id = auth.uid()$x$);
select pg_temp._patch('public.staff_session_reports()',
  $x$public.my_role() = 'admin' or g.teacher_id = auth.uid()$x$,
  $x$(public.my_role() = 'admin' and public._same_world(g.teacher_id)) or g.teacher_id = auth.uid()$x$);
select pg_temp._patch('public.list_schedule_changes()',
  $x$public.my_role() = 'admin' or g.teacher_id = auth.uid()$x$,
  $x$(public.my_role() = 'admin' and public._same_world(g.teacher_id)) or g.teacher_id = auth.uid()$x$);

-- 3. Membres et liste des professeurs.
select pg_temp._patch('public.admin_members()',
  $x$p.role <> 'admin'$x$,
  $x$p.role <> 'admin' and public._same_world(p.id)$x$);
select pg_temp._patch('public.list_teachers()',
  $x$and public.is_staff()$x$,
  $x$and public.is_staff() and public._same_world(p.id)$x$);

-- 4. Tâches programmées : jamais d'e-mail à un compte démo.
select pg_temp._patch('public.due_reminders()',
  $x$join profiles p on p.group_id = g.id and p.role = 'student'$x$,
  $x$join profiles p on p.group_id = g.id and p.role = 'student' and not p.is_demo$x$);
select pg_temp._patch('public.due_absence_notices()',
  $x$where x.role = 'student' and u.email is not null loop$x$,
  $x$where x.role = 'student' and not x.is_demo and u.email is not null loop$x$);
select pg_temp._patch('public.due_absence_warnings()',
  $x$where p.role = 'student' and u.email is not null loop$x$,
  $x$where p.role = 'student' and not p.is_demo and u.email is not null loop$x$);
select pg_temp._patch('public.due_message_emails()',
  $x$where t.needs_staff and t.needs_staff_since$x$,
  $x$where not s.is_demo and t.needs_staff and t.needs_staff_since$x$);
select pg_temp._patch('public.due_message_emails()',
  $x$where t.last_staff_at is not null and$x$,
  $x$where not s.is_demo and t.last_staff_at is not null and$x$);

-- 5. Rapport du lundi.
select pg_temp._patch('public.weekly_report_data(timestamp with time zone)',
  $x$l on true$x$,
  $x$l on true where not public._is_demo(g.teacher_id)$x$);
select pg_temp._patch('public.weekly_report_data(timestamp with time zone)',
  $x$from profiles p, w where p.role = 'student' and p.onboarded_at is not null$x$,
  $x$from profiles p, w where p.role = 'student' and not p.is_demo and p.onboarded_at is not null$x$);
select pg_temp._patch('public.weekly_report_data(timestamp with time zone)',
  $x$(select count(*) from lesson_runs r, w where r.finished_at$x$,
  $x$(select count(*) from lesson_runs r, w where not public._is_demo(r.user_id) and r.finished_at$x$);
select pg_temp._patch('public.weekly_report_data(timestamp with time zone)',
  $x$w where r.focus_lost > 0$x$,
  $x$w where not p.is_demo and r.focus_lost > 0$x$);
select pg_temp._patch('public.weekly_report_data(timestamp with time zone)',
  $x$where role = 'student' and group_id is null)$x$,
  $x$where role = 'student' and not is_demo and group_id is null)$x$);

-- 6. Outils des bots (MCP) : élèves à risque, bilans hebdomadaire et mensuel.
select pg_temp._patch('public._agent_risk()',
  $x$where p.role = 'student' loop$x$,
  $x$where p.role = 'student' and not p.is_demo loop$x$);
select pg_temp._patch('public._agent_classes(timestamp with time zone, timestamp with time zone, uuid)',
  $x$where (p_group is null or g.id = p_group)$x$,
  $x$where not public._is_demo(g.teacher_id) and (p_group is null or g.id = p_group)$x$);
select pg_temp._patch('public.agent_weekly_summary(text, jsonb)',
  $x$where tp.role in ('teacher', 'admin') and exists$x$,
  $x$where tp.role in ('teacher', 'admin') and not tp.is_demo and exists$x$);
select pg_temp._patch('public.agent_monthly_report(text, jsonb)',
  $x$from profiles s where s.role = 'student' and ($x$,
  $x$from profiles s where s.role = 'student' and not s.is_demo and ($x$);
select pg_temp._patch('public.agent_monthly_report(text, jsonb)',
  $x$from profiles where role = 'student' and group_id is not null)$x$,
  $x$from profiles where role = 'student' and not is_demo and group_id is not null)$x$);
select pg_temp._patch('public.agent_monthly_report(text, jsonb)',
  $x$(select count(*) from profiles where role = 'student'),$x$,
  $x$(select count(*) from profiles where role = 'student' and not is_demo),$x$);
select pg_temp._patch('public.agent_monthly_report(text, jsonb)',
  $x$from profiles where role = 'student' and created_at >= f$x$,
  $x$from profiles where role = 'student' and not is_demo and created_at >= f$x$);
select pg_temp._patch('public.agent_monthly_report(text, jsonb)',
  $x$from contract_signatures where signed_at >= f$x$,
  $x$from contract_signatures where not public._is_demo(student_id) and signed_at >= f$x$);
select pg_temp._patch('public.agent_monthly_report(text, jsonb)',
  $x$from level_validations where promoted_at >= f$x$,
  $x$from level_validations where not public._is_demo(student_id) and promoted_at >= f$x$);
select pg_temp._patch('public.agent_monthly_report(text, jsonb)',
  $x$public._group_attendance(g.id, f, t) x),$x$,
  $x$public._group_attendance(g.id, f, t) x where not public._is_demo(g.teacher_id)),$x$);

-- 7. Le CRM ignore les comptes démo (contrat signé, entrée en classe).
select pg_temp._patch('public._crm_on_contract()',
  $x$begin perform$x$,
  $x$begin if public._is_demo(new.student_id) then return new; end if; perform$x$);
select pg_temp._patch('public._crm_on_class()',
  $x$begin
  perform public._crm_feed_active$x$,
  $x$begin
  if public._is_demo(new.student_id) then return new; end if;
  perform public._crm_feed_active$x$);

-- 8. Personne ne peut se déclarer « démo » soi-même : la colonne n'est modifiable que par le serveur.
create or replace function public._protect_is_demo() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon') and new.is_demo is distinct from old.is_demo then
    new.is_demo := old.is_demo;
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect_is_demo on public.profiles;
create trigger profiles_protect_is_demo before update on public.profiles
  for each row execute function public._protect_is_demo();
