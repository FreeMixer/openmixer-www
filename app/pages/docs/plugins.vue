<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
const { t } = useI18n();
const sitePath = useSitePath();

useSeoMeta({
  title: () => t('docsPlugins.seo.title'),
  description: () => t('docsPlugins.seo.description'),
});

const findings = computed(() =>
  (['within', 'over', 'mayExceed', 'unknown'] as const).map((k) => ({
    key: k,
    code: t(`docsPlugins.budget.findings.${k}.code`),
    text: t(`docsPlugins.budget.findings.${k}.text`),
    note: t(`docsPlugins.budget.findings.${k}.note`),
  })),
);
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('docsPlugins.hero.eyebrow')"
      :title="t('docsPlugins.hero.title')"
      :lede="t('docsPlugins.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" :title="t('docsPlugins.places.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsPlugins.places.rack')" />
          <p v-html="t('docsPlugins.places.chain')" />
          <p>{{ t('docsPlugins.places.bus') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" :title="t('docsPlugins.slots.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsPlugins.slots.slot') }}</p>
          <p>{{ t('docsPlugins.slots.remove') }}</p>
          <blockquote class="border-l-2 border-accent/60 pl-4 text-ink">{{ t('docsPlugins.slots.full') }}</blockquote>
          <p>{{ t('docsPlugins.slots.oneList') }}</p>
          <p v-html="t('docsPlugins.slots.latency')" />
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" :title="t('docsPlugins.picker.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsPlugins.picker.lists') }}</p>
          <p>{{ t('docsPlugins.picker.empty') }}</p>
          <p>{{ t('docsPlugins.picker.chips') }}</p>
          <p>{{ t('docsPlugins.picker.narrowed') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" :title="t('docsPlugins.width.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsPlugins.width.knows') }}</p>
          <blockquote class="border-l-2 border-accent/60 pl-4 text-ink">{{ t('docsPlugins.width.refusal') }}</blockquote>
          <p>{{ t('docsPlugins.width.why') }}</p>
          <p>{{ t('docsPlugins.width.whole') }}</p>
          <p>{{ t('docsPlugins.width.other') }}</p>
          <blockquote class="border-l-2 border-accent/60 pl-4 text-ink">{{ t('docsPlugins.width.postFader') }}</blockquote>
          <p>{{ t('docsPlugins.width.deliberate') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="05" :title="t('docsPlugins.budget.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsPlugins.budget.intro')" />
          <ul class="space-y-4">
            <li v-for="f in findings" :key="f.key" class="border-l-2 border-edge-strong pl-4">
              <p class="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">{{ f.code }}</p>
              <p class="mt-1 text-ink">{{ f.text }}</p>
              <p class="mt-1 text-sm">{{ f.note }}</p>
            </li>
          </ul>
          <p v-html="t('docsPlugins.budget.refused')" />
          <p>{{ t('docsPlugins.budget.row') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="06" :title="t('docsPlugins.editor.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsPlugins.editor.panel') }}</p>
          <p>{{ t('docsPlugins.editor.ranges') }}</p>
          <p>{{ t('docsPlugins.editor.defaults') }}</p>
          <p>{{ t('docsPlugins.editor.session') }}</p>
        </div>
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead :eyebrow="t('docsPlugins.arriving.eyebrow')" :title="t('docsPlugins.arriving.title')" />
        <ul class="space-y-4 text-base leading-relaxed text-ink-dim">
          <li class="flex gap-3 border-l-2 border-edge-strong pl-4">
            <StatusTag state="building" />
            <span>{{ t('docsPlugins.arriving.postFader') }}</span>
          </li>
        </ul>
        <i18n-t keypath="docsPlugins.reference.text" tag="p" scope="global" class="mt-8 text-sm leading-relaxed text-ink-faint">
          <template #rack><code class="font-mono text-xs text-ink">/channel/{kind}/{index}/inserts</code></template>
          <template #params><code class="font-mono text-xs text-ink">…/inserts/{slot}/params/{symbol}</code></template>
          <template #properties><code class="font-mono text-xs text-ink">…/inserts/{slot}/properties/{property}</code></template>
          <template #verdict><code class="font-mono text-xs text-ink">…/inserts/suitability</code></template>
          <template #descriptor><code class="font-mono text-xs text-ink">/plugins/{uri}</code></template>
          <template #rest>
            <NuxtLink :to="sitePath('/docs/rest/channel')" class="text-accent hover:underline">{{ t('docsPlugins.reference.rest') }}</NuxtLink>
          </template>
          <template #refusals>
            <NuxtLink :to="sitePath('/docs/rest/refusal-codes')" class="text-accent hover:underline">{{ t('docsPlugins.reference.refusals') }}</NuxtLink>
          </template>
        </i18n-t>
      </div>
    </section>
  </div>
</template>
