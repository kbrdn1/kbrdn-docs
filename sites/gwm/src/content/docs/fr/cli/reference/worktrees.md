---
title: Cycle de vie des worktrees
description: gwm create, bootstrap, sync, remove, prune, switch, path, list et note - tout le cycle de vie d'un worktree, de la création au nettoyage.
sidebar:
  order: 3
---

## `gwm create <type> <issue> <desc>`

Crée un worktree et la branche correspondante.

```bash
gwm create feat 123 user-authentication
#   → branch feat/#123-user-authentication
#   → worktree ~/cc-worktree/<repo>/feat-123-user-authentication

gwm create feat 123 foo --no-bootstrap     # skip the bootstrap pipeline
```

| Flag                    | Action                                                                                                                                                                           |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-bootstrap`        | Saute les étapes de bootstrap de `.gwm.toml` (copies / guards / commands / hooks)                                                                                                |
| `--reuse-branch`        | Se rattache à une branche locale existante du même nom au lieu de refuser (issue #99)                                                                                            |
| `--skip-hooks <PHASES>` | Saute les phases de hook de cycle de vie séparées par des virgules (par ex. `pre_create,post_create`)                                                                            |
| `--name <NAME>`         | Nomme le worktree librement au lieu du triplet `<type> <issue> <desc>` (issue #416). Exclusif des positionnels                                                                   |
| `--repo <NAME>`         | En [mode workspace](#mode-workspace-global---workspace-issue-36), quel dépôt enfant reçoit le worktree, requis là pour lever l'ambiguïté ; ignoré en mode mono-dépôt (issue #36) |

Par défaut `gwm create` refuse de réutiliser silencieusement une branche locale obsolète : il se termine par une erreur nommant le tip obsolète pour que vous puissiez l'auditer ; `--reuse-branch` est l'échappatoire opt-in.

### Nommage libre (`--name`)

Tous les worktrees ne correspondent pas à une issue. `--name` contourne entièrement la convention :

```bash
gwm create --name spike-redis
#   → branche spike-redis
#   → worktree ~/cc-worktree/<repo>/spike-redis
```

Le nom devient la branche **tel quel** : il est validé exactement comme il a été saisi, donc `--name " spike"` est refusé plutôt que rogné en une branche différente de celle demandée. `branch_pattern` et `path_pattern` ne s'appliquent pas : ils sont écrits en `{type}` / `{issue}` / `{desc}`, dont un nom libre n'a aucun. `[worktree].base` s'applique toujours, donc les worktrees libres atterrissent à côté des structurés, pour les placeholders qu'il documente (`{home}`, `{repo}`, `{repo_path}`, `{repo_parent}`) ; une base écrite avec `{type}` / `{issue}` / `{desc}` est refusée à la place, puisqu'il n'y a rien pour les résoudre et qu'ils finiraient littéralement dans le chemin. Un `/` est légal dans la branche et devient `-` dans le nom de répertoire, exactement le rapport qu'ont déjà les deux motifs par défaut.

**Ce que vous perdez.** Tout ce qui relit le nom de branche devient muet. C'est le contrat, pas un bug. Ce tableau décrit un nom qui ne **correspond pas** à la convention de branche ; rien n'enregistre _comment_ un worktree a été nommé, seulement quelle est sa branche, donc un nom libre qui ressemble par hasard à un nom structuré (`--name 'feat/#42-x'`) est relu comme structuré et conserve toutes les lignes ci-dessous :

| Fonctionnalité                                       | Sur un worktree libre                                                          |
| :--------------------------------------------------- | :----------------------------------------------------------------------------- |
| auto-liaison de l'issue                              | inactive ; utilisez `gwm link --issue <N>` pour en attacher une à la main      |
| détection PR/MR                                      | **fonctionne toujours**, elle interroge la forge avec le nom de branche entier |
| gitmoji / `gwm commit-prefix`                        | erreur : le préfixe est dérivé du _type_ de branche, et il n'y en a pas        |
| contrôle des orphelines du `doctor`                  | la traite comme une branche gérée par l'utilisateur, jamais signalée           |
| placeholders des hooks (create / remove / bootstrap) | `{type}` / `{issue}` / `{desc}` sont vides                                     |
| formulaire d'édition TUI                             | sans objet ; ce formulaire reconstruit le triplet, renommez avec git           |

**Noms acceptés.** Un nom libre doit être trois choses à la fois, et les règles en découlent plutôt que d'une liste de mauvais exemples écrite à la main.

C'est **une branche git**, vérifié contre le jeu de règles de libgit2 au niveau _branche_, plus strict que celui au niveau _référence_ (`refs/heads/HEAD` est un nom de référence valide, `HEAD` n'est pas un nom de branche utilisable). C'est **un composant de chemin unique**, le répertoire du worktree, ce qu'un nom de branche n'est pas : ni `.` ni `..` comme composant (un répertoire nommé `..` sortirait de la base), et 255 octets au maximum : `a×130/b×130` est une ref légale et un nom de répertoire illégal, et sans ce plafond la branche est créée avant que le répertoire n'échoue, la laissant orpheline. Et c'est **une valeur littérale pendant l'expansion des hooks**, donc ni `{` ni `}` : les placeholders sont substitués en séquence, et une branche nommée `spike-{issue}` verrait son propre nom réécrit à l'intérieur de la valeur `{branch}` reçue par un hook.

Une dernière règle n'appartient à aucune des trois : pas de `-` en tête. Git l'accepte ; `gwm remove` et `git branch -d` le liraient comme un flag.

`Spike_Redis`, `2026.07.27` et `réécriture` passent tous.

Le répertoire doit aussi pouvoir exister sous **Windows**, d'où trois règles supplémentaires qui s'appliquent sur toutes les plateformes, pas seulement là-bas ([#475](https://github.com/kbrdn1/gwm-cli/issues/475)). Ni `<`, ni `>`, ni `"`, ni `|`, que Win32 interdit dans un composant de chemin et que git accepte. Aucun composant de chemin qui soit un nom de périphérique réservé (`CON`, `PRN`, `AUX`, `NUL`, `COM1`–`COM9`, `LPT1`–`LPT9`), sans distinction de casse et avec ou sans extension, puisque Win32 lit `NUL.tar.gz` comme `NUL`. Et aucun composant de chemin qui se termine par `.`, que Windows refuse comme nom de répertoire.

