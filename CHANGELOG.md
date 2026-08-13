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
- `@kbrdn/ds-shared`: `ImageZoom` — content images open full size in a native
  `<dialog>` overlay (click, or Enter/Space on the focused image; Esc or a
  click on the backdrop closes). Same behaviour as the blog images on
  kbrdn.dev. Images already wrapped in a link are left alone.
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
- gwm docs: provisional TUI visual placeholders — uniform SVG frames
  ("capture à venir") on every doc page (list view, create modal, command logs,
  config panel, doctor report, bootstrap report, trust prompt, on-disk layout,
  `gwm tui keys` output), each flagged with a `TODO` to swap for a real
  capture/asciinema in a follow-up.
- gwm site: sitemap now carries `hreflang="x-default"` (pointing at the
  prefix-less English URL) and a per-page `lastmod`, dated from the last commit
  touching the page's source file — the French fallback pages resolve to their
  English source. The site declares its own `@astrojs/sitemap` integration,
  which Starlight steps aside for, reproducing its i18n config verbatim. On a
  shallow checkout `lastmod` is omitted rather than uniform-and-wrong, hence
  `fetch-depth: 0` on the deploy workflow.

### Changed

- gwm landings: a seventh feature row for agent sessions — the four detected
  backends, the three surfaces, the `a` overlay — using the capture shipped by
  gwm-cli 1.7.1. It is what the repo's own description leads on and the landings
  did not mention it. Homepage stats refreshed against gwm-cli 1.7.1 (2 860
  tests, from the CI run rather than a local `cargo test --list`), and the
  `gwm-cli` repo card now mirrors the upstream description.
- `@kbrdn/ds-shared`: three surface levels instead of one flat wash — a sunken
  shell (page background, gutters, side panes), the reading column unchanged,
  and raised content blocks (code, captures). Content images now sit on a mount
  with a lighter border, so screenshots read as *on* the page rather than *in*
  it. Acts on the site half of ratatui maintainer feedback (`gwm-cli#544`,
  axis 4). Same hue, both themes.
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
- gwm docs: enriched all nine pages to the gwm v0.9.0 TUI surface — documented
  the pane-focus keys (`1`/`2`), Command Logs overlay (`3`), Configuration panel
  (`4`), `sync` action (`S`), open-docs (`.`), the command palette (`:`), the
  in-title fuzzy filter and off-thread `f`/`r` refresh; added the resolved
  `gwm tui keys` action/key table, the `[tui.keys]` v0.9.0 bindings, on-disk
  worktree layout and real `gwm doctor` / bootstrap report examples, all
  cross-checked against `gwm-cli` (`src/tui/keymap.rs`, `palette.rs`, `cli.rs`,
  `doctor.rs`, `bootstrap.rs`, `config.rs`).
- Dependencies: Astro 6.4 → 7.1, Starlight 0.39 → 0.41, `sharp` 0.34 → 0.35,
  `actions/checkout` 6 → 7, `actions/upload-artifact` 4 → 7,
  `cloudflare/wrangler-action` 3 → 4.
- gwm site: dropped `remark-gfm` and the whole `markdown` config block. Astro 7
  parses GFM natively, so the plugin was re-enabling something already on —
  measured on the built output, identical with and without it: 158 `<table>`
  across 50 pages, same autolinks, same HTML structure and text on a
  table-heavy page. This also settles the `markdown.remarkPlugins` deprecation
  Astro 7 introduced, by removing the call rather than migrating it.
- Dependabot: the npm ecosystem now watches `/` only. The root entry already
  resolves the bun workspaces, so also listing `/packages/ds-shared` and
  `/sites/gwm` opened every package bump twice.
- TypeScript 5.9 → 6.0. TypeScript 7 stays out: its native compiler does not
  expose the programmatic API `astro check` is built on, and
  `@astrojs/language-server` ≥ 2.16.13 now refuses to start on it with that
  exact message (tracked in withastro/roadmap#1321). 6.x still ships the API,
  so the Dependabot `ignore` is bounded to `>=7` instead of blanket-ignoring
  majors — which would also have locked out the major we can take.

### Fixed

- gwm landings (both locales): two TUI shortcuts that gwm-cli 1.7.0 changed and
  the hand-written landings kept advertising — `Space` no longer cycles the
  sidebar layout (that moved to `z`; `Space` marks rows for the batch delete),
  and `O` is the fullscreen open dispatch, a shell by default, not "opens your
  editor". The landings are the only pages `bun run sync:gwm` preserves, so
  nothing else caught the drift.
- gwm site: Markdown tables (and other GFM constructs) now render. On this Astro
  6.4 / Starlight 0.39 setup GFM was not active by default — `remark-gfm` was
  absent from the markdown pipeline, so every table on every page rendered as
  raw `| … |` pipes in both dev and the production build. Added `remark-gfm` and
  wired it into `markdown.remarkPlugins` in `sites/gwm/astro.config.mjs` — since
  removed, Astro 7 doing it natively (see above).
- gwm docs: corrected the `concepts/bootstrap` pipeline — `no_symlink` runs
  **before** `copy` (issue #93, strip destination symlinks before opening them
  for writing), guards run on the source inside the copy loop, and a `✗` on a
  core step is **recorded but non-fatal** (the worktree is not rolled back;
  re-run `gwm bootstrap`) — the prior text inverted the order and claimed an
  automatic rollback (`src/bootstrap.rs`, `src/cli.rs`).
- gwm docs: corrected three `guides/doctor` check severities — unknown `when:`
  keyword is `✗` not `!` (`Check::failed`), every missing PATH binary is `!` not
  a `[git_tui]`-specific `✗`, and the base-directory check has a `!` case when
  neither base nor parent exists yet (`src/doctor.rs`).
