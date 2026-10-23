# Pathway R4 — revue de continuité temporelle

**Master de revue : 42 secondes, 1280 × 720, 30 images/s, sans son.**

R4 conserve l’identité, les textes et le récit. La révision porte sur le flux du mouvement. La progression du fil ne dépend plus d’une succession d’événements qui démarrent et s’arrêtent.

## Ce qui pilote maintenant le film

Une fonction de vitesse positive est intégrée pendant tout le trajet, puis normalisée à la longueur du tracé. Les variations sont larges et continues : découverte, immersion pédagogique, progression vers l’objectif, puis une seule décélération terminale. Les révélations réagissent à l’avancement ; elles n’arrêtent jamais le fil.

La caméra suit un parcours continu indexé sur cette même distance. Ses tangentes sont partagées entre les positions de cadrage. Les textes commencent à apparaître avant l’arrivée du fil et peuvent rester lisibles pendant qu’il continue. Le plan personnel apparaît désormais pendant le soulignement du point de départ.

Le cercle d’A2 reste ouvert et sa tangente de sortie devient l’entrée dans l’unité. Les deux retournements instantanés hérités de R3 ont été arrondis : une vitesse non nulle aurait autrement produit un changement brutal de direction. Aucun nouveau motif n’a été ajouté. Les deux courbes terminales du logo sont conservées exactement.

## Diagnostics livrés

- `Pathway-R4-progression.png` : distance parcourue, en pourcentage du tracé, comparée à R3. Les plateaux intermédiaires ont disparu.
- `Pathway-R4-vitesse.png` : dérivée du déplacement réellement utilisé par le rendu. La comparaison R3 utilise une échelle verticale différente, explicitement graduée.
- `Pathway-R4-motion-data.csv` : mesures toutes les 1/240 s, dont la vitesse sur le tracé et la vitesse apparente de la pointe dans l’image.
- `Pathway-R4-verifications.json` : métriques et contrôles du rendu / des fenêtres modulaires.

Les courbes proviennent du code qui anime le master, pas d’un schéma dessiné après coup. La vitesse R4 reste supérieure à **237 px source/s** avant la décélération finale. Aucun événement pédagogique ou commercial ne remet cette vitesse à zéro.

## Moments intentionnels proches de zéro

Seuil déclaré : **moins de 10 pixels source par seconde**, soit moins d’un tiers de pixel source parcouru par image à 30 images/s.

| Intervalle | État du fil | Raison |
|---|---|---|
| Avant 38,38 s | Au-dessus du seuil ; aucun arrêt intermédiaire. | Traversée continue. Le ralentissement final commence à 34,5 s. |
| Environ 38,38–39 s | Vitesse positive qui tend vers zéro. | Achèvement de la courbe officielle Pathway. |
| 39–42 s | Vitesse nulle. | Seul arrêt maintenu : marque et CTA. |

La projection à l’écran présente trois brefs instants de vitesse apparente inférieure à ce seuil, quand le déplacement de la caméra compense celui de la pointe : vers 7,28 s, 8,58 s et 31,51 s. Ils durent chacun moins d’une image à 30 images/s. Le fil continue à se tracer ; ce ne sont pas des attentes programmées. Ces valeurs sont conservées dans le CSV.

## Fenêtres modulaires : même mouvement, même état

| Fenêtre | Intervalle du master | État au raccord entrant |
|---|---|---|
| VIDEO_01 / WINDOW-01 | 0–15 s | Début du master. |
| VIDEO_02 / WINDOW-02 | 15–28 s | Fil à environ 416 px/s, sélection d’A2 en cours. |
| VIDEO_03 / WINDOW-03 | 28–42 s | Fil à environ 405 px/s, objectif déjà lisible. |

Chaque fenêtre lit le numéro d’image absolu du master. Elle ne possède ni nouveau compteur de progression, ni nouvelle vitesse, ni ressort ou interpolation remis à zéro.

Six images ont été rendues séparément comme images du master et comme images des fenêtres, juste avant, au raccord et juste après 15 et 28 s. Les fichiers PNG correspondants sont identiques. La vitesse est également non nulle à l’ancien repère de 30 s.

La priorité donnée au master produit ici des fenêtres de 15, 13 et 14 secondes. A2 fournit le contexte au début du deuxième module ; l’objectif ouvre le troisième. La narration et l’ordre des messages restent les mêmes.

## Arrêts retirés de R3

Le calcul de R3 révèle **13,95 secondes de plateaux immobiles avant l’arrêt final**, hors instants isolés de vitesse nulle entre les interpolations.

| Plage R3 | Durée |
|---|---:|
| 0–0,18 s | 0,18 s |
| 0,72–2,45 s | 1,73 s |
| 4,90–6,45 s | 1,55 s |
| 9,55–10,20 s | 0,65 s |
| 11,62–12,75 s | 1,13 s |
| 16,40–17,65 s | 1,25 s |
| 19,03–20,05 s | 1,02 s |
| 22,30–23,20 s | 0,90 s |
| 24,24–25,50 s | 1,26 s |
| 29,15–31,50 s | 2,35 s |
| 34–34,50 s | 0,50 s |
| 35,12–36,55 s | 1,43 s |

Ces pauses n’ont pas été retirées en accélérant globalement le MP4. Le parcours a été recalculé et les contenus / déplacements se chevauchent. Le fil avance moins vite que les anciennes pointes d’accélération de R3, mais son mouvement n’est plus interrompu.

## Portée du contrôle

La progression, la vitesse et la position projetée sont calculées à 240 Hz sur tout le film. Les raccords ont aussi été vérifiés sur des images rendues. Le master a été inspecté par séquences d’images, avec un contrôle ciblé des transitions pédagogiques et de la sortie vers le plan personnel. Cela ne remplace pas une appréciation du rythme lors d’un visionnage continu.

Cette passe s’arrête à la revue du flux. Aucun son final, effet décoratif ou changement de design n’a été ajouté. Les versions précédentes sont conservées et la PR reste en brouillon, sans fusion.
