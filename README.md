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

It is a build input for LINKS as well as assets: a hand-written `<a href="/docs/rest">` in
a raw anchor points one level above the mount and 404s, while resolving perfectly in a
local preview whose root IS the mount. `NuxtLink` and Vite's `?url` apply the prefix
themselves; anything that cannot goes through `withSiteBase` (`app/utils/site.ts`), and
`npm run docs:links` fails the build on a site-absolute link that missed it. Ten such
links were live on 2026-09-07 — the favicon, the home page's screenshot and five cards on
/docs — and the checker passed them all until it learned this rule.

## The documentation tree is built from the openmixer repo, never copied

The operator manual, its FAQ, install, hardware, administration, troubleshooting and
architecture are markdown in `FreeMixer/openmixer` under `docs/`, and that repository's own
`packages/website` renders them — the same build a console serves offline at `/help`. This
site publishes THAT build's `/docs/**` tree rather than re-rendering the markdown or
committing a copy of it:

```
npm run generate                                    # this site
OPENMIXER_SRC=../openmixer npm run docs:site        # the docs tree, built and published into it
npm run docs:links                                  # every link in the merged tree
```

`scripts/build-docs-tree.mjs` does the second step. It refuses rather than delivering less
than it claims: no checkout, no publish (there is deliberately no snapshot to fall back on);
any file that would overwrite one of this site's own is a failure, not a last-writer-wins;
and afterwards it checks, on the published tree, that every manual chapter in the source
tree has a page. It leaves `_docs_nuxt/source.json` naming the openmixer revision the tree
came from.

The docs build gets its own `NUXT_APP_BUILD_ASSETS_DIR` (`/_docs_nuxt/`), because two Nuxt
apps under one prefix share `_nuxt/`, where every file is content-hashed except
`_nuxt/builds/latest.json` — and the app whose manifest is overwritten hard-reloads on every
navigation. `nuxt.config.ts` declares those `/docs/<section>` routes `prerender: false`:
they arrive after this build, and the crawler would otherwise fail the generate on a link
into them.

## Publishing

### GitHub Pages

`.github/workflows/pages.yml` builds and publishes on a push to `main`, and the site is
live at <https://freemixer.github.io/openmixer-www/>. The workflow sets
`NUXT_APP_BASE_URL=/openmixer-www/`; change it if the repository is renamed or a custom
domain is used.

It checks out `FreeMixer/openmixer` alongside this repository for the documentation tree.
That repository is private, so the checkout needs a credential: **Settings → Secrets and
variables → Actions → `OPENMIXER_DOCS_TOKEN`**, a fine-grained personal access token with
`Contents: read` on `FreeMixer/openmixer`. Without it the run fails and Pages keeps serving
the previous deployment — deliberately, because a site that quietly loses its manual looks
exactly like a site that never had one.

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
app/pages/         index, architecture, features, faq, get-it, links, and docs/ (the docs
                   section: index, getting-started, recording, rest/, abstractions)
app/components/    the shared pieces: header, footer, hero, slab, screenshot, status tag
app/data/          generated JSON the docs pages import at build time, plus the one hand-
                   curated file (abstractions-curated.json) — see scripts/ below
app/assets/css/    Tailwind entry, Nuxt UI, and the brand tokens — the only stylesheet
public/img/        the console mark and the screenshots
scripts/           build-docs-tree.mjs publishes the openmixer docs tree (above), and the
                   reference pipeline: gen-rest-reference.mjs and gen-typedoc.mjs +
                   gen-abstractions.mjs read an openmixer checkout (OPENMIXER_SRC, default
                   ../openmixer) and regenerate app/data/*.json, public/api-docs/ and
                   public/openapi.json — wired as predev/prebuild/pregenerate, so they run
                   before dev, build and generate and the site never carries stale reference
                   pages. Never hand-edit the generated files; the checked-in one is the
                   curated half typedoc cannot read (Vue components, C headers). openmixer's
                   typedoc.json carries `packageOptions: { disableSources: true }` — the repo
                   is private, so a "Defined in" link to github.com/FreeMixer/openmixer would
                   404 for every reader. It has to sit under `packageOptions`, not at the top
                   level: `entryPointStrategy: "packages"` re-reads options per package and a
                   root-level `disableSources` never reaches that re-read, so the flag silently
                   did nothing and every generated page still linked the private repo until this
                   was caught. Turn it back on (move it back to the top level, or drop it) once
                   the repo opens.
```

Styling is Tailwind utilities and Nuxt UI components. There are no hand-written CSS rules
and no second stylesheet.

## Licence

GPL-3.0-or-later, matching openmixer itself.
