# /v3 — bac à sable de la prochaine version

`https://pathway-languages.com/v3/` est un espace de travail isolé. Le site public
servi sur le nom de domaine reste `index-v2.html` et n'est jamais modifié par les
changements faits ici.

## Règles d'isolation

1. **v3 possède ses propres styles et scripts** : `pathway-v3.css` et `pathway-v3.js`.
   Ne jamais pointer vers `pathway-v2.css` ou `pathway-v2.js` — le build échoue.
2. **Les médias et les pages secondaires restent partagés** et sont appelés en `../` :
   `../assets/`, `../pathway-mark.svg`, `../calculador.html`, `../fr/`, etc.
   Les images et vidéos ne sont pas dupliquées.
3. **Les vidéos de témoignages** passent par `window.PathwayHomeCopy.assetBase = '../'`,
   déclaré dans le `<head>` de `v3/index.html`.
4. **v3 reste en `noindex, nofollow`** et est exclu dans `robots.txt` tant que la version
   n'est pas publiée. Le build échoue si le `noindex` disparaît. v3 est également absent
   de `sitemap.xml` et du cluster `hreflang` du site public.

## Travailler sur v3

```bash
npm run build
python3 -m http.server 8099 --directory dist/client
# puis ouvrir http://127.0.0.1:8099/v3/
```

Le build copie `v3/` tel quel vers `dist/client/v3/`, vérifie les règles d'isolation,
puis contrôle que la page d'accueil publiée correspond toujours exactement à
`index-v2.html`.

## Passer v3 en production

Quand la version est prête : remplacer le contenu de `index-v2.html` (et les gabarits
`i18n/locale-pages.mjs` pour FR / EN / DE), retirer le `noindex`, retirer
`Disallow: /v3/` de `robots.txt`. Tant que cette étape n'a pas eu lieu, v3 n'est
accessible qu'en connaissant l'URL.

## Architecture de la Home v3

La v3 est partie d'une copie conforme de l'accueil espagnol, puis son **premier acte**
a été refondu. Le reste de la page est celui du site public.

### Acte 1 — comprendre (jusqu'aux professeurs)

1. **Header** — inchangé.
2. **Hero** — promesse + `<aside class="route-preview">`, un aperçu de parcours
   (B1 → NCLC 7, rythme, prochaine étape, professeur réel). Il remplace la capture Zoom
   seule, qui montrait « Pathway fait des cours en visio » plutôt que la méthode.
   Sur mobile, cet aperçu passe avant les réassurances : on montre avant de rassurer.
3. **`¿Desde dónde empiezas?`** — les quatre profils existants, compactés.
4. **`Siempre sabes cuál es el siguiente paso`** — méthode en quatre étapes, conservée
   telle quelle (déjà verticale sur mobile).
5. **`Mira lo que eso significa en la práctica`** — section ajoutée, trois preuves :
   `01` le diagnostic (les compétences réelles de `placement-scoring.js`),
   `02` les cycles CECRL et le matériel réel d'une classe,
   `03` la semaine type, reprise de l'ancienne `week-section`.

L'acte 1 se termine là. La section professeurs ouvre l'acte 2.

### Déplacements

- L'ancienne `week-section` autonome a été **absorbée** dans la preuve `03` : elle
  faisait doublon avec elle.
- La `context-section` (immigration, CRS, IRCC) est passée **après les offres**, sous le
  titre `¿Por qué apuntar al NCLC 7?` : c'est du contenu de conviction, pas de
  compréhension du produit, et elle coupait la progression promesse → méthode → preuve.

### Données affichées

Les chiffres des aperçus (`62 %`, `B1`, `4 h / semana`) sont des **exemples**, marqués
comme tels dans l'interface. Ils sont cohérents avec le produit réel : compétences et
statuts viennent de `placement-scoring.js`, les cycles CECRL et le rythme de 4 h/semaine
de l'offre « Acelerado » (`inscription.html`, section des plans). Aucun backend fictif
n'a été ajouté ; les composants sont structurés pour recevoir de vraies données plus tard.

### Mesure

`pathway-v3.js` utilise `window.PathwayAnalytics` (aucune stack ajoutée) et émet
`starting_point_selected`, `methodology_viewed`, `program_preview_viewed`,
`teachers_viewed`, `testimonials_viewed`, `pricing_viewed`. Les clics porteurs de
`data-cta` restent suivis par `analytics.js` (`hero-primary`, `hero-secondary`,
`proof-placement`, `proof-program`…).
