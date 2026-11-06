<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * Zynthian with plugin-hostd as its plugin host: what it is, what it changes, how to install and use it, the
 * headline figures and where it stands. The method and every table are in the technical notes this page links.
 */
const { t } = useI18n();
const sitePath = useSitePath();

/** The captures, shared with the note that walks a plugin from its file to these screens. */
const SHOTS = '/technical-notes/from-a-plugin-file-to-a-page';

const onExisting = [
  'curl -fsSLO https://www.openmixer.org/deb/openmixer-release.deb',
  'sudo apt install ./openmixer-release.deb',
  'sudo apt install plugin-hostd omx-clap-host omx-clap-scan omx-panel',
];
const switches = [
  '# the plugin engine: in /zynthian/config/zynthian_envars.sh, then restart the UI',
  'ZYNTHIAN_PLUGIN_ENGINE=plugin-hostd',
  "# MOD-UI's backend",
  'set_modhost_backend.sh plugin-hostd',
  '# plugins in series sharing one worker: in /zynthian/config/plugin-hostd.conf',
  'grouping on',
];

const poolOptions = [
  '# omx-clap-host: helper threads for the plugins that split their voices into tasks',
  'omx-clap-host --thread-pool=qualified   # the default',
  'omx-clap-host --thread-pool=on',
  'omx-clap-host --thread-pool=off',
];

/** The test plugin's mean block cost with the helper threads off and on, 48 kHz, 256 frames. */
const poolRows = [
  { voices: '8', off: '527.9', on: '155.9', gain: '3.4x' },
  { voices: '24', off: '1583.4', on: '418.7', gain: '3.8x' },
  { voices: '48', off: '3335.5', on: '857.9', gain: '3.9x' },
];

const slots = computed(() =>
  (['series', 'parallel', 'mixed', 'strip', 'jalv'] as const).map((k) => ({
    slots: t(`docsZynthian.mixbus.rows.${k}.slots`),
    runs: t(`docsZynthian.mixbus.rows.${k}.runs`),
  })),
);

const OPEN = ['menu', 'listen', 'presets', 'snapshot', 'mixbus'] as const;
/** The headline figures come from the proof in the feature records. */
const { figures } = useFeatureCards();

