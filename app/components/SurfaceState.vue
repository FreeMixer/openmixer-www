<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/** A state of a feature on one surface: released, merged, coming or to confirm. */
const props = defineProps<{ state: 'released' | 'merged' | 'coming' | 'to-confirm' }>();
const { t } = useI18n();
const TONE = {
  released: 'border-meter/40 text-meter',
  merged: 'border-accent/40 text-accent',
  coming: 'border-edge-strong text-ink-dim',
  'to-confirm': 'border-edge-strong text-ink-faint',
} as const;
</script>

<template>
  <span
    class="inline-flex flex-none items-center rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em]"
    :class="TONE[props.state]"
  >{{ t(`featureCards.state.${props.state}`) }}</span>
</template>
