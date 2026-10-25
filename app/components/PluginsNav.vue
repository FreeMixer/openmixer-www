<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/** The pages of the plugins section, as a row of links at the foot of each one. */
const props = defineProps<{ current: 'shipped' | 'thirdParty' | 'panels' | 'names' }>();
const { t } = useI18n();
const sitePath = useSitePath();

const PAGES = [
  ['shipped', '/docs/plugins-shipped'],
  ['thirdParty', '/docs/plugins-third-party'],
  ['panels', '/docs/plugins-panels'],
  ['names', '/docs/plugins-names'],
] as const;

const items = computed(() =>
  PAGES.filter(([k]) => k !== props.current).map(([k, to]) => ({
    title: t(`docsPluginsNav.${k}.title`),
    blurb: t(`docsPluginsNav.${k}.blurb`),
    to: sitePath(to),
  })),
);
</script>

<template>
  <section>
    <div class="mx-auto max-w-4xl px-6 py-16">
      <DocList :title="t('docsPluginsNav.title')" :items="items" />
    </div>
  </section>
</template>
