<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
const facts = [
  { label: 'Signal path', value: 'One native node', note: 'C signal processing inside the PipeWire graph.' },
  { label: 'The wire', value: 'REST + SSE', note: 'One door per fact, one stream for all of them.' },
  { label: 'Surfaces', value: 'Any number', note: 'Every client is a remote client.' },
  { label: 'Licence', value: 'GPL-3.0-or-later', note: 'Free software, every package.' },
] as const;

useSeoMeta({
  title: 'openmixer — a software mixing console for Linux',
  description:
    'openmixer takes audio in from a stagebox, mixes it inside a PipeWire graph, and sends the finished mix to the PA. The surface is a web page any number of devices can share.',
});
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 pt-20 pb-16 sm:pt-28">
        <p class="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Live mixing console · Linux · GPL-3.0-or-later
        </p>
        <h1 class="mt-6 max-w-4xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl">
          The console is the software.
        </h1>
        <p class="mt-8 max-w-2xl text-lg leading-relaxed text-ink-dim">
          openmixer takes audio in from a stagebox, mixes it — faders, buses, sends,
          DCAs, a matrix, mix-minus and plugin inserts — inside a PipeWire graph, and
          sends the finished mix back out to the PA. There is no hardware desk in the
          signal path. The surface is a web page, and any number of devices can hold
          it at once: a laptop at front of house, a tablet on the wing, a phone on
          stage.
        </p>

        <div class="mt-10 flex flex-wrap gap-3">
          <UButton to="/architecture" size="lg" color="primary" trailing-icon="i-lucide-arrow-right">
            How it is built
          </UButton>
          <UButton to="/get-it" size="lg" color="neutral" variant="outline">
            Get it
          </UButton>
        </div>

        <dl class="mt-16 grid max-w-4xl gap-x-10 gap-y-6 border-t border-edge pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="f in facts" :key="f.label">
            <dt class="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">{{ f.label }}</dt>
            <dd class="mt-1 font-display text-lg text-ink">{{ f.value }}</dd>
            <dd class="mt-1 text-sm leading-relaxed text-ink-dim">{{ f.note }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- The screenshot, first thing, because it is real -->
    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-14">
        <Shot
          src="/img/console-channels.png"
          alt="The openmixer surface: a channel strip with gain, trim, pan, phantom and the EQ curve above a wall of sixteen faders and the main strip."
          caption="The running console. Channel 9 selected on its processing rack; sixteen input strips and MAIN below."
        />
      </div>
    </section>

    <!-- Three claims -->
    <section>
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="What it actually is" title="One model, one door, one audio path." />
        <div class="grid gap-5 md:grid-cols-3">
          <Slab title="A device-neutral model" tag="core">
            <p>
              One canonical mixer model sits in the middle — channels, faders, buses,
              sends, DCAs, the matrix, latency paths, sessions. The surface, the audio
              engine and the I/O all plug into that model and none of them assumes a
              particular desk.
            </p>
            <p>
              Real desks can be attached through adapters, but they are one optional
              control path, not the product.
            </p>
          </Slab>
          <Slab title="State distribution is the product" tag="server">
            <p>
              The server holds the authoritative console state and serves it as REST
              entities. Every entity is <code class="font-mono text-ink">GET</code>,
              <code class="font-mono text-ink">PATCH</code> and
              <code class="font-mono text-ink">OPTIONS</code>-able, and any
              <code class="font-mono text-ink">GET</code> takes
              <code class="font-mono text-ink">?watch=1</code> to become a live SSE
              stream.
            </p>
            <p>
              Every client is a remote client. Keeping them all looking at the same
              desk is the hard part, and it is the part the design is about.
            </p>
          </Slab>
          <Slab title="One native node, not a pile" tag="pipewire-native">
            <p>
              The structural DSP — per-strip gain, fader, pan, polarity, summing, the
              EQ bank, gate, compressor, delay, reverb and the RTA tap — is one C
              <code class="font-mono text-ink">pw_filter</code> node per stagebox
              group. Not a stack of loopback subprocesses.
            </p>
            <p>
              LV2 plugin inserts sit on top of that, hosted by
              <code class="font-mono text-ink">mod-host</code> and wired per strip and
              per output.
            </p>
          </Slab>
        </div>
      </div>
    </section>

    <!-- Honest status -->
    <section class="border-t border-edge bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="Status" title="It runs live, and it is not finished." />
        <div class="grid gap-10 md:grid-cols-2">
          <div class="space-y-4 text-sm leading-relaxed text-ink-dim">
            <p>
              openmixer has been driven on a real rig &mdash; a Roland stagebox and an
              RME Babyface Pro &mdash; and the native engine has been mixing through a
              real show since 2026-07-06. Phantom power has been confirmed at the XLR
              pins with the console independently agreeing. Two stageboxes have been
              established at once, and the fabric has been re-paced between 48 and
              96 kHz with the house up.
            </p>
            <p>
              Other parts are not there yet. Recording is landing now and has never
              captured a show. The X-Touch surface is implemented and has never been
              driven on real hardware. The matrix has addresses and a surface and does
              not carry audio.
            </p>
            <p>
              The feature pages label each item by how far it has actually been proven,
              and the known limitations are listed rather than omitted. There is no
              packaged download yet; building from source is the way in.
            </p>
          </div>
          <div class="rounded border border-edge bg-field p-6">
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">
              How anything here gets called finished
            </p>
            <blockquote class="mt-4 border-l-2 border-accent pl-4 font-display text-lg leading-snug text-ink">
              If a control claims to affect audio, measure audio.
            </blockquote>
            <p class="mt-4 text-sm leading-relaxed text-ink-dim">
              A control can read back perfectly and reach nothing at all. So the signal
              processing is checked against values worked out on paper rather than
              captured from a run, graph changes are verified on the live graph rather
              than on the model of it, and a phantom claim needs a person at the
              connector &mdash; never a soft indicator on a screen.
            </p>
            <p class="mt-4 text-sm leading-relaxed text-ink-dim">
              Nothing on this site describes a capability that does not exist.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
