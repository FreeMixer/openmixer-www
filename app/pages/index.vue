<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * The front page: the console, its own processing, how it hosts plugins, the open
 * components, and the install. Links into the manual go through `site()` because the
 * /docs/<section> trees are published beside this app, not routed by it.
 */
const { t } = useI18n();
const sitePath = useSitePath();
const base = useRuntimeConfig().app.baseURL;
const site = (path: string) => withSiteBase(base, path);

type Tone = 'live' | 'prog' | 'land' | 'rel';
const TONE: Record<Tone, string> = {
  live: 'text-meter border-meter/35 bg-meter/7',
  prog: 'text-warn border-warn/35 bg-warn/7',
  land: 'text-accent border-accent/35 bg-accent/7',
  rel: 'text-release border-release/35 bg-release/7',
};
const pill = 'inline-flex self-start rounded-full border px-2.5 py-1.5 font-mono text-[10.5px] leading-none uppercase tracking-[0.1em]';

/** The fader wall in the hero: an illustration, not a capture. */
const strips = [
  { name: 'KICK', k: 55, m: 58, d: 1.3, f: 34 },
  { name: 'SNR', k: 42, m: 46, d: 0.9, f: 40 },
  { name: 'BASS', k: 35, m: 38, d: 1.7, f: 46 },
  { name: 'GTR', k: 60, m: 64, d: 1.1, f: 30 },
  { name: 'KEYS', k: 48, m: 52, d: 1.5, f: 37 },
  { name: 'VOX', k: 66, m: 70, d: 1.25, f: 27 },
  { name: 'AMB', k: 30, m: 30, d: 2, f: 52 },
] as const;
const mainMeters = [{ m: 66, d: 1.4 }, { m: 62, d: 1.45 }] as const;

const chips = computed(() => ['PipeWire', t('home.hero.chipEngine'), t('home.hero.chipStageboxes'), 'X-Touch', 'LV2 · CLAP', 'GPL-3.0']);

const path = computed(() =>
  ([
    { id: 'in', core: false },
    { id: 'strip', core: true },
    { id: 'inserts', core: false },
    { id: 'buses', core: true },
    { id: 'out', core: false },
  ] as const).map((p) => ({
    at: t(`home.path.${p.id}.at`),
    title: t(`home.path.${p.id}.title`),
    what: t(`home.path.${p.id}.what`),
    core: p.core,
  })),
);

const cards = computed(() =>
  ([
    { id: 'engine', icon: 'i-lucide-activity', status: 'live', tone: 'live' },
    { id: 'stagebox', icon: 'i-lucide-server', status: 'progress', tone: 'prog' },
    { id: 'surface', icon: 'i-lucide-monitor-smartphone', status: 'live', tone: 'live' },
    { id: 'xtouch', icon: 'i-lucide-sliders-vertical', status: 'progress', tone: 'prog' },
  ] as const satisfies readonly { tone: Tone }[]).map((c) => ({
    icon: c.icon,
    title: t(`home.cards.${c.id}.title`),
    text: t(`home.cards.${c.id}.text`),
    status: t(`home.status.${c.status}`),
    tone: c.tone,
  })),
);

const features = computed(() => [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => t(`home.features.f${n}`)));

const native = computed(() =>
  ([
    { id: 'tone', featured: false, items: ['eq', 'gate', 'comp', 'expander', 'deesser', 'multiband'] },
    { id: 'colour', featured: false, items: ['drive', 'delay', 'reverb', 'chorus'] },
    { id: 'listening', featured: true, items: ['fbs', 'hrp', 'align', 'rta'] },
  ] as const).map((g) => ({
    title: t(`home.native.${g.id}.title`),
    featured: g.featured,
    items: g.items.map((i) => [t(`home.native.${g.id}.${i}.name`), t(`home.native.${g.id}.${i}.what`)] as const),
  })),
);

