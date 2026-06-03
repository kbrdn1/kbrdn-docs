# kbrdn-docs — house rules for AI assistants

Project-level CLAUDE.md. Anything here OVERRIDES defaults and applies to every
contribution made via an AI assistant in this repository.

## 🔴 Primordial rule — Bun only, green gates only

1. **Bun is the only package manager and runtime.** Never invoke `npm`,
   `pnpm`, `yarn`, `npx`, or `node` to manage deps or run scripts. Use
   `bun install`, `bun run <script>`, `bun --filter='<pkg>' run <script>`,
   `bunx <tool>`. A PR that introduces another lockfile is sent back.
2. **No change lands red.** Before declaring a task done, all four gates pass
   locally:
   - `bun run lint` (oxlint)
   - `bun run format:check` (prettier)
   - `bun --filter='*' run check` (astro check — type & content)
   - `bun run build` (every site builds static, zero broken refs)

This is the merge contract. "It looked fine in dev" is not enough — run the
gates.

## What this repo is

A **multi-product documentation monorepo**: one Astro Starlight site per
product, sharing a design-system package for consistency. Static output,
deployed to Cloudflare Pages. Versioning is **by branch** (see below).

```
kbrdn-docs/
├── package.json            # Bun workspaces root (private)
├── bunfig.toml
├── flake.nix               # Nix dev shell (bun, node, git)
├── .oxlintrc.json          # oxlint config
├── .prettierrc.json
├── packages/
│   └── ds-shared/          # @kbrdn/ds-shared — shared theme + overrides + MDX components
└── sites/
    └── gwm/                # @kbrdn/docs-gwm — Starlight site for gwm
```

## Other house rules

- **Shared vs local.** A component goes in `@kbrdn/ds-shared` ONLY if it is (or
  will be) reused across more than one product. Product-specific UI stays in
  the site. The shared package is the consistency layer — keep it small and
  deliberate.
- **Content accuracy is behaviour.** Docs that describe a CLI/flag must match
  the real tool. When documenting gwm, cross-check against the `gwm-cli` repo
  (commands, flags, `.gwm.toml` schema) rather than inventing surface.
- **Branch versioning.** `main` is the live "latest" of every product. A
  product version is frozen by cutting a branch `release/<product>/v<MAJOR.MINOR>`
  at release time; that branch deploys its own Cloudflare Pages deployment. Do
  not build an in-tree `versioned_docs/` mechanism — versions are branches.
- **Don't add versioning prematurely.** Stay "latest only" until a product
  genuinely has two live versions to document in parallel.
- **Branch convention**: `<type>/#<issue>-<description>` (e.g.
  `feat/#3-header-override`, `docs/#5-gwm-config-reference`).
- **Commit format**: Gitmoji + Conventional Commits. See
  [CONTRIBUTING.md](CONTRIBUTING.md#commits).
- **Merge strategy**: regular merge commit, never squash, never delete the
  source branch. The atomic history is the artefact.
- **Indentation**: 2 spaces. Prettier is the source of truth; `bun run format`
  before committing, CI enforces `bun run format:check`.
- **Linter**: oxlint (`bun run lint`) must pass. `.astro` files are checked by
  `astro check`, not oxlint.
- **No leftover `console.log`** in shipped component code.
- **Pre-commit hook** (opt-in): `git config core.hooksPath .githooks` wires
  prettier + oxlint + astro check on staged files. Bypass once with
  `git commit --no-verify`.

## Where to look for the rest

- Plan / roadmap → [PLAN.md](PLAN.md)
- Contribution conventions → [CONTRIBUTING.md](CONTRIBUTING.md)
- Shared package → [packages/ds-shared/README.md](packages/ds-shared/README.md)
