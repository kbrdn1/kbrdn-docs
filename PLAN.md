# PLAN — kbrdn-docs

Plateforme de documentation multi-produits. Ce document est la source de
vérité de la **vision**, des **décisions actées** et de la **roadmap**. Il
évolue au fil de l'eau.

---

## 1. Vision

Centraliser la documentation de mes outils (gwm, LazyCurl, …) dans un monorepo
unique, où chaque produit a **son site, son thème, sa landing**, tout en
partageant une **couche de consistance** (nav, footer, composants réutilisables).

Objectif : écrire de la doc en Markdown/MDX, commiter, et voir le site déployé —
sans backend, sans CMS, sans usine. Git est la base de données ; la CI est le
pipeline ; Cloudflare Pages est le runtime.

## 2. Principes directeurs

1. **Statique d'abord.** Tout est `file-based` et pré-rendu (SSG). Pas de
   serveur, pas de store runtime. La tension « contenu dynamique » de Nuxt
   Content disparaît ici par construction.
2. **Bun, exclusivement.** Un seul gestionnaire de paquets / runtime.
3. **Un site par produit.** Starlight est conçu mono-produit ; on l'assume.
   La différenciation (thème, landing) vit dans le site ; la consistance dans
   le package partagé.
4. **Partage par package, pas par copier-coller.** `@kbrdn/ds-shared` est la
   seule source des éléments communs. Un composant n'y entre que s'il est
   réutilisé sur > 1 produit.
5. **Versioning par branche.** Pas de mécanisme `versioned_docs/` en arbre.
   Une version figée = une branche déployée séparément.
6. **YAGNI.** On n'ajoute versioning, doc API auto-générée ou 2ᵉ produit que
   quand le besoin est réel, pas par anticipation.
7. **Gates verts non négociables.** `lint + format + check + build` avant tout
   merge.

## 3. Décisions actées

