---
title: Shell et multiplexeurs
description: gwm completions, shell-init, tmux et zellij - les complétions de shell, le helper de cd gcd, et l'ouverture d'un worktree dans un multiplexeur.
sidebar:
  order: 6
---

## `gwm completions <shell>`

Affiche un script de complétion statique. Shells pris en charge : `zsh`, `bash`, `fish`, `powershell`, `elvish`. Voir [Complétions de shell](/fr/cli/completions) pour l'installation par shell.

## `gwm shell-init <shell>`

Affiche le wrapper de shell `gcd`. Shells pris en charge : `zsh`, `bash`, `fish`, `powershell`. Voir [Premiers pas → Shell init](/fr/getting-started/shell-init).

## `gwm tmux <pattern> [-p|--split] [--direction <dir>]`

Ouvre le worktree correspondant dans une nouvelle fenêtre tmux de la session **courante**. `--split` substitue `split-window` à `new-window`. Nécessite que `$TMUX` soit défini.

```bash
gwm tmux auth                     # new tmux window inside the matched worktree
gwm tmux auth -p                  # split the current pane instead
gwm tmux auth --direction down    # ...empilé plutôt que côte à côte
```

`--split` prend sa direction dans [`[tui] mux_pane_direction`](/fr/configuration/gwm-toml#mux_pane_direction), dont le défaut est `right` (`split-window -h`). `--direction <dir>` (`right`, `down`, `left`, `up`) la remplace pour une invocation et implique `--split`. Avant #589, un split ne portait aucun flag et tmux l'empilait.

En dehors d'une session tmux, sort avec un code non nul et une erreur claire (ne lance pas de serveur orphelin).

## `gwm zellij <pattern> [-p|--split] [--direction <dir>]`

Comme `gwm tmux` mais pour zellij. Utilise `zellij action new-tab --cwd <path>` (nécessite zellij ≥ 0.40 pour le flag `--cwd`) ou `new-pane --direction <dir> --cwd <path>` avec `-p`. Nécessite `$ZELLIJ`.

La direction est passée plutôt qu'omise : sans elle, zellij place le panneau dans « le plus grand espace disponible », une réponse dépendante du layout à une touche qui devrait en avoir une fixe.
