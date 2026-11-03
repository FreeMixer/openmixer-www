<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * The technical notes: how a part was measured or decided, one page each. The notes are markdown in
 * content/notes/, in English and Catalan, rendered by scripts/gen-pages.mjs; this page lists them by topic.
 */
import notesIndex from '~/data/notes-index.json';

const { t, locale } = useI18n();
const sitePath = useSitePath();

useSeoMeta({
  title: () => t('notes.seo.title'),
  description: () => t('notes.seo.description'),
});

type Entry = { slug: string; title: string; summary: string; measured: string; topic: string };
const TOPICS = ['qualify', 'host', 'zynthian', 'core'] as const;
const groups = computed(() => {
  const all = (notesIndex as Record<string, Entry[]>)[locale.value] ?? notesIndex.en;
  return TOPICS.map((topic) => ({
    topic,
    title: t(`notes.topics.${topic}`),
    notes: all.filter((n) => n.topic === topic),
  })).filter((g) => g.notes.length > 0);
});
</script>

<template>
  <div>
    <PageHero :eyebrow="t('notes.hero.eyebrow')" :title="t('notes.hero.title')" :lede="t('notes.hero.lede')" />
    <section v-for="g in groups" :key="g.topic" class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-14">
        <SectionHead :title="g.title" />
        <div class="grid gap-5 sm:grid-cols-2">
          <LinkCard v-for="n in g.notes" :key="n.slug" :title="n.title" :href="sitePath(`/notes/${n.slug}`)" :label="`/notes/${n.slug}`">
            <p>{{ n.summary }}</p>
          </LinkCard>
        </div>
      </div>
    </section>
  </div>
</template>
