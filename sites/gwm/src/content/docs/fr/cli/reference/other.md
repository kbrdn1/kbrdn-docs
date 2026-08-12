---
title: Autres commandes
description: Référence des sous-commandes - Autres commandes.
sidebar:
  order: 10
---

## `gwm note show [<slug>]` (issue #515)

Affiche la note d'un worktree sur stdout, telle quelle. Sans slug, c'est la note du worktree dans lequel se trouve le répertoire courant.

```bash
gwm note show                  # la note du worktree courant
gwm note show auth             # un worktree résolu par motif fuzzy
gwm note show >/dev/null       # sortie 0 = il y a une note, 1 = il n'y en a pas
```

Une note est du Markdown brut stocké dans `<checkout-principal>/.git/gwm/notes/<branche>.md`, écrite depuis le `N` du TUI (une modale éditable, `Ctrl+e` y confie le fichier à `$EDITOR`) ou en éditant le fichier directement. Elle n'est jamais commitée, elle survit à `gwm remove`, et elle reste lisible depuis le checkout principal. Voir [TUI → notes](/fr/tui/keybindings#notes-n).

La sous-commande est en lecture seule : une note est de la prose, et la prose s'écrit dans un éditeur.

La présence signifie « non vide » : un fichier absent, illisible ou ne contenant que des blancs n'affiche rien et sort en `1`. Un fichier vide est ce qu'un éditeur laisse derrière lui quand on ouvre une note et qu'on enregistre sans rien taper, donc le traiter comme une note allumerait le marqueur de la table pour rien.

La sortie `1` couvre aussi une HEAD détachée, qui ne porte aucune note : une note est indexée sur la branche, donc un worktree sans branche n'a rien sur quoi s'indexer. La raison part sur stderr dans les deux cas, ce qui garde stdout propre pour `$(...)`.

Le même texte accompagne les lignes de `--format=json` dans un champ additif `note` (palier expérimental, omis en l'absence de note), pour qu'une statusline ou un plugin d'éditeur n'ait pas à lancer une commande par ligne.
