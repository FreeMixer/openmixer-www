<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * The projects' own documents: each project's README and the guides and references its packages used to carry,
 * copied at the commit content/projects/projects.json names (scripts/gen-pages.mjs --sync, checked by --verify).
 * The packages install no documentation; they name this site instead.
 */
import projectsIndex from '~/data/projects-index.json';

const { t } = useI18n();
const sitePath = useSitePath();

useSeoMeta({
  title: () => t('projects.seo.title'),
  description: () => t('projects.seo.description'),
});
</script>

<template>
  <div>
    <PageHero :eyebrow="t('projects.hero.eyebrow')" :title="t('projects.hero.title')" :lede="t('projects.hero.lede')" />
    <section>
      <div class="mx-auto grid max-w-6xl gap-5 px-6 py-14 sm:grid-cols-2 lg:grid-cols-3">
        <LinkCard v-for="p in projectsIndex" :key="p.repo" :title="p.repo" :href="sitePath(`/projects/${p.repo}`)" :label="`/projects/${p.repo}`">
          <ul class="space-y-1">
            <li v-for="pg in p.pages" :key="pg.src">{{ pg.title }}</li>
          </ul>
        </LinkCard>
      </div>
    </section>
  </div>
</template>
