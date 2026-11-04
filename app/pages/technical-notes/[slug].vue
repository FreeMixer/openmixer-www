<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * One technical note, in the page's language. Its text is app/data/notes/<slug>.json, which
 * scripts/gen-pages.mjs renders from content/notes/<slug>.<lang>.md; the page loads that note alone.
 */
const route = useRoute();
definePageMeta({ path: '/notes/:slug' });

const { t, locale } = useI18n();
const sitePath = useSitePath();
const slug = String(route.params.slug);

type Note = { title: string; summary: string; measured: string; toc: { id: string; title: string }[]; html: string };
const files = import.meta.glob<{ default: Record<string, Note> }>('../../data/notes/*.json');
const file = files[`../../data/notes/${slug}.json`];
if (!file) throw createError({ statusCode: 404, statusMessage: `no note ${slug}`, fatal: true });
const { data } = await useAsyncData(`note-${slug}-${locale.value}`, async () => (await file()).default[locale.value]);
const note = computed(() => data.value as Note);

useSeoMeta({
  title: () => `${note.value.title} | OpenMixer`,
  description: () => note.value.summary,
});
</script>

<template>
  <div>
    <PageHero :eyebrow="t('notes.page.eyebrow')" :title="note.title" :lede="note.summary" />
    <section>
      <div class="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1fr_16rem]">
        <!-- the note's own text, rendered from this repository's markdown -->
        <div>
          <article class="doc-body" v-html="note.html" />
          <!-- the technical data of the measurement (machine, rates, versions, date): a footer, not text -->
          <footer class="mt-12 border-t border-edge pt-4">
            <p class="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{{ t('notes.page.data') }}</p>
            <p class="mt-1 font-mono text-xs leading-relaxed text-ink-faint">{{ note.measured }}</p>
          </footer>
        </div>
        <nav v-if="note.toc.length > 1" class="hidden lg:block" :aria-label="t('notes.page.contents')">
          <p class="font-mono text-xs uppercase tracking-[0.2em] text-accent">{{ t('notes.page.contents') }}</p>
          <ul class="mt-4 space-y-2 text-sm">
            <li v-for="h in note.toc" :key="h.id"><a :href="`#${h.id}`" class="text-ink-dim hover:text-accent">{{ h.title }}</a></li>
          </ul>
          <p class="mt-8 text-sm">
            <NuxtLink :to="sitePath('/notes')" class="text-accent hover:underline">{{ t('notes.page.all') }}</NuxtLink>
          </p>
        </nav>
      </div>
    </section>
  </div>
</template>
