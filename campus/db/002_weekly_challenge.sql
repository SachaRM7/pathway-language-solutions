-- Campus Pathway · 002 · défi de la semaine et objectif de groupe
-- À exécuter après 001_init.sql (SQL Editor → New query → Run).
-- Défi : pratiquer 5 jours différents dans la semaine (lundi → dimanche, fuseau de l'élève), +50 XP une fois par semaine.
-- Objectif de groupe : XP cumulés cette semaine par les élèves du même professeur.

begin;

create table public.weekly_claims (
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, week_start)
);
alter table public.weekly_claims enable row level security;
create policy "weekly_claims: le sien ou ses élèves" on public.weekly_claims
  for select to authenticated using (user_id = auth.uid() or public.teaches(user_id));
grant select on public.weekly_claims to authenticated;

create function public.weekly_challenge() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  p profiles;
  today date;
  wk date;
  days int;
  group_xp int;
  group_size int;
begin
  select * into p from profiles where id = auth.uid();
  if not found then raise exception 'not signed in'; end if;
  today := (now() at time zone p.timezone)::date;
  wk := date_trunc('week', today)::date;
  select count(distinct (created_at at time zone p.timezone)::date) into days
    from xp_events where user_id = p.id and (created_at at time zone p.timezone)::date >= wk;
  if p.teacher_id is null then
    group_xp := (select coalesce(sum(amount), 0) from xp_events where user_id = p.id and (created_at at time zone p.timezone)::date >= wk);
    group_size := 1;
  else
    select coalesce(sum(x.amount), 0), count(distinct s.id) into group_xp, group_size
      from profiles s left join xp_events x on x.user_id = s.id and (x.created_at at time zone p.timezone)::date >= wk
      where s.teacher_id = p.teacher_id and s.role = 'student';
  end if;
  return jsonb_build_object(
    'week_start', wk, 'days', days, 'goal_days', 5, 'bonus', 50,
    'claimed', exists (select 1 from weekly_claims where user_id = p.id and week_start = wk),
    'group_xp', group_xp, 'group_goal', greatest(500, round(group_size * 250 / 100.0) * 100)::int, 'group_size', group_size);
end $$;

create function public.claim_weekly_challenge() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  c jsonb := public.weekly_challenge();
  xp jsonb;
begin
  if (c ->> 'claimed')::boolean then return c || jsonb_build_object('awarded', false); end if;
  if (c ->> 'days')::int < (c ->> 'goal_days')::int then return c || jsonb_build_object('awarded', false); end if;
  insert into weekly_claims (user_id, week_start) values (auth.uid(), (c ->> 'week_start')::date);
  xp := public._award_xp(auth.uid(), (c ->> 'bonus')::int, 'weekly_challenge');
  return c || xp || jsonb_build_object('claimed', true, 'awarded', true);
end $$;

revoke execute on function public.weekly_challenge(), public.claim_weekly_challenge() from public, anon;
grant execute on function public.weekly_challenge(), public.claim_weekly_challenge() to authenticated;

commit;
