-- Campus Pathway · 038 · la page de résultat du test reçoit le jeton de la réunion
-- À exécuter après 037 (SQL Editor → New query → Run).
--
-- submit_placement renvoyait true / false. Elle renvoie maintenant le jeton du test
-- (placement_results.unsub_token), ou null si l'envoi est refusé (plus de 5 tests par adresse et par
-- heure, ou trop d'envois du site). La page de résultat s'en sert pour son bouton « Enviar mis
-- disponibilidades » (disponibilidad.html, db/037), le même que dans les e-mails du test.

begin;

drop function if exists public.submit_placement(text, text, integer, text, text, jsonb, text, text);
create function public.submit_placement(p_email text, p_level text, p_overall integer, p_mode text, p_lang text, p_detail jsonb,
  p_campaign text default null, p_source text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare e text := lower(trim(coalesce(p_email, ''))); tok uuid;
begin
  if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(e) > 200 then raise exception 'invalid email'; end if;
  if (select count(*) from placement_results where email = e and created_at > now() - interval '1 hour') >= 5 then return null; end if;
  if not public.web_submission_allowed('placement') then return null; end if;
  insert into placement_results (email, level, overall, mode, lang, detail, campaign, source)
  values (e, p_level, greatest(0, least(100, p_overall)), p_mode, p_lang, p_detail,
    left(nullif(trim(p_campaign), ''), 120), left(nullif(trim(p_source), ''), 120))
  returning unsub_token into tok;
  return tok;
end $$;
revoke all on function public.submit_placement(text, text, integer, text, text, jsonb, text, text) from public;
grant execute on function public.submit_placement(text, text, integer, text, text, jsonb, text, text) to anon, authenticated;

commit;

notify pgrst, 'reload schema';
