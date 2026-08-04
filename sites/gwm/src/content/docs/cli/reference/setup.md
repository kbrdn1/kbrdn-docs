---
title: Setup and configuration
description: Subcommand reference - Setup and configuration.
sidebar:
  order: 2
---

## `gwm init [--preset <name>] [--list-presets] [--show]`

Write a `.gwm.toml` to the current repo - the generic documented template by default, or an opinionated stack preset.

```bash
gwm init
# → wrote /path/to/repo/.gwm.toml

gwm init --preset rust          # seed a Rust-flavoured .gwm.toml
gwm init --list-presets         # enumerate the built-ins, write nothing
gwm init --preset node --show   # print the resolved TOML, write nothing
```

Refuses to overwrite an existing `.gwm.toml`. Tweak the generated file and re-run `gwm doctor` to validate.

| Flag              | Action                                                                                            |
| :---------------- | :------------------------------------------------------------------------------------------------ |
| `--preset <NAME>` | Seed an opinionated `.gwm.toml` for a known stack instead of the generic template (issue #37)     |
| `--list-presets`  | List the built-in presets with one-line descriptions and exit (writes nothing, needs no git repo) |
| `--show`          | Print the resolved preset (or template) to stdout instead of writing - handy for diffing          |

### Stack presets (issue #37)

`--preset <name>` seeds an opinionated `.gwm.toml` for a known stack instead of the generic template - env copies, no-symlink invariants, and the right install command pre-wired. `gwm init --list-presets` enumerates them:

```text
generic    The fully-documented default template (same as `gwm init`).
go         Go module: bin/ no-symlink + `go mod download`.
laravel    Laravel: env copies + AWS-RDS guard + vendor/ no-symlink + composer install.
node       Node / Nuxt: node_modules/ no-symlink + bun-or-npm install. (alias: nuxt)
python-uv  Python (uv): .venv/ no-symlink + `uv sync`.
rust       Rust crate: target/ no-symlink + `cargo fetch`.
```

`nuxt` is an alias for `node` (same body), and `generic` is the documented default - `gwm init` with no flag writes it byte-for-byte. Preset bodies are embedded in the binary and kept in sync with [`examples/presets/<name>.toml`](https://github.com/kbrdn1/gwm-cli/tree/main/examples/presets). `--show` prints the resolved TOML to stdout without touching disk, so you can diff a preset against an existing config:

```bash
gwm init --preset laravel --show | diff - .gwm.toml
```

## `gwm config`

Read, edit, and validate `.gwm.toml` without opening the file by hand.

```bash
gwm config get tui.confirm_countdown_secs
gwm config set tui.confirm_countdown_secs 5
gwm config set 'labels[+].name=bug'
gwm config unset review.tool
gwm config list --prefix worktree
gwm config validate
vi "$(gwm config path)"
gwm config edit
```

Keys use dot-path notation. Array tables use indexes (`labels[0].name`), and `set` also accepts `[+]` to append the next table entry. Writes use `toml_edit`, so existing comments and formatting are preserved; after every write, gwm reloads the same runtime schema used by the rest of the CLI.

## `gwm types [--gitmoji]`

List the supported branch types (the `<type>` slot of `gwm create`).

```bash
gwm types
# → feat
#   fix
#   hotfix
#   docs
#   …

gwm types --gitmoji
# → feat      ✨  :sparkles:
#   fix       🐛  :bug:
#   …
```

Override per repo via `[worktree].branch_types` in `.gwm.toml`.

| Flag        | Action                                                                                      |
| :---------- | :------------------------------------------------------------------------------------------ |
| `--gitmoji` | Extend the list with two columns - the unicode emoji and its `:shortcode:` form (issue #85) |

`--gitmoji` resolves each type's emoji from the built-in defaults plus any per-repo `[gitmoji]` overrides in `.gwm.toml`. Custom branch types are supported - `migration = ":truck:"` round-trips through `gwm types --gitmoji`. See [`gwm commit-prefix`](#gwm-commit-prefix---branch-name---unicode) for the matching commit-prefix surface.

## `gwm commit-prefix [--branch <name>] [--unicode]`

Print the canonical Gitmoji + Conventional Commits prefix for the current (or named) branch - handy for shell prompts, AI assistants, and scripted commit composition.

```bash
gwm commit-prefix
# → :sparkles: feat(#41):

gwm commit-prefix --unicode
# → ✨ feat(#41):

gwm commit-prefix --branch feat/#41-tui-search
# → :sparkles: feat(#41):
```

Without `--branch`, reads the current branch from `HEAD` via libgit2 (requires the CWD to be inside a git repo). `--branch` resolves the prefix for an explicit branch name; it still reads `.gwm.toml` for the `[gitmoji]` overrides.

| Flag              | Action                                                                                |
| :---------------- | :------------------------------------------------------------------------------------ |
| `--branch <name>` | Resolve the prefix for a named branch (e.g. `feat/#41-tui-search`) instead of `HEAD`  |
| `--unicode`       | Emit the real emoji character (`✨`) instead of the `:shortcode:` form (`:sparkles:`) |

Under `--unicode`, known `:shortcode:` overrides are normalised to their emoji (e.g. a `[gitmoji]` `feat = ":rocket:"` prints `🚀 feat(#1):`); unknown shortcodes fall through verbatim - no panic, no substitution. The emoji mapping is the built-in default plus any `[gitmoji]` overrides in `.gwm.toml`.

## `gwm hooks install commit-msg [--force]`

Install an opt-in `commit-msg` git hook that auto-prepends the resolved commit prefix when a message doesn't already start with one.

```bash
gwm hooks install commit-msg            # install into .git/hooks/commit-msg
gwm hooks install commit-msg --force    # overwrite an existing commit-msg hook
```

The hook is **never installed implicitly** - you opt in once per repo. It is non-destructive by default: it refuses to overwrite a pre-existing `commit-msg` hook (husky / commitlint / pre-commit) and exits non-zero with the conflicting path unless `--force` is passed. The hook honours `core.hooksPath`, resolves a linked-worktree `.git` file via `Repository::discover`, and degrades gracefully if `gwm` is not on `$PATH` at commit time (the message is left untouched). `commit-msg` is the only hook kind today; clap rejects any other value at parse time.

| Flag      | Action                                                                    |
| :-------- | :------------------------------------------------------------------------ |
| `--force` | Replace an existing hook of the same name (otherwise the install refuses) |

The prefix it prepends is exactly what [`gwm commit-prefix`](#gwm-commit-prefix---branch-name---unicode) prints for the worktree's branch.
