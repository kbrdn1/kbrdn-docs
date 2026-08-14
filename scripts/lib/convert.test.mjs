// Couverture du noyau de conversion. Ce que ces tests protègent n'est pas le
// confort de développement : `sync-gwm.yml` lance le script sur un
// `repository_dispatch`, commite ce qu'il produit et déclenche le déploiement.
// Une régression de mapping se publie donc sans qu'un humain la relise.
//
// Chaque cas est choisi pour échouer si la règle qu'il décrit disparaît, et pas
// seulement pour exercer la fonction.

import { describe, expect, test } from 'bun:test';
import {
  capitalise,
  capitaliseHeadings,
  convert,
  dedash,
  dedashProse,
  demarkup,
  descriptionVersion,
  orderOf,
  stripOrder,
  targetFor,
  versionFromCargoToml,
} from './convert.mjs';

describe('mapping de nom et d’ordre', () => {
  test('le préfixe numérique quitte le nom', () => {
    expect(stripOrder('2.first-worktree.md')).toBe('first-worktree.md');
    expect(stripOrder('10.tenth.md')).toBe('tenth.md');
  });

  test('un nom sans préfixe est rendu tel quel', () => {
    expect(stripOrder('index.md')).toBe('index.md');
    // Un point qui ne suit pas des chiffres n'est pas un préfixe d'ordre.
    expect(stripOrder('gwm-toml.md')).toBe('gwm-toml.md');
  });

  test('l’index d’une section passe en tête, pas en queue', () => {
    // C'est la raison d'être du cas particulier : sans ordre explicite, Starlight
    // range l'index après les pages numérotées, où il se lit comme un doublon du
    // libellé de groupe.
    expect(orderOf('index.md')).toBe(0);
  });

  test('l’ordre se lit dans le préfixe, et vaut undefined sans préfixe', () => {
    expect(orderOf('3.cli.md')).toBe(3);
    expect(orderOf('10.tenth.md')).toBe(10);
    expect(orderOf('roadmap.md')).toBeUndefined();
  });
});

describe('targetFor', () => {
  const racines = { src: '/src/docs', docs: '/site/content/docs' };

  test('une page anglaise perd ses préfixes et garde son arborescence', () => {
    const r = targetFor('/src/docs/2.tui/1.keybindings.md', racines);
    expect(r.isFr).toBe(false);
    expect(r.out).toBe('/site/content/docs/tui/keybindings.md');
    expect(r.order).toBe(1);
  });

  test('une page française atterrit sous fr/ sans garder le segment de langue', () => {
    // Le `fr` est consommé comme locale : le laisser dans les segments donnerait
    // `content/docs/fr/fr/...`.
    const r = targetFor('/src/docs/fr/2.tui/1.keybindings.md', racines);
    expect(r.isFr).toBe(true);
    expect(r.out).toBe('/site/content/docs/fr/tui/keybindings.md');
    expect(r.order).toBe(1);
  });

  test('l’ordre vient du nom de fichier, pas du dossier', () => {
    // `7.roadmap.md` est à la racine : son ordre est 7 et son chemin n'a pas de
    // segment intermédiaire.
    const r = targetFor('/src/docs/7.roadmap.md', racines);
    expect(r.out).toBe('/site/content/docs/roadmap.md');
    expect(r.order).toBe(7);
  });
});

