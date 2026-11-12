-- Campus Pathway · 010 · sorties d'écran pendant une unité (décision de la réunion avec Ryan)
-- À exécuter après 009 (SQL Editor → New query → Run).
-- Le Campus compte les fois où l'élève quitte l'onglet pendant qu'une question est affichée.
-- L'élève est prévenu avant de commencer et à chaque retour ; le total est gardé avec la leçon
-- terminée, et son professeur le voit dans « Necesitan atención ». Quitter une unité pour la
-- reprendre plus tard reste permis.

begin;

alter table public.lesson_runs add column if not exists focus_lost int not null default 0;

-- Élève : enregistre le nombre de sorties sur sa dernière leçon terminée de cette unité.
create function public.record_focus_lost(p_unit text, p_count int) returns void
language sql security definer set search_path = public as $$
  update lesson_runs set focus_lost = least(greatest(p_count, 0), 999)
   where id = (select id from lesson_runs where user_id = auth.uid() and unit_id = p_unit order by finished_at desc limit 1)
$$;

-- Professeur : leçons des 14 derniers jours où l'élève a quitté l'onglet pendant une question.
create function public.teacher_focus_alerts() returns table (student_id uuid, unit_id text, focus_lost int, finished_at timestamptz, first_try_correct int, total int)
language sql stable security definer set search_path = public as $$
  select r.user_id, r.unit_id, r.focus_lost, r.finished_at, r.first_try_correct, r.total
  from lesson_runs r
  where r.focus_lost > 0 and r.finished_at > now() - interval '14 days' and public.teaches(r.user_id)
  order by r.finished_at desc
  limit 50
$$;

revoke execute on function public.record_focus_lost(text, int), public.teacher_focus_alerts() from public, anon;
grant execute on function public.record_focus_lost(text, int), public.teacher_focus_alerts() to authenticated;

commit;
