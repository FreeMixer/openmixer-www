<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/** One plugin's entry in the newest catalog run: every fact and every reason, as measured. */
const { t } = useI18n();
const sitePath = useSitePath();
const { verdictLabel, verdictMeaning, dimensionLabel, ratingLabel, kindLabel } = usePluginText();
const route = useRoute();
const { run } = latestRun();
const row = catalogRows(run).find((r) => r.slug === route.params.slug);
if (!row) throw createError({ statusCode: 404, statusMessage: t('plugins.entry.notFound'), fatal: true });
const p = row;

const RATING_COLOR: Record<Rating, 'success' | 'warning' | 'neutral' | 'error'> = {
  suitable: 'success',
  conditional: 'warning',
  unknown: 'neutral',
  unsuitable: 'error',
};
const day = runDay(run.run.date);

const facts = computed(() => {
  const f = (k: string, params?: Record<string, string | number>) => t(`plugins.entry.facts.${k}`, params ?? {});
  return [
    { term: f('uri'), value: p.uri, mono: true },
    { term: f('vendor'), value: p.vendor ?? f('vendorNone') },
    { term: f('format'), value: p.alsoAs ? f('formatAlso', { format: p.format.toUpperCase(), other: p.alsoAs.format.toUpperCase() }) : p.format.toUpperCase() },
    { term: f('class'), value: p.declaredClass.join(', ') || f('classNone') },
    { term: f('package'), value: p.package ? `${p.package.nevr}.${p.package.arch}` : f('packageNone'), mono: !!p.package },
    ...(p.pluginVersion ? [{ term: f('version'), value: p.pluginVersion, mono: true }] : []),
    { term: f('run'), value: f('runValue', { day, rate: run.run.rig.rate, quantum: run.run.rig.quantum }) },
    { term: f('io'), value: f(p.io.midiIn ? 'ioMidi' : 'ioValue', { inputs: p.io.audioInputs, outputs: p.io.audioOutputs }) },
    { term: f('latencyClass'), value: p.latency.class ?? f('notMeasured') },
    ...(p.latency.hostingMs !== null
      ? [{ term: f('hosting'), value: f('hostingValue', { quanta: p.latency.hostingQuanta ?? 0, ms: p.latency.hostingMs.toFixed(1) }) }]
      : []),
    { term: f('cpu'), value: p.cost.coreFractionP95 === null ? f('notMeasured') : f('cpuValue', { pct: pct(p.cost.coreFractionP95) }) },
  ];
});

useSeoMeta({
  title: () => t('plugins.seo.entryTitle', { name: p.name }),
  description: () => p.vendor
    ? t('plugins.seo.entryDescriptionVendor', { name: p.name, vendor: p.vendor, verdict: verdictLabel(p.verdict), day })
    : t('plugins.seo.entryDescription', { name: p.name, verdict: verdictLabel(p.verdict), day }),
});
</script>

<template>
  <div>
    <PageHero :eyebrow="t('plugins.entry.heroEyebrow', { format: p.format.toUpperCase(), kind: kindLabel(p.kind) })" :title="p.name" :lede="p.vendor ? t('plugins.entry.by', { vendor: p.vendor }) : undefined">
      <div class="mt-8 flex flex-wrap items-center gap-4">
        <UBadge :color="VERDICT_COLOR[p.verdict]" variant="subtle" size="lg">{{ verdictLabel(p.verdict) }}</UBadge>
        <p class="max-w-2xl text-sm text-ink-dim">{{ verdictMeaning(p.verdict) }}</p>
      </div>
    </PageHero>

    <section class="border-b border-edge">
      <div class="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[2fr_3fr]">
        <div>
          <SectionHead :eyebrow="t('plugins.entry.factsEyebrow')" :title="t('plugins.entry.factsTitle')" />
          <dl class="divide-y divide-edge rounded border border-edge">
            <div v-for="f in facts" :key="f.term" class="px-4 py-3">
              <dt class="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{{ f.term }}</dt>
              <dd class="mt-1 break-words text-sm text-ink" :class="{ 'font-mono text-xs': f.mono }">{{ f.value }}</dd>
            </div>
          </dl>
        </div>

        <div>
          <SectionHead :eyebrow="t('plugins.entry.measEyebrow')" :title="t('plugins.entry.measTitle')" />
          <ul class="divide-y divide-edge rounded border border-edge">
            <li v-for="r in p.reasons" :key="r.code" class="px-4 py-3" :class="{ 'bg-surface': r.code === p.deciding }">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{{ dimensionLabel(r.dimension) }}</span>
                <UBadge :color="RATING_COLOR[r.rating]" variant="subtle" size="sm">{{ ratingLabel(r.rating) }}</UBadge>
                <span v-if="r.code === p.deciding" class="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">{{ t('plugins.entry.deciding') }}</span>
              </div>
              <p class="mt-2 text-sm leading-relaxed text-ink">{{ r.text }}</p>
              <p class="mt-1 font-mono text-[11px] text-ink-faint">{{ r.code }}</p>
            </li>
          </ul>

          <div v-if="p.incidents.length" class="mt-8">
            <h3 class="font-display text-lg font-semibold text-ink">{{ t('plugins.entry.incidents') }}</h3>
            <ul class="mt-3 space-y-2 text-sm text-ink-dim">
              <li v-for="i in p.incidents" :key="`${i.kind}-${i.code}`">{{ i.text }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-12">
        <p class="max-w-2xl text-sm leading-relaxed text-ink-dim">
          {{ t('plugins.entry.footerPackage', { what: p.package ? p.package.nevr : t('plugins.entry.footerBinary'), day }) }}
        </p>
        <div class="flex flex-wrap gap-3">
          <UButton :to="reportUrl(p, run.run.date)" target="_blank" color="primary" variant="solid" icon="i-lucide-flag">{{ t('plugins.entry.report') }}</UButton>
          <UButton :to="sitePath('/plugins')" color="neutral" variant="outline" icon="i-lucide-arrow-left">{{ t('plugins.entry.all') }}</UButton>
        </div>
      </div>
    </section>
  </div>
</template>
