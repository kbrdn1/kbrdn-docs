// Les pages racine de la doc gwm (celles qui ne vivent pas dans un dossier de
// section) sont le seul cas que la sidebar Starlight ne ramasse pas toute
// seule : chaque groupe de section a son `autogenerate`, une page racine n'a
// rien. Elle se déclare à la main dans `astro.config.mjs`.
//
// L'oubli ne casse rien de visible : le sync écrit la page, Astro la publie à
// son URL, elle répond. Elle est simplement absente de la navigation, donc
// introuvable pour qui ne connaît pas déjà le lien. C'est arrivé pour
// `comparison` (gwm-cli#422), repéré en lisant la config plutôt que par un
// signal.
//
// Le test lit les deux fichiers en texte. Importer `astro.config.mjs` tirerait
// tout Astro dans `bun test` pour lire un tableau de chaînes.

import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '../..');
const DOCS = join(ROOT, 'sites/gwm/src/content/docs');
const CONFIG = join(ROOT, 'sites/gwm/astro.config.mjs');

/** Les pages `.md` posées à la racine du contenu, sans les dossiers de section. */
const rootPages = () =>
  readdirSync(DOCS, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => e.name.replace(/\.md$/, ''));

/** Les `slug: '…'` déclarés dans la sidebar. */
const declaredSlugs = () => [...readFileSync(CONFIG, 'utf8').matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]);

describe('pages racine et sidebar', () => {
  test('chaque page racine est déclarée dans la sidebar', () => {
    const declared = declaredSlugs();
    const missing = rootPages().filter((p) => !declared.includes(p));
    expect(missing).toEqual([]);
  });

  test('aucune entrée sidebar ne pointe une page racine absente', () => {
    // L'inverse compte autant : Starlight fait échouer le build sur un `slug`
    // qui ne résout vers rien, donc une entrée ajoutée avant que le sync ait
    // amené la page casse le déploiement au lieu de la publier.
    const pages = rootPages();
    const dangling = declaredSlugs().filter((s) => !s.includes('/') && !pages.includes(s));
    expect(dangling).toEqual([]);
  });

  test('la racine porte bien les pages attendues', () => {
    // Garde-fou du garde-fou : si le glob ci-dessus renvoyait une liste vide
    // (répertoire déplacé, extension changée), les deux tests passeraient à
    // vide en affirmant exactement rien.
    expect(rootPages().length).toBeGreaterThanOrEqual(2);
    expect(rootPages()).toContain('roadmap');
  });
});
