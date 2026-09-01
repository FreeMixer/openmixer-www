<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
useSeoMeta({
  title: 'Documentation — openmixer',
  description:
    'The openmixer documentation set: an operator manual, installation and first-session guides, hardware notes, troubleshooting, and an administrator reference.',
});

const manualDesk = [
  { title: 'The surface', blurb: 'The header, the layout chips, the fader bay, and where to find things that are not where you would first look.' },
  { title: 'The channel strip', blurb: 'Signal order, trim, the tile controls, selecting and naming.' },
  { title: 'Head-amp control', blurb: 'Phantom power, pad, sensitivity and polarity, including on a REAC stagebox.' },
  { title: 'EQ and dynamics', blurb: 'The interactive EQ curve, the gate and the compressor.' },
  { title: 'Feedback suppression', blurb: 'Ring-out and live modes, sensitivity, notch width, and the roster of planted notches.' },
  { title: 'Plugins, the rack and skins', blurb: 'Inserts, the picker, the generated editor, ordering and skins.' },
];
const manualMix = [
  { title: 'Sends, buses, groups and DCAs', blurb: 'Aux sends, sends-on-faders, bus masters, subgroups, DCAs and mute groups.' },
  { title: 'The matrix and outputs', blurb: 'Matrix outputs and per-output processing.' },
  { title: 'Cue, solo and the monitor', blurb: 'PFL, AFL, solo-in-place, the monitor output, level and dim.' },
  { title: 'The patchbay and the graph', blurb: 'Crosspoint patching, multi-source channels, and reading the live graph.' },
  { title: 'Metering and latency', blurb: 'What the meters are measuring, where they tap, and the latency report.' },
  { title: 'Talkback and test signals', blurb: 'Talkback routing and the built-in generators.' },
];
const manualShow = [
  { title: 'Scenes, snapshots and saving your work', blurb: 'Sessions, scenes, recall safe, and what a save actually captures.' },
  { title: 'Console profiles, personalities and themes', blurb: 'Console appliances, the visual personality axis, and the dark, light and high-contrast themes.' },
  { title: 'Keyboard reference', blurb: 'Every shortcut the surface answers to.' },
];
const install = [
  { title: 'Installing', blurb: 'What the packages are and what each one puts on the machine.' },
  { title: 'Services', blurb: 'The units that run, what starts what, and in which order.' },
  { title: 'First boot', blurb: 'From an installed machine to a console that answers.' },
  { title: 'Your first session', blurb: 'From a fresh install to one channel audible in the main mix.' },
  { title: 'Upgrading', blurb: 'What survives an upgrade and what to check afterwards.' },
];
const hardware = [
  { title: 'REAC stageboxes', blurb: 'Roland S-series boxes: what is supported, how they are patched, and how head-amp control behaves.' },
  { title: 'Clocking and sample rate', blurb: 'Who owns the clock, what a rate change does, and which rates are proven.' },
  { title: 'Wiring and the network interface', blurb: 'The segment a stagebox needs and the mistakes that quietly cost you a show.' },
];
const trouble = [
  { title: 'The web surface cannot reach the server', blurb: 'Including why a full console that moves nothing is a deliberate offline mode, not an error.' },
  { title: 'The main output is silent', blurb: 'The moving main meter is the important detail; it narrows the fault to the way out of the desk.' },
  { title: 'A stagebox will not establish', blurb: 'What to check on the box, the segment and the console, in order.' },
  { title: 'Granulated audio', blurb: 'What granular or stuttering audio points at, and which of them you can fix during a changeover.' },
  { title: 'Dropouts and driver election', blurb: 'Underruns caused by which device is driving the graph.' },
  { title: 'The plugin catalog is empty', blurb: 'Usually nothing is wrong with the desk — the machine simply has no plugins installed.' },
  { title: 'A session that will not load', blurb: 'Recovering from a saved state that brings the console up wrong.' },
];
const admin = [
  { title: 'Configuration files', blurb: 'Which file owns which setting, and the order the layers override each other in.' },
  { title: 'Environment variables', blurb: 'The full reference, with the layer each one sits in.' },
  { title: 'Ports', blurb: 'What listens where, and what to open on a network you do not control.' },
  { title: 'State and sessions', blurb: 'Where console state is kept and what it contains.' },
  { title: 'Backup', blurb: 'What is worth copying off the machine before a show and what can be rebuilt.' },
  { title: 'Logs', blurb: 'Where to look, and what the console tells you when it refuses.' },
  { title: 'REAC configuration', blurb: 'Segment, interface and stagebox settings on a packaged install.' },
];
</script>

<template>
  <div>
    <PageHero
      eyebrow="Documentation"
      title="The documentation set."
      lede="An operator manual, an installation path, hardware notes, troubleshooting and an administrator reference. It is written as documentation for people using the console, and it ships with the console: a packaged install serves the whole set locally, so a desk with no internet still has its manual."
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="Operator manual" title="Driving the desk." >
          <p class="mt-4 max-w-3xl text-base leading-relaxed text-ink-dim">
            Sixteen chapters. If you are new, the first-session guide takes a fresh
            install from silence to one channel audible in the main mix, and the manual
            covers everything after that.
          </p>
        </SectionHead>
        <DocList title="The desk" :items="manualDesk" />
        <DocList title="The mix" :items="manualMix" />
        <DocList title="The show" :items="manualShow" />
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="Getting it running" title="Installation and hardware." />
        <DocList title="Installing" :items="install" />
        <DocList
          title="Hardware"
          note="What has actually been run, on what, and at which rates."
          :items="hardware"
        />
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="When something is wrong" title="Troubleshooting." >
          <p class="mt-4 max-w-3xl text-base leading-relaxed text-ink-dim">
            Each of these is written from a symptom you can observe, not from a
            subsystem name — because at the point you need one of these pages, you know
            what you can hear and not what is broken.
          </p>
        </SectionHead>
        <DocList title="By symptom" :items="trouble" />
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="Running one" title="Administration." />
        <DocList title="Reference" :items="admin" />
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="Still being written" title="What the documentation set does not cover yet." />
        <div class="grid gap-8 lg:grid-cols-2">
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <p>
              A written manual is a claim like any other, so this page names the gaps
              rather than leaving you to find them.
            </p>
            <ul class="space-y-3">
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">Recording and the virtual soundcard.</span> The
                feature is landing now; its chapter is being authored alongside it.
              </li>
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">Control surfaces.</span> There is no operator
                chapter for the X-Touch yet, because nothing has been driven on real
                hardware to write one from.
              </li>
            </ul>
          </div>
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <ul class="space-y-3">
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">An API guide for integrators.</span> The REST
                surface publishes its own contract through
                <code class="font-mono text-sm text-ink">OPTIONS</code> on every entity,
                which is enough to work from, but the written guide to it is owed.
              </li>
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">A deployment guide beyond a single machine.</span>
                One console on one box is documented. Anything larger is not.
              </li>
            </ul>
            <p class="text-sm text-ink-faint">
              Development notes, design records and working material are not part of the
              published set and are not linked here. What publishes is documentation
              written to be read.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
