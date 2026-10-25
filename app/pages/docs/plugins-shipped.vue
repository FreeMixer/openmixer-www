<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
const { t } = useI18n();
const sitePath = useSitePath();

useSeoMeta({
  title: () => t('docsPluginsShipped.seo.title'),
  description: () => t('docsPluginsShipped.seo.description'),
});

const fedora = [
  'sudo dnf config-manager addrepo --from-repofile=https://freemixer.github.io/rpm/freemixer.repo',
  'sudo dnf install omx-plugins',
];
const debian = [
  'sudo install -d /etc/apt/keyrings',
  'sudo curl -fsSL -o /etc/apt/keyrings/freemixer.asc https://freemixer.github.io/deb/freemixer.asc',
  'echo "deb [signed-by=/etc/apt/keyrings/freemixer.asc] https://freemixer.github.io/deb/debian/$(. /etc/os-release && echo $VERSION_CODENAME) ./" | sudo tee /etc/apt/sources.list.d/freemixer.list',
  'sudo apt update',
  'sudo apt install omx-plugins',
];
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('docsPluginsShipped.hero.eyebrow')"
      :title="t('docsPluginsShipped.hero.title')"
      :lede="t('docsPluginsShipped.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" :title="t('docsPluginsShipped.what.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsPluginsShipped.what.formats')" />
          <p v-html="t('docsPluginsShipped.what.same')" />
          <p v-html="t('docsPluginsShipped.what.catalogue')" />
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" :title="t('docsPluginsShipped.install.title')" />
        <div class="space-y-6 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsPluginsShipped.install.fedora') }}</p>
          <CodeBlock :lines="fedora" />
          <p>{{ t('docsPluginsShipped.install.debian') }}</p>
          <CodeBlock :lines="debian" />
          <p>{{ t('docsPluginsShipped.install.signed') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" :title="t('docsPluginsShipped.packages.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsPluginsShipped.packages.split')" />
          <p v-html="t('docsPluginsShipped.packages.where')" />
          <p>{{ t('docsPluginsShipped.packages.rescan') }}</p>
          <i18n-t keypath="docsPluginsShipped.packages.names" tag="p" scope="global">
            <template #names>
              <NuxtLink :to="sitePath('/docs/plugins-names')" class="text-accent hover:underline">{{ t('docsPluginsShipped.packages.namesLink') }}</NuxtLink>
            </template>
          </i18n-t>
        </div>
      </div>
    </section>

    <PluginsNav current="shipped" />
  </div>
</template>
