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

## `gwm tmux <pattern> [-p|--split]`

Ouvre le worktree correspondant dans une nouvelle fenêtre tmux de la session **courante**. `--split` substitue `split-window` à `new-window`. Nécessite que `$TMUX` soit défini.

```bash
gwm tmux auth                  # new tmux window inside the matched worktree
gwm tmux auth -p               # split the current pane instead
```

En dehors d'une session tmux, sort avec un code non nul et une erreur claire (ne lance pas de serveur orphelin).

## `gwm zellij <pattern> [-p|--split]`

Comme `gwm tmux` mais pour zellij. Utilise `zellij action new-tab --cwd <path>` (nécessite zellij ≥ 0.40 pour le flag `--cwd`) ou `new-pane --cwd` avec `-p`. Nécessite `$ZELLIJ`.

Voir [CLI → Intégration multiplexeur](/fr/cli/multiplexer) pour la surface complète et les cas limites.
