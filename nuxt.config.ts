// SPDX-License-Identifier: GPL-3.0-or-later
// openmixer-www — the project website. Statically generated, no server at runtime.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
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

/**
 * The site's languages. English is the default and has no prefix; Catalan lives under /ca/.
 * Each locale is a directory of message files under i18n/locales/, one per page or shared
 * part, and `scripts/check-i18n.mjs` fails the build when the two directories do not hold
 * the same keys.
 */
const LOCALES = [
  { code: 'en', language: 'en', name: 'English' },
  { code: 'ca', language: 'ca', name: 'Català' },
] as const;
const localeFiles = (code: string): string[] =>
  readdirSync(fileURLToPath(new URL(`./i18n/locales/${code}`, import.meta.url)))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => `${code}/${f}`);

/** The public origin, for the hreflang and canonical links. */
const siteOrigin = process.env.SITE_ORIGIN ?? 'https://openmixer.org';

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
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/ca', ...familyRoutes, ...familyRoutes.map((r) => `/ca${r}`)],
      failOnError: true,
    },
  },

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
  modules: ['@nuxt/ui', '@nuxtjs/i18n'],

  // English at the root, Catalan under /ca/. No browser-language redirect: the site is
  // static files, and a visitor picks the language with the switcher in the header.
  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    locales: LOCALES.map((l) => ({ ...l, files: localeFiles(l.code) })),
    langDir: 'locales',
    baseUrl: siteOrigin,
    detectBrowserLanguage: false,
    // Messages may carry inline markup (<code>, <strong>, external links), rendered with
    // v-html; they are this repository's own text, never visitor input.
    compilation: { strictMessage: false, escapeHtml: false },
  },

  css: ['~/assets/css/main.css'],

  // Dark and light, following the visitor's system until they pick one with the header
  // toggle (remembered by color-mode in localStorage). color-mode puts `.dark` or
  // `.light` on <html> — Nuxt UI keys its components on `.dark`, main.css gives the
  // site's tokens their light values under `.light` — and mirrors it in data-theme.
  colorMode: { preference: 'system', fallback: 'dark', classSuffix: '', dataValue: 'theme' },

  app: {
    // A project page under github.io lives at /<repo>/. Set NUXT_APP_BASE_URL at
    // generate time for that; the default serves from a domain root.
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0b0e11', media: '(prefers-color-scheme: dark)' },
        { name: 'theme-color', content: '#f5f7f9', media: '(prefers-color-scheme: light)' },
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
