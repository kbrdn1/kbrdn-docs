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
- `@kbrdn/ds-shared`: ported the "Claude Dark" design system from kbrdn.dev —
  the Claude neutral scale mapped onto Starlight `--sl-color-*` tokens (dark +
  light), sharp corners (`radius: 0`), the **real kbrdn.dev type stack**
  self-hosted (Inter sans, Fenix serif, Monaspace Krypton mono + Monaspace Neon
  for code, with `OperatorMonoLig Nerd Font` first in the code stack), a shared
  semantic colour ramp (`--color-neutral/red/green/yellow/blue/purple/cyan-*`),
  and accent-driven card/link-card hover wired to `--sl-color-accent`.
- `@kbrdn/ds-shared/expressive-code`: shared "Claude Code" syntax theme (dark +
  light Expressive Code themes + sharp-corner `styleOverrides`), consumed by the
  gwm site.
- gwm site: bespoke splash landing (`Landing.astro`) faithful to the kbrdn.dev
  design language — badge + pulse, mono/serif hero, static terminal mock, why
  cards with ASCII sketches, numbered feature grid, ratatui TUI mock, native
  `<Tabs>` install, CLI examples, `.gwm.toml` config mock, gwq/git-worktree
  comparison table, serif quote — in the **sky-blue + yellow** accent variant,
  with content cross-checked against gwm-cli (positional CLI, real `.gwm.toml`
  schema, v0.9.0-rc.1, `~/cc-worktree/` paths).

### Changed

- gwm site: renamed `guides/getting-started` to `guides/prise-en-main` and
  wired the splash hero action to the new slug.
- gwm docs: filled the `guides/installation` page (converted to `.mdx`) with the
  real install channels — Homebrew tap, `cargo binstall`, Cargo from source
  (MSRV 1.82), prebuilt binaries, Nix flake — using Starlight `Tabs` / `Steps` /
  `Aside`, cross-checked against `gwm-cli`.
- gwm docs: filled the `guides/prise-en-main` page (converted to `.mdx`) — the
  first-use walkthrough (`create` → `list` → `cd`/`gcd` → TUI → `remove` →
  `doctor`), cross-checked against `gwm-cli`.
- gwm docs: filled the `reference/gwm-toml` page (converted to `.mdx`) — the
  full `.gwm.toml` schema (`worktree`, `bootstrap.*`, `hooks.*`, launchers,
  `tui`/`tui.keys`/`tui.open`, `theme`, `doctor`, `gitmoji`, `labels`,
  `milestones`, `issue_template`, `pr_template`, `aliases`, defaults &
  validation rules), cross-checked against `gwm-cli` `config.rs` and
  `gwm.toml.example`.
- gwm docs: filled the `reference/cli` page (converted to `.mdx`) — the full
  subcommand reference (worktrees, config, branch/commit, GitHub, TUI/themes,
  multiplexer/shell, doctor/trust, aliases) with flags, examples and the
  0/1/2 exit-code table, cross-checked against `gwm-cli` `src/cli.rs`.
- gwm docs: filled the `guides/tui` page (converted to `.mdx`) — keyboard
  navigation, details sidebar, create/delete/link overlays, configurable `l`/`R`
  launchers (placeholders, fullscreen, base resolution) and tmux/zellij
  integration, cross-checked against `gwm-cli` `src/tui/`, `launcher.rs` and
  `multiplexer.rs`.
- gwm docs: filled the `guides/doctor` and `concepts/trust-ledger` pages
  (converted to `.mdx`) — the 8 `gwm doctor` health checks with 0/1/2 exit
  codes, and the TOFU trust ledger (threat model, gate decision tree,
  `gwm trust` surface, ledger format), cross-checked against `gwm-cli`
  `src/doctor.rs` and `src/trust.rs`.
- gwm docs: filled the `concepts/worktrees` and `concepts/bootstrap` pages
  (converted to `.mdx`) — the worktree model & naming convention (kebab-case
  normalization, `gwm-base` anchor) and the bootstrap pipeline (copies, regex
  guards, fallbacks, no-symlink, lifecycle hooks, `when:` predicates),
  cross-checked against `gwm-cli` `src/naming.rs` and `src/bootstrap.rs`.
- gwm docs: fleshed out the splash landing (`index.mdx`) with a "Par où
  commencer ?" navigation grid (`LinkCard`) linking the main entry points, and
  completed the Phase 1 cross-page consistency pass — no dead internal links, no
  orphan pages.
- gwm site: replaced the green product accent with a two-tone **sky-blue
  (`#7ab8ff`) + yellow (`#ffdf61`)** variant to differentiate the product —
  yellow hero CTA, yellow text selection, and a recolored logo (blue mark +
  yellow terminal cursor); wired the shared Expressive Code "Claude Code" theme.
- `@kbrdn/ds-shared`: light-mode link colour now derives from `accent-high` (the
  dark shade) instead of the base accent, so product accents stay WCAG AA on
  light backgrounds without per-product tuning.
