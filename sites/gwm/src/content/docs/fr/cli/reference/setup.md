---
title: Installation et configuration
description: Référence des sous-commandes - Installation et configuration.
sidebar:
  order: 2
---

## `gwm init [--preset <name>] [--list-presets] [--show]`

Écrit un `.gwm.toml` dans le dépôt courant - le template générique documenté par défaut, ou un preset de stack opinionné.

```bash
gwm init
# → wrote /path/to/repo/.gwm.toml

gwm init --preset rust          # seed a Rust-flavoured .gwm.toml
gwm init --list-presets         # enumerate the built-ins, write nothing
gwm init --preset node --show   # print the resolved TOML, write nothing
```

Refuse d'écraser un `.gwm.toml` existant. Ajustez le fichier généré et relancez `gwm doctor` pour le valider.

| Flag              | Action                                                                                                              |
| :---------------- | :------------------------------------------------------------------------------------------------------------------ |
| `--preset <NAME>` | Initialise un `.gwm.toml` opinionné pour une stack connue au lieu du template générique (issue #37)                 |
| `--list-presets`  | Liste les presets intégrés avec une description d'une ligne et quitte (n'écrit rien, ne nécessite pas de dépôt git) |
| `--show`          | Affiche le preset (ou le template) résolu sur stdout au lieu de l'écrire - pratique pour differ                     |

### Presets de stack (issue #37)

`--preset <name>` initialise un `.gwm.toml` opinionné pour une stack connue au lieu du template générique - copies d'env, invariants no-symlink et la bonne commande d'install pré-câblés. `gwm init --list-presets` les énumère :

```text
generic    The fully-documented default template (same as `gwm init`).
go         Go module: bin/ no-symlink + `go mod download`.
laravel    Laravel: env copies + AWS-RDS guard + vendor/ no-symlink + composer install.
node       Node / Nuxt: node_modules/ no-symlink + bun-or-npm install. (alias: nuxt)
python-uv  Python (uv): .venv/ no-symlink + `uv sync`.
rust       Rust crate: target/ no-symlink + `cargo fetch`.
```

`nuxt` est un alias de `node` (même corps), et `generic` est le défaut documenté - `gwm init` sans flag l'écrit à l'octet près. Les corps des presets sont embarqués dans le binaire et tenus synchronisés avec [`examples/presets/<name>.toml`](https://github.com/kbrdn1/gwm-cli/tree/main/examples/presets). `--show` affiche le TOML résolu sur stdout sans toucher au disque, vous pouvez donc differ un preset contre une config existante :

```bash
gwm init --preset laravel --show | diff - .gwm.toml
```

## `gwm config`

Lire, éditer et valider `.gwm.toml` sans ouvrir le fichier à la main.

```bash
gwm config get tui.confirm_countdown_secs
gwm config set tui.confirm_countdown_secs 5
gwm config set 'labels[+].name=bug'
gwm config unset review.tool
gwm config list --prefix worktree
gwm config validate
vi "$(gwm config path)"
gwm config edit
```

Les clés utilisent la notation par chemin pointé. Les tables de tableau utilisent des index (`labels[0].name`), et `set` accepte aussi `[+]` pour ajouter l'entrée de table suivante. Les écritures utilisent `toml_edit`, donc les commentaires et le formatage existants sont préservés ; après chaque écriture, gwm recharge le même schéma d'exécution que celui utilisé par le reste de la CLI.

## `gwm types [--gitmoji]`

Liste les types de branche pris en charge (l'emplacement `<type>` de `gwm create`).

```bash
gwm types
# → feat
#   fix
#   hotfix
#   docs
#   …

gwm types --gitmoji
# → feat      ✨  :sparkles:
#   fix       🐛  :bug:
#   …
```

Surchargez par dépôt via `[worktree].branch_types` dans `.gwm.toml`.

| Flag        | Action                                                                                    |
| :---------- | :---------------------------------------------------------------------------------------- |
| `--gitmoji` | Étend la liste avec deux colonnes - l'emoji unicode et sa forme `:shortcode:` (issue #85) |

`--gitmoji` résout l'emoji de chaque type à partir des valeurs par défaut intégrées plus tout override `[gitmoji]` propre au dépôt dans `.gwm.toml`. Les types de branche personnalisés sont pris en charge - `migration = ":truck:"` fait un aller-retour à travers `gwm types --gitmoji`. Voir [`gwm commit-prefix`](#gwm-commit-prefix---branch-name---unicode) pour la surface commit-prefix correspondante.

## `gwm commit-prefix [--branch <name>] [--unicode]`

Affiche le préfixe canonique Gitmoji + Conventional Commits pour la branche courante (ou nommée) - pratique pour les prompts de shell, les assistants IA et la composition scriptée de commits.

```bash
gwm commit-prefix
# → :sparkles: feat(#41):

gwm commit-prefix --unicode
# → ✨ feat(#41):

gwm commit-prefix --branch feat/#41-tui-search
# → :sparkles: feat(#41):
```

Sans `--branch`, lit la branche courante depuis `HEAD` via libgit2 (nécessite que le CWD soit à l'intérieur d'un dépôt git). `--branch` résout le préfixe pour un nom de branche explicite ; il lit tout de même `.gwm.toml` pour les overrides `[gitmoji]`.

| Flag              | Action                                                                                      |
| :---------------- | :------------------------------------------------------------------------------------------ |
| `--branch <name>` | Résout le préfixe pour une branche nommée (par ex. `feat/#41-tui-search`) au lieu de `HEAD` |
| `--unicode`       | Émet le vrai caractère emoji (`✨`) au lieu de la forme `:shortcode:` (`:sparkles:`)        |

Sous `--unicode`, les overrides `:shortcode:` connus sont normalisés vers leur emoji (par ex. un `[gitmoji]` `feat = ":rocket:"` affiche `🚀 feat(#1):`) ; les shortcodes inconnus passent tels quels - pas de panique, pas de substitution. Le mapping des emoji est la valeur par défaut intégrée plus tout override `[gitmoji]` dans `.gwm.toml`.

## `gwm hooks install commit-msg [--force]`

Installe un hook git `commit-msg` opt-in qui ajoute automatiquement en tête le préfixe de commit résolu quand un message n'en commence pas déjà par un.

```bash
gwm hooks install commit-msg            # install into .git/hooks/commit-msg
gwm hooks install commit-msg --force    # overwrite an existing commit-msg hook
```

Le hook n'est **jamais installé implicitement** - vous l'activez une fois par dépôt. Il est non destructif par défaut : il refuse d'écraser un hook `commit-msg` préexistant (husky / commitlint / pre-commit) et se termine avec un code non nul en indiquant le chemin en conflit, sauf si `--force` est passé. Le hook respecte `core.hooksPath`, résout le fichier `.git` d'un worktree lié via `Repository::discover`, et se dégrade proprement si `gwm` n'est pas sur le `$PATH` au moment du commit (le message est laissé intact). `commit-msg` est aujourd'hui le seul type de hook ; clap rejette toute autre valeur au moment du parsing.

| Flag      | Action                                                              |
| :-------- | :------------------------------------------------------------------ |
| `--force` | Remplace un hook existant du même nom (sinon l'installation refuse) |

Le préfixe qu'il ajoute est exactement ce que [`gwm commit-prefix`](#gwm-commit-prefix---branch-name---unicode) affiche pour la branche du worktree.