const tiers = computed(() =>
  ([
    { id: 'native', formats: [], status: 'live', tone: 'live', featured: false },
    { id: 'open', formats: ['LV2 · mod-host', 'CLAP · omx-clap-host'], status: 'liveLv2', tone: 'live', featured: false },
    { id: 'hostd', formats: [], status: 'landing', tone: 'land', featured: true },
  ] as const satisfies readonly { tone: Tone }[]).map((tier) => ({
    n: t(`home.tiers.${tier.id}.n`),
    title: t(`home.tiers.${tier.id}.title`),
    text: t(`home.tiers.${tier.id}.text`),
    formats: tier.formats,
    status: t(`home.status.${tier.status}`),
    tone: tier.tone,
    costLabel: t(`home.tiers.${tier.id}.costLabel`),
    cost: t(`home.tiers.${tier.id}.cost`),
    featured: tier.featured,
  })),
);

const timeline = computed(() =>
  (['worker_died', 'worker_backoff', 'worker_respawned', 'instance_restored'] as const).map(
    (code) => [code, t(`home.crash.timeline.${code}`)] as const,
  ),
);

const repos = computed(() =>
  ([
    {
      id: 'clapHost',
      name: 'omx-clap-host',
      href: 'https://github.com/FreeMixer/omx-clap-host',
      go: 'github.com/FreeMixer/omx-clap-host',
      status: 'released',
      tone: 'rel',
    },
    {
      id: 'hostd',
      name: 'plugin-hostd',
      href: 'https://github.com/FreeMixer/plugin-hostd',
      go: 'github.com/FreeMixer/plugin-hostd',
      status: 'released',
      tone: 'rel',
    },
    {
      id: 'protocol',
      name: 'libmod-host-protocol',
      href: 'https://github.com/mod-audio/mod-host/pull/103',
      go: 'mod-audio/mod-host#103',
      status: 'proposed',
      tone: 'land',
    },
  ] as const satisfies readonly { tone: Tone }[]).map((r) => ({
    name: r.name,
    href: r.href,
    go: r.go,
    status: t(`home.status.${r.status}`),
    tone: r.tone,
    text: t(`home.open.repos.${r.id}`),
  })),
);

useSeoMeta({
  title: () => t('home.seo.title'),
  description: () => t('home.seo.description'),
});
</script>

