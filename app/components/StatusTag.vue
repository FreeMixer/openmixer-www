<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * The honesty label on a feature. Three states, and the wording is deliberate:
 * `live` means it has been driven on the rig, `measured` means audio was measured
 * through it, `building` means the code is landing and nothing has proved it yet.
 */
const props = defineProps<{ state: 'live' | 'measured' | 'building' }>();

const LABEL = {
  live: 'Proven on the rig',
  measured: 'Built and measured',
  building: 'In development',
} as const;

const TONE = {
  live: 'border-meter/40 text-meter',
  measured: 'border-accent/40 text-accent',
  building: 'border-edge-strong text-ink-dim',
} as const;

const label = computed(() => LABEL[props.state]);
const tone = computed(() => TONE[props.state]);
</script>

<template>
  <span
    class="inline-flex flex-none items-center rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]"
    :class="tone"
  >{{ label }}</span>
</template>
