<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * The plugin catalog: what was measured about each plugin, from the newest run file in
 * plugin-catalog/runs/. Every count and figure here is derived from that file.
 */
const { t } = useI18n();
const sitePath = useSitePath();
const { verdictLabel, verdictMeaning } = usePluginText();

const { file, run } = latestRun();
const rows = catalogRows(run);
const effects = rows.filter((r) => r.kind === 'effect');
const instruments = rows.filter((r) => r.kind === 'instrument');
const others = rows.filter((r) => r.kind === 'other');

const count = (v: Verdict) => rows.filter((r) => r.verdict === v).length;
const tiles = computed(() => [
  { label: t('plugins.tiles.tested'), value: rows.length },
  ...VERDICT_ORDER.map((v) => ({ label: verdictLabel(v), value: count(v) })),
]);

const day = runDay(run.run.date);
const source = computed(() => run.run.source === 'qualify'
  ? t('plugins.source.qualify')
  : t('plugins.source.console', { producer: run.run.producer.name }));
const dataUrl = `https://github.com/FreeMixer/openmixer-www/blob/main/${file}`;
const schemaUrl = 'https://github.com/FreeMixer/openmixer-www/tree/main/plugin-catalog';

const ALL = 'all';
const UNKNOWN_VENDOR = 'unknown-vendor';
const search = ref('');
const verdict = ref<string>(ALL);
const format = ref<string>(ALL);
const vendor = ref<string>(ALL);

const vendorOf = (r: CatalogRow) => r.vendor ?? UNKNOWN_VENDOR;
const verdictItems = computed(() => [
  { label: t('plugins.effects.anyVerdict'), value: ALL },
  ...VERDICT_ORDER.map((v) => ({ label: verdictLabel(v), value: v })),
]);
const formatItems = computed(() => [
  { label: t('plugins.effects.anyFormat'), value: ALL },
  ...[...new Set(effects.map((r) => r.format))].sort().map((f) => ({ label: f.toUpperCase(), value: f })),
]);
const vendorItems = computed(() => [
  { label: t('plugins.effects.anyVendor'), value: ALL },
  ...[...new Set(effects.map(vendorOf))].sort().map((v) => ({
    label: v === UNKNOWN_VENDOR ? t('plugins.effects.unknownVendor') : v,
    value: v,
  })),
]);

const shownEffects = computed(() => {
  const q = search.value.trim().toLowerCase();
  return effects.filter((r) =>
    (verdict.value === ALL || r.verdict === verdict.value)
    && (format.value === ALL || r.format === format.value)
    && (vendor.value === ALL || vendorOf(r) === vendor.value)
    && (!q || `${r.name} ${r.vendor ?? ''} ${r.uri} ${r.declaredClass.join(' ')}`.toLowerCase().includes(q)));
});

useSeoMeta({
  title: () => t('plugins.seo.title'),
  description: () => t('plugins.seo.description', { count: rows.length, day }),
});
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('plugins.hero.eyebrow')"
      :title="t('plugins.hero.title')"
      :lede="t('plugins.hero.lede', { day, rate: run.run.rig.rate, quantum: run.run.rig.quantum, source })"
    >
      <dl class="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded border border-edge bg-edge sm:grid-cols-5">
        <div v-for="tile in tiles" :key="tile.label" class="bg-surface px-4 py-4">
          <dt class="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{{ tile.label }}</dt>
          <dd class="mt-1 font-display text-3xl font-semibold text-ink">{{ tile.value }}</dd>
        </div>
      </dl>
    </PageHero>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('plugins.effects.eyebrow')" :title="t('plugins.effects.title', { count: effects.length })">
          <p class="mt-3 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ t('plugins.effects.lede') }}</p>
        </SectionHead>

        <div class="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <UInput v-model="search" icon="i-lucide-search" :placeholder="t('plugins.effects.search')" :aria-label="t('plugins.effects.searchLabel')" class="w-full" />
          <USelect v-model="verdict" :items="verdictItems" :aria-label="t('plugins.effects.verdictLabel')" class="w-full" />
          <USelect v-model="format" :items="formatItems" :aria-label="t('plugins.effects.formatLabel')" class="w-full" />
          <USelect v-model="vendor" :items="vendorItems" :aria-label="t('plugins.effects.vendorLabel')" class="w-full" />
        </div>

        <p class="mb-3 font-mono text-xs text-ink-faint">{{ t('plugins.effects.shown', { shown: shownEffects.length, total: effects.length }) }}</p>
        <PluginTable :rows="shownEffects" />
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('plugins.instruments.eyebrow')" :title="t('plugins.instruments.title', { count: instruments.length })">
          <p class="mt-3 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ t('plugins.instruments.lede') }}</p>
        </SectionHead>
        <PluginTable v-if="instruments.length" :rows="instruments" />
        <p v-else class="text-sm text-ink-dim">{{ t('plugins.instruments.none') }}</p>
      </div>
    </section>

    <section v-if="others.length" class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('plugins.others.eyebrow')" :title="t('plugins.others.title', { count: others.length })">
          <p class="mt-3 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ t('plugins.others.lede') }}</p>
        </SectionHead>
        <PluginTable :rows="others" />
      </div>
    </section>

    <section>
      <div class="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2">
        <div>
          <SectionHead :eyebrow="t('plugins.reading.eyebrow')" :title="t('plugins.reading.title')" />
          <dl class="space-y-4">
            <div v-for="v in VERDICT_ORDER" :key="v">
              <dt><UBadge :color="VERDICT_COLOR[v]" variant="subtle">{{ verdictLabel(v) }}</UBadge></dt>
              <dd class="mt-1 text-sm leading-relaxed text-ink-dim">{{ verdictMeaning(v) }}</dd>
            </div>
          </dl>
          <p class="mt-6 text-sm leading-relaxed text-ink-dim">
            {{ t('plugins.reading.threshold', { cycles: run.run.policy.cycleFloor, hours: run.run.policy.soakSeconds / 3600, ceiling: pct(run.run.policy.coreFractionCeiling) }) }}
          </p>
        </div>
        <div>
          <SectionHead :eyebrow="t('plugins.data.eyebrow')" :title="t('plugins.data.title')" />
          <div class="space-y-4 text-sm leading-relaxed text-ink-dim">
            <p>{{ t('plugins.data.one') }}</p>
            <ul class="space-y-2">
              <li><a :href="dataUrl" class="text-accent hover:underline">{{ t('plugins.data.runData', { file }) }}</a></li>
              <li><a :href="schemaUrl" class="text-accent hover:underline">{{ t('plugins.data.schema') }}</a></li>
            </ul>
            <p>{{ t('plugins.data.two') }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
