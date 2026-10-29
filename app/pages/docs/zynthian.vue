<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * Zynthian with plugin-hostd as its plugin host, in short. The use case itself (the benchmarks, the trade-offs,
 * the upstream series, every figure and capture) is published by plugin-hostd from its own docs/ and is only
 * linked from here: nothing of it is copied into this site.
 */
const { t } = useI18n();
const sitePath = useSitePath();

/** Where plugin-hostd publishes its documentation, the Zynthian use case among it. */
const HOSTD_PAGES = 'https://www.openmixer.org/plugin-hostd/';
const HOSTD_ZYNTHIAN = 'https://github.com/FreeMixer/plugin-hostd/tree/main/docs/zynthian';

useSeoMeta({
  title: () => t('docsZynthian.seo.title'),
  description: () => t('docsZynthian.seo.description'),
});
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('docsZynthian.hero.eyebrow')"
      :title="t('docsZynthian.hero.title')"
      :lede="t('docsZynthian.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" :title="t('docsZynthian.what.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsZynthian.what.p1') }}</p>
          <p>{{ t('docsZynthian.what.p2') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" :title="t('docsZynthian.figures.title')" />
        <p class="mb-4 text-base leading-relaxed text-ink-dim">{{ t('docsZynthian.figures.intro') }}</p>
        <ul class="list-disc space-y-3 pl-6 text-base leading-relaxed text-ink-dim">
          <li>{{ t('docsZynthian.figures.pss') }}</li>
          <li>{{ t('docsZynthian.figures.cpu') }}</li>
          <li>{{ t('docsZynthian.figures.xruns') }}</li>
        </ul>
        <p class="mt-6 text-base leading-relaxed text-ink-dim">
          <NuxtLink :to="sitePath('/docs/grouped-vs-processes')" class="text-accent hover:underline">{{ t('docsZynthian.figures.more') }}</NuxtLink>
        </p>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" :title="t('docsZynthian.series.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsZynthian.series.forks') }}</p>
          <p>{{ t('docsZynthian.series.upstream') }}</p>
        </div>
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="04" :title="t('docsZynthian.read.title')" />
        <div class="grid gap-5 sm:grid-cols-2">
          <LinkCard :title="t('docsZynthian.read.pages.title')" :href="HOSTD_PAGES" :label="HOSTD_PAGES">
            <p>{{ t('docsZynthian.read.pages.body') }}</p>
          </LinkCard>
          <LinkCard :title="t('docsZynthian.read.source.title')" :href="HOSTD_ZYNTHIAN" :label="HOSTD_ZYNTHIAN">
            <p>{{ t('docsZynthian.read.source.body') }}</p>
          </LinkCard>
        </div>
      </div>
    </section>
  </div>
</template>