describe('typographie', () => {
  test('le cadratin entouré d’espaces devient un tiret court espacé', () => {
    expect(dedash('un titre — et sa suite')).toBe('un titre - et sa suite');
  });

  test('un cadratin collé est espacé lui aussi', () => {
    // Comportement réel, découvert en écrivant ce test : `\s*—\s*` matche aussi
    // zéro espace, donc `a—b` passe par la première substitution et ressort
    // espacé. La seconde, `.replace(/—/g, '-')`, est par conséquent
    // inatteignable : aucun cadratin ne lui parvient. Elle est conservée telle
    // quelle (la retirer ne changerait rien au résultat) mais ce test fige le
    // fait, pour que personne ne la croie active.
    expect(dedash('a—b')).toBe('a - b');
  });

  test('la prose est nettoyée', () => {
    expect(dedashProse('du texte — une incise')).toBe('du texte - une incise');
  });

  test('un bloc de code garde ses cadratins', () => {
    // Un cadratin dans un exemple fait partie de la sortie montrée : le réécrire
    // ferait mentir l'exemple.
    //
    // Le bloc porte du code inline, et ce n'est pas décoratif : c'est ce qui rend
    // le cas discriminant. Sur un bloc sans backtick interne, la protection des
    // spans inline recouvre déjà celle des blocs (les backticks de ``` s'apparient
    // entre eux), et le test passerait même si la protection des blocs
    // disparaissait. Vérifié en retirant la ligne `replace(/```…/g, hold)`.
    const src = 'avant — après\n\n```bash\ngwm list  # `a — b`\n```\n';
    const out = dedashProse(src);
    expect(out).toContain('avant - après');
    expect(out).toContain('`a — b`');
  });

  test('un span de code inline garde ses cadratins', () => {
    const out = dedashProse('voir `gwm — list` — et la suite');
    expect(out).toContain('`gwm — list`');
    expect(out).toContain('` - et la suite');
  });

  test('un span de code replié sur deux lignes ne désynchronise pas les suivants', () => {
    // Régression réelle, vue sur changelog/1.0.0.md : avec un motif qui ne
    // franchissait pas le saut de ligne, l'appariement des backticks glissait et
    // la prose suivante était traitée comme du code, son cadratin survivait.
    const src = 'un `span\nreplié` puis — une incise à nettoyer';
    const out = dedashProse(src);
    expect(out).toContain('puis - une incise');
    expect(out).not.toContain('—');
  });
});

describe('markup du frontmatter', () => {
  test('le code inline perd ses backticks', () => {
    // `title` et `description` ne passent pas par le rendu markdown : ils
    // partent tels quels dans <title> et <meta name="description">, où un
    // backtick se lit comme une coquille.
    expect(demarkup('`gwm list --format=names` et la suite')).toBe(
      'gwm list --format=names et la suite',
    );
  });

  test('un span d’un seul caractère passe en guillemets de la langue', () => {
    // Le backtick portait seul la frontière du jeton : sans lui « la surcouche
    // a » se lit comme un article, et « la palette de commandes :, tous deux »
    // comme une phrase tronquée. Les deux cas sont réels (/tui/agent-sessions/
    // et /tui/keymap-and-palette/).
    // Insécables échappées à dessein : elles sont tapées littéralement dans
    // `demarkup`, où rien ne les distingue d'une espace ordinaire à l'œil. Ce
    // test est le seul endroit qui dit lesquelles sont attendues.
    expect(demarkup('la surcouche `a`', { isFr: true })).toBe(
      `la surcouche \u00ab\u00a0a\u00a0\u00bb`,
    );
    expect(demarkup('the `a` overlay')).toBe('the “a” overlay');
  });

  test('les crochets d’une section TOML survivent', () => {
    // Ils nomment la chose (`[tui.keys]` est le nom de la section) : les
    // retirer appauvrirait la description au lieu de la nettoyer.
    expect(demarkup('Le keymap `[tui.keys]`')).toBe('Le keymap [tui.keys]');
  });
});

