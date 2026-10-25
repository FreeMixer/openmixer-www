<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
const { t } = useI18n();

useSeoMeta({
  title: () => t('docsPluginsNames.seo.title'),
  description: () => t('docsPluginsNames.seo.description'),
});

const ORG = 'https://github.com/FreeMixer/';

/** One row per piece; a null cell is a form the piece does not ship in. */
const PIECES = [
  {
    repo: 'omx-clap-core',
    pkgconfig: ['omx-clap-core', 'omx-clap-lv2'],
    rpm: ['omx-clap-host', 'omx-clap-core', 'omx-clap-core-devel', 'omx-clap-lv2-devel'],
    deb: ['omx-clap-host', 'libomx-clap-core0', 'libomx-clap-core-dev', 'libomx-clap-lv2-dev'],
    npm: [],
  },
  {
    repo: 'omx-contract',
    pkgconfig: ['omx-contract'],
    rpm: ['omx-contract-devel'],
    deb: ['libomx-contract-dev'],
    npm: ['@openmixer/omx-contract'],
  },
  {
    repo: 'omx-dsp',
    pkgconfig: ['omxdsp'],
    rpm: ['omx-dsp-devel'],
    deb: ['libomxdsp-dev'],
    npm: [],
  },
  {
    repo: 'omx-panel',
    pkgconfig: [],
    rpm: ['omx-panel'],
    deb: ['omx-panel'],
    npm: ['@openmixer/omx-panel'],
  },
  {
    repo: 'omx-plugins',
    pkgconfig: [],
    rpm: ['omx-plugins', 'omx-plugins-clap', 'omx-plugins-lv2', 'omx-plugins-devel'],
    deb: ['omx-plugins', 'omx-plugins-clap', 'omx-plugins-lv2', 'omx-plugins-dev'],
    npm: [],
  },
  {
    repo: 'plugin-hostd',
    pkgconfig: [],
    rpm: ['plugin-hostd', 'plugin-hostd-devel'],
    deb: ['plugin-hostd', 'plugin-hostd-dev'],
    npm: [],
  },
  {
    repo: 'plugin-qualify',
    pkgconfig: [],
    rpm: ['plugin-qualify'],
    deb: ['plugin-qualify'],
    npm: ['@openmixer/plugin-qualify'],
  },
] as const;

const columns = computed(() => [
  { key: 'repo', label: t('docsPluginsNames.columns.repo') },
  { key: 'pkgconfig', label: t('docsPluginsNames.columns.pkgconfig') },
  { key: 'rpm', label: t('docsPluginsNames.columns.rpm') },
  { key: 'deb', label: t('docsPluginsNames.columns.deb') },
  { key: 'npm', label: t('docsPluginsNames.columns.npm') },
]);
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('docsPluginsNames.hero.eyebrow')"
      :title="t('docsPluginsNames.hero.title')"
      :lede="t('docsPluginsNames.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="01" :title="t('docsPluginsNames.table.title')" />
        <p class="mb-6 max-w-3xl text-base leading-relaxed text-ink-dim">{{ t('docsPluginsNames.table.intro') }}</p>
        <RefTable :columns="columns" :rows="PIECES as unknown as Record<string, unknown>[]">
          <template #repo="{ row }">
            <a :href="ORG + String(row.repo)" class="font-mono text-xs text-accent hover:underline">{{ row.repo }}</a>
          </template>
          <template v-for="k in (['pkgconfig', 'rpm', 'deb', 'npm'] as const)" #[k]="{ row }" :key="k">
            <ul v-if="(row[k] as string[]).length" class="space-y-1">
              <li v-for="n in (row[k] as string[])" :key="n"><code class="font-mono text-xs text-ink">{{ n }}</code></li>
            </ul>
            <span v-else class="text-ink-faint">-</span>
          </template>
        </RefTable>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" :title="t('docsPluginsNames.suffix.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsPluginsNames.suffix.text')" />
        </div>
      </div>
    </section>

    <PluginsNav current="names" />
  </div>
</template>