Les deux dernières sont vérifiées segment par segment (séparés par `/`), parce qu'une ref lâche est un fichier sous `.git/refs/heads/<nom>`, ce qui fait de chaque segment un composant de chemin : `spike/CON` s'aplatit en `spike-CON`, un répertoire parfaitement légal, et reste une ref impossible à écrire sous Windows. Le point final est le cas qu'il faut connaître, car git le couvre _presque_ : sa propre règle porte sur le nom de branche entier, donc `spike.` est refusé par git alors que `foo./bar` ne l'est pas. `v1.2/spike` reste légal, un point à l'intérieur d'un segment n'en étant pas un à la fin.

Ces règles ne sont pas conditionnées à Windows, car une branche voyage jusqu'à la machine d'un collègue en passant par la forge. Un nom qu'aucun checkout Windows ne peut héberger est un risque pour toute l'équipe, pas un risque local. L'ensemble résiduel est exactement ce que libgit2 ne rejette pas déjà : git refuse lui-même `:`, `\`, `?`, `*` et une espace en toute position, donc ces cas n'ont besoin d'aucune règle propre. `COM0` et `LPT0` restent légaux, absents de la liste réservée de Win32.

Dans la TUI, `Ctrl-T` bascule le formulaire de création (et lui seul) entre le triplet structuré et un unique champ `Name`.

Le déroulé de bout en bout vit dans [Premiers pas → Premier worktree](/fr/getting-started/first-worktree).

## `gwm new <type> <desc>`

Crée une issue GitHub à partir du formulaire d'issue configuré du dépôt, puis crée le worktree correspondant à partir du numéro d'issue retourné.

```bash
gwm new feat add-config-types
# → created issue #142 [Feature]: add-config-types
# → branch feat/#142-add-config-types
```

