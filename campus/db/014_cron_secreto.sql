-- Campus Pathway · 014 · secret partagé entre pg_cron et les fonctions programmées
-- À exécuter après 013 (SQL Editor → New query → Run), puis redéployer « weekly-report » et
-- « class-reminders ». Rien à recopier : le secret est créé ici, gardé dans le coffre-fort de
-- Supabase (Vault), envoyé par les tâches programmées et vérifié par les fonctions. Sans lui,
-- un appel extérieur aux fonctions est refusé (le test des admins depuis le Campus reste permis).

-- 1. Le secret (créé une seule fois).
select vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'pathway_cron_secret',
  'Secret partagé : tâches pg_cron → fonctions weekly-report et class-reminders')
where not exists (select 1 from vault.secrets where name = 'pathway_cron_secret');

-- 2. Vérification, pour les fonctions (clé service uniquement).
create or replace function public.check_cron_secret(p_secret text) returns boolean
language sql stable security definer set search_path = public, vault as $$
  select coalesce(p_secret, '') <> '' and exists (
    select 1 from vault.decrypted_secrets where name = 'pathway_cron_secret' and decrypted_secret = p_secret)
$$;
revoke execute on function public.check_cron_secret(text) from public, anon, authenticated;
grant execute on function public.check_cron_secret(text) to service_role;

-- 3. Les deux tâches programmées envoient le secret.
select cron.unschedule('pathway-weekly-report') where exists (select 1 from cron.job where jobname = 'pathway-weekly-report');
select cron.schedule('pathway-weekly-report', '7 13 * * 1', $job$
  select net.http_post(
    url := 'https://ynflykxalfynxoupkxmy.supabase.co/functions/v1/weekly-report',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'pathway_cron_secret')),
    body := '{}'::jsonb)
$job$);
select cron.unschedule('pathway-class-reminders') where exists (select 1 from cron.job where jobname = 'pathway-class-reminders');
select cron.schedule('pathway-class-reminders', '*/5 * * * *', $job$
  select net.http_post(
    url := 'https://ynflykxalfynxoupkxmy.supabase.co/functions/v1/class-reminders',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'pathway_cron_secret')),
    body := '{}'::jsonb)
$job$);
