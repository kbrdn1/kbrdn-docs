// Synchronise la doc in-repo de gwm-cli (`docs/`, format Nuxt Content) vers le
// site Starlight `sites/gwm`.
//
//   bun run sync:gwm                     # depuis ~/Projects/Perso/gwm-cli
//   GWM_REPO=/chemin/vers/gwm-cli bun run sync:gwm
//
// La doc reste maintenue dans gwm-cli — c'est elle qui voyage avec le code et
// les releases. Ce script est le pont : il rejoue la conversion à l'identique,
// donc il est rejouable après chaque évolution de la doc amont. Les pages
// générées sous src/content/docs sont écrasées ; tout ce qui est écrit à la
// main pour le site (les deux `index.mdx` de landing) est préservé.
//
// Différences de format traitées, une par écart réel entre les deux systèmes :
//   - `1.getting-started/2.first-worktree.md` → `getting-started/first-worktree.md`
//     + `sidebar.order` : Nuxt encode l'ordre dans le nom de fichier, Starlight
//     le lit dans le frontmatter.
//   - le `# Titre` d'ouverture est retiré : Starlight rend déjà `title` en <h1>.
//   - `navigation:` (clé Nuxt Content) retiré — bloc entier, pas juste sa ligne,
//     sinon ses enfants indentés restent orphelins et cassent le YAML.
//   - une valeur de frontmatter contenant « : » est requotée : Nuxt l'acceptait
//     nue, le parser YAML d'Astro la lit comme un mapping imbriqué.
//   - captures : `docs/<section>/_assets/x.png` → `src/assets/captures/x.png`,
//     avec réécriture des deux formes de lien (`./_assets/…` côté anglais,
//     `../../<section>/_assets/…` côté français).
//   - liens internes : préfixés `/fr` dans les pages françaises.
import { readdir, readFile, writeFile, mkdir, copyFile, rm } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { homedir } from 'node:os';

const REPO = process.env.GWM_REPO || join(homedir(), 'Projects/Perso/gwm-cli');
const SRC = join(REPO, 'docs');
const SITE = join(import.meta.dirname, '../sites/gwm/src');
const DOCS = join(SITE, 'content/docs');
const CAPS = join(SITE, 'assets/captures');

// Sections portées telles quelles ; elles doivent rester alignées avec les
// groupes déclarés dans sites/gwm/astro.config.mjs.
const SECTIONS = ['getting-started', 'tui', 'cli', 'configuration', 'integrations', 'development'];

const stripOrder = (name) => name.replace(/^\d+\./, '');
const orderOf = (name) => {
  // L'index d'une section est sa page d'accueil : sans ordre explicite il part
  // en fin de groupe, après les pages numérotées, et se lit comme un doublon du
  // libellé de groupe échoué en bas de liste.
  if (name === 'index.md') return 0;
  const m = name.match(/^(\d+)\./);
  return m ? Number(m[1]) : undefined;
};

async function walk(dir, { assets = false } = {}) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '_assets') {
        if (assets) for (const a of await readdir(p)) out.push(join(p, a));
        continue;
      }
      // `schema/` est une annexe technique (JSON Schemas + un README sans
      // frontmatter), pas une section de doc.
      if (e.name.startsWith('.') || e.name === 'schema') continue;
      out.push(...(await walk(p, { assets })));
    } else if (!assets && e.name.endsWith('.md') && e.name !== 'README.md') {
      out.push(p);
    }
  }
  return out;
}

// ── Typographie ────────────────────────────────────────────────────────────
// Pas de tiret cadratin dans les textes publiés. Le remplacement est un tiret
// court entouré d'espaces : il garde la valeur d'incise, ne déplace jamais le
// sens (contrairement à une virgule ou un deux-points, qui demanderaient de
// juger chaque phrase), et se relit sans accroc.
const dedash = (s) => s.replace(/\s*—\s*/g, ' - ').replace(/—/g, '-');

