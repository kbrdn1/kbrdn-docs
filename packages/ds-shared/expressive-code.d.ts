// Déclarations de types pour `expressive-code.js` (module ESM en JS).
// Donne un type exact à l'import côté site (astro.config.mjs en @ts-check)
// et lève le hint ts(7016).
import type { StarlightExpressiveCodeOptions } from '@astrojs/starlight/expressive-code';

type EcTheme = NonNullable<StarlightExpressiveCodeOptions['themes']>[number];

export declare const claudeDarkTheme: EcTheme;
export declare const claudeLightTheme: EcTheme;
export declare const expressiveCode: StarlightExpressiveCodeOptions;
