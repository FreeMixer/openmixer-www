<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * A page about Zynthian that stands alone: it needs nothing from the console. Every feature on it is a card from
 * the feature records, the same cards as the guide's Read more and the features page.
 */
const { t } = useI18n();
const sitePath = useSitePath();
const { figures } = useFeatureCards();
useSeoMeta({
  title: () => t('zynthianHome.seo.title'),
  description: () => t('zynthianHome.seo.description'),
});
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('zynthianHome.hero.eyebrow')"
      :title="t('zynthianHome.hero.title')"
      :lede="t('zynthianHome.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('zynthianHome.intro.p1') }}</p>
          <p>{{ t('zynthianHome.intro.p2') }}</p>
          <p><NuxtLink :to="sitePath('/docs/zynthian')" class="text-accent hover:underline">{{ t('zynthianHome.guide') }}</NuxtLink></p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="01" :title="t('docsZynthian.read.title')" />
        <FeatureCards surface="zynthian" group="released" full />
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="02" :title="t('docsZynthian.read.coming')" />
        <p class="mb-8 max-w-3xl text-base leading-relaxed text-ink-dim">{{ t('docsZynthian.read.comingIntro') }}</p>
        <FeatureCards surface="zynthian" group="coming" full />
      </div>
    </section>

    <section class="bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" :title="t('zynthianHome.figuresTitle')" />
        <p class="mb-4 text-base leading-relaxed text-ink-dim">{{ t('zynthianHome.figuresIntro') }}</p>
        <ul class="list-disc space-y-3 pl-6 text-base leading-relaxed text-ink-dim">
          <li v-for="f in figures" :key="f.text">
            {{ f.text }}
            <span class="block font-mono text-xs text-ink-faint">{{ f.with }}<template v-if="f.rate"> · {{ f.rate }}</template></span>
          </li>
        </ul>
        <p class="mt-6 flex flex-wrap gap-x-6 text-base">
          <NuxtLink :to="sitePath('/benchmarks')" class="text-accent hover:underline">{{ t('docsZynthian.figures.bench') }}</NuxtLink>
          <NuxtLink :to="sitePath('/notes')" class="text-accent hover:underline">{{ t('zynthianHome.notes') }}</NuxtLink>
        </p>
        <p class="mt-8 font-mono text-xs leading-relaxed text-ink-faint">{{ t('docsZynthian.figures.footer') }}</p>
      </div>
    </section>
  </div>
</template>