// Idem sur le corps, mais le code est intouchable : un cadratin dans un bloc
// ``` ou entre backticks fait partie d'un exemple (sortie de commande, sigle
// d'une TUI) et le réécrire casserait l'exemple.
function dedashProse(body) {
  // Les jetons sont encadrés d'un point de la zone à usage privé : aucun
  // markdown n'en contient, donc un placeholder ne peut pas entrer en collision
  // avec du texte réel. Un caractère nul ferait pareil, mais le linter refuse
  // les caractères de contrôle dans une regex.
  const held = [];
  const hold = (m) => `\uE000${held.push(m) - 1}\uE000`;
  return (
    body
      .replace(/```[\s\S]*?```/g, hold)
      // Non-gourmand ET autorisé à franchir un saut de ligne : un span de code
      // replié sur deux lignes désynchronisait sinon l'appariement des backticks,
      // et la prose qui suivait était mise de côté comme si elle était du code —
      // son cadratin survivait (vu sur changelog/1.0.0.md).
      .replace(/`[^`]*?`/g, hold)
      .replace(/\s*—\s*/g, ' - ')
      .replace(/—/g, '-')
      .replace(/\uE000(\d+)\uE000/g, (_m, i) => held[Number(i)])
  );
}

// Noms qui restent en minuscule en tête de titre : ce sont des identifiants
// (binaires, commandes, bibliothèques), pas des mots. `Gwm` serait une faute.
const LOWERCASE_IDENTS = new Set([
  'gwm',
  'gcd',
  'gh',
  'glab',
  'git',
  'cargo',
  'brew',
  'npm',
  'bun',
  'nix',
  'zsh',
  'bash',
  'fish',
  'elvish',
  'tmux',
  'zellij',
  'herdr',
  'lazygit',
  'libgit2',
  'ratatui',
  'crates',
  'rustup',
  'clippy',
  'json',
  'toml',
  'yaml',
  'macos',
  'ci',
  'cli',
  'tui',
  'pr',
  'tofu',
]);

// Capitalise le premier mot, sauf quand ce mot est un identifiant technique ou
// que le titre ouvre sur autre chose qu'une lettre (code inline, crochet, tiret
// d'option) — dans ces cas-là il n'y a rien à capitaliser.
function capitalise(text) {
  const m = text.match(/^([a-z])([\w-]*)/);
  if (!m) return text;
  const first = (m[1] + m[2]).toLowerCase();
  if (LOWERCASE_IDENTS.has(first)) return text;
  return m[1].toUpperCase() + text.slice(1);
}

const capitaliseHeadings = (body) =>
  body.replace(/^(#{2,6} )(.+)$/gm, (_m, hashes, text) => hashes + capitalise(text));

function convert(raw, { order, isFr }) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('frontmatter absent');
  let [, fm, body] = m;

  const kept = [];
  let dropping = false;
  for (const l of fm.split('\n')) {
    if (/^navigation:/.test(l)) {
      dropping = true;
      continue;
    }
    if (dropping && /^\s+\S/.test(l)) continue;
    dropping = false;
    kept.push(l);
  }
  fm = kept
    .map((l) => {
      const q = l.match(/^([a-z][\w-]*): (?!["'])(.*: .*)$/);
      let out = q ? `${q[1]}: "${q[2].replace(/["\\]/g, '\\$&')}"` : l;
      const t = out.match(/^(title|description): (.*)$/);
      if (t) out = `${t[1]}: ${capitalise(dedash(t[2]))}`;
      return out;
    })
    .join('\n');
  if (order !== undefined) fm += `\nsidebar:\n  order: ${order}`;

  body = body.replace(/^\s*#\s+.+\n+/, '');
  body = dedashProse(body);
  body = capitaliseHeadings(body);
  if (isFr) body = body.replace(/\]\((\/(?!fr\/)[a-z0-9][a-z0-9/-]*)\)/g, '](/fr$1)');
  return `---\n${fm}\n---\n\n${body.trimStart()}`;
}

