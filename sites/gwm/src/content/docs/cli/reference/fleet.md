---
title: Fleet chores and workspace
description: Subcommand reference - Fleet chores and workspace.
sidebar:
  order: 5
---

## Workspace mode (global `--workspace`) (issue #36)

`--workspace <dir>` is a **global** flag (`global = true`, so it is accepted before _or_ after the subcommand) that operates across every git repo one level below `<dir>` instead of a single repo. It is an orthogonal dimension on top of single-repo mode.

```bash
gwm --workspace ~/Projects               # open the TUI over every direct-child repo
gwm list --workspace ~/Projects          # merged worktree table, leading REPO column
gwm --workspace ~/Projects list          # same — the global flag may precede the subcommand
gwm --workspace ~/Projects create feat 12 search --repo my-api   # disambiguate the target
gwm exec --workspace ~/Projects -- git fetch   # fan out across every child repo's worktrees
gwm clean --workspace ~/Projects --yes         # reclaim artifacts across every child repo
```

- **TUI / `gwm list`** gain a leading **REPO** column naming each row's repo. In the TUI the active repo follows the selection, so every selection-driven action (lazygit, terminal, sync, delete, link, open, …) operates on the highlighted worktree's own repo.
- **`gwm create`** in workspace mode requires `--repo <name>` to disambiguate which child repo gets the new worktree; an absent or unknown name lists the candidates.
- **`gwm exec` / `gwm clean`** (issue #326) fan out across every child repo. Each repo's command / dir-set is resolved upfront (a missing `--profile`, a malformed `[exec]`/`[clean]`, or an unopenable child errors before anything runs), then repos run **sequentially** (parallelism stays bounded _within_ a repo) under a `══ <repo>` header, with a `<repo>/<worktree>`-tagged rollup / report and an aggregated exit code. `--profile` resolves per repo against that repo's own `.gwm.toml`; a slug matching nothing in a repo contributes nothing there. `gwm clean --workspace` aggregates one report and one `--yes` decision across all repos; a delete failure in one worktree is reported but doesn't abort the rest. **`--workspace` is still refused on commands that don't implement it.**
- **Bare `gwm`** in a directory that is _not_ itself a git repo but holds child repos prompts `No git repo here. Open <dir> as a workspace? [Y/n]`. The prompt is **declined silently when stdin is not a terminal**, so pipes / CI keep the old single-repo behaviour.
- **`.gwm.toml` stays per-repo**: each row inherits its own repo's config. There is no workspace-level config in this version; the keymap and theme resolve once from the first repo, matching the single-repo "resolved once, relaunch to change" contract.

## `gwm exec [<slug>...] [--profile <name>] [--jobs <n>] -- <cmd>` (issues #313, #324)

Run a command in each worktree, sequentially by default or with bounded parallelism: a fleet chore across every worktree of the repo.

```bash
gwm exec -- git fetch                    # run `git fetch` in every non-main worktree
gwm exec feat-1 fix-2 -- cargo check     # scope to two fuzzy-matched worktrees
gwm exec -- git log --oneline -5         # everything after `--` is forwarded verbatim
gwm exec --profile test                  # run the saved [exec.profiles.test] command
gwm exec --jobs 4 -- cargo build         # fan out 4 worktrees at a time
```

Positional slugs **before** `--` scope the set (fuzzy-matched, same matcher as `gwm path` / `remove`); with none, it targets every non-main worktree. Everything **after** `--` is the command, forwarded verbatim, flags and all. gwm prints a `━━ <name> (<path>)` header per worktree, then a per-worktree `✓ / ✗` rollup, and exits non-zero if any worktree's command failed (so you can gate CI on it). An empty target set prints `no worktrees to run in` and exits `0`.

`--profile <name>` runs a saved [`[exec.profiles.<name>]`](/configuration/gwm-toml#exec-and-clean) command instead of an inline one. The profile's `command` is an argv **array** run with **no shell**, the same contract as the inline form, and a deliberate divergence from the shell-line `command` of `[git_tui]` / `[review]`. `--profile` and an inline `-- <cmd>` are **mutually exclusive** (passing both exits `1`); an **unknown** profile name exits `1`.

`--jobs <n>` sets **bounded parallelism**. `1` (the default) runs sequentially with live, inherited output. `> 1` runs up to N worktrees at once, capturing each one's output and printing it as a per-worktree block (in worktree order) once the fan-out finishes, so concurrent runs don't interleave. Precedence: `--jobs` > a profile's [`jobs`](/configuration/gwm-toml#exec-and-clean) > `[exec] jobs` > `1`. The aggregate exit code is unchanged.

A profile can also carry a [`[container]`](/configuration/gwm-toml#exec-and-clean) block (issue #421), which runs its command inside `docker run` / `podman run` instead of on the host: `━━ feat-1 (/path) [docker rust:1.90]`. The worktree **and** the main checkout's gitdir are mounted at their host paths, so git answers inside the container, where mounting the worktree alone would not: since a linked worktree's `.git` is a file holding an absolute host path. The block rides a **profile only**: an inline `-- <cmd>` always runs on the host.

This runs the user's own command against their own worktrees, so **no bootstrap trust gate** ([`gwm trust`](#gwm-trust-listrevokeshow-issue-95)) applies. It is **not** journaled into [`gwm history`](#gwm-history---limit-n---all).

## `gwm clean [<slug>...] [--profile <name>] [--yes]` (issues #313, #324)

Report, and optionally reclaim, heavy build artifacts across worktrees. **Report-only by default.**

```bash
gwm clean                                # report reclaimable artifacts in every non-main worktree
gwm clean feat-1                         # scope to a fuzzy-matched worktree
gwm clean --yes                          # actually delete the listed artifacts
gwm clean --profile deep                 # use the [clean.profiles.deep] directory set
```

`gwm clean` scans each target worktree for `target/`, `node_modules/`, `dist/`, and `build/` and prints the reclaimable size per worktree. Positional slugs scope the set (fuzzy); with none, it targets every non-main worktree. Without `--yes` it only reports and prints `re-run with --yes to delete the listed artifacts`; an empty result prints `nothing to reclaim`.

| Flag               | Action                                                                                                                                                                 |
| :----------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <name>` | Reclaim the [`[clean.profiles.<name>]`](/configuration/gwm-toml#exec-and-clean) directory set, a **complete** set that replaces the built-ins (unknown name exits `1`) |
| `--yes`            | Delete the listed artifacts instead of only reporting them                                                                                                             |

Without `--profile`, `gwm clean` uses `[clean.profiles.default]` when that profile is defined, else the built-in `target`/`node_modules`/`dist`/`build`. A profile's `dirs` **replaces** the built-ins (never adds to them); the safety gate below still applies to every directory.

**Safety:** `--yes` deletes a directory **only** when git treats it as ignored _and_ it holds no tracked files. A `dist/` or `build/` that is tracked or hand-authored (hence non-regenerable) is reported as `skipped … not git-ignored, or holds tracked files`, never removed. Because the artifacts are regenerable, `gwm clean` is **deliberately not journaled** into [`gwm history`](#gwm-history---limit-n---all): there is no `gwm undo` for it.
