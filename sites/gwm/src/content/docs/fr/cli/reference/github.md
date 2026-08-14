---
title: Issues, pull requests et reviews
description: gwm link, unlink, open, status, labels, milestones, pr et review - relier un worktree à son issue et à sa pull request, sur GitHub ou GitLab.
sidebar:
  order: 4
---

## `gwm review <PR#> [--name <branch>] [--bootstrap] [--skip-hooks <phases>]` (issue #308)

Matérialise une PR GitHub existante dans un worktree isolé : récupère le head de la PR, attache un worktree, lie la PR, et vous reviewez le code du contributeur en quelques secondes.

```bash
gwm review 310                          # fetch PR #310 into review/pr-310-<author>-<slug>
gwm review 310 --name pr-310            # override the local review branch name
gwm review 310 --bootstrap              # ...and run bootstrap + lifecycle hooks (opt-in)
```

`gwm review` résout le head de la PR via `gh` et récupère la ref universelle `refs/pull/<N>/head` d'origin, il est donc **conscient des forks croisés** et valide pour des PR dans n'importe quel état (open / draft / closed / merged). Il crée une branche locale `review/pr-<N>-<author>-<slug>`, attache un worktree (le répertoire est dérivé du nom de branche, les slashes deviennent des tirets), et lie la PR pour que la [barre latérale / l'indicateur CI du TUI](/fr/tui) s'allument immédiatement. Démontez comme n'importe quel worktree : `gwm remove <dir> --delete-branch`.

| Flag                    | Action                                                                                                                             |
| :---------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| `--name <BRANCH>`       | Surcharge le nom de la branche de review locale (défaut `review/pr-<N>-<author>-<slug>`) ; le répertoire du worktree en est dérivé |
| `--bootstrap`           | Lance bootstrap + hooks de cycle de vie contre le code de la PR après création (désactivé par défaut)                              |
| `--skip-hooks <PHASES>` | Saute les phases de hook de cycle de vie séparées par des virgules (par ex. `pre_create,post_create`)                              |

**Sûr par défaut :** le bootstrap et les hooks de cycle de vie ne sont **pas** lancés. Un worktree de review contient le code d'un contributeur (possiblement issu d'un fork), et ces étapes exécutent des commandes contre lui (`npm install`, `composer install`, `direnv allow`, hooks `post_create` …), c'est-à-dire du code arbitraire. Passez `--bootstrap` pour l'activer une fois que vous faites assez confiance à la PR pour la mettre en place. C'est distinct du bloc de config `[review]` (qui pilote la touche lanceur de review `R` du TUI) ; `gwm review` est la sous-commande de matérialisation de worktree.

## `gwm pr [--draft] [--base <ref>] [--render]`

Rend le corps de la PR depuis `[pr_template]` et délègue à `gh pr create` contre le tronc résolu.

```bash
gwm pr                                # creates the PR
gwm pr --draft                        # creates a draft PR
gwm pr --base develop                 # diff against develop instead of [doctor].trunks
gwm pr --render                       # prints the rendered body to stdout (no PR created)
gwm pr --render | gh pr create --body-file -
```

