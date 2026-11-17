-- Campus Pathway · 029 · relances par e-mail après le test de niveau + mesure du parcours du site
-- À exécuter après 028 (SQL Editor → New query → Run). Puis déployer la fonction « placement-followups ».
--
-- 1. Relances : quand quelqu'un termine le test de niveau sur le site, il reçoit
--    • tout de suite : son résultat et son plan (e-mail 1) ;
--    • 2 jours après : comment se passent les cours (e-mail 2) ;
--    • 5 jours après : une dernière proposition d'aide pour choisir son rythme (e-mail 3).
--    Les relances s'arrêtent d'elles-mêmes dès que la personne envoie sa demande d'inscription,
--    devient élève, est passée par l'équipe à une autre étape du suivi (contactado, horario…),
--    se désinscrit (lien dans chaque e-mail) ou refait le test (seul le dernier test compte).
--    Les tests faits avant cette version ne reçoivent rien (la page disait alors « aucun e-mail »).
-- 2. Parcours du site : étapes anonymes (test ouvert, commencé, à mi-parcours, e-mail demandé,
--    résultat, inscription…) avec le type d'appareil, pour voir où les visiteurs abandonnent.
--    Ni e-mail, ni nom, ni adresse IP : un identifiant de visite tiré au hasard, effacé à 180 jours.

begin;

-- ─────────────────────────────────────────────────────────────
-- 1. Relances
-- ─────────────────────────────────────────────────────────────
-- followup_step : null = pas de relance ; 0, 1, 2 = prochain e-mail à envoyer ; 3 = terminé.
alter table public.placement_results add column if not exists followup_step int check (followup_step between 0 and 3);
alter table public.placement_results add column if not exists followup_next_at timestamptz;
alter table public.placement_results add column if not exists followup_attempts int not null default 0;
alter table public.placement_results add column if not exists unsub_token uuid not null default gen_random_uuid();
-- Les tests à venir seulement (les anciennes lignes gardent null).
alter table public.placement_results alter column followup_step set default 0;
alter table public.placement_results alter column followup_next_at set default now();
create unique index if not exists placement_results_unsub on public.placement_results (unsub_token);
create index if not exists placement_results_due on public.placement_results (followup_next_at) where followup_step between 0 and 2;

create table if not exists public.email_optouts (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table public.email_optouts enable row level security;
revoke all on public.email_optouts from anon, authenticated;

-- Journal des envois (pour vérifier que tout part bien ; effacé à 180 jours).
create table if not exists public.email_log (
  id bigint generated always as identity primary key,
  placement_id uuid references public.placement_results (id) on delete cascade,
  kind text not null check (kind in ('placement_followup')),
  step int,
  status int,
  error text check (length(error) <= 500),
  created_at timestamptz not null default now()
);
alter table public.email_log enable row level security;
revoke all on public.email_log from anon, authenticated;

-- Refaire le test : seules les relances du dernier test continuent.
create or replace function public._placement_one_followup() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update placement_results set followup_step = null, followup_next_at = null
  where email = new.email and id <> new.id and followup_step between 0 and 2;
  if exists (select 1 from email_optouts where email = new.email) then
    update placement_results set followup_step = null, followup_next_at = null where id = new.id;
  end if;
  return null;
end $$;
drop trigger if exists placement_one_followup on public.placement_results;
create trigger placement_one_followup after insert on public.placement_results
  for each row execute function public._placement_one_followup();

-- Les relances à envoyer maintenant (fonction programmée uniquement).
create or replace function public.followups_due(p_limit int default 20) returns table (
  id uuid, email text, level text, overall int, mode text, lang text, detail jsonb, step int,
  unsub_token uuid, full_name text, created_at timestamptz)
language sql stable security definer set search_path = public, auth as $$
  select r.id, r.email, r.level, r.overall, r.mode, coalesce(r.lang, 'es'), r.detail, r.followup_step,
    r.unsub_token, p.full_name, r.created_at
  from placement_results r
  left join prospects p on p.email = r.email
  where r.followup_step between 0 and 2
    and r.followup_next_at <= now()
    and r.created_at > now() - interval '30 days'
    and not exists (select 1 from email_optouts o where o.email = r.email)
    and not exists (select 1 from enrollment_requests e where lower(e.email) = r.email)
    and not exists (select 1 from auth.users u where lower(u.email) = r.email)
    and (p.id is null or (p.archived_at is null and p.stage in ('nuevo', 'test')))
  order by r.followup_next_at
  limit greatest(1, least(p_limit, 100))
$$;

-- Juste avant l'envoi : réserve la relance 20 minutes (deux passages simultanés n'envoient jamais deux fois).
create or replace function public.claim_followup(p_id uuid, p_step int) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update placement_results set followup_next_at = now() + interval '20 minutes'
  where id = p_id and followup_step = p_step and followup_next_at <= now();
  return found;
