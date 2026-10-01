<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
const { t } = useI18n();
const sitePath = useSitePath();
useSeoMeta({
  title: () => t('getIt.seo.title'),
  description: () => t('getIt.seo.description'),
});
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('getIt.hero.eyebrow')"
      :title="t('getIt.hero.title')"
      :lede="t('getIt.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead :eyebrow="t('getIt.install.eyebrow')" :title="t('getIt.install.title')" />
        <InstallSteps />
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead :eyebrow="t('getIt.before.eyebrow')" :title="t('getIt.before.title')" />
        <div class="grid gap-5 sm:grid-cols-2">
          <Slab :title="t('getIt.gettingStarted.title')" :tag="t('getIt.gettingStarted.tag')">
            <p>
              {{ t('getIt.gettingStarted.text') }}
            </p>
            <p>
              <NuxtLink :to="sitePath('/docs/getting-started')" class="text-accent hover:underline">{{ t('getIt.gettingStarted.link') }}</NuxtLink>
            </p>
          </Slab>
          <Slab :title="t('getIt.limitations.title')" :tag="t('getIt.limitations.tag')">
            <p>
              {{ t('getIt.limitations.text') }}
            </p>
            <p>
              <NuxtLink :to="sitePath('/features')" class="text-accent hover:underline">{{ t('getIt.limitations.link') }}</NuxtLink>
            </p>
          </Slab>
        </div>
      </div>
    </section>
  </div>
</template>
