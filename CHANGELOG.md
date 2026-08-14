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

### Changed

- gwm docs synced to upstream v1.8.0: the roadmap now leads with the v1.8.0
  density line instead of v1.7.0, `changelog/1-8-0.md` joins the index,
  `gwm-release.json` moves to 1.8.0, `configuration/gwm-toml.md` takes the bulk
  of the schema drift (EN and FR), and 26 captures are regenerated upstream for
  the compact TUI. Carries the upstream frontmatter fixes from
  [`gwm-cli#580`](https://github.com/kbrdn1/gwm-cli/pull/580) — `Getting
  started` in sentence case, a description of its own for `cli/index`, both
  roadmaps shortened ([#72](https://github.com/kbrdn1/kbrdn-docs/issues/72)).

### Fixed

- `sync-gwm-docs`: three defects in metadata served verbatim as `<title>` and
  `<meta name="description">`. Backticks from the upstream `description:`
  reached the tag literally, reading as a typo in a search snippet (29 pages) —
  they are now stripped, except around a single-character span (a key, the
  filter bar, the palette's colon) where the backtick alone carried the token
  boundary, which becomes the page language's quotation marks. `capitalise()`
  published `File_exists`: its guard was a list of proper nouns and could not
  keep up with compound identifiers, so an underscore now settles it without a
  list to maintain. The 16 CLI reference pages carried
  `<section title> - <page title>.`, sixteen near-identical meta descriptions;
  each group now writes its own, naming its subcommands. Frontmatter is
  normalised before the requoting decision, since stripping backticks can free
  a `: ` that plain YAML will not take ([#70](https://github.com/kbrdn1/kbrdn-docs/issues/70)).
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
