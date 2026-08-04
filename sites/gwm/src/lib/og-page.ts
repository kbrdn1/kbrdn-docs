// Ce qu'une page met sur sa carte Open Graph, et où cette carte vit.
//
// Deux appelants qui doivent tomber d'accord au caractère près : l'endpoint
// `src/pages/og/[...slug].png.ts`, qui génère les fichiers, et l'override
// `src/components/Head.astro`, qui pose les métas. Un écart d'un caractère
// entre les deux, et chaque `og:image` du site pointe sur un 404 sans que rien
// n'échoue au build — d'où ce module commun plutôt que la règle écrite deux
// fois. Il ne dépend ni de satori ni de sharp, pour ne pas les tirer dans le
// rendu de chaque page.
import type { CollectionEntry } from 'astro:content';

type Donnees = CollectionEntry<'docs'>['data'];

/** Segment de route de la carte. La landing a un id vide selon le loader. */
export const carteSlug = (id: string) => id || 'index';

/** Chemin absolu de la carte, à résoudre contre `site` pour l'URL publique. */
export const cheminCarte = (id: string) => `/og/${carteSlug(id)}.png`;

/**
 * Titre porté par la carte : celui que la page pose dans son `head` si elle le
 * surcharge, sinon son titre. Les deux landings surchargent — leur `title`
 * vaut « gwm », le wordmark du Hero — donc sans ça leur carte s'annoncerait
 * avec le seul nom du produit, ce que la surcharge existe justement à éviter.
 */
export function titreCarte(data: Donnees): string {
  const surcharge = data.head?.find((balise) => balise.tag === 'title')?.content;
  return surcharge || data.title;
}

// Libellés de section, repris de la sidebar (cf. astro.config.mjs) et de ses
// `translations`. Les sections absentes d'ici sont des pages racines.
const SECTIONS: Record<string, [en: string, fr: string]> = {
  'getting-started': ['Getting started', 'Démarrer'],
  tui: ['TUI', 'TUI'],
  cli: ['CLI', 'CLI'],
  configuration: ['Configuration', 'Configuration'],
  integrations: ['Integrations', 'Intégrations'],
  development: ['Development', 'Développement'],
  changelog: ['Changelog', 'Changelog'],
};

/**
 * Libellé de section affiché en haut de carte, déduit du premier segment de
 * l'id — après le préfixe de langue, sinon toutes les pages françaises
 * s'annonceraient « FR ». Une page sans dossier (landing, roadmap) retombe sur
 * le libellé générique.
 */
export function sectionCarte(id: string): string {
  const segments = id.split('/');
  const fr = segments[0] === 'fr';
  const chemin = fr ? segments.slice(1) : segments;
  const libelles = chemin.length > 1 ? SECTIONS[chemin[0]!] : undefined;
  return libelles ? libelles[fr ? 1 : 0] : 'Documentation';
}
