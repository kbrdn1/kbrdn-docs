---
title: Diagnostic et services
description: Référence des sous-commandes - Diagnostic et services.
sidebar:
  order: 7
---

## `gwm agents [attach|detach] [--format=table|json]` (issue #408)

Liste les sessions d'agents IA que la détection a associées à chaque
worktree, ou en épingle une manuellement. La détection lit les artefacts de
session sur disque de chaque agent (Claude Code, Codex, opencode, Mistral
Vibe) : aucune énumération de processus, même chemin de code sur Linux,
macOS et Windows. Un raffinement sur Unix : quand le registre live de
Claude Code enregistre le PID d'une session et que ce process a disparu,
la session passe idle immédiatement au lieu d'attendre la fin de la
fenêtre d'activité ; ailleurs (et pour les autres agents), la
classification reste basée sur les artefacts seuls. Les mêmes données alimentent la colonne AGENT et la surcouche `a`
de la TUI, `gwm list` (colonne de table + champ JSON `agents`), le daemon et
`gwm statusline` (alimentée par le transport du daemon sur chaque
plateforme : un socket unix, ou un named pipe sous Windows, #439).

```bash
gwm agents                       # sessions par worktree : agent, fraîcheur, dernière activité, id, nom
                                 # + une section `unmatched` pour les sessions sans worktree
gwm agents --format=json         # les mêmes lignes que `gwm list --format=json`
gwm agents attach . 019f6b95-…   # épingler la session <id> au worktree englobant
gwm agents attach feat-42 <id>   # …ou au worktree dont le nom contient le motif
gwm agents detach feat-42 <id>   # retirer cette épingle-là
gwm agents detach feat-42        # tout retirer — retour à l'auto-détection pure
```

![`gwm agents` : les sessions groupées par worktree, avec l'agent, sa fraîcheur, sa dernière activité, son id et son nom](../../../../assets/captures/cli-agents.png)

**L'auto-détection est le défaut ; une épingle est un override.** Une épingle
couvre les cas que le répertoire de travail enregistré ne peut pas : agent
lancé depuis un sous-répertoire, worktree déplacé, session voulue sur un
worktree précis quel que soit son point de départ. Les épingles
**s'accumulent** : plusieurs agents peuvent travailler un même worktree :
attach ajoute une épingle, `detach <wt> <id>` retire celle-là précisément
(`detach <wt>` nu les retire toutes). Stockées dans la config de branche git
(clé multi-valuée `gwm-agent-pin`), jamais commitées. Le pane Agents de la
sidebar n'affiche que les sessions **épinglées** : épingler, c'est ce qui y
donne sa place à une session. Attacher un id que la détection ne
résout pas échoue avec le code 1 ; une épingle dont les artefacts
disparaissent se dégrade silencieusement vers la détection. Un worktree en
HEAD détachée ne peut pas porter d'épingle. Les sessions qu'**aucun**
worktree n'a captées (lancées dans un autre repo, un sous-répertoire, un
ancien chemin) apparaissent sous une section `unmatched` : exactement les
ids que `attach` attend.

`GWM_AGENTS_HOME` remplace le répertoire home lu par les scans d'artefacts,
principalement un point d'injection déterministe pour les tests et la CI.

## `gwm doctor [--format=text|json]`

Lance 8 vérifications de santé ; rapporte chacune avec `✓ / ! / ✗` ; sort `0 / 1 / 2`. Conçu pour la CI et les hooks de pre-commit. Voir [Intégrations → `gwm doctor`](/fr/integrations/doctor) pour le détail par vérification.

![`gwm doctor` : les huit vérifications avec leur statut `✓ / ! / ✗`](../../../../assets/captures/doctor.png)

`--format=json` (issue #38) émet le tableau de vérifications plus les agrégats `severity` et `exit_code`, avec le schéma à [`docs/schema/doctor.schema.json`](https://github.com/kbrdn1/gwm-cli/blob/main/docs/schema/doctor.schema.json). Le **code de sortie du processus est identique** à la forme texte (le JSON le porte aussi comme champ), donc `gwm doctor --format=json` fonctionne toujours dans un garde `if` :

```bash
gwm doctor --format=json | jq '.checks[] | select(.status == "failed")'
```

## `gwm daemon [--socket <path>] [--poll-ms <ms>]` (issue #38)

Lance gwm comme **daemon JSON-RPC 2.0** au long cours sur une socket de domaine unix (un named pipe sous Windows, #439), pour que les éditeurs / barres de statut / outillages se connectent une fois au lieu de lancer `gwm` à chaque requête.

```bash
gwm daemon                              # bind $XDG_RUNTIME_DIR/gwm.sock (→ $TMPDIR → /tmp)
gwm daemon --socket /tmp/gwm.sock       # explicit socket path
gwm daemon --poll-ms 500                # faster subscribe push, more git scans
```

**Format de fil :** JSON délimité par des retours à la ligne (NDJSON) : un objet requête par ligne, une réponse par ligne.

| Méthode     | Params                   | Résultat                                                                                                           |
| ----------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `list`      | _(aucun)_                | tableau de worktrees ([schéma](https://github.com/kbrdn1/gwm-cli/blob/main/docs/schema/worktree-list.schema.json)) |
| `doctor`    | _(aucun)_                | rapport doctor ([schéma](https://github.com/kbrdn1/gwm-cli/blob/main/docs/schema/doctor.schema.json))              |
| `path`      | `{ "pattern": "<str>" }` | `{ name, path, branch }` ([schéma](https://github.com/kbrdn1/gwm-cli/blob/main/docs/schema/path.schema.json))      |
| `subscribe` | _(aucun)_                | flux de notifications `worktrees.changed` (la première = snapshot courant)                                         |

```bash
# request/response (one line in, one line out)
printf '{"jsonrpc":"2.0","method":"list","id":1}\n' | nc -U "${XDG_RUNTIME_DIR:-${TMPDIR:-/tmp}}/gwm.sock"
```

`subscribe` transforme la connexion en flux de push à sens unique : le daemon envoie une notification `worktrees.changed` avec le snapshot courant, puis une à chaque changement. La détection de changement est un **polling à intervalle** de l'ensemble des worktrees (réglé par `--poll-ms`, défaut `1000`), un choix MVP délibéré plutôt qu'une surveillance du système de fichiers, pour qu'il n'y ait pas de dépendance supplémentaire et que le comportement soit déterministe ; la latence de mise à jour est bornée par l'intervalle de polling.

**Plateforme / build :** derrière la feature Cargo `daemon` activée par défaut. Unix lie une socket de domaine unix (`--socket` est un chemin de fichier) ; Windows lie un named pipe (#439, `--socket` est le NOM du pipe sous `\\.\pipe\`, `gwm-<user>.sock` par défaut, restreint au propriétaire par son descripteur de sécurité). Sur un build `--no-default-features`, la sous-commande quitte avec une erreur explicative (elle reste listée pour que `--help` soit identique partout).

`--poll-ms` doit être `≥ 1` (`0` est rejeté : il ferait tourner la boucle `subscribe` sans attente, re-scannant git aussi vite que le CPU le permet).

## `gwm statusline [--socket <path>] [--watch]` (issue #309)

Affiche un résumé compact des worktrees sur une seule ligne pour un prompt shell, le premier **consommateur** embarqué de `gwm daemon`. Il se connecte à la socket du daemon, demande l'ensemble des worktrees, et rend la branche active, le nombre de worktrees, l'état dirty / ahead / behind, et l'issue / la PR liées.

```bash
gwm statusline                          # one-shot, affiche une ligne et quitte
gwm statusline --watch                  # subscribe ; ré-affiche à chaque changement
gwm statusline --socket /tmp/gwm.sock   # socket du daemon explicite
```

```text
feat/#309-daemon-consumer · 3 wt · * ↑1 · #309 · PR #310
```

Jetons : branche (ou nom du worktree si HEAD détachée), compteur `N wt`, `*` dirty, `↑n`/`↓n` ahead/behind, `#N` issue, `PR #N`. Le worktree **actif** est celui qui englobe le répertoire courant ; hors de tout worktree, seul le compteur est affiché. Un rollup CI n'est volontairement pas inclus (il ne fait pas partie du schéma stable du daemon).

**Dégradation gracieuse :** quand aucun daemon n'est joignable, `gwm statusline` affiche une ligne vide et quitte avec `0`, pour qu'une substitution de prompt se réduise à rien au lieu d'échouer. Même résolution de `--socket` que `gwm daemon`. Voir [Intégrations → Consommateurs du daemon](/fr/integrations/daemon-consumers) pour les recettes de prompt (zsh / tmux / starship) et une recette éditeur (Zed / VS Code).
