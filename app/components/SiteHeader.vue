<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * The masthead. The wordmark is the console's own mark; the nav is the six pages,
 * nothing hidden behind a menu on desktop, then the language switch: the same page in the
 * other language.
 */
const { t, locale, locales } = useI18n();
const sitePath = useSitePath();
const switchLocalePath = useSwitchLocalePath();
const links = computed(() =>
  (['architecture', 'features', 'docs', 'faq', 'get-it', 'links'] as const).map((page) => ({
    to: sitePath(`/${page}`),
    label: t(`common.nav.${page}`),
  })),
);
/** The other languages this page exists in, each a link to the same page in it. */
const otherLocales = computed(() =>
  locales.value
    .filter((l) => l.code !== locale.value)
    .map((l) => ({ code: l.code, name: l.name ?? l.code, to: switchLocalePath(l.code) })),
);
const open = ref(false);
/** public/ is served from the site's mount, so the mark's path carries the prefix. */
const mark = computed(() => withSiteBase(useRuntimeConfig().app.baseURL, '/img/openmixer-mark.svg'));
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-edge bg-field/85 backdrop-blur-md">
    <div class="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
      <NuxtLink :to="sitePath('/')" class="group flex items-center gap-3" :aria-label="t('common.header.home')">
        <img :src="mark" alt="" class="h-8 w-8" width="32" height="32">
        <span class="font-display text-xl font-semibold tracking-tight">
          <span class="text-ink">open</span><span class="text-accent">mixer</span>
        </span>
      </NuxtLink>

      <nav class="ml-auto hidden items-center gap-1 md:flex" :aria-label="t('common.header.main')">
        <NuxtLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="rounded px-3 py-2 font-mono text-xs uppercase tracking-[0.14em] text-ink-dim transition-colors hover:text-ink"
          active-class="text-accent"
        >{{ l.label }}</NuxtLink>
      </nav>

      <NuxtLink
        v-for="l in otherLocales"
        :key="l.code"
        :to="l.to"
        :hreflang="l.code"
        :lang="l.code"
        :aria-label="l.name"
        :title="l.name"
        class="hidden rounded px-2 py-2 font-mono text-xs uppercase tracking-[0.14em] text-ink-dim transition-colors hover:text-ink md:block"
      >{{ l.code }}</NuxtLink>

      <ClientOnly>
        <UColorModeButton class="ml-auto md:ml-0" :aria-label="t('common.header.theme')" />
        <template #fallback><span class="ml-auto size-8 md:ml-0" /></template>
      </ClientOnly>

      <UButton
        class="md:hidden"
        color="neutral"
        variant="ghost"
        :icon="open ? 'i-lucide-x' : 'i-lucide-menu'"
        :aria-expanded="open"
        :aria-label="t('common.header.menu')"
        @click="open = !open"
      />
    </div>

    <nav v-if="open" class="border-t border-edge md:hidden" :aria-label="t('common.header.main')">
      <NuxtLink
        v-for="l in links"
        :key="l.to"
        :to="l.to"
        class="block border-b border-edge px-6 py-3 font-mono text-xs uppercase tracking-[0.14em] text-ink-dim"
        active-class="text-accent"
        @click="open = false"
      >{{ l.label }}</NuxtLink>
      <NuxtLink
        v-for="l in otherLocales"
        :key="l.code"
        :to="l.to"
        :hreflang="l.code"
        :lang="l.code"
        class="block border-b border-edge px-6 py-3 font-mono text-xs uppercase tracking-[0.14em] text-ink-dim"
        @click="open = false"
      >{{ l.name }}</NuxtLink>
    </nav>
  </header>
</template>
