-- Campus Pathway · 040 · le 1er e-mail du test part au plus tôt 5 minutes après le test
-- À exécuter après 039 (SQL Editor → New query → Run).
--
-- placement-followups passe toutes les 5 minutes. Le 1er e-mail était dû tout de suite
-- (followup_next_at = now()) : il pouvait partir 10 secondes après le test, avant que la personne
-- ait eu le temps d'envoyer ses disponibilités depuis la page de résultat. Il est maintenant dû
-- 5 minutes après le test, donc envoyé entre 5 et 10 minutes après, avec la bonne version
-- (bouton, ou « Recibimos tus disponibilidades » si elles sont déjà arrivées, db/039).

begin;

alter table public.placement_results alter column followup_next_at set default now() + interval '5 minutes';

-- Tests de ces dernières minutes dont le 1er e-mail n'est pas encore parti.
update public.placement_results set followup_next_at = created_at + interval '5 minutes'
where followup_step = 0 and followup_next_at < created_at + interval '5 minutes' and created_at > now() - interval '5 minutes';

commit;
