// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import remarkGfm from 'remark-gfm';

// Docs du produit gwm. Hérite du design system partagé (@kbrdn/ds-shared)
// pour la consistance (footer, tokens), puis surcharge l'accent + la landing.
// https://starlight.astro.build/reference/configuration/
export default defineConfig({
  // TODO(deploy): URL de production Cloudflare Pages (branche `main` = latest).
  site: 'https://gwm-docs.pages.dev',

  // GFM (tables, strikethrough, task lists…) n'est pas actif par défaut sur
  // cette combinaison Astro 6 / Starlight 0.39 — sans ça, les tables Markdown
  // se rendent en pipes bruts. remark-gfm rebranche le parsing GFM.
  markdown: {
    remarkPlugins: [remarkGfm],
  },

  integrations: [
    starlight({
      title: 'gwm',
      description:
        'Git Worktree Manager — CLI + TUI pour gérer les worktrees Git, avec bootstrap par repo.',
      logo: { src: './src/assets/logo.svg', alt: 'gwm' },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/kbrdn1/gwm-cli' }],

      // Composants partagés (overrides) servis depuis le package du monorepo.
      components: {
        Footer: '@kbrdn/ds-shared/components/Footer.astro',
      },

      // Thème de base partagé, puis override spécifique au produit gwm.
      customCss: ['@kbrdn/ds-shared/styles/theme.css', './src/styles/gwm.css'],

      sidebar: [
        {
          label: 'Démarrer',
          items: [{ slug: 'guides/installation' }, { slug: 'guides/prise-en-main' }],
        },
        {
          label: 'Guides',
          items: [{ slug: 'guides/tui' }, { slug: 'guides/doctor' }],
        },
        {
          label: 'Référence',
          items: [{ slug: 'reference/cli' }, { slug: 'reference/gwm-toml' }],
        },
        {
          label: 'Concepts',
          items: [
            { slug: 'concepts/worktrees' },
            { slug: 'concepts/bootstrap' },
            { slug: 'concepts/trust-ledger' },
          ],
        },
      ],
    }),
  ],
});
