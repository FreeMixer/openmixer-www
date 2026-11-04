<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * The plugin catalog: what the qualification records say about each plugin, per platform. The
 * headline counts come from index.json, which is small and part of the page. The rows of a
 * platform are a separate file the browser fetches when that platform is shown, and the list is
 * paged, so the page stays light however many plugins a platform holds.
 */
import catalogIndex from '../../data/plugin-catalog/index.json';

const { t, te } = useI18n();
const index = catalogIndex as unknown as CatalogIndex;
const platforms = index.platforms;
const PAGE_SIZE = 50;

const loaders = import.meta.glob<PlatformFile>('../../data/plugin-catalog/platforms/*.json', { import: 'default' });

const total = platforms.reduce((n, p) => n + p.tested, 0);
const sourceUrl = `https://github.com/FreeMixer/${index.source.repo}/tree/${index.source.commit}`;
const docsUrl = 'https://github.com/FreeMixer/openmixer-www/tree/main/plugin-catalog';

const platformName = (id: string) => t(`plugins.platform.${id}.name`);
const verdictLabel = (v: Verdict) => t(`plugins.verdict.${v}.label`);
const reasonShort = (code: string) => t(reasonKey(code).replace('plugins.reason.', 'plugins.reasonShort.'));
const reasonText = (r: CatalogReason) => t(reasonKey(r.code), { ...r.params });
const hostLabel = (h: string) => (te(`plugins.host.${h}`) ? t(`plugins.host.${h}`) : h);

const RATING_COLOR: Record<Rating, 'success' | 'warning' | 'neutral' | 'error'> = {
  suitable: 'success',
  conditional: 'warning',
  unknown: 'neutral',
  unsuitable: 'error',
};

const platform = ref(platforms[0]!.id);
const search = ref('');
const format = ref(ANY);
const verdict = ref(ANY);
const pkg = ref('');
const page = ref(1);
const open = ref<Set<string>>(new Set());
const rows = shallowRef<readonly CatalogRow[]>([]);
const status = ref<'loading' | 'ready' | 'failed'>('loading');

const current = computed(() => platforms.find((p) => p.id === platform.value)!);

async function load(id: string) {
  status.value = 'loading';
  rows.value = [];
  try {
    const loader = loaders[`../../data/plugin-catalog/platforms/${id}.json`];
    if (!loader) throw new Error(id);
    const file = await loader();
    if (platform.value !== id) return;
    rows.value = file.rows;
    status.value = 'ready';
  } catch {
    if (platform.value === id) status.value = 'failed';
  }
}
onMounted(() => load(platform.value));
watch(platform, (id) => {
  open.value = new Set();
  page.value = 1;
  void load(id);
});
watch([search, format, verdict, pkg], () => {
  page.value = 1;
});

const formatItems = computed(() => [
  { label: t('plugins.list.anyFormat'), value: ANY },
  ...Object.keys(current.value.formats).sort().map((f) => ({ label: f.toUpperCase(), value: f })),
]);
const verdictItems = computed(() => [
  { label: t('plugins.list.anyVerdict'), value: ANY },
  ...VERDICT_ORDER.map((v) => ({ label: verdictLabel(v), value: v })),
]);
const platformItems = platforms.map((p) => ({ label: platformName(p.id), value: p.id }));

const filtered = computed(() => filterRows(rows.value, { search: search.value, format: format.value, verdict: verdict.value, pkg: pkg.value }));
const shown = computed(() => pageOf(filtered.value, page.value, PAGE_SIZE));
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)));

const keyOf = (r: CatalogRow) => `${r.format}:${r.id}`;
function toggle(r: CatalogRow) {
  const next = new Set(open.value);
  if (!next.delete(keyOf(r))) next.add(keyOf(r));
  open.value = next;
}

const reasonRows = (counts: Readonly<Record<string, number>>) => Object.entries(counts).sort(([, a], [, b]) => b - a);
const tiles = (p: PlatformSummary) => [
  { label: t('plugins.tiles.tested'), value: p.tested },
  ...VERDICT_ORDER.map((v) => ({ label: t(`plugins.tiles.${v}`), value: p.verdicts[v] })),
];
const conditionRows = (p: PlatformSummary) => Object.entries(p.conditions).map(([k, v]) => ({ term: t(`plugins.conditions.${k}`), value: v }));
const day = (iso: string) => iso.slice(0, 10);

