<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
const { t } = useI18n();
const sitePath = useSitePath();
useSeoMeta({
  title: () => t('features.seo.title'),
  description: () => t('features.seo.description'),
});

/** The smart-alignment rig run of 2026-08-31, as measured. */
const alignRows = [
  { dialled: '0 ms', measured: '0.000 ms', coherence: '1.000' },
  { dialled: '0.5 ms', measured: '0.473 ms', coherence: '1.000' },
  { dialled: '2 ms', measured: '1.903 ms', coherence: '0.998' },
  { dialled: '5 ms', measured: '4.731 ms', coherence: '0.990' },
  { dialled: '10 ms', measured: '9.374 ms', coherence: '0.767' },
];
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('features.hero.eyebrow')"
      :title="t('features.hero.title')"
      :lede="t('features.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <FeatureRow :title="t('features.desk.title')" state="live">
          <div class="space-y-3">
            <p>{{ t('features.desk.p1') }}</p>
            <p>{{ t('features.desk.p2') }}</p>
          </div>
          <div class="space-y-3">
            <p>{{ t('features.desk.p3') }}</p>
            <p class="text-ink-faint">{{ t('features.desk.p4') }}</p>
          </div>
        </FeatureRow>

        <FeatureRow :title="t('features.native.title')" state="measured">
          <div class="space-y-3">
            <p>{{ t('features.native.p1') }}</p>
          </div>
          <div class="space-y-3">
            <p>{{ t('features.native.p2') }}</p>
          </div>
        </FeatureRow>

        <FeatureRow :title="t('features.rta.title')" state="live">
          <div class="space-y-3">
            <p>{{ t('features.rta.p1') }}</p>
          </div>
          <div class="space-y-3">
            <p>{{ t('features.rta.p2') }}</p>
          </div>
        </FeatureRow>

        <div class="my-10">
          <Shot
            src="/img/console-rta.png"
            :alt="t('features.rta.shotAlt')"
            :caption="t('features.rta.shotCaption')"
          />
        </div>

        <FeatureRow :title="t('features.feedback.title')" state="live">
          <div class="space-y-3">
            <p>{{ t('features.feedback.p1') }}</p>
          </div>
          <div class="space-y-3">
            <p>{{ t('features.feedback.p2') }}</p>
            <p class="text-ink-faint">{{ t('features.feedback.p3') }}</p>
          </div>
        </FeatureRow>

        <FeatureRow :title="t('features.align.title')" state="live">
          <div class="space-y-3">
            <p>{{ t('features.align.p1') }}</p>
            <p v-html="t('features.align.p2')" />
            <p class="text-ink-faint">{{ t('features.align.p3') }}</p>
          </div>
          <div>
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">
              {{ t('features.align.measuredOn') }}
            </p>
            <div class="mt-3 overflow-x-auto rounded border border-edge">
              <table class="w-full border-collapse font-mono text-sm">
                <thead>
                  <tr class="border-b border-edge bg-surface/60 text-left text-ink-faint">
                    <th class="px-4 py-2 font-normal">{{ t('features.align.colDialled') }}</th>
                    <th class="px-4 py-2 font-normal">{{ t('features.align.colMeasured') }}</th>
                    <th class="px-4 py-2 font-normal">{{ t('features.align.colCoherence') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in alignRows" :key="r.dialled" class="border-b border-edge/60 last:border-0">
                    <td class="px-4 py-2 text-ink-dim">{{ r.dialled }}</td>
                    <td class="px-4 py-2 text-ink">{{ r.measured }}</td>
                    <td class="px-4 py-2 text-ink-dim">{{ r.coherence }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="mt-3 text-sm leading-relaxed text-ink-faint">
              {{ t('features.align.converge') }}
            </p>
          </div>
        </FeatureRow>

        <FeatureRow :title="t('features.lv2.title')" state="measured">
          <div class="space-y-3">
            <p v-html="t('features.lv2.p1')" />
            <p v-html="t('features.lv2.p2')" />
          </div>
          <div class="space-y-3">
            <p>{{ t('features.lv2.p3') }}</p>
            <p class="text-ink-faint" v-html="t('features.lv2.p4')" />
          </div>
        </FeatureRow>

        <FeatureRow :title="t('features.reac.title')" state="live">
          <div class="space-y-3">
            <p>{{ t('features.reac.p1') }}</p>
            <p>{{ t('features.reac.p2') }}</p>
          </div>
          <div class="space-y-3">
            <p>{{ t('features.reac.p3') }}</p>
            <p class="text-ink-faint">{{ t('features.reac.p4') }}</p>
          </div>
        </FeatureRow>

        <div class="my-10">
          <Shot
            src="/img/console-patchbay.png"
            :alt="t('features.reac.shotAlt')"
            :caption="t('features.reac.shotCaption')"
          />
        </div>

        <FeatureRow :title="t('features.surface.title')" state="live">
          <div class="space-y-3">
            <p>{{ t('features.surface.p1') }}</p>
            <p>{{ t('features.surface.p2') }}</p>
            <p>{{ t('features.surface.p3') }}</p>
          </div>
          <div class="space-y-3">
            <p v-html="t('features.surface.p4')" />
            <p>{{ t('features.surface.p5') }}</p>
          </div>
        </FeatureRow>

        <FeatureRow :title="t('features.surfaces.title')" state="building">
          <div class="space-y-3">
            <p>{{ t('features.surfaces.p1') }}</p>
          </div>
          <div class="space-y-3">
            <p class="text-ink-faint">{{ t('features.surfaces.p2') }}</p>
          </div>
        </FeatureRow>

        <FeatureRow :title="t('features.recorder.title')" state="building">
          <div class="space-y-3">
            <p>{{ t('features.recorder.p1') }}</p>
          </div>
          <div class="space-y-3">
            <p>{{ t('features.recorder.p2') }}</p>
            <p class="text-ink-faint">{{ t('features.recorder.p3') }}</p>
          </div>
        </FeatureRow>
      </div>
    </section>

    <section class="bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead :eyebrow="t('features.limits.eyebrow')" :title="t('features.limits.title')" />
        <div class="grid gap-8 lg:grid-cols-2">
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <p>{{ t('features.limits.intro') }}</p>
            <ul class="space-y-3">
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">{{ t('features.limits.showHead') }}</span>
                {{ t('features.limits.showBody') }}
              </li>
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">{{ t('features.limits.alignHead') }}</span>
                {{ t('features.limits.alignBody') }}
              </li>
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">{{ t('features.limits.matrixHead') }}</span>
                {{ t('features.limits.matrixBody') }}
              </li>
            </ul>
          </div>
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <ul class="space-y-3">
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">{{ t('features.limits.surfacesHead') }}</span>
                {{ t('features.limits.surfacesBody') }}
              </li>
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">{{ t('features.limits.rateHead') }}</span>
                {{ t('features.limits.rateBody') }}
              </li>
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">{{ t('features.limits.recHead') }}</span>
                {{ t('features.limits.recBody') }}
              </li>
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">{{ t('features.limits.packageHead') }}</span>
                <i18n-t keypath="features.limits.packageBody" tag="span" scope="global">
                  <template #link>
                    <NuxtLink :to="sitePath('/get-it')" class="text-accent hover:underline">{{ t('features.limits.packageLink') }}</NuxtLink>
                  </template>
                </i18n-t>
              </li>
            </ul>
            <p class="text-sm text-ink-faint">{{ t('features.limits.footer') }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
