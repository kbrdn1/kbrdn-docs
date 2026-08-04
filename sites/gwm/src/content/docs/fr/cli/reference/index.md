---
title: Référence des sous-commandes
description: Chaque sous-commande `gwm` avec sa synopsis, ses flags, ses codes de sortie et des exemples.
sidebar:
  order: 1
---

`gwm <subcommand>` est la face scriptable de gwm. Chaque commande se termine avec un code significatif (`0` ok, `1` avertissement, `2` échec), de sorte que vous pouvez brancher `gwm doctor` dans la CI sans parser la sortie standard.

`gwm` seul (sans sous-commande) ouvre le [TUI](/fr/tui) sur le dépôt courant.

- [Installation et configuration](./setup/)
- [Cycle de vie des worktrees](./worktrees/)
- [Issues, pull requests et reviews](./github/)
- [Corvées de flotte et workspace](./fleet/)
- [Shell et multiplexeurs](./shell/)
- [Diagnostic et services](./services/)
- [Historique, annulation et confiance](./safety/)
- [Personnalisation](./customisation/)

## Codes de sortie

| Code | Signification                                                              |
| :--- | :------------------------------------------------------------------------- |
| `0`  | succès - aussi « tout au vert » pour `gwm doctor`                          |
| `1`  | échec récupérable - échec fuzzy, correspondance ambiguë, Warning du doctor |
| `2`  | échec dur - bootstrap `✗`, Failure du doctor, erreur git irrécupérable     |
