// `bun test sites/gwm/src/lib` — pas branché sur les gates du repo, qui n'a pas
// de runner déclaré. Ce qu'on couvre ici est la seule partie du module qui peut
// se tromper en silence : une URL mal résolue ne fait pas échouer le build, elle
// sort juste une entrée de sitemap sans `lastmod`.

import { expect, test } from 'bun:test';
import { resolveSource } from './sitemap-lastmod.mjs';

/** Contenu factice : un fichier EN traduit, un autre pas, deux formes de page. */
const FILES = new Set([
  'index.mdx',
  'fr/index.mdx',
  'cli/index.md',
  'fr/cli/index.md',
  'configuration/guards.md',
  'changelog/0-1-0.md',
]);

const resolve = (pathname) => resolveSource(pathname, (path) => FILES.has(path));

test('la racine de chaque locale tombe sur son index', () => {
  expect(resolve('/')).toBe('index.mdx');
  expect(resolve('/fr/')).toBe('fr/index.mdx');
});

test('une page se résout en fichier plat comme en index de dossier', () => {
  expect(resolve('/configuration/guards/')).toBe('configuration/guards.md');
  expect(resolve('/cli/')).toBe('cli/index.md');
});

test('une page française traduite garde sa propre source', () => {
  expect(resolve('/fr/cli/')).toBe('fr/cli/index.md');
});

test('une page française non traduite retombe sur la source anglaise', () => {
  // Le cas de repli de Starlight : /fr/changelog/0-1-0/ est servi, rendu depuis
  // l'anglais, et c'est donc la date du fichier anglais qui la décrit.
  expect(resolve('/fr/changelog/0-1-0/')).toBe('changelog/0-1-0.md');
});

test('une page sans source connue ne résout rien', () => {
  expect(resolve('/nexiste/pas/')).toBeUndefined();
});
