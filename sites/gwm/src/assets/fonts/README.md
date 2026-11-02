# Polices des cartes Open Graph

Ces fichiers ne sont **pas** servis au navigateur : ils sont lus au build par
`src/lib/og-card.ts` pour que satori façonne le texte des cartes. Le site, lui,
charge ses polices depuis `public/fonts` via `@font-face`. D'où la séparation —
mettre celles-ci dans `public/` les publierait sur le CDN sans que rien ne les
demande.

| Fichier                        | Rôle sur la carte                    | Source                                                                                        |
| ------------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------- |
| `Inter-Regular.ttf`            | description (corps de texte du site) | [rsms/inter](https://github.com/rsms/inter) `Inter-4.1.zip`, `extras/ttf/`                    |
| `MonaspaceKrypton-Regular.otf` | section, badge de version, pied      | [githubnext/monaspace](https://github.com/githubnext/monaspace) `monaspace-static-v1.400.zip` |
| `MonaspaceKrypton-Bold.otf`    | wordmark « gwm » (700)               | idem                                                                                          |

Les deux sont sous **SIL Open Font License 1.1** (`Inter-LICENSE.txt`,
`Monaspace-LICENSE.txt`).

⚠️ **Instances statiques, délibérément.** Le Krypton de `public/fonts` est un
woff2 _variable_. Satori lit le woff2 depuis 0.55 et ne casse plus sur la table
`fvar`, mais il n'en rend pas les graisses : en 0.63.2, le variable déclaré en
400 sort plus maigre que l'instance Regular, et déclaré en 700 il reste en deçà
du Bold. Ne pas « ranger » ce dossier en pointant og-card vers `public/fonts`.

Fenix, elle, reste lue depuis `public/fonts/Fenix-Regular.ttf` : c'est déjà un
TTF statique, servi au site et lisible par satori, donc un seul exemplaire
suffit.
