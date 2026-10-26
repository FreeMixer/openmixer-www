<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
const { t } = useI18n();

useSeoMeta({
  title: () => t('docsPluginsPanels.seo.title'),
  description: () => t('docsPluginsPanels.seo.description'),
});

/** The worked example's document; the link below shows only when this is set. */
const WORKED_EXAMPLE_HREF = 'https://github.com/FreeMixer/omx-panel/blob/main/docs/worked-example.md';

const steps = ['declare', 'layout', 'write'] as const;

const generate = [
  'omx-panel modgui --descriptor my-plugin.json --out my-plugin.lv2',
  'omx-panel modgui --descriptor my-plugin.json --out my-plugin.lv2 --check',
];
const validate = ['omx-panel validate ./my-plugin-skin'];
const fedora = [
  'sudo dnf install https://www.openmixer.org/rpm/openmixer-release.noarch.rpm',
  'sudo dnf install omx-panel',
];
const debian = [
  'curl -fsSLO https://www.openmixer.org/deb/openmixer-release.deb && sudo apt install ./openmixer-release.deb',
  'sudo apt update',
  'sudo apt install omx-panel',
];
const npm = ['npm install @openmixer/omx-panel'];
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('docsPluginsPanels.hero.eyebrow')"
      :title="t('docsPluginsPanels.hero.title')"
      :lede="t('docsPluginsPanels.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" :title="t('docsPluginsPanels.pitch.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsPluginsPanels.pitch.what') }}</p>
          <ul class="space-y-3">
            <li class="border-l-2 border-edge-strong pl-4" v-html="t('docsPluginsPanels.pitch.modgui')" />
            <li class="border-l-2 border-edge-strong pl-4">{{ t('docsPluginsPanels.pitch.controller') }}</li>
            <li class="border-l-2 border-edge-strong pl-4">{{ t('docsPluginsPanels.pitch.host') }}</li>
          </ul>
          <p>{{ t('docsPluginsPanels.pitch.look') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" :title="t('docsPluginsPanels.steps.title')" />
        <ol class="space-y-6 text-base leading-relaxed text-ink-dim">
          <li v-for="(s, i) in steps" :key="s" class="border-l-2 border-accent/60 pl-4">
            <p class="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">{{ t('docsPluginsPanels.steps.step', { n: i + 1 }) }}</p>
            <p class="mt-1 text-ink">{{ t(`docsPluginsPanels.steps.${s}.title`) }}</p>
            <p class="mt-1" v-html="t(`docsPluginsPanels.steps.${s}.text`)" />
          </li>
        </ol>
        <div class="mt-8 space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsPluginsPanels.steps.commands') }}</p>
          <CodeBlock :lines="generate" />
          <p>{{ t('docsPluginsPanels.steps.check') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" :title="t('docsPluginsPanels.author.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsPluginsPanels.author.skin')" />
          <CodeBlock :lines="validate" />
          <p v-html="t('docsPluginsPanels.author.import')" />
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" :title="t('docsPluginsPanels.install.title')" />
        <div class="space-y-6 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsPluginsPanels.install.fedora') }}</p>
          <CodeBlock :lines="fedora" />
          <p>{{ t('docsPluginsPanels.install.debian') }}</p>
          <CodeBlock :lines="debian" />
          <p>{{ t('docsPluginsPanels.install.npm') }}</p>
          <CodeBlock :lines="npm" />
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="05" :title="t('docsPluginsPanels.example.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsPluginsPanels.example.text') }}</p>
          <p v-if="WORKED_EXAMPLE_HREF">
            <a :href="WORKED_EXAMPLE_HREF" class="text-accent hover:underline">{{ t('docsPluginsPanels.example.link') }}</a>
          </p>
        </div>
      </div>
    </section>

    <PluginsNav current="panels" />
  </div>
</template>
