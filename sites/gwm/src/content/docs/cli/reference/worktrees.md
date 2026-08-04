---
title: Worktree lifecycle
description: Subcommand reference - Worktree lifecycle.
sidebar:
  order: 3
---

## `gwm create <type> <issue> <desc>`

Create a worktree and matching branch.

```bash
gwm create feat 123 user-authentication
#   → branch feat/#123-user-authentication
#   → worktree ~/cc-worktree/<repo>/feat-123-user-authentication

gwm create feat 123 foo --no-bootstrap     # skip the bootstrap pipeline
```

| Flag                    | Action                                                                                                                                                                         |
| :---------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-bootstrap`        | Skip the `.gwm.toml` bootstrap stages (copies / guards / commands / hooks)                                                                                                     |
| `--reuse-branch`        | Attach to an already-existing local branch of the same name instead of refusing (issue #99)                                                                                    |
| `--skip-hooks <PHASES>` | Skip the comma-separated lifecycle hook phases (e.g. `pre_create,post_create`)                                                                                                 |
| `--name <NAME>`         | Name the worktree freely instead of the `<type> <issue> <desc>` triple (issue #416). Exclusive with the positionals                                                            |
| `--repo <NAME>`         | In [workspace mode](#workspace-mode-global---workspace-issue-36), which child repo gets the worktree - required there to disambiguate; ignored in single-repo mode (issue #36) |

By default `gwm create` refuses to silently reuse a stale local branch - it ends with an error naming the stale tip so you can audit it; `--reuse-branch` is the opt-in escape hatch.

### Free-form naming (`--name`)

Not every worktree is an issue. `--name` skips the convention entirely:

```bash
gwm create --name spike-redis
#   → branch spike-redis
#   → worktree ~/cc-worktree/<repo>/spike-redis
```

The name becomes the branch **verbatim** - it is validated exactly as typed, so `--name " spike"` is refused rather than trimmed into a different branch than the one you asked for. `branch_pattern` and `path_pattern` do not apply - they are written in terms of `{type}` / `{issue}` / `{desc}`, and a free-form name has none of them. `[worktree].base` still applies, so free-form worktrees land beside the structured ones, for the placeholders it documents (`{home}`, `{repo}`, `{repo_path}`, `{repo_parent}`); a base written with `{type}` / `{issue}` / `{desc}` is refused instead, since there is nothing to resolve it against and it would otherwise end up literal in the path. A `/` is legal in the branch and flattens to `-` in the directory name, the same relationship the default pattern pair already has.

**What you give up.** Everything that reads the branch name back goes quiet - that is the deal, not a bug. This table describes a name that does **not** match the branch convention; nothing records _how_ a worktree was named, only what its branch is, so a free-form name that happens to look structured (`--name 'feat/#42-x'`) is read back as structured and keeps every row below:

| Feature                                         | On a free-form worktree                                               |
| :---------------------------------------------- | :-------------------------------------------------------------------- |
| issue auto-linking                              | inactive - use `gwm link --issue <N>` to attach one by hand           |
| PR/MR detection                                 | **still works** - it queries the forge with the whole branch name     |
| gitmoji / `gwm commit-prefix`                   | errors: a prefix is derived from the branch _type_, and there is none |
| `doctor` orphan check                           | treats it as a user-managed branch and never flags it                 |
| hook placeholders (create / remove / bootstrap) | `{type}` / `{issue}` / `{desc}` resolve empty                         |
| TUI edit form                                   | not applicable - that form rebuilds the triple; rename with git       |

**Accepted names.** A free-form name has to be three things at once, and the rules follow from that rather than from a hand-written list of bad examples.

It is **a git branch** - checked against libgit2's own branch-level rule set, which is stricter than the reference-level one (`refs/heads/HEAD` is a valid _reference_ name, `HEAD` is not a usable _branch_ name). It is **a single filesystem path component**, the worktree directory, which a branch name is not: no `.` or `..` component (a directory named `..` would escape the base), and at most 255 bytes - `a×130/b×130` is a legal ref and an illegal directory name, and without the cap the branch gets created before the directory fails, leaving it orphaned. And it is **a literal value during hook expansion**, so no `{` or `}`: placeholders are substituted in sequence, and a branch called `spike-{issue}` would have its own name rewritten inside the `{branch}` value a hook receives.

One more rule belongs to none of those: no leading `-`. Git accepts it; `gwm remove` and `git branch -d` would read it as a flag.

`Spike_Redis`, `2026.07.27` and `réécriture` are all fine.

The directory has to be hostable on **Windows** too, so three more rules apply on every platform, not just there ([#475](https://github.com/kbrdn1/gwm-cli/issues/475)). No `<`, `>`, `"` or `|`, which Win32 forbids in a path component and git accepts. No path component that is a reserved device name (`CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`, `LPT1`–`LPT9`), case-insensitively and with or without an extension, since Win32 reads `NUL.tar.gz` as `NUL`. And no path component ending in `.`, which Windows refuses as a directory name.

