<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * The plugin catalog: what was measured about each plugin, from the newest run file in
 * plugin-catalog/runs/. Every count and figure here is derived from that file.
 */
const { file, run } = latestRun();
const rows = catalogRows(run);
const effects = rows.filter((r) => r.kind === 'effect');
const instruments = rows.filter((r) => r.kind === 'instrument');
const others = rows.filter((r) => r.kind === 'other');

const count = (v: Verdict) => rows.filter((r) => r.verdict === v).length;
const tiles = [
  { label: 'Tested', value: rows.length },
  ...VERDICT_ORDER.map((v) => ({ label: VERDICT_LABEL[v], value: count(v) })),
];

const day = runDay(run.run.date);
const source = run.run.source === 'qualify'
  ? 'the qualify job'
  : `the verdicts a running console (${run.run.producer.name}) held on that date`;
const dataUrl = `https://github.com/FreeMixer/openmixer-www/blob/main/${file}`;
const schemaUrl = 'https://github.com/FreeMixer/openmixer-www/tree/main/plugin-catalog';

const ALL = 'all';
const search = ref('');
const verdict = ref<string>(ALL);
const format = ref<string>(ALL);
const vendor = ref<string>(ALL);

const verdictItems = [{ label: 'Any verdict', value: ALL }, ...VERDICT_ORDER.map((v) => ({ label: VERDICT_LABEL[v], value: v }))];
const formatItems = [
  { label: 'Any format', value: ALL },
  ...[...new Set(effects.map((r) => r.format))].sort().map((f) => ({ label: f.toUpperCase(), value: f })),
];
const vendorItems = [
  { label: 'Any vendor', value: ALL },
  ...[...new Set(effects.map((r) => r.vendor ?? 'Unknown'))].sort().map((v) => ({ label: v, value: v })),
];

const shownEffects = computed(() => {
  const q = search.value.trim().toLowerCase();
  return effects.filter((r) =>
    (verdict.value === ALL || r.verdict === verdict.value)
    && (format.value === ALL || r.format === format.value)
    && (vendor.value === ALL || (r.vendor ?? 'Unknown') === vendor.value)
    && (!q || `${r.name} ${r.vendor ?? ''} ${r.uri} ${r.declaredClass.join(' ')}`.toLowerCase().includes(q)));
});

useSeoMeta({
  title: 'Plugin catalog — openmixer',
  description: `What openmixer measured about ${rows.length} audio plugins on ${day}: stability, real-time safety, CPU cost, latency, and whether each runs in-process.`,
});
</script>

<template>
  <div>
    <PageHero
      eyebrow="Plugin catalog"
      title="What we measured about each plugin."
      :lede="`Each plugin is loaded, run and measured before the console hosts it: stability over repeated load cycles and a long soak, allocations, locks and system calls in the audio callback, CPU cost, latency and its inputs and outputs. These are the results of the run of ${day}, at ${run.run.rig.rate} Hz and ${run.run.rig.quantum} frames, taken from ${source}.`"
    >
      <dl class="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded border border-edge bg-edge sm:grid-cols-5">
        <div v-for="t in tiles" :key="t.label" class="bg-surface px-4 py-4">
          <dt class="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{{ t.label }}</dt>
          <dd class="mt-1 font-display text-3xl font-semibold text-ink">{{ t.value }}</dd>
        </div>
      </dl>
    </PageHero>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="Effects" :title="`${effects.length} effects`">
          <p class="mt-3 max-w-3xl text-sm leading-relaxed text-ink-dim">
            Plugins that process a channel or a bus. Select a plugin for every reason behind its verdict.
          </p>
        </SectionHead>

        <div class="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <UInput v-model="search" icon="i-lucide-search" placeholder="Search name, vendor, URI" aria-label="Search effects" class="w-full" />
          <USelect v-model="verdict" :items="verdictItems" aria-label="Filter by verdict" class="w-full" />
          <USelect v-model="format" :items="formatItems" aria-label="Filter by format" class="w-full" />
          <USelect v-model="vendor" :items="vendorItems" aria-label="Filter by vendor" class="w-full" />
        </div>

        <p class="mb-3 font-mono text-xs text-ink-faint">{{ shownEffects.length }} of {{ effects.length }} shown</p>
        <PluginTable :rows="shownEffects" />
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="Instruments" :title="`${instruments.length} instruments`">
          <p class="mt-3 max-w-3xl text-sm leading-relaxed text-ink-dim">
            Instruments are for playing parts from the console, such as a MIDI sequence at a set clock
            and tempo. They are listed with the same measurements and are not ranked against effects.
          </p>
        </SectionHead>
        <PluginTable v-if="instruments.length" :rows="instruments" />
        <p v-else class="text-sm text-ink-dim">No instrument was part of this run.</p>
      </div>
    </section>

    <section v-if="others.length" class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="Other" :title="`${others.length} other plugins`">
          <p class="mt-3 max-w-3xl text-sm leading-relaxed text-ink-dim">
            Analysers, generators and utilities, as the plugins declare themselves.
          </p>
        </SectionHead>
        <PluginTable :rows="others" />
      </div>
    </section>

    <section>
      <div class="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2">
        <div>
          <SectionHead eyebrow="Reading the verdicts" title="What each verdict means." />
          <dl class="space-y-4">
            <div v-for="v in VERDICT_ORDER" :key="v">
              <dt><UBadge :color="VERDICT_COLOR[v]" variant="subtle">{{ VERDICT_LABEL[v] }}</UBadge></dt>
              <dd class="mt-1 text-sm leading-relaxed text-ink-dim">{{ VERDICT_MEANING[v] }}</dd>
            </div>
          </dl>
          <p class="mt-6 text-sm leading-relaxed text-ink-dim">
            A dimension counts as measured only past its threshold: {{ run.run.policy.cycleFloor }} load cycles,
            a {{ run.run.policy.soakSeconds / 3600 }}-hour soak, and a CPU cost of at most
            {{ pct(run.run.policy.coreFractionCeiling) }} of one core at the 95th percentile.
            The worst dimension decides the verdict.
          </p>
        </div>
        <div>
          <SectionHead eyebrow="The data" title="Where these figures come from." />
          <div class="space-y-4 text-sm leading-relaxed text-ink-dim">
            <p>
              Every figure on these pages is generated from one run file, published with its schema.
              The same file is installed on consoles by the <span class="font-mono text-ink">openmixer-plugin-catalog</span> package.
            </p>
            <ul class="space-y-2">
              <li><a :href="dataUrl" class="text-accent hover:underline">This run’s data ({{ file }})</a></li>
              <li><a :href="schemaUrl" class="text-accent hover:underline">The schema and how the fields are derived</a></li>
            </ul>
            <p>
              A result is for the package version and date shown on the plugin’s page. If you maintain a
              plugin and an entry is wrong or out of date, each plugin page has a link to report it.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
