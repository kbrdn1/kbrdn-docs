// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import remarkGfm from 'remark-gfm';
import { claudeDark, claudeLight } from '@kbrdn/ds-shared/ec-theme.mjs';
import { createLastmodLookup } from './src/lib/sitemap-lastmod.mjs';

// Les locales servies sous un préfixe de chemin. L'anglais n'y figure pas : il
// est à la racine, et c'est ce qui en fait la cible du `x-default` ci-dessous.
const PREFIXED_LOCALES = { fr: 'fr' };

const lastmodOf = createLastmodLookup();

// Docs du produit gwm. Hérite du design system partagé (@kbrdn/ds-shared)
// pour la consistance (footer, tokens), puis surcharge l'accent + la landing.
// https://starlight.astro.build/reference/configuration/
export default defineConfig({
  // Domaine perso, et pas l'adresse `gwm-docs.pages.dev` du projet Cloudflare :
  // c'est cette valeur qui part dans le sitemap et les URLs canoniques, donc
  // elle doit être celle qu'on veut voir indexée. La pages.dev continue d'être
  // servie en parallèle, elle ne se retire pas.
  site: 'https://gwm.kbrdn.dev',

  // GFM (tables, strikethrough, task lists…) n'est pas actif par défaut sur
  // cette combinaison Astro 6 / Starlight 0.39 — sans ça, les tables Markdown
  // se rendent en pipes bruts. remark-gfm rebranche le parsing GFM.
  markdown: {
    remarkPlugins: [remarkGfm],
  },

  integrations: [
    // Le sitemap est normalement posé par Starlight, qui s'efface dès qu'une
    // intégration `@astrojs/sitemap` est déclarée ici (integrations/sitemap.ts).
    // On reprend donc la main, à la seule condition de reproduire la config i18n
    // qu'il passait — `defaultLocale` est la *clé* de locale, pas la langue, et
    // c'est elle qui décide quelles URLs sont alternates les unes des autres.
    sitemap({
      i18n: {
        defaultLocale: 'root',
        locales: { root: 'en', ...PREFIXED_LOCALES },
      },

      serialize(item) {
        // `x-default` désigne la page à servir pour une langue qu'on ne couvre
        // pas. C'est la version racine qu'on veut là, et on la reconnaît à
        // l'absence de préfixe de locale — pas à sa langue : `lang === 'en'`
        // ne l'identifie que par coïncidence de la config du moment.
        //
        // `links` est le même tableau pour toutes les URLs d'un groupe (il est
        // mémoïsé côté @astrojs/sitemap) : on le copie, sinon chaque page du
        // groupe empile un x-default de plus dans le tableau des suivantes.
        const alternates = item.links ?? [];
        const root = alternates.find(
          ({ url }) =>
            !Object.keys(PREFIXED_LOCALES).some((prefix) =>
              new URL(url).pathname.startsWith(`/${prefix}/`),
            ),
        );
        if (root) item.links = [...alternates, { url: root.url, lang: 'x-default' }];

        const lastmod = lastmodOf(new URL(item.url).pathname);
        if (lastmod) item.lastmod = lastmod;

        return item;
      },
    }),

    starlight({
      title: 'gwm',
      description:
        'Git Worktree Manager — CLI + TUI pour gérer les worktrees Git, avec bootstrap par repo.',
      // Logo officiel du produit, repris de gwm-cli/docs/_assets (deux variantes :
      // traits clairs sur fond sombre, traits sombres sur fond clair). Remplace
      // le carré vert de placeholder, qui n'était dans aucune charte.
      logo: {
        light: './src/assets/gwm-logo-light.svg',
        dark: './src/assets/gwm-logo-dark.svg',
        alt: 'gwm',
      },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/kbrdn1/gwm-cli' }],

      // Mêmes langues et même répartition que la doc in-repo : anglais à la
      // racine, français sous /fr/. Sans déclarer les locales, Starlight sert
      // son UI (« On this page », « Previous »…) en anglais pour tout le monde.
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        fr: { label: 'Français', lang: 'fr' },
      },

      // Coloration syntaxique Claude Dark (cf. @kbrdn/ds-shared/ec-theme.mjs).
      // Sans ça les blocs de code sortent en github-dark/github-light.
      expressiveCode: {
        themes: [claudeDark, claudeLight],
        styleOverrides: {
          borderRadius: '0',
          borderColor: 'var(--kbrdn-border-color)',
          frames: { shadowColor: 'transparent' },
        },
      },

      // Composants partagés (overrides) servis depuis le package du monorepo,
      // + Hero custom local répliquant l'identité du portfolio kbrdn.dev.
      components: {
        Head: './src/components/Head.astro',
        Header: './src/components/Header.astro',
        Footer: '@kbrdn/ds-shared/components/Footer.astro',
        TableOfContents: '@kbrdn/ds-shared/components/TableOfContents.astro',
        MobileTableOfContents: '@kbrdn/ds-shared/components/MobileTableOfContents.astro',
        Hero: './src/components/Hero.astro',
      },

      // Inter (corps) self-hosted, puis thème de base partagé (tokens, Monaspace,
      // Fenix), puis override spécifique au produit gwm.
      customCss: [
        '@fontsource-variable/inter',
        '@kbrdn/ds-shared/styles/theme.css',
        './src/styles/gwm.css',
      ],

      // Une entrée par section de gwm-cli/docs, dans l'ordre que ses préfixes
      // numériques encodaient. `autogenerate` lit `sidebar.order` posé dans le
      // frontmatter au moment du port, donc l'ordre intra-section est conservé.
      // Depuis Starlight 0.39, un groupe autogénéré s'écrit `items: [{ autogenerate }]` :
      // `{ label, autogenerate }` au premier niveau n'est plus accepté.
      sidebar: [
        {
          label: 'Getting started',
          translations: { fr: 'Démarrer' },
          items: [{ autogenerate: { directory: 'getting-started' } }],
        },
        {
          label: 'TUI',
          translations: { fr: 'TUI' },
          items: [{ autogenerate: { directory: 'tui' } }],
        },
        {
          label: 'CLI',
          translations: { fr: 'CLI' },
          items: [{ autogenerate: { directory: 'cli' } }],
        },
        {
          label: 'Configuration',
          translations: { fr: 'Configuration' },
          items: [{ autogenerate: { directory: 'configuration' } }],
        },
        {
          label: 'Integrations',
          translations: { fr: 'Intégrations' },
          items: [{ autogenerate: { directory: 'integrations' } }],
        },
        {
          label: 'Development',
          translations: { fr: 'Développement' },
          items: [{ autogenerate: { directory: 'development' } }],
        },
        { label: 'Roadmap', translations: { fr: 'Roadmap' }, slug: 'roadmap' },
        {
          label: 'Changelog',
          translations: { fr: 'Changelog' },
          // Généré depuis gwm-cli/changelogs/ : une page par version publiée.
          // Replié par défaut, la liste fait une vingtaine d'entrées.
          collapsed: true,
          items: [{ autogenerate: { directory: 'changelog' } }],
        },
      ],
    }),
  ],
});
