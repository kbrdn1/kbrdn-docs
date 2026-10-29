// La ligne méta des landings est un `<p class="gwm-meta">` écrit à la main en
// MDX. Si son contenu commence sur la ligne suivante, MDX le traite en Markdown
// et l'enveloppe dans un second `<p>` : le HTML devient invalide, le navigateur
// ferme le premier `<p>` et les règles `p.gwm-meta` de `gwm.css` ne s'appliquent
// jamais. Le build ne le signale pas, d'où ce test sur les sources.
import { readFileSync } from 'node:fs';
import { expect, test } from 'bun:test';

const LANDINGS = [
  'src/content/docs/index.mdx',
  'src/content/docs/fr/index.mdx',
];

test('gwm-meta paragraphs keep their content on the opening-tag line', () => {
  const offenders = [];
  for (const file of LANDINGS) {
    const lines = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (/^\s*<p class="gwm-meta">\s*$/.test(line)) {
        offenders.push(`${file}:${i + 1}`);
      }
    });
  }
  expect(offenders).toEqual([]);
});
