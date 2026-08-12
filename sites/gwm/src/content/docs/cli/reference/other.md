---
title: Other commands
description: Subcommand reference - Other commands.
sidebar:
  order: 10
---

## `gwm note show [<slug>]` (issue #515)

Print a worktree's note on stdout, verbatim. Without a slug the note of the worktree the CWD sits in is printed.

```bash
gwm note show                  # the current worktree's note
gwm note show auth             # a worktree resolved by fuzzy pattern
gwm note show >/dev/null       # exit 0 = there is a note, 1 = there is none
```

A note is plain Markdown stored at `<main-checkout>/.git/gwm/notes/<branch>.md`, written from the TUI's `N` (an editable modal, `Ctrl+e` there hands it to `$EDITOR`) or by editing the file directly. It is never committed, it survives `gwm remove`, and it is readable from the main checkout. See [TUI → notes](/tui/keybindings#notes-n).

The subcommand is read-only: the note is prose, and prose is written in an editor.

Presence means non-blank: a file that is absent, unreadable or contains only whitespace all print nothing and exit `1`. A blank file is what an editor leaves behind when you open a note and save without typing, so treating it as a note would light the table marker up for nothing.

Exit `1` also covers a detached HEAD, which carries no note at all: a note is keyed on the branch, so a worktree without one has nothing to key on. The reason goes to stderr in both cases, which keeps stdout clean for `$(...)`.

The same text rides the `--format=json` list rows as an additive `note` field (experimental tier, omitted when absent), so a statusline or an editor plugin does not have to shell out per row.
