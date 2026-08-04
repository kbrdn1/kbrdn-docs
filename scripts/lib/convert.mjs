// Noyau pur du portage de la doc gwm : typographie, capitalisation, mapping de
// chemin, conversion d'une page, lecture de la version amont.
//
// Extrait de `sync-gwm-docs.mjs` pour être testable. Le script y garde tout ce
// qui touche au disque et à l'ordonnancement ; ici, rien ne lit ni n'écrit de
// fichier, et aucune fonction ne dépend d'un chemin global : `targetFor` reçoit
// ses racines en paramètre plutôt que de les capturer.
//
// Ce qui vit ici est ce qui peut se tromper en silence. Le script est lancé par
// `sync-gwm.yml` sur un `repository_dispatch`, il commite ce qu'il produit et
// déclenche le déploiement : une régression de mapping se publie toute seule.

import { join } from 'node:path';

export const stripOrder = (name) => name.replace(/^\d+\./, '');

export const orderOf = (name) => {
  // L'index d'une section est sa page d'accueil : sans ordre explicite il part
  // en fin de groupe, après les pages numérotées, et se lit comme un doublon du
  // libellé de groupe échoué en bas de liste.
  if (name === 'index.md') return 0;
  const m = name.match(/^(\d+)\./);
  return m ? Number(m[1]) : undefined;
};

// ── Typographie ────────────────────────────────────────────────────────────
// Pas de tiret cadratin dans les textes publiés. Le remplacement est un tiret
// court entouré d'espaces : il garde la valeur d'incise, ne déplace jamais le
// sens (contrairement à une virgule ou un deux-points, qui demanderaient de
// juger chaque phrase), et se relit sans accroc.
export const dedash = (s) => s.replace(/\s*—\s*/g, ' - ').replace(/—/g, '-');

// Idem sur le corps, mais le code est intouchable : un cadratin dans un bloc
// ``` ou entre backticks fait partie d'un exemple (sortie de commande, sigle
// d'une TUI) et le réécrire casserait l'exemple.
export function dedashProse(body) {
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
      // et la prose qui suivait était mise de côté comme si elle était du code,
      // son cadratin survivait (vu sur changelog/1.0.0.md).
      .replace(/`[^`]*?`/g, hold)
      .replace(/\s*—\s*/g, ' - ')
      .replace(/—/g, '-')
      .replace(/\uE000(\d+)\uE000/g, (_m, i) => held[Number(i)])
  );
}

// Noms qui restent en minuscule en tête de titre : ce sont des identifiants
// (binaires, commandes, bibliothèques), pas des mots. `Gwm` serait une faute.
export const LOWERCASE_IDENTS = new Set([
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
// d'option) : dans ces cas-là il n'y a rien à capitaliser.
export function capitalise(text) {
  const m = text.match(/^([a-z])([\w-]*)/);
  if (!m) return text;
  const first = (m[1] + m[2]).toLowerCase();
  if (LOWERCASE_IDENTS.has(first)) return text;
  return m[1].toUpperCase() + text.slice(1);
}

export const capitaliseHeadings = (body) =>
  body.replace(/^(#{2,6} )(.+)$/gm, (_m, hashes, text) => hashes + capitalise(text));

export function convert(raw, { order, isFr }) {
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

/**
 * Où atterrit une page source, et avec quel ordre de sidebar.
 *
 * `src` et `docs` sont passés plutôt que capturés : c'est ce qui rend la
 * fonction testable sans toucher au disque ni au dépôt amont.
 */
export function targetFor(abs, { src, docs }) {
  const parts = abs.slice(src.length + 1).split('/');
  const isFr = parts[0] === 'fr';
  const segs = (isFr ? parts.slice(1) : parts).map(stripOrder);
  const file = segs.pop();
  return {
    isFr,
    order: orderOf(parts[parts.length - 1]),
    out: join(docs, ...(isFr ? ['fr'] : []), ...segs, file),
  };
}

/**
 * Version publiée, lue dans le `[package]` du Cargo.toml amont.
 *
 * Scopé à `[package]` et pas au premier `version = "…"` venu : un Cargo.toml
 * réel en porte un par dépendance, et le premier appartiendrait à une crate
 * tierce. Rend `undefined` quand la section est absente ou muette, au lieu de
 * deviner.
 */
export function versionFromCargoToml(cargo) {
  const paquet = cargo.split(/^\[/m).find((s) => s.startsWith('package]'));
  return paquet?.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
}
