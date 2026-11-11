-- 007 · Tutorials (campus/tour.js): remember, per account, which guided tours were seen,
-- so a tour opens by itself only once, whatever the device. Run once, after 006.

alter table public.profiles add column if not exists tours jsonb not null default '{}'::jsonb;

-- Marks a tour as seen for the signed-in user: 'student' or 'teacher'.
create or replace function public.mark_tour_seen(p_tour text)
returns void
language sql security definer set search_path = public as $$
  update public.profiles
     set tours = tours || jsonb_build_object(p_tour, now())
   where id = auth.uid() and p_tour in ('student', 'teacher');
$$;

revoke execute on function public.mark_tour_seen(text) from public, anon;
grant execute on function public.mark_tour_seen(text) to authenticated;
