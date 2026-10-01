<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/** Installing the OpenMixer packages and a first run. Shared by the home page and /get-it. */
const { t } = useI18n();
const fedora = [
  'sudo dnf config-manager addrepo --from-repofile=https://freemixer.github.io/rpm/freemixer.repo',
  'sudo dnf install omx-clap-host plugin-hostd',
];
const debian = [
  'curl -fsSL https://freemixer.github.io/deb/freemixer.asc | sudo tee /usr/share/keyrings/freemixer.asc >/dev/null',
  'echo "deb [signed-by=/usr/share/keyrings/freemixer.asc] https://freemixer.github.io/deb/debian/$(. /etc/os-release; echo $VERSION_CODENAME) ./" | sudo tee /etc/apt/sources.list.d/freemixer.list',
  'sudo apt update && sudo apt install omx-clap-host plugin-hostd',
];
const tryIt = computed(() => [
  `# ${t('common.install.tryScan')}`,
  'omx-clap-scan',
  '',
  ...t('common.install.tryHostd').split('\n').map((l) => `# ${l}`),
  'plugin-hostd -n -p 5555 -f 5556',
]);
const tabs = [
  { label: 'Fedora', value: 'fedora', slot: 'fedora' as const },
  { label: 'Debian · Raspberry Pi OS · Zynthian', value: 'debian', slot: 'debian' as const },
];
const packages = computed(() => [
  ['omx-clap-host', t('common.install.pkgClapHost')],
  ['plugin-hostd', t('common.install.pkgHostd')],
  ['-devel · -dev', t('common.install.pkgDevel')],
] as const);

/** Open on the reader's own family when the browser says which one it is. */
const distro = ref('fedora');
onMounted(() => {
  if (/Debian|Raspbian|Ubuntu/i.test(navigator.userAgent)) distro.value = 'debian';
});
</script>

<template>
  <div>
    <div class="overflow-hidden rounded-lg border border-edge bg-surface">
      <UTabs
        v-model="distro"
        :items="tabs"
        variant="link"
        color="primary"
        :ui="{ list: 'border-b border-edge px-2 overflow-x-auto', trigger: 'flex-none py-3', content: 'p-5' }"
      >
        <template #fedora>
          <p class="mb-4 text-sm text-ink-dim">{{ t('common.install.fedora') }}</p>
          <CodeBlock :lines="fedora" />
        </template>
        <template #debian>
          <p class="mb-4 text-sm text-ink-dim">{{ t('common.install.debian') }}</p>
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
    <p class="mt-4 text-sm leading-relaxed text-ink-faint">
      {{ t('common.install.signed') }}
      <a href="https://freemixer.github.io/rpm/RPM-GPG-KEY-freemixer" class="text-accent hover:underline">RPM-GPG-KEY-freemixer</a>,
      <a href="https://freemixer.github.io/deb/freemixer.asc" class="text-accent hover:underline">freemixer.asc</a>.
    </p>

    <div class="mt-14">
      <SectionHead :eyebrow="t('common.install.tryEyebrow')" :title="t('common.install.tryTitle')" />
      <CodeBlock :lines="tryIt" />
    </div>
  </div>
</template>
