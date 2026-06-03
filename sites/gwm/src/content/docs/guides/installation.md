---
title: Installation
description: Installer gwm via Homebrew, Cargo ou depuis les sources.
---

## Homebrew (macOS / Linux)

```sh
brew install kbrdn1/tap/gwm
```

Le tap suit toujours la dernière version stable (les pré-releases sont filtrées).

## Cargo

```sh
cargo install --git https://github.com/kbrdn1/gwm-cli
```

## Depuis les sources

```sh
git clone https://github.com/kbrdn1/gwm-cli.git
cd gwm-cli
cargo install --path .
```

Un compilateur C est requis : `git2` embarque libgit2 et le compile depuis les sources au premier
build.
