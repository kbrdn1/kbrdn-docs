---
title: Autres commandes
description: Sous-commandes gwm pas encore rangées dans un groupe de la référence, avec synopsis, flags et exemples.
sidebar:
  order: 10
---

## `gwm herdr <pattern> [-p|--split] [--direction <dir>]`

Comme `gwm tmux` mais pour [herdr](https://herdr.dev). Utilise `herdr tab create --workspace <id> --label <name> --cwd <path> --focus`, ou `herdr pane split --current --direction <dir> --cwd <path> --focus` avec `-p`. Nécessite `$HERDR_ENV`, que herdr fixe dans chaque panneau qu'il gère.

Le parseur de herdr n'a pas de défaut pour `--direction`, donc le flag n'y est pas optionnel : la valeur vient de `--direction` ou de `[tui] mux_pane_direction`. herdr ne prend que `right` et `down` : `left` et `up` y sont refusés, avec le message qui le dit. `--focus` et `--workspace` sont passés car aucun des deux n'est le défaut de herdr : sans eux, l'onglet s'ouvre sans focus, dans le workspace que le serveur avait en focus plutôt que le vôtre. L'id du workspace vient de `$HERDR_WORKSPACE_ID`.

Voir [CLI → Intégration multiplexeur](/fr/cli/multiplexer) pour la surface complète et les cas limites.
