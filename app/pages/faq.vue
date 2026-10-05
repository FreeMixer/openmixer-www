<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
const { t, tm, rt } = useI18n();
const sitePath = useSitePath();
useSeoMeta({
  title: () => t('faq.seo.title'),
  description: () => t('faq.seo.description'),
});

/** One question: its message key under `faq.groups.<group>.items`, and where the full explanation lives, when the answer is the short version of one. */
interface QaDef { readonly id: string; readonly link?: string }
interface GroupDef { readonly id: string; readonly items: readonly QaDef[] }

/** The order of the page. Every text lives in i18n/locales/<lang>/faq.json. */
const defs: readonly GroupDef[] = [
  {
    id: 'whatItIs',
    items: [
      { id: 'remote' },
      { id: 'multiUser' },
      { id: 'offline' },
      { id: 'licence' },
    ],
  },
  {
    id: 'sound',
    items: [
      { id: 'monoFold', link: '/docs/architecture/one-summing-bus#why-the-mono-fold-and-the-pan-law-are-fixed-numbers-not-settings' },
      { id: 'twiceLoud', link: '/docs/architecture/one-summing-bus#the-three-doublings' },
      { id: 'powerAmplitude', link: '/docs/architecture/one-summing-bus#power-amplitude-and-loudness' },
    ],
  },
  {
    id: 'running',
    items: [
      { id: 'package', link: '/get-it' },
      { id: 'quietChannel' },
      { id: 'requirements' },
      { id: 'pllClock', link: '/docs/hardware/clocking-and-sample-rate' },
      { id: 'sampleRates' },
      { id: 'lv2' },
      { id: 'offlineMode' },
    ],
  },
  {
    id: 'building',
    items: [
      { id: 'script' },
      { id: 'watch' },
      { id: 'websocket' },
    ],
  },
  {
    id: 'recording',
    items: [
      { id: 'storage' },
      { id: 'whatRecorded' },
      { id: 'armMidTake' },
      { id: 'armMany' },
      { id: 'print' },
      { id: 'emptyTrack' },
      { id: 'virtualSoundcheck' },
      { id: 'playRefused' },
      { id: 'otherRate' },
      { id: 'recordAndPlay' },
      { id: 'trust' },
    ],
  },
  {
    id: 'refusals',
    items: [
      { id: 'insertBudget' },
      { id: 'monoStrip' },
      { id: 'postFader' },
      { id: 'hostSlots' },
      { id: 'takeRate' },
      { id: 'soundcheckLoaded' },
      { id: 'noChannel' },
      { id: 'diskSpace' },
      { id: 'noMain' },
      { id: 'applyConfirm' },
      { id: 'undoMoved' },
      { id: 'mastering' },
      { id: 'slaveRate' },
    ],
  },
  {
    id: 'trust',
    items: [
      { id: 'realShow' },
      { id: 'reachAudio' },
      { id: 'roland' },
    ],
  },
];

/** The paragraphs of one answer, rendered in the current language. */
const paragraphs = (key: string): string[] => {
  const messages = tm(key);
  return Array.isArray(messages) ? messages.map((m) => rt(m)) : [];
};

const groups = computed(() =>
  defs.map((g) => ({
    id: g.id,
    heading: t(`faq.groups.${g.id}.heading`),
    items: g.items.map((d) => {
      const base = `faq.groups.${g.id}.items.${d.id}`;
      return {
        id: d.id,
        q: t(`${base}.q`),
        a: paragraphs(`${base}.a`),
        link: d.link ? { href: sitePath(d.link), label: t(`${base}.link`) } : undefined,
      };
    }),
  })),
);
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('faq.hero.eyebrow')"
      :title="t('faq.hero.title')"
      :lede="t('faq.hero.lede')"
    />

    <section>
      <div class="mx-auto max-w-4xl px-6 py-16">
        <div v-for="g in groups" :key="g.id" class="mb-14 last:mb-0">
          <h2 class="font-mono text-xs uppercase tracking-[0.2em] text-accent">{{ g.heading }}</h2>
          <dl class="mt-6">
            <div v-for="qa in g.items" :key="qa.id" class="border-t border-edge py-7 first:border-t-0 first:pt-0">
              <dt class="font-display text-lg font-semibold tracking-tight text-ink">{{ qa.q }}</dt>
              <dd class="mt-3 space-y-3 text-base leading-relaxed text-ink-dim">
                <p v-for="(para, i) in qa.a" :key="i">{{ para }}</p>
                <p v-if="qa.link">
                  <NuxtLink :to="qa.link.href" class="text-accent hover:underline">{{ qa.link.label }}</NuxtLink>
                </p>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  </div>
</template>
