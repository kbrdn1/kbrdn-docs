// Une carte Open Graph par page de la doc, rendue au build (cf. og-card.ts pour
// le dessin, og-page.ts pour ce qu'on y écrit). Sans ça, aucune page du site
// n'émet d'`og:image` : les partages sortent en carte de texte nue.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { rendreCarte } from '../../lib/og-card';
import { carteSlug, sectionCarte, titreCarte } from '../../lib/og-page';
import release from '../../data/gwm-release.json';

export async function getStaticPaths() {
  const pages = await getCollection('docs');
  return pages.map((page) => ({
    params: { slug: carteSlug(page.id) },
    props: {
      titre: titreCarte(page.data),
      description: page.data.description,
      section: sectionCarte(page.id),
    },
  }));
}

export const GET: APIRoute = async ({ props, site }) => {
  const png = await rendreCarte({
    titre: props.titre,
    description: props.description,
    section: props.section,
    version: release.version,
    // `site` est posé dans astro.config.mjs ; le pied de carte affiche l'hôte
    // qu'on veut voir indexé, le même que les URLs canoniques.
    hote: site?.host ?? 'gwm-docs.kbrdn.dev',
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
