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

export default defineNuxtConfig({
  // A brochure site: prerender every route to plain files so it can be served from
  // GitHub Pages, an nginx root, or the cluster, with nothing running behind it.
  ssr: true,
  nitro: { prerender: { crawlLinks: true, routes: ['/', ...familyRoutes], failOnError: true } },

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
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/img/openmixer-mark.svg' }],
    },
  },

  devtools: { enabled: false },
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2025-09-01',
});