describe('capitalisation des titres', () => {
  test('un mot ordinaire prend la majuscule', () => {
    expect(capitalise('worktrees et branches')).toBe('Worktrees et branches');
  });

  test('un identifiant technique reste en minuscule', () => {
    // `Gwm` serait une faute : c'est le nom du binaire.
    expect(capitalise('gwm create')).toBe('gwm create');
    expect(capitalise('git worktree')).toBe('git worktree');
    expect(capitalise('herdr (plugin)')).toBe('herdr (plugin)');
  });

  test('un identifiant n’est reconnu que comme mot entier', () => {
    // `gwmx` n'est pas `gwm` : sans la borne, le préfixe suffirait à désactiver
    // la capitalisation.
    expect(capitalise('gwmx quelque chose')).toBe('Gwmx quelque chose');
  });

  test('un identifiant snake_case reste en minuscule sans figurer dans la liste', () => {
    // Le cas qui a été publié : `file_exists` sortait en `File_exists` sur
    // /configuration/when-predicates/, EN et FR. La règle est structurelle et
    // pas lexicale, donc elle doit tenir sur un identifiant que personne n'a
    // pensé à lister — d'où le second cas, absent de LOWERCASE_IDENTS comme du
    // reste de la doc.
    expect(capitalise('file_exists / cmd_exists / env_set')).toBe(
      'file_exists / cmd_exists / env_set',
    );
    expect(capitalise('no_symlink invariants')).toBe('no_symlink invariants');
  });

  test('un titre qui n’ouvre pas sur une lettre minuscule est laissé tel quel', () => {
    expect(capitalise('`--json` en sortie')).toBe('`--json` en sortie');
    expect(capitalise('Déjà capitalisé')).toBe('Déjà capitalisé');
  });

  test('seuls les titres de niveau 2 et plus sont touchés', () => {
    // Le `# Titre` d'ouverture est retiré par `convert`, il n'a pas à être
    // capitalisé ici.
    const body = '# titre h1\n\n## un sous-titre\n\n### gwm create\n';
    const out = capitaliseHeadings(body);
    expect(out).toContain('# titre h1');
    expect(out).toContain('## Un sous-titre');
    expect(out).toContain('### gwm create');
  });
});

describe('convert', () => {
  const page = (fm, body) => `---\n${fm}\n---\n\n${body}`;

  test('le h1 d’ouverture est retiré, Starlight rend déjà le title', () => {
    const out = convert(page('title: TUI', '# TUI\n\nDu texte.\n'), {});
    expect(out).not.toContain('# TUI');
    expect(out).toContain('Du texte.');
  });

  test('l’ordre est injecté en frontmatter quand il est connu', () => {
    const out = convert(page('title: TUI', 'Corps.\n'), { order: 3 });
    expect(out).toContain('sidebar:\n  order: 3');
  });

  test('sans ordre, aucune clé sidebar n’est écrite', () => {
    const out = convert(page('title: TUI', 'Corps.\n'), {});
    expect(out).not.toContain('sidebar:');
  });

  test('l’ordre 0 est écrit, il n’est pas confondu avec une absence', () => {
    // Piège classique : `if (order)` traiterait 0 comme absent, et l'index de
    // section perdrait la place que `orderOf` lui donne exprès.
    const out = convert(page('title: TUI', 'Corps.\n'), { order: 0 });
    expect(out).toContain('order: 0');
  });

  test('le bloc navigation de Nuxt part en entier, enfants compris', () => {
    // Retirer la seule ligne `navigation:` laisserait ses enfants indentés
    // orphelins, et le YAML ne parserait plus.
    const fm =
      'title: TUI\nnavigation:\n  icon: i-lucide-home\n  title: Accueil\ndescription: Une page';
    const out = convert(page(fm, 'Corps.\n'), {});
    expect(out).not.toContain('navigation:');
    expect(out).not.toContain('i-lucide-home');
    expect(out).toContain('description: Une page');
  });

  test('une valeur de frontmatter contenant un deux-points est requotée', () => {
    // Nuxt l'acceptait nue ; le parser YAML d'Astro la lirait comme un mapping.
    const out = convert(page('description: gwm doctor: ce qu’il vérifie', 'Corps.\n'), {});
    expect(out).toContain('description: "gwm doctor: ce qu’il vérifie"');
  });

  test('les backticks quittent le frontmatter mais pas le corps', () => {
    // Le corps, lui, est rendu en markdown : y retirer les backticks
    // transformerait un nom de commande en prose.
    const out = convert(page('description: voir `gwm list`', 'Lancer `gwm list`.\n'), {});
    expect(out).toContain('description: Voir gwm list');
    expect(out).toContain('Lancer `gwm list`.');
  });

  test('un deux-points libéré par le retrait des backticks fait requoter la valeur', () => {
    // LE cas discriminant du nouvel ordre normalisation → requotage : retirer
    // les backticks peut faire apparaître un « : » suivi d'un espace, et une
    // valeur nue qui en porte un n'est plus du YAML. Juger le quoting sur la
    // valeur d'origine (l'ordre inverse) publie une page que le build refuse
    // ensuite de parser.
    const out = convert(page('description: voir `gwm doctor: 9 checks` en CI', 'Corps.\n'), {});
    expect(out).toContain('description: "Voir gwm doctor: 9 checks en CI"');
  });

  test('un deux-points isolé garde ses guillemets et ne requote pas', () => {
    // Le pendant du cas précédent, et la raison pour laquelle celui-ci ne
    // suffit pas à couvrir la règle : la description de
    // /tui/keymap-and-palette/ écrit la palette `` `:` ``, un span d'un seul
    // caractère. Les guillemets qui remplacent ses backticks rendent le
    // requotage inutile — le « : » n'est jamais suivi d'un espace.
    const out = convert(page('description: la palette `:` et ses actions', 'Corps.\n'), {});
    expect(out).toContain('description: La palette “:” et ses actions');
  });

  test('un frontmatter absent est une erreur, pas un silence', () => {
    expect(() => convert('Pas de frontmatter du tout.\n', {})).toThrow('frontmatter absent');
  });

  test('les liens internes d’une page française sont préfixés', () => {
    const out = convert(page('title: TUI', 'Voir [le CLI](/cli/reference).\n'), { isFr: true });
    expect(out).toContain('](/fr/cli/reference)');
  });

  test('un lien déjà préfixé fr n’est pas préfixé deux fois', () => {
    const out = convert(page('title: TUI', 'Voir [le CLI](/fr/cli/reference).\n'), { isFr: true });
    expect(out).toContain('](/fr/cli/reference)');
    expect(out).not.toContain('/fr/fr/');
  });

  test('un lien externe n’est jamais réécrit', () => {
    const src = 'Voir [le dépôt](https://github.com/kbrdn1/gwm-cli).\n';
    const out = convert(page('title: TUI', src), { isFr: true });
    expect(out).toContain('](https://github.com/kbrdn1/gwm-cli)');
  });

  test('une page anglaise ne reçoit aucun préfixe', () => {
    const out = convert(page('title: TUI', 'Voir [le CLI](/cli/reference).\n'), { isFr: false });
    expect(out).toContain('](/cli/reference)');
    expect(out).not.toContain('/fr/');
  });
});

