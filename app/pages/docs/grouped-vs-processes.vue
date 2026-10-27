<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * One measured result: a chain of plugins in one worker against one process per plugin, on a
 * Raspberry Pi 5. The rows are app/data/grouped-vs-processes.json, the measurement's own
 * records without the fields this page does not show. The ratios are the ones the measurement
 * report states (individual divided by grouped, no stress); they are not recomputed here.
 */
import runs from '~/data/grouped-vs-processes.json';

const { t } = useI18n();
const sitePath = useSitePath();

useSeoMeta({
  title: () => t('docsGroupedVsProcesses.seo.title'),
  description: () => t('docsGroupedVsProcesses.seo.description'),
});

const ratios = [
  { rate: '48000', n: '3', processes: '4 / 2', rss: '2.92x', pss: '1.90x', cpu: '1.24x', ctx: '2.71x' },
  { rate: '48000', n: '8', processes: '9 / 2', rss: '7.46x', pss: '2.60x', cpu: '1.62x', ctx: '7.02x' },
  { rate: '48000', n: '16', processes: '17 / 2', rss: '14.07x', pss: '2.76x', cpu: '1.86x', ctx: '13.92x' },
  { rate: '96000', n: '3', processes: '4 / 2', rss: '2.92x', pss: '1.90x', cpu: '1.21x', ctx: '2.83x' },
  { rate: '96000', n: '8', processes: '9 / 2', rss: '7.46x', pss: '2.60x', cpu: '1.43x', ctx: '7.41x' },
  { rate: '96000', n: '16', processes: '17 / 2', rss: '14.07x', pss: '2.76x', cpu: '1.60x', ctx: '14.78x' },
];

const ratioColumns = computed(() => [
  { key: 'rate', label: t('docsGroupedVsProcesses.cols.rate'), mono: true },
  { key: 'n', label: t('docsGroupedVsProcesses.cols.n'), mono: true },
  { key: 'processes', label: t('docsGroupedVsProcesses.cols.processes'), mono: true },
  { key: 'rss', label: t('docsGroupedVsProcesses.cols.rss'), mono: true },
  { key: 'pss', label: t('docsGroupedVsProcesses.cols.pss'), mono: true },
  { key: 'cpu', label: t('docsGroupedVsProcesses.cols.cpu'), mono: true },
  { key: 'ctx', label: t('docsGroupedVsProcesses.cols.ctx'), mono: true },
]);

const rawColumns = computed(() => [
  { key: 'rate', label: t('docsGroupedVsProcesses.cols.rate'), mono: true },
  { key: 'n', label: t('docsGroupedVsProcesses.cols.n'), mono: true },
  { key: 'stress', label: t('docsGroupedVsProcesses.cols.stress'), mono: true },
  { key: 'mode', label: t('docsGroupedVsProcesses.cols.mode'), mono: true },
  { key: 'processes', label: t('docsGroupedVsProcesses.cols.processes'), mono: true },
  { key: 'clients', label: t('docsGroupedVsProcesses.cols.clients'), mono: true },
  { key: 'rss', label: t('docsGroupedVsProcesses.cols.rssMb'), mono: true },
  { key: 'pss', label: t('docsGroupedVsProcesses.cols.pssMb'), mono: true },
  { key: 'cpu', label: t('docsGroupedVsProcesses.cols.cpuPct'), mono: true },
  { key: 'ctx', label: t('docsGroupedVsProcesses.cols.ctxCount'), mono: true },
  { key: 'dsp', label: t('docsGroupedVsProcesses.cols.dsp'), mono: true },
  { key: 'xruns', label: t('docsGroupedVsProcesses.cols.xruns'), mono: true },
]);

const rawRows = computed(() =>
  runs.map((r) => ({
    rate: String(r.rate),
    n: String(r.n),
    stress: t(r.stress ? 'docsGroupedVsProcesses.yes' : 'docsGroupedVsProcesses.no'),
    mode: t(r.mode === 'grouped' ? 'docsGroupedVsProcesses.grouped' : 'docsGroupedVsProcesses.individual'),
    processes: String(r.processes),
    clients: String(r.jackClients),
    rss: r.rssMb.toFixed(1),
    pss: r.pssMb.toFixed(1),
    cpu: String(r.cpuPct),
    ctx: String(r.ctx),
    dsp: `${r.dspAvg} / ${r.dspMax}`,
    xruns: String(r.xruns),
  })),
);
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('docsGroupedVsProcesses.hero.eyebrow')"
      :title="t('docsGroupedVsProcesses.hero.title')"
      :lede="t('docsGroupedVsProcesses.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" :title="t('docsGroupedVsProcesses.result.title')" />
        <ul class="list-disc space-y-3 pl-6 text-base leading-relaxed text-ink-dim">
          <li>{{ t('docsGroupedVsProcesses.result.rss') }}</li>
          <li>{{ t('docsGroupedVsProcesses.result.cpu') }}</li>
          <li>{{ t('docsGroupedVsProcesses.result.ctx') }}</li>
          <li>{{ t('docsGroupedVsProcesses.result.xruns') }}</li>
        </ul>
        <div class="mt-6 space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsGroupedVsProcesses.result.why') }}</p>
          <p>{{ t('docsGroupedVsProcesses.result.xrunCaveat') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" :title="t('docsGroupedVsProcesses.method.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsGroupedVsProcesses.method.setup') }}</p>
          <p>{{ t('docsGroupedVsProcesses.method.window') }}</p>
          <p>{{ t('docsGroupedVsProcesses.method.columns') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" :title="t('docsGroupedVsProcesses.notMeasured.title')" />
        <ul class="list-disc space-y-3 pl-6 text-base leading-relaxed text-ink-dim">
          <li>{{ t('docsGroupedVsProcesses.notMeasured.frames') }}</li>
          <li>{{ t('docsGroupedVsProcesses.notMeasured.hosts') }}</li>
          <li>{{ t('docsGroupedVsProcesses.notMeasured.planner') }}</li>
          <li>{{ t('docsGroupedVsProcesses.notMeasured.hardware') }}</li>
        </ul>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="04" :title="t('docsGroupedVsProcesses.ratios.title')">
          <p class="mt-4 max-w-3xl text-base leading-relaxed text-ink-dim">
            {{ t('docsGroupedVsProcesses.ratios.intro') }}
          </p>
        </SectionHead>
        <RefTable :columns="ratioColumns" :rows="ratios" />
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="05" :title="t('docsGroupedVsProcesses.raw.title')">
          <p class="mt-4 max-w-3xl text-base leading-relaxed text-ink-dim">
            {{ t('docsGroupedVsProcesses.raw.intro') }}
          </p>
        </SectionHead>
        <RefTable :columns="rawColumns" :rows="rawRows" />
        <p class="mt-6 text-base leading-relaxed text-ink-dim">
          <i18n-t keypath="docsGroupedVsProcesses.raw.more" tag="span" scope="global">
            <template #shipped>
              <NuxtLink :to="sitePath('/docs/plugins-shipped')" class="text-accent hover:underline">{{ t('docsGroupedVsProcesses.raw.shippedLink') }}</NuxtLink>
            </template>
          </i18n-t>
        </p>
      </div>
    </section>
  </div>
</template>
