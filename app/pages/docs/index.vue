<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * The documentation hub: one page to find every document from.
 *
 * It LINKS the operator manual, it does not restate it. Until 2026-09-07 this page carried
 * the manual's whole table of contents — the chapter titles and the blurb sentences out of
 * `docs/manual/index.md`, retyped — and linked almost none of it, because the manual was
 * not published here. It is now, rendered from that same file by the openmixer repo's own
 * site build, so the table of contents lives in one place and this page points at it.
 */
import restReference from '~/data/rest-reference.json';
import abstractions from '~/data/abstractions.json';
import mcpTools from '~/data/mcp-tools.json';

const { t } = useI18n();
const sitePath = useSitePath();

useSeoMeta({
  title: () => t('docsIndex.seo.title'),
  description: () => t('docsIndex.seo.description'),
});

const totalRestRows = restReference.families.reduce((n: number, f: { count: number }) => n + f.count, 0);

/**
 * Chapters written for this site rather than for the manual tree. They cover subjects the
 * manual does not carry yet; which tree should own each of them is an open question, not a
 * settled split, so the distinction is stated rather than hidden.
 */
const siteChapters = computed(() =>
  ([
    ['gettingStarted', '/docs/getting-started'],
    ['recording', '/docs/recording'],
    ['history', '/docs/history'],
    ['templates', '/docs/templates'],
    ['plugins', '/docs/plugins'],
    ['reacRole', '/docs/reac-role'],
  ] as const).map(([k, to]) => ({
    title: t(`docsIndex.chapters.${k}.title`),
    blurb: t(`docsIndex.chapters.${k}.blurb`),
    to: sitePath(to),
  })),
);

const faqGroups = computed(() =>
  (['what', 'running', 'building', 'recording', 'refuses', 'trust'] as const).map((k) => t(`docsIndex.faqGroups.${k}`)),
);
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('docsIndex.hero.eyebrow')"
      :title="t('docsIndex.hero.title')"
      :lede="t('docsIndex.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('docsIndex.tech.eyebrow')" :title="t('docsIndex.tech.title')">
          <p class="mt-4 max-w-3xl text-base leading-relaxed text-ink-dim">
            {{ t('docsIndex.tech.intro') }}
          </p>
        </SectionHead>
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <LinkCard :title="t('docsIndex.tech.api.title')" :href="sitePath('/api-docs/')" label="/api-docs/">
            <p>{{ t('docsIndex.tech.api.body') }}</p>
          </LinkCard>
          <LinkCard :title="t('docsIndex.tech.rest.title')" :href="sitePath('/docs/rest')" label="/docs/rest">
            <p>{{ t('docsIndex.tech.rest.body', { count: totalRestRows }) }}</p>
          </LinkCard>
          <LinkCard :title="t('docsIndex.tech.openapi.title')" :href="sitePath('/openapi.json')" label="/openapi.json">
            <p>{{ t('docsIndex.tech.openapi.body') }}</p>
          </LinkCard>
          <LinkCard :title="t('docsIndex.tech.abstractions.title')" :href="sitePath('/docs/abstractions')" label="/docs/abstractions">
            <p>{{ t('docsIndex.tech.abstractions.body', { count: abstractions.meta.generatedCount }) }}</p>
          </LinkCard>
          <LinkCard :title="t('docsIndex.tech.mcp.title')" :href="sitePath('/docs/mcp')" label="/docs/mcp">
            <p>{{ t('docsIndex.tech.mcp.body', { count: mcpTools.meta.toolCount }) }}</p>
          </LinkCard>
          <LinkCard :title="t('docsIndex.tech.architecture.title')" :href="sitePath('/docs/architecture')" label="/docs/architecture">
            <p>{{ t('docsIndex.tech.architecture.body') }}</p>
          </LinkCard>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('docsIndex.manual.eyebrow')" :title="t('docsIndex.manual.title')">
          <p class="mt-4 max-w-3xl text-base leading-relaxed text-ink-dim">
            {{ t('docsIndex.manual.intro') }}
          </p>
        </SectionHead>
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <LinkCard :title="t('docsIndex.manual.operator.title')" :href="sitePath('/docs/manual')" label="/docs/manual">
            <p>{{ t('docsIndex.manual.operator.body') }}</p>
          </LinkCard>
          <LinkCard :title="t('docsIndex.manual.install.title')" :href="sitePath('/docs/install')" label="/docs/install">
            <p>{{ t('docsIndex.manual.install.body') }}</p>
          </LinkCard>
          <LinkCard :title="t('docsIndex.manual.troubleshooting.title')" :href="sitePath('/docs/troubleshooting')" label="/docs/troubleshooting">
            <p>{{ t('docsIndex.manual.troubleshooting.body') }}</p>
          </LinkCard>
          <LinkCard :title="t('docsIndex.manual.hardware.title')" :href="sitePath('/docs/hardware')" label="/docs/hardware">
            <p>{{ t('docsIndex.manual.hardware.body') }}</p>
          </LinkCard>
          <LinkCard :title="t('docsIndex.manual.admin.title')" :href="sitePath('/docs/admin')" label="/docs/admin">
            <p>{{ t('docsIndex.manual.admin.body') }}</p>
          </LinkCard>
        </div>
        <DocList
          :title="t('docsIndex.manual.siteTitle')"
          :note="t('docsIndex.manual.siteNote')"
          :items="siteChapters"
        />
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-3xl px-6 py-16">
        <SectionHead :eyebrow="t('docsIndex.faq.eyebrow')" :title="t('docsIndex.faq.title')" />
        <p class="mb-6 text-base leading-relaxed text-ink-dim">
          {{ t('docsIndex.faq.body', { groups: faqGroups.join(' · ') }) }}
        </p>
        <UButton :to="sitePath('/faq')" color="primary" trailing-icon="i-lucide-arrow-right">{{ t('docsIndex.faq.button') }}</UButton>
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('docsIndex.gaps.eyebrow')" :title="t('docsIndex.gaps.title')" />
        <div class="grid gap-8 lg:grid-cols-2">
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <p>{{ t('docsIndex.gaps.intro') }}</p>
            <ul class="space-y-3">
              <li class="border-l-2 border-edge-strong pl-4" v-html="t('docsIndex.gaps.surfaces')" />
              <li class="border-l-2 border-edge-strong pl-4" v-html="t('docsIndex.gaps.deployment')" />
              <li class="border-l-2 border-edge-strong pl-4" v-html="t('docsIndex.gaps.screenshots')" />
              <li class="border-l-2 border-edge-strong pl-4" v-html="t('docsIndex.gaps.arithmetic')" />
            </ul>
          </div>
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <p class="text-sm text-ink-faint">
              {{ t('docsIndex.gaps.notPublished') }}
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
