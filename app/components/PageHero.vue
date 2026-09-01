<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/** The heading block every inner page opens with: an eyebrow, a title, a lede. */
defineProps<{ eyebrow: string; title: string; lede?: string }>();
</script>

<template>
  <section class="border-b border-edge">
    <div class="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <p class="font-mono text-xs uppercase tracking-[0.2em] text-accent">{{ eyebrow }}</p>
      <h1 class="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        {{ title }}
      </h1>
      <p v-if="lede" class="mt-6 max-w-3xl text-lg leading-relaxed text-ink-dim">{{ lede }}</p>
      <slot />
    </div>
  </section>
</template>
