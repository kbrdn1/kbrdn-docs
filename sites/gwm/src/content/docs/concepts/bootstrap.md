---
title: Bootstrap par repo
description: Comment gwm prépare un worktree neuf — copies de fichiers, gardes, no-symlink et hooks.
---

Au moment de créer un worktree, gwm exécute un bootstrap décrit dans `.gwm.toml` : copies de fichiers, gardes regex, invariant no-symlink et hooks shell de cycle de vie.