`gwm pr` lit la branche courante (en parsant `<type>/#<N>-<desc>` pour les placeholders `{type}` / `{issue}` / `{desc}`), choisit le premier tronc existant de `[doctor].trunks` (ou retombe sur `main`), puis rend le template par type de branche sous `[pr_template.by_type.<type>]` (le `body` inline l'emporte sur `path`), avec `[pr_template].default` comme repli.

| Flag           | Action                                                                  |
| :------------- | :---------------------------------------------------------------------- |
| `--render`     | Affiche le Markdown rendu sur stdout ; ne délègue jamais à `gh`         |
| `--draft`      | Transmet `--draft` à `gh pr create` pour que la PR s'ouvre en brouillon |
| `--base <REF>` | Surcharge la base de comparaison au lieu du premier tronc correspondant |

En cas de succès, le numéro de la nouvelle PR est enregistré sous `branch.<head>.gwm-pr` (la même clé que `gwm link pr` écrit), donc `gwm status` et `gwm open pr` résolvent le lien sans appel `gwm link` séparé.

La résolution du corps et la sémantique des placeholders sont documentées sous [Configuration → `[pr_template]`](/fr/configuration/gwm-toml#pr_template-issue-84).

## `gwm link {issue|pr} <N> [--worktree <pattern>]`

Lie le worktree courant (ou nommé) à une issue ou une PR GitHub.

```bash
gwm link issue 42              # link the current worktree to issue #42
gwm link pr 61                 # link a PR
gwm link issue 42 --worktree feat-auth      # ...or to a fuzzy-matched worktree
```

Le lien est stocké dans `git config branch.<name>.gwm-issue` / `gwm-pr` : local, par branche, aucun fichier supplémentaire. Les numéros d'issue sont **détectés automatiquement** depuis les branches `<type>/#<N>-<slug>`, donc `gwm link issue <N>` n'est nécessaire que pour les overrides explicites. Les numéros de PR ne sont pas détectés automatiquement.

## `gwm unlink {issue|pr} [--worktree <pattern>]`

Supprime l'override de lien explicite sur le worktree courant (ou nommé).

```bash
gwm unlink issue               # remove the issue link (auto-detect resurfaces)
gwm unlink pr                  # remove the PR link
```

Idempotent : sûr à exécuter quand rien n'est lié.

## `gwm open {issue|pr} [--worktree <pattern>] [--print-url]`

Ouvre l'issue / PR liée dans le navigateur via l'ouvreur de l'OS.

```bash
gwm open issue                 # spawn the OS opener on the linked issue URL
gwm open pr --print-url        # print the URL on stdout, no spawn
```

Utile dans les shells headless et les tests avec `--print-url`.

## `gwm status [--worktree <pattern>] [--json]`

Affiche le lien plus (quand `gh` est disponible) l'état GitHub en direct.

```bash
gwm status
# → Issue #42 [open] TUI: fuzzy search
# → PR #61 [draft] · checks 2/3

gwm status --json              # stable schema for scripts
```

Se dégrade proprement vers une sortie lien-local-uniquement quand `gh` manque ou que le dépôt n'a pas de remote GitHub.

## `gwm labels {list|push}`

Gère l'ensemble déclaratif de labels GitHub depuis `.gwm.toml`. Déclarez une fois les labels que vous voulez dans `[[labels]]`, poussez-les vers le remote `origin` upstream au besoin. Plus de dérive entre dépôts. Sans bloc `[[labels]]` dans `.gwm.toml`, les deux sous-commandes sont des no-ops (`0 labels declared, nothing to push`) et ne délèguent jamais à `gh`.

```bash
gwm labels list                       # show the diff against the remote
gwm labels push                       # apply create + update
gwm labels push --dry-run             # plan only, no remote mutations
gwm labels push --prune               # also delete labels not in config
gwm labels push --random-colors       # random pastel for entries with no `color`
```

| Flag              | Action                                                                                                                                                                        |
| :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`       | Affiche le plan sans muter le remote. Lit tout de même les labels distants via `gh label list` pour calculer le diff ; seuls les appels create / update / delete sont sautés. |
| `--prune`         | Supprime sur le remote les labels non déclarés dans `.gwm.toml` (destructif, opt-in)                                                                                          |
| `--random-colors` | Utilise un pastel aléatoire pour les entrées sans champ `color` (surcharge le hash déterministe)                                                                              |

Les sigils de sortie de `list` reflètent les groupes de diff :

```
+ bug                  (will create, color #d73a4a)
~ good first issue     (color #008672 → #7057ff)
= documentation        (match)
- wontfix              (on remote, not in config)
```

Nécessite `gh` sur le `$PATH` (la même dépendance souple que `gwm status`). Référence du schéma et conseils de rédaction : [Configuration → `.gwm.toml`](/fr/configuration/gwm-toml#labels-issue-81).

## `gwm milestones {list|push}`

Gère l'ensemble déclaratif de milestones GitHub depuis `.gwm.toml`. Même forme que `gwm labels` ; l'endpoint REST est utilisé parce que `gh` n'a pas de sous-commande `gh milestone` native. Sans bloc `[[milestones]]` dans `.gwm.toml`, les deux sous-commandes sont des no-ops (`0 milestones declared, nothing to push`) et ne délèguent jamais à `gh`.

```bash
gwm milestones list                     # show the diff against the remote
gwm milestones push                     # apply create + update
gwm milestones push --dry-run           # plan only, no remote mutations
gwm milestones push --prune             # also delete milestones not in config
```

| Flag        | Action                                                                                                                                                                                  |
| :---------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run` | Affiche le plan sans muter le remote. Lit tout de même les milestones distants via `gh api …/milestones` pour calculer le diff ; seuls les appels create / update / delete sont sautés. |
| `--prune`   | Supprime sur le remote les milestones non déclarés dans `.gwm.toml` (destructif, opt-in)                                                                                                |

Les sigils de sortie de `list` reflètent les groupes de diff :

```
+ v0.7.0               (will create, state open, due 2026-07-15T23:59:59Z)
~ v0.6.0               (due 2026-07-01T23:59:59Z → 2026-07-15T23:59:59Z)
= v0.5.0               (match)
- old-sprint           (#3 on remote, not in config)
```

Nécessite `gh` sur le `$PATH`. Référence du schéma et conseils de rédaction : [Configuration → `.gwm.toml`](/fr/configuration/gwm-toml#milestones-issue-82).