end $$;

-- Après un envoi : l'étape suivante (2 jours, puis 3 jours), ou un nouvel essai dans 1 h (3 essais au plus).
create or replace function public.followup_sent(p_id uuid, p_step int, p_status int, p_error text default null) returns void
language plpgsql security definer set search_path = public as $$
declare ok boolean := p_status between 200 and 299; pid uuid;
begin
  insert into email_log (placement_id, kind, step, status, error) values (p_id, 'placement_followup', p_step, p_status, left(p_error, 500));
  if ok then
    update placement_results set followup_step = p_step + 1, followup_attempts = 0,
      followup_next_at = case p_step when 0 then now() + interval '2 days' when 1 then now() + interval '3 days' else null end
    where id = p_id and followup_step = p_step;
    select p.id into pid from prospects p join placement_results r on r.email = p.email where r.id = p_id;
    if pid is not null then
      insert into prospect_events (prospect_id, kind, topic, body)
      values (pid, 'auto', 'correo', format('Correo automático %s/3 enviado tras el test de nivel.', p_step + 1));
    end if;
  else
    update placement_results set followup_attempts = followup_attempts + 1,
      followup_step = case when followup_attempts + 1 >= 3 then null else followup_step end,
      followup_next_at = case when followup_attempts + 1 >= 3 then null else now() + interval '1 hour' end
    where id = p_id;
  end if;
  delete from email_log where created_at < now() - interval '180 days';
end $$;

