// Le plugin tourne sur le vrai moteur (Sätteri, celui qu'Astro 7 utilise), pas
// sur un AST reconstruit à la main : ce qu'on veut prouver, c'est justement que
// la forme produite par le parseur est celle qu'on croit, et que le nœud qu'on
// fabrique est visible du plugin suivant — Starlight lit les asides dans une
// passe séparée de la nôtre.

import { expect, test } from 'bun:test';
import { markdownToHtml } from 'satteri';
import { gfmAlerts } from './mdast-gfm-alerts.mjs';

/**
 * Rejoue la chaîne réelle : notre plugin, puis un second qui observe l'arbre
 * matérialisé, comme le fait celui de Starlight. Renvoie les directives vues.
 */
async function directivesOf(markdown) {
  const seen = [];
  const spy = {
    name: 'spy',
    containerDirective(node, ctx) {
      seen.push({
        name: node.name,
        label: node.children[0]?.data?.directiveLabel ? ctx.textContent(node.children[0]) : null,
        body: node.children
          .filter((child) => !child.data?.directiveLabel)
          .map((child) => ctx.textContent(child)),
      });
    },
  };
  await markdownToHtml(markdown, { mdastPlugins: [gfmAlerts, spy], features: { directive: true } });
  return seen;
}

test('chaque marqueur GFM tombe sur sa variante Starlight', async () => {
  const source = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION']
    .map((type) => `> [!${type}]\n> corps\n`)
    .join('\n');

  // `important` et `caution` n'existent pas à l'identique chez Starlight : la
  // première se replie sur `note`, la seconde sur `danger` (la plus sévère).
  expect((await directivesOf(source)).map((d) => d.name)).toEqual([
    'note',
    'tip',
    'note',
    'caution',
    'danger',
  ]);
});

test('le corps sur la ligne qui suit le marqueur est conservé', async () => {
  const [alert] = await directivesOf('> [!TIP]\n> première ligne\n>\n> second paragraphe\n');

  expect(alert.label).toBeNull();
  expect(alert.body).toEqual(['première ligne', 'second paragraphe']);
});

test('un gras seul en tête devient le titre de l’aside', async () => {
  const [alert] = await directivesOf(
    '> [!WARNING]\n> **Une clé `forge` seule n’autorise rien**\n>\n> le corps.\n',
  );

  expect(alert.name).toBe('caution');
  expect(alert.label).toBe('Une clé forge seule n’autorise rien');
  expect(alert.body).toEqual(['le corps.']);
});

test('un gras qui ouvre une phrase reste dans le corps', async () => {
  // Sinon la moitié d'un paragraphe partirait en titre.
  const [alert] = await directivesOf('> [!NOTE]\n> **gras** puis la suite.\n');

  expect(alert.label).toBeNull();
  expect(alert.body).toEqual(['gras puis la suite.']);
});

test('ce qui n’est pas une alert n’est pas touché', async () => {
  const source = [
    '> une citation ordinaire',
    '',
    '> [!NOPE]\n> variante inconnue',
    '',
    '> [!TIP] titre sur la ligne du marqueur',
  ].join('\n');

  // Le dernier cas est la règle de GitHub : le marqueur est seul sur sa ligne,
  // sinon ce n'est pas une alert. On la suit pour que les deux rendus s'accordent.
  expect(await directivesOf(source)).toEqual([]);
});

test('le rendu final est un aside, pas un blockquote', async () => {
  // Le contrat de bout en bout : sans le plugin, `[!TIP]` sort en texte brut.
  const withPlugin = await markdownToHtml('> [!TIP]\n> corps\n', {
    mdastPlugins: [
      gfmAlerts,
      {
        name: 'aside-stub',
        containerDirective: (node) => ({
          type: 'paragraph',
          data: { hName: 'aside', hProperties: { class: `aside--${node.name}` } },
          children: [...node.children],
        }),
      },
    ],
    features: { directive: true },
  });
  const raw = await markdownToHtml('> [!TIP]\n> corps\n', {});

  expect(withPlugin.html).toContain('<aside class="aside--tip">');
  expect(raw.html).toContain('[!TIP]');
});
