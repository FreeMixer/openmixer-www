<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * A screenshot. Every image on this site is a real capture of the running console
 * on the rig it was photographed from — no mockups, no renders.
 */
defineProps<{ src: string; alt: string; caption: string }>();
</script>

<template>
  <figure class="overflow-hidden rounded border border-edge bg-surface">
    <img :src="src" :alt="alt" class="block w-full" loading="lazy" decoding="async">
    <figcaption class="border-t border-edge px-4 py-3 font-mono text-xs text-ink-faint">
      {{ caption }}
    </figcaption>
  </figure>
</template>
