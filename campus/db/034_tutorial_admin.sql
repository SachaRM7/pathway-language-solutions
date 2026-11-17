-- Campus Pathway · 034 · tutoriel de l'espace « Admin »
-- À exécuter après 033. Le Campus retient aussi, sur le compte, que le tutoriel « admin » a été vu.

create or replace function public.mark_tour_seen(p_tour text) returns void
language sql security definer set search_path to 'public' as $$
  update public.profiles set tours = tours || jsonb_build_object(p_tour, now())
  where id = auth.uid() and (p_tour in ('student', 'teacher') or (p_tour = 'admin' and public.is_admin()));
$$;
