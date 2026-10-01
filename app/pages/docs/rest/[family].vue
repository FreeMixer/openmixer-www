<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
import restReference from '~/data/rest-reference.json';

const { t } = useI18n();
const sitePath = useSitePath();
const route = useRoute();
const slug = computed(() => String(route.params.family));
const family = computed(() => restReference.families.find((f) => f.slug === slug.value));

if (!family.value) {
  throw createError({ statusCode: 404, statusMessage: t('docsRestFamily.notFound') });
}

const label = computed(() => humanizeSlug(slug.value));

useSeoMeta({
  title: () => t('docsRestFamily.seo.title', { root: family.value?.root ?? '' }),
  description: () => t('docsRestFamily.seo.description', { root: family.value?.root ?? '' }),
});
</script>

<template>
  <div v-if="family">
    <PageHero :eyebrow="t('docsRestFamily.eyebrow')" :title="family.root">
      <p class="mt-6 max-w-3xl text-base leading-relaxed text-ink-dim">
        <i18n-t keypath="docsRestFamily.count" tag="span" scope="global" :plural="family.count">
          <template #count>{{ family.count }}</template>
          <template #root><code class="font-mono text-sm text-ink">{{ family.root }}</code></template>
        </i18n-t>
        <NuxtLink :to="sitePath('/docs/rest')" class="text-accent hover:underline">{{ t('docsRestFamily.allFamilies') }}</NuxtLink>
        · <NuxtLink :to="sitePath('/docs/rest/refusal-codes')" class="text-accent hover:underline">{{ t('docsRestFamily.refusalCodes') }}</NuxtLink>
      </p>
    </PageHero>

    <section>
      <div class="mx-auto max-w-6xl space-y-14 px-6 py-16">
        <div v-for="g in family.groups" :key="g.label">
          <h2 class="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            {{ g.label.startsWith('(') ? t('docsRestFamily.root') : humanizeSlug(g.label) }}
          </h2>
          <div class="mt-4 space-y-4">
            <RestRowCard v-for="row in g.rows" :key="row.path" :row="row" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
