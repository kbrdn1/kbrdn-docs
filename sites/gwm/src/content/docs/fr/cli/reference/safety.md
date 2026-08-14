---
title: Historique, annulation et confiance
description: gwm undo, history et trust - rejouer les opérations récentes, annuler la dernière, et gérer le ledger de confiance TOFU.
sidebar:
  order: 8
---

## `gwm undo [--bootstrap]`

Récupère d'une suppression ratée sans archéologie de `git reflog`. Dépile l'opération destructive la plus récente enregistrée pour le dépôt courant, recrée `refs/heads/<branch>` à l'OID sauvegardé, et réajoute le worktree au chemin sauvegardé (avec `reuse_branch` pour que la branche ressuscitée s'attache proprement). Les suppressions faites avec `d` dans la TUI sont enregistrées comme celles de `gwm remove`, donc les deux sont récupérables ici.

```bash
gwm undo                       # bring back the last removed worktree + branch
gwm undo --bootstrap           # ...and re-run the per-worktree bootstrap
```

| Flag          | Action                                                                         |
| :------------ | :----------------------------------------------------------------------------- |
| `--bootstrap` | Relance le bootstrap par worktree après la résurrection (désactivé par défaut) |

L'undo est par worktree : une suppression en lot (`gwm remove a b c`, ou `Space` + `d` dans la TUI) ajoute une entrée par worktree, et chaque `gwm undo` en dépile une. L'entrée est écrite une fois la suppression réussie, donc une cible refusée n'apparaît jamais ici comme quelque chose à rejouer.

L'entrée du journal n'est consommée **qu'après** une résurrection réussie : un échec en cours de route laisse l'ancre de récupération intacte pour que vous puissiez réessayer. Une entrée en detached-HEAD (aucune branche à recréer) est refusée avec une erreur explicite plutôt que de ne rien faire silencieusement. Le journal est partagé avec [`gwm history`](#gwm-history---limit-n---all) ; voyez-le pour l'emplacement du fichier et la politique de rotation.

## `gwm history [--limit N] [--all]`

Liste les opérations destructives récentes enregistrées par gwm, les plus récentes en premier.

```bash
gwm history                    # last 20 ops for the current repo
gwm history --limit 50         # last 50
gwm history --all              # every op across every repo (forensic / multi-repo)
```

| Flag        | Action                                                                         |
| :---------- | :----------------------------------------------------------------------------- |
| `--limit N` | Nombre maximum d'entrées à afficher, les plus récentes en premier. Défaut `20` |
| `--all`     | Liste les opérations de tous les dépôts, pas seulement le courant              |

Par défaut il filtre sur le workdir canonicalisé du dépôt courant ; `--all` fait remonter chaque entrée. Un résultat vide affiche `no operations recorded` comme signal scripté stable. Le journal vit à `$XDG_DATA_HOME/gwm/history.toml` (à surcharger avec `$GWM_HISTORY_FILE` ; macOS retombe sous `Application Support`, Windows sous `%LOCALAPPDATA%`) et est plafonné à 100 entrées : la plus ancienne est supprimée en cas de débordement. Chaque `gwm remove` qui supprime effectivement quelque chose (avec ou sans `--delete-branch`) ajoute une entrée ; un refus n'en ajoute aucune, et `gwm remove --dry-run` n'écrit **pas** dans le journal, donc prévisualiser une destruction ne peut jamais vous laisser « annuler » quelque chose qui n'a jamais eu lieu.

## `gwm trust {list|revoke|show}` (issue #95)

Gère le registre de confiance TOFU qui conditionne le bootstrap de `.gwm.toml` sur `gwm create` / `gwm bootstrap`. Le registre vit à `~/.config/gwm/trust.toml` par défaut ; à surcharger avec `$GWM_TRUST_LEDGER`.

- `gwm trust list` : affiche chaque tuple enregistré `(origin, sha-prefix, trusted_at, trusted_by)`. Un registre vide affiche `0 entries in trust ledger (<path>)` et sort 0.
- `gwm trust revoke <origin>` : supprime chaque entrée correspondant à `<origin>` à l'identique (les variantes SSH et HTTPS du même dépôt GitHub sont des chemins de confiance distincts). Rapporte `0 entries matched` quand rien ne change.
- `gwm trust show` : affiche le chemin du registre actif et son corps TOML brut (ou un avis « file does not exist yet » sur les installations fraîches). Utile pour trier les « pourquoi gwm me redemande-t-il ? » : comparez à l'œil le hash enregistré avec `sha256sum .gwm.toml`.

Deux flags **globaux** interagissent avec le registre sur chaque sous-commande qui lance le bootstrap (`gwm create`, `gwm bootstrap`) :

- `--allow-bootstrap` (aussi `GWM_ALLOW_BOOTSTRAP=1`) saute l'invite de confiance sans enregistrer. À utiliser dans les runners CI et autres contextes non interactifs.
- `--deny-bootstrap` refuse de lancer le bootstrap même si le registre dit « trusted ». Mode forensique pour une première inspection d'un dépôt inconnu.

Modèle de menace et justification complète : voir le commentaire au niveau module dans [`src/trust.rs`](https://github.com/kbrdn1/gwm-cli/blob/main/src/trust.rs).
