---
title: Issues, pull requests and reviews
description: Subcommand reference - Issues, pull requests and reviews.
sidebar:
  order: 4
---

## `gwm review <PR#> [--name <branch>] [--bootstrap] [--skip-hooks <phases>]` (issue #308)

Materialise an existing GitHub PR into an isolated worktree: fetch the PR head, attach a worktree, link the PR, and you're reviewing the contributor's code in seconds.

```bash
gwm review 310                          # fetch PR #310 into review/pr-310-<author>-<slug>
gwm review 310 --name pr-310            # override the local review branch name
gwm review 310 --bootstrap              # ...and run bootstrap + lifecycle hooks (opt-in)
```

`gwm review` resolves the PR head via `gh` and fetches origin's universal `refs/pull/<N>/head` ref, so it is **cross-fork aware** and valid for PRs in any state (open / draft / closed / merged). It creates a local `review/pr-<N>-<author>-<slug>` branch, attaches a worktree (the directory is derived from the branch name, slashes become dashes), and links the PR so the [TUI sidebar / CI indicator](/tui) light up immediately. Tear down like any worktree: `gwm remove <dir> --delete-branch`.

| Flag                    | Action                                                                                                               |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------- |
| `--name <BRANCH>`       | Override the local review branch name (default `review/pr-<N>-<author>-<slug>`); the worktree dir is derived from it |
| `--bootstrap`           | Run bootstrap + lifecycle hooks against the PR's code after creation (off by default)                                |
| `--skip-hooks <PHASES>` | Skip the comma-separated lifecycle hook phases (e.g. `pre_create,post_create`)                                       |

**Safe-by-default:** bootstrap and lifecycle hooks are **not** run. A review worktree holds a contributor's (possibly fork) code, and those steps execute commands against it (`npm install`, `composer install`, `direnv allow`, `post_create` hooks …), i.e. arbitrary code. Pass `--bootstrap` to opt in once you trust the PR enough to set it up. This is distinct from the `[review]` config block (which drives the TUI `R` review-launcher key); `gwm review` is the worktree-materialisation subcommand.

## `gwm pr [--draft] [--base <ref>] [--render]`

Render the PR body from `[pr_template]` and shell out to `gh pr create` against the resolved trunk.

```bash
gwm pr                                # creates the PR
gwm pr --draft                        # creates a draft PR
gwm pr --base develop                 # diff against develop instead of [doctor].trunks
gwm pr --render                       # prints the rendered body to stdout (no PR created)
gwm pr --render | gh pr create --body-file -
```

`gwm pr` reads the current branch (parsing `<type>/#<N>-<desc>` for the `{type}` / `{issue}` / `{desc}` placeholders), picks the first existing trunk from `[doctor].trunks` (or falls back to `main`), then renders the per-branch-type template under `[pr_template.by_type.<type>]` (inline `body` wins over `path`), with `[pr_template].default` as the fallback.

| Flag           | Action                                                           |
| :------------- | :--------------------------------------------------------------- |
| `--render`     | Print the rendered Markdown to stdout; never shell out to `gh`   |
| `--draft`      | Forward `--draft` to `gh pr create` so the PR opens as a draft   |
| `--base <REF>` | Override the comparison base instead of the first matching trunk |

On success the new PR number is recorded under `branch.<head>.gwm-pr` (same key `gwm link pr` writes), so `gwm status` and `gwm open pr` resolve the link without a separate `gwm link` call.

