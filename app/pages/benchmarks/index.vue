<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * The benchmarks: the same scenarios on up to four plugin hosts, from the newest run of each
 * machine class in benchmarks/runs/. Every figure on the page is read from a run or computed
 * from two of its figures; the columns are described, no host is named better than another.
 */
const { t } = useI18n();

const latest = benchLatest();
const classItems = CLASSES.map((c) => ({ label: t(`benchmarks.classes.${c}`), value: c }));
const selected = ref<MachineClass>(CLASSES.find((c) => latest.has(c)) ?? CLASSES[0]!);
const run = computed(() => latest.get(selected.value) ?? null);

const khz = (rate: number) => `${rate / 1000} kHz`;
const where = (rate: number, frames: number) => t('benchmarks.where', { rate: khz(rate), frames });

const tables = computed(() => {
  const r = run.value;
  if (!r) return [];
  return families(r).map((f) => {
    const rows = compareRows(r, f.id);
    const scale = barScale(rows);
    const notes: string[] = [];
    for (const row of rows) {
      for (const h of HOSTS) {
        const s = row.cells[h];
        if (s && s.status !== 'ok' && s.note) notes.push(`${t(`benchmarks.hosts.${h}`)}, ${where(row.rate, row.frames)}: ${s.note}`);
      }
    }
    return { ...f, rows, scale, notes };
  });
});

