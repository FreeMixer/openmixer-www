<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/** Installing the FreeMixer packages and a first run. Shared by the home page and /get-it. */
const fedora = [
  'sudo dnf config-manager addrepo --from-repofile=https://freemixer.github.io/rpm/freemixer.repo',
  'sudo dnf install omx-clap-host plugin-hostd',
];
const debian = [
  'curl -fsSL https://freemixer.github.io/deb/freemixer.asc | sudo tee /usr/share/keyrings/freemixer.asc >/dev/null',
  'echo "deb [signed-by=/usr/share/keyrings/freemixer.asc] https://freemixer.github.io/deb/debian/$(. /etc/os-release; echo $VERSION_CODENAME) ./" | sudo tee /etc/apt/sources.list.d/freemixer.list',
  'sudo apt update && sudo apt install omx-clap-host plugin-hostd',
];
const tryIt = [
  '# Every CLAP plugin on this machine, with its parameters and ports.',
  'omx-clap-scan',
  '',
  '# The plugin supervisor. It speaks mod-host\'s protocol, so anything that',
  '# drives mod-host drives it. It prints "plugin-hostd ready!" once it listens.',
  'plugin-hostd -n -p 5555 -f 5556',
];
</script>

<template>
  <div>
    <div class="grid gap-8 lg:grid-cols-2">
      <div class="min-w-0">
        <h3 class="mb-3 font-display text-lg text-ink">Fedora 44</h3>
        <CodeBlock :lines="fedora" />
      </div>
      <div class="min-w-0">
        <h3 class="mb-3 font-display text-lg text-ink">Debian bookworm or trixie, Raspberry Pi OS, Zynthian</h3>
        <CodeBlock :lines="debian" />
      </div>
    </div>
    <p class="mt-6 text-sm leading-relaxed text-ink-faint">
      The repositories and every package are signed with one key:
      <a href="https://freemixer.github.io/rpm/RPM-GPG-KEY-freemixer" class="text-accent hover:underline">RPM-GPG-KEY-freemixer</a>,
      <a href="https://freemixer.github.io/deb/freemixer.asc" class="text-accent hover:underline">freemixer.asc</a>.
      The -devel and -dev packages carry the headers to build your own host against them.
    </p>

    <div class="mt-14">
      <SectionHead eyebrow="Try it" title="Two commands after the install." />
      <CodeBlock :lines="tryIt" />
    </div>
  </div>
</template>