`gwm new` lit `[issue_template]` depuis `.gwm.toml`, rend le fichier `.github/ISSUE_TEMPLATE/*.yml` sélectionné en markdown, appelle `gh issue create --body-file`, puis passe la main au même chemin de création de worktree que `gwm create`.

| Flag             | Action                                                                  |
| :--------------- | :---------------------------------------------------------------------- |
| `--no-bootstrap` | Crée le worktree sans lancer le bootstrap                               |
| `--reuse-branch` | Se rattache à une branche locale existante après la création de l'issue |
| `--skip-hooks`   | Saute les phases de hook de cycle de vie séparées par des virgules      |

## `gwm list [--format=table|names|json] [--detect-pr] [--workspace <dir>]`

Liste les worktrees du dépôt courant.

```bash
gwm list                       # human-readable table
gwm list --format=names        # one worktree name per line (for shell completion)
gwm list --format=json         # machine-readable JSON array (issue #38)
gwm list --detect-pr           # add a PR column, auto-detecting each branch's PR via gh
gwm list --workspace ~/Projects  # merged table across every child repo, leading REPO column
```

Le format `names` exclut le workdir principal : `gwm path / remove / bootstrap` ne l'acceptent jamais comme cible, donc l'émettre comme candidat de complétion serait trompeur.

