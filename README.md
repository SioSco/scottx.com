# scottx.com

The published website, served by GitHub Pages. These are built files, not
source: Anagramma's source lives in the private SioSco/Anagramma
repository.

- `anagramma/` is the web build of Anagramma (`flutter build web --release
  --base-href /anagramma/ --no-web-resources-cdn`), plus its privacy page
  at `anagramma/privacy/` (from `site/anagramma/privacy/` in the Anagramma
  repository).
- `index.html` sends visitors from scottx.com to the game.
- `CNAME` tells GitHub Pages the site's domain.
- `.nojekyll` makes GitHub Pages serve the files exactly as they are.
