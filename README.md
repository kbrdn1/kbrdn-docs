# kbrdn-docs

Monorepo de documentation multi-produits : **un site [Astro Starlight](https://starlight.astro.build)
par produit**, partageant un package de design system pour la consistance.
Sortie statique, déployée sur **Cloudflare Pages**. Versioning **par branche**.

> Géré avec **Bun** (seul gestionnaire de paquets / runtime supporté).

## Structure

```
kbrdn-docs/
├── packages/
│   └── ds-shared/      # @kbrdn/ds-shared — thème, overrides Starlight, composants MDX partagés
└── sites/
    └── gwm/            # @kbrdn/docs-gwm — site Starlight du produit gwm
```

Chaque site hérite de `@kbrdn/ds-shared` (footer, tokens de thème, composants
réutilisables) puis surcharge ce qui lui est propre (accent, landing, nav).

## Démarrage

```bash
bun install
bun run dev          # serveur de dev (gwm) sur http://localhost:4321
```

## Commandes

| Commande              | Effet                             |
| --------------------- | --------------------------------- |
| `bun run dev`         | serveur de dev du site gwm        |
| `bun run build`       | build statique de tous les sites  |
| `bun run check`       | lint + format check + astro check |
| `bun run lint`        | oxlint                            |
| `bun run format`      | prettier --write                  |
| `bun run preview:gwm` | preview du build de gwm           |

Avec Nix : `nix develop` fournit bun + node + git.

## Déploiement

`main` → déploiement de production ("latest") sur Cloudflare Pages (un projet
Pages par produit). Le workflow `deploy.yml` est gardé par la variable repo
`DEPLOY_ENABLED` et requiert les secrets `CLOUDFLARE_API_TOKEN` /
`CLOUDFLARE_ACCOUNT_ID`.

## Versioning

Par branche, par produit : `release/<product>/v<MAJOR.MINOR>` fige la doc d'une
version et se déploie séparément. Voir [CONTRIBUTING.md](CONTRIBUTING.md#versioning--releases)
et [PLAN.md](PLAN.md).

## Docs internes

- [PLAN.md](PLAN.md) — vision, architecture, roadmap.
- [CONTRIBUTING.md](CONTRIBUTING.md) — conventions (branches, commits, releases).
- [CLAUDE.md](CLAUDE.md) — règles pour les assistants IA.

## Licence

[MIT](LICENSE.md) © 2026 Kylian Bardini.
