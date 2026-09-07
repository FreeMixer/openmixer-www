<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * A card that is one link. `href` is written as a site-absolute path (`/docs/rest`) or a
 * full URL; a site-absolute one is mounted on the site's base prefix here, because this is
 * a raw anchor and nothing else would do it (see `utils/site`).
 */
const props = defineProps<{ title: string; href: string; label: string }>();
const to = computed(() => withSiteBase(useRuntimeConfig().app.baseURL, props.href));
</script>

<template>
  <a
    :href="to"
    class="group block rounded border border-edge bg-surface/60 p-6 transition-colors hover:border-accent/60"
    rel="noopener"
  >
    <div class="flex items-baseline gap-3">
      <h3 class="font-display text-lg font-semibold tracking-tight text-ink group-hover:text-accent">{{ title }}</h3>
      <UIcon name="i-lucide-arrow-up-right" class="ml-auto size-4 flex-none text-ink-faint group-hover:text-accent" />
    </div>
    <p class="mt-1 font-mono text-xs break-all text-ink-faint">{{ label }}</p>
    <div class="mt-3 space-y-2 text-sm leading-relaxed text-ink-dim">
      <slot />
    </div>
  </a>
</template>
