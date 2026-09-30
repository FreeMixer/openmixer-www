<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
useSeoMeta({
  title: 'Get it — openmixer',
  description:
    'Install the FreeMixer plugin hosts from signed packages for Fedora, Debian, Raspberry Pi OS and Zynthian, and try them.',
});
</script>

<template>
  <div>
    <PageHero
      eyebrow="Get it"
      title="Install from our packages."
      lede="omx-clap-host and plugin-hostd, the plugin hosts openmixer runs on, are signed packages for Fedora and Debian, on x86_64 and ARM64. The console itself is not published yet."
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="Install" title="Add the repository, install the packages." />
        <InstallSteps />
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="Before a show" title="Read these two things first." />
        <div class="grid gap-5 sm:grid-cols-2">
          <Slab title="Getting started" tag="documentation">
            <p>
              It takes a fresh install from silence to one channel audible in the main
              mix. Everything else in the manual assumes you have done it once.
            </p>
            <p>
              <NuxtLink to="/docs/getting-started" class="text-accent hover:underline">Read it before you open the surface.</NuxtLink>
            </p>
          </Slab>
          <Slab title="The known limitations" tag="honesty">
            <p>
              The matrix does not carry audio yet, a show load is not a reset, delay
              alignment is not saved, and no control surface has been verified on
              hardware.
            </p>
            <p>
              <NuxtLink to="/features" class="text-accent hover:underline">The full list is on the features page.</NuxtLink>
            </p>
          </Slab>
        </div>
      </div>
    </section>
  </div>
</template>
