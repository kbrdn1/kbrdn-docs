---
title: Personnalisation
description: Référence des sous-commandes - Personnalisation.
sidebar:
  order: 9
---

## `gwm aliases list` (issue #86)

Affiche la chaîne d'alias CLI résolue - chaque alias atteignable depuis `gwm <name>`, groupé par source. En lecture seule ; l'édition déclarative se fait directement dans `.gwm.toml` (niveau dépôt) et `~/.config/gwm/aliases.toml` (niveau utilisateur).

```bash
gwm aliases list
```

Exemple de sortie :

```text
built-in:
  cd → path
  s  → switch
repo (.gwm.toml):
  ll  → list --format names
  wip → create feat 0 wip
user (~/.config/gwm/aliases.toml):
  copy → path  (shadowed by repo)
```

Ordre de résolution (précédence la plus haute en premier) :

1. **Sous-commandes intégrées** (`gwm list`, `gwm switch`, …) - jamais masquables.
2. **Alias visibles intégrés** (`s → switch`, `cd → path`) - également jamais masquables.
3. **Dépôt (`.gwm.toml` `[aliases]`)** - suit le dépôt à travers les machines.
4. **Utilisateur (`~/.config/gwm/aliases.toml` `[aliases]`)** - survit aux réinstallations de machine ; invisible pour les coéquipiers.

Les alias sont **une simple substitution d'argv** - `wip = "create feat 0 wip"` fait que `gwm wip` se comporte comme `gwm create feat 0 wip`. L'expansion se produit AVANT que clap parse argv. Les pipelines de shell (`&&`, `||`, `|`, `;`, backticks) dans les valeurs sont refusés au chargement - utilisez plutôt un alias de shell.

Les noms qui masquent une sous-commande intégrée ou un alias visible sont une erreur de config dure remontée par `Config::load_for_repo` (par ex. vous ne pouvez pas définir `list = "..."`). Expansion en une seule passe - les alias chaînés ne récursent pas.

## `gwm theme {list|show <name>}` (issue #33)

Inspecte les presets de couleurs TUI intégrés qui sous-tendent le bloc `[theme]` dans `.gwm.toml`.

```bash
gwm theme list                 # print every built-in preset name
gwm theme show catppuccin      # dump the preset as a [theme] block
gwm theme show claude-dark | tee -a .gwm.toml   # paste a preset into config
```

- `gwm theme list` - affiche les noms de chaque preset intégré : `catppuccin`, `gruvbox`, `tokyo-night`, `claude-dark` (le dernier résout aussi sous l'alias `claude`).
- `gwm theme show <name>` - affiche le preset nommé en un bloc TOML `[theme]` copiable-collable et réversible que vous pouvez déposer dans `.gwm.toml` et ajuster par rôle.

Schéma, liste des rôles et overrides par rôle : [Configuration → `[theme]`](/fr/configuration/gwm-toml#theme). L'overlay d'aide conscient du keymap du TUI et les cadres modaux tirent leurs couleurs du thème résolu - voir la [page des raccourcis clavier du TUI](/fr/tui/keybindings).

## `gwm tui keys` (issue #87)

Affiche le keymap TUI résolu - les valeurs par défaut intégrées superposées aux overrides `[tui.keys]` de `.gwm.toml` - avec la source par ligne.

```bash
gwm tui keys
# → action            keys              source
#   down              j, Down           default
#   up                Ctrl+n            .gwm.toml
#   top               g g               default
#   …
```

La colonne action liste les slugs acceptés dans `[tui.keys]` ; la colonne keys montre chaque accord lié à cette action (séparés par des virgules). Une colonne keys vide signifie que l'action est actuellement non liée (l'utilisateur l'a explicitement effacée). Réservée comme sous-arbre (`gwm tui …`) pour que les futurs réglages TUI atterrissent sans encombrer la surface de premier niveau.

Référence du keymap et grammaire des accords : [TUI → Raccourcis clavier](/fr/tui/keybindings) ; le schéma `[tui.keys]` : [Configuration → `[tui.keys]`](/fr/configuration/gwm-toml#tuikeys).
