<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * The benchmarks: the same scenarios on the plugin hosts, from the newest run of each machine
 * class in benchmarks/runs/. Every figure on the page is read from a run or computed from two
 * of its figures, and none is rounded. A row that failed or had an xrun is marked and stays in
 * its table, and the rows of the same day's other runs that did not pass are listed apart.
 */
const { t, te } = useI18n();

const all = benchRuns();
const latest = benchLatest();
const classItems = CLASSES.map((c) => ({ label: t(`benchmarks.classes.${c}`), value: c }));
const selected = ref<MachineClass>(CLASSES.find((c) => latest.has(c)) ?? CLASSES[0]!);
const run = computed(() => latest.get(selected.value) ?? null);

const khz = (rate: number) => `${rate / 1000} kHz`;
const where = (rate: number, frames: number) => t('benchmarks.where', { rate: khz(rate), frames });
const range = (r: readonly [number, number] | null) => (r ? t('benchmarks.family.range', { low: show(r[0]), high: show(r[1]) }) : '');

const hostsInRun = computed(() => HOSTS.filter((h) => run.value?.scenarios.some((s) => s.host === h)));
const variantLabel = (host: HostId, mode: string | undefined) => {
  const key = `benchmarks.variant.${host}_${mode || 'default'}`;
  return te(key) ? t(key) : t(`benchmarks.hosts.${host}`);
};
const familyTitle = (f: { id: string; title: string }) => (te(`benchmarks.scenario.${f.id}`) ? t(`benchmarks.scenario.${f.id}`) : f.title);

const tables = computed(() => {
  const r = run.value;
  if (!r) return [];
  return families(r).map((f) => {
    const rows = compareRows(r, f.id);
    return { ...f, title: familyTitle(f), cols: variants(r, f.id), rows, scale: barScale(rows) };
  });
});

const lowestGroups = computed(() => (run.value ? lowestBuffers(run.value) : []));
const lowestTitle = (g: { family: string; title: string }) => familyTitle({ id: g.family, title: g.title });
const lowestHostName = (h: { host: HostId; mode?: string }) => variantLabel(h.host, h.mode);
const num = (n: number) => String(Number.isInteger(n) ? n : Math.round(n * 100) / 100);
/** "Half the buffer of mod-host" only when the data says exactly that; otherwise the plain ratio. */
const versus = (ratio: number | null, ref: string) => {
  if (ratio === null) return '—';
  const r = { ref };
  if (ratio === 1) return t('benchmarks.lowest.same');
  if (ratio === 2) return t('benchmarks.lowest.half', r);
  if (ratio === 4) return t('benchmarks.lowest.quarter', r);
  return ratio > 1 ? t('benchmarks.lowest.smaller', { ...r, n: num(ratio) }) : t('benchmarks.lowest.larger', { ...r, n: num(1 / ratio) });
};
const lowestText = (c: LowestCell) => {
  if (c.kind === 'none') return t('benchmarks.lowest.none', { frames: c.smallest, ms: num(Math.round(c.ms * 100) / 100) });
  if (c.kind === 'unsupported') return t('benchmarks.lowest.unsupported', { note: c.note || t('benchmarks.lowest.noReason') });
  if (c.kind === 'failed') return t('benchmarks.lowest.failed', { note: c.note || t('benchmarks.lowest.noReason') });
  return t('benchmarks.lowest.notMeasured');
};

const failing = computed(() => {
  const r = run.value;
  return r ? failingRows(sameDayRuns(all, r)) : [];
});
/** What the run's own failing rows mean, when the page has words for that run. */
const failingWhy = computed(() => {
  const key = `benchmarks.failing.why.${(run.value?.id ?? '').replace(/-/g, '_')}`;
  return run.value && te(key) ? t(key) : '';
});
const stress = computed(() => (run.value ? stressRows(run.value) : []));
/** The first clause of a failure note: the rest is the process listing the harness kept. */
const shortNote = (n?: string) => (n ?? '').split(';')[0] ?? '';

