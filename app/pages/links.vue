<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
const { t } = useI18n();
useSeoMeta({
  title: () => t('links.seo.title'),
  description: () => t('links.seo.description'),
});
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('links.hero.eyebrow')"
      :title="t('links.hero.title')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('links.project.eyebrow')" :title="t('links.project.title')" />
        <div class="grid gap-5 md:grid-cols-2">
          <article class="rounded border border-edge bg-surface/60 p-6">
            <div class="flex items-baseline gap-3">
              <h3 class="font-display text-lg font-semibold tracking-tight text-ink">openmixer</h3>
              <span class="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                {{ t('links.openmixer.notPublic') }}
              </span>
            </div>
            <div class="mt-3 space-y-2 text-sm leading-relaxed text-ink-dim">
              <p>
                {{ t('links.openmixer.what') }}
              </p>
              <p>
                {{ t('links.openmixer.noLink') }}
              </p>
            </div>
          </article>
          <LinkCard
            title="FreeREAC"
            href="https://github.com/FreeREAC"
            label="github.com/FreeREAC"
          >
            <p>
              {{ t('links.freereac') }}
            </p>
          </LinkCard>
        </div>
      </div>
    </section>

    <section class="bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('links.upstream.eyebrow')" :title="t('links.upstream.title')" >
          <p class="mt-4 max-w-3xl text-base leading-relaxed text-ink-dim">
            {{ t('links.upstream.text') }}
          </p>
        </SectionHead>
        <div class="grid gap-5 md:grid-cols-3">
          <LinkCard title="PipeWire" href="https://pipewire.org" label="pipewire.org">
            <p>
              {{ t('links.upstream.pipewire') }}
            </p>
          </LinkCard>
          <LinkCard title="LV2" href="https://lv2plug.in" label="lv2plug.in">
            <p>
              {{ t('links.upstream.lv2') }}
            </p>
          </LinkCard>
          <LinkCard title="mod-host" href="https://github.com/moddevices/mod-host" label="github.com/moddevices/mod-host">
            <p>
              {{ t('links.upstream.modHost') }}
            </p>
          </LinkCard>
        </div>
      </div>
    </section>
  </div>
</template>
