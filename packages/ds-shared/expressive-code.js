// @kbrdn/ds-shared — coloration syntaxique « Claude Code » partagée.
// Constante de design (indépendante de l'accent produit) : deux thèmes
// Expressive Code (dark + light) mappant la palette du DESIGN.md sur les scopes
// TextMate courants, plus des styleOverrides pour des coins nets intégrés au thème.
// Usage dans astro.config.mjs :
//   import { expressiveCode } from '@kbrdn/ds-shared/expressive-code';
//   starlight({ expressiveCode, ... })
// Réf. : https://expressive-code.com/reference/configuration/

/** Couleurs de tokens — dark (Claude Dark). */
const DARK = {
  base: '#b0b0b0',
  keyword: '#d4825d',
  string: '#86e89a',
  type: '#e8a573',
  function: '#7ab8ff',
  comment: '#777777',
  variable: '#c79bff',
  attribute: '#8abfb8',
  number: '#e8a573',
  bg: '#242424', // neutral-900 (surface élevée)
};

/** Couleurs de tokens — light. */
const LIGHT = {
  base: '#374151',
  keyword: '#c15f3c',
  string: '#16a34a',
  type: '#b45309',
  function: '#2563eb',
  comment: '#9ca3af',
  variable: '#7c3aed',
  attribute: '#0d9488',
  number: '#b45309',
  bg: '#ececec', // ~neutral-100 (surface élevée claire)
};

/** Construit un thème TextMate minimal à partir d'une palette. */
function buildTheme(name, type, p) {
  return {
    name,
    type,
    colors: {
      'editor.background': p.bg,
      'editor.foreground': p.base,
    },
    settings: [
      {
        scope: ['comment', 'punctuation.definition.comment'],
        settings: { foreground: p.comment, fontStyle: 'italic' },
      },
      {
        scope: [
          'keyword',
          'storage',
          'storage.type',
          'storage.modifier',
          'keyword.control',
          'keyword.operator.new',
          'keyword.operator.expression',
          'variable.language',
        ],
        settings: { foreground: p.keyword },
      },
      {
        scope: [
          'string',
          'string.quoted',
          'punctuation.definition.string',
          'meta.attribute string',
        ],
        settings: { foreground: p.string },
      },
      {
        scope: ['entity.name.type', 'support.type', 'support.class', 'entity.name.class'],
        settings: { foreground: p.type },
      },
      {
        scope: [
          'entity.name.function',
          'support.function',
          'meta.function-call entity.name.function',
        ],
        settings: { foreground: p.function },
      },
      {
        scope: ['variable', 'variable.other', 'meta.definition.variable', 'variable.parameter'],
        settings: { foreground: p.variable },
      },
      {
        scope: ['entity.other.attribute-name', 'meta.attribute'],
        settings: { foreground: p.attribute },
      },
      {
        scope: ['constant.numeric', 'constant.language', 'constant.character', 'constant.other'],
        settings: { foreground: p.number },
      },
    ],
  };
}

export const claudeDarkTheme = buildTheme('claude-dark', 'dark', DARK);
export const claudeLightTheme = buildTheme('claude-light', 'light', LIGHT);

/** Options Expressive Code prêtes à passer à `starlight({ expressiveCode })`. */
export const expressiveCode = {
  // [dark, light] → Expressive Code suit le thème Starlight (data-theme).
  themes: [claudeDarkTheme, claudeLightTheme],
  styleOverrides: {
    borderRadius: '0', // coins nets cohérents avec la base
    borderColor: 'var(--sl-color-gray-5)',
    codeFontFamily: 'var(--kbrdn-font-code)',
    frames: {
      // titre d'onglet / barre de fenêtre alignés sur les surfaces neutres
      editorTabBarBackground: 'var(--sl-color-gray-6)',
      editorActiveTabBackground: 'var(--sl-color-black)',
      terminalTitlebarBackground: 'var(--sl-color-gray-6)',
    },
  },
};
