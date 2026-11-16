-- Campus Pathway · 028 · annuler un passage de niveau fait par erreur, et « toutes les unités
-- réussies » seulement s'il y a des unités publiées.
-- À exécuter après 027 (ou après 012 si les suivants ne sont pas installés) : SQL Editor → New query → Run.
--
-- • undo_level_promotion(élève) : remet l'élève au niveau d'où il vient de passer et efface la
--   validation de ce niveau (examen du prof et examen final du Campus), pour pouvoir la refaire.
--   Réservé à son professeur ou à un admin, dans les 14 jours, et seulement si son niveau n'a pas
--   changé depuis.
-- • _level_units_done : un niveau sans aucune unité publiée ne compte plus comme « toutes les unités
--   réussies » (avant, c'était vrai par défaut, et le bouton « Validar el examen » passait l'élève
--   sans rien demander).

begin;

create or replace function public._level_units_done(p_user uuid, p_level text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
      select 1 from units u
      where u.level = p_level and not u.is_final
        and exists (select 1 from exercises e where e.unit_id = u.id and e.status = 'validated'))
    and not exists (
      select 1 from units u
      where u.level = p_level and not u.is_final
        and exists (select 1 from exercises e where e.unit_id = u.id and e.status = 'validated')
        and not exists (select 1 from lesson_runs r where r.user_id = p_user and r.unit_id = u.id and r.first_try_correct * 100 >= 75 * r.total))
$$;

create or replace function public.undo_level_promotion(p_student uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v level_validations;
  cur text;
begin
  if public.my_role() not in ('admin', 'teacher') or not public.teaches(p_student) then raise exception 'not allowed'; end if;
  select * into v from level_validations
   where student_id = p_student and promoted_at is not null
   order by promoted_at desc limit 1;
  if not found then raise exception 'nothing to undo'; end if;
  if v.promoted_at < now() - interval '14 days' then raise exception 'too old'; end if;
  select level into cur from profiles where id = p_student;
  if v.promoted_to is null or cur is distinct from v.promoted_to then raise exception 'level changed since'; end if;
  update profiles set level = v.level where id = p_student;
  delete from level_validations where student_id = p_student and level = v.level;
  return jsonb_build_object('level', v.level, 'from', v.promoted_to);
end $$;

revoke all on function public.undo_level_promotion(uuid) from public, anon;
grant execute on function public.undo_level_promotion(uuid) to authenticated;

commit;