const method = computed(() => {
  const r = run.value;
  const s = r?.scenarios.find((x) => x.status === 'ok');
  if (!r || !s) return null;
  const repeats = Math.max(...r.scenarios.map((x) => x.repeats ?? 1));
  if (r.jack) {
    const rates = [...new Set(r.scenarios.map((x) => x.rate))].sort((a, b) => a - b).map(khz).join(', ');
    return t('benchmarks.method.card', { machine: r.machine.model, governor: r.machine.governor ?? '—', driver: r.jack.driver, device: r.jack.device ?? '—', priority: r.jack.priority ?? '—', periods: r.jack.periods ?? '—', rates, repeats });
  }
  return t('benchmarks.method.text', { machine: r.machine.model, governor: r.machine.governor ?? '—', rate: khz(s.rate), frames: s.frames, repeats });
});
const mixedVersions = computed(() => new Set((run.value?.scenarios ?? []).map((s) => s.software?.['omx-clap-core']).filter(Boolean)).size > 1);

interface Pivot<R> { readonly key: string; readonly label: string; readonly cells: Map<string, R> }
/** Rows of add times as a table: one line per set (or plugin count), one column per host and mode. */
function pivot(rows: readonly AddTime[], by: (a: AddTime) => string, label: (a: AddTime) => string) {
  const cols = new Map<string, { host: HostId; mode: Mode }>();
  const lines = new Map<string, Pivot<AddTime>>();
  for (const a of rows) {
    cols.set(variantKey(a), { host: a.host, mode: a.mode });
    const line = lines.get(by(a)) ?? { key: by(a), label: label(a), cells: new Map() };
    line.cells.set(variantKey(a), a);
    lines.set(by(a), line);
  }
  const order = [...cols.keys()].sort((a, b) => {
    const rank = (k: string) => { const i = ['H2|chain', 'H1|shared-process', 'H3|shared-process', 'H2|individual'].indexOf(k); return i < 0 ? 9 : i; };
    return rank(a) - rank(b);
  });
  return { cols: order.map((k) => ({ key: k, ...cols.get(k)! })), lines: [...lines.values()] };
}
const lowest = (line: Pivot<AddTime>) => Math.min(...[...line.cells.values()].map((a) => a.median_ms));
const cold = computed(() => pivot(run.value?.add_times?.cold ?? [], (a) => `${a.set}|${a.builds}`, (a) => `${a.set}, ${a.builds}`));
const warm = computed(() => pivot(run.value?.add_times?.warm ?? [], (a) => String(a.plugins), (a) => String(a.plugins)));

/** Instruments: one line per instrument and host, one column per note count. */
const instruments = computed(() => {
  const list = run.value?.instruments ?? [];
  const notes = [...new Set(list.map((i) => i.notes))].sort((a, b) => a - b);
  const lines = new Map<string, { name: string; host: Instrument['host']; cells: Map<number, Instrument> }>();
  for (const i of list) {
    const k = `${i.name}|${i.host}`;
    const l = lines.get(k) ?? { name: i.name, host: i.host, cells: new Map() };
    l.cells.set(i.notes, i);
    lines.set(k, l);
  }
  return { notes, lines: [...lines.values()] };
});
const hostName = (h: Instrument['host']) => (h === 'standalone' ? t('benchmarks.instruments.standalone') : t(`benchmarks.hosts.${h}`));

const machineLine = (r: BenchRun) => t('benchmarks.machine', { model: r.machine.model, os: r.machine.os });
/** The run's date, from its id (<class>-<yyyymmdd>-<n>): data for the footer, never body text. */
const runDate = (r: BenchRun) => { const m = /-(\d{4})(\d{2})(\d{2})-/.exec(r.id); return m ? `${m[1]}-${m[2]}-${m[3]}` : ''; };
const softwareLine = (r: BenchRun) => Object.entries(r.software).map(([k, v]) => `${k} ${v}`).join(', ');
const harnessUrl = 'https://github.com/FreeMixer/plugin-hostd/blob/main/README.md';
const dataUrl = 'https://github.com/FreeMixer/openmixer-www/tree/main/benchmarks';

useSeoMeta({
  title: () => t('benchmarks.seo.title'),
  description: () => t('benchmarks.seo.description'),
});
</script>