function targetFor(abs) {
  const parts = abs.slice(SRC.length + 1).split('/');
  const isFr = parts[0] === 'fr';
  const segs = (isFr ? parts.slice(1) : parts).map(stripOrder);
  const file = segs.pop();
  return {
    isFr,
    order: orderOf(parts[parts.length - 1]),
    out: join(DOCS, ...(isFr ? ['fr'] : []), ...segs, file),
  };
}

// ── Découpe de la référence CLI ────────────────────────────────────────────
// Regroupement éditorial des sous-commandes. La clé est le premier mot après
// `gwm ` dans le titre de section ; l'ordre des groupes est celui du tableau.
// Une sous-commande apparue en amont sans être listée ici tombe dans « Other »
// et le script le signale — la table doit alors être mise à jour.
const CLI_GROUPS = [
  {
    slug: 'setup',
    title: 'Setup and configuration',
    fr: 'Installation et configuration',
    cmds: ['init', 'config', 'types', 'commit-prefix', 'hooks'],
  },
  {
    slug: 'worktrees',
    title: 'Worktree lifecycle',
    fr: 'Cycle de vie des worktrees',
    cmds: ['create', 'new', 'bootstrap', 'sync', 'remove', 'prune', 'switch', 'path', 'cd', 'list'],
  },
  {
    slug: 'github',
    title: 'Issues, pull requests and reviews',
    fr: 'Issues, pull requests et reviews',
    cmds: ['link', 'unlink', 'open', 'status', 'labels', 'milestones', 'pr', 'review'],
  },
  {
    slug: 'fleet',
    title: 'Fleet chores and workspace',
    fr: 'Corvées de flotte et workspace',
    // « Workspace mode » côté anglais, « Mode workspace » côté français : la clé
    // est le premier mot du titre, il y en a donc deux pour la même section.
    cmds: ['exec', 'clean', 'Workspace', 'Mode'],
  },
  {
    slug: 'shell',
    title: 'Shell and multiplexers',
    fr: 'Shell et multiplexeurs',
    cmds: ['completions', 'shell-init', 'tmux', 'zellij'],
  },
  {
    slug: 'services',
    title: 'Diagnostics and services',
    fr: 'Diagnostic et services',
    cmds: ['doctor', 'daemon', 'statusline', 'agents'],
  },
  {
    slug: 'safety',
    title: 'History, undo and trust',
    fr: 'Historique, annulation et confiance',
    cmds: ['undo', 'history', 'trust'],
  },
  {
    slug: 'customisation',
    title: 'Customisation',
    fr: 'Personnalisation',
    cmds: ['aliases', 'theme', 'tui'],
  },
];

const unmappedCmds = new Set();

