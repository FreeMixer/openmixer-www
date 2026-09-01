# openmixer-www

The openmixer project website. Nuxt, statically generated, no server at runtime.

## Build

```
npm install
npm run generate
```

The result is a directory of plain files in `.output/public`. Serve it with anything:

```
npx serve .output/public
```

`npm run dev` runs it with hot reload on <http://localhost:3000>.

## The base URL is a build input, not a serving option

A prerendered page names its assets absolutely. A site built for `/` and then served
under a path prefix has every asset 404 one level above the mount, so the prefix has to
be known at build time:

```
NUXT_APP_BASE_URL=/openmixer-www/ npm run generate   # a GitHub project page
npm run generate                                     # a domain root
```

## Publishing

### GitHub Pages

`.github/workflows/pages.yml` builds and publishes on a push to `main`. It is inert until
the repository is pushed and Pages is switched on — Settings → Pages → Build and
deployment → **GitHub Actions**. The workflow sets `NUXT_APP_BASE_URL=/openmixer-www/`;
change it if the repository is renamed or a custom domain is used.

### The cluster

`.output/public` is a static tree with no runtime dependencies, so it can also be served
from the cluster behind the existing ingress — copy the directory into a web root, or
build an image `FROM` any static file server with the tree at its document root. Nothing
in the site needs Node once it is generated.

## What goes on this site

Authored documentation and honest product description. Not development material: design
records, working notes, audits and task lists stay in the openmixer repository and are
neither linked nor reproduced here.

Every claim on the site is backed by something real in the openmixer repository. A
capability that is built but unverified says so; a capability that does not exist is not
mentioned. The screenshots are captures of the running console on the reference rig —
there are no mockups.

## Structure

```
app/pages/         one file per route: index, architecture, features, docs, faq, get-it, links
app/components/    the shared pieces: header, footer, hero, slab, screenshot, status tag
app/assets/css/    Tailwind entry, Nuxt UI, and the brand tokens — the only stylesheet
public/img/        the console mark and the screenshots
```

Styling is Tailwind utilities and Nuxt UI components. There are no hand-written CSS rules
and no second stylesheet.

## Licence

GPL-3.0-or-later, matching openmixer itself.