const loads = computed(() => (run.value ? isolationLoads(run.value) : []));
const recovers = computed(() => (run.value ? isolationRecovers(run.value) : []));
const groups = computed(() => (run.value ? cvpGroups(run.value) : []));
const ratios = computed(() => (run.value ? cvpRatios(run.value) : []));

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
const machineLine = (r: BenchRun) => t('benchmarks.machine', { model: r.machine.model, os: r.machine.os });
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
      <dl class="mt-8 grid gap-px overflow-hidden rounded border border-edge bg-edge sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="h in HOSTS" :key="h" class="bg-surface px-4 py-4">
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
                  <th v-for="h in HOSTS" :key="h" scope="col" class="px-4 py-3 font-normal">{{ t(`benchmarks.hosts.${h}`) }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-edge">
                <tr v-for="row in tbl.rows" :key="`${row.rate}-${row.frames}`" class="align-top">
                  <th scope="row" class="px-4 py-3 font-normal text-ink">{{ where(row.rate, row.frames) }}</th>
                  <td v-for="h in HOSTS" :key="h" class="min-w-32 px-4 py-3">
                    <template v-if="!row.cells[h]">
                      <span class="text-ink-faint" :title="t('benchmarks.family.notMeasured')">—</span>
                    </template>
                    <template v-else-if="row.cells[h]!.status === 'ok'">
                      <p class="text-ink">
                        <span class="font-medium">{{ show(row.cells[h]!.dsp_load_avg) }} %</span>
                        <small v-if="row.cells[h]!.dsp_load_max != null" class="ml-1 text-xs text-ink-faint">{{ t('benchmarks.family.max', { max: show(row.cells[h]!.dsp_load_max) }) }}</small>
                      </p>
                      <div class="mt-1.5 h-1.5 w-full overflow-hidden rounded bg-edge" aria-hidden="true">
                        <div class="h-full rounded bg-accent" :style="{ width: `${barPercent(row.cells[h]!.dsp_load_avg, tbl.scale)}%` }" />
                      </div>
                    </template>
                    <template v-else>
                      <span class="text-ink-dim" :title="row.cells[h]!.note">{{ t(`benchmarks.status.${row.cells[h]!.status}`) }}</span>
                      <span v-if="row.cells[h]!.note" class="block text-xs text-ink-faint">{{ row.cells[h]!.note }}</span>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="mt-3 font-mono text-xs text-ink-faint">{{ t('benchmarks.family.unit') }}</p>
          <ul v-if="tbl.notes.length" class="mt-3 space-y-1 text-xs text-ink-faint">
            <li v-for="n in tbl.notes" :key="n">{{ n }}</li>
          </ul>
        </div>
      </section>

      <section v-if="groups.length" class="border-b border-edge">
        <div class="mx-auto max-w-6xl px-6 py-16">
          <SectionHead :eyebrow="t('benchmarks.cvp.eyebrow')" :title="t('benchmarks.cvp.title')">
            <p class="mt-3 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ t('benchmarks.cvp.lede') }}</p>
          </SectionHead>
          <div v-for="g in groups" :key="`${g.n}-${g.rate}-${g.frames}`" class="mb-10">
            <h3 class="mb-3 font-display text-lg font-semibold text-ink">{{ t('benchmarks.cvp.group', { n: g.n, where: where(g.rate, g.frames) }) }}</h3>
            <div class="overflow-x-auto rounded border border-edge">
              <table class="w-full text-left text-sm">
                <thead class="bg-surface font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  <tr>
                    <th scope="col" class="px-4 py-3 font-normal">{{ t('benchmarks.cvp.mode') }}</th>
                    <th scope="col" class="px-4 py-3 font-normal">{{ t('benchmarks.cvp.host') }}</th>
                    <th scope="col" class="px-4 py-3 text-right font-normal">{{ t('benchmarks.cvp.processes') }}</th>
                    <th scope="col" class="px-4 py-3 text-right font-normal">{{ t('benchmarks.cvp.rss') }}</th>
                    <th scope="col" class="px-4 py-3 text-right font-normal">{{ t('benchmarks.cvp.pss') }}</th>
                    <th scope="col" class="px-4 py-3 text-right font-normal">{{ t('benchmarks.cvp.cpu') }}</th>
                    <th scope="col" class="px-4 py-3 text-right font-normal">{{ t('benchmarks.cvp.ctx') }}</th>
                    <th scope="col" class="px-4 py-3 text-right font-normal">{{ t('benchmarks.cvp.add') }}</th>
                    <th scope="col" class="px-4 py-3 text-right font-normal">{{ t('benchmarks.cvp.dsp') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-edge">
                  <tr v-for="s in g.rows" :key="`${s.host}-${s.mode}`" class="align-top">
                    <th scope="row" class="px-4 py-3 font-normal text-ink">{{ s.mode ? t(`benchmarks.mode.${s.mode}`) : '—' }}</th>
                    <td class="px-4 py-3 text-ink-dim">{{ t(`benchmarks.hosts.${s.host}`) }}</td>
                    <template v-if="s.status === 'ok'">
                      <td class="px-4 py-3 text-right text-ink">{{ show(s.processes) }}</td>
                      <td class="px-4 py-3 text-right text-ink">{{ show(s.rss_mb_total) }}</td>
                      <td class="px-4 py-3 text-right text-ink">{{ show(s.pss_mb_total) }}</td>
                      <td class="px-4 py-3 text-right text-ink">{{ show(s.cpu_pct) }}</td>
                      <td class="px-4 py-3 text-right text-ink">{{ show(s.ctx_switches) }}</td>
                      <td class="px-4 py-3 text-right text-ink">{{ show(s.add_ms) }}</td>
                      <td class="px-4 py-3 text-right text-ink">{{ show(s.dsp_load_avg) }}</td>
                    </template>
                    <td v-else colspan="7" class="px-4 py-3 text-ink-dim" :title="s.note">{{ t(`benchmarks.status.${s.status}`) }}: {{ s.note }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ul class="mt-3 space-y-1 text-sm text-ink-dim">
              <template v-for="q in ratios.filter((x) => x.n === g.n && x.rate === g.rate && x.frames === g.frames)" :key="`${q.n}-${q.rate}-${q.frames}`">
                <li v-if="q.processes !== null">{{ t('benchmarks.cvp.ratioProcesses', { n: q.processes }) }}</li>
                <li v-if="q.pss !== null">{{ t('benchmarks.cvp.ratioPss', { n: q.pss }) }}</li>
                <li v-if="q.cpu !== null">{{ t('benchmarks.cvp.ratioCpu', { n: q.cpu }) }}</li>
              </template>
            </ul>
          </div>
          <p class="font-mono text-xs text-ink-faint">{{ t('benchmarks.cvp.units') }}</p>
        </div>
      </section>

      <section class="border-b border-edge">
        <div class="mx-auto max-w-6xl px-6 py-16">
          <SectionHead :eyebrow="t('benchmarks.isolation.eyebrow')" :title="t('benchmarks.isolation.title')">
            <p class="mt-3 max-w-3xl text-sm leading-relaxed text-ink-dim">{{ t('benchmarks.isolation.lede') }}</p>
          </SectionHead>
          <div class="grid gap-10 lg:grid-cols-2">
            <div>
              <h3 class="mb-3 font-display text-lg font-semibold text-ink">{{ t('benchmarks.isolation.costTitle') }}</h3>
              <div v-if="loads.length" class="overflow-x-auto rounded border border-edge">
                <table class="w-full text-left text-sm">
                  <thead class="bg-surface font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                    <tr>
                      <th scope="col" class="px-4 py-3 font-normal">{{ t('benchmarks.family.scenario') }}</th>
                      <th scope="col" class="px-4 py-3 text-right font-normal">{{ t('benchmarks.hosts.H1') }}</th>
                      <th scope="col" class="px-4 py-3 text-right font-normal">{{ t('benchmarks.hosts.H2') }}</th>
                      <th scope="col" class="px-4 py-3 text-right font-normal">{{ t('benchmarks.isolation.difference') }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-edge">
                    <tr v-for="l in loads" :key="`${l.id}-${l.rate}-${l.frames}`">
                      <th scope="row" class="px-4 py-3 font-normal text-ink">{{ l.title }}<span class="block text-xs text-ink-faint">{{ where(l.rate, l.frames) }}</span></th>
                      <td class="px-4 py-3 text-right text-ink-dim">{{ show(l.h1) }} %</td>
                      <td class="px-4 py-3 text-right text-ink-dim">{{ show(l.h2) }} %</td>
                      <td class="px-4 py-3 text-right font-medium text-ink">{{ signed(l.delta) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="text-sm text-ink-dim">{{ t('benchmarks.isolation.noPair') }}</p>
            </div>
            <div>
              <h3 class="mb-3 font-display text-lg font-semibold text-ink">{{ t('benchmarks.isolation.buysTitle') }}</h3>
              <div v-if="recovers.length" class="overflow-x-auto rounded border border-edge">
                <table class="w-full text-left text-sm">
                  <thead class="bg-surface font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                    <tr>
                      <th scope="col" class="px-4 py-3 font-normal">{{ t('benchmarks.family.scenario') }}</th>
                      <th scope="col" class="px-4 py-3 text-right font-normal">{{ t('benchmarks.isolation.recover') }}</th>
                      <th scope="col" class="px-4 py-3 font-normal">{{ t('benchmarks.isolation.others') }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-edge">
                    <tr v-for="c in recovers" :key="`${c.id}-${c.rate}-${c.frames}`" class="align-top">
                      <th scope="row" class="px-4 py-3 font-normal text-ink">{{ c.title }}<span class="block text-xs text-ink-faint">{{ where(c.rate, c.frames) }}</span></th>
                      <td class="px-4 py-3 text-right font-medium text-ink">{{ show(c.recoverMs) }} ms</td>
                      <td class="px-4 py-3 text-ink-dim">
                        <span v-for="l in c.lost" :key="l.host" class="block">{{ t(`benchmarks.hosts.${l.host}`) }}: {{ l.note }}</span>
                        <span v-if="!c.lost.length" class="text-ink-faint">—</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="text-sm text-ink-dim">{{ t('benchmarks.isolation.noRecover') }}</p>
            </div>
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
            <p class="text-sm leading-relaxed text-ink-dim">
              {{ t('benchmarks.qualification.fact', { plugins: run.qualification.plugins, seconds: run.qualification.seconds, machine: machineLine(run) }) }}
              <template v-if="run.qualification.rates && run.qualification.quanta">
                {{ t('benchmarks.qualification.at', { rates: run.qualification.rates.map(khz).join(', '), quanta: run.qualification.quanta.join(', ') }) }}
              </template>
            </p>
            <p v-if="run.qualification.suitable !== undefined && run.qualification.unsuitable !== undefined" class="mt-3 text-sm text-ink-dim">
              {{ t('benchmarks.qualification.split', { suitable: run.qualification.suitable, unsuitable: run.qualification.unsuitable }) }}
            </p>
          </div>
        </div>
      </section>

      <section>
        <div class="mx-auto max-w-6xl px-6 py-10">
          <p class="font-mono text-xs leading-relaxed text-ink-faint">
            {{ t('benchmarks.footer', { id: run.id, machine: machineLine(run), software: softwareLine(run) }) }}
            <a :href="dataUrl" class="text-accent hover:underline">{{ t('benchmarks.data') }}</a>
          </p>
        </div>
      </section>
    </template>
  </div>
</template>
