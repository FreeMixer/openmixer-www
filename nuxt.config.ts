// SPDX-License-Identifier: GPL-3.0-or-later
// openmixer-www — the project website. Statically generated, no server at runtime.

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// crawlLinks finds a dynamic route only via an <a href> already sitting in ALREADY-
// prerendered HTML; a STATIC sibling page is included by the `static` preset regardless
// of whether anything links to it yet. /docs/rest/[family].vue is the one dynamic route
// on the site, so its instances are named explicitly rather than trusted to the crawler —
// generated ahead of this config by predev/prebuild/pregenerate, read straight off disk.
const restReferencePath = fileURLToPath(new URL('./app/data/rest-reference.json', import.meta.url));
const familyRoutes: string[] = existsSync(restReferencePath)
  ? (JSON.parse(readFileSync(restReferencePath, 'utf8')).families as { slug: string }[]).map((f) => `/docs/rest/${f.slug}`)
  : [];

/** The prefix this build is served under, with a trailing slash. Same input Nuxt reads. */
const baseURL = process.env.NUXT_APP_BASE_URL ?? '/';

/**
 * The `/docs/<section>` trees published by `scripts/build-docs-tree.mjs` from the openmixer
 * repo, not rendered by this app. Must match DOC_SECTIONS in that repo's
 * `packages/website/app/utils/docs.ts`; a section it grows and this list misses fails this
 * build loudly the moment anything links to it, which is the intended way to find out.
 */
const DOCS_TREE_SECTIONS = ['install', 'manual', 'hardware', 'admin', 'troubleshooting', 'architecture'];

/**
 * A route rule is matched against the path the prerenderer REQUESTS, and under a base
 * prefix that path is `/openmixer-www/docs/manual`, not `/docs/manual`. So every rule is
 * written twice — bare, and mounted — because a rule that silently fails to match reads
 * exactly like a route that renders.
 */
const NOT_OURS = ['/api-docs/**', '/openapi.json', ...DOCS_TREE_SECTIONS.flatMap((s) => [`/docs/${s}`, `/docs/${s}/**`])];
const mount = baseURL.replace(/\/+$/, '');
const notOursRules = Object.fromEntries(
  NOT_OURS.flatMap((path) => [
    [path, { prerender: false }],
    [`${mount}${path}`, { prerender: false }],
  ]),
);

export default defineNuxtConfig({
  // A brochure site: prerender every route to plain files so it can be served from
  // GitHub Pages, an nginx root, or the cluster, with nothing running behind it.
  ssr: true,
  nitro: { prerender: { crawlLinks: true, routes: ['/', ...familyRoutes], failOnError: true } },

  // /api-docs/ (typedoc's own static HTML tree, copied verbatim from public/) and
  // openapi.json are plain files, not Vue routes — the prerender crawler otherwise
  // tries to resolve a linked /api-docs/ through the app router, gets a 404 (nothing
  // registers that path as a page) and fails the whole generate under failOnError.
  //
  // The documentation tree (/docs/manual, /docs/install, …) is not this app's either:
  // `npm run docs:site` publishes it after this build, rendered from the openmixer
  // repo's markdown by that repo's own site build. The hub links into it, so the
  // crawler would follow those links and fail the generate on routes that arrive one
  // step later. Declared here rather than left to a link nobody dares write.
  routeRules: notOursRules,

  // Nuxt UI v4 owns the Tailwind v4 pipeline itself (it registers @tailwindcss/vite),
  // so there is no separate Tailwind module and no tailwind.config.
  modules: ['@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  // The site is dark-only. Nuxt UI tracks its own `.dark` class through
  // @nuxtjs/color-mode; without this its components render their light variants
  // over a dark page — a solid button turns into a pale slab.
  colorMode: { preference: 'dark', fallback: 'dark', classSuffix: '' },

  app: {
    // A project page under github.io lives at /<repo>/. Set NUXT_APP_BASE_URL at
    // generate time for that; the default serves from a domain root.
    head: {
      htmlAttrs: { lang: 'en', 'data-theme': 'dark' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0b0e11' },
      ],
      // The prefix is a BUILD input: a leading-slash href here points above the mount on a
      // project page, which is how the favicon 404'd on the live site until 2026-09-07.
      link: [{ rel: 'icon', type: 'image/svg+xml', href: `${baseURL}img/openmixer-mark.svg` }],
    },
  },

  devtools: { enabled: false },
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2025-09-01',
});
