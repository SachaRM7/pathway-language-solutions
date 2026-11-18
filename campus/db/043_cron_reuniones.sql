-- Campus Pathway · 043 · rappels des réunions avec les intéressés (toutes les 5 minutes)
-- À exécuter après 041 et le déploiement de la fonction « meetings ».
-- La fonction envoie les rappels dus (la veille, 1 h avant) ; même secret que les autres tâches (014).

select cron.unschedule('pathway-meetings') where exists (select 1 from cron.job where jobname = 'pathway-meetings');
select cron.schedule('pathway-meetings', '*/5 * * * *', $$
  select net.http_post(
    url := 'https://ynflykxalfynxoupkxmy.supabase.co/functions/v1/meetings',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'pathway_cron_secret')),
    body := '{}'::jsonb)
$$);
