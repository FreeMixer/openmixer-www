<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
const { t } = useI18n();
const sitePath = useSitePath();

useSeoMeta({
  title: () => t('docsRecording.seo.title'),
  description: () => t('docsRecording.seo.description'),
});

const arriving = computed(() =>
  (['wall', 'transport', 'topBar', 'metadata', 'flac', 'button', 'tapPicker'] as const).map((k) =>
    t(`docsRecording.arriving.items.${k}`),
  ),
);
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('docsRecording.hero.eyebrow')"
      :title="t('docsRecording.hero.title')"
      :lede="t('docsRecording.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" :title="t('docsRecording.captures.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsRecording.captures.default')" />
          <p>{{ t('docsRecording.captures.patched') }}</p>
          <p>{{ t('docsRecording.captures.omissions') }}</p>
          <p>{{ t('docsRecording.captures.taps') }}</p>
          <p>{{ t('docsRecording.captures.tapsFixed') }}</p>
          <p>{{ t('docsRecording.captures.setFixed') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" :title="t('docsRecording.recording.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsRecording.recording.transport') }}</p>
          <p>{{ t('docsRecording.recording.refuses') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" :title="t('docsRecording.library.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsRecording.library.listed') }}</p>
          <p>{{ t('docsRecording.library.files') }}</p>
          <p v-html="t('docsRecording.library.legs')" />
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" :title="t('docsRecording.print.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsRecording.print.armed') }}</p>
          <p>{{ t('docsRecording.print.notSummed') }}</p>
          <p>{{ t('docsRecording.print.clipping') }}</p>
          <p>{{ t('docsRecording.print.render') }}</p>
          <p>{{ t('docsRecording.print.refuses') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="05" :title="t('docsRecording.empty.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsRecording.empty.header') }}</p>
          <p>{{ t('docsRecording.empty.drops') }}</p>
          <p>{{ t('docsRecording.empty.soundcheck') }}</p>
          <p v-html="t('docsRecording.empty.tags')" />
          <p>{{ t('docsRecording.empty.honest') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="06" :title="t('docsRecording.vsc.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsRecording.vsc.intro') }}</p>
          <ol class="list-decimal space-y-3 pl-6">
            <li v-html="t('docsRecording.vsc.load')" />
            <li v-html="t('docsRecording.vsc.engage')" />
            <li v-html="t('docsRecording.vsc.play')" />
            <li v-html="t('docsRecording.vsc.eject')" />
          </ol>
          <p>{{ t('docsRecording.vsc.rate') }}</p>
          <p>{{ t('docsRecording.vsc.exclusive') }}</p>
        </div>
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead :eyebrow="t('docsRecording.arriving.eyebrow')" :title="t('docsRecording.arriving.title')" />
        <ul class="space-y-4 text-base leading-relaxed text-ink-dim">
          <li v-for="item in arriving" :key="item" class="flex gap-3 border-l-2 border-edge-strong pl-4">
            <StatusTag state="building" />
            <span>{{ item }}</span>
          </li>
        </ul>
        <i18n-t keypath="docsRecording.reference.text" tag="p" scope="global" class="mt-8 text-sm leading-relaxed text-ink-faint">
          <template #record><code class="font-mono text-xs text-ink">/record</code></template>
          <template #vsc><code class="font-mono text-xs text-ink">/vsc</code></template>
          <template #takes><code class="font-mono text-xs text-ink">/takes</code></template>
          <template #export><code class="font-mono text-xs text-ink">/takes/{id}/export</code></template>
          <template #channel><code class="font-mono text-xs text-ink">/channel/{kind}/{index}/record</code></template>
          <template #rest>
            <NuxtLink :to="sitePath('/docs/rest/record')" class="text-accent hover:underline">{{ t('docsRecording.reference.rest') }}</NuxtLink>
          </template>
          <template #refusals>
            <NuxtLink :to="sitePath('/docs/rest/refusal-codes')" class="text-accent hover:underline">{{ t('docsRecording.reference.refusals') }}</NuxtLink>
          </template>
        </i18n-t>
      </div>
    </section>
  </div>
</template>
