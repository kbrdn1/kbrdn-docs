// Traduit les alerts GFM (`> [!WARNING]`) en directives de conteneur, que le
// plugin d'asides de Starlight rend ensuite en callouts.
//
// La doc de gwm est maintenue dans gwm-cli, où elle voyage avec le code et se
// lit sur GitHub. GitHub rend les alerts GFM nativement ; Astro non, et la
// syntaxe d'aside de Starlight (`:::caution[…]`) ne rend rien sur GitHub. Cette
// passe est le pont : l'amont écrit la seule syntaxe native des deux côtés, le
// site la traduit au rendu.
//
// L'aside est produit par Starlight, pas ici : on s'arrête au `containerDirective`
// qu'il attend, et on hérite ainsi de son icône, de ses styles et de son titre
// par défaut traduit (« Attention » sur les pages /fr).
//
// C'est un plugin mdast Sätteri, pas un plugin remark : depuis Astro 7 le
// processeur par défaut est `satteri()`, et `markdown.remarkPlugins` est
// déprécié — en poser un ferait basculer tout le site sur `unified()`
// (astro/dist/core/config/validate.js). Il se déclare donc dans
// `markdown.processor`, d'où il tourne AVANT les plugins que Starlight ajoute
// par-dessus, chacun dans sa propre passe : Sätteri applique les mutations
// d'un plugin avant de lancer le suivant, donc le nœud construit ici est
// matérialisé quand Starlight le visite.
//
// `:::caution` écrit à la main dans le contenu continue de marcher : on ne
// touche qu'aux blockquotes ouverts par un marqueur d'alert.

// Les deux tables se recouvrent à trois valeurs. GitHub n'a pas de `danger`,
// Starlight pas d'`important` : les deux orphelines tombent sur la variante la
// plus proche en intention.
const VARIANTS = {
  NOTE: 'note',
  TIP: 'tip',
  IMPORTANT: 'note',
  WARNING: 'caution',
  CAUTION: 'danger',
};

// Le marqueur occupe sa ligne, seul : c'est la règle de GitHub, et la suivre
// garde le même bloc reconnu des deux côtés. Ce qui suit le `\n` est du contenu.
const MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\n|$)/;

/**
 * Le titre custom que GFM ne sait pas porter : par convention, un `**gras**`
 * seul sur la première ligne du bloc. Starlight le reçoit comme il recevrait
 * celui de `:::caution[titre]`, via un paragraphe marqué `directiveLabel`.
 * Retire le paragraphe de `children` et renvoie le label, ou `null`.
 */
function takeLabel(children) {
  const first = children[0];
  if (first?.type !== 'paragraph' || first.children.length !== 1) return null;
  const [only] = first.children;
  if (only.type !== 'strong') return null;
  children.shift();
  return { type: 'paragraph', data: { directiveLabel: true }, children: only.children };
}

/** @type {import('satteri').MdastPluginDefinition} */
export const gfmAlerts = {
  name: 'gfm-alerts',

  blockquote(node) {
    const children = [...node.children];
    const head = children[0];
    if (head?.type !== 'paragraph') return;

    const [marker, ...rest] = head.children;
    if (marker?.type !== 'text') return;
    const match = MARKER.exec(marker.value);
    if (!match) return;

    // Le corps peut commencer sur la ligne suivante du même paragraphe : ce qui
    // reste du nœud texte après le marqueur en fait partie, il ne se jette pas.
    const tail = marker.value.slice(match[0].length);
    const headChildren = tail ? [{ type: 'text', value: tail }, ...rest] : rest;
    if (headChildren.length > 0) children[0] = { type: 'paragraph', children: headChildren };
    else children.shift();

    const label = takeLabel(children);

    return {
      type: 'containerDirective',
      name: VARIANTS[match[1]],
      attributes: {},
      children: label ? [label, ...children] : children,
    };
  },
};
