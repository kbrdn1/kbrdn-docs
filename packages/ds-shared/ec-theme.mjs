// Thèmes Expressive Code « Claude Dark » — la coloration syntaxique des blocs de
// code, alignée sur celle du portfolio kbrdn.dev (app/assets/css/components.css,
// classes .claude-code .code-*). Sans ça les blocs de code sortent en
// github-dark/github-light, ce qui est l'écart visuel le plus visible d'une doc
// (la moitié d'une page de doc, c'est du code).
//
// Usage (astro.config.mjs) :
//   import { claudeDark, claudeLight } from '@kbrdn/ds-shared/ec-theme.mjs';
//   starlight({ expressiveCode: { themes: [claudeDark, claudeLight] } })
import { ExpressiveCodeTheme } from '@astrojs/starlight/expressive-code';

// Scopes TextMate regroupés par rôle. Un seul jeu de scopes sert aux deux thèmes,
// seules les couleurs changent — évite de désynchroniser dark et light.
const scopes = {
  keyword: [
    'keyword',
    'storage',
    'storage.type',
    'storage.modifier',
    'keyword.control',
    'keyword.operator.expression',
    'constant.language',
    'support.type.primitive',
  ],
  string: [
    'string',
    'string.quoted',
    'string.template',
    'constant.character',
    'meta.embedded.line',
  ],
  type: [
    'entity.name.type',
    'entity.name.class',
    'support.class',
    'support.type',
    'entity.other.inherited-class',
  ],
  function: ['entity.name.function', 'support.function', 'meta.function-call', 'entity.name.tag'],
  comment: ['comment', 'punctuation.definition.comment'],
  variable: [
    'variable',
    'variable.other',
    'meta.definition.variable',
    'constant.numeric',
    'constant.other',
  ],
  attribute: [
    'entity.other.attribute-name',
    'variable.parameter',
    'meta.attribute',
    'support.variable.property',
  ],
};

// Construit le tableau `settings` TextMate à partir de la palette d'un mode.
const settingsFor = (palette) => [
  { settings: { foreground: palette.fg, background: palette.bg } },
  { scope: scopes.comment, settings: { foreground: palette.comment, fontStyle: 'italic' } },
  { scope: scopes.keyword, settings: { foreground: palette.keyword, fontStyle: 'bold' } },
  { scope: scopes.string, settings: { foreground: palette.string } },
  { scope: scopes.type, settings: { foreground: palette.type } },
  { scope: scopes.function, settings: { foreground: palette.function } },
  { scope: scopes.variable, settings: { foreground: palette.variable } },
  { scope: scopes.attribute, settings: { foreground: palette.attribute } },
];

// Dark — Claude Dark pur du portfolio (neutral-950 fond, neutral-300 texte).
const dark = {
  bg: '#1a1a1a',
  fg: '#b0b0b0',
  keyword: '#d4825d',
  string: '#86e89a',
  type: '#e8a573',
  function: '#7ab8ff',
  comment: '#666666',
  variable: '#c79bff',
  attribute: '#8abfb8',
};

// Light — variantes assombries du même mapping (cf. `:root .claude-code` côté portfolio).
const light = {
  bg: '#f5f5f5',
  fg: '#374151',
  keyword: '#c15f3c',
  string: '#16a34a',
  type: '#b45309',
  function: '#2563eb',
  comment: '#9ca3af',
  variable: '#7c3aed',
  attribute: '#0d9488',
};

export const claudeDark = new ExpressiveCodeTheme({
  name: 'claude-dark',
  type: 'dark',
  colors: {
    'editor.background': dark.bg,
    'editor.foreground': dark.fg,
    'editor.selectionBackground': '#3a3a3a',
    'editorLineNumber.foreground': '#555555',
    'terminal.background': dark.bg,
    'terminal.foreground': dark.fg,
    'titleBar.activeBackground': '#242424',
    'titleBar.activeForeground': '#999999',
    'tab.activeBackground': '#242424',
    'tab.activeForeground': '#e0e0e0',
    'tab.inactiveBackground': '#1a1a1a',
    'tab.inactiveForeground': '#999999',
    'panel.border': '#2a2a2a',
  },
  settings: settingsFor(dark),
});

export const claudeLight = new ExpressiveCodeTheme({
  name: 'claude-light',
  type: 'light',
  colors: {
    'editor.background': light.bg,
    'editor.foreground': light.fg,
    'editor.selectionBackground': '#d0d0d0',
    'editorLineNumber.foreground': '#999999',
    'terminal.background': light.bg,
    'terminal.foreground': light.fg,
    'titleBar.activeBackground': '#e0e0e0',
    'titleBar.activeForeground': '#555555',
    'tab.activeBackground': '#e0e0e0',
    'tab.activeForeground': '#1a1a1a',
    'tab.inactiveBackground': '#f0eeeb',
    'tab.inactiveForeground': '#555555',
    'panel.border': '#e5e5e5',
  },
  settings: settingsFor(light),
});
