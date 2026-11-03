<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * Zynthian with plugin-hostd as its plugin host: what it is, what it changes, how to install and use it, the
 * headline figures and where it stands. The method and every table are in the technical notes this page links.
 */
const { t } = useI18n();
const sitePath = useSitePath();

/** The captures, shared with the note that walks a plugin from its file to these screens. */
const SHOTS = '/notes/from-a-plugin-file-to-a-page';

const fromRelease = [
  '# the image is published in parts: join them, check the sum, then flash',
  'cat zynthianos-vangelis-omx.img.xz.* > zynthianos-vangelis-omx.img.xz',
  'sha256sum -c zynthianos-vangelis-omx.img.xz.sha256',
];
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

const notes = computed(() =>
  ([
    ['bench', 'plugin-hostd-on-a-raspberry-pi-5'],
    ['tradeoffs', 'one-worker-per-chain-or-one-process-per-plugin'],
    ['instruments', 'instruments-on-a-pi-5'],
    ['page', 'from-a-plugin-file-to-a-page'],
    ['groups', 'why-lv2-plugins-on-zynthian-need-inferred-port-groups'],
  ] as const).map(([k, slug]) => ({
    title: t(`docsZynthian.read.${k}.title`),
    body: t(`docsZynthian.read.${k}.body`),
    href: sitePath(`/notes/${slug}`),
    label: `/notes/${slug}`,
  })),
);

const slots = computed(() =>
  (['series', 'parallel', 'mixed', 'strip', 'jalv'] as const).map((k) => ({
    slots: t(`docsZynthian.mixbus.rows.${k}.slots`),
    runs: t(`docsZynthian.mixbus.rows.${k}.runs`),
  })),
);

const PROVEN = ['engine', 'pages', 'play', 'grouping', 'recover'] as const;
const RELEASED = ['guard', 'clients', 'adds'] as const;
const OPEN = ['menu', 'listen', 'presets', 'snapshot', 'mixbus'] as const;

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

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" :title="t('docsZynthian.install.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <h3 class="font-display text-lg font-semibold text-ink">{{ t('docsZynthian.install.image.title') }}</h3>
          <p>{{ t('docsZynthian.install.image.where') }}</p>
          <CodeBlock :lines="fromRelease" />
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

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" :title="t('docsZynthian.use.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsZynthian.use.intro') }}</p>
          <h3 class="pt-2 font-display text-lg font-semibold text-ink">{{ t('docsZynthian.use.group.title') }}</h3>
          <p>{{ t('docsZynthian.use.group.p1') }}</p>
          <p>{{ t('docsZynthian.use.group.p2') }}</p>
          <h3 class="pt-2 font-display text-lg font-semibold text-ink">{{ t('docsZynthian.use.strip.title') }}</h3>
          <p>{{ t('docsZynthian.use.strip.p1') }}</p>
          <p>{{ t('docsZynthian.use.strip.p2') }}</p>
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
        <SectionHead eyebrow="05" :title="t('docsZynthian.figures.title')" />
        <p class="mb-4 text-base leading-relaxed text-ink-dim">{{ t('docsZynthian.figures.intro') }}</p>
        <ul class="list-disc space-y-3 pl-6 text-base leading-relaxed text-ink-dim">
          <li>{{ t('docsZynthian.figures.dsp') }}</li>
          <li>{{ t('docsZynthian.figures.memory') }}</li>
          <li>{{ t('docsZynthian.figures.add') }}</li>
          <li>{{ t('docsZynthian.figures.instruments') }}</li>
          <li>{{ t('docsZynthian.figures.qualified') }}</li>
        </ul>
        <p class="mt-6 flex flex-wrap gap-x-6 text-base leading-relaxed">
          <NuxtLink :to="sitePath('/notes/plugin-hostd-on-a-raspberry-pi-5')" class="text-accent hover:underline">{{ t('docsZynthian.figures.more') }}</NuxtLink>
          <NuxtLink :to="sitePath('/benchmarks')" class="text-accent hover:underline">{{ t('docsZynthian.figures.bench') }}</NuxtLink>
        </p>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="06" :title="t('docsZynthian.status.title')" />
        <div class="space-y-6 text-base leading-relaxed text-ink-dim">
          <div>
            <h3 class="font-display text-lg font-semibold text-ink">{{ t('docsZynthian.status.proven.title') }}</h3>
            <ul class="mt-3 list-disc space-y-2 pl-6">
              <li v-for="k in PROVEN" :key="k">{{ t(`docsZynthian.status.proven.${k}`) }}</li>
            </ul>
          </div>
          <div>
            <h3 class="font-display text-lg font-semibold text-ink">{{ t('docsZynthian.status.released.title') }}</h3>
            <ul class="mt-3 list-disc space-y-2 pl-6">
              <li v-for="k in RELEASED" :key="k">{{ t(`docsZynthian.status.released.${k}`) }}</li>
            </ul>
          </div>
          <div>
            <h3 class="font-display text-lg font-semibold text-ink">{{ t('docsZynthian.status.open.title') }}</h3>
            <ul class="mt-3 list-disc space-y-2 pl-6">
              <li v-for="k in OPEN" :key="k">{{ t(`docsZynthian.status.open.${k}`) }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="07" :title="t('docsZynthian.series.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsZynthian.series.forks') }}</p>
          <p>{{ t('docsZynthian.series.upstream') }}</p>
        </div>
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="08" :title="t('docsZynthian.read.title')" />
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <LinkCard v-for="n in notes" :key="n.label" :title="n.title" :href="n.href" :label="n.label">
            <p>{{ n.body }}</p>
          </LinkCard>
        </div>
      </div>
    </section>
  </div>
</template>
