<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
interface Field {
  name: string;
  writable: boolean;
  limit: { min: number; max: number; step: number; unit: string } | null;
  values: readonly string[] | null;
  perInstance: boolean;
}
interface Row {
  path: string;
  example: string;
  writable: boolean;
  demand: boolean;
  fields: readonly Field[];
  sample: unknown;
}
defineProps<{ row: Row }>();
</script>

<template>
  <div class="rounded border border-edge bg-surface/60 p-5">
    <div class="flex flex-wrap items-center gap-2">
      <span class="rounded bg-field px-2 py-0.5 font-mono text-[11px] text-accent">GET</span>
      <span v-if="row.writable" class="rounded bg-field px-2 py-0.5 font-mono text-[11px] text-accent">PATCH</span>
      <span
        v-if="row.demand"
        class="rounded border border-edge-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint"
      >on demand</span>
      <code class="font-mono text-sm text-ink">{{ row.path }}</code>
    </div>
    <p v-if="row.example !== row.path" class="mt-2 font-mono text-xs text-ink-faint">e.g. {{ row.example }}</p>

    <ul v-if="row.fields.length" class="mt-4 space-y-2">
      <li v-for="f in row.fields" :key="f.name" class="border-l-2 border-edge pl-3">
        <div class="flex flex-wrap items-baseline gap-2 text-sm">
          <code class="font-mono text-ink">{{ f.name }}</code>
          <span
            class="font-mono text-[10px] uppercase tracking-[0.1em]"
            :class="f.writable ? 'text-accent' : 'text-ink-faint'"
          >{{ f.writable ? 'writable' : 'read-only' }}</span>
          <span v-if="f.limit" class="font-mono text-xs text-ink-dim">
            {{ f.limit.min }}–{{ f.limit.max }}{{ f.limit.unit ? ` ${f.limit.unit}` : '' }}<template v-if="f.limit.step">, step {{ f.limit.step }}</template>
          </span>
          <span v-else-if="f.perInstance" class="font-mono text-xs text-ink-dim">range depends on the instance</span>
        </div>
        <p v-if="f.values" class="mt-1 font-mono text-xs text-ink-faint">{{ f.values.join(' · ') }}</p>
      </li>
    </ul>
    <p v-else class="mt-4 text-sm text-ink-faint">No fields observed on the reference rig.</p>

    <details v-if="row.sample" class="mt-4">
      <summary class="cursor-pointer font-mono text-xs uppercase tracking-[0.1em] text-ink-faint">Example response</summary>
      <pre class="mt-2 overflow-x-auto rounded border border-edge bg-field p-4 font-mono text-xs leading-relaxed text-ink-dim">{{ JSON.stringify(row.sample, null, 2) }}</pre>
    </details>
  </div>
</template>
