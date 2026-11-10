-- Campus Pathway · 003 · invitations préparées depuis le Campus
-- À exécuter après 001 et 002 (SQL Editor → New query → Run).
-- Un professeur ou l'admin prépare l'invitation (e-mail, nom, niveau, professeur). Quand la personne
-- crée son compte via l'e-mail d'invitation, son profil est configuré automatiquement.

begin;

create table public.invitations (
  email text primary key check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  full_name text not null check (length(full_name) between 1 and 120),
  level text not null default 'A2' check (level in ('A1', 'A2', 'B1', 'B2')),
  role text not null default 'student' check (role in ('student', 'teacher')),
  teacher_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
alter table public.invitations enable row level security;
create policy "invitations: les siennes, ou toutes pour l'admin" on public.invitations
  for select to authenticated using (public.my_role() = 'admin' or teacher_id = auth.uid() or created_by = auth.uid());
grant select on public.invitations to authenticated;

-- Applique une invitation à un profil existant.
create function public._apply_invitation(p_user uuid, p_email text) returns boolean
language plpgsql security definer set search_path = public as $$
declare inv invitations;
begin
  select * into inv from invitations where email = lower(p_email);
  if not found then return false; end if;
  update profiles set
    full_name = inv.full_name,
    level = inv.level,
    role = case when inv.role = 'teacher' then 'teacher' else role end,
    teacher_id = case when inv.role = 'student' then inv.teacher_id else teacher_id end
  where id = p_user and role <> 'admin';
  update invitations set accepted_at = coalesce(accepted_at, now()) where email = inv.email;
  return true;
end $$;

-- La création du profil applique l'invitation préparée, s'il y en a une.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  perform public._apply_invitation(new.id, new.email);
  return new;
end $$;

-- Préparer (ou mettre à jour) une invitation. Un professeur invite pour lui-même ; l'admin choisit le professeur
-- et peut aussi inviter un professeur (p_role = 'teacher'). Si le compte existe déjà, il est configuré tout de suite.
create function public.create_invitation(p_email text, p_full_name text, p_level text, p_teacher uuid, p_role text default 'student')
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me profiles;
  v_email text := lower(trim(p_email));
  v_teacher uuid;
  existing uuid;
begin
  select * into me from profiles where id = auth.uid();
  if me.role is null or me.role not in ('teacher', 'admin') then raise exception 'staff only'; end if;
  if p_role not in ('student', 'teacher') then raise exception 'bad role'; end if;
  if p_role = 'teacher' and me.role <> 'admin' then raise exception 'admin only'; end if;
  if p_role = 'student' then
    v_teacher := case when me.role = 'admin' then coalesce(p_teacher, me.id) else me.id end;
    if not exists (select 1 from profiles where id = v_teacher and role in ('teacher', 'admin')) then raise exception 'unknown teacher'; end if;
  end if;
  insert into invitations (email, full_name, level, role, teacher_id, created_by)
    values (v_email, trim(p_full_name), coalesce(p_level, 'A2'), p_role, v_teacher, me.id)
  on conflict (email) do update set full_name = excluded.full_name, level = excluded.level, role = excluded.role,
    teacher_id = excluded.teacher_id, created_by = excluded.created_by, created_at = now();
  select id into existing from auth.users where lower(email) = v_email;
  if existing is not null then perform public._apply_invitation(existing, v_email); end if;
  return jsonb_build_object('email', v_email, 'existing_account', existing is not null);
end $$;

-- Annuler une invitation pas encore acceptée.
create function public.cancel_invitation(p_email text) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from invitations
  where email = lower(trim(p_email)) and accepted_at is null
    and (public.my_role() = 'admin' or teacher_id = auth.uid() or created_by = auth.uid());
end $$;

-- Liste des professeurs, pour le formulaire d'invitation.
create function public.list_teachers() returns table (id uuid, full_name text, role text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.role from profiles p
  where p.role in ('teacher', 'admin') and public.is_staff()
  order by p.role desc, p.full_name
$$;

revoke execute on function public._apply_invitation(uuid, text), public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.create_invitation(text, text, text, uuid, text), public.cancel_invitation(text), public.list_teachers() from public, anon;
grant execute on function public.create_invitation(text, text, text, uuid, text), public.cancel_invitation(text), public.list_teachers() to authenticated;

commit;
