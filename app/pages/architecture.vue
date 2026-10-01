<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
const { t } = useI18n();

useSeoMeta({
  title: () => t('architecture.seo.title'),
  description: () => t('architecture.seo.description'),
});

const oracleItems = ['i1', 'i2', 'i3', 'i4', 'i5'] as const;
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('architecture.hero.eyebrow')"
      :title="t('architecture.hero.title')"
      :lede="t('architecture.hero.lede')"
    />

    <!-- 1. The model -->
    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('architecture.s1.eyebrow')" :title="t('architecture.s1.title')" />
        <div class="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <p>{{ t('architecture.s1.p1') }}</p>
            <p>{{ t('architecture.s1.p2') }}</p>
            <p>{{ t('architecture.s1.p3') }}</p>
          </div>
          <div class="rounded border border-edge bg-surface/60 p-6 font-mono text-sm leading-relaxed text-ink-dim">
            <p class="text-ink-faint">{{ t('architecture.s1.wire') }}</p>
            <p class="mt-3"><span class="text-accent">GET</span> /api/channel/input/9/mute</p>
            <p><span class="text-accent">PATCH</span> /api/channel/input/9/mute</p>
            <p><span class="text-accent">OPTIONS</span> /api/channel/input/9/mute</p>
            <p class="mt-3"><span class="text-accent">GET</span> /api/channel/input/9/mute?watch=1</p>
            <p class="mt-4 text-ink-faint">{{ t('architecture.s1.oneStream') }}</p>
            <p><span class="text-accent">GET</span> /api/?watch=1</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. The rows -->
    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('architecture.s2.eyebrow')" :title="t('architecture.s2.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <i18n-t keypath="architecture.s2.p1" tag="p" scope="global">
            <template #grammar><code class="rounded bg-field px-2 py-0.5 font-mono text-sm text-ink">/{root}/{kind}/{index}[/{sub}…]</code></template>
            <template #kind><code class="font-mono text-sm text-ink">kind</code></template>
            <template #index><code class="font-mono text-sm text-ink">index</code></template>
            <template #curl><code class="font-mono text-sm text-ink">curl</code></template>
          </i18n-t>
          <p v-html="t('architecture.s2.p2')" />
        </div>

        <div class="mt-10 grid gap-5 md:grid-cols-3">
          <Slab :title="t('architecture.s2.kinds.title')" :tag="t('architecture.s2.kinds.tag')">
            <p v-html="t('architecture.s2.kinds.p1')" />
            <p>{{ t('architecture.s2.kinds.p2') }}</p>
          </Slab>
          <Slab :title="t('architecture.s2.urls.title')" :tag="t('architecture.s2.urls.tag')">
            <p>{{ t('architecture.s2.urls.p1') }}</p>
            <p v-html="t('architecture.s2.urls.p2')" />
          </Slab>
          <Slab :title="t('architecture.s2.declared.title')" :tag="t('architecture.s2.declared.tag')">
            <p>{{ t('architecture.s2.declared.p1') }}</p>
            <p>{{ t('architecture.s2.declared.p2') }}</p>
          </Slab>
        </div>
      </div>
    </section>

    <!-- 3. Streams -->
    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('architecture.s3.eyebrow')" :title="t('architecture.s3.title')" />
        <div class="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <blockquote class="border-l-2 border-accent pl-5 font-display text-xl leading-snug text-ink">
              {{ t('architecture.s3.quote') }}
            </blockquote>
            <p class="mt-6 text-base leading-relaxed text-ink-dim" v-html="t('architecture.s3.p1')" />
            <p class="mt-4 text-base leading-relaxed text-ink-dim">{{ t('architecture.s3.p2') }}</p>
          </div>
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <p>{{ t('architecture.s3.p3') }}</p>
            <p>{{ t('architecture.s3.p4') }}</p>
            <p>{{ t('architecture.s3.p5') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. Southbound -->
    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('architecture.s4.eyebrow')" :title="t('architecture.s4.title')" />
        <div class="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <p v-html="t('architecture.s4.p1')" />
            <p>{{ t('architecture.s4.p2') }}</p>
            <p v-html="t('architecture.s4.p3')" />
          </div>
          <div class="rounded border border-edge bg-field p-6">
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">
              {{ t('architecture.s4.latch.title') }}
            </p>
            <p class="mt-4 text-base leading-relaxed text-ink-dim" v-html="t('architecture.s4.latch.p1')" />
            <p class="mt-4 text-sm leading-relaxed text-ink-dim">{{ t('architecture.s4.latch.p2') }}</p>
            <p class="mt-4 text-sm leading-relaxed text-ink-faint" v-html="t('architecture.s4.latch.p3')" />
          </div>
        </div>
      </div>
    </section>

    <!-- 5. The native node -->
    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('architecture.s5.eyebrow')" :title="t('architecture.s5.title')" />
        <div class="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <p v-html="t('architecture.s5.p1')" />
            <p v-html="t('architecture.s5.p2')" />
            <p>{{ t('architecture.s5.p3') }}</p>
            <p>{{ t('architecture.s5.p4') }}</p>
          </div>
          <div class="space-y-5">
            <div class="rounded border border-edge bg-surface/60 p-6">
              <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">{{ t('architecture.s5.kernel.title') }}</p>
              <p class="mt-3 text-sm leading-relaxed text-ink-dim" v-html="t('architecture.s5.kernel.body')" />
            </div>
            <div class="rounded border border-edge bg-surface/60 p-6">
              <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">{{ t('architecture.s5.realtime.title') }}</p>
              <p class="mt-3 text-sm leading-relaxed text-ink-dim">{{ t('architecture.s5.realtime.body') }}</p>
            </div>
            <div class="rounded border border-edge bg-surface/60 p-6">
              <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">{{ t('architecture.s5.onTop.title') }}</p>
              <p class="mt-3 text-sm leading-relaxed text-ink-dim" v-html="t('architecture.s5.onTop.body')" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. Verification -->
    <section class="bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('architecture.s6.eyebrow')" :title="t('architecture.s6.title')" />
        <div class="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <p>{{ t('architecture.s6.p1') }}</p>
            <p>{{ t('architecture.s6.p2') }}</p>
            <p>{{ t('architecture.s6.p3') }}</p>
            <p>{{ t('architecture.s6.p4') }}</p>
          </div>
          <div class="rounded border border-edge bg-field p-6">
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">
              {{ t('architecture.s6.oracle.title') }}
            </p>
            <ul class="mt-4 space-y-3 text-sm leading-relaxed text-ink-dim">
              <li v-for="k in oracleItems" :key="k" v-html="t(`architecture.s6.oracle.${k}`)" />
            </ul>
            <p class="mt-5 text-sm leading-relaxed text-ink-faint">
              {{ t('architecture.s6.oracle.note') }}
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
