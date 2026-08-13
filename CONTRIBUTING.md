# Contributing to kbrdn-docs

A multi-product documentation monorepo: one [Astro Starlight](https://starlight.astro.build)
site per product, sharing a design-system package. **Bun** is the only
supported package manager and runtime. Conventions mirror
[`gwm-cli`](https://github.com/kbrdn1/gwm-cli) so the muscle memory is the same.

## Table of contents

- [Project layout](#project-layout)
- [Development](#development)
- [Quality gates](#quality-gates)
- [Local hooks](#local-hooks)
- [Branches](#branches)
- [Commits](#commits)
- [Pull Requests](#pull-requests)
- [Merge strategy](#merge-strategy)
- [Versioning & releases](#versioning--releases)

## Project layout

```
kbrdn-docs/
├── package.json            # Bun workspaces root (private)
├── bunfig.toml
├── flake.nix               # Nix dev shell
├── .oxlintrc.json
├── .prettierrc.json
├── packages/
│   └── ds-shared/          # @kbrdn/ds-shared — shared theme + overrides + MDX components
└── sites/
    └── gwm/                # @kbrdn/docs-gwm — Starlight site for gwm
```

## Development

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.3 (the only supported toolchain).
- Optional: Nix — `nix develop` drops you in a shell with bun + git (+ curl, jq). No
  node: every script goes through `bun run`.

### Commands

```bash
bun install                 # install all workspaces
bun run dev                 # dev server for gwm
bun run build               # build every site (static)
bun run check               # lint + format check + astro check
bun run lint                # oxlint
bun run lint:fix            # oxlint --fix
bun run format              # prettier --write
bun run format:check        # prettier --check
bun --filter='@kbrdn/docs-gwm' run preview   # preview a built site
```

## Quality gates

Four gates must pass before a PR is mergeable (CI enforces them):

| Gate                   | Command                      |
| ---------------------- | ---------------------------- |
| Lint                   | `bun run lint`               |
| Format                 | `bun run format:check`       |
| Type & content check   | `bun --filter='*' run check` |
| Build (no broken refs) | `bun run build`              |

`.astro` files are type-checked by `astro check`, not oxlint.

## Local hooks

An opt-in POSIX `pre-commit` lives under [`.githooks/`](.githooks/). It is not
installed automatically — enable it with:

```bash
git config core.hooksPath .githooks
```

It runs prettier + oxlint + astro check on **staged** files only, and
short-circuits in O(1) when nothing relevant is staged. Bypass once with
`git commit --no-verify`.

## Branches

- `main` — what ships ("latest" of every product). User-visible changes go
  through a PR.
- `dev` — integration branch (Dependabot targets it).
- Feature branches: `<type>/#<issue-number>-<short-description>`.

Examples: `feat/#3-header-override`, `fix/#7-dead-link`, `docs/#5-gwm-config`.

## Commits

Format: `<emoji> <type>(<scope>): <subject>` (Gitmoji + Conventional Commits).

### Types & emojis

| Emoji | Type       | When                                     |
| ----- | ---------- | ---------------------------------------- |
| ✨    | `feat`     | new content / component / capability     |
| 🐛    | `fix`      | broken link, wrong content, bug          |
| 💄    | `style`    | theme, layout, component styling         |
| ♻️    | `refactor` | restructuring, no observable change      |
| 📝    | `docs`     | repo docs (README / CONTRIBUTING / etc.) |
| 🔧    | `chore`    | deps, scripts, config                    |
| 👷    | `ci`       | workflows, deployment                    |
| ⬆️    | `chore`    | dependency bumps                         |

### Scopes (suggested)

`gwm`, `ds-shared`, `ci`, `deps`, `structure`, `theme`, `content`.

### Examples

- `✨ feat(ds-shared): add Header override with product switcher`
- `📝 docs(gwm): document the .gwm.toml trust ledger`
- `🔧 chore(deps): bump astro to 6.5`
- `💄 style(gwm): tune accent palette for dark mode`

## Pull Requests

Use the PR template. Before opening:

- [ ] `bun run lint`
- [ ] `bun run format:check`
- [ ] `bun --filter='*' run check`
- [ ] `bun run build`
- [ ] CHANGELOG.md updated under `## [Unreleased]`

## Merge strategy

- **Never squash.** Regular merge commit so the atomic history is preserved.
- **Never delete the source branch** after merge.

```bash
gh pr merge <num> --merge   # NOT --squash, NOT --delete-branch
```

## Versioning & releases

Versioning is **by branch**, per product — there is no in-tree
`versioned_docs/` mechanism.

- `main` deploys the **latest** docs of every product (production).
- When a product cuts a version whose docs must be frozen, branch from `main`:

  ```bash
  git switch -c release/gwm/v0.9
  git push -u origin release/gwm/v0.9
  ```

  That branch keeps the docs as they were for gwm v0.9. Cloudflare Pages
  deploys it as a separate deployment (a versioned URL). A version-selector
  component (shared, in `ds-shared`) links the live versions together.

- Bugfixes to an old version land on its release branch; forward-port to `main`
  if still relevant.

Full rationale and the deployment topology are in [PLAN.md](PLAN.md).

---

By contributing, you agree your changes are licensed under the MIT License
(see [LICENSE.md](LICENSE.md)).