describe('descriptionVersion', () => {
  test('le résumé se lit dans le paragraphe d’ouverture', () => {
    const body =
      '**Security release.** A branch name could inject a command.\n\n### Fixed\n\n- x\n';
    expect(descriptionVersion('1.6.0', '2026-08-03', body)).toBe(
      'gwm 1.6.0, released 2026-08-03. Security release. A branch name could inject a command.',
    );
  });

  test('un gras d’ouverture n’est pas pris pour une puce', () => {
    // La régression exacte du premier jet : écarter les blocs qui commencent
    // par `*` écartait aussi `**gras**`, qui ouvre le résumé de la moitié des
    // fichiers. Le résumé tombait alors sur un paragraphe du milieu, hors
    // contexte (« The SSH one is worth spelling out, because… »).
    const body = '**Le vrai résumé.**\n\n### Added\n\n- une entrée\n\nUn paragraphe du milieu.\n';
    expect(descriptionVersion('1.1.0', '', body)).toContain('Le vrai résumé.');
    expect(descriptionVersion('1.1.0', '', body)).not.toContain('milieu');
  });

  test('sans paragraphe d’ouverture, le titre de la première entrée fait office', () => {
    // Quatre versions sur vingt-quatre attaquent directement sur `### Added`.
    const body = '### Added\n\n- **Inline review comments** ([#500](https://x/500)).\n  Détail.\n';
    expect(descriptionVersion('1.7.0', '2026-08-12', body)).toBe(
      'gwm 1.7.0, released 2026-08-12. Inline review comments.',
    );
  });

  test('la référence d’issue entre parenthèses ne laisse pas de numéro orphelin', () => {
    const body = 'Un résumé ([#550](https://x/550)) et sa suite.\n';
    const out = descriptionVersion('1.8.0', '', body);
    expect(out).not.toContain('550');
    expect(out).not.toContain('https');
  });

  test('la coupe tombe sur une frontière de phrase quand il en reste une', () => {
    const body = `Une première phrase assez longue pour passer le seuil. ${'x'.repeat(300)}\n`;
    const out = descriptionVersion('1.0.0', '', body, 80);
    expect(out).toBe('gwm 1.0.0. Une première phrase assez longue pour passer le seuil.');
    expect(out.length).toBeLessThanOrEqual(80);
  });

  test('une coupe au mot juste après un point n’écrit pas « courte.… »', () => {
    // Une phrase courte suivie d'un long paragraphe : trop tôt pour que la
    // frontière de phrase passe le seuil, donc c'est la coupe au mot qui
    // s'applique — et elle tombe pile après le point.
    const body = `Courte. ${'x'.repeat(300)}\n`;
    const out = descriptionVersion('1.0.0', '', body, 80);
    expect(out).toBe('gwm 1.0.0. Courte.');
  });

  test('une coupe en plein mot est signalée par des points de suspension', () => {
    const body = `un résumé sans ponctuation ${'mot '.repeat(80)}\n`;
    const out = descriptionVersion('1.0.0', '', body, 60);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(60);
  });

  test('un résumé non ponctué reçoit son point, un résumé ponctué n’en reçoit pas deux', () => {
    expect(descriptionVersion('1.0.0', '', '### Added\n\n- **Sans point**\n')).toEndWith(
      'Sans point.',
    );
    expect(descriptionVersion('1.0.0', '', 'Avec point.\n')).toEndWith('Avec point.');
  });

  test('un corps sans rien d’exploitable rend l’en-tête seul', () => {
    // Le repli doit rester une phrase valide, pas un en-tête suivi d'un blanc.
    expect(descriptionVersion('1.0.0', '2026-06-26', '### Added\n\n- une entrée nue\n')).toBe(
      'gwm 1.0.0, released 2026-06-26.',
    );
  });
});