// Renvoie le nombre de pages écrites.
async function splitCliReference(text, out, isFr) {
  const [, fm, body] = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  // Le préambule précède la première sous-commande ; les sections suivent.
  const firstH2 = body.search(/^## /m);
  const preamble = firstH2 === -1 ? body : body.slice(0, firstH2);
  const sections = (firstH2 === -1 ? '' : body.slice(firstH2))
    .split(/^(?=## )/m)
    .filter((s) => s.trim());

  const buckets = new Map(CLI_GROUPS.map((g) => [g.slug, []]));
  const other = [];
  // `## \`gwm create <type>…\`` → « create ». Certaines sections ne sont pas des
  // sous-commandes (« Workspace mode », « Exit codes ») : leur premier mot sert
  // de clé, et « Exit codes » reste volontairement sur la page d'index.
  const indexOnly = [];
  for (const s of sections) {
    const head = s.slice(3, s.indexOf('\n'));
    const key = (head.match(/`gwm ([\w-]+)/) || head.match(/^\W*(\w+)/) || [])[1];
    if (/^#{2} (Exit codes|Codes de sortie)/i.test(s)) {
      indexOnly.push(s);
      continue;
    }
    const group = CLI_GROUPS.find((g) => g.cmds.includes(key));
    if (group) buckets.get(group.slug).push(s);
    else {
      other.push(s);
      if (key) unmappedCmds.add(key);
    }
  }

  const dir = out.replace(/\.md$/, '');
  await mkdir(dir, { recursive: true });

  const title = isFr ? 'Référence des sous-commandes' : 'Subcommand reference';
  const pages = CLI_GROUPS.filter((g) => buckets.get(g.slug).length).map((g, i) => ({
    slug: g.slug,
    title: isFr ? g.fr : g.title,
    order: i + 1,
    parts: buckets.get(g.slug),
  }));
  if (other.length) {
    pages.push({
      slug: 'other',
      title: isFr ? 'Autres commandes' : 'Other commands',
      order: pages.length + 1,
      parts: other,
    });
  }

  // Index : préambule, sommaire des groupes, puis ce qui n'appartient à aucune
  // sous-commande (les codes de sortie valent pour toutes).
  const toc = pages.map((p) => `- [${p.title}](./${p.slug}/)`).join('\n');
  const indexBody = [preamble.trim(), toc, ...indexOnly].filter(Boolean).join('\n\n');
  await writeFile(
    join(dir, 'index.md'),
    `---\n${fm.replace(/^sidebar:\n {2}order: \d+$/m, 'sidebar:\n  order: 1')}\n---\n\n${indexBody}\n`,
  );

  for (const p of pages) {
    await writeFile(
      join(dir, `${p.slug}.md`),
      `---\ntitle: ${p.title}\ndescription: ${title} - ${p.title}.\nsidebar:\n  order: ${p.order + 1}\n---\n\n${p.parts.join('\n').trim()}\n`,
    );
  }
  return pages.length + 1;
}

// 1. Captures, à plat — les noms sont uniques d'une section à l'autre.
await mkdir(CAPS, { recursive: true });
const captures = new Map();
for (const a of await walk(SRC, { assets: true })) {
  const name = a.slice(a.lastIndexOf('/') + 1);
  // Logo et visuels promo ne sont pas des captures de page : le logo est branché
  // dans astro.config, les copier ici ferait un doublon mort.
  if (/^(logo|logo-light|promo|promo-light)\./.test(name)) continue;
  if (captures.has(name)) throw new Error(`collision de nom de capture: ${name}`);
  captures.set(name, a);
}
for (const [name, from] of captures) await copyFile(from, join(CAPS, name));

// 2. Pages. On remet les sections à zéro pour qu'une page supprimée en amont
// disparaisse aussi du site.
for (const s of SECTIONS) {
  await rm(join(DOCS, s), { recursive: true, force: true });
  await rm(join(DOCS, 'fr', s), { recursive: true, force: true });
}

let ported = 0;
const unresolved = new Set();
const rewriteCaptures = (text, out) => {
  const rel = relative(dirname(out), CAPS);
  return text.replace(
    /\]\((?:\.\/_assets|(?:\.\.\/)+[\w.-]*\/?_assets)\/([^)]+)\)/g,
    (_m, name) => {
      if (!captures.has(name)) unresolved.add(name);
      return `](${rel}/${name})`;
    },
  );
};

for (const f of await walk(SRC)) {
  const { out, order, isFr } = targetFor(f);
  // Les landings du site sont écrites à la main (hero + cartes à la charte) ;
  // l'index de la doc in-repo est un sommaire, il ne les remplace pas.
  if (out.endsWith('/docs/index.md') || out.endsWith('/docs/fr/index.md')) continue;

  const text = rewriteCaptures(convert(await readFile(f, 'utf8'), { order, isFr }), out);

  // La référence CLI fait ~790 lignes et 40 sous-commandes : illisible d'un
  // bloc, et son sommaire écrase tous les autres. Elle part en sous-pages.
  if (/\/cli\/reference\.md$/.test(out)) {
    ported += await splitCliReference(text, out, isFr);
    continue;
  }

  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, text);
  ported++;
}

// 3. Changelog : une page par version, générée depuis gwm-cli/changelogs/.
// Ces fichiers ne sont traduits nulle part — la section reste en anglais, et le
// fallback de locale de Starlight sert la version anglaise côté /fr/.
const CHANGELOGS = join(REPO, 'changelogs');
const CHDIR = join(DOCS, 'changelog');
await rm(CHDIR, { recursive: true, force: true });
await mkdir(CHDIR, { recursive: true });

// Tri sémantique décroissant : 1.10.0 doit passer devant 1.9.0, ce que l'ordre
// lexicographique ferait à l'envers.
const versions = (await readdir(CHANGELOGS))
  .filter((f) => /^\d+\.\d+\.\d+\.md$/.test(f))
  .map((f) => f.replace(/\.md$/, ''))
  .sort((a, b) => {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    return pb[0] - pa[0] || pb[1] - pa[1] || pb[2] - pa[2];
  });

const rows = [];
for (const [i, v] of versions.entries()) {
  const raw = await readFile(join(CHANGELOGS, `${v}.md`), 'utf8');
  // Les fichiers ouvrent sur `# [1.6.0] - 2026-08-03` : la date part dans la
  // description, le titre de page devient la version seule.
  const head = raw.match(/^#\s*\[?([\d.]+)\]?\s*-\s*([\d-]+)/);
  const date = head ? head[2] : '';
  const body = dedashProse(raw.replace(/^#\s.*\n+/, ''));
  // Le point est retiré du nom de fichier : Astro le mange dans le slug et
  // `1.5.0.md` sortirait sur /changelog/150/, illisible.
  const slug = v.replace(/\./g, '-');
  await writeFile(
    join(CHDIR, `${slug}.md`),
    `---\ntitle: v${v}\ndescription: "gwm ${v}${date ? `, released ${date}` : ''}."\nsidebar:\n  order: ${i + 2}\n  label: v${v}\n---\n\n${body.trim()}\n`,
  );
  rows.push(`| [v${v}](./${slug}/) | ${date} |`);
}

await writeFile(
  join(CHDIR, 'index.md'),
  `---
title: Changelog
description: Every released version of gwm, newest first.
sidebar:
  order: 1
---

Release notes for every published version, newest first. They are generated
from the per-version files that ship in the repository, so what you read here
is what the GitHub release carries.

| Version | Date |
|:--------|:-----|
${rows.join('\n')}
`,
);

// 4. Version publiée, lue dans le Cargo.toml de gwm-cli.
//
// C'est la seule source qui dise la version *du binaire*. La déduire du plus
// grand fichier de `changelogs/` marche tant que les deux avancent ensemble, et
// ment dès qu'ils divergent : notes écrites avant le bump, changelog de
// pré-release déposé. Le sync ne tourne que sur `main`, donc ce qu'on lit ici
// est bien la version livrée.
const cargo = await readFile(join(REPO, 'Cargo.toml'), 'utf8');
// Scopé à [package] : un Cargo.toml porte un `version = "…"` par dépendance,
// et le premier venu serait celui d'une crate tierce.
const paquet = cargo.split(/^\[/m).find((s) => s.startsWith('package]'));
const versionPubliee = paquet?.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
if (!versionPubliee) {
  console.error('version introuvable dans le [package] du Cargo.toml amont');
  process.exit(1);
}
await mkdir(join(SITE, 'data'), { recursive: true });
// Écrit au format que prettier produirait : ce fichier est commité par le bot
// de synchro, et `ci.yml` fait `prettier --check .` sur chaque push.
await writeFile(
  join(SITE, 'data/gwm-release.json'),
  `${JSON.stringify({ version: versionPubliee }, null, 2)}\n`,
);

console.log(
  `captures: ${captures.size} · pages: ${ported} · changelog: ${versions.length} · version: ${versionPubliee}`,
);
if (unmappedCmds.size) {
  // Non bloquant : ces sous-commandes existent et sont publiées, mais dans un
  // groupe fourre-tout. Il faut les ranger dans CLI_GROUPS.
  console.warn(`sous-commandes hors table de groupes: ${[...unmappedCmds].join(', ')}`);
}
if (unresolved.size) {
  // Une capture référencée mais absente fait échouer le build Astro : mieux vaut
  // le dire ici, avec le nom, que de laisser tomber la pile d'Astro dessus.
  console.error(`captures introuvables: ${[...unresolved].join(', ')}`);
  process.exit(1);
}
