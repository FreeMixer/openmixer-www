<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
const { t } = useI18n();
const sitePath = useSitePath();

useSeoMeta({
  title: () => t('docsPluginsThirdParty.seo.title'),
  description: () => t('docsPluginsThirdParty.seo.description'),
});

const fedora = ['sudo dnf install lsp-plugins-lv2 lsp-plugins-clap'];
const debian = ['sudo apt install lsp-plugins-lv2 lsp-plugins-clap'];
const tools = {
  fedora: ['sudo dnf install plugin-hostd omx-clap-host plugin-qualify'],
  debian: ['sudo apt install plugin-hostd omx-clap-host plugin-qualify'],
};
const run = ['plugin-qualify /usr/lib/clap/omx-delay.clap'];
const output = [
  'plugin-qualify: host profile openmixer-console (in-process)',
  'plugin-qualify: target urn:clap:org.openmixer.delay (/usr/lib/clap)',
  'plugin                        verdict      reason  host',
  'urn:clap:org.openmixer.delay  suitable     -       openmixer-console',
];

const verdicts = ['suitable', 'conditional', 'unknown', 'unsuitable'] as const;
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('docsPluginsThirdParty.hero.eyebrow')"
      :title="t('docsPluginsThirdParty.hero.title')"
      :lede="t('docsPluginsThirdParty.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" :title="t('docsPluginsThirdParty.install.title')" />
        <div class="space-y-6 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsPluginsThirdParty.install.intro') }}</p>
          <p>{{ t('docsPluginsThirdParty.install.fedora') }}</p>
          <CodeBlock :lines="fedora" />
          <p>{{ t('docsPluginsThirdParty.install.debian') }}</p>
          <CodeBlock :lines="debian" />
          <p v-html="t('docsPluginsThirdParty.install.where')" />
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" :title="t('docsPluginsThirdParty.hostd.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsPluginsThirdParty.hostd.workers')" />
          <p>{{ t('docsPluginsThirdParty.hostd.crash') }}</p>
          <p>{{ t('docsPluginsThirdParty.hostd.pins') }}</p>
          <i18n-t keypath="docsPluginsThirdParty.hostd.picker" tag="p" scope="global">
            <template #chapter>
              <NuxtLink :to="sitePath('/docs/plugins')" class="text-accent hover:underline">{{ t('docsPluginsThirdParty.hostd.chapter') }}</NuxtLink>
            </template>
          </i18n-t>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" :title="t('docsPluginsThirdParty.qualify.title')" />
        <div class="space-y-6 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsPluginsThirdParty.qualify.what') }}</p>
          <p>{{ t('docsPluginsThirdParty.qualify.installFedora') }}</p>
          <CodeBlock :lines="tools.fedora" />
          <p>{{ t('docsPluginsThirdParty.qualify.installDebian') }}</p>
          <CodeBlock :lines="tools.debian" />
          <p>{{ t('docsPluginsThirdParty.qualify.run') }}</p>
          <CodeBlock :lines="run" />
          <p>{{ t('docsPluginsThirdParty.qualify.output') }}</p>
          <CodeBlock :lines="output" />
          <p v-html="t('docsPluginsThirdParty.qualify.exit')" />
          <p v-html="t('docsPluginsThirdParty.qualify.path')" />
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" :title="t('docsPluginsThirdParty.verdicts.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsPluginsThirdParty.verdicts.intro') }}</p>
          <ul class="space-y-4">
            <li v-for="v in verdicts" :key="v" class="border-l-2 border-edge-strong pl-4">
              <p class="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">{{ t(`docsPluginsThirdParty.verdicts.${v}.code`) }}</p>
              <p class="mt-1 text-ink">{{ t(`docsPluginsThirdParty.verdicts.${v}.text`) }}</p>
              <p class="mt-1 text-sm">{{ t(`docsPluginsThirdParty.verdicts.${v}.do`) }}</p>
            </li>
          </ul>
          <p>{{ t('docsPluginsThirdParty.verdicts.worst') }}</p>
          <p>{{ t('docsPluginsThirdParty.verdicts.host') }}</p>
        </div>
      </div>
    </section>

    <PluginsNav current="thirdParty" />
  </div>
</template>
