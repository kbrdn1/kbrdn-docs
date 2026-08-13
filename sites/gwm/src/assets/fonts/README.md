# Polices des cartes Open Graph

Ces fichiers ne sont **pas** servis au navigateur : ils sont lus au build par
`src/lib/og-card.ts` pour que satori façonne le texte des cartes. Le site, lui,
charge ses polices depuis `public/fonts` via `@font-face`. D'où la séparation —
mettre celles-ci dans `public/` les publierait sur le CDN sans que rien ne les
demande.

| Fichier                        | Rôle sur la carte                    | Source                                                                                        |
| ------------------------------ | ------------------------------------ | --------------------------------------------------------------------------------------------- |
| `Inter-Regular.ttf`            | description (corps de texte du site) | [rsms/inter](https://github.com/rsms/inter) `Inter-4.1.zip`, `extras/ttf/`                    |
| `MonaspaceKrypton-Regular.otf` | section, badge de version, hôte      | [githubnext/monaspace](https://github.com/githubnext/monaspace) `monaspace-static-v1.400.zip` |

Les deux sont sous **SIL Open Font License 1.1** (`Inter-LICENSE.txt`,
`Monaspace-LICENSE.txt`).

⚠️ **Instances statiques, délibérément.** Satori refuse le woff2 (« Unsupported
OpenType signature wOF2 »), donc les fichiers de `public/fonts` ne conviennent
pas ; et le Krypton _variable_ casse le parser opentype.js embarqué dans satori
sur sa table `fvar`. Ne pas « ranger » ce dossier en pointant og-card vers
`public/fonts`.

Fenix, elle, reste lue depuis `public/fonts/Fenix-Regular.ttf` : c'est déjà un
TTF statique, servi au site et lisible par satori, donc un seul exemplaire
suffit.