useSeoMeta({
  title: () => t('docsZynthian.seo.title'),
  description: () => t('docsZynthian.seo.description'),
});
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('docsZynthian.hero.eyebrow')"
      :title="t('docsZynthian.hero.title')"
      :lede="t('docsZynthian.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" :title="t('docsZynthian.what.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsZynthian.what.p1') }}</p>
          <p>{{ t('docsZynthian.what.p2') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" :title="t('docsZynthian.changes.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsZynthian.changes.p1') }}</p>
          <p>{{ t('docsZynthian.changes.p2') }}</p>
          <p>{{ t('docsZynthian.changes.p3') }}</p>
        </div>
      </div>
    </section>

    <section id="install" class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" :title="t('docsZynthian.install.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <h3 class="font-display text-lg font-semibold text-ink">{{ t('docsZynthian.install.image.title') }}</h3>
          <p>{{ t('docsZynthian.install.image.where') }}</p>
          <p>{{ t('docsZynthian.install.image.firstBoot') }}</p>
          <h3 class="pt-4 font-display text-lg font-semibold text-ink">{{ t('docsZynthian.install.existing.title') }}</h3>
          <p>{{ t('docsZynthian.install.existing.p1') }}</p>
          <CodeBlock :lines="onExisting" />
          <p>{{ t('docsZynthian.install.existing.p2') }}</p>
          <h3 class="pt-4 font-display text-lg font-semibold text-ink">{{ t('docsZynthian.install.switch.title') }}</h3>
          <p>{{ t('docsZynthian.install.switch.p1') }}</p>
          <CodeBlock :lines="switches" />
        </div>
      </div>
    </section>

    <section id="use" class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" :title="t('docsZynthian.use.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsZynthian.use.intro') }}</p>
          <h3 class="pt-2 font-display text-lg font-semibold text-ink">{{ t('docsZynthian.use.group.title') }}</h3>
          <p>{{ t('docsZynthian.use.group.p1') }}</p>
          <p>{{ t('docsZynthian.use.group.p2') }}</p>
          <h3 class="pt-2 font-display text-lg font-semibold text-ink">{{ t('docsZynthian.use.strip.title') }}</h3>
          <p>{{ t('docsZynthian.use.strip.p1') }}</p>
          <h3 class="pt-2 font-display text-lg font-semibold text-ink">{{ t('docsZynthian.mixbus.title') }}</h3>
          <p>{{ t('docsZynthian.mixbus.p1') }}</p>
          <ol class="list-decimal space-y-2 pl-6">
            <li>{{ t('docsZynthian.mixbus.step1') }}</li>
            <li>{{ t('docsZynthian.mixbus.step2') }}</li>
          </ol>
          <p>{{ t('docsZynthian.mixbus.p2') }}</p>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th class="border border-edge bg-surface-2 px-3 py-2 text-left text-ink">{{ t('docsZynthian.mixbus.cols.slots') }}</th>
                  <th class="border border-edge bg-surface-2 px-3 py-2 text-left text-ink">{{ t('docsZynthian.mixbus.cols.runs') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in slots" :key="r.slots">
                  <td class="border border-edge px-3 py-2 font-mono">{{ r.slots }}</td>
                  <td class="border border-edge px-3 py-2">{{ r.runs }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>{{ t('docsZynthian.mixbus.p3') }}</p>
        </div>
        <div class="mt-10 grid gap-5 sm:grid-cols-2">
          <Shot :src="`${SHOTS}/list-by-tier.png`" :alt="t('docsZynthian.shots.menu.alt')" :caption="t('docsZynthian.shots.menu.caption')" />
          <Shot :src="`${SHOTS}/controller-page-1-controls.png`" :alt="t('docsZynthian.shots.page.alt')" :caption="t('docsZynthian.shots.page.caption')" />
          <Shot :src="`${SHOTS}/modgui-pedalboard.png`" :alt="t('docsZynthian.shots.modgui.alt')" :caption="t('docsZynthian.shots.modgui.caption')" />
          <Shot :src="`${SHOTS}/chain-view-kars-zamcomp.png`" :alt="t('docsZynthian.shots.chain.alt')" :caption="t('docsZynthian.shots.chain.caption')" />
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="05" :title="t('docsZynthian.voices.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <h3 class="font-display text-lg font-semibold text-ink">{{ t('docsZynthian.voices.why.title') }}</h3>
          <p>{{ t('docsZynthian.voices.why.p1') }}</p>
          <p>{{ t('docsZynthian.voices.why.p2') }}</p>
          <h3 class="pt-2 font-display text-lg font-semibold text-ink">{{ t('docsZynthian.voices.how.title') }}</h3>
          <p>{{ t('docsZynthian.voices.how.p1') }}</p>
          <p>{{ t('docsZynthian.voices.how.p2') }}</p>
          <h3 class="pt-2 font-display text-lg font-semibold text-ink">{{ t('docsZynthian.voices.gate.title') }}</h3>
          <p>{{ t('docsZynthian.voices.gate.p1') }}</p>
          <p>{{ t('docsZynthian.voices.gate.p2') }}</p>
          <h3 class="pt-2 font-display text-lg font-semibold text-ink">{{ t('docsZynthian.voices.switch.title') }}</h3>
          <p>{{ t('docsZynthian.voices.switch.p1') }}</p>
          <CodeBlock :lines="poolOptions" />
          <ul class="list-disc space-y-2 pl-6">
            <li>{{ t('docsZynthian.voices.switch.qualified') }}</li>
            <li>{{ t('docsZynthian.voices.switch.on') }}</li>
            <li>{{ t('docsZynthian.voices.switch.off') }}</li>
          </ul>
          <h3 class="pt-2 font-display text-lg font-semibold text-ink">{{ t('docsZynthian.voices.measured.title') }}</h3>
          <p>{{ t('docsZynthian.voices.measured.p1') }}</p>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th class="border border-edge bg-surface-2 px-3 py-2 text-left text-ink">{{ t('docsZynthian.voices.measured.cols.voices') }}</th>
                  <th class="border border-edge bg-surface-2 px-3 py-2 text-left text-ink">{{ t('docsZynthian.voices.measured.cols.off') }}</th>
                  <th class="border border-edge bg-surface-2 px-3 py-2 text-left text-ink">{{ t('docsZynthian.voices.measured.cols.on') }}</th>
                  <th class="border border-edge bg-surface-2 px-3 py-2 text-left text-ink">{{ t('docsZynthian.voices.measured.cols.gain') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in poolRows" :key="r.voices">
                  <td class="border border-edge px-3 py-2 font-mono">{{ r.voices }}</td>
                  <td class="border border-edge px-3 py-2 font-mono">{{ r.off }}</td>
                  <td class="border border-edge px-3 py-2 font-mono">{{ r.on }}</td>
                  <td class="border border-edge px-3 py-2 font-mono">{{ r.gain }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>{{ t('docsZynthian.voices.measured.p2') }}</p>
          <p>{{ t('docsZynthian.voices.measured.p3') }}</p>
          <p>
            <NuxtLink :to="sitePath('/notes/instruments-on-a-pi-5')" class="text-accent hover:underline">{{ t('docsZynthian.voices.measured.more') }}</NuxtLink>
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="06" :title="t('docsZynthian.figures.title')" />
        <p class="mb-4 text-base leading-relaxed text-ink-dim">{{ t('docsZynthian.figures.intro') }}</p>
        <ul class="list-disc space-y-3 pl-6 text-base leading-relaxed text-ink-dim">
          <li v-for="f in figures" :key="f.text">
            {{ f.text }}
            <span class="block font-mono text-xs text-ink-faint">{{ f.with }}<template v-if="f.rate"> · {{ f.rate }}</template></span>
          </li>
        </ul>
        <p class="mt-6 flex flex-wrap gap-x-6 text-base leading-relaxed">
          <NuxtLink :to="sitePath('/notes/plugin-hostd-on-a-raspberry-pi-5')" class="text-accent hover:underline">{{ t('docsZynthian.figures.more') }}</NuxtLink>
          <NuxtLink :to="sitePath('/benchmarks')" class="text-accent hover:underline">{{ t('docsZynthian.figures.bench') }}</NuxtLink>
        </p>
        <p class="mt-8 font-mono text-xs leading-relaxed text-ink-faint">{{ t('docsZynthian.figures.footer') }}</p>
      </div>
    </section>

    <section id="status" class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="07" :title="t('docsZynthian.status.title')" />
        <div class="space-y-6 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsZynthian.status.intro') }}</p>
          <ul class="list-disc space-y-2 pl-6">
            <li v-for="k in OPEN" :key="k">{{ t(`docsZynthian.status.open.${k}`) }}</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="08" :title="t('docsZynthian.series.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsZynthian.series.forks') }}</p>
          <p>{{ t('docsZynthian.series.upstream') }}</p>
        </div>
      </div>
    </section>

    <section id="read-more" class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="09" :title="t('docsZynthian.read.title')" />
        <p class="mb-8 max-w-3xl text-base leading-relaxed text-ink-dim">{{ t('docsZynthian.read.intro') }}</p>
        <FeatureCards surface="zynthian" group="released" />
      </div>
    </section>

    <section id="coming-next">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="10" :title="t('docsZynthian.read.coming')" />
        <p class="mb-8 max-w-3xl text-base leading-relaxed text-ink-dim">{{ t('docsZynthian.read.comingIntro') }}</p>
        <FeatureCards surface="zynthian" group="coming" />
      </div>
    </section>
  </div>
</template>
