# @kbrdn/ds-shared

Design system partagé par tous les sites de documentation du monorepo.

C'est la **couche de consistance** : ce qui vit ici est, par construction,
identique sur tous les produits.

## Contenu

| Export                        | Rôle                                                                        |
| ----------------------------- | --------------------------------------------------------------------------- |
| `./styles/theme.css`          | Tokens de base (accents, rayons). Chargé en premier, surchargé par produit. |
| `./components/Footer.astro`   | Override du footer Starlight (ligne commune).                               |
| `./components/RepoCard.astro` | Composant MDX réutilisable (carte dépôt GitHub).                            |

## Utilisation depuis un site

```js
// astro.config.mjs
starlight({
  components: { Footer: '@kbrdn/ds-shared/components/Footer.astro' },
  customCss: ['@kbrdn/ds-shared/styles/theme.css', './src/styles/<produit>.css'],
});
```

```mdx
import RepoCard from '@kbrdn/ds-shared/components/RepoCard.astro';

<RepoCard owner="kbrdn1" repo="gwm-cli" description="..." />
```

> Règle : un composant ne rejoint ce package que s'il est destiné à être
> **réutilisé sur plusieurs produits**. Le spécifique reste dans le site.