<template>
  <div>
    <!-- Hero -->
    <header id="top" class="relative overflow-hidden pt-14 pb-20 sm:pt-24 sm:pb-28">
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_78%_20%,rgba(40,200,230,.10),transparent_60%),linear-gradient(rgba(128,140,150,.09)_1px,transparent_1px)] bg-[size:auto,100%_48px] [mask-image:linear-gradient(180deg,#000_40%,transparent)]"
      />
      <div class="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
        <div>
          <p class="font-mono text-xs uppercase tracking-[0.14em] text-accent">{{ t('home.hero.eyebrow') }}</p>
          <h1 class="mt-5 font-display text-[2.5rem] leading-[1.02] font-semibold tracking-[-0.035em] text-ink sm:text-6xl lg:text-[4.4rem]" v-html="t('home.hero.title')" />
          <p class="mt-5 max-w-[60ch] text-lg leading-relaxed text-ink-dim" v-html="t('home.hero.lede')" />
          <div class="mt-8 flex flex-wrap gap-3">
            <UButton :to="sitePath('/features')" size="lg" color="primary" trailing-icon="i-lucide-arrow-right">
              {{ t('home.hero.explore') }}
            </UButton>
            <UButton to="#plugins" size="lg" color="neutral" variant="outline">
              {{ t('home.hero.howPlugins') }}
            </UButton>
          </div>
          <ul class="mt-8 flex flex-wrap gap-2" :aria-label="t('home.hero.builtOn')">
            <li
              v-for="c in chips"
              :key="c"
              class="rounded-full border border-edge bg-surface px-3 py-1.5 font-mono text-[11px] leading-none tracking-[0.04em] text-ink-dim"
            >{{ c }}</li>
          </ul>
        </div>

        <div
          role="img"
          :aria-label="t('home.hero.wallLabel')"
          class="rounded-[22px] border border-edge bg-linear-to-b from-surface-2 to-surface px-3 pt-5 pb-4 shadow-[0_24px_60px_rgba(20,40,50,.14)] dark:shadow-[0_30px_80px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.04)] sm:px-5"
        >
          <div class="mb-4 flex items-center justify-between font-mono text-[11px] leading-none uppercase tracking-[0.1em] text-ink-faint">
            <span>{{ t('home.hero.wallInputs') }}</span>
            <span class="flex items-center gap-2 text-meter">
              <span class="size-[7px] rounded-full bg-meter shadow-[0_0_10px_var(--color-meter)]" />{{ t('home.hero.wallLive') }}
            </span>
          </div>
          <div class="grid grid-cols-5 gap-2 sm:grid-cols-8">
            <div
              v-for="(s, i) in strips"
              :key="s.name"
              class="min-w-0 flex-col items-center gap-2 rounded-[10px] border border-track bg-well pt-2.5 pb-2"
              :class="i >= 4 ? 'hidden sm:flex' : 'flex'"
            >
              <div
                class="relative size-[22px] rounded-full bg-[conic-gradient(var(--color-accent)_0_var(--k),var(--color-surface-3)_0)]"
                :style="{ '--k': `${s.k}%` }"
              >
                <div class="absolute inset-1 rounded-full bg-surface-2" />
              </div>
              <div class="flex h-[140px] w-full justify-center gap-[5px] sm:h-[170px]">
                <div class="relative h-full w-1 overflow-hidden rounded-sm bg-track">
                  <i
                    class="absolute inset-x-0 bottom-0 origin-bottom rounded-sm bg-[linear-gradient(0deg,var(--color-meter)_0_62%,var(--color-warn)_62%_84%,var(--color-clip)_84%)] motion-safe:animate-level"
                    :style="{ height: `${s.m}%`, animationDuration: `${s.d}s` }"
                  />
                </div>
                <div class="relative h-full w-1.5 rounded-[3px] bg-track">
                  <div
                    class="absolute left-1/2 -ml-[13px] h-3.5 w-[26px] rounded bg-linear-to-b from-[#dfe7ec] to-[#aab6be] shadow-[0_3px_6px_rgba(0,0,0,.6)]"
                    :style="{ top: `${s.f}%` }"
                  >
                    <div class="absolute inset-x-1 top-1.5 h-0.5 bg-[#0b0e11]" />
                  </div>
                </div>
              </div>
              <div class="font-mono text-[10px] leading-none tracking-[0.05em] text-ink-dim">{{ s.name }}</div>
            </div>
            <div class="flex min-w-0 flex-col items-center gap-2 rounded-[10px] border border-accent/35 bg-accent/6 pt-2.5 pb-2">
              <div class="relative size-[22px] rounded-full bg-[conic-gradient(var(--color-accent)_0_50%,var(--color-surface-3)_0)]">
                <div class="absolute inset-1 rounded-full bg-surface-2" />
              </div>
              <div class="flex h-[140px] w-full justify-center gap-[5px] sm:h-[170px]">
                <div v-for="(mm, j) in mainMeters" :key="j" class="relative h-full w-1 overflow-hidden rounded-sm bg-track">
                  <i
                    class="absolute inset-x-0 bottom-0 origin-bottom rounded-sm bg-[linear-gradient(0deg,var(--color-meter)_0_62%,var(--color-warn)_62%_84%,var(--color-clip)_84%)] motion-safe:animate-level"
                    :style="{ height: `${mm.m}%`, animationDuration: `${mm.d}s` }"
                  />
                </div>
                <div class="relative h-full w-1.5 rounded-[3px] bg-track">
                  <div
                    class="absolute left-1/2 -ml-[13px] h-3.5 w-[26px] rounded bg-linear-to-b from-omx-300 to-accent shadow-[0_3px_6px_rgba(0,0,0,.6)]"
                    style="top: 31%"
                  >
                    <div class="absolute inset-x-1 top-1.5 h-0.5 bg-[#0b0e11]" />
                  </div>
                </div>
              </div>
              <div class="font-mono text-[10px] leading-none tracking-[0.05em] text-accent">MAIN</div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- The console -->
    <section id="console" class="scroll-mt-20 border-t border-edge/55 py-18 sm:py-28">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <p class="font-mono text-xs uppercase tracking-[0.14em] text-accent">{{ t('home.console.eyebrow') }}</p>
        <h2 class="mt-4 max-w-[20ch] font-display text-3xl leading-[1.08] font-semibold tracking-tight text-ink sm:text-[2.75rem]">
          {{ t('home.console.title') }}
        </h2>
        <i18n-t keypath="home.console.lede" tag="p" scope="global" class="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink-dim">
          <template #link>
            <NuxtLink :to="sitePath('/architecture')" class="text-accent hover:underline">{{ t('home.console.ledeLink') }}</NuxtLink>
          </template>
        </i18n-t>

        <ol class="mt-12 grid overflow-hidden rounded-[14px] border border-edge bg-surface md:grid-cols-5" :aria-label="t('home.console.pathLabel')">
          <li
            v-for="p in path"
            :key="p.title"
            class="border-b border-edge px-5 py-5 last:border-0 md:border-r md:border-b-0"
            :class="p.core ? 'bg-linear-to-b from-accent/9 to-accent/2' : ''"
          >
            <small class="mb-2.5 block font-mono text-[11px] leading-none uppercase tracking-[0.12em]" :class="p.core ? 'text-accent' : 'text-ink-faint'">{{ p.at }}</small>
            <strong class="block font-display text-base leading-tight font-semibold text-ink">{{ p.title }}</strong>
            <span class="mt-1.5 block text-sm text-ink-dim">{{ p.what }}</span>
          </li>
        </ol>

        <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article v-for="c in cards" :key="c.icon" class="flex flex-col gap-3 rounded-[14px] border border-edge bg-surface p-6 transition-colors hover:border-edge-strong">
            <div class="grid size-10 place-items-center rounded-[10px] border border-edge bg-surface-2 text-accent" aria-hidden="true">
              <UIcon :name="c.icon" class="size-5" />
            </div>
            <h3 class="font-display text-xl leading-tight font-semibold tracking-tight text-ink">{{ c.title }}</h3>
            <p class="text-[0.96rem] leading-relaxed text-ink-dim">{{ c.text }}</p>
            <span :class="[pill, TONE[c.tone], 'mt-auto']">{{ c.status }}</span>
          </article>
        </div>

        <div class="mt-10">
          <Shot
            src="/img/console-channels.png"
            :alt="t('home.console.shotAlt')"
            :caption="t('home.console.shotCaption')"
          />
        </div>

        <ul class="mt-10 columns-1 gap-8 sm:columns-2 lg:columns-3" :aria-label="t('home.console.featuresLabel')">
          <li
            v-for="f in features"
            :key="f"
            class="relative break-inside-avoid border-b border-dashed border-edge/80 py-2 pl-6 text-[0.95rem] text-ink-dim before:absolute before:top-[1.05rem] before:left-0 before:h-0.5 before:w-2 before:bg-accent"
          >{{ f }}</li>
        </ul>

        <div class="mt-12 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div class="rounded-[14px] border border-edge bg-surface p-7">
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-accent">{{ t('home.stands.eyebrow') }}</p>
            <p class="mt-4 flex items-start gap-3 text-ink">
              <span class="mt-2 size-[9px] flex-none rounded-full bg-meter shadow-[0_0_12px_var(--color-meter)]" aria-hidden="true" />
              {{ t('home.stands.lead') }}
            </p>
            <div class="mt-4 space-y-3 text-[0.95rem] leading-relaxed text-ink-dim">
              <p>
                {{ t('home.stands.rig') }}
              </p>
              <p>
                {{ t('home.stands.missing') }}
              </p>
              <i18n-t keypath="home.stands.features" tag="p" scope="global">
                <template #link>
                  <NuxtLink :to="sitePath('/features')" class="text-accent hover:underline">{{ t('home.stands.featuresLink') }}</NuxtLink>
                </template>
              </i18n-t>
            </div>
          </div>
          <div class="rounded-[14px] border border-edge bg-well p-7">
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">{{ t('home.finished.eyebrow') }}</p>
            <blockquote class="mt-4 border-l-2 border-accent pl-4 font-display text-xl leading-snug text-ink">
              {{ t('home.finished.quote') }}
            </blockquote>
            <p class="mt-4 text-[0.95rem] leading-relaxed text-ink-dim">
              {{ t('home.finished.text') }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Native processing -->
    <section id="native" class="scroll-mt-20 border-t border-edge/55 py-18 sm:py-28">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <p class="font-mono text-xs uppercase tracking-[0.14em] text-accent">{{ t('home.native.eyebrow') }}</p>
        <h2 class="mt-4 max-w-[20ch] font-display text-3xl leading-[1.08] font-semibold tracking-tight text-ink sm:text-[2.75rem]">
          {{ t('home.native.title') }}
        </h2>
        <i18n-t keypath="home.native.lede" tag="p" scope="global" class="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink-dim">
          <template #link>
            <a :href="site(sitePath('/docs/manual'))" class="text-accent hover:underline">{{ t('home.native.ledeLink') }}</a>
          </template>
        </i18n-t>

        <div class="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1.25fr]">
          <article
            v-for="g in native"
            :key="g.title"
            class="rounded-[14px] border p-6"
            :class="g.featured ? 'border-accent/35 bg-linear-to-b from-accent/8 to-surface to-60% md:col-span-2 lg:col-span-1' : 'border-edge bg-surface'"
          >
            <h3 class="border-b border-edge pb-3.5 font-display text-lg font-semibold tracking-tight text-ink">{{ g.title }}</h3>
            <ul>
              <li v-for="[name, what] in g.items" :key="name" class="border-b border-dashed border-edge/80 py-3.5 last:border-0 last:pb-0">
                <b class="block font-display text-[0.95rem] leading-snug font-semibold text-ink">{{ name }}</b>
                <span class="mt-1 block text-sm text-ink-dim">{{ what }}</span>
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <!-- Plugins -->
    <section
      id="plugins"
      class="scroll-mt-20 border-t border-edge/55 bg-[radial-gradient(50rem_26rem_at_15%_0%,rgba(40,200,230,.08),transparent_60%)] py-18 sm:py-28"
    >
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <p class="font-mono text-xs uppercase tracking-[0.14em] text-accent">{{ t('home.plugins.eyebrow') }}</p>
        <h2 class="mt-4 max-w-[20ch] font-display text-3xl leading-[1.08] font-semibold tracking-tight text-ink sm:text-[2.75rem]">
          {{ t('home.plugins.title') }}
        </h2>
        <i18n-t keypath="home.plugins.lede" tag="p" scope="global" class="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink-dim">
          <template #link>
            <NuxtLink :to="sitePath('/docs/plugins')" class="text-accent hover:underline">{{ t('home.plugins.ledeLink') }}</NuxtLink>
          </template>
        </i18n-t>

        <div class="mt-12 grid gap-4 lg:grid-cols-3">
          <article
            v-for="tier in tiers"
            :key="tier.title"
            class="flex flex-col gap-3 rounded-[14px] border p-7"
            :class="tier.featured
              ? 'border-accent/35 bg-linear-to-b from-accent/8 to-surface to-55% shadow-[0_0_0_1px_rgba(40,200,230,.12),0_20px_50px_rgba(20,40,50,.10)] dark:shadow-[0_0_0_1px_rgba(40,200,230,.12),0_24px_60px_rgba(0,0,0,.4)]'
              : 'border-edge bg-surface'"
          >
            <p class="font-mono text-[11px] font-semibold leading-none uppercase tracking-[0.14em] text-ink-faint">{{ tier.n }}</p>
            <h3 class="font-display text-xl font-semibold tracking-tight text-ink">{{ tier.title }}</h3>
            <div v-if="tier.formats.length" class="flex flex-wrap gap-1.5">
              <span v-for="f in tier.formats" :key="f" class="rounded border border-edge bg-surface-2 px-2 py-1 font-mono text-[11px] leading-none text-ink">{{ f }}</span>
            </div>
            <p class="text-[0.96rem] leading-relaxed text-ink-dim">
              {{ tier.text }}
              <a v-if="!tier.featured && !tier.formats.length" href="#native" class="text-accent hover:underline">{{ t('home.tiers.seeNative') }}</a>
            </p>
            <span :class="[pill, TONE[tier.tone]]">{{ tier.status }}</span>
            <div class="mt-auto flex justify-between gap-4 border-t border-edge pt-4 font-mono text-xs text-ink-dim">
              <span>{{ tier.costLabel }}</span><b class="text-right font-medium text-ink">{{ tier.cost }}</b>
            </div>
          </article>
        </div>

        <div class="mt-4 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div class="rounded-[14px] border border-edge bg-surface p-7">
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-accent">{{ t('home.crash.eyebrow') }}</p>
            <h3 class="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">{{ t('home.crash.title') }}</h3>
            <p class="mt-3 text-ink-dim">
              {{ t('home.crash.intro') }}
            </p>
            <ol class="mt-5">
              <li
                v-for="[code, what] in timeline"
                :key="code"
                class="grid gap-1 border-b border-dashed border-edge/80 py-2.5 text-[0.92rem] text-ink-dim last:border-0 sm:grid-cols-[9.5rem_1fr] sm:gap-4"
              >
                <code class="font-mono text-accent">{{ code }}</code><span>{{ what }}</span>
              </li>
            </ol>
          </div>
          <div class="grid content-start gap-4">
            <div class="rounded-[14px] border border-edge bg-well px-6 py-5">
              <strong class="block font-display text-3xl leading-none font-semibold tracking-tight text-accent sm:text-[2.4rem]">{{ t('home.crash.bitIdentical') }}</strong>
              <span class="mt-2 block text-sm text-ink-dim">{{ t('home.crash.bitIdenticalText') }}</span>
            </div>
            <div class="rounded-[14px] border border-edge bg-well px-6 py-5">
              <strong class="block font-display text-3xl leading-none font-semibold tracking-tight text-ink sm:text-[2.4rem]">0.000<small class="ml-1 text-[0.5em] tracking-normal text-ink-dim">dB</small></strong>
              <span class="mt-2 block text-sm text-ink-dim">{{ t('home.crash.dbText') }}</span>
            </div>
            <div class="rounded-[14px] border border-edge bg-well px-6 py-5">
              <strong class="block font-display text-3xl leading-none font-semibold tracking-tight text-ink sm:text-[2.4rem]">1<small class="ml-1 text-[0.5em] tracking-normal text-ink-dim">{{ t('home.crash.workerUnit') }}</small></strong>
              <span class="mt-2 block text-sm text-ink-dim">{{ t('home.crash.workerText') }}</span>
            </div>
            <p class="text-[0.82rem] text-ink-faint">{{ t('home.crash.measured') }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Open components -->
    <section id="open" class="scroll-mt-20 border-t border-edge/55 py-18 sm:py-28">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <p class="font-mono text-xs uppercase tracking-[0.14em] text-accent">{{ t('home.open.eyebrow') }}</p>
        <h2 class="mt-4 max-w-[20ch] font-display text-3xl leading-[1.08] font-semibold tracking-tight text-ink sm:text-[2.75rem]">
          {{ t('home.open.title') }}
        </h2>
        <p class="mt-4 max-w-[60ch] text-lg leading-relaxed text-ink-dim">
          {{ t('home.open.lede') }}
        </p>
        <div class="mt-12 grid gap-4 lg:grid-cols-3">
          <a
            v-for="r in repos"
            :key="r.name"
            :href="r.href"
            class="flex flex-col gap-3 rounded-[14px] border border-edge bg-surface p-6 transition hover:-translate-y-0.5 hover:border-accent motion-reduce:transition-none"
          >
            <span :class="[pill, TONE[r.tone]]">{{ r.status }}</span>
            <span class="font-mono text-[1.05rem] font-semibold text-ink">{{ r.name }}</span>
            <p class="text-[0.96rem] leading-relaxed text-ink-dim">{{ r.text }}</p>
            <span class="mt-auto text-sm text-accent">{{ r.go }} →</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Install -->
    <section id="install" class="scroll-mt-20 border-t border-edge/55 py-18 sm:py-28">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <p class="font-mono text-xs uppercase tracking-[0.14em] text-accent">{{ t('home.install.eyebrow') }}</p>
        <h2 class="mt-4 max-w-[20ch] font-display text-3xl leading-[1.08] font-semibold tracking-tight text-ink sm:text-[2.75rem]">
          {{ t('home.install.title') }}
        </h2>
        <p class="mt-4 mb-10 max-w-[60ch] text-lg leading-relaxed text-ink-dim">
          {{ t('home.install.lede') }}
        </p>
        <InstallSteps />
        <i18n-t keypath="home.install.more" tag="p" scope="global" class="mt-10 text-ink-dim">
          <template #getIt>
            <NuxtLink :to="sitePath('/get-it')" class="text-accent hover:underline">{{ t('home.install.getItLink') }}</NuxtLink>
          </template>
          <template #faq>
            <NuxtLink :to="sitePath('/faq')" class="text-accent hover:underline">{{ t('home.install.faqLink') }}</NuxtLink>
          </template>
        </i18n-t>
      </div>
    </section>
  </div>
</template>
