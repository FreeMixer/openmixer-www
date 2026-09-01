<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
useSeoMeta({
  title: 'Get it — openmixer',
  description:
    'Build openmixer from source, run the server and the surface, and build local RPM packages. There is no published package repository yet, and this page says so.',
});

const build = [
  '# Node 22 or newer, and pnpm. From the top of the workspace:',
  'pnpm install',
  'pnpm -r build',
];
const run = [
  '# One boot path: no config file and no environment needed to come up as a real desk.',
  'pnpm --filter @openmixer/server exec openmixer-server',
  '',
  '# It binds 0.0.0.0:8080 and serves the REST entity API.',
  '# In another terminal, the surface in development mode:',
  'pnpm --filter @openmixer/web-ui dev',
];
const check = [
  '# Ask the console what it serves.',
  'curl -s http://127.0.0.1:8080/api/ | head',
  '',
  '# Read one fact, then follow it live.',
  'curl -s http://127.0.0.1:8080/api/channel/input/1/fader',
  'curl -N  http://127.0.0.1:8080/api/channel/input/1/fader?watch=1',
];
const rpm = [
  '# Builds the Fedora packages. Nothing is installed on the build host.',
  'scripts/build-rpm.sh',
  '',
  '# Results land here.',
  'ls build/rpm/RPMS/',
];
</script>

<template>
  <div>
    <PageHero
      eyebrow="Get it"
      title="Build it from source — when there is a source to clone."
      lede="That is the honest answer today — and there is a step in front of it: the source is not public yet. This page says what there is rather than what would be convenient."
    >
      <div class="mt-8 max-w-3xl rounded border border-edge-strong bg-surface/60 p-6">
        <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">
          Before you read any further
        </p>
        <p class="mt-3 text-base leading-relaxed text-ink-dim">
          The openmixer repository is <span class="text-ink">not public yet</span>. There
          is no clone URL on this page, because there is nothing a clone URL would reach.
          The build below is accurate and it is not yet something a stranger can run.
        </p>
        <p class="mt-3 text-base leading-relaxed text-ink-dim">
          It is written down now because the console is real and running, and because a
          project page that implies a download it does not have is worse than one that
          admits the gap.
        </p>
      </div>
    </PageHero>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" title="Build" />
        <p class="mb-6 text-base leading-relaxed text-ink-dim">
          It needs Linux with PipeWire, Node 22 or newer, and pnpm. Audio can come from
          anything PipeWire can see, so a plain USB interface is enough — a stagebox is
          not required.
        </p>
        <CodeBlock :lines="build" />

        <div class="mt-14">
          <SectionHead eyebrow="02" title="Run it" />
          <p class="mb-6 text-base leading-relaxed text-ink-dim">
            There is one boot path — the console — so it needs no configuration file and
            no environment to come up as a real desk.
          </p>
          <CodeBlock :lines="run" />
          <p class="mt-4 text-sm leading-relaxed text-ink-faint">
            The surface does not hardcode the console's address. It discovers the
            endpoint from the origin that served it, which is what lets one build serve
            a development split, a packaged install and a tablet on the wing without
            being rebuilt for each.
          </p>
        </div>

        <div class="mt-14">
          <SectionHead eyebrow="03" title="Check it is really there" />
          <p class="mb-6 text-base leading-relaxed text-ink-dim">
            The console is addressable by hand, on purpose. If this works, everything
            else will.
          </p>
          <CodeBlock :lines="check" />
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="Packages" title="The RPM story, as it actually stands." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            The packaging is real and reasonably careful. There is a full Fedora
            specification producing a server package, the surface, the documentation
            set, a meta-package, and four curated plugin tiers. The native addon is
            rebuilt from C sources during the package build rather than copied from a
            developer's machine, so it matches the host's Node ABI instead of the one it
            happened to be compiled against.
          </p>
          <CodeBlock :lines="rpm" />
          <p>
            What does not exist is a published repository. The tooling to sign packages
            and assemble a signed repository is written and has never been pointed at a
            public host. Until it is, installing means building the packages yourself and
            installing the files, or running from source.
          </p>
          <p class="text-ink-faint">
            If you read an installation guide that begins with a package manager command
            and a repository URL, it is describing the intended end state and not
            something you can do today.
          </p>
        </div>
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
