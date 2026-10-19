<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * Connecting a Digidesign Control|24: what DigiNet is on the wire, what the network must give
 * the desk, and installing libdiginet and diginet-probe. The protocol facts come from
 * FreeMixer/libdiginet docs/protocol.md, where each one is cited to its source.
 */
const { t } = useI18n();

useSeoMeta({
  title: () => t('docsControl24.seo.title'),
  description: () => t('docsControl24.seo.description'),
});

const needs = computed(() =>
  (['segment', 'vlan', 'wired', 'reac'] as const).map((k) => ({
    head: t(`docsControl24.needs.${k}.head`),
    body: t(`docsControl24.needs.${k}.body`),
  })),
);

const fedora = [
  'sudo dnf config-manager addrepo --from-repofile=https://freemixer.github.io/rpm/freemixer.repo',
  'sudo dnf install diginet-tools',
];
const debian = [
  'curl -fsSL https://freemixer.github.io/deb/freemixer.asc | sudo tee /usr/share/keyrings/freemixer.asc >/dev/null',
  'echo "deb [signed-by=/usr/share/keyrings/freemixer.asc] https://freemixer.github.io/deb/debian/$(. /etc/os-release; echo $VERSION_CODENAME) ./" | sudo tee /etc/apt/sources.list.d/freemixer.list',
  'sudo apt update && sudo apt install diginet-tools',
];
const tabs = [
  { label: 'Fedora', value: 'fedora', slot: 'fedora' as const },
  { label: 'Debian · Raspberry Pi OS', value: 'debian', slot: 'debian' as const },
];
const distro = ref('fedora');
onMounted(() => {
  if (/Debian|Raspbian|Ubuntu/i.test(navigator.userAgent)) distro.value = 'debian';
});

const packages = computed(() => [
  ['libdiginet · libdiginet0 · libdiginet-transport0', t('docsControl24.install.pkgLib')],
  ['diginet-tools', t('docsControl24.install.pkgTools')],
  ['libdiginet-devel · libdiginet-dev', t('docsControl24.install.pkgDevel')],
] as const);

const firstLook = computed(() => [
  `# ${t('docsControl24.install.listen')}`,
  "sudo tcpdump -i <if> -e 'ether proto 0x885f'",
  '',
  `# ${t('docsControl24.install.probe')}`,
  'diginet-probe -i <if>',
]);
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('docsControl24.hero.eyebrow')"
      :title="t('docsControl24.hero.title')"
      :lede="t('docsControl24.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" :title="t('docsControl24.wire.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsControl24.wire.p1')" />
          <p v-html="t('docsControl24.wire.p2')" />
          <p>{{ t('docsControl24.wire.p3') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" :title="t('docsControl24.share.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsControl24.share.p1') }}</p>
          <p>{{ t('docsControl24.share.p2') }}</p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" :title="t('docsControl24.needs.title')" />
        <ul class="space-y-5 text-base leading-relaxed text-ink-dim">
          <li v-for="n in needs" :key="n.head" class="border-l-2 border-edge-strong pl-4">
            <p class="text-ink">{{ n.head }}</p>
            <p class="mt-1">{{ n.body }}</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" :title="t('docsControl24.security.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>{{ t('docsControl24.security.p1') }}</p>
          <p>{{ t('docsControl24.security.p2') }}</p>
          <p v-html="t('docsControl24.security.p3')" />
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="05" :title="t('docsControl24.install.title')" />
        <p class="mb-6 text-base leading-relaxed text-ink-dim">{{ t('docsControl24.install.intro') }}</p>
        <div class="overflow-hidden rounded-lg border border-edge bg-surface">
          <UTabs
            v-model="distro"
            :items="tabs"
            variant="link"
            color="primary"
            :ui="{ list: 'border-b border-edge px-2 overflow-x-auto', trigger: 'flex-none py-3', content: 'p-5' }"
          >
            <template #fedora>
              <CodeBlock :lines="fedora" />
            </template>
            <template #debian>
              <CodeBlock :lines="debian" />
            </template>
          </UTabs>
        </div>
        <div class="mt-5 grid gap-3 md:grid-cols-3">
          <div v-for="[name, what] in packages" :key="name" class="rounded-lg border border-edge bg-surface p-4">
            <p class="font-mono text-sm text-ink">{{ name }}</p>
            <p class="mt-1 text-sm text-ink-dim">{{ what }}</p>
          </div>
        </div>
        <div class="mt-8 space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsControl24.install.caps')" />
          <p>{{ t('docsControl24.install.firstLook') }}</p>
        </div>
        <div class="mt-5">
          <CodeBlock :lines="firstLook" />
        </div>
        <p class="mt-4 text-sm leading-relaxed text-ink-faint" v-html="t('docsControl24.install.probeDoc')" />
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="06" :title="t('docsControl24.status.title')" />
        <div class="flex gap-3 border-l-2 border-edge-strong pl-4 text-base leading-relaxed text-ink-dim">
          <StatusTag state="building" />
          <div class="space-y-4">
            <p>{{ t('docsControl24.status.p1') }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
