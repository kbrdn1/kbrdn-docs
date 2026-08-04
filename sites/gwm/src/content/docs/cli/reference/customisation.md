---
title: Customisation
description: Subcommand reference - Customisation.
sidebar:
  order: 9
---

## `gwm aliases list` (issue #86)

Print the resolved CLI alias chain - every alias reachable from `gwm <name>`, grouped by source. Read-only; declarative editing happens directly in `.gwm.toml` (repo-level) and `~/.config/gwm/aliases.toml` (user-level).

```bash
gwm aliases list
```

Sample output:

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

Resolution order (highest precedence first):

1. **Built-in subcommands** (`gwm list`, `gwm switch`, …) - never shadowable.
2. **Built-in visible aliases** (`s → switch`, `cd → path`) - also never shadowable.
3. **Repo (`.gwm.toml` `[aliases]`)** - follows the repo across machines.
4. **User (`~/.config/gwm/aliases.toml` `[aliases]`)** - survives machine reinstalls; invisible to teammates.

Aliases are **argv substitution only** - `wip = "create feat 0 wip"` makes `gwm wip` behave as `gwm create feat 0 wip`. The expansion happens BEFORE clap parses argv. Shell pipelines (`&&`, `||`, `|`, `;`, backticks) in values are refused at load time - use a shell alias instead.

Names that shadow a built-in subcommand or visible alias are a hard config error surfaced by `Config::load_for_repo` (e.g. you can't define `list = "..."`). Single-pass expansion - chained aliases don't recurse.

## `gwm theme {list|show <name>}` (issue #33)

Inspect the built-in TUI colour presets that back the `[theme]` block in `.gwm.toml`.

```bash
gwm theme list                 # print every built-in preset name
gwm theme show catppuccin      # dump the preset as a [theme] block
gwm theme show claude-dark | tee -a .gwm.toml   # paste a preset into config
```

- `gwm theme list` - print the names of every built-in preset: `catppuccin`, `gruvbox`, `tokyo-night`, `claude-dark` (the last also resolves under the alias `claude`).
- `gwm theme show <name>` - dump the named preset as a copy-pasteable, round-trippable `[theme]` TOML block you can drop into `.gwm.toml` and tweak per role.

Schema, role list, and per-role overrides: [Configuration → `[theme]`](/configuration/gwm-toml#theme). The TUI keymap-aware help overlay and modal frames pull their colours from the resolved theme - see the [TUI keybindings page](/tui/keybindings).

## `gwm tui keys` (issue #87)

Print the resolved TUI keymap - built-in defaults layered with the `[tui.keys]` overrides from `.gwm.toml` - with the source per row.

```bash
gwm tui keys
# → action            keys              source
#   down              j, Down           default
#   up                Ctrl+n            .gwm.toml
#   top               g g               default
#   …
```

The action column lists the slugs accepted in `[tui.keys]`; the keys column shows every chord bound to that action (comma-separated). An empty keys column means the action is currently unbound (the user explicitly cleared it). Reserved as a sub-tree (`gwm tui …`) so future TUI knobs land without crowding the top-level surface.

Keymap reference and chord grammar: [TUI → Keybindings](/tui/keybindings); the `[tui.keys]` schema: [Configuration → `[tui.keys]`](/configuration/gwm-toml#tuikeys).
