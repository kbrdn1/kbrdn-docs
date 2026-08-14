// Garde sur les métadonnées publiées, porté de `gwm-cli` (#579/#580, fichier
// `tests/docs_frontmatter_tests.rs`) avec la même métrique et les mêmes seuils.
//
// Le garde amont ne voit que `gwm-cli/docs/`. Il est aveugle sur ce que
// `sync-gwm-docs.mjs` écrit lui-même — les seize pages de référence CLI
// (`splitCliReference`) et les vingt-quatre pages de changelog — alors que ces
// quarante pages sont publiées et indexées comme les autres. Celui-ci mesure
// le **résultat publié**, donc il couvre les deux origines à la fois, et il
// voit en plus le cas que l'amont ne peut pas voir : le site en retard sur
// l'amont, qui sert une copie que le garde amont a déjà fait corriger.
//
// Ce qui est délibérément absent : la casse des titres. Séparer
// `Getting started` de `GitHub issue / PR linking` ou `Open dispatch (o and O)`
// demande une liste de noms propres tapée à la main, un recensement qui se
// périme dès qu'une page est nommée d'après quelque chose qui n'y est pas.
// L'amont a tranché pareil, la question n'est pas rouverte ici.

import { describe, expect, test } from 'bun:test';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DOCS = join(import.meta.dirname, '../../sites/gwm/src/content/docs');

/// Au-delà, aucune variante de la phrase ne survit à la coupe d'un résultat de
/// recherche. Seuil repris de l'amont, où il est décrit comme un plafond
/// d'outrance plutôt qu'une règle de style.
const MAX_DESCRIPTION_CHARS = 250;

/// Recouvrement de vocabulaire au-delà duquel deux descriptions se lisent comme
/// la même phrase. Seuil repris de l'amont, qui l'a posé dans un écart mesuré :
/// les paires fautives y sortaient à 0.667 et 0.632, la suivante à 0.312.
const MAX_DESCRIPTION_OVERLAP = 0.5;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (/\.mdx?$/.test(e.name)) out.push(p);
  }
  return out;
}

/// Les mots d'une description : minuscules, backticks et ponctuation retirés.
const words = (description) =>
  new Set(
    description
      .toLowerCase()
      .replace(/`/g, '')
      .split(/[^\p{L}\p{N}]+/u)
      .filter(Boolean),
  );

/// Indice de Jaccard de deux ensembles de mots : les mots partagés sur les mots
/// employés tout court.
function overlap(left, right) {
  const union = new Set([...left, ...right]);
  if (!union.size) return 0;
  let shared = 0;
  for (const w of left) if (right.has(w)) shared++;
  return shared / union.size;
}

const pages = [];
for (const abs of (await walk(DOCS)).sort()) {
  const fm = (await readFile(abs, 'utf8')).match(/^---\n([\s\S]*?)\n---/);
  if (!fm) continue;
  const line = fm[1].match(/^description: (.*)$/m);
  if (!line) continue;
  const rel = abs.slice(DOCS.length + 1);
  pages.push({
    rel,
    // Le frontmatter est lu à la ligne plutôt que parsé : les guillemets qui
    // entourent une valeur ne font pas partie de la description publiée, et
    // les échappements que le script y a mis doivent être défaits — sinon ce
    // garde mesure une phrase que personne ne lit, et se fait avoir par son
    // propre parsing. La contre-oblique passe en dernier, sans quoi elle
    // défait ce que la règle précédente vient d'écrire.
    description: line[1]
      .replace(/^['"]|['"]$/g, '')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\'),
    // Les deux locales sont deux sites crawlés séparément : une description
    // partagée entre elles est une traduction, pas un doublon.
    locale: rel.startsWith('fr/') ? 'fr' : 'en',
    // Ancré sur le chemin sans locale : il n'existe pas de `fr/changelog/`
    // aujourd'hui (Starlight sert la version anglaise sous /fr/), mais tester
    // `^changelog/` rendrait l'exemption anglaise par accident, et le jour où
    // une traduction arriverait elle tomberait rouge sur une question déjà
    // tranchée.
    isChangelog: /^changelog\//.test(rel.replace(/^fr\//, '')),
  });
}

describe('métadonnées publiées', () => {
  test('le corpus est bien celui qu’on croit', () => {
    // Un `walk` qui ne trouve rien rendrait les deux tests suivants verts sans
    // rien vérifier : c'est le mode de défaillance silencieuse d'un garde qui
    // lit le disque.
    expect(pages.length).toBeGreaterThan(100);
    expect(pages.some((p) => p.isChangelog)).toBe(true);
    expect(pages.some((p) => p.rel.startsWith('cli/reference/'))).toBe(true);
  });

  test('aucune description ne dépasse la coupe d’un résultat de recherche', () => {
    const longues = pages
      .filter((p) => [...p.description].length > MAX_DESCRIPTION_CHARS)
      .map((p) => `${p.rel} (${[...p.description].length} car.)`);
    expect(longues).toEqual([]);
  });

  test('deux pages d’une même locale ne se décrivent pas avec la même phrase', () => {
    // Les changelogs sont hors du lot, et c'est un choix, pas un oubli : leur
    // description reprend le résumé que l'amont écrit en tête de version, et
    // trois de ces résumés sont littéralement la même phrase de promotion de
    // RC (« Stable promotion of the full X release train »). Les rendre
    // distincts demanderait d'inventer un texte que le changelog ne dit pas,
    // ce qui est un défaut plus grave que la ressemblance. Ils restent soumis
    // au garde de longueur.
    const candidates = pages.filter((p) => !p.isChangelog);
    const fautives = [];
    for (let i = 0; i < candidates.length; i++) {
      for (let j = i + 1; j < candidates.length; j++) {
        const [a, b] = [candidates[i], candidates[j]];
        if (a.locale !== b.locale) continue;
        const score = overlap(words(a.description), words(b.description));
        if (score > MAX_DESCRIPTION_OVERLAP) {
          fautives.push(`${a.rel} <-> ${b.rel} (${score.toFixed(3)})`);
        }
      }
    }
    expect(fautives).toEqual([]);
  });
});
