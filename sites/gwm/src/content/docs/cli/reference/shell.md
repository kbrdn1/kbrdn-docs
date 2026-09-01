---
title: Shell and multiplexers
description: gwm completions, shell-init, tmux and zellij - shell completions, the gcd cd helper, and opening a worktree in a multiplexer.
sidebar:
  order: 6
---

## `gwm completions <shell>`

Print a static completion script. Supported shells: `zsh`, `bash`, `fish`, `powershell`, `elvish`. See [Shell completions](/cli/completions) for installation per shell.

## `gwm shell-init <shell>`

Print the `gcd` shell wrapper. Supported shells: `zsh`, `bash`, `fish`, `powershell`. See [Getting started → Shell init](/getting-started/shell-init).

## `gwm tmux <pattern> [-p|--split] [--direction <dir>]`

Open the matched worktree in a new tmux window of the **current** session. `--split` substitutes `split-window` for `new-window`. Requires `$TMUX` to be set.

```bash
gwm tmux auth                     # new tmux window inside the matched worktree
gwm tmux auth -p                  # split the current pane instead
gwm tmux auth --direction down    # ...stacked rather than side by side
```

`--split` takes its direction from [`[tui] mux_pane_direction`](/configuration/gwm-toml#mux_pane_direction), which defaults to `right` (`split-window -h`). `--direction <dir>` (`right`, `down`, `left`, `up`) overrides it for one invocation and implies `--split`. Before #589 a split carried no flag at all and tmux stacked it.

Outside a tmux session, exits non-zero with a clear error (does not spawn a stray server).

## `gwm zellij <pattern> [-p|--split] [--direction <dir>]`

Same as `gwm tmux` but for zellij. Uses `zellij action new-tab --cwd <path>` (requires zellij ≥ 0.40 for the `--cwd` flag) or `new-pane --direction <dir> --cwd <path>` with `-p`. Requires `$ZELLIJ`.

The direction is passed rather than left out: without it zellij places the pane in "the biggest available space", which is a layout-dependent answer to a keystroke that should have a fixed one.
