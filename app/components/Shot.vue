<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * A screenshot. Every image on this site is a real capture of the running console
 * on the rig it was photographed from — no mockups, no renders.
 */
const props = defineProps<{ src: string; alt: string; caption: string }>();
/** `src` is a path under public/; mount it, or it 404s one level above the site. */
const url = computed(() => withSiteBase(useRuntimeConfig().app.baseURL, props.src));
</script>

<template>
  <figure class="overflow-hidden rounded border border-edge bg-surface">
    <!-- The capture is a dark console; on the light theme a dark bezel keeps it framed
         rather than altered. -->
    <div class="bg-[#0b0e11] p-1.5 sm:p-2">
      <img :src="url" :alt="alt" class="block w-full rounded-sm" loading="lazy" decoding="async">
    </div>
    <figcaption class="border-t border-edge px-4 py-3 font-mono text-xs text-ink-faint">
      {{ caption }}
    </figcaption>
  </figure>
</template>