<template>
  <div>
    <PageHero :eyebrow="t('benchmarks.hero.eyebrow')" :title="t('benchmarks.hero.title')" :lede="t('benchmarks.hero.lede')">
      <p class="mt-4 max-w-3xl text-sm leading-relaxed text-ink-dim">
        {{ t('benchmarks.hero.reproduce') }}
        <a :href="harnessUrl" class="text-accent hover:underline">{{ t('benchmarks.hero.readme') }}</a>
      </p>
      <dl class="mt-8 grid gap-px overflow-hidden rounded border border-edge bg-edge sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="h in (hostsInRun.length ? hostsInRun : HOSTS)" :key="h" class="bg-surface px-4 py-4">
          <dt class="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{{ t(`benchmarks.hosts.${h}`) }}</dt>
          <dd class="mt-2 text-sm leading-relaxed text-ink-dim">{{ t(`benchmarks.hostMeaning.${h}`) }}</dd>
        </div>
      </dl>
      <div class="mt-8 max-w-xs">
        <USelect v-model="selected" :items="classItems" :aria-label="t('benchmarks.classLabel')" class="w-full" />
      </div>
    </PageHero>

    <section v-if="!run" class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <p class="text-sm text-ink-dim">{{ t('benchmarks.noRun') }}</p>
      </div>
    </section>

    <template v-else>
      <section v-if="lowestGroups.length" class="border-b border-edge">
        <div class="mx-auto max-w-6xl px-6 py-16">
          <SectionHead :eyebrow="t('benchmarks.lowest.eyebrow')" :title="t('benchmarks.lowest.title')">
            <p class="mt-3 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ t('benchmarks.lowest.lede') }}</p>
          </SectionHead>
          <div class="overflow-x-auto rounded border border-edge">
            <table class="w-full text-left text-sm">
              <thead class="bg-surface font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                <tr>
                  <th scope="col" class="px-4 py-3 font-normal">{{ t('benchmarks.lowest.host') }}</th>
                  <th scope="col" class="px-4 py-3 font-normal">{{ t('benchmarks.lowest.frames') }}</th>
                  <th scope="col" class="px-4 py-3 font-normal">{{ t('benchmarks.lowest.ms') }}</th>
                  <th scope="col" class="px-4 py-3 font-normal">{{ t('benchmarks.lowest.vsMod') }}</th>
                  <th scope="col" class="px-4 py-3 font-normal">{{ t('benchmarks.lowest.vsJalv') }}</th>
                </tr>
              </thead>
              <tbody v-for="g in lowestGroups" :key="`${g.family}-${g.rate}`" class="divide-y divide-edge border-t border-edge">
                <tr class="bg-surface">
                  <th scope="colgroup" colspan="5" class="px-4 py-2 text-left font-medium text-ink">{{ lowestTitle(g) }}, {{ khz(g.rate) }}</th>
                </tr>
                <tr v-for="l in g.lines" :key="l.host.key" class="align-top">
                  <th scope="row" class="px-4 py-3 font-normal text-ink">{{ lowestHostName(l.host) }}</th>
                  <template v-if="l.cell.kind === 'clean'">
                    <td class="px-4 py-3 font-medium text-ink">{{ l.cell.frames }}</td>
                    <td class="px-4 py-3 text-ink">{{ num(Math.round(l.cell.ms * 100) / 100) }} ms</td>
                    <td class="px-4 py-3 text-ink-dim">{{ l.host.key === 'H3' ? '—' : versus(l.cell.vsModHost, t('benchmarks.hosts.H3')) }}</td>
                    <td class="px-4 py-3 text-ink-dim">{{ l.host.key === 'H4' ? '—' : versus(l.cell.vsJalv, t('benchmarks.hosts.H4')) }}</td>
                  </template>
                  <td v-else colspan="4" class="px-4 py-3 text-ink-faint">{{ lowestText(l.cell) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-3 max-w-3xl text-xs leading-relaxed text-ink-faint">{{ t('benchmarks.lowest.unit') }}</p>
        </div>
      </section>

      <section v-if="method" class="border-b border-edge">
        <div class="mx-auto max-w-6xl px-6 py-10">
          <h2 class="font-display text-lg font-semibold text-ink">{{ t('benchmarks.method.title') }}</h2>
          <p class="mt-2 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ method }}</p>
          <p v-if="mixedVersions" class="mt-2 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ t('benchmarks.method.versions') }}</p>
        </div>
      </section>

      <section v-for="tbl in tables" :key="tbl.id" class="border-b border-edge">
        <div class="mx-auto max-w-6xl px-6 py-16">
          <SectionHead :eyebrow="t('benchmarks.family.eyebrow')" :title="tbl.title">
            <p class="mt-3 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ t('benchmarks.family.lede') }}</p>
          </SectionHead>
          <div class="overflow-x-auto rounded border border-edge">
            <table class="w-full text-left text-sm">
              <thead class="bg-surface font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                <tr>
                  <th scope="col" class="px-4 py-3 font-normal">{{ t('benchmarks.family.scenario') }}</th>
                  <th v-for="c in tbl.cols" :key="`${c.host}${c.mode}`" scope="col" class="px-4 py-3 font-normal">{{ variantLabel(c.host, c.mode) }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-edge">
                <tr v-for="row in tbl.rows" :key="`${row.rate}-${row.frames}-${row.stress}`" class="align-top">
                  <th scope="row" class="px-4 py-3 font-normal text-ink">{{ where(row.rate, row.frames) }}</th>
                  <td v-for="c in tbl.cols" :key="`${c.host}${c.mode}`" class="min-w-44 px-4 py-3">
                    <template v-if="!row.cells[variantKey(c)]">
                      <span class="text-ink-faint">{{ t('benchmarks.family.notMeasured') }}</span>
                    </template>
                    <template v-else-if="row.cells[variantKey(c)]!.status === 'ok'">
                      <p class="text-ink">
                        <span class="font-medium">{{ show(row.cells[variantKey(c)]!.dsp_load_avg) }} %</span>
                        <small v-if="spreadOf(row.cells[variantKey(c)]!, 'dsp_load_avg')" class="ml-1 text-xs text-ink-faint">{{ range(spreadOf(row.cells[variantKey(c)]!, 'dsp_load_avg')) }}</small>
                      </p>
                      <div class="mt-1.5 h-1.5 w-full overflow-hidden rounded bg-edge" aria-hidden="true">
                        <div class="h-full rounded bg-accent" :style="{ width: `${barPercent(row.cells[variantKey(c)]!.dsp_load_avg, tbl.scale)}%` }" />
                      </div>
                      <p v-if="row.cells[variantKey(c)]!.pss_mb_total != null" class="mt-1.5 text-xs text-ink-dim">
                        {{ t('benchmarks.family.pss') }} {{ show(row.cells[variantKey(c)]!.pss_mb_total) }} MB
                        <span v-if="spreadOf(row.cells[variantKey(c)]!, 'pss_mb_total')" class="text-ink-faint">{{ range(spreadOf(row.cells[variantKey(c)]!, 'pss_mb_total')) }}</span>
                      </p>
                      <p class="text-xs text-ink-dim">
                        {{ show(row.cells[variantKey(c)]!.xruns) }} {{ t('benchmarks.family.xruns') }}
                        <span v-if="spreadOf(row.cells[variantKey(c)]!, 'xruns')" class="text-ink-faint">{{ range(spreadOf(row.cells[variantKey(c)]!, 'xruns')) }}</span>
                      </p>
                      <p v-if="row.cells[variantKey(c)]!.software" class="text-xs text-ink-faint">omx-clap-core {{ row.cells[variantKey(c)]!.software!['omx-clap-core'] }}</p>
                      <p v-if="!acceptance(row.cells[variantKey(c)]!).pass" class="mt-1 text-xs font-medium text-warn">
                        {{ t('benchmarks.acceptance.fail') }}: {{ t(`benchmarks.acceptance.${acceptance(row.cells[variantKey(c)]!).reasons[0]}`) }}
                      </p>
                    </template>
                    <template v-else>
                      <span class="font-medium text-warn">{{ t(`benchmarks.status.${row.cells[variantKey(c)]!.status}`) }}</span>
                      <span v-if="row.cells[variantKey(c)]!.note" class="block text-xs text-ink-faint">{{ shortNote(row.cells[variantKey(c)]!.note) }}</span>
                      <span v-if="row.cells[variantKey(c)]!.software" class="block text-xs text-ink-faint">omx-clap-core {{ row.cells[variantKey(c)]!.software!['omx-clap-core'] }}</span>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-3 font-mono text-xs text-ink-faint">{{ t('benchmarks.family.unit') }}</p>
        </div>
      </section>

      <section class="border-b border-edge">
        <div class="mx-auto max-w-6xl px-6 py-16">
          <SectionHead :eyebrow="t('benchmarks.failing.eyebrow')" :title="t('benchmarks.failing.title')">
            <p class="mt-3 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ t('benchmarks.failing.lede') }}</p>
          </SectionHead>
          <ul v-if="failing.length" class="space-y-3 text-sm text-ink-dim">
            <li v-for="(f, i) in failing" :key="i">
              <span class="text-ink">{{ t('benchmarks.failing.row', { run: f.runId, title: familyTitle(f.scenario), variant: variantLabel(f.scenario.host, f.scenario.mode), where: where(f.scenario.rate, f.scenario.frames) }) }}</span>
              <span class="block text-xs">
                {{ t(`benchmarks.acceptance.${f.reasons[0]}`) }}<template v-if="f.scenario.software">, omx-clap-core {{ f.scenario.software['omx-clap-core'] }}</template>.
                <template v-if="f.reasons.includes('xruns')">
                  {{ t('benchmarks.failing.xrunsOf', { median: show(f.scenario.xruns), low: show(spreadOf(f.scenario, 'xruns')?.[0]), high: show(spreadOf(f.scenario, 'xruns')?.[1]) }) }}
                </template>
                <template v-else>{{ shortNote(f.scenario.note) }}</template>
              </span>
            </li>
          </ul>
          <p v-else class="text-sm text-ink-dim">{{ t('benchmarks.failing.none') }}</p>
          <p v-if="failing.length && failingWhy" class="mt-6 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ failingWhy }}</p>
          <template v-else-if="failing.length && run.id === 'rpi5-20261102-2'">
            <p class="mt-6 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ t('benchmarks.failing.cause') }}</p>
            <p class="mt-2 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ t('benchmarks.failing.cost') }}</p>
          </template>
        </div>
      </section>

      <section class="border-b border-edge">
        <div class="mx-auto max-w-6xl px-6 py-16">
          <SectionHead :eyebrow="t('benchmarks.stress.eyebrow')" :title="t('benchmarks.stress.title')" />
          <ul v-if="stress.length" class="space-y-1 text-sm text-ink-dim">
            <li v-for="(s, i) in stress" :key="i">
              {{ t('benchmarks.stress.row', { title: familyTitle(s), variant: variantLabel(s.host, s.mode), stress: s.stress }) }}:
              {{ show(s.dsp_load_avg) }} %, {{ show(s.xruns) }} {{ t('benchmarks.family.xruns') }}
            </li>
          </ul>
          <p v-else class="text-sm text-ink-dim">{{ t('benchmarks.stress.none') }}</p>
        </div>
      </section>

      <section v-if="cold.lines.length || warm.lines.length" class="border-b border-edge">
        <div class="mx-auto max-w-6xl px-6 py-16">
          <SectionHead :eyebrow="t('benchmarks.add.eyebrow')" :title="t('benchmarks.add.title')">
            <p class="mt-3 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ t('benchmarks.add.lede') }}</p>
          </SectionHead>
          <div v-for="(tb, name) in { cold: cold, warm: warm }" :key="name" class="mb-10">
            <template v-if="tb.lines.length">
              <h3 class="mb-3 font-display text-lg font-semibold text-ink">{{ t(`benchmarks.add.${name}Title`) }}</h3>
              <div class="overflow-x-auto rounded border border-edge">
                <table class="w-full text-left text-sm">
                  <thead class="bg-surface font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                    <tr>
                      <th scope="col" class="px-4 py-3 font-normal">{{ name === 'cold' ? t('benchmarks.add.set') : t('benchmarks.add.plugins') }}</th>
                      <th v-for="c in tb.cols" :key="c.key" scope="col" class="px-4 py-3 font-normal">{{ variantLabel(c.host, c.mode) }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-edge">
                    <tr v-for="l in tb.lines" :key="l.key">
                      <th scope="row" class="px-4 py-3 font-normal text-ink">{{ l.label }}</th>
                      <td v-for="c in tb.cols" :key="c.key" class="px-4 py-3 text-ink-dim">
                        <template v-if="l.cells.get(c.key)">
                          <span :class="l.cells.get(c.key)!.median_ms === lowest(l) ? 'font-semibold text-ink' : 'text-ink'">{{ show(l.cells.get(c.key)!.median_ms) }} ms</span>
                          <small class="ml-1 text-xs text-ink-faint">{{ range([l.cells.get(c.key)!.min_ms, l.cells.get(c.key)!.max_ms]) }}</small>
                        </template>
                        <template v-else>{{ t('benchmarks.add.missing') }}</template>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </div>
          <p class="font-mono text-xs text-ink-faint">{{ t('benchmarks.add.unit') }}</p>
        </div>
      </section>

      <section v-if="instruments.lines.length" class="border-b border-edge">
        <div class="mx-auto max-w-6xl px-6 py-16">
          <SectionHead :eyebrow="t('benchmarks.instruments.eyebrow')" :title="t('benchmarks.instruments.title')">
            <p class="mt-3 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ t('benchmarks.instruments.lede') }}</p>
          </SectionHead>
          <div class="overflow-x-auto rounded border border-edge">
            <table class="w-full text-left text-sm">
              <thead class="bg-surface font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                <tr>
                  <th scope="col" class="px-4 py-3 font-normal">{{ t('benchmarks.instruments.name') }}</th>
                  <th scope="col" class="px-4 py-3 font-normal">{{ t('benchmarks.instruments.host') }}</th>
                  <th v-for="n in instruments.notes" :key="n" scope="col" class="px-4 py-3 font-normal">{{ t('benchmarks.instruments.notes', { n }) }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-edge">
                <tr v-for="l in instruments.lines" :key="`${l.name}${l.host}`" class="align-top">
                  <th scope="row" class="px-4 py-3 font-normal text-ink">{{ l.name }}</th>
                  <td class="px-4 py-3 text-ink-dim">{{ hostName(l.host) }}</td>
                  <td v-for="n in instruments.notes" :key="n" class="px-4 py-3">
                    <template v-if="l.cells.get(n)">
                      <span class="text-ink">{{ t('benchmarks.instruments.cell', { dsp: show(l.cells.get(n)!.dsp_load_avg), pss: show(l.cells.get(n)!.pss_mb) }) }}</span>
                      <small class="block text-xs text-ink-faint">{{ show(l.cells.get(n)!.xruns) }} {{ t('benchmarks.family.xruns') }} {{ range(spreadOf(l.cells.get(n)!, 'xruns')) }}</small>
                      <small v-if="l.cells.get(n)!.peak_db != null" class="block text-xs text-ink-faint">{{ t('benchmarks.instruments.peak', { db: show(l.cells.get(n)!.peak_db) }) }}</small>
                      <small v-if="!acceptance({ status: l.cells.get(n)!.status, xruns: l.cells.get(n)!.xruns, spread: l.cells.get(n)!.spread }).pass" class="block text-xs font-medium text-warn">{{ t('benchmarks.acceptance.fail') }}</small>
                    </template>
                    <span v-else class="text-ink-faint">{{ t('benchmarks.family.notMeasured') }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-3 font-mono text-xs text-ink-faint">{{ t('benchmarks.instruments.unit') }}</p>
        </div>
      </section>

      <section v-if="run.profile" class="border-b border-edge">
        <div class="mx-auto max-w-6xl px-6 py-16">
          <SectionHead :eyebrow="t('benchmarks.profile.eyebrow')" :title="t('benchmarks.profile.title')">
            <p class="mt-3 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ t('benchmarks.profile.lede') }}</p>
          </SectionHead>
          <div class="overflow-x-auto rounded border border-edge">
            <table class="w-full text-left text-sm">
              <thead class="bg-surface font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                <tr>
                  <th scope="col" class="px-4 py-3 font-normal">{{ t('benchmarks.profile.where') }}</th>
                  <th scope="col" class="px-4 py-3 font-normal">{{ t('benchmarks.profile.lv2') }}</th>
                  <th scope="col" class="px-4 py-3 font-normal">{{ t('benchmarks.profile.clap') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-edge">
                <tr v-for="p in run.profile.audio_thread_shares" :key="p.where" class="align-top">
                  <th scope="row" class="px-4 py-3 font-normal text-ink">{{ p.where }}</th>
                  <td class="px-4 py-3 text-ink-dim">{{ p.cvp24_lv2 }}</td>
                  <td class="px-4 py-3 text-ink-dim">{{ p.cvp24 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section v-if="run.coverage || run.qualification" class="border-b border-edge">
        <div class="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-2">
          <div v-if="run.coverage">
            <SectionHead :eyebrow="t('benchmarks.coverage.eyebrow')" :title="t('benchmarks.coverage.title')" />
            <p class="mb-4 text-sm leading-relaxed text-ink-dim">{{ t('benchmarks.coverage.lede', { set: run.coverage.set, machine: machineLine(run) }) }}</p>
            <dl class="grid grid-cols-3 gap-px overflow-hidden rounded border border-edge bg-edge">
              <div v-for="k in (['jalv', 'mod-host', 'omx-clap-lv2'] as const).filter((x) => run!.coverage![x] !== undefined)" :key="k" class="bg-surface px-4 py-4">
                <dt class="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{{ t(`benchmarks.coverage.${k}`) }}</dt>
                <dd class="mt-1 font-display text-3xl font-semibold text-ink">{{ run.coverage[k] }}</dd>
              </div>
            </dl>
          </div>
          <div v-if="run.qualification">
            <SectionHead :eyebrow="t('benchmarks.qualification.eyebrow')" :title="t('benchmarks.qualification.title')" />
            <p v-if="run.qualification.lv2 !== undefined" class="text-sm leading-relaxed text-ink-dim">
              {{ t('benchmarks.qualification.fact', { plugins: run.qualification.plugins, lv2: run.qualification.lv2, clap: run.qualification.clap, records: run.qualification.records_package }) }}
            </p>
            <p v-if="run.qualification.qualified_in_process !== undefined" class="mt-3 text-sm leading-relaxed text-ink-dim">
              {{ t('benchmarks.qualification.split', { inProcess: run.qualification.qualified_in_process, isolated: run.qualification.qualified_isolated, crashed: run.qualification.crashed, hung: run.qualification.hung, refused: run.qualification.refused, unmeasured: run.qualification.unmeasured, noPin: run.qualification.no_pin }) }}
            </p>
            <p v-if="run.qualification.packages_installed !== undefined" class="mt-3 text-sm leading-relaxed text-ink-dim">
              {{ t('benchmarks.qualification.packages', { verified: run.qualification.packages_verified, installed: run.qualification.packages_installed }) }}
            </p>
            <p v-if="run.qualification.seconds !== undefined" class="mt-3 text-sm leading-relaxed text-ink-dim">
              {{ t('benchmarks.qualification.seconds', { plugins: run.qualification.plugins, seconds: run.qualification.seconds }) }}
              <template v-if="run.qualification.rates && run.qualification.quanta">
                {{ t('benchmarks.qualification.at', { rates: run.qualification.rates.map(khz).join(', '), quanta: run.qualification.quanta.join(', ') }) }}
              </template>
            </p>
            <p v-if="run.qualification.suitable !== undefined && run.qualification.unsuitable !== undefined" class="mt-3 text-sm text-ink-dim">
              {{ t('benchmarks.qualification.suitable', { suitable: run.qualification.suitable, unsuitable: run.qualification.unsuitable }) }}
            </p>
          </div>
        </div>
      </section>

      <section>
        <div class="mx-auto max-w-6xl px-6 py-10">
          <p class="font-mono text-xs leading-relaxed text-ink-faint">
            {{ t('benchmarks.footer', { id: run.id, date: runDate(run), machine: machineLine(run), software: softwareLine(run) }) }}
            <template v-if="run.sources">{{ t('benchmarks.sources', { sources: run.sources.join('; ') }) }}</template>
            <a :href="dataUrl" class="text-accent hover:underline">{{ t('benchmarks.data') }}</a>
          </p>
        </div>
      </section>
    </template>
  </div>
</template>
