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
