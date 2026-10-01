<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
const { t } = useI18n();
const sitePath = useSitePath();

useSeoMeta({
  title: () => t('docsTemplates.seo.title'),
  description: () => t('docsTemplates.seo.description'),
});

const carried = computed(() =>
  (['dynamics', 'inserts', 'gain', 'headAmp', 'polarity'] as const).map((k) => t(`docsTemplates.saving.carried.${k}`)),
);

const notCarried = computed(() =>
  (['fader', 'identity', 'safe', 'sends', 'patch'] as const).map((k) => t(`docsTemplates.saving.notCarried.${k}`)),
);
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('docsTemplates.hero.eyebrow')"
      :title="t('docsTemplates.hero.title')"
      :lede="t('docsTemplates.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" :title="t('docsTemplates.saving.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsTemplates.saving.p1') }}</p>
          <p>{{ t('docsTemplates.saving.p2') }}</p>
          <p>{{ t('docsTemplates.saving.captures') }}</p>
          <ul class="space-y-2">
            <li v-for="c in carried" :key="c" class="border-l-2 border-accent/50 pl-4 text-ink">{{ c }}</li>
          </ul>
          <p>{{ t('docsTemplates.saving.notCaptures') }}</p>
          <ul class="space-y-2">
            <li v-for="c in notCarried" :key="c" class="border-l-2 border-edge pl-4">{{ c }}</li>
          </ul>
          <p v-html="t('docsTemplates.saving.p3')" />
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" :title="t('docsTemplates.factory.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsTemplates.factory.p1')" />
          <p>{{ t('docsTemplates.factory.p2') }}</p>
          <p>{{ t('docsTemplates.factory.p3') }}</p>
          <p>{{ t('docsTemplates.factory.p4') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" :title="t('docsTemplates.preview.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsTemplates.preview.p1') }}</p>
          <blockquote class="space-y-2 border-l-2 border-accent/60 pl-4">
            <p class="text-ink">{{ t('docsTemplates.preview.dialog.title') }}</p>
            <p class="text-sm">{{ t('docsTemplates.preview.dialog.note') }}</p>
            <ul class="font-mono text-sm text-ink">
              <li>{{ t('docsTemplates.preview.dialog.gain') }}</li>
              <li>{{ t('docsTemplates.preview.dialog.trim') }}</li>
              <li>{{ t('docsTemplates.preview.dialog.pan') }}</li>
              <li>{{ t('docsTemplates.preview.dialog.eq') }}</li>
              <li>{{ t('docsTemplates.preview.dialog.inserts') }}</li>
            </ul>
          </blockquote>
          <p>{{ t('docsTemplates.preview.p2') }}</p>
          <p v-html="t('docsTemplates.preview.p3')" />
          <p v-html="t('docsTemplates.preview.p4')" />
          <p>{{ t('docsTemplates.preview.p5') }}</p>
          <p>{{ t('docsTemplates.preview.p6') }}</p>
          <!-- The console's refusal, quoted as it arrives on the wire: not translated. -->
          <blockquote class="border-l-2 border-accent/60 pl-4 text-ink" data-i18n-skip>
            applying this would move 5 of what the channel holds (gain, trim, pan, eq, inserts)
            — confirm to go ahead
          </blockquote>
          <p>{{ t('docsTemplates.preview.p7') }}</p>
          <p>{{ t('docsTemplates.preview.p8') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" :title="t('docsTemplates.history.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <i18n-t keypath="docsTemplates.history.text" tag="p" scope="global">
            <template #link>
              <NuxtLink :to="sitePath('/docs/history')" class="text-accent hover:underline">{{ t('docsTemplates.history.link') }}</NuxtLink>
            </template>
          </i18n-t>
        </div>
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-4xl px-6 py-16">
        <i18n-t keypath="docsTemplates.rest.text" tag="p" scope="global" class="text-sm leading-relaxed text-ink-faint">
          <template #library><code class="font-mono text-xs text-ink">/channelConfigs</code></template>
          <template #apply><code class="font-mono text-xs text-ink">/channelConfigs/{id}/apply/{kind}/{index}</code></template>
          <template #preview><code class="font-mono text-xs text-ink">…/applyMoves/{kind}/{index}</code></template>
          <template #link>
            <NuxtLink :to="sitePath('/docs/rest/channelConfigs')" class="text-accent hover:underline">{{ t('docsTemplates.rest.link') }}</NuxtLink>
          </template>
        </i18n-t>
      </div>
    </section>
  </div>
</template>
