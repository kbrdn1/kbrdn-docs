// `lastmod` du sitemap, daté depuis git.
//
// Astro ne sait pas quand une page a changé : le seul `lastmod` qu'il propose
// est une date unique posée sur tout le site, ce qui revient à dire « tout a
// bougé » à chaque build. La vraie date est celle du dernier commit qui touche
// le fichier source de la page — sur une doc synchronisée depuis `gwm-cli`,
// c'est exactement sa date de publication ici.
//
// Deux pièges commandent la forme de ce module :
//
//   1. **Le clone superficiel.** Un `actions/checkout` par défaut ne récupère
//      qu'un commit : `git log` daterait alors toutes les pages du même jour,
//      celui du build. Un `lastmod` uniforme est pire que pas de `lastmod` —
//      il apprend au moteur que le nôtre ne veut rien dire. D'où la garde
//      `--is-shallow-repository`, qui rend le champ absent plutôt que faux.
//      C'est aussi pourquoi `deploy.yml` demande `fetch-depth: 0`.
//
//   2. **Les pages de repli.** Starlight sert une page `/fr/x/` même sans
//      traduction française : elle rend alors la source anglaise. Son `lastmod`
//      est donc celui du fichier EN, et la résolution doit retomber dessus.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONTENT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'content', 'docs');

/** Une ligne de `git log --format=%cI` — tout le reste est un chemin de fichier. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T/;

const EXTENSIONS = ['.md', '.mdx'];

function git(args) {
  return execFileSync('git', args, {
    cwd: CONTENT_DIR,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }).trim();
}

/**
 * Date du dernier commit touchant chaque fichier de contenu, en un seul
 * `git log` : l'historique sort du plus récent au plus ancien, donc la première
 * date rencontrée pour un fichier est la bonne.
 *
 * @returns {Map<string, string> | null} chemins relatifs à `content/docs` → date
 *   ISO, ou `null` si l'historique n'est pas exploitable.
 */
function readGitDates() {
  if (git(['rev-parse', '--is-shallow-repository']) === 'true') {
    console.warn('[sitemap] dépôt superficiel : lastmod omis (fetch-depth: 0 pour le rétablir).');
    return null;
  }

  // `--name-only` sort des chemins relatifs à la racine du dépôt, jamais au cwd.
  const repoRoot = git(['rev-parse', '--show-toplevel']);
  const log = git(['log', '--format=%cI', '--name-only', '--', '.']);
  const dates = new Map();
  let current;

  for (const line of log.split('\n')) {
    if (!line) continue;
    if (ISO_DATE.test(line)) {
      current = line;
      continue;
    }
    const path = relative(CONTENT_DIR, join(repoRoot, line));
    if (current && !dates.has(path)) dates.set(path, current);
  }

  return dates;
}

/**
 * Fichier source d'une URL rendue. Une page vit soit en `x/y.md(x)`, soit en
 * `x/y/index.md(x)` ; sous `/fr/`, elle peut ne pas exister et retomber sur la
 * source anglaise.
 *
 * @param {string} pathname chemin de l'URL, ex. `/fr/cli/reference/`
 * @param {(path: string) => boolean} [exists] existence d'un chemin relatif à
 *   `content/docs` — injectable pour tester la résolution sans toucher au disque
 * @returns {string | undefined} chemin relatif à `content/docs`
 */
export function resolveSource(pathname, exists = (path) => existsSync(join(CONTENT_DIR, path))) {
  const trimmed = pathname.replace(/^\/+|\/+$/g, '');
  const bases =
    trimmed === 'fr' || trimmed.startsWith('fr/')
      ? [trimmed, trimmed.slice(3)] // la page française, puis la source de repli
      : [trimmed];
  const candidates = [];

  for (const base of bases) {
    for (const extension of EXTENSIONS) {
      candidates.push(base ? `${base}${extension}` : `index${extension}`);
      if (base) candidates.push(join(base, `index${extension}`));
    }
  }

  return candidates.find((candidate) => exists(candidate));
}

/**
 * @returns {(pathname: string) => string | undefined} la date ISO du dernier
 *   commit touchant la page, ou `undefined` si elle n'est pas datable.
 */
export function createLastmodLookup() {
  let dates;
  try {
    dates = readGitDates();
  } catch (error) {
    console.warn(`[sitemap] lastmod indisponible : ${error.message}`);
    return () => undefined;
  }
  if (!dates) return () => undefined;

  return (pathname) => {
    const source = resolveSource(pathname);
    return source ? dates.get(source) : undefined;
  };
}
