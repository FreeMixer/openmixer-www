<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
defineProps<{ title: string; state: 'live' | 'measured' | 'building' }>();
</script>

<template>
  <article class="border-t border-edge py-8 first:border-t-0 first:pt-0">
    <div class="flex flex-wrap items-baseline gap-x-4 gap-y-2">
      <h3 class="font-display text-xl font-semibold tracking-tight text-ink">{{ title }}</h3>
      <StatusTag :state="state" />
    </div>
    <div class="mt-4 grid gap-x-10 gap-y-4 text-base leading-relaxed text-ink-dim lg:grid-cols-2">
      <slot />
    </div>
  </article>
</template>