describe('versionFromCargoToml', () => {
  test('la version lue est celle du [package]', () => {
    // Le cas qui compte : un Cargo.toml réel porte un `version` par dépendance,
    // et le premier venu appartient à une crate tierce.
    const cargo = [
      '[package]',
      'name = "gwm-cli"',
      'version = "1.6.1"',
      'edition = "2021"',
      '',
      '[dependencies]',
      'serde = { version = "1.0.200" }',
      '',
      '[dependencies.clap]',
      'version = "4.5.0"',
    ].join('\n');
    expect(versionFromCargoToml(cargo)).toBe('1.6.1');
  });

  test('une dépendance déclarant sa version avant [package] ne l’emporte pas', () => {
    // C'est LE cas qui discrimine, et il faut le construire exprès : dans un
    // Cargo.toml réel `[package]` vient en tête, donc « premier `version` du
    // fichier » et « `version` du [package] » donnent la même réponse et un test
    // naïf passerait des deux façons. Ici la ligne `version` de la dépendance est
    // en début de ligne et arrive avant, donc lire le premier match rendrait
    // « 4.5.0 ».
    const cargo = [
      '[dependencies.clap]',
      'version = "4.5.0"',
      '',
      '[package]',
      'name = "gwm-cli"',
      'version = "2.0.0"',
    ].join('\n');
    expect(versionFromCargoToml(cargo)).toBe('2.0.0');
  });

  test('sans [package], le résultat est undefined et non une valeur devinée', () => {
    // L'appelant sort en erreur sur `undefined` : il ne doit surtout pas
    // recevoir la version d'une dépendance.
    expect(versionFromCargoToml('[dependencies]\nserde = "1.0.200"\n')).toBeUndefined();
  });

  test('un [package] sans version rend undefined', () => {
    expect(versionFromCargoToml('[package]\nname = "gwm-cli"\n')).toBeUndefined();
  });

  test('une pré-release est rendue telle quelle', () => {
    expect(versionFromCargoToml('[package]\nversion = "1.7.0-rc.1"\n')).toBe('1.7.0-rc.1');
  });
});
