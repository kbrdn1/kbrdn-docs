# Changelog

All notable changes to this repository are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This file tracks the **platform** itself (structure, shared package, tooling,
CI), which is versioned with SemVer tags from `v1.0.0` on. The **product docs**
are versioned separately, by branch (see
[CONTRIBUTING.md](CONTRIBUTING.md#versioning--releases)) — a gwm release does
not move this number, and this number does not freeze anyone's docs.

This root file carries the current `[Unreleased]` section only; every released
version lives in its own file under [`changelogs/`](changelogs/).

## [Unreleased]

### Fixed

- `@kbrdn/ds-shared`: the footer's Licence block pointed at
  `gwm-cli/blob/main/LICENSE`, a path that never existed — the file was
  `LICENSE.md`, and upstream has since renamed it `LICENSE-MIT`. It now targets
  the README's `#license` anchor, which survives either name, and reads
  `MIT OR Apache-2.0`.

### Changed

- gwm docs: the site states the dual `MIT OR Apache-2.0` license
  ([`gwm-cli#576`](https://github.com/kbrdn1/gwm-cli/pull/576)) — comparison
  one-liner and table, AUR package contents (both license texts), landing meta
  line and `gwm-cli` repo card, plus a `License` section in Contributing
  carrying the contribution terms (no CLA). Mirrors the upstream `docs/` tree,
  EN and FR. The `herdr-plugin-gwm` card stays MIT — separate repository.
  `LICENSE-MIT` / `LICENSE-APACHE` resolve once the relicense reaches gwm-cli's
  `main`.

## Past releases

- [1.0.0](changelogs/1.0.0.md) — 2026-08-13
