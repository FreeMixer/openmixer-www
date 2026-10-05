<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
import restReference from '~/data/rest-reference.json';

const { t } = useI18n();
const sitePath = useSitePath();

useSeoMeta({
  title: () => t('docsRest.seo.title'),
  description: () => t('docsRest.seo.description'),
});

const families = [...restReference.families].sort((a, b) => humanizeSlug(a.slug).localeCompare(humanizeSlug(b.slug)));
const totalRows = restReference.families.reduce((n, f) => n + f.count, 0);
const generatedOn = new Date(restReference.meta.generatedAt).toISOString().slice(0, 10);
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('docsRest.hero.eyebrow')"
      :title="t('docsRest.hero.title')"
      :lede="t('docsRest.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('docsRest.rules.eyebrow')" :title="t('docsRest.rules.title')" />
        <div class="grid gap-5 md:grid-cols-3">
          <Slab title="GET, PATCH, OPTIONS" :tag="t('docsRest.rules.verbsTag')">
            <p v-html="t('docsRest.rules.verbs')" />
          </Slab>
          <Slab :title="t('docsRest.rules.watchTitle')" :tag="t('docsRest.rules.watchTag')">
            <p v-html="t('docsRest.rules.watch')" />
          </Slab>
          <Slab :title="t('docsRest.rules.genTitle')" :tag="t('docsRest.rules.genTag')">
            <p v-html="t('docsRest.rules.gen', { rows: totalRows, families: families.length, date: generatedOn })" />
          </Slab>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('docsRest.family.eyebrow')" :title="t('docsRest.family.title')" />
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="f in families" :key="f.slug"
            :to="sitePath(`/docs/rest/${f.slug}`)"
            class="group flex items-baseline justify-between rounded border border-edge bg-surface/60 px-4 py-3 transition-colors hover:border-accent/60"
          >
            <span class="font-mono text-sm text-ink group-hover:text-accent">{{ f.root }}</span>
            <span class="ml-3 font-mono text-xs text-ink-faint">{{ f.count }}</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-6xl px-6 py-16">
        <div class="grid gap-5 sm:grid-cols-2">
          <LinkCard
            :title="t('docsRest.codes.title')"
            :href="sitePath('/docs/rest/refusal-codes')"
            label="/docs/rest/refusal-codes"
          >
            <p>{{ t('docsRest.codes.body') }}</p>
          </LinkCard>
          <LinkCard
            :title="t('docsRest.openapi.title')"
            :href="sitePath('/openapi.json')"
            label="/openapi.json"
          >
            <p>{{ t('docsRest.openapi.body', { rows: totalRows }) }}</p>
          </LinkCard>
        </div>
      </div>
    </section>
  </div>
</template>
