---
title: Other commands
description: gwm subcommands not yet filed under a reference group, with synopsis, flags and examples.
sidebar:
  order: 10
---

## `gwm herdr <pattern> [-p|--split] [--direction <dir>]`

Same as `gwm tmux` but for [herdr](https://herdr.dev). Uses `herdr tab create --workspace <id> --label <name> --cwd <path> --focus`, or `herdr pane split --current --direction <dir> --cwd <path> --focus` with `-p`. Requires `$HERDR_ENV`, which herdr sets in every pane it manages.

herdr's parser has no default for `--direction`, so the flag is not optional here: the value comes from `--direction` or from `[tui] mux_pane_direction`. herdr takes only `right` and `down`: `left` and `up` are refused there, with a message that says so. `--focus` and `--workspace` are passed because neither is herdr's default: without them the tab opens unfocused, in whichever workspace the server had focused rather than yours. The workspace id comes from `$HERDR_WORKSPACE_ID`.

See [CLI → Multiplexer integration](/cli/multiplexer) for the full surface and edge cases.
