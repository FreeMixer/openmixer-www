<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
import refusalCodes from '~/data/refusal-codes.json';

const { t } = useI18n();
const sitePath = useSitePath();

useSeoMeta({
  title: () => t('docsRefusalCodes.seo.title'),
  description: () => t('docsRefusalCodes.seo.description'),
});

const columns = computed(() => [
  { key: 'code', label: t('docsRefusalCodes.col.code'), mono: true },
  { key: 'params', label: t('docsRefusalCodes.col.params'), mono: true },
  { key: 'doc', label: t('docsRefusalCodes.col.doc') },
] as const);
</script>

<template>
  <div>
    <PageHero :eyebrow="t('docsRefusalCodes.eyebrow')" :title="t('docsRefusalCodes.title')">
      <p class="mt-6 max-w-3xl text-base leading-relaxed text-ink-dim">
        {{ t('docsRefusalCodes.lede', { count: refusalCodes.meta.totalCodes }) }}
        <NuxtLink :to="sitePath('/docs/rest')" class="text-accent hover:underline">{{ t('docsRefusalCodes.allFamilies') }}</NuxtLink>
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
                <span v-else class="text-ink-faint">{{ t('docsRefusalCodes.see', { type: row.paramType }) }}</span>
              </template>
            </RefTable>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
