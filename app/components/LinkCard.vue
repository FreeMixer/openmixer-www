<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
defineProps<{ title: string; href: string; label: string }>();
</script>

<template>
  <a
    :href="href"
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
