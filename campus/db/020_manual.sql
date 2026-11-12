-- Campus Pathway · 020 · le manuel se lit dans le Campus et s'ouvre au fil des cours
-- À exécuter après 019 (SQL Editor → New query → Run).
--
-- • Les documents du programme se lisent dans le Campus (lecteur intégré, sans bouton de
--   téléchargement). Pour un manuel, le Campus repère au dépôt la première page de chaque unité.
-- • Avec « Apertura de las unidades » activé dans « Ajustes », l'élève ne lit que les pages des
--   unités vues en cours (rapport de fin de cours), plus le début du manuel.
-- • Le rapport de fin de cours peut cocher les 64 unités d'un niveau, même celles qui n'ont pas
--   encore d'exercices dans le Campus.

begin;

-- Première page de chaque unité (unit_pages[1] = unité 1) et nombre de pages, repérés au dépôt.
alter table public.level_documents add column if not exists unit_pages int[];
alter table public.level_documents add column if not exists page_count int;

-- Unités vues en cours, par numéro (avec ou sans exercices dans le Campus).
create table public.taught_numbers (
  student_id uuid not null references public.profiles (id) on delete cascade,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2')),
  number int not null check (number between 1 and 64),
  first_at timestamptz not null default now(),
  primary key (student_id, level, number)
);
alter table public.taught_numbers enable row level security;
revoke all on public.taught_numbers from anon, authenticated;
grant select on public.taught_numbers to authenticated;
create policy "taught_numbers: les siennes ou celles de ses élèves" on public.taught_numbers for select to authenticated
  using (student_id = auth.uid() or public.teaches(student_id));

alter table public.session_reports add column if not exists unit_numbers int[] not null default '{}';

-- Rapport de fin de cours par numéros d'unité (remplace l'usage de celle du 018).
create function public.save_class_report(p_group uuid, p_scheduled timestamptz, p_numbers int[], p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare g class_groups; nums int[] := coalesce((select array_agg(distinct x order by x) from unnest(coalesce(p_numbers, '{}')) x where x between 1 and 64), '{}');
  ids text[];
begin
  select * into g from class_groups where id = p_group;
  if not found or not (public.my_role() = 'admin' or g.teacher_id = auth.uid()) then raise exception 'not your group'; end if;
  if not exists (select 1 from public._group_sessions(p_group, now() - interval '30 days', now() + interval '1 day') s
                 where s.scheduled_at = p_scheduled and s.status <> 'cancelled') then raise exception 'unknown class'; end if;
  select coalesce(array_agg(u.id), '{}') into ids from units u where u.level = g.level and not u.is_final and u.number = any(nums);
  insert into session_reports (group_id, scheduled_at, teacher_id, unit_ids, unit_numbers, note)
  values (p_group, p_scheduled, auth.uid(), ids, nums, nullif(left(trim(coalesce(p_note, '')), 1000), ''))
  on conflict (group_id, scheduled_at) do update set unit_ids = excluded.unit_ids, unit_numbers = excluded.unit_numbers,
    note = excluded.note, teacher_id = excluded.teacher_id, created_at = now();
  insert into taught_units (student_id, unit_id)
  select p.id, x from profiles p cross join unnest(ids) x where p.group_id = p_group and p.role = 'student'
  on conflict do nothing;
  insert into taught_numbers (student_id, level, number)
  select p.id, g.level, x from profiles p cross join unnest(nums) x where p.group_id = p_group and p.role = 'student'
  on conflict do nothing;
end $$;

-- Les rapports renvoient aussi les numéros (remplace celle du 018).
create or replace function public.staff_session_reports() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'staff only'; end if;
  return coalesce((select jsonb_agg(x order by x->>'at' desc) from (
    select jsonb_build_object('group_id', g.id, 'group', g.name, 'level', g.level, 'scheduled_at', s.scheduled_at, 'at', s.actual_at,
      'students', (select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.full_name)), '[]'::jsonb) from profiles p where p.group_id = g.id and p.role = 'student'),
      'report', (select jsonb_build_object('unit_ids', r.unit_ids, 'unit_numbers', r.unit_numbers, 'note', r.note, 'created_at', r.created_at)
                 from session_reports r where r.group_id = g.id and r.scheduled_at = s.scheduled_at)) x
    from class_groups g
    cross join lateral public._group_sessions(g.id, now() - interval '14 days', now()) s
    where (public.my_role() = 'admin' or g.teacher_id = auth.uid()) and s.status <> 'cancelled'
      and s.actual_at + make_interval(mins => s.duration_min) < now()) t), '[]'::jsonb);
end $$;

-- L'admin enregistre les pages repérées dans un manuel.
create function public.set_document_pages(p_id uuid, p_unit_pages int[], p_page_count int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() is distinct from 'admin' then raise exception 'admin only'; end if;
  update level_documents set unit_pages = case when cardinality(coalesce(p_unit_pages, '{}')) = 0 then null else p_unit_pages end,
    page_count = p_page_count where id = p_id;
end $$;

revoke execute on function public.save_class_report(uuid, timestamptz, int[], text), public.set_document_pages(uuid, int[], int) from public, anon;
grant execute on function public.save_class_report(uuid, timestamptz, int[], text), public.set_document_pages(uuid, int[], int) to authenticated;

commit;
