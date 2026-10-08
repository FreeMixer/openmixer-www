# Building openmixer-www

## Build and preview

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

## The documentation tree

The operator manual, its FAQ, install, hardware, administration, troubleshooting and
architecture are markdown in `FreeMixer/openmixer` under `docs/`, and that repository's own
`packages/website` renders them — the same build a console serves offline at `/help`. This
site publishes THAT build's `/docs/**` tree rather than re-rendering the markdown or
committing a copy of it. openmixer is private, so the build and the publish are two steps, and
only the second one runs in CI:

```
# 1. where the openmixer checkout is (the desk): build the tree and pack it
OPENMIXER_SRC=../openmixer node scripts/build-docs-tree.mjs --emit docs-tree.tar.gz

# 2. anywhere (CI does exactly this): unpack the pinned tree, add it to the generated site
npm run generate
scripts/fetch-docs-tree.sh /tmp/docs-tree
DOCS_TREE=/tmp/docs-tree npm run docs:site
npm run docs:links                                  # every link in the merged tree
npm run check:public                                # nothing private in the output
```

`OPENMIXER_SRC=../openmixer npm run docs:site` does both at once for a preview.

**The pin.** `deploy/docs-tree.txt` names a release of this repository, the tarball attached to
it and the tarball's sha256. `scripts/fetch-docs-tree.sh` downloads it without a credential and
refuses a file whose sha256 differs, so the site is built from what the pin says and not from
whatever the release holds today. To publish new docs:

1. build the tree (step 1 above); it refuses a tree the public guard (`check-public.mjs`)
   objects to, and prints the pin lines;
2. `scripts/pin-docs-tree.sh docs-tree.tar.gz <openmixer revision>` attaches the tarball to a release of this
   repository (`docs-<openmixer revision>`, a pre-release) and opens the pull request that changes
   `deploy/docs-tree.txt` to the new release, asset, sha256 and openmixer revision (`DRY_RUN=1` only rewrites
   the file). The pull request's run is the dry run of the whole site. It needs `gh` and this repository, and
   nothing from the private checkout, so the desk or a job on the openmixer side can run it.

**The list.** Only the pages named in `deploy/public-docs.txt` are published, and it stays the one
list. The tree is built on a sparse copy of the checkout that holds only those pages (the docs
build bundles every markdown file it can see, so on the whole checkout it shipped the private
design notes, 2026-10-01); a new page in the openmixer repo stays private until it is added to
the list. The tree records a hash of the list it was built from, and the publish step refuses a
tree built from another one: a change to the list is a new tree and a new pin.
`scripts/check-public.mjs` then reads every text file of the built site and fails on a home path,
agent notes, an internal host name or a private address.

`scripts/build-docs-tree.mjs` does both steps. It refuses rather than delivering less than it
claims: no tree, no publish (there is deliberately no snapshot to fall back on); a tree built for
another base URL or from another list is refused; any file that would overwrite one of this
site's own is a failure, not a last-writer-wins; and afterwards it checks, on the published tree,
that every listed page is there and no unlisted one is. It leaves `_docs_nuxt/source.json` naming
the openmixer revision the tree came from. `node --test scripts/build-docs-tree.test.mjs` holds
these refusals.

The docs build gets its own `NUXT_APP_BUILD_ASSETS_DIR` (`/_docs_nuxt/`), because two Nuxt
apps under one prefix share `_nuxt/`, where every file is content-hashed except
`_nuxt/builds/latest.json` — and the app whose manifest is overwritten hard-reloads on every
navigation. `nuxt.config.ts` declares those `/docs/<section>` routes `prerender: false`:
they arrive after this build, and the crawler would otherwise fail the generate on a link
into them.

## Publishing

### GitHub Pages

`.github/workflows/pages.yml` builds on a push to `main` and publishes the site at the
root of <https://freemixer.github.io/>, with `NUXT_APP_BASE_URL=/`. The root is served from
`FreeMixer/freemixer.github.io`, which also holds the package repositories, so the workflow
does not deploy a Pages artifact: it checks that repository out and `scripts/deploy-root.sh`
replaces only the top-level paths listed in `deploy/site-owns.txt`, refusing a change that
reaches anything else. A pull request runs the same steps as a dry run. Every page also gets
a redirect page at its old `/openmixer-www/` address (`scripts/redirect-stubs.mjs`).

The workflow reads only public sources: this repository, the pinned docs tree (a release of this
repository) and `FreeMixer/freemixer.github.io`. If the pinned tree cannot be downloaded or its
sha256 differs, the run fails and the root keeps serving the previous commit — deliberately,
because a site that quietly loses its manual looks exactly like a site that never had one. It
needs two secrets (**Settings → Secrets and variables → Actions**), both for the publish and
neither for a pull request:

- `PAGES_TOKEN`, with push access to `FreeMixer/freemixer.github.io`.
- `SITE_GPG_KEY`, the key that signs the publish commit. Without it the publish step refuses
  to push; the dry run does not need it.

### The cluster

`.output/public` is a static tree with no runtime dependencies, so it can also be served
from the cluster behind the existing ingress — copy the directory into a web root, or
build an image `FROM` any static file server with the tree at its document root. Nothing
in the site needs Node once it is generated.

## What goes on this site

Authored documentation and honest product description. Not development material: design
records, working notes, audits and task lists stay private and are neither linked nor
reproduced here.

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
scripts/           build-docs-tree.mjs builds and publishes the openmixer docs tree (above), and the
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