useSeoMeta({
  title: () => t('plugins.seo.title'),
  description: () => t('plugins.seo.description', { count: total, platforms: platforms.length }),
});
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('plugins.hero.eyebrow')"
      :title="t('plugins.hero.title')"
      :lede="t('plugins.hero.lede', { count: total, platforms: platforms.length })"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('plugins.platforms.eyebrow')" :title="t('plugins.platforms.title')">
          <p class="mt-3 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ t('plugins.platforms.lede') }}</p>
        </SectionHead>

        <div class="space-y-12">
          <article v-for="p in platforms" :key="p.id">
            <h3 class="font-display text-2xl font-semibold text-ink">{{ platformName(p.id) }}</h3>
            <p class="mt-1 text-sm text-ink-dim">
              {{ t('plugins.summary.formats', { lv2: p.formats.lv2 ?? 0, clap: p.formats.clap ?? 0, records: p.records }) }}
              {{ t('plugins.summary.measuredOn', { day: p.measured }) }}
            </p>
            <dl class="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded border border-edge bg-edge sm:grid-cols-4">
              <div v-for="tile in tiles(p)" :key="tile.label" class="bg-surface px-4 py-4">
                <dt class="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{{ tile.label }}</dt>
                <dd class="mt-1 font-display text-3xl font-semibold text-ink">{{ tile.value }}</dd>
              </div>
            </dl>

            <div class="mt-6 grid gap-8 lg:grid-cols-2">
              <div v-for="kind in (['refused', 'conditional'] as const)" :key="kind">
                <template v-if="Object.keys(p.reasons[kind]).length">
                  <h4 class="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{{ t(kind === 'refused' ? 'plugins.summary.refusedBy' : 'plugins.summary.conditionalBy') }}</h4>
                  <ul class="mt-2 divide-y divide-edge rounded border border-edge text-sm">
                    <li v-for="[code, count] in reasonRows(p.reasons[kind])" :key="code" class="flex items-baseline justify-between gap-4 px-4 py-2">
                      <span class="text-ink">{{ reasonShort(code) }}</span>
                      <span class="whitespace-nowrap font-mono text-xs text-ink-dim">{{ t('plugins.summary.reasonCount', { count }) }}</span>
                    </li>
                  </ul>
                </template>
              </div>
            </div>

            <details class="mt-6">
              <summary class="cursor-pointer font-mono text-xs text-ink-faint">{{ t('plugins.summary.conditions') }}</summary>
              <dl class="mt-3 divide-y divide-edge rounded border border-edge">
                <div v-for="c in conditionRows(p)" :key="c.term" class="px-4 py-3">
                  <dt class="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{{ c.term }}</dt>
                  <dd class="mt-1 break-words text-sm text-ink">{{ c.value }}</dd>
                </div>
              </dl>
            </details>
          </article>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('plugins.list.eyebrow')" :title="t('plugins.list.title')">
          <p class="mt-3 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ t('plugins.list.lede') }}</p>
        </SectionHead>

        <div class="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <UInput v-model="search" icon="i-lucide-search" :placeholder="t('plugins.list.search')" :aria-label="t('plugins.list.searchLabel')" class="w-full" />
          <USelect v-model="platform" :items="platformItems" :aria-label="t('plugins.list.platformLabel')" class="w-full" />
          <USelect v-model="format" :items="formatItems" :aria-label="t('plugins.list.formatLabel')" class="w-full" />
          <USelect v-model="verdict" :items="verdictItems" :aria-label="t('plugins.list.verdictLabel')" class="w-full" />
          <UInput v-model="pkg" icon="i-lucide-package" :placeholder="t('plugins.list.packagePlaceholder')" :aria-label="t('plugins.list.packageLabel')" class="w-full sm:col-span-2" />
        </div>

        <p v-if="status === 'ready'" class="mb-3 font-mono text-xs text-ink-faint">{{ t('plugins.list.shown', { shown: filtered.length, total: rows.length }) }}</p>
        <p v-else-if="status === 'loading'" class="mb-3 font-mono text-xs text-ink-faint" role="status">{{ t('plugins.list.loading') }}</p>
        <p v-else class="mb-3 text-sm text-ink-dim" role="alert">{{ t('plugins.list.loadFailed') }}</p>

        <div v-if="status === 'ready'" class="overflow-hidden rounded border border-edge">
          <table class="w-full text-left text-sm">
            <thead class="bg-surface font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              <tr>
                <th scope="col" class="px-4 py-3 font-normal">{{ t('plugins.table.plugin') }}</th>
                <th scope="col" class="px-4 py-3 font-normal">{{ t('plugins.table.verdict') }}</th>
                <th scope="col" class="hidden px-4 py-3 font-normal lg:table-cell">{{ t('plugins.table.reason') }}</th>
                <th scope="col" class="hidden px-4 py-3 font-normal sm:table-cell">{{ t('plugins.table.format') }}</th>
                <th scope="col" class="hidden px-4 py-3 text-right font-normal md:table-cell">{{ t('plugins.table.cpu') }}</th>
                <th scope="col" class="hidden px-4 py-3 font-normal xl:table-cell">{{ t('plugins.table.package') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-edge">
              <template v-for="r in shown" :key="keyOf(r)">
                <tr class="align-top hover:bg-surface/60">
                  <td class="px-4 py-3">
                    <button
                      type="button"
                      class="break-all text-left font-medium text-ink hover:text-accent"
                      :aria-expanded="open.has(keyOf(r))"
                      :aria-label="t(open.has(keyOf(r)) ? 'plugins.table.close' : 'plugins.table.open', { id: r.id })"
                      @click="toggle(r)"
                    >{{ r.id }}</button>
                  </td>
                  <td class="px-4 py-3">
                    <UBadge :color="VERDICT_COLOR[r.verdict]" variant="subtle" class="whitespace-nowrap">{{ verdictLabel(r.verdict) }}</UBadge>
                  </td>
                  <td class="hidden max-w-sm px-4 py-3 text-xs leading-relaxed text-ink-dim lg:table-cell">{{ r.reason ? reasonShort(r.reason) : '—' }}</td>
                  <td class="hidden px-4 py-3 font-mono text-xs text-ink-dim sm:table-cell">{{ r.format.toUpperCase() }}</td>
                  <td class="hidden whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-ink-dim md:table-cell">{{ r.cpu ? pct(cpuPercent(r.cpu)) : '—' }}</td>
                  <td class="hidden whitespace-nowrap px-4 py-3 font-mono text-xs text-ink-dim xl:table-cell">{{ r.binary }} {{ r.version ?? '' }}</td>
                </tr>
                <tr v-if="open.has(keyOf(r))" class="bg-surface/40">
                  <td colspan="6" class="px-4 py-5">
                    <div class="grid gap-8 lg:grid-cols-[3fr_2fr]">
                      <div>
                        <h4 class="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{{ t('plugins.detail.reasons') }}</h4>
                        <ul class="mt-2 divide-y divide-edge rounded border border-edge">
                          <li v-for="(reason, i) in r.reasons" :key="i" class="px-4 py-3">
                            <div class="flex flex-wrap items-center gap-2">
                              <span v-if="reason.dimension" class="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{{ t(`plugins.dimension.${reason.dimension}`) }}</span>
                              <UBadge v-if="reason.rating" :color="RATING_COLOR[reason.rating]" variant="subtle" size="sm">{{ t(`plugins.rating.${reason.rating}`) }}</UBadge>
                            </div>
                            <p class="mt-2 text-sm leading-relaxed text-ink">{{ reasonText(reason) }}</p>
                            <p class="mt-1 text-xs text-ink-faint">{{ t('plugins.detail.hosts', { hosts: reason.hosts.map(hostLabel).join(', ') }) }}</p>
                          </li>
                          <li v-for="code in r.notMeasured" :key="code" class="px-4 py-3">
                            <UBadge color="neutral" variant="subtle" size="sm">{{ t('plugins.rating.unknown') }}</UBadge>
                            <p class="mt-2 text-sm leading-relaxed text-ink">{{ t(reasonKey(code)) }}</p>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 class="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{{ t('plugins.detail.facts') }}</h4>
                        <dl class="mt-2 divide-y divide-edge rounded border border-edge text-sm">
                          <div class="px-4 py-2">
                            <dt class="text-xs text-ink-faint">{{ t('plugins.detail.binary') }}</dt>
                            <dd class="break-all font-mono text-xs text-ink">{{ r.binary }}</dd>
                          </div>
                          <div class="px-4 py-2">
                            <dt class="text-xs text-ink-faint">{{ t('plugins.detail.version') }}</dt>
                            <dd class="font-mono text-xs text-ink">{{ r.version ?? t('plugins.table.unversioned') }}</dd>
                          </div>
                          <div class="px-4 py-2">
                            <dt class="text-xs text-ink-faint">{{ t('plugins.detail.tiers') }}</dt>
                            <dd class="text-ink">{{ r.tiers.length ? r.tiers.map((x) => t(`plugins.tier.${x}`)).join(', ') : t('plugins.detail.tiersNone') }}</dd>
                          </div>
                          <div class="px-4 py-2">
                            <dt class="text-xs text-ink-faint">{{ t('plugins.detail.offers') }}</dt>
                            <dd v-for="o in r.offers" :key="o.offer" class="text-ink">{{ t('plugins.detail.offerLine', { offer: t(`plugins.offer.${o.offer}`), verdict: verdictLabel(o.verdict) }) }}</dd>
                          </div>
                          <div class="px-4 py-2">
                            <dt class="text-xs text-ink-faint">{{ t('plugins.detail.cpu') }}</dt>
                            <dd class="text-ink">{{ r.cpu ? t('plugins.detail.cpuValue', { pct: pct(cpuPercent(r.cpu)), rate: r.cpu.rate, quantum: r.cpu.quantum }) : t('plugins.detail.notMeasured') }}</dd>
                          </div>
                          <div class="px-4 py-2">
                            <dt class="text-xs text-ink-faint">{{ t('plugins.detail.latency') }}</dt>
                            <dd class="text-ink">{{ r.latency ? t('plugins.detail.latencyValue', { measured: r.latency.measured, declared: r.latency.declared, ms: latencyMs(r.latency).toFixed(1) }) : t('plugins.detail.notMeasured') }}</dd>
                          </div>
                          <div class="px-4 py-2">
                            <dt class="text-xs text-ink-faint">{{ t('plugins.detail.measuredAt') }}</dt>
                            <dd class="font-mono text-xs text-ink">{{ day(r.measuredAt) }}</dd>
                          </div>
                        </dl>
                        <p class="mt-3 text-sm">
                          <a :href="reportUrl(r, current.measured)" class="text-accent hover:underline" rel="noopener">{{ t('plugins.detail.report') }}</a>
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-if="shown.length === 0">
                <td colspan="6" class="px-4 py-6 text-center text-sm text-ink-dim">{{ t('plugins.table.empty') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <nav v-if="status === 'ready' && pages > 1" class="mt-4 flex items-center justify-between gap-4" :aria-label="t('plugins.paging.label')">
          <UButton color="neutral" variant="outline" icon="i-lucide-chevron-left" :disabled="page <= 1" :aria-label="t('plugins.paging.previous')" @click="page -= 1" />
          <p class="font-mono text-xs text-ink-faint">{{ t('plugins.paging.page', { page, pages }) }}</p>
          <UButton color="neutral" variant="outline" icon="i-lucide-chevron-right" :disabled="page >= pages" :aria-label="t('plugins.paging.next')" @click="page += 1" />
        </nav>
      </div>
    </section>

    <section>
      <div class="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2">
        <div>
          <SectionHead :eyebrow="t('plugins.reading.eyebrow')" :title="t('plugins.reading.title')" />
          <dl class="space-y-4">
            <div v-for="v in VERDICT_ORDER" :key="v">
              <dt><UBadge :color="VERDICT_COLOR[v]" variant="subtle">{{ verdictLabel(v) }}</UBadge></dt>
              <dd class="mt-1 text-sm leading-relaxed text-ink-dim">{{ t(`plugins.verdict.${v}.meaning`) }}</dd>
            </div>
          </dl>
          <p class="mt-6 text-sm leading-relaxed text-ink-dim">{{ t('plugins.reading.one') }}</p>
          <p class="mt-3 text-sm leading-relaxed text-ink-dim">{{ t('plugins.reading.two') }}</p>
        </div>
        <div>
          <SectionHead :eyebrow="t('plugins.data.eyebrow')" :title="t('plugins.data.title')" />
          <div class="space-y-4 text-sm leading-relaxed text-ink-dim">
            <p>{{ t('plugins.data.one') }}</p>
            <ul class="space-y-2">
              <li><a :href="sourceUrl" class="text-accent hover:underline">{{ t('plugins.data.records') }}</a></li>
              <li><a :href="docsUrl" class="text-accent hover:underline">{{ t('plugins.data.schema') }}</a></li>
            </ul>
            <p>{{ t('plugins.data.two') }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
