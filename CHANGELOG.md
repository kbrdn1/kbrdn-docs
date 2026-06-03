# Changelog

All notable changes to this repository are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This repo is **not** versioned with SemVer tags — product docs are versioned by
branch (see [CONTRIBUTING.md](CONTRIBUTING.md#versioning--releases)). This file
tracks changes to the platform itself (structure, shared package, tooling, CI).

## [Unreleased]

### Added

- Bun-workspaces monorepo scaffold (`packages/*`, `sites/*`).
- `@kbrdn/ds-shared` shared design system: base theme tokens, Starlight
  `Footer` override, reusable `RepoCard` MDX component.
- `@kbrdn/docs-gwm` — first Starlight site (gwm), latest-only, with splash
  landing, install & getting-started guides, product accent theme.
- Tooling: oxlint, prettier (+ astro plugin), `astro check`; aggregate
  `bun run check` / `bun run build` scripts.
- Conventions ported from `gwm-cli`: CLAUDE.md, CONTRIBUTING.md, issue & PR
  templates, LABELS.md, Dependabot, opt-in `.githooks/pre-commit`.
- CI workflow (lint + format + check + build) and a gated Cloudflare Pages
  deploy workflow.
- Nix dev shell (`flake.nix`).
- PLAN.md — full roadmap.
- gwm docs navigation skeleton: four-group sidebar (Démarrer / Guides /
  Référence / Concepts) and stub pages for `tui`, `doctor`, `cli`, `gwm-toml`,
  `worktrees`, `bootstrap`, `trust-ledger` (content filled in follow-up issues).

### Changed

- gwm site: renamed `guides/getting-started` to `guides/prise-en-main` and
  wired the splash hero action to the new slug.
- gwm docs: filled the `guides/installation` page (converted to `.mdx`) with the
  real install channels — Homebrew tap, `cargo binstall`, Cargo from source
  (MSRV 1.82), prebuilt binaries, Nix flake — using Starlight `Tabs` / `Steps` /
  `Aside`, cross-checked against `gwm-cli`.
