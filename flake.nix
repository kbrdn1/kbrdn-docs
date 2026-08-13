{
  description = "kbrdn-docs - Development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };

      in
      {
        devShells.default = pkgs.mkShell {
          name = "kbrdn-docs";

          buildInputs = with pkgs; [
            # Bun
            bun

            # Tools
            git
            curl
            jq
          ];

          # Le shell ne fournit pas node : Bun est le seul runtime supporté,
          # tout passe par `bun run <script>`. mkShell n'isole pas le PATH,
          # donc un node installé sur la machine reste visible ; sur une
          # machine qui n'en a pas, les shims `#!/usr/bin/env node` de
          # node_modules/.bin (prettier, astro) ne s'appellent pas nus.
          shellHook = ''
            echo "🔧 kbrdn-docs dev env loaded"
            echo "   Bun $(bun --version 2>/dev/null)"
            export PATH="$PWD/node_modules/.bin:$PATH"
          '';
        };
      }
    );
}
