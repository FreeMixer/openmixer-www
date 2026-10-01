<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * One table of catalog rows. Every row is rendered on the server, filtered or not, so the
 * prerender reaches every plugin's page through these links. Narrow screens keep the name and
 * the verdict; the figures appear as the width allows.
 */
defineProps<{ rows: readonly CatalogRow[] }>();
</script>

<template>
  <div class="overflow-hidden rounded border border-edge">
    <table class="w-full text-left text-sm">
      <thead class="bg-surface font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
        <tr>
          <th scope="col" class="px-4 py-3 font-normal">Plugin</th>
          <th scope="col" class="px-4 py-3 font-normal">Verdict</th>
          <th scope="col" class="hidden px-4 py-3 font-normal lg:table-cell">Deciding reason</th>
          <th scope="col" class="hidden px-4 py-3 font-normal sm:table-cell">Format</th>
          <th scope="col" class="hidden px-4 py-3 text-right font-normal md:table-cell">CPU p95</th>
          <th scope="col" class="hidden px-4 py-3 font-normal xl:table-cell">Package tested</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-edge">
        <tr v-for="r in rows" :key="r.uri" class="align-top hover:bg-surface/60">
          <td class="px-4 py-3">
            <NuxtLink :to="`/plugins/${r.slug}`" class="font-medium text-ink hover:text-accent">{{ r.name }}</NuxtLink>
            <p class="mt-0.5 text-xs text-ink-faint">{{ r.vendor ?? 'Vendor not declared' }}</p>
          </td>
          <td class="px-4 py-3">
            <UBadge :color="VERDICT_COLOR[r.verdict]" variant="subtle" class="whitespace-nowrap">{{ VERDICT_LABEL[r.verdict] }}</UBadge>
          </td>
          <td class="hidden max-w-sm px-4 py-3 text-xs leading-relaxed text-ink-dim lg:table-cell">{{ decidingText(r) ?? '—' }}</td>
          <td class="hidden px-4 py-3 font-mono text-xs text-ink-dim sm:table-cell">
            {{ r.format.toUpperCase() }}<span v-if="r.alsoAs" class="text-ink-faint"> (also {{ r.alsoAs.format.toUpperCase() }})</span>
          </td>
          <td class="hidden whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-ink-dim md:table-cell">{{ pct(r.cost.coreFractionP95) }}</td>
          <td class="hidden whitespace-nowrap px-4 py-3 font-mono text-xs text-ink-dim xl:table-cell">{{ r.package ? `${r.package.name} ${r.package.version}` : '—' }}</td>
        </tr>
        <tr v-if="rows.length === 0">
          <td colspan="6" class="px-4 py-6 text-center text-sm text-ink-dim">No plugin matches.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