| Sujet          | Décision                       | Pourquoi                                                    |
| -------------- | ------------------------------ | ----------------------------------------------------------- |
| Framework docs | **Astro Starlight**            | Le meilleur de sa catégorie, file-based, batteries incluses |
| Monorepo       | **Bun workspaces**             | Imposé ; rapide, lockfile unique                            |
| Partage        | **Package `@kbrdn/ds-shared`** | Layer de consistance versionnée avec le code                |
| Rendu          | **SSG statique**               | Zéro backend, déploiement CDN                               |
| Déploiement    | **Cloudflare Pages**           | Gratuit généreux, preview par branche, CDN global           |
| Versioning     | **Par branche**                | Plus robuste que les plugins file-based (retour d'Arcjet)   |
| Lint           | **oxlint**                     | Imposé ; rapide                                             |
| Format         | **prettier** (+ plugin astro)  | Standard, plugin astro mûr                                  |
| Type/contenu   | **astro check**                | Couvre `.astro` que oxlint ne parse pas                     |
| Dev env        | **flake.nix** (bun, git)       | Shell reproductible                                         |

## 4. Architecture

```
                       ┌──────────────────────────────┐
                       │   @kbrdn/ds-shared (package)  │
                       │  thème · Footer · RepoCard …  │  ← couche de consistance
                       └───────────────┬──────────────┘
                          consommé par │ (specifiers npm)
                ┌───────────────┬──────┴───────┬───────────────┐
                ▼               ▼              ▼               ▼
          sites/gwm        sites/lazycurl   sites/…        (futurs)
          Starlight        Starlight        Starlight
          thème+landing    thème+landing    thème+landing
                │               │
                ▼               ▼
          build statique   build statique
                │               │
                ▼               ▼
          Cloudflare Pages (un projet par produit)
```

- Le partage se fait via les **exports du package** (`@kbrdn/ds-shared/components/Footer.astro`,
  `@kbrdn/ds-shared/styles/theme.css`). Astro résout et compile les `.astro` du
  package en workspace — pas d'étape de build du package.
- Les **composants MDX** réutilisables doivent exister dans le bundle au build
  (contrainte SSG) : le contenu d'un produit ne peut utiliser que des
  composants du catalogue partagé ou locaux. C'est voulu — c'est la « norme »
  qui garantit la consistance.

## 5. État actuel (Phase 0 — fait)

- ✅ Monorepo Bun (`packages/*`, `sites/*`), lockfile commité.
- ✅ `@kbrdn/ds-shared` : `theme.css`, `Footer.astro` (override), `RepoCard.astro` (MDX).
- ✅ `sites/gwm` : Starlight, landing splash, 2 guides, accent produit, footer
  partagé, RepoCard partagé — **build vert (4 pages)**, `astro check` 0 erreur.
- ✅ Tooling : oxlint, prettier, astro check, scripts agrégés.
- ✅ Conventions « comme gwm » : CLAUDE, CONTRIBUTING, templates issue/PR,
  LABELS, Dependabot, hook pre-commit opt-in.
- ✅ CI (`ci.yml`) + déploiement gardé (`deploy.yml`) + `flake.nix`.

## 6. Roadmap

### Phase 1 — gwm en production (latest)

- [ ] Rédiger le contenu réel gwm (remplacer le contenu de démo) : install,
      config `.gwm.toml`, commandes CLI, TUI, doctor, trust ledger.
      → croiser systématiquement avec le repo `gwm-cli`.
- [ ] Créer le projet Cloudflare Pages `gwm-docs`, secrets +
      `DEPLOY_ENABLED=true`, vérifier le déploiement `main`.
- [x] Domaine : `gwm.kbrdn.dev` (tranché ; §7 garde la comparaison). À ne pas
      confondre avec `gwm-docs.pages.dev`, qui est le nom du projet Cloudflare
      et reste servi en parallèle sans pouvoir être retiré.
- [x] Mettre `site:` dans `astro.config.mjs` à l'URL de prod.

### Phase 2 — enrichir le design system

- [ ] Override `Header` / nav partagé (avec sélecteur de produit à terme).
- [ ] Sélecteur de **version** (composant partagé, alimenté par une config des
      versions vivantes) — prérequis du versioning par branche.
- [ ] Étoffer le catalogue MDX (callouts produit, blocs CLI, cartes features…).
- [ ] Documenter la « norme » frontmatter commune aux sites.

### Phase 3 — doc API auto-générée (gwm)

- [ ] Script local : `gwm --help` / sous-commandes → pages MDX générées ;
      éventuellement `cargo doc`/rustdoc JSON → référence.
- [ ] Extraction de snippets : importer de vrais fichiers d'exemple du repo
      produit plutôt que recopier.
- [ ] Quand le manuel devient pénible : déporter la génération dans une **GitHub
      Action côté `gwm-cli`** qui ouvre une PR de mise à jour des docs ici
      (l'« ingestion » sans backend).

### Phase 4 — versioning par branche (quand 2 versions vivantes)

- [ ] Cutter `release/gwm/v<MAJOR.MINOR>` à la release figeant la doc.
- [ ] Déploiement Cloudflare Pages dédié par branche de version.
- [ ] Brancher le sélecteur de version (Phase 2) sur les URLs déployées.

### Phase 5 — 2ᵉ produit (LazyCurl)

- [ ] `sites/lazycurl` qui `extends` la même base → prouve la réutilisation.
- [ ] Vérifier que `ds-shared` ne contient bien que du réellement commun.

### Phase 6 — durcissement

- [ ] Job CI `hook-smoke` (shellcheck + smoke du pre-commit), comme gwm.
- [ ] Vérification de liens morts au build (intégration ou plugin).
- [ ] Lighthouse / a11y en CI (optionnel).

## 7. Versioning par branche — détail

- `main` = **latest** de chaque produit, déployé en production.
- Figer une version :

  ```bash
  git switch -c release/gwm/v0.9 main
  git push -u origin release/gwm/v0.9
  ```

  Cloudflare Pages déploie cette branche comme un déploiement séparé. Deux
  topologies d'URL possibles (à trancher en Phase 1) :

  | Option           | Latest               | Version figée                        |
  | ---------------- | -------------------- | ------------------------------------ |
  | **Sous-domaine** | `gwm.docs.kbrdn.dev` | `v0-9.gwm.docs.kbrdn.dev`            |
  | **Path**         | `docs.kbrdn.dev/gwm` | `docs.kbrdn.dev/gwm/v0.9` (rewrites) |

  Recommandation : commencer **sous-domaine par produit** (isolation nette,
  natif Cloudflare Pages par déploiement de branche).

- Le **sélecteur de version** (composant partagé) liste les versions vivantes
  et pointe vers leurs URLs.
- Correctifs d'une vieille version → sur sa branche release ; forward-port vers
  `main` si encore pertinent.

## 8. CI/CD & déploiement

- **`ci.yml`** (push/PR sur `main`/`dev`) : `lint` (oxlint + prettier) et
  `build` (astro check + build tous sites + upload artefact). Bun via
  `oven-sh/setup-bun`, `--frozen-lockfile`.
- **`deploy.yml`** : sur `main` (paths sites/shared), build + `wrangler pages
deploy`. Gardé par `vars.DEPLOY_ENABLED == 'true'` pour ne pas échouer avant
  le setup des secrets.
- **Dependabot** : npm (racine + workspaces) hebdo vers `dev`, actions mensuel.
  ⚠️ À vérifier : support du lockfile Bun par Dependabot ; à défaut, il met à
  jour les manifestes `package.json` et `bun install` régénère le lock.

## 9. Qualité

- Gates : `bun run lint`, `bun run format:check`, `bun --filter='*' run check`,
  `bun run build`.
- Hook pre-commit opt-in (`.githooks/pre-commit`) : prettier + oxlint + astro
  check sur fichiers stagés, short-circuit O(1).
- `.astro` : typé par `astro check`, formaté par prettier-plugin-astro, hors
  périmètre oxlint.

## 10. Risques & arbitrages

| Risque                                            | Mitigation                                                   |
| ------------------------------------------------- | ------------------------------------------------------------ |
| Starlight mono-produit → friction multi-sites     | Assumé : 1 site/produit + package partagé                    |
| Dependabot + lockfile Bun encore jeune            | Surveiller ; fallback manifeste + régénération du lock       |
| Composants MDX limités au catalogue (SSG)         | Voulu — c'est la norme de consistance                        |
| TS 6 incompatible `@astrojs/check`                | TS épinglé `^5.7` pour l'instant ; ré-évaluer au bump        |
| Versioning par branche = duplication d'historique | Acceptable à cette échelle ; pas de versions tant qu'inutile |
| Couplage fort via le package partagé              | Garder `ds-shared` petit et délibéré (règle shared/local)    |

---

_Dernière mise à jour : 2026-06-03._
