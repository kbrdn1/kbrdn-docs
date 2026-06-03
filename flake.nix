{
  description = "kbrdn-docs — monorepo de documentation multi-produits (Astro Starlight, Bun)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        # Le repo produit des sites statiques via Bun ; le build de prod passe
        # par la CI / Cloudflare Pages, pas par Nix. Le flake fournit donc le
        # shell de dev reproductible (la seule chose qui mérite d'être figée).
        devShells.default = pkgs.mkShell {
          name = "kbrdn-docs-dev";

          # Bun est le seul gestionnaire de paquets / runtime supporté. Node
          # reste fourni pour les outils de l'écosystème qui en dépendent
          # encore (sharp, astro-language-server). git pour le workflow.
          # oxlint / prettier / typescript sont installés par `bun install`
          # (devDependencies épinglées), pas par Nix.
          packages = with pkgs; [
            bun
            nodejs_22
            git
          ];

          shellHook = ''
            echo "kbrdn-docs dev shell — bun $(bun --version), node $(node --version)"
            echo "→ bun install && bun run dev"
          '';
        };
      }
    );
}
