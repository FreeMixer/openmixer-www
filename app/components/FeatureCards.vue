<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
import type { Surface } from '~/composables/useFeatureCards';

/**
 * The feature cards of one surface, all from the records. `full` shows the longer paragraph, the surfaces and the
 * figures; without it a card is one link with its title and its line. `exceptRows` leaves out the features that
 * already have a hand-built row on the features page.
 */
const props = defineProps<{ surface: Surface; group?: 'released' | 'coming' | 'all'; full?: boolean; exceptRows?: boolean }>();
const { t } = useI18n();
const sitePath = useSitePath();
const { forSurface, text, proofText } = useFeatureCards();
const list = computed(() => forSurface(props.surface, props.group ?? 'all').filter((c) => !(props.exceptRows && c.row)));
const SURFACES = ['console', 'zynthian', 'libraries'] as const;
</script>

<template>
  <div v-if="list.length" :class="full ? 'grid gap-5 lg:grid-cols-2' : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'">
    <template v-for="c in list" :key="c.id">
      <LinkCard v-if="!full" :title="text(c).title" :href="sitePath(c.detail)" :label="c.detail">
        <p>{{ text(c).line }}</p>
        <p class="pt-1"><SurfaceState :state="c.surfaces[surface].state as 'released'" /></p>
        <p v-if="c.surfaces[surface].version" class="font-mono text-xs text-ink-faint">{{ c.surfaces[surface].version }}</p>
      </LinkCard>
      <article v-else class="rounded border border-edge bg-surface/60 p-6">
        <div class="flex items-baseline gap-3">
          <h3 class="font-display text-lg font-semibold tracking-tight text-ink">{{ text(c).title }}</h3>
        </div>
        <p class="mt-2 text-base text-ink">{{ text(c).line }}</p>
        <p class="mt-3 text-sm leading-relaxed text-ink-dim">{{ text(c).text }}</p>
        <ul v-if="c.proof.length" class="mt-4 space-y-3 border-l-2 border-edge-strong pl-4 text-sm leading-relaxed text-ink-dim">
          <li v-for="(p, i) in c.proof" :key="i">
            <span>{{ proofText(p) }}</span>
            <span class="mt-1 block font-mono text-xs text-ink-faint">{{ t('featureCards.with') }}: {{ p.with }}<template v-if="p.rate"> · {{ p.rate }}</template></span>
          </li>
        </ul>
        <ul class="mt-4 flex flex-wrap gap-2">
          <template v-for="s in SURFACES" :key="s">
            <li v-if="c.surfaces[s].state !== 'none'" class="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
              <span class="font-mono uppercase tracking-[0.12em]">{{ t(`featureCards.surface.${s}`) }}</span>
              <SurfaceState :state="c.surfaces[s].state as 'released'" />
              <span v-if="c.surfaces[s].version" class="font-mono">{{ c.surfaces[s].version }}</span>
            </li>
          </template>
        </ul>
        <p class="mt-4 text-sm"><NuxtLink :to="sitePath(c.detail)" class="text-accent hover:underline">{{ t('featureCards.readMore') }}</NuxtLink></p>
      </article>
    </template>
  </div>
</template>
