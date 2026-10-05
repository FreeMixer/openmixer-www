<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
const { t } = useI18n();
const sitePath = useSitePath();

useSeoMeta({
  title: () => t('docsHistory.seo.title'),
  description: () => t('docsHistory.seo.description'),
});

/** What the list reads like. The label comes from the change, the two values from the entry. */
const sentences = computed(() =>
  (['fader', 'phantom', 'send', 'paste', 'order'] as const).map((k) => ({
    line: t(`docsHistory.sentences.${k}.line`),
    note: t(`docsHistory.sentences.${k}.note`),
  })),
);

const never = computed(() =>
  (['mute', 'cue', 'spare', 'recall'] as const).map((k) => t(`docsHistory.never.${k}`)),
);
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('docsHistory.hero.eyebrow')"
      :title="t('docsHistory.hero.title')"
      :lede="t('docsHistory.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" :title="t('docsHistory.s1.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsHistory.s1.p1') }}</p>
          <p>{{ t('docsHistory.s1.p2') }}</p>
          <p>{{ t('docsHistory.s1.p3') }}</p>
          <p>{{ t('docsHistory.s1.p4') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" :title="t('docsHistory.s2.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsHistory.s2.p1')" />
          <ul class="space-y-3">
            <li v-for="s in sentences" :key="s.line" class="border-l-2 border-edge-strong pl-4">
              <p class="font-mono text-sm text-ink">{{ s.line }}</p>
              <p class="mt-1 text-sm">{{ s.note }}</p>
            </li>
          </ul>
          <p>{{ t('docsHistory.s2.p2') }}</p>
          <p>{{ t('docsHistory.s2.p3') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" :title="t('docsHistory.s3.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsHistory.s3.p1')" />
          <p>{{ t('docsHistory.s3.p2') }}</p>
          <p>{{ t('docsHistory.s3.p3') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" :title="t('docsHistory.s4.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsHistory.s4.p1')" />
          <p>{{ t('docsHistory.s4.p2') }}</p>
          <p>{{ t('docsHistory.s4.p3') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="05" :title="t('docsHistory.s5.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsHistory.s5.p1') }}</p>
          <blockquote class="border-l-2 border-accent/60 pl-4 text-ink">
            {{ t('docsHistory.s5.quote') }}
          </blockquote>
          <p v-html="t('docsHistory.s5.p2')" />
          <p>{{ t('docsHistory.s5.p3') }}</p>
          <p>{{ t('docsHistory.s5.p4') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="06" :title="t('docsHistory.s6.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsHistory.s6.p1') }}</p>
          <ul class="space-y-2">
            <li v-for="n in never" :key="n" class="border-l-2 border-edge-strong pl-4 text-ink">{{ n }}</li>
          </ul>
          <p>{{ t('docsHistory.s6.p2') }}</p>
          <p>{{ t('docsHistory.s6.p3') }}</p>
          <p>{{ t('docsHistory.s6.p4') }}</p>
        </div>
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="07" :title="t('docsHistory.s7.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsHistory.s7.p1') }}</p>
          <p>{{ t('docsHistory.s7.p2') }}</p>
        </div>
        <i18n-t keypath="docsHistory.s7.foot" tag="p" scope="global" class="mt-8 text-sm leading-relaxed text-ink-faint">
          <template #history><code class="font-mono text-xs text-ink">/history</code></template>
          <template #cursor><code class="font-mono text-xs text-ink">/history/cursor</code></template>
          <template #revert><code class="font-mono text-xs text-ink">/history/entries/{id}/revert</code></template>
          <template #undo><code class="font-mono text-xs text-ink">/history/cursor/undo</code></template>
          <template #redo><code class="font-mono text-xs text-ink">/history/cursor/redo</code></template>
          <template #override><code class="font-mono text-xs text-ink">override</code></template>
          <template #false><code class="font-mono text-xs text-ink">false</code></template>
          <template #true><code class="font-mono text-xs text-ink">true</code></template>
          <template #rest>
            <NuxtLink :to="sitePath('/docs/rest/history')" class="text-accent hover:underline">{{ t('docsHistory.s7.rest') }}</NuxtLink>
          </template>
          <template #codes>
            <NuxtLink :to="sitePath('/docs/rest/refusal-codes')" class="text-accent hover:underline">{{ t('docsHistory.s7.codes') }}</NuxtLink>
          </template>
        </i18n-t>
      </div>
    </section>
  </div>
</template>
