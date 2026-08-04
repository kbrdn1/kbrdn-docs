// Carte Open Graph, à la charte « Claude Dark » du kit bannière
// (~/.claude/skills/me/_banner-kit/kit.ts) : fond neutre quasi-noir, zones
// rayées en diagonale sur les flancs, filets 1px, triangles d'angle, accent
// orange chaud, titre en Fenix. Mêmes tokens que son `THEMES.dark`.
//
// Deux moteurs, parce qu'aucun ne fait le travail seul :
//
//   - Le CADRE (rayures, filets, triangles) est un SVG rasterisé par sharp.
//     Satori ne sait dessiner ni `repeating-linear-gradient` ni les triangles
//     obtenus par `border-width`, qui sont précisément la signature du motif.
//     Le cadre est identique sur toutes les cartes : rendu UNE fois et mémoïsé,
//     son coût est amorti sur les 133 pages.
//   - Le TEXTE est posé par satori. Le confier à sharp lui ferait résoudre la
//     police auprès du SYSTÈME via librsvg, or Fenix n'est installée sur aucun
//     runner CI : le rendu retomberait sur une police par défaut sans rien
//     signaler. Satori façonne le texte depuis un buffer explicite et sort des
//     glyphes déjà convertis en tracés.
//
// Une seule police, et c'est mesuré : satori rejette le woff2 (« Unsupported
// OpenType signature wOF2 »), or Inter et Monaspace ne sont distribuées qu'en
// woff2 ici. Fenix est le seul TTF du dépôt, et c'est la police des titres du
// site, donc la carte reste dans la voix.
import satori from 'satori';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const L = 1200;
const H = 630;

// Reprend `frame()` du kit, mis à l'échelle depuis son gabarit 1600x600 :
// flancs rayés à 90/1600, filets horizontaux en retrait de 60/600.
const PAD = 68;
const RETRAIT = 60;
const TRI = 9;

// `THEMES.dark` du kit. L'accent y est #d4825d, plus clair que le #c15f3c du
// site : sur fond sombre c'est le ton du kit qui tient, et la carte se lit
// comme les bannières du README plutôt que comme une capture du site.
const T = {
  fond: '#1a1a1a',
  rayure: '#333333',
  filet: '#2a2a2a',
  angle: '#3a3a3a',
  texte: '#e0e0e0',
  accent: '#d4825d',
  attenue: '#b0b0b0',
  faible: '#777777',
  // Trio du badge de version du kit, repris tel quel.
  badgeTexte: '#e8a573',
  badgeBord: 'rgba(232,165,115,0.4)',
  badgeFond: 'rgba(212,130,93,0.15)',
};

// Résolus depuis le cwd — la racine du projet Astro — et pas depuis
// `import.meta.url` : au build, ce module est bundlé dans
// `dist/.prerender/chunks/`, d'où les chemins relatifs pointent à côté (ENOENT
// sur le logo, puis sur la police). Le cwd est le répertoire du package parce
// que `bun --filter` y lance `astro` — c'est le cas des trois invocations
// réelles : `bun run build` à la racine, `bun --filter='@kbrdn/docs-gwm' run
// build` de `deploy.yml`, et `astro dev`. Cloudflare Pages ne construit pas
// lui-même, `deploy.yml` lui pousse le `dist/` déjà bâti.
const FENIX = resolve('public/fonts/Fenix-Regular.ttf');
const LOGO = resolve('src/assets/gwm-logo-dark.svg');

/** Le cadre du kit, en SVG : ce que satori ne sait pas dessiner. */
function cadreSvg(): string {
  const d = L - PAD; // filet vertical droit
  const b = H - RETRAIT; // filet horizontal bas
  // Triangles d'angle : le kit les obtient par `border-width`, ce qui donne un
  // triangle rectangle dont la masse est du côté du coin. Transcrit en polygone.
  const angles = [
    `${PAD},${RETRAIT} ${PAD + TRI},${RETRAIT} ${PAD},${RETRAIT + TRI}`,
    `${d - TRI},${RETRAIT} ${d},${RETRAIT} ${d},${RETRAIT + TRI}`,
    `${PAD},${b - TRI} ${PAD},${b} ${PAD + TRI},${b}`,
    `${d},${b - TRI} ${d},${b} ${d - TRI},${b}`,
  ]
    .map((points) => `<polygon points="${points}" fill="${T.angle}"/>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${H}">
  <defs>
    <pattern id="rayures" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
      <rect width="0.6" height="10" fill="${T.rayure}" opacity="0.55"/>
    </pattern>
  </defs>
  <rect width="${L}" height="${H}" fill="${T.fond}"/>
  <rect width="${PAD}" height="${H}" fill="url(#rayures)"/>
  <rect x="${d}" width="${PAD}" height="${H}" fill="url(#rayures)"/>
  <rect x="${PAD}" width="1" height="${H}" fill="${T.filet}"/>
  <rect x="${d}" width="1" height="${H}" fill="${T.filet}"/>
  <rect x="${PAD}" y="${RETRAIT}" width="${d - PAD}" height="1" fill="${T.filet}"/>
  <rect x="${PAD}" y="${b}" width="${d - PAD}" height="1" fill="${T.filet}"/>
  ${angles}
</svg>`;
}

// Rendus une seule fois pour tout le build : identiques sur les 133 cartes.
let cadreCache: string | undefined;
let logoCache: string | undefined;
let policeCache: Buffer | undefined;

const enDataUri = (png: Buffer) => `data:image/png;base64,${png.toString('base64')}`;

async function ressources() {
  cadreCache ??= enDataUri(await sharp(Buffer.from(cadreSvg())).png().toBuffer());
  // Rasterisé au double de sa taille d'affichage : le logo est fait de rects
  // aux arêtes franches, un rendu à la taille exacte les crénellerait.
  logoCache ??= enDataUri(
    await sharp(await readFile(LOGO))
      .resize(168, 168)
      .png()
      .toBuffer(),
  );
  policeCache ??= await readFile(FENIX);
  return { cadre: cadreCache, logo: logoCache, police: policeCache };
}

/** Coupe au dernier mot entier, pour ne pas trancher au milieu d'un terme. */
function tronquer(texte: string, max: number): string {
  if (texte.length <= max) return texte;
  const coupe = texte.slice(0, max);
  const espace = coupe.lastIndexOf(' ');
  return `${(espace > max * 0.6 ? coupe.slice(0, espace) : coupe).trimEnd()}…`;
}

type Noeud = { type: string; props: Record<string, unknown> };
const bloc = (style: Record<string, unknown>, children: unknown): Noeud => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children },
});
const image = (src: string, w: number, h: number, style: Record<string, unknown> = {}): Noeud => ({
  type: 'img',
  props: { src, width: w, height: h, style },
});