`--format=json` (issue #38) émet un tableau JSON stable, avec le schéma documenté à [`docs/schema/worktree-list.schema.json`](https://github.com/kbrdn1/gwm-cli/blob/main/docs/schema/worktree-list.schema.json). Contrairement à `names`, il **inclut** le worktree principal : un consommateur JSON (un éditeur, une barre de statut) veut l'ensemble complet et y résout le worktree actif. Chaque entrée porte `name`, `id`, `path`, `branch`, `head`, `is_main` / `is_locked` / `is_prunable`, un objet `status` (`is_dirty`, `has_upstream`, `ahead`, `behind`, `unknown`), `age_seconds`, et les numéros `issue` / `pr` liés. À piper dans `jq` :

```bash
gwm list --format=json | jq '.[] | select(.status.is_dirty) | .name'
```

`--detect-pr` ajoute une colonne `PR` peuplée par la [détection automatique de PR](/fr/integrations/github-linking#détection-automatique) (`gh pr list --head <branch>` par worktree). Elle est **désactivée par défaut** pour que le listing simple reste sans réseau : un appel `gh` par worktree n'est payé que lorsque le flag est posé. Ignorée avec `--format=names`.

`--workspace <dir>` (issue #36) affiche la table de worktrees fusionnée sur chaque dépôt git situé un niveau sous `<dir>`, avec une colonne **REPO** en tête nommant le dépôt de chaque ligne. Voir [Mode workspace](#mode-workspace-global---workspace-issue-36) pour le comportement complet.

## `gwm path <pattern> [--format=text|json]` (alias : `gwm cd <pattern>`)

Affiche le chemin sur disque d'un worktree correspondant à `<pattern>` (fuzzy). À utiliser avec `$(...)` pour faire `cd` :

```bash
cd "$(gwm path auth)"
cd "$(gwm cd auth)"            # same — framing for the cd flow
gwm path auth --format=json    # { "name": ..., "path": ..., "branch": ... }
```

La forme `text` par défaut affiche le chemin nu pour la consommation `$(...)`. `--format=json` (issue #38) émet le triplet `{ name, path, branch }`, avec le schéma à [`docs/schema/path.schema.json`](https://github.com/kbrdn1/gwm-cli/blob/main/docs/schema/path.schema.json).

Les deux formes partagent la sémantique : résolution fuzzy, sortie `0` sur une correspondance unique, `1` sur un échec / une ambiguïté / hors d'un dépôt. À associer à `gwm shell-init` pour le one-liner `gcd`. Voir [Premiers pas → Shell init](/fr/getting-started/shell-init).

## `gwm note show [<slug>]` (issue #515)

Affiche la note d'un worktree sur stdout, telle quelle. Sans slug, c'est la note du worktree dans lequel se trouve le répertoire courant.

```bash
gwm note show                  # la note du worktree courant
gwm note show auth             # un worktree résolu par motif fuzzy
gwm note show >/dev/null       # sortie 0 = il y a une note, 1 = il n'y en a pas
```

Une note est du Markdown brut stocké dans `<checkout-principal>/.git/gwm/notes/<branche>.md`, écrite depuis le `N` du TUI (une modale éditable, `Ctrl+e` y confie le fichier à `$EDITOR`) ou en éditant le fichier directement. Elle n'est jamais commitée, elle survit à `gwm remove`, et elle reste lisible depuis le checkout principal. Voir [TUI → notes](/fr/tui/keybindings#notes-n).

La sous-commande est en lecture seule : une note est de la prose, et la prose s'écrit dans un éditeur.

La présence signifie « non vide » : un fichier absent, illisible ou ne contenant que des blancs n'affiche rien et sort en `1`. Un fichier vide est ce qu'un éditeur laisse derrière lui quand on ouvre une note et qu'on enregistre sans rien taper, donc le traiter comme une note allumerait le marqueur de la table pour rien.

La sortie `1` couvre aussi une HEAD détachée, qui ne porte aucune note : une note est indexée sur la branche, donc un worktree sans branche n'a rien sur quoi s'indexer. La raison part sur stderr dans les deux cas, ce qui garde stdout propre pour `$(...)`.

Le même texte accompagne les lignes de `--format=json` dans un champ additif `note` (palier expérimental, omis en l'absence de note), pour qu'une statusline ou un plugin d'éditeur n'ait pas à lancer une commande par ligne.

## `gwm switch` (alias : `gwm s`)

Ouvre le TUI en **mode sélecteur** : la même table que `gwm` seul, la barre de filtre fuzzy pré-ouverte, create / delete / bootstrap désactivés. Appuyez sur `Enter` pour afficher le chemin du worktree surligné sur stdout, `Esc` / `q` / `Ctrl-C` pour annuler avec le code de sortie `1`.

```bash
cd "$(gwm switch)"             # open picker, type to narrow, Enter to commit
gcd                            # same, via the `gwm shell-init` wrapper
```

## `gwm bootstrap [<pattern>]`

Relance le pipeline de bootstrap de `.gwm.toml` sur un worktree sans le recréer.

```bash
gwm bootstrap                  # on the CWD worktree
gwm bootstrap auth             # on a fuzzy-matched name
```

Utile après avoir édité `.gwm.toml` ou ajouté de nouvelles règles `[[bootstrap.copy]]`. Même rapport `✓ / ! / ✗` que `gwm create`.

| Flag                    | Action                                                                                                      |
| :---------------------- | :---------------------------------------------------------------------------------------------------------- |
| `--skip-hooks <PHASES>` | Saute les phases de hook de cycle de vie séparées par des virgules (par ex. `pre_bootstrap,post_bootstrap`) |

## `gwm sync [<pattern>] [--merge]`

Récupère l'upstream d'un worktree et met sa branche à jour : rebase par défaut, ou merge avec `--merge`.

```bash
gwm sync                       # the CWD worktree, rebase onto upstream
gwm sync auth                  # a fuzzy-matched worktree
gwm sync auth --merge          # merge the upstream instead of rebasing
```

Résout la cible comme `gwm bootstrap` (motif fuzzy, par défaut le worktree contenant le CWD, qui peut être le worktree principal, vous pouvez donc aussi synchroniser le tronc). Il lance `git fetch` pour le remote de l'upstream, recalcule le retard de la branche, puis n'intègre que lorsqu'il y a quelque chose à intégrer. Rapporte une seule ligne `✓` (`already up to date` / `rebased N commit(s)` / `merged N commit(s)`).

Garde-fous :

- **Arbre de travail sale** → refuse avant de toucher au remote (`commit or stash`). Un rebase/merge par-dessus du travail non commité est la façon de perdre des changements.
- **Aucun upstream configuré** → erreur avec le correctif `git branch --set-upstream-to=<remote>/<branch>`.
- **Conflit** → le rebase/merge est **abandonné** pour que le worktree reste utilisable, et on vous indique de réconcilier à la main.

Les étapes fetch / rebase / merge délèguent à votre `git` (donc les clés SSH, les credential helpers et les règles `insteadOf` s'appliquent toutes) ; l'inspection sale / upstream / avance-retard utilise libgit2.

## `gwm remove <PATTERN>... [--delete-branch] [--dry-run]`

Supprime un ou plusieurs worktrees par correspondance fuzzy. La branche survit par défaut.

```bash
gwm remove auth                            # remove the worktree, keep the branch
gwm remove auth --delete-branch            # remove the worktree AND drop the branch
gwm remove auth --dry-run                  # preview the plan, destroy nothing
gwm remove auth --dry-run --delete-branch  # preview, including the branch drop
gwm remove auth docs spike --delete-branch # remove a batch in one command
```

Chaque motif est résolu **avant** que quoi que ce soit ne soit touché (issue #484) : une faute de frappe au milieu d'un lot fait échouer la commande entière sans rien supprimer, au lieu de laisser la première moitié disparue. Les motifs qui désignent le même worktree ne sont supprimés qu'une fois. La boucle destructive, elle, ne s'arrête pas à la première erreur : chaque échec est nommé sur stderr et la commande sort quand même avec un code non nul. Le pendant TUI est [`Space` pour marquer les lignes, `d` pour supprimer le lot](/fr/tui/keybindings).

La forme CLI n'a pas de compte à rebours (le [compte à rebours de l'overlay de confirmation `d`](/fr/tui/confirm-countdown) du TUI est propre au TUI). `--delete-branch` est destructif : seul `git reflog` peut ressusciter une branche supprimée.

| Flag                    | Action                                                                                                                     |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| `--delete-branch`       | Supprime aussi la branche locale après avoir retiré le worktree (destructif)                                               |
| `--dry-run`             | Affiche le plan de suppression (nom + chemin + branche) et sort `0` sans rien toucher (issue #31)                          |
| `--force`               | Mode de suppression d'urgence : saute les [hooks de cycle de vie](/fr/configuration/gwm-toml) `pre_remove` / `post_remove` |
| `--skip-hooks <PHASES>` | Saute les phases de hook de cycle de vie séparées par des virgules (par ex. `pre_remove,post_remove`)                      |

`--dry-run` résout le motif fuzzy, affiche le plan et sort `0` : aucune destruction, **aucune écriture dans le journal** (voir [`gwm undo` / `gwm history`](#gwm-undo---bootstrap)). Avec `--delete-branch`, il marque la ligne de branche `(would be deleted)` ; sur un worktree en detached-HEAD il affiche `branch: - (no branch to delete)` à la place, reflétant le comportement du chemin destructif. Un motif ambigu déclenche la même erreur de liste de candidats avec code non nul que la forme destructive : `--dry-run` ne supprime que la destruction, pas les échecs de résolution.

## `gwm prune [--dry-run]`

Efface les entrées obsolètes dans `.git/worktrees/` dont le répertoire de travail a été supprimé manuellement (par ex. `rm -rf` en dehors de gwm).

```bash
gwm prune                      # prune every stale entry
gwm prune --dry-run            # list the prunable entries, touch nothing
```

`gwm doctor` signale les entrées élaguables comme un Warning ; `gwm prune` est la remédiation documentée.

| Flag        | Action                                                                                                          |
| :---------- | :-------------------------------------------------------------------------------------------------------------- |
| `--dry-run` | Liste chaque entrée élaguable (nom + chemin + raison) et sort `0` sans toucher aux fichiers d'admin (issue #31) |

La sortie de `--dry-run` est triée par nom pour un diff de stdout déterministe ; le cas vide affiche `0 worktree(s) to prune` pour que les appelants scriptés obtiennent un signal stable. Les largeurs de colonne sont calculées en caractères Unicode pour que les noms non-ASCII restent alignés. L'aperçu et la passe destructive partagent le même scanner, donc ils ne peuvent jamais diverger sur la définition de « élaguable ».
