// Le pied de carte affiche une URL : si elle ne tombe pas sur la canonique de
// la page, la carte annonce une adresse qui n'existe pas — et rien n'échoue au
// build pour le signaler. Les cas ci-dessous sont relevés des canoniques
// réellement émises dans `dist/` (`bun run build`, 145 pages).
//
// En `.mjs` comme les tests de `scripts/lib`, et pas en `.ts` : `astro check`
// couvre tout `sites/gwm/**` et ne connaît pas `bun:test`, faute de
// `@types/bun`. Un fichier JS n'est pas type-checké, donc le gate reste vert
// sans tirer une dépendance de types pour quatre assertions.
import { expect, test } from 'bun:test';
import { carteSlug, cheminPage } from './og-page.ts';

test('cheminPage : la landing anglaise vaut la racine', () => {
  expect(cheminPage('index')).toBe('/');
  // Forme prise par la même page selon la version du loader.
  expect(cheminPage('')).toBe('/');
});

test('cheminPage : une page ordinaire garde ses segments et la barre finale', () => {
  expect(cheminPage('tui/agent-sessions')).toBe('/tui/agent-sessions/');
  expect(cheminPage('fr/configuration/gwm-toml')).toBe('/fr/configuration/gwm-toml/');
});

test('cheminPage : les landings de section ne sont pas des « index »', () => {
  expect(cheminPage('fr')).toBe('/fr/');
  expect(cheminPage('changelog')).toBe('/changelog/');
  expect(cheminPage('cli/reference')).toBe('/cli/reference/');
});

test('carteSlug : la landing sort sur « index » quelle que soit la forme de son id', () => {
  expect(carteSlug('')).toBe('index');
  expect(carteSlug('index')).toBe('index');
});
