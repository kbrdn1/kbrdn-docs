---
title: Shell and multiplexers
description: gwm completions, shell-init, tmux and zellij - shell completions, the gcd cd helper, and opening a worktree in a multiplexer.
sidebar:
  order: 6
---

## `gwm completions <shell>`

Print a static completion script. Supported shells: `zsh`, `bash`, `fish`, `powershell`, `elvish`. See [Shell completions](/cli/completions) for installation per shell.

## `gwm shell-init <shell>`

Print the `gcd` shell wrapper. Supported shells: `zsh`, `bash`, `fish`, `powershell`. See [Getting Started → Shell init](/getting-started/shell-init).

## `gwm tmux <pattern> [-p|--split]`

Open the matched worktree in a new tmux window of the **current** session. `--split` substitutes `split-window` for `new-window`. Requires `$TMUX` to be set.

```bash
gwm tmux auth                  # new tmux window inside the matched worktree
gwm tmux auth -p               # split the current pane instead
```

Outside a tmux session, exits non-zero with a clear error (does not spawn a stray server).

## `gwm zellij <pattern> [-p|--split]`

Same as `gwm tmux` but for zellij. Uses `zellij action new-tab --cwd <path>` (requires zellij ≥ 0.40 for the `--cwd` flag) or `new-pane --cwd` with `-p`. Requires `$ZELLIJ`.

See [CLI → Multiplexer integration](/cli/multiplexer) for the full surface and edge cases.
