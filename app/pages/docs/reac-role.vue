<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
const { t } = useI18n();
const sitePath = useSitePath();

useSeoMeta({
  title: () => t('docsReacRole.seo.title'),
  description: () => t('docsReacRole.seo.description'),
});

const refusals = computed(() =>
  (['deskMasters', 'rivalBox', 'rivalUnknown', 'noMaster'] as const).map((k) => ({
    when: t(`docsReacRole.refusals.${k}.when`),
    text: t(`docsReacRole.refusals.${k}.text`),
    doing: t(`docsReacRole.refusals.${k}.doing`),
  })),
);
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('docsReacRole.hero.eyebrow')"
      :title="t('docsReacRole.hero.title')"
      :lede="t('docsReacRole.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" :title="t('docsReacRole.segments.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsReacRole.segments.p1')" />
          <p>{{ t('docsReacRole.segments.p2') }}</p>
          <p>{{ t('docsReacRole.segments.p3') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" :title="t('docsReacRole.roles.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsReacRole.roles.mixer')" />
          <p v-html="t('docsReacRole.roles.recorder')" />
          <p v-html="t('docsReacRole.roles.automatic')" />
          <p>{{ t('docsReacRole.roles.never') }}</p>
          <p class="text-sm text-ink-faint" v-html="t('docsReacRole.roles.note')" />
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" :title="t('docsReacRole.watching.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsReacRole.watching.p1') }}</p>
          <p>{{ t('docsReacRole.watching.p2') }}</p>
          <p>{{ t('docsReacRole.watching.p3') }}</p>
          <p>{{ t('docsReacRole.watching.p4') }}</p>
          <p v-html="t('docsReacRole.watching.p5')" />
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" :title="t('docsReacRole.refusals.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsReacRole.refusals.intro') }}</p>
          <ul class="space-y-5">
            <li v-for="r in refusals" :key="r.when" class="border-l-2 border-edge-strong pl-4">
              <p class="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">{{ r.when }}</p>
              <p class="mt-1 text-ink">{{ r.text }}</p>
              <p class="mt-1 text-sm">{{ r.doing }}</p>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="05" :title="t('docsReacRole.rate.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsReacRole.rate.p1')" />
          <p>{{ t('docsReacRole.rate.p2') }}</p>
          <p>{{ t('docsReacRole.rate.p3') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="06" :title="t('docsReacRole.file.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsReacRole.file.p1')" />
          <p v-html="t('docsReacRole.file.p2')" />
          <p>{{ t('docsReacRole.file.p3') }}</p>
          <p>{{ t('docsReacRole.file.p4') }}</p>
        </div>
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead :eyebrow="t('docsReacRole.arriving.eyebrow')" :title="t('docsReacRole.arriving.title')" />
        <ul class="space-y-4 text-base leading-relaxed text-ink-dim">
          <li class="flex gap-3 border-l-2 border-edge-strong pl-4">
            <StatusTag state="building" />
            <span>{{ t('docsReacRole.arriving.rateControl') }}</span>
          </li>
        </ul>
        <i18n-t keypath="docsReacRole.rest.text" tag="p" scope="global" class="mt-8 text-sm leading-relaxed text-ink-faint">
          <template #list><code class="font-mono text-xs text-ink">/reac/segment</code></template>
          <template #one><code class="font-mono text-xs text-ink">/reac/segment/{name}</code></template>
          <template #link>
            <NuxtLink :to="sitePath('/docs/rest/reac')" class="text-accent hover:underline">{{ t('docsReacRole.rest.link') }}</NuxtLink>
          </template>
        </i18n-t>
      </div>
    </section>
  </div>
</template>
