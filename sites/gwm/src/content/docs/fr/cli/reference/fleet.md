---
title: Corvées de flotte et workspace
description: gwm exec et clean, plus le mode workspace - lancer une commande sur tous les worktrees et récupérer l'espace pris par les artefacts de build.
sidebar:
  order: 5
---

## Mode workspace (global `--workspace`) (issue #36)

`--workspace <dir>` est un flag **global** (`global = true`, donc accepté avant _ou_ après la sous-commande) qui opère sur chaque dépôt git situé un niveau sous `<dir>` au lieu d'un dépôt unique. C'est une dimension orthogonale par-dessus le mode mono-dépôt.

```bash
gwm --workspace ~/Projects               # open the TUI over every direct-child repo
gwm list --workspace ~/Projects          # merged worktree table, leading REPO column
gwm --workspace ~/Projects list          # same — the global flag may precede the subcommand
gwm --workspace ~/Projects create feat 12 search --repo my-api   # disambiguate the target
gwm exec --workspace ~/Projects -- git fetch   # fan out across every child repo's worktrees
gwm clean --workspace ~/Projects --yes         # reclaim artifacts across every child repo
```

- **Le TUI / `gwm list`** gagnent une colonne **REPO** en tête nommant le dépôt de chaque ligne. Dans le TUI, le dépôt actif suit la sélection, donc chaque action pilotée par la sélection (lazygit, terminal, sync, delete, link, open, …) opère sur le dépôt propre au worktree surligné.
- **`gwm create`** en mode workspace requiert `--repo <name>` pour lever l'ambiguïté sur le dépôt enfant qui reçoit le nouveau worktree ; un nom absent ou inconnu liste les candidats.
- **`gwm exec` / `gwm clean`** (issue #326) se déploient (fan-out) sur chaque dépôt enfant. La commande / le jeu de répertoires de chaque dépôt est résolu en amont (un `--profile` manquant, un `[exec]`/`[clean]` malformé, ou un dépôt enfant inouvrable échoue avant toute exécution), puis les dépôts s'exécutent **séquentiellement** (le parallélisme reste borné _au sein_ d'un dépôt) sous un en-tête `══ <repo>`, avec un récapitulatif / rapport taggé `<repo>/<worktree>` et un code de sortie agrégé. `--profile` se résout par dépôt contre son propre `.gwm.toml` ; un slug ne correspondant à rien dans un dépôt n'y contribue rien. `gwm clean --workspace` agrège un seul rapport et une seule décision `--yes` sur tous les dépôts ; un échec de suppression dans un worktree est rapporté mais n'interrompt pas les autres. **`--workspace` reste refusé sur les commandes qui ne l'implémentent pas.**
- **`gwm` seul** dans un répertoire qui n'est _pas_ lui-même un dépôt git mais contient des dépôts enfants invite `No git repo here. Open <dir> as a workspace? [Y/n]`. L'invite est **déclinée silencieusement quand stdin n'est pas un terminal**, donc les pipes / la CI conservent l'ancien comportement mono-dépôt.
- **`.gwm.toml` reste par dépôt** : chaque ligne hérite de la config de son propre dépôt. Il n'y a pas de config au niveau workspace dans cette version ; le keymap et le thème sont résolus une fois depuis le premier dépôt, conformément au contrat mono-dépôt « résolu une fois, relancer pour changer ».

## `gwm exec [<slug>...] [--profile <nom>] [--jobs <n>] -- <cmd>` (issues #313, #324)

Lance une commande dans chaque worktree, séquentiellement par défaut ou avec un parallélisme borné : une corvée de flotte sur chaque worktree du dépôt.

```bash
gwm exec -- git fetch                    # run `git fetch` in every non-main worktree
gwm exec feat-1 fix-2 -- cargo check     # scope to two fuzzy-matched worktrees
gwm exec -- git log --oneline -5         # everything after `--` is forwarded verbatim
gwm exec --profile test                  # run the saved [exec.profiles.test] command
gwm exec --jobs 4 -- cargo build         # fan out 4 worktrees at a time
```

Les slugs positionnels **avant** `--` cadrent l'ensemble (correspondance fuzzy, le même matcher que `gwm path` / `remove`) ; sans aucun, il cible chaque worktree non principal. Tout ce qui est **après** `--` est la commande, transmise telle quelle, flags compris. gwm affiche un en-tête `━━ <name> (<path>)` par worktree, puis un récapitulatif `✓ / ✗` par worktree, et sort avec un code non nul si la commande d'un worktree a échoué (vous pouvez donc en faire un garde de CI). Un ensemble cible vide affiche `no worktrees to run in` et sort `0`.

`--profile <nom>` lance une commande sauvegardée [`[exec.profiles.<nom>]`](/fr/configuration/gwm-toml#exec-et-clean) au lieu d'un inline. Le `command` du profil est un **tableau** d'argv exécuté **sans shell**, le même contrat que la forme inline, et une divergence délibérée avec le `command` ligne-shell de `[git_tui]` / `[review]`. `--profile` et un inline `-- <cmd>` sont **mutuellement exclusifs** (les fournir ensemble sort en `1`) ; un nom de profil **inconnu** sort en `1`.

`--jobs <n>` définit un **parallélisme borné**. `1` (le défaut) s'exécute séquentiellement avec la sortie live héritée. `> 1` lance jusqu'à N worktrees à la fois, en capturant la sortie de chacun et en l'imprimant en un bloc par worktree (dans l'ordre des worktrees) une fois le fan-out terminé, pour que les exécutions concurrentes ne s'entremêlent pas. Précédence : `--jobs` > le [`jobs`](/fr/configuration/gwm-toml#exec-et-clean) d'un profil > `[exec] jobs` > `1`. Le code de sortie agrégé est inchangé.

Un profil peut aussi porter un bloc [`[container]`](/fr/configuration/gwm-toml#exec-et-clean) (issue #421), qui exécute sa commande dans `docker run` / `podman run` au lieu de l'hôte : `━━ feat-1 (/chemin) [docker rust:1.90]`. Le worktree **et** le gitdir du checkout principal sont montés à leurs chemins d'hôte, pour que git réponde dans le conteneur, là où monter le seul worktree ne suffirait pas : puisque le `.git` d'un worktree lié est un fichier contenant un chemin absolu de l'hôte. Le bloc ne vit que sur un **profil** : un inline `-- <cmd>` s'exécute toujours sur l'hôte.

Cela lance la propre commande de l'utilisateur contre ses propres worktrees, donc **aucun garde de confiance de bootstrap** ([`gwm trust`](#gwm-trust-listrevokeshow-issue-95)) ne s'applique. Ce n'est **pas** journalisé dans [`gwm history`](#gwm-history---limit-n---all).

## `gwm clean [<slug>...] [--profile <nom>] [--yes]` (issues #313, #324)

Rapporte, et optionnellement récupère, les artefacts de build lourds à travers les worktrees. **Rapport seul par défaut.**

```bash
gwm clean                                # report reclaimable artifacts in every non-main worktree
gwm clean feat-1                         # scope to a fuzzy-matched worktree
gwm clean --yes                          # actually delete the listed artifacts
gwm clean --profile deep                 # use the [clean.profiles.deep] directory set
```

`gwm clean` scanne chaque worktree cible pour `target/`, `node_modules/`, `dist/` et `build/` et affiche la taille récupérable par worktree. Les slugs positionnels cadrent l'ensemble (fuzzy) ; sans aucun, il cible chaque worktree non principal. Sans `--yes` il se contente de rapporter et affiche `re-run with --yes to delete the listed artifacts` ; un résultat vide affiche `nothing to reclaim`.

| Flag              | Action                                                                                                                                                                         |
| :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <nom>` | Récupère le jeu de répertoires [`[clean.profiles.<nom>]`](/fr/configuration/gwm-toml#exec-et-clean), un jeu **complet** qui remplace les intégrés (un nom inconnu sort en `1`) |
| `--yes`           | Supprime les artefacts listés au lieu de seulement les rapporter                                                                                                               |

Sans `--profile`, `gwm clean` utilise `[clean.profiles.default]` quand ce profil est défini, sinon les `target`/`node_modules`/`dist`/`build` intégrés. Le `dirs` d'un profil **remplace** les intégrés (ne s'y ajoute jamais) ; la barrière de sûreté ci-dessous s'applique toujours à chaque répertoire.

**Sûreté :** `--yes` supprime un répertoire **uniquement** quand git le traite comme ignoré _et_ qu'il ne contient aucun fichier suivi. Un `dist/` ou `build/` qui est suivi ou rédigé à la main (donc non régénérable) est rapporté comme `skipped … not git-ignored, or holds tracked files`, jamais supprimé. Parce que les artefacts sont régénérables, `gwm clean` est **délibérément non journalisé** dans [`gwm history`](#gwm-history---limit-n---all) : il n'y a pas de `gwm undo` pour lui.
