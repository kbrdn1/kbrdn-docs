---
title: Subcommand reference
description: Every `gwm` subcommand with synopsis, flags, exit codes, and examples.
sidebar:
  order: 1
---

`gwm <subcommand>` is the scriptable face of gwm. Every command exits with a meaningful code (`0` ok, `1` warning, `2` failure) so you can wire `gwm doctor` into CI without parsing stdout.

Bare `gwm` (no subcommand) opens the [TUI](/tui) on the current repo.

- [Setup and configuration](./setup/)
- [Worktree lifecycle](./worktrees/)
- [Issues, pull requests and reviews](./github/)
- [Fleet chores and workspace](./fleet/)
- [Shell and multiplexers](./shell/)
- [Diagnostics and services](./services/)
- [History, undo and trust](./safety/)
- [Customisation](./customisation/)

## Exit codes

| Code | Meaning                                                               |
| :--- | :-------------------------------------------------------------------- |
| `0`  | success - also "all green" for `gwm doctor`                           |
| `1`  | recoverable failure - fuzzy miss, ambiguous match, doctor Warning     |
| `2`  | hard failure - bootstrap `✗`, doctor Failure, unrecoverable git error |
