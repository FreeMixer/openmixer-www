<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
useSeoMeta({
  title: 'Links — openmixer',
  description:
    'The openmixer source repository, the sibling FreeREAC interoperability project, and the upstream projects openmixer is built on.',
});
</script>

<template>
  <div>
    <PageHero
      eyebrow="Links"
      title="Where the code is, and what it stands on."
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="The project" title="Source." />
        <div class="grid gap-5 md:grid-cols-2">
          <article class="rounded border border-edge bg-surface/60 p-6">
            <div class="flex items-baseline gap-3">
              <h3 class="font-display text-lg font-semibold tracking-tight text-ink">openmixer</h3>
              <span class="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                not public yet
              </span>
            </div>
            <div class="mt-3 space-y-2 text-sm leading-relaxed text-ink-dim">
              <p>
                The whole console: the model, the server, the surface, the native
                PipeWire engine and its C signal processing, the plugin catalog, the
                adapters and the documentation set. A pnpm workspace,
                GPL-3.0-or-later.
              </p>
              <p>
                The repository is not open to the public at the moment, so there is no
                link here. When that changes this card gets one.
              </p>
            </div>
          </article>
          <LinkCard
            title="FreeREAC"
            href="https://github.com/FreeREAC"
            label="github.com/FreeREAC"
          >
            <p>
              The sibling project: open documentation and tools for Roland's REAC, the
              audio-over-Ethernet protocol the stageboxes speak. openmixer holds the
              control path for a stagebox; FreeREAC is where the protocol work lives.
            </p>
          </LinkCard>
        </div>
      </div>
    </section>

    <section class="bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="Upstream" title="What openmixer is built on." >
          <p class="mt-4 max-w-3xl text-base leading-relaxed text-ink-dim">
            None of these are ours. They are the projects the console would not exist
            without, and the ones to read if you want to understand the layer underneath
            it.
          </p>
        </SectionHead>
        <div class="grid gap-5 md:grid-cols-3">
          <LinkCard title="PipeWire" href="https://pipewire.org" label="pipewire.org">
            <p>
              The audio graph the console lives in. openmixer's engine is a native
              PipeWire client and its signal processing is a filter node in that graph.
            </p>
          </LinkCard>
          <LinkCard title="LV2" href="https://lv2plug.in" label="lv2plug.in">
            <p>
              The plugin standard the insert chains use. Anything that ships an LV2 can
              be racked into a strip or an output.
            </p>
          </LinkCard>
          <LinkCard title="mod-host" href="https://github.com/moddevices/mod-host" label="github.com/moddevices/mod-host">
            <p>
              The LV2 host the insert chains are built on, from MOD Devices.
            </p>
          </LinkCard>
        </div>
      </div>
    </section>
  </div>
</template>
