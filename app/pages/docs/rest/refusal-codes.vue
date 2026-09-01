<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
import refusalCodes from '~/data/refusal-codes.json';

useSeoMeta({
  title: 'Refusal and undo-label codes — openmixer',
  description: 'Every refusal, warning and undo-entry code the server can send, with the parameters each one carries — generated from the code’s own message registry.',
});

const columns = [
  { key: 'code', label: 'Code', mono: true },
  { key: 'params', label: 'Parameters', mono: true },
  { key: 'doc', label: 'What it means' },
] as const;
</script>

<template>
  <div>
    <PageHero eyebrow="REST reference" title="Refusal and undo-label codes">
      <p class="mt-6 max-w-3xl text-base leading-relaxed text-ink-dim">
        Nothing below the surface ever emits display prose. A refusal, a warning or
        an undo-entry label travels as a stable code plus a small record of named
        parameters, and the client renders it in the operator's own locale.
        {{ refusalCodes.meta.totalCodes }} codes, generated from the registry that
        also gates the server's own build.
        <NuxtLink to="/docs/rest" class="text-accent hover:underline">All families</NuxtLink>
      </p>
    </PageHero>

    <section>
      <div class="mx-auto max-w-6xl space-y-12 px-6 py-16">
        <div v-for="s in refusalCodes.sections" :key="s.label">
          <h2 class="font-mono text-xs uppercase tracking-[0.2em] text-accent">{{ s.label }}</h2>
          <div class="mt-4">
            <RefTable :columns="columns" :rows="s.codes">
              <template #params="{ row }">
                <span v-if="!row.params.length" class="text-ink-faint">—</span>
                <span v-else>{{ row.params.map((p: { name: string }) => p.name).join(', ') }}</span>
              </template>
              <template #doc="{ row }">
                <span v-if="row.doc">{{ row.doc }}</span>
                <span v-else class="text-ink-faint">See {{ row.paramType }}.</span>
              </template>
            </RefTable>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