export interface DonneesCarte {
  titre: string;
  description?: string;
  /** Libellé de section, déjà lisible (« TUI », « Configuration »). */
  section?: string;
  /** Version publiée, sans le `v` (« 1.6.0 »). Vient du Cargo.toml amont. */
  version?: string;
  /** Hôte affiché en pied de carte. */
  hote: string;
}

function carte(
  { titre, description, section, version, hote }: DonneesCarte,
  res: { cadre: string; logo: string },
): Noeud {
  // Colonne de contenu, en retrait des filets verticaux du cadre.
  const marge = PAD + 44;

  return bloc({ width: `${L}px`, height: `${H}px`, position: 'relative', fontFamily: 'Fenix' }, [
    image(res.cadre, L, H, { position: 'absolute', top: 0, left: 0 }),

    bloc(
      {
        position: 'relative',
        flexDirection: 'column',
        width: `${L}px`,
        height: `${H}px`,
        paddingTop: `${RETRAIT}px`,
        paddingBottom: `${RETRAIT}px`,
        paddingLeft: `${marge}px`,
        paddingRight: `${marge}px`,
      },
      [
        // Bandeau : logo + marque à gauche, section à droite.
        bloc({ justifyContent: 'space-between', alignItems: 'center', paddingTop: '26px' }, [
          bloc({ alignItems: 'center' }, [
            image(res.logo, 56, 56),
            bloc({ fontSize: '38px', color: T.texte, marginLeft: '18px' }, 'gwm'),
            // Badge de version à côté du wordmark, comme le kit le pose.
            ...(version
              ? [
                  bloc(
                    {
                      fontSize: '18px',
                      color: T.badgeTexte,
                      backgroundColor: T.badgeFond,
                      border: `1px solid ${T.badgeBord}`,
                      padding: '5px 12px',
                      marginLeft: '18px',
                      letterSpacing: '1px',
                    },
                    `v${version}`,
                  ),
                ]
              : []),
          ]),
          // Le kit met ses libellés en mono Krypton ; impossible ici et c'est
          // mesuré, pas un choix : Krypton est une police VARIABLE, et le
          // parser d'opentype.js embarqué dans satori casse sur sa table
          // `fvar` (les noms d'axes manquent). L'interlettrage large garde
          // l'allure mono du kit avec la seule police disponible.
          bloc(
            { fontSize: '17px', color: T.accent, letterSpacing: '4px' },
            (section ?? 'DOCUMENTATION').toUpperCase(),
          ),
        ]),

        // Corps : le titre porte la carte, la description l'explique.
        bloc({ flex: 1, flexDirection: 'column', justifyContent: 'center' }, [
          bloc(
            { width: '56px', height: '3px', backgroundColor: T.accent, marginBottom: '28px' },
            '',
          ),
          bloc({ fontSize: '68px', color: T.texte, lineHeight: 1.12 }, tronquer(titre, 60)),
          ...(description
            ? [
                bloc(
                  { fontSize: '27px', color: T.attenue, lineHeight: 1.45, marginTop: '24px' },
                  tronquer(description, 130),
                ),
              ]
            : []),
        ]),

        // Pied : l'adresse, pour que la carte se rattache au site même recadrée.
        bloc({ justifyContent: 'space-between', alignItems: 'center', paddingBottom: '24px' }, [
          bloc({ fontSize: '19px', color: T.faible }, hote),
          bloc({ alignItems: 'center' }, [
            bloc(
              { width: '28px', height: '1px', backgroundColor: T.angle, marginRight: '10px' },
              '',
            ),
            bloc({ width: '8px', height: '8px', backgroundColor: T.accent }, ''),
          ]),
        ]),
      ],
    ),
  ]);
}

/** Rend la carte en PNG 1200x630, le format que lisent X, LinkedIn et Slack. */
export async function rendreCarte(donnees: DonneesCarte): Promise<Buffer> {
  const res = await ressources();
  const svg = await satori(carte(donnees, res) as never, {
    width: L,
    height: H,
    fonts: [{ name: 'Fenix', data: res.police, weight: 400, style: 'normal' }],
  });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
