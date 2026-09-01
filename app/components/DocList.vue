<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/** One section of the documentation table of contents. */
defineProps<{
  title: string;
  note?: string;
  items: ReadonlyArray<{ title: string; blurb: string }>;
}>();
</script>

<template>
  <section class="border-t border-edge py-10 first:border-t-0 first:pt-0">
    <h3 class="font-display text-xl font-semibold tracking-tight text-ink">{{ title }}</h3>
    <p v-if="note" class="mt-2 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ note }}</p>
    <ul class="mt-6 grid gap-x-10 gap-y-4 sm:grid-cols-2">
      <li v-for="it in items" :key="it.title" class="border-l-2 border-edge pl-4">
        <p class="text-base text-ink">{{ it.title }}</p>
        <p class="mt-1 text-sm leading-relaxed text-ink-dim">{{ it.blurb }}</p>
      </li>
    </ul>
  </section>
</template>
