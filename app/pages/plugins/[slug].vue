<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/** One plugin's entry in the newest catalog run: every fact and every reason, as measured. */
const route = useRoute();
const { run } = latestRun();
const row = catalogRows(run).find((r) => r.slug === route.params.slug);
if (!row) throw createError({ statusCode: 404, statusMessage: 'No such plugin in the catalog', fatal: true });
const p = row;

const RATING: Record<Rating, { label: string; color: 'success' | 'warning' | 'neutral' | 'error' }> = {
  suitable: { label: 'Passed', color: 'success' },
  conditional: { label: 'Caution', color: 'warning' },
  unknown: { label: 'Not measured', color: 'neutral' },
  unsuitable: { label: 'Failed', color: 'error' },
};
const KIND: Record<Kind, string> = { effect: 'effect', instrument: 'instrument', other: 'plugin' };
const day = runDay(run.run.date);

const facts = [
  { term: 'URI', value: p.uri, mono: true },
  { term: 'Vendor', value: p.vendor ?? 'Not declared by the plugin' },
  { term: 'Format', value: p.alsoAs ? `${p.format.toUpperCase()} (also available as ${p.alsoAs.format.toUpperCase()})` : p.format.toUpperCase() },
  { term: 'Declared class', value: p.declaredClass.join(', ') || 'None declared' },
  { term: 'Package tested', value: p.package ? `${p.package.nevr}.${p.package.arch}` : 'Not installed from a package', mono: !!p.package },
  ...(p.pluginVersion ? [{ term: 'Plugin version', value: p.pluginVersion, mono: true }] : []),
  { term: 'Run', value: `${day}, ${run.run.rig.rate} Hz, ${run.run.rig.quantum}-frame quantum` },
  { term: 'Inputs and outputs', value: `${p.io.audioInputs} in, ${p.io.audioOutputs} out${p.io.midiIn ? ', MIDI in' : ''}` },
  { term: 'Latency class', value: p.latency.class ?? 'Not measured' },
  ...(p.latency.hostingMs !== null
    ? [{ term: 'Latency added by hosting', value: `${p.latency.hostingQuanta} quantum, ${p.latency.hostingMs.toFixed(1)} ms` }]
    : []),
  { term: 'CPU, 95th percentile', value: p.cost.coreFractionP95 === null ? 'Not measured' : `${pct(p.cost.coreFractionP95)} of one core` },
];

useSeoMeta({
  title: `${p.name} — plugin catalog — openmixer`,
  description: `${p.name}${p.vendor ? ` by ${p.vendor}` : ''}: ${VERDICT_LABEL[p.verdict]} in the openmixer plugin catalog run of ${day}.`,
});
</script>

<template>
  <div>
    <PageHero :eyebrow="`Plugin catalog · ${p.format.toUpperCase()} ${KIND[p.kind]}`" :title="p.name" :lede="p.vendor ? `by ${p.vendor}` : undefined">
      <div class="mt-8 flex flex-wrap items-center gap-4">
        <UBadge :color="VERDICT_COLOR[p.verdict]" variant="subtle" size="lg">{{ VERDICT_LABEL[p.verdict] }}</UBadge>
        <p class="max-w-2xl text-sm text-ink-dim">{{ VERDICT_MEANING[p.verdict] }}</p>
      </div>
    </PageHero>

    <section class="border-b border-edge">
      <div class="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[2fr_3fr]">
        <div>
          <SectionHead eyebrow="Facts" title="What was tested." />
          <dl class="divide-y divide-edge rounded border border-edge">
            <div v-for="f in facts" :key="f.term" class="px-4 py-3">
              <dt class="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{{ f.term }}</dt>
              <dd class="mt-1 break-words text-sm text-ink" :class="{ 'font-mono text-xs': f.mono }">{{ f.value }}</dd>
            </div>
          </dl>
        </div>

        <div>
          <SectionHead eyebrow="Measurements" title="Every reason, by dimension." />
          <ul class="divide-y divide-edge rounded border border-edge">
            <li v-for="r in p.reasons" :key="r.code" class="px-4 py-3" :class="{ 'bg-surface': r.code === p.deciding }">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{{ DIMENSION_LABEL[r.dimension] }}</span>
                <UBadge :color="RATING[r.rating].color" variant="subtle" size="sm">{{ RATING[r.rating].label }}</UBadge>
                <span v-if="r.code === p.deciding" class="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Deciding</span>
              </div>
              <p class="mt-2 text-sm leading-relaxed text-ink">{{ r.text }}</p>
              <p class="mt-1 font-mono text-[11px] text-ink-faint">{{ r.code }}</p>
            </li>
          </ul>

          <div v-if="p.incidents.length" class="mt-8">
            <h3 class="font-display text-lg font-semibold text-ink">Crashes and timeouts</h3>
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
          This entry is for {{ p.package ? p.package.nevr : 'the binary installed on the test machine' }}, measured on {{ day }}.
          If you maintain this plugin and something here is wrong or out of date, tell us.
        </p>
        <div class="flex flex-wrap gap-3">
          <UButton :to="reportUrl(p, run.run.date)" target="_blank" color="primary" variant="solid" icon="i-lucide-flag">Report a mistake</UButton>
          <UButton to="/plugins" color="neutral" variant="outline" icon="i-lucide-arrow-left">All plugins</UButton>
        </div>
      </div>
    </section>
  </div>
</template>
