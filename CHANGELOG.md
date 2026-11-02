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

- Open Graph cards pin `box-sizing: border-box` on every block
  ([#100](https://github.com/kbrdn1/kbrdn-docs/issues/100)). The card is drawn
  with heights that include their padding, which was satori's default up to
  0.41. From 0.42 on it applies the browser's `content-box`, which its release
  notes do not mention: with satori 0.63.2 the column grows to 750px, the body
  drops 60px and the footer leaves the canvas on all 121 cards. No change on
  the current satori 0.33.5, where every card is byte-identical.

## Past releases

- [1.2.0](changelogs/1.2.0.md) — 2026-10-29
- [1.1.0](changelogs/1.1.0.md) — 2026-08-14
- [1.0.0](changelogs/1.0.0.md) — 2026-08-13
