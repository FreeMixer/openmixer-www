<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
const { t } = useI18n();
const sitePath = useSitePath();

useSeoMeta({
  title: () => t('docsGettingStarted.seo.title'),
  description: () => t('docsGettingStarted.seo.description'),
});

const run = computed(() => [
  `# ${t('docsGettingStarted.code.fromTop')}`,
  'pnpm --filter @openmixer/server exec openmixer-server',
  '',
  `# ${t('docsGettingStarted.code.secondTerminal')}`,
  'pnpm --filter @openmixer/web-ui dev',
]);
const check = computed(() => [
  `# ${t('docsGettingStarted.code.thirdTerminal')}`,
  'curl -s http://127.0.0.1:8080/api/channel/input/1/fader',
]);

const next = computed(() =>
  (['surface', 'strip', 'patchbay', 'sends'] as const).map((k) => ({
    title: t(`docsGettingStarted.next.${k}.title`),
    blurb: t(`docsGettingStarted.next.${k}.blurb`),
  })),
);
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('docsGettingStarted.hero.eyebrow')"
      :title="t('docsGettingStarted.hero.title')"
      :lede="t('docsGettingStarted.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" :title="t('docsGettingStarted.s1.title')" />
        <p class="mb-6 text-base leading-relaxed text-ink-dim">
          {{ t('docsGettingStarted.s1.p1') }}
        </p>
        <CodeBlock :lines="run" />
        <p class="mt-4 text-sm leading-relaxed text-ink-faint" v-html="t('docsGettingStarted.s1.p2')" />
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" :title="t('docsGettingStarted.s2.title')" />
        <p class="text-base leading-relaxed text-ink-dim">
          {{ t('docsGettingStarted.s2.p1') }}
        </p>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" :title="t('docsGettingStarted.s3.title')" />
        <p class="text-base leading-relaxed text-ink-dim">
          {{ t('docsGettingStarted.s3.p1') }}
        </p>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" :title="t('docsGettingStarted.s4.title')" />
        <p class="text-base leading-relaxed text-ink-dim">
          {{ t('docsGettingStarted.s4.p1') }}
        </p>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="05" :title="t('docsGettingStarted.s5.title')" />
        <p class="mb-6 text-base leading-relaxed text-ink-dim">
          {{ t('docsGettingStarted.s5.p1') }}
        </p>
        <CodeBlock :lines="check" />
        <i18n-t keypath="docsGettingStarted.s5.p2" tag="p" scope="global" class="mt-4 text-sm leading-relaxed text-ink-dim">
          <template #position><code class="font-mono text-xs text-ink">position</code></template>
          <template #db><code class="font-mono text-xs text-ink">db</code></template>
          <template #watch><code class="font-mono text-xs text-ink">?watch=1</code></template>
          <template #link><NuxtLink :to="sitePath('/docs/rest')" class="text-accent hover:underline">{{ t('docsGettingStarted.s5.link') }}</NuxtLink></template>
        </i18n-t>
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('docsGettingStarted.next.eyebrow')" :title="t('docsGettingStarted.next.title')" />
        <DocList :title="t('docsGettingStarted.next.listTitle')" :items="next" />
      </div>
    </section>
  </div>
</template>
