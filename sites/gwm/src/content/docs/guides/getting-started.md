---
title: Prise en main
description: Créer un premier worktree et découvrir la TUI.
---

## Créer un worktree

La commande `create` bootstrappe un worktree isolé et crée la branche en une seule fois, en suivant
la convention `<type>/#<issue>-<description>` :

```sh
gwm create feat 12 tui-search
# → branche feat/#12-tui-search + worktree prêt à l'emploi
```

## Lister et supprimer

```sh
gwm list        # worktrees du repo courant
gwm remove …    # supprime un worktree
```

## La TUI

Lancée sans argument, `gwm` ouvre une TUI (ratatui) dans le repo courant pour naviguer et agir sur
les worktrees au clavier :

```sh
gwm
```

## Diagnostic

```sh
gwm doctor      # vérifications de santé du repo et de la config .gwm.toml
```
