---
title: History, undo and trust
description: Subcommand reference - History, undo and trust.
sidebar:
  order: 8
---

## `gwm undo [--bootstrap]`

Recover from a misfired removal without `git reflog` archaeology. Pops the most recent destructive op recorded for the current repo, recreates `refs/heads/<branch>` at the saved OID, and re-adds the worktree at the saved path (with `reuse_branch` so the resurrected branch attaches cleanly). Removals made with `d` in the TUI are recorded the same way as `gwm remove` ones, so both are recoverable here.

```bash
gwm undo                       # bring back the last removed worktree + branch
gwm undo --bootstrap           # ...and re-run the per-worktree bootstrap
```

| Flag          | Action                                                                    |
| :------------ | :------------------------------------------------------------------------ |
| `--bootstrap` | Re-run the per-worktree bootstrap after the resurrection (off by default) |

Undo is per-worktree: a batch removal (`gwm remove a b c`, or `Space` + `d` in the TUI) appends one entry per worktree, and each `gwm undo` pops one. The entry is written once the removal has succeeded, so a target that got refused never appears here as something to replay.

The journal entry is consumed **only after** a successful resurrection: a mid-flight failure leaves the recovery anchor intact so you can retry. A detached-HEAD entry (no branch to recreate) is refused with an explicit error rather than silently doing nothing. The journal is shared with [`gwm history`](#gwm-history---limit-n---all); see it for the file location and rotation policy.

## `gwm history [--limit N] [--all]`

List the recent destructive operations recorded by gwm, newest first.

```bash
gwm history                    # last 20 ops for the current repo
gwm history --limit 50         # last 50
gwm history --all              # every op across every repo (forensic / multi-repo)
```

| Flag        | Action                                               |
| :---------- | :--------------------------------------------------- |
| `--limit N` | Maximum entries to print, newest first. Default `20` |
| `--all`     | List ops across every repo, not just the current one |

By default it filters to the current repo's canonicalised workdir; `--all` surfaces every entry. An empty result prints `no operations recorded` as a stable scripted signal. The journal lives at `$XDG_DATA_HOME/gwm/history.toml` (override with `$GWM_HISTORY_FILE`; macOS falls back under `Application Support`, Windows under `%LOCALAPPDATA%`) and is capped at 100 entries: the oldest is dropped on overflow. Every `gwm remove` that actually removes something (with or without `--delete-branch`) appends an entry; a refused one appends nothing, and `gwm remove --dry-run` does **not** write the journal, so previewing a destruction can never let you "undo" something that never happened.

## `gwm trust {list|revoke|show}` (issue #95)

Manage the TOFU trust ledger that gates `.gwm.toml` bootstrap on `gwm create` / `gwm bootstrap`. Ledger lives at `~/.config/gwm/trust.toml` by default; override with `$GWM_TRUST_LEDGER`.

- `gwm trust list`: print every recorded `(origin, sha-prefix, trusted_at, trusted_by)` tuple. Empty ledger prints `0 entries in trust ledger (<path>)` and exits 0.
- `gwm trust revoke <origin>`: drop every entry matching `<origin>` verbatim (SSH and HTTPS flavours of the same GitHub repo are distinct trust paths). Reports `0 entries matched` when nothing changes.
- `gwm trust show`: print the active ledger path and its raw TOML body (or a "file does not exist yet" notice on fresh installs). Useful for triaging "why is gwm re-prompting?": eyeball the recorded hash vs. `sha256sum .gwm.toml`.

Two **global** flags interact with the ledger on every subcommand that runs bootstrap (`gwm create`, `gwm bootstrap`):

- `--allow-bootstrap` (also `GWM_ALLOW_BOOTSTRAP=1`) skips the trust prompt without recording. Use in CI runners and other non-interactive contexts.
- `--deny-bootstrap` refuses to run bootstrap even if the ledger says trusted. Forensic mode for first-look inspection of an unfamiliar repo.

Threat model and full rationale: see the module-level comment in [`src/trust.rs`](https://github.com/kbrdn1/gwm-cli/blob/main/src/trust.rs).