The last two are checked per `/`-separated segment, because a loose ref is a file at `.git/refs/heads/<name>`, which makes every segment a path component there: `spike/CON` flattens to the perfectly legal directory `spike-CON` and is still an unwritable ref on Windows. The trailing period is the case worth knowing about, because git _almost_ covers it: its own rule applies to the whole branch name, so `spike.` is refused by git while `foo./bar` is not. `v1.2/spike` stays legal, a period inside a segment not being a trailing one.

The rules are not gated to Windows because a branch travels to a teammate's machine through the forge. A name no Windows checkout can host is a hazard for the whole team, not a local one. The residual set is exactly what libgit2 does not already reject: git itself refuses `:`, `\`, `?`, `*` and a space in every position, so those need no rule of their own. `COM0` and `LPT0` stay legal, being absent from the Win32 reserved list.

In the TUI, `Ctrl-T` toggles the create form - and only that form - between the structured triple and a single free-form `Name` field.

End-to-end walkthrough lives in [Getting Started → First worktree](/getting-started/first-worktree).

## `gwm new <type> <desc>`

Create a GitHub issue from the repo's configured issue form, then create the matching worktree from the returned issue number.

```bash
gwm new feat add-config-types
# → created issue #142 [Feature]: add-config-types
# → branch feat/#142-add-config-types
```

`gwm new` reads `[issue_template]` from `.gwm.toml`, renders the selected `.github/ISSUE_TEMPLATE/*.yml` file to markdown, calls `gh issue create --body-file`, then hands off to the same worktree creation path as `gwm create`.

| Flag             | Action                                                        |
| :--------------- | :------------------------------------------------------------ |
| `--no-bootstrap` | Create the worktree without running bootstrap                 |
| `--reuse-branch` | Attach to an existing local branch after the issue is created |
| `--skip-hooks`   | Skip comma-separated lifecycle hook phases                    |

## `gwm list [--format=table|names|json] [--detect-pr] [--workspace <dir>]`

List the worktrees in the current repo.

```bash
gwm list                       # human-readable table
gwm list --format=names        # one worktree name per line (for shell completion)
gwm list --format=json         # machine-readable JSON array (issue #38)
gwm list --detect-pr           # add a PR column, auto-detecting each branch's PR via gh
gwm list --workspace ~/Projects  # merged table across every child repo, leading REPO column
```

The `names` format excludes the main workdir - `gwm path / remove / bootstrap` never accept it as a target, so emitting it as a completion candidate would be misleading.

