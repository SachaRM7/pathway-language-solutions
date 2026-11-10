-- Campus Pathway · 004 · gestion des membres par l'admin, depuis le Campus
-- À exécuter après 003 (SQL Editor → New query → Run).
-- L'admin voit tous les comptes (élèves et professeurs), peut modifier le nom, le niveau, le rôle
-- et le professeur, et supprimer un compte avec toutes ses données. Un admin ne peut ni se modifier
-- lui-même ici ni toucher à un autre admin.

begin;

create function public.admin_members() returns table (
  id uuid, email text, full_name text, role text, level text, teacher_id uuid, teacher_name text,
  onboarded boolean, last_activity timestamptz, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select p.id, u.email::text, p.full_name, p.role, p.level, p.teacher_id, t.full_name,
    p.onboarded_at is not null,
    (select max(x.created_at) from xp_events x where x.user_id = p.id),
    p.created_at
  from profiles p
  join auth.users u on u.id = p.id
  left join profiles t on t.id = p.teacher_id
  where public.my_role() = 'admin' and p.role <> 'admin'
  order by p.role desc, p.full_name
$$;

create function public.admin_update_member(p_user uuid, p_full_name text, p_level text, p_teacher uuid, p_role text)
returns void
language plpgsql security definer set search_path = public as $$
declare target profiles;
begin
  if public.my_role() is distinct from 'admin' then raise exception 'admin only'; end if;
  select * into target from profiles where id = p_user;
  if not found then raise exception 'unknown member'; end if;
  if target.role = 'admin' or p_user = auth.uid() then raise exception 'cannot edit an admin'; end if;
  if p_role not in ('student', 'teacher') then raise exception 'bad role'; end if;
  if p_level not in ('A1', 'A2', 'B1', 'B2') then raise exception 'bad level'; end if;
  if length(trim(coalesce(p_full_name, ''))) = 0 then raise exception 'name required'; end if;
  if p_role = 'student' and p_teacher is not null
     and not exists (select 1 from profiles where id = p_teacher and role in ('teacher', 'admin')) then
    raise exception 'unknown teacher';
  end if;
  update profiles set
    full_name = left(trim(p_full_name), 120),
    level = p_level,
    role = p_role,
    teacher_id = case when p_role = 'student' then p_teacher else null end
  where id = p_user;
  -- A former teacher's students keep their data but lose the link; the admin reassigns them.
  if target.role = 'teacher' and p_role = 'student' then
    update profiles set teacher_id = null where teacher_id = p_user;
  end if;
end $$;

create function public.admin_delete_member(p_user uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
declare target profiles; target_email text;
begin
  if public.my_role() is distinct from 'admin' then raise exception 'admin only'; end if;
  select * into target from public.profiles where id = p_user;
  if not found then raise exception 'unknown member'; end if;
  if target.role = 'admin' or p_user = auth.uid() then raise exception 'cannot delete an admin'; end if;
  select email into target_email from auth.users where id = p_user;
  delete from public.invitations where email = lower(target_email);
  -- Deleting the auth account removes the profile and all its data (foreign keys cascade).
  delete from auth.users where id = p_user;
end $$;

revoke execute on function public.admin_members(), public.admin_update_member(uuid, text, text, uuid, text),
  public.admin_delete_member(uuid) from public, anon;
grant execute on function public.admin_members(), public.admin_update_member(uuid, text, text, uuid, text),
  public.admin_delete_member(uuid) to authenticated;

commit;
