<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * A bordered block. `tag` is the small monospace label in the corner; every claim
 * on this site sits in one of these next to the thing that backs it.
 */
defineProps<{ title: string; tag?: string }>();
</script>

<template>
  <article class="rounded border border-edge bg-surface/60 p-6">
    <div class="flex items-baseline gap-3">
      <h3 class="font-display text-lg font-semibold tracking-tight text-ink">{{ title }}</h3>
      <span v-if="tag" class="ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">{{ tag }}</span>
    </div>
    <div class="mt-3 space-y-3 text-sm leading-relaxed text-ink-dim">
      <slot />
    </div>
  </article>
</template>