-- Désinscription depuis le lien de l'e-mail (sans compte).
create or replace function public.email_unsubscribe(p_token uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare e text;
begin
  select email into e from placement_results where unsub_token = p_token;
  if e is null then return false; end if;
  insert into email_optouts (email) values (e) on conflict do nothing;
  update placement_results set followup_step = null, followup_next_at = null where email = e and followup_step between 0 and 2;
  return true;
end $$;

revoke execute on function public.followups_due(int), public.followup_sent(uuid, int, int, text), public.claim_followup(uuid, int),
  public._placement_one_followup() from public, anon, authenticated;
grant execute on function public.followups_due(int), public.followup_sent(uuid, int, int, text), public.claim_followup(uuid, int) to service_role;
revoke execute on function public.email_unsubscribe(uuid) from public;
grant execute on function public.email_unsubscribe(uuid) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- 2. Parcours du site
-- ─────────────────────────────────────────────────────────────
create table if not exists public.funnel_events (
  id bigint generated always as identity primary key,
  visit text not null check (visit ~ '^[a-z0-9]{8,40}$'),
  event text not null check (event in ('test_view', 'test_start', 'test_half', 'test_email', 'test_done', 'result_cta',
    'enroll_view', 'enroll_step', 'enroll_sent', 'contact_whatsapp', 'contact_messenger', 'email_click')),
  detail text check (length(detail) <= 40),
  lang text check (lang in ('es', 'fr', 'en', 'de')),
  device text check (device in ('android', 'iphone', 'ipad', 'tablet', 'pc', 'mac', 'other')),
  campaign text check (length(campaign) <= 100),
  source text check (length(source) <= 100),
  created_at timestamptz not null default now()
);
create unique index if not exists funnel_events_once on public.funnel_events (visit, event, coalesce(detail, ''));
create index if not exists funnel_events_time on public.funnel_events (created_at);
alter table public.funnel_events enable row level security;
revoke all on public.funnel_events from anon, authenticated;

create or replace function public.log_funnel(p_visit text, p_event text, p_detail text default null, p_lang text default null,
  p_device text default null, p_campaign text default null, p_source text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  -- Garde-fous : 40 étapes par visite, 3 000 par heure en tout.
  if (select count(*) from funnel_events where visit = p_visit) >= 40 then return; end if;
  if (select count(*) from funnel_events where created_at > now() - interval '1 hour') >= 3000 then return; end if;
  insert into funnel_events (visit, event, detail, lang, device, campaign, source)
  values (p_visit, p_event, left(nullif(trim(p_detail), ''), 40),
    case when p_lang in ('es', 'fr', 'en', 'de') then p_lang end,
    case when p_device in ('android', 'iphone', 'ipad', 'tablet', 'pc', 'mac', 'other') then p_device else 'other' end,
    left(nullif(trim(p_campaign), ''), 100), left(nullif(trim(p_source), ''), 100))
  on conflict do nothing;
exception when check_violation then return;  -- étape inconnue ou identifiant invalide : ignoré
end $$;
revoke execute on function public.log_funnel(text, text, text, text, text, text, text) from public;
grant execute on function public.log_funnel(text, text, text, text, text, text, text) to anon, authenticated;

-- Pour l'équipe et le rapport du lundi : visites distinctes par étape, par appareil, et relances.
create or replace function public.funnel_report(p_days int default 7) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare since timestamptz := now() - make_interval(days => greatest(1, least(p_days, 365))); out jsonb;
begin
  -- Équipe, fonction programmée (clé service) ou SQL Editor (pas de jeton) ; jamais un élève ni le public.
  if not (public.is_staff() or coalesce(auth.role(), '') = 'service_role'
    or nullif(current_setting('request.jwt.claims', true), '') is null) then raise exception 'forbidden'; end if;
  delete from funnel_events where created_at < now() - interval '180 days';
  select jsonb_build_object(
    'days', p_days,
    'steps', coalesce((select jsonb_object_agg(event, n) from (
      select event, count(distinct visit) n from funnel_events where created_at >= since and event <> 'enroll_step' group by event) s), '{}'::jsonb),
    'devices', coalesce((select jsonb_object_agg(device, n) from (
      select coalesce(device, 'other') device, count(distinct visit) n from funnel_events
      where created_at >= since and event = 'test_view' group by 1) d), '{}'::jsonb),
    'devices_done', coalesce((select jsonb_object_agg(device, n) from (
      select coalesce(device, 'other') device, count(distinct visit) n from funnel_events
      where created_at >= since and event = 'test_done' group by 1) d), '{}'::jsonb),
    -- Par campagne (premier contact de chaque visite) : visites du test, tests terminés, demandes envoyées.
    'campaigns', coalesce((select jsonb_agg(c order by views desc) from (
      select jsonb_build_object('campaign', camp, 'views', count(*) filter (where viewed), 'done', count(*) filter (where done),
        'enrolled', count(*) filter (where sent)) c, count(*) filter (where viewed) views
      from (select visit, coalesce(max(campaign), max(source), '(directo)') camp,
              bool_or(event = 'test_view') viewed, bool_or(event = 'test_done') done, bool_or(event = 'enroll_sent') sent
            from funnel_events where created_at >= since group by visit) v
      group by camp order by count(*) filter (where viewed) desc limit 8) x), '[]'::jsonb),
    'emails_sent', (select count(*) from email_log where created_at >= since and status between 200 and 299),
    'emails_failed', (select count(*) from email_log where created_at >= since and not (status between 200 and 299)),
    'unsubscribed', (select count(*) from email_optouts where created_at >= since)
  ) into out;
  return out;
end $$;
revoke execute on function public.funnel_report(int) from public, anon;
grant execute on function public.funnel_report(int) to authenticated, service_role;

-- 3. Envoi des relances : vérification toutes les 5 minutes (secret partagé, comme en 014).
select cron.unschedule('pathway-placement-followups') where exists (select 1 from cron.job where jobname = 'pathway-placement-followups');
select cron.schedule('pathway-placement-followups', '*/5 * * * *', $job$
  select net.http_post(
    url := 'https://ynflykxalfynxoupkxmy.supabase.co/functions/v1/placement-followups',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'pathway_cron_secret')),
    body := '{}'::jsonb)
$job$);

commit;
