<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * One document of a project, as the project wrote it (in English): /projects/<repo> is its README,
 * /projects/<repo>/<page> another of its documents. The text is app/data/projects/<repo>.json.
 */
const route = useRoute();
const { t } = useI18n();
const sitePath = useSitePath();
const repo = String(route.params.repo);
const pageSlug = String(route.params.page ?? '');

type Page = { slug: string; src: string; title: string; source: string; toc: { id: string; title: string }[]; html: string };
type Project = { repo: string; commit: string; pages: Page[] };
const files = import.meta.glob<{ default: Project }>('../../../data/projects/*.json');
const file = files[`../../../data/projects/${repo}.json`];
if (!file) throw createError({ statusCode: 404, statusMessage: `no project ${repo}`, fatal: true });
const { data } = await useAsyncData(`project-${repo}-${pageSlug}`, async () => {
  const p = (await file()).default;
  const page = p.pages.find((x) => x.slug === pageSlug);
  return page ? { page, others: p.pages.filter((x) => x.slug !== pageSlug).map(({ slug, title }) => ({ slug, title })) } : null;
});
if (!data.value) throw createError({ statusCode: 404, statusMessage: `no page ${pageSlug} of ${repo}`, fatal: true });
const doc = computed(() => data.value!.page);
const others = computed(() => data.value!.others);

useSeoMeta({
  title: () => `${doc.value.title} | ${repo} | OpenMixer`,
  description: () => t('projects.page.description', { repo }),
});
</script>

<template>
  <div>
    <PageHero :eyebrow="repo" :title="doc.title">
      <p class="mt-4 text-sm text-ink-dim">
        {{ t('projects.page.asWritten') }}
        <a :href="doc.source" class="text-accent hover:underline" rel="noopener">{{ t('projects.page.source') }}</a>
      </p>
    </PageHero>
    <section>
      <div class="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1fr_16rem]">
        <!-- the project's own document, rendered from its markdown at the recorded commit -->
        <article class="doc-body" lang="en" v-html="doc.html" />
        <nav class="hidden lg:block" :aria-label="t('projects.page.contents')">
          <template v-if="doc.toc.length > 1">
            <p class="font-mono text-xs uppercase tracking-[0.2em] text-accent">{{ t('projects.page.contents') }}</p>
            <ul class="mt-4 space-y-2 text-sm">
              <li v-for="h in doc.toc" :key="h.id"><a :href="`#${h.id}`" class="text-ink-dim hover:text-accent">{{ h.title }}</a></li>
            </ul>
          </template>
          <template v-if="others.length">
            <p class="mt-8 font-mono text-xs uppercase tracking-[0.2em] text-accent">{{ t('projects.page.more', { repo }) }}</p>
            <ul class="mt-4 space-y-2 text-sm">
              <li v-for="o in others" :key="o.slug">
                <NuxtLink :to="sitePath(`/projects/${repo}${o.slug ? `/${o.slug}` : ''}`)" class="text-ink-dim hover:text-accent">{{ o.title }}</NuxtLink>
              </li>
            </ul>
          </template>
          <p class="mt-8 text-sm">
            <NuxtLink :to="sitePath('/projects')" class="text-accent hover:underline">{{ t('projects.page.all') }}</NuxtLink>
          </p>
        </nav>
      </div>
    </section>
  </div>
</template>
