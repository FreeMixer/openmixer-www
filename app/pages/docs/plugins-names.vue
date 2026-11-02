<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
const { t } = useI18n();

useSeoMeta({
  title: () => t('docsPluginsNames.seo.title'),
  description: () => t('docsPluginsNames.seo.description'),
});

const ORG = 'https://github.com/FreeMixer/';

/**
 * One row per piece; an empty list is a form the piece does not ship in. `path` is where the piece lives when it is
 * not a repository of its own (it is built from FreeMixer/.github).
 */
const PIECES = [
  {
    repo: 'clap-headers',
    path: '.github/tree/main/.github/workflows/clap-headers-deb.yml',
    pkgconfig: [],
    rpm: [],
    deb: ['clap-headers'],
    npm: [],
  },
  {
    repo: 'libdiginet',
    pkgconfig: ['libdiginet', 'libdiginet-transport'],
    rpm: ['libdiginet', 'libdiginet-devel', 'diginet-tools'],
    deb: ['libdiginet0', 'libdiginet-transport0', 'libdiginet-dev', 'diginet-tools'],
    npm: [],
  },
  {
    repo: 'libmackie',
    pkgconfig: ['libmackie'],
    rpm: ['libmackie', 'libmackie-devel'],
    deb: ['libmackie0', 'libmackie-dev'],
    npm: [],
  },
  {
    repo: 'libsurface',
    pkgconfig: ['libsurface', 'libsurface-diginet'],
    rpm: ['libsurface', 'libsurface-devel', 'libsurface-diginet', 'libsurface-diginet-devel', 'surface-c24'],
    deb: ['libsurface0', 'libsurface-dev', 'libsurface-diginet0', 'libsurface-diginet-dev', 'surface-c24'],
    npm: [],
  },
  {
    repo: 'mod-host',
    pkgconfig: ['mod-host-protocol'],
    rpm: ['mod-host', 'mod-host-protocol', 'mod-host-protocol-devel'],
    deb: ['libmod-host-protocol0', 'libmod-host-protocol-dev'],
    npm: [],
  },
  {
    repo: 'omx-clap-core',
    pkgconfig: ['omx-clap-core', 'omx-clap-lv2'],
    rpm: ['omx-clap-host', 'omx-clap-core', 'omx-clap-core-devel', 'omx-clap-lv2-devel', 'omx-clap-core-contract', 'omx-clap-host-tests'],
    deb: ['omx-clap-host', 'libomx-clap-core1', 'libomx-clap-core-dev', 'libomx-clap-lv2-dev', 'omx-clap-core-contract', 'omx-clap-host-tests'],
    npm: [],
  },
  {
    repo: 'omx-contract',
    pkgconfig: ['omx-contract'],
    rpm: ['omx-contract', 'omx-contract-data', 'omx-contract-devel'],
    deb: ['omx-contract', 'omx-contract-data', 'libomx-contract-dev'],
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
    rpm: ['omx-plugins', 'omx-plugins-clap', 'omx-plugins-lv2', 'omx-plugins-devel', 'omx-plugins-contract', 'omx-plugins-test'],
    deb: ['omx-plugins', 'omx-plugins-clap', 'omx-plugins-lv2', 'omx-plugins-dev', 'omx-plugins-contract', 'omx-plugins-test'],
    npm: [],
  },
  {
    repo: 'omx-qualification-records',
    pkgconfig: [],
    rpm: [],
    deb: ['omx-qualification-rpi5-zynthian-vangelis'],
    npm: [],
  },
  {
    repo: 'openmixer-release',
    path: '.github/tree/main/packaging/openmixer-release',
    pkgconfig: [],
    rpm: ['openmixer-release'],
    deb: ['openmixer-release'],
    npm: [],
  },
  {
    repo: 'plugin-hostd',
    pkgconfig: [],
    rpm: ['plugin-hostd', 'plugin-hostd-devel', 'plugin-hostd-contract', 'plugin-hostd-tests'],
    deb: ['plugin-hostd', 'plugin-hostd-dev', 'plugin-hostd-contract', 'plugin-hostd-tests'],
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
            <a :href="ORG + String(row.path ?? row.repo)" class="font-mono text-xs text-accent hover:underline">{{ row.repo }}</a>
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
