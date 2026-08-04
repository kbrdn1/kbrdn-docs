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

## En ligne

| Produit | Adresse                     | Source des pages                                                       |
| ------- | --------------------------- | ---------------------------------------------------------------------- |
| gwm     | **<https://gwm.kbrdn.dev>** | [`kbrdn1/gwm-cli`](https://github.com/kbrdn1/gwm-cli), dossier `docs/` |

Aucune page produit ne s'écrit ici : `sites/gwm/src/content/docs/<section>/` est
effacé puis régénéré par `bun run sync:gwm`. La source de vérité est le dépôt du
produit, ce dépôt-ci n'en est que le rendu.

`gwm-docs.pages.dev` sert le même contenu et ne peut pas être retiré, c'est
l'adresse du projet Cloudflare. Elle est écartée de l'indexation par
`sites/gwm/public/_headers`, seul endroit de la chaîne qui connaisse l'hôte : un
`robots.txt` est statique, donc servi à l'identique sur les deux domaines et
incapable d'en exclure un seul.

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
`CLOUDFLARE_ACCOUNT_ID`. Les trois sont en place depuis le 2026-08-04.

Le déploiement n'a pas besoin d'être déclenché à la main. Une livraison sur
`main` de `kbrdn1/gwm-cli` qui touche `docs/`, `changelogs/` ou `Cargo.toml`
poste un `repository_dispatch` ici ; `sync-gwm.yml` rejoue alors la conversion,
commite ce qui a dérivé et appelle `deploy.yml`. Ce dernier appel est explicite
et non un effet du commit : un push signé du `GITHUB_TOKEN` ne déclenche aucun
workflow, c'est le garde anti-récursion de GitHub.

⚠️ `sync-gwm.yml` lit `main` de gwm-cli, jamais `dev`. Une page dont la source
n'a pas encore atteint `main` est donc effacée par le premier sync, et la
suppression est commitée comme une dérive légitime.

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