`--format=json` (issue #38) emits a stable JSON array - schema documented at [`docs/schema/worktree-list.schema.json`](https://github.com/kbrdn1/gwm-cli/blob/main/docs/schema/worktree-list.schema.json). Unlike `names`, it **includes** the main worktree: a JSON consumer (an editor, a statusbar) wants the full set and resolves the active worktree from it. Each entry carries `name`, `id`, `path`, `branch`, `head`, `is_main` / `is_locked` / `is_prunable`, a `status` object (`is_dirty`, `has_upstream`, `ahead`, `behind`, `unknown`), `age_seconds`, and linked `issue` / `pr` numbers. Pipe into `jq`:

```bash
gwm list --format=json | jq '.[] | select(.status.is_dirty) | .name'
```

`--detect-pr` adds a `PR` column populated by [PR auto-detection](/integrations/github-linking#auto-detection) (`gh pr list --head <branch>` per worktree). It is **off by default** so the plain listing stays network-free - one `gh` call per worktree is only paid when the flag is set. Ignored with `--format=names`.

`--workspace <dir>` (issue #36) prints the merged worktree table across every git repo one level below `<dir>`, with a leading **REPO** column naming each row's repo. See [Workspace mode](#workspace-mode-global---workspace-issue-36) for the full behaviour.

## `gwm path <pattern> [--format=text|json]` (alias: `gwm cd <pattern>`)

Print the on-disk path of a worktree matching `<pattern>` (fuzzy). Use with `$(...)` to `cd`:

```bash
cd "$(gwm path auth)"
cd "$(gwm cd auth)"            # same — framing for the cd flow
gwm path auth --format=json    # { "name": ..., "path": ..., "branch": ... }
```

The default `text` form prints the bare path for `$(...)` consumption. `--format=json` (issue #38) emits the `{ name, path, branch }` triple - schema at [`docs/schema/path.schema.json`](https://github.com/kbrdn1/gwm-cli/blob/main/docs/schema/path.schema.json).

Both forms share semantics: fuzzy resolve, exit `0` on a unique hit, `1` on miss / ambiguous / not in a repo. Pair with `gwm shell-init` for the `gcd` one-liner - see [Getting Started → Shell init](/getting-started/shell-init).

## `gwm switch` (alias: `gwm s`)

Open the TUI in **picker mode** - same table as bare `gwm`, fuzzy filter bar pre-open, create / delete / bootstrap disabled. Press `Enter` to print the highlighted worktree's path on stdout, `Esc` / `q` / `Ctrl-C` to cancel with exit code `1`.

```bash
cd "$(gwm switch)"             # open picker, type to narrow, Enter to commit
gcd                            # same, via the `gwm shell-init` wrapper
```

## `gwm bootstrap [<pattern>]`

Re-run the `.gwm.toml` bootstrap pipeline on a worktree without recreating it.

```bash
gwm bootstrap                  # on the CWD worktree
gwm bootstrap auth             # on a fuzzy-matched name
```

Useful after editing `.gwm.toml` or adding new `[[bootstrap.copy]]` rules. Same `✓ / ! / ✗` report as `gwm create`.

| Flag                    | Action                                                                               |
| :---------------------- | :----------------------------------------------------------------------------------- |
| `--skip-hooks <PHASES>` | Skip the comma-separated lifecycle hook phases (e.g. `pre_bootstrap,post_bootstrap`) |

## `gwm sync [<pattern>] [--merge]`

Fetch a worktree's upstream and bring its branch up to date - rebase by default, or merge with `--merge`.

```bash
gwm sync                       # the CWD worktree, rebase onto upstream
gwm sync auth                  # a fuzzy-matched worktree
gwm sync auth --merge          # merge the upstream instead of rebasing
```

Resolves the target like `gwm bootstrap` (fuzzy pattern, defaults to the worktree containing the CWD - which may be the main worktree, so you can sync trunk too). It runs `git fetch` for the upstream's remote, recomputes how far behind the branch is, then integrates only when there's something to integrate. Reports a single `✓` line (`already up to date` / `rebased N commit(s)` / `merged N commit(s)`).

Guard rails:

- **Dirty working tree** → refuses before touching the remote (`commit or stash`). A rebase/merge on top of uncommitted work is how changes get lost.
- **No upstream configured** → errors with the `git branch --set-upstream-to=<remote>/<branch>` fix.
- **Conflict** → the rebase/merge is **aborted** so the worktree is left usable, and you're told to reconcile by hand.

The fetch / rebase / merge steps shell out to your `git` (so SSH keys, credential helpers, and `insteadOf` rules all apply); the dirty / upstream / ahead-behind inspection uses libgit2.

## `gwm remove <pattern> [--delete-branch] [--dry-run]`

Remove a worktree by fuzzy match. The branch survives by default.

```bash
gwm remove auth                            # remove the worktree, keep the branch
gwm remove auth --delete-branch            # remove the worktree AND drop the branch
gwm remove auth --dry-run                  # preview the plan, destroy nothing
gwm remove auth --dry-run --delete-branch  # preview, including the branch drop
```

The CLI form has no countdown (the TUI's [`d` confirm-overlay countdown](/tui/confirm-countdown) is TUI-only). `--delete-branch` is destructive - only `git reflog` can resurrect a dropped branch.

| Flag                    | Action                                                                                                   |
| :---------------------- | :------------------------------------------------------------------------------------------------------- |
| `--delete-branch`       | Also drop the local branch after removing the worktree (destructive)                                     |
| `--dry-run`             | Print the would-remove plan (name + path + branch) and exit `0` without touching anything (issue #31)    |
| `--force`               | Emergency removal mode: skip the `pre_remove` / `post_remove` [lifecycle hooks](/configuration/gwm-toml) |
| `--skip-hooks <PHASES>` | Skip the comma-separated lifecycle hook phases (e.g. `pre_remove,post_remove`)                           |

`--dry-run` resolves the fuzzy pattern, prints the plan, and exits `0` - no destruction, **no journal write** (see [`gwm undo` / `gwm history`](#gwm-undo---bootstrap)). With `--delete-branch` it tags the branch line `(would be deleted)`; on a detached-HEAD worktree it prints `branch: - (no branch to delete)` instead, mirroring the destructive path's behaviour. An ambiguous pattern fires the same non-zero candidate-list error as the destructive form - `--dry-run` only suppresses destruction, not resolution failures.

## `gwm prune [--dry-run]`

Clear stale entries in `.git/worktrees/` whose working directory was removed manually (e.g. `rm -rf` outside gwm).

```bash
gwm prune                      # prune every stale entry
gwm prune --dry-run            # list the prunable entries, touch nothing
```

`gwm doctor` flags prunable entries as a Warning; `gwm prune` is the documented remediation.

| Flag        | Action                                                                                                     |
| :---------- | :--------------------------------------------------------------------------------------------------------- |
| `--dry-run` | List every prunable entry (name + path + reason) and exit `0` without touching the admin files (issue #31) |

`--dry-run` output is sorted by name for deterministic stdout diffing; the empty case prints `0 worktree(s) to prune` so scripted callers get a stable signal. Column widths are computed in Unicode characters so non-ASCII names stay aligned. The preview and the destructive pass share the same scanner, so they can never drift on what "prunable" means.
