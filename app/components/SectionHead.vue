<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
defineProps<{ eyebrow?: string; title: string }>();
</script>

<template>
  <div class="mb-8">
    <p v-if="eyebrow" class="font-mono text-xs uppercase tracking-[0.2em] text-accent">{{ eyebrow }}</p>
    <h2 class="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{{ title }}</h2>
    <slot />
  </div>
</template>
