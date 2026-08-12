// Chaque lien d'image d'une page générée doit résoudre vers un fichier qui
// existe. Astro fait échouer le build entier sur un `ImageNotFound`, donc un
// `../` de trop ou de trop peu n'est pas un lien mort cosmétique : c'est le
// déploiement du site qui ne part pas.
//
// Le script signalait déjà les captures absentes de son propre index
// (`captures introuvables`), mais pas les chemins relatifs faux : le fichier
// existait, il était juste désigné depuis la mauvaise profondeur. C'est ce qui
// est arrivé aux pages `cli/reference/*`, écrites un cran plus bas que le
// `reference.md` dont leurs liens étaient calculés (gwm-cli#524, qui a mis les
// premières images dans la référence CLI).

import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const ROOT = join(import.meta.dirname, '../..');
const DOCS = join(ROOT, 'sites/gwm/src/content/docs');

/** Toutes les pages Markdown générées, à toute profondeur. */
function pages(dir = DOCS, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) pages(p, out);
    else if (e.name.endsWith('.md') || e.name.endsWith('.mdx')) out.push(p);
  }
  return out;
}

/** Les cibles `![alt](chemin)` relatives, hors URLs absolues. */
const localImages = (file) =>
  [...readFileSync(file, 'utf8').matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)]
    .map((m) => m[1].trim())
    .filter((t) => !/^(https?:|data:|\/)/.test(t));

describe('liens de captures', () => {
  test('chaque image référencée résout vers un fichier existant', () => {
    const broken = [];
    for (const page of pages()) {
      for (const target of localImages(page)) {
        const abs = resolve(dirname(page), target.split('#')[0]);
        if (!existsSync(abs)) broken.push(`${page.slice(DOCS.length + 1)} → ${target}`);
      }
    }
    expect(broken).toEqual([]);
  });

  test('les pages profondes sont bien couvertes par le test ci-dessus', () => {
    // Garde-fou du garde-fou : le bug ne concernait que les pages d'une
    // profondeur inhabituelle. Si le walk cessait de les atteindre, ou si plus
    // aucune image ne vivait là, le test précédent passerait en n'affirmant
    // rien du cas qui a cassé la production.
    const deep = pages().filter((p) => p.includes('/cli/reference/'));
    expect(deep.length).toBeGreaterThan(0);
    expect(deep.some((p) => localImages(p).length > 0)).toBe(true);
  });

  test('le corpus de pages est non vide', () => {
    expect(pages().length).toBeGreaterThan(50);
    expect(statSync(DOCS).isDirectory()).toBe(true);
  });
});
