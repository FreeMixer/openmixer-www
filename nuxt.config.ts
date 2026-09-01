// SPDX-License-Identifier: GPL-3.0-or-later
// openmixer-www — the project website. Statically generated, no server at runtime.

export default defineNuxtConfig({
  // A brochure site: prerender every route to plain files so it can be served from
  // GitHub Pages, an nginx root, or the cluster, with nothing running behind it.
  ssr: true,
  nitro: { prerender: { crawlLinks: true, routes: ['/'], failOnError: true } },

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
