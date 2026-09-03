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

## Point de départ

Le contenu initial est une copie conforme de la page d'accueil espagnole du
3 septembre 2026 : `/v3/` s'affiche à l'identique de `/` avant toute modification.
