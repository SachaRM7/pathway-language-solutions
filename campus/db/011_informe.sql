-- Campus Pathway · 011 · rapport du lundi (e-mail aux admins)
-- À exécuter après 010 et après avoir déployé la fonction « weekly-report » (SQL Editor → Run).
-- Chaque lundi à 8 h (heure de Lima), la fonction envoie aux admins le bilan de la semaine
-- précédente : par groupe, cours prévus, tenus sur Zoom, enregistrés, retards du professeur,
-- annulés ou déplacés ; changements en attente ; élèves sans activité ; sorties d'onglet ;
-- réunions Zoom sans groupe. Un seul envoi par semaine, même si la fonction est appelée deux fois.

begin;

create table if not exists public.weekly_reports (
  week_start date primary key,
  sent_at timestamptz not null default now(),
  recipients int not null default 0
);
alter table public.weekly_reports enable row level security;

-- Données du rapport pour la semaine [p_from, p_from + 7 jours) ; p_from null = semaine précédente. Réservé à la clé service.
create function public.weekly_report_data(p_from timestamptz) returns jsonb
language sql stable security definer set search_path = public as $$
  -- Par défaut : la semaine précédente, du lundi au dimanche, à l'heure de Lima.
  with w0 as (select coalesce(p_from, (date_trunc('week', now() at time zone 'America/Lima') - interval '7 days') at time zone 'America/Lima') as a),
  w as (select a, a + interval '7 days' as b from w0)
  select jsonb_build_object(
    'from', (select a from w), 'to', (select b from w), 'week', (select (a at time zone 'America/Lima')::date from w),
    'groups', coalesce((select jsonb_agg(x order by x->>'name') from (
      select jsonb_build_object(
        'name', g.name, 'teacher', (select full_name from profiles t where t.id = g.teacher_id), 'level', g.level,
        'has_zoom', g.zoom_meeting_id is not null,
        'planned', count(*) filter (where l.status <> 'cancelled'),
        'held', count(*) filter (where l.status <> 'cancelled' and l.started_at is not null),
        'recorded', count(*) filter (where l.recorded),
        'late', count(*) filter (where l.late_min > 5),
        'moved', count(*) filter (where l.status = 'moved'),
        'cancelled', count(*) filter (where l.status = 'cancelled'),
        'missing', coalesce(jsonb_agg(l.at order by l.at) filter (where l.status <> 'cancelled' and l.started_at is null), '[]'::jsonb)
      ) x
      from class_groups g cross join w
      left join lateral public._group_log(g.id, w.a, w.b) l on true
      group by g.id) s), '[]'::jsonb),
    'pending_changes', (select count(*) from schedule_changes where status = 'pending'),
    'inactive', coalesce((select jsonb_agg(jsonb_build_object('name', p.full_name, 'teacher', (select full_name from profiles t where t.id = p.teacher_id)) order by p.full_name)
      from profiles p, w where p.role = 'student' and p.onboarded_at is not null
        and not exists (select 1 from xp_events x where x.user_id = p.id and x.created_at >= w.a and x.created_at < w.b)), '[]'::jsonb),
    'units_done', (select count(*) from lesson_runs r, w where r.finished_at >= w.a and r.finished_at < w.b),
    'focus', coalesce((select jsonb_agg(jsonb_build_object('name', p.full_name, 'unit', r.unit_id, 'times', r.focus_lost))
      from lesson_runs r join profiles p on p.id = r.user_id, w where r.focus_lost > 0 and r.finished_at >= w.a and r.finished_at < w.b), '[]'::jsonb),
    'no_group', (select count(*) from profiles where role = 'student' and group_id is null),
    'unmatched', (select count(*) from zoom_meetings, w where group_id is null and started_at >= w.a and started_at < w.b)
  )
$$;

-- Adresses des admins (destinataires). Réservé à la clé service.
create function public.report_recipients() returns setof text
language sql stable security definer set search_path = public, auth as $$
  select u.email from profiles p join auth.users u on u.id = p.id where p.role = 'admin' and u.email is not null
$$;

-- Réserve l'envoi d'une semaine : renvoie false si elle a déjà été envoyée.
create function public.claim_weekly_report(p_week date, p_recipients int) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  insert into weekly_reports (week_start, recipients) values (p_week, p_recipients);
  return true;
exception when unique_violation then
  return false;
end $$;

revoke execute on function public.weekly_report_data(timestamptz), public.report_recipients(), public.claim_weekly_report(date, int) from public, anon, authenticated;
grant execute on function public.weekly_report_data(timestamptz), public.report_recipients(), public.claim_weekly_report(date, int) to service_role;

commit;

-- Planification : chaque lundi à 13 h 07 UTC (8 h 07 à Lima). À exécuter une fois.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.unschedule('pathway-weekly-report') where exists (select 1 from cron.job where jobname = 'pathway-weekly-report');
select cron.schedule('pathway-weekly-report', '7 13 * * 1', $job$
  select net.http_post(
    url := 'https://ynflykxalfynxoupkxmy.supabase.co/functions/v1/weekly-report',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb)
$job$);