Body resolution and placeholder semantics are documented under [Configuration → `[pr_template]`](/configuration/gwm-toml#pr_template-issue-84).

## `gwm link {issue|pr} <N> [--worktree <pattern>]`

Link the current (or named) worktree to a GitHub issue or PR.

```bash
gwm link issue 42              # link the current worktree to issue #42
gwm link pr 61                 # link a PR
gwm link issue 42 --worktree feat-auth      # ...or to a fuzzy-matched worktree
```

The link is stored in `git config branch.<name>.gwm-issue` / `gwm-pr`: local, per-branch, no extra file. Issue numbers are **auto-detected** from `<type>/#<N>-<slug>` branches, so `gwm link issue <N>` is only needed for explicit overrides. PR numbers are not auto-detected.

## `gwm unlink {issue|pr} [--worktree <pattern>]`

Remove the explicit link override on the current (or named) worktree.

```bash
gwm unlink issue               # remove the issue link (auto-detect resurfaces)
gwm unlink pr                  # remove the PR link
```

Idempotent: safe to run when nothing is linked.

## `gwm open {issue|pr} [--worktree <pattern>] [--print-url]`

Open the linked issue / PR in the browser via the OS opener.

```bash
gwm open issue                 # spawn the OS opener on the linked issue URL
gwm open pr --print-url        # print the URL on stdout, no spawn
```

Useful in headless shells and tests with `--print-url`.

## `gwm status [--worktree <pattern>] [--json]`

Show the link plus (when `gh` is available) live GitHub state.

```bash
gwm status
# → Issue #42 [open] TUI: fuzzy search
# → PR #61 [draft] · checks 2/3

gwm status --json              # stable schema for scripts
```

Degrades gracefully to local-link-only output when `gh` is missing or the repo has no GitHub remote.

## `gwm labels {list|push}`

Manage the declarative GitHub label set from `.gwm.toml`. Declare the labels you want once in `[[labels]]`, push them to the upstream `origin` remote as needed. No more drift across repos. Without a `[[labels]]` block in `.gwm.toml`, both subcommands are no-ops (`0 labels declared, nothing to push`) and never shell out to `gh`.

```bash
gwm labels list                       # show the diff against the remote
gwm labels push                       # apply create + update
gwm labels push --dry-run             # plan only, no remote mutations
gwm labels push --prune               # also delete labels not in config
gwm labels push --random-colors       # random pastel for entries with no `color`
```

| Flag              | Action                                                                                                                                                          |
| :---------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`       | Print the plan without mutating the remote. Still reads remote labels via `gh label list` to compute the diff; only create / update / delete calls are skipped. |
| `--prune`         | Delete labels on the remote that aren't declared in `.gwm.toml` (destructive, opt-in)                                                                           |
| `--random-colors` | Use a random pastel for entries with no `color` field (overrides the deterministic hash)                                                                        |

`list` output sigils mirror the diff buckets:

```
+ bug                  (will create, color #d73a4a)
~ good first issue     (color #008672 → #7057ff)
= documentation        (match)
- wontfix              (on remote, not in config)
```

Requires `gh` on `$PATH` (the same soft dependency as `gwm status`). Schema reference and authoring tips: [Configuration → `.gwm.toml`](/configuration/gwm-toml#labels-issue-81).

## `gwm milestones {list|push}`

Manage the declarative GitHub milestone set from `.gwm.toml`. Same shape as `gwm labels`; the REST endpoint is used because `gh` has no native `gh milestone` subcommand. Without a `[[milestones]]` block in `.gwm.toml`, both subcommands are no-ops (`0 milestones declared, nothing to push`) and never shell out to `gh`.

```bash
gwm milestones list                     # show the diff against the remote
gwm milestones push                     # apply create + update
gwm milestones push --dry-run           # plan only, no remote mutations
gwm milestones push --prune             # also delete milestones not in config
```

| Flag        | Action                                                                                                                                                                    |
| :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--dry-run` | Print the plan without mutating the remote. Still reads remote milestones via `gh api …/milestones` to compute the diff; only create / update / delete calls are skipped. |
| `--prune`   | Delete milestones on the remote that aren't declared in `.gwm.toml` (destructive, opt-in)                                                                                 |

`list` output sigils mirror the diff buckets:

```
+ v0.7.0               (will create, state open, due 2026-07-15T23:59:59Z)
~ v0.6.0               (due 2026-07-01T23:59:59Z → 2026-07-15T23:59:59Z)
= v0.5.0               (match)
- old-sprint           (#3 on remote, not in config)
```

Requires `gh` on `$PATH`. Schema reference and authoring tips: [Configuration → `.gwm.toml`](/configuration/gwm-toml#milestones-issue-82).
