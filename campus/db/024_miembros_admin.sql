-- Campus Pathway · 024 · les admins apparaissent dans « Miembros »
-- À exécuter après 023 (SQL Editor → New query → Run).
--
-- • Jusqu'ici, la liste « Cuentas → Miembros » cachait tous les comptes admin. Un prof passé
--   admin (pour voir les Prospectos) semblait donc avoir disparu.
-- • Désormais, la liste montre tout le monde sauf soi-même. Les admins y sont marqués
--   « Administración » et restent protégés : on ne peut toujours ni les modifier ni les
--   supprimer depuis le Campus.

begin;

create or replace function public.admin_members() returns table (
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
  where public.my_role() = 'admin' and p.id <> auth.uid()
  order by case p.role when 'admin' then 0 when 'teacher' then 1 else 2 end, p.full_name
$$;

commit;
