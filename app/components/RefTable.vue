<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/** A compact reference table — generated pages scan better as rows than as prose. */
defineProps<{
  columns: ReadonlyArray<{ key: string; label: string; mono?: boolean }>;
  rows: ReadonlyArray<Record<string, unknown>>;
}>();
</script>

<template>
  <div class="overflow-x-auto rounded border border-edge">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="border-b border-edge bg-surface/60">
          <th
            v-for="c in columns" :key="c.key"
            class="px-4 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint"
          >{{ c.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r, i) in rows" :key="i" class="border-b border-edge last:border-b-0 odd:bg-surface/20">
          <td
            v-for="c in columns" :key="c.key"
            class="px-4 py-3 align-top text-ink-dim"
            :class="c.mono ? 'font-mono text-xs' : 'leading-relaxed'"
          >
            <slot :name="c.key" :row="r">{{ r[c.key] }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
