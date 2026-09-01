<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
import abstractions from '~/data/abstractions.json';

useSeoMeta({
  title: 'Abstractions catalog — openmixer',
  description: 'Every reusable element in the codebase — types, components, widgets, libraries and modules — one line each, so a change composes an existing element before it writes a new one.',
});

const filter = ref('');
const needle = computed(() => filter.value.trim().toLowerCase());
function matches(item: { name: string; summary?: string; package?: string }) {
  if (!needle.value) return true;
  const hay = `${item.name} ${item.summary ?? ''} ${item.package ?? ''}`.toLowerCase();
  return hay.includes(needle.value);
}

const columns = [
  { key: 'name', label: 'Name', mono: true },
  { key: 'package', label: 'Package', mono: true },
  { key: 'summary', label: 'Summary' },
] as const;

const generatedFiltered = computed(() =>
  abstractions.generated
    .map((g) => ({ ...g, items: g.items.filter(matches) }))
    .filter((g) => g.items.length > 0),
);
</script>

<template>
  <div>
    <PageHero
      eyebrow="Tech docs — Abstractions catalog"
      title="Every reusable element, in one place."
      lede="Two kinds of code exist here: a reusable element, or configuration composing one. This page is the inventory of the first kind — types, components, widgets, libraries and modules — so a change reaches for what already exists before it writes something new."
    />

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-10 text-sm leading-relaxed text-ink-dim">
        <p>
          The web-ui and native-C halves below are curated by hand, because typedoc
          reads TSDoc, not Vue single-file components or C headers. The
          <code class="font-mono text-xs text-ink">@openmixer/core</code> and
          <code class="font-mono text-xs text-ink">@openmixer/server</code> halves
          are generated straight from their TSDoc comments —
          {{ abstractions.meta.generatedCount }} exported symbols,
          {{ abstractions.meta.documentedCount }} of them with a summary.
        </p>
      </div>
    </section>

    <section
      v-for="g in abstractions.curated" :key="g.label"
      class="border-b border-edge"
    >
      <div class="mx-auto max-w-6xl px-6 py-14">
        <SectionHead :title="g.label" />
        <p v-if="'summary' in g && g.summary" class="-mt-6 mb-6 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ g.summary }}</p>
        <div v-if="g.items.some((it: { summary?: string }) => it.summary)" class="grid gap-4 sm:grid-cols-2">
          <div v-for="it in g.items" :key="it.name" class="border-l-2 border-edge pl-4">
            <p class="font-mono text-sm text-ink">{{ it.name }}</p>
            <p v-if="it.summary" class="mt-1 text-sm leading-relaxed text-ink-dim">{{ it.summary }}</p>
          </div>
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <span
            v-for="it in g.items" :key="it.name"
            class="rounded border border-edge bg-surface/60 px-2.5 py-1 font-mono text-xs text-ink-dim"
          >{{ it.name }}</span>
        </div>
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="Generated — core + server" title="The TypeScript public surface." />
        <input
          v-model="filter"
          type="text"
          placeholder="Filter by name, package or summary…"
          class="mb-8 w-full max-w-md rounded border border-edge bg-field px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
        >
        <div v-for="g in generatedFiltered" :key="g.label" class="mb-10">
          <h3 class="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">{{ g.label }} ({{ g.items.length }})</h3>
          <RefTable :columns="columns" :rows="g.items">
            <template #name="{ row }">
              <p class="text-ink">{{ row.name }}</p>
              <p v-if="row.file" class="mt-0.5 text-[11px] text-ink-faint">{{ row.file }}</p>
            </template>
            <template #summary="{ row }">
              <span v-if="row.summary">{{ row.summary }}</span>
              <span v-else class="text-ink-faint">—</span>
            </template>
          </RefTable>
        </div>
        <p v-if="!generatedFiltered.length" class="text-sm text-ink-faint">No symbol matches "{{ filter }}".</p>
      </div>
    </section>
  </div>
</template>
