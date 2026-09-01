<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
useSeoMeta({
  title: 'FAQ — openmixer',
  description:
    'Straight answers about what openmixer is, what it needs, what it can carry today, and what it cannot.',
});

interface Qa { readonly q: string; readonly a: readonly string[] }
interface Group { readonly heading: string; readonly items: readonly Qa[] }

const groups: readonly Group[] = [
  {
    heading: 'What it is',
    items: [
      {
        q: 'Is this a remote control for a mixing desk?',
        a: [
          'No. Most software that looks like a mixer is a surface for a hardware console somewhere else. openmixer is the console: the audio runs through it. Inputs arrive from a stagebox or any PipeWire source, each channel has a fader and a processing chain, the buses are summed in the console’s own signal processing, and the mix goes back out to the PA.',
          'There is no hardware desk in the signal path. Real consoles can be attached as controllers, but that is an optional side path.',
        ],
      },
      {
        q: 'Can several people mix at the same time?',
        a: [
          'Yes, and that is the design rather than a feature bolted on. One server holds the whole mix and every screen is a view of it, so a fader moved on the laptop at front of house moves on the tablet on the wing at the same time.',
          'Every client is a remote client, including the one running on the same machine. There is no privileged surface.',
        ],
      },
      {
        q: 'Does it need an internet connection?',
        a: [
          'No, and it is built on the assumption that it will not have one. The surface, the plugin catalog and the entire documentation set are served from the machine itself. Nothing is fetched from the network to draw a page.',
        ],
      },
      {
        q: 'What licence is it under?',
        a: [
          'GPL-3.0-or-later, and every package in the workspace carries the same licence.',
        ],
      },
    ],
  },
  {
    heading: 'Running it',
    items: [
      {
        q: 'Is there a package I can install?',
        a: [
          'Not from a published repository yet. There is a complete RPM specification and a one-command build that produces the packages locally, and that is the honest state of it: you can build packages, and there is nothing to point a package manager at.',
          'Today the way in is to clone the repository and build from source.',
        ],
      },
      {
        q: 'What does it need to run?',
        a: [
          'Linux with PipeWire, Node 22 or newer, and pnpm to build. Audio comes from anything PipeWire can see, which includes a plain USB interface, so a stagebox is not required to try it.',
          'The reference rig is a Roland REAC stagebox with an RME Babyface Pro as the clock master, on Fedora.',
        ],
      },
      {
        q: 'Which sample rates work?',
        a: [
          '48 kHz and 96 kHz have both been run on the rig, including a change between them with the console live.',
          '44.1 kHz has not been proven with a stagebox, and is not claimed. Proving it needs a real desk running at 44.1 to pace against.',
        ],
      },
      {
        q: 'Do I need LV2 plugins to use it?',
        a: [
          'No. The faders, EQ, gate, compressor, delay, reverb, buses and routing are all native to the console and need nothing installed.',
          'A fresh machine has no LV2 plugins, so the plugin picker starts empty. That is expected, not a fault. Curated sets can be installed separately, tiered by measured round-trip latency so the live-safe choice is the default.',
        ],
      },
      {
        q: 'The surface shows a whole console but nothing happens when I move a fader.',
        a: [
          'That is the offline mode, and the connection indicator in the header says so. With no server reachable, the surface falls back to a simulated board so the controls can be learned without a console behind them.',
          'It is easy to miss precisely because it is not an error message. If you expected a live desk, the server is not reachable — check that it is running and that the surface is being served the endpoint you think it is.',
        ],
      },
    ],
  },
  {
    heading: 'Building on it',
    items: [
      {
        q: 'Can I drive it from a script?',
        a: [
          'Yes. The whole console is a REST surface: every entity answers GET, PATCH and OPTIONS at a plain, typeable address, and curl is a first-class client rather than a debugging trick.',
          'OPTIONS on any entity publishes its contract — the writable fields, the ranges, the units and the enumerated options — so a client can be written against what the server says rather than against a copy of the rules.',
        ],
      },
      {
        q: 'How do I follow state without polling?',
        a: [
          'Add ?watch=1 to any GET and it becomes a server-sent event stream that emits exactly what that GET returns, starting with a full snapshot.',
          'For a whole surface, watch the root: one stream carries every committed change on the console. Prefer that to opening a stream per panel — browsers allow only six connections to an origin, and spending them all makes every later request queue.',
        ],
      },
      {
        q: 'Is there a WebSocket API?',
        a: [
          'No, and there will not be one. There is one door and one wire.',
        ],
      },
    ],
  },
  {
    heading: 'Whether to trust it',
    items: [
      {
        q: 'Can I mix a real show on this?',
        a: [
          'It has been mixing real shows on one rig since 2026-07-06, so the honest answer is that it depends on what your show needs.',
          'Channels, buses, sends, DCAs, mute groups, EQ, dynamics, the analyser, feedback correction, delay alignment, plugin inserts and REAC stageboxes have all been driven and measured. The matrix does not carry audio yet, recording is unfinished, and no control surface has been verified on hardware. Read the known limitations before you commit to it, not afterwards.',
        ],
      },
      {
        q: 'How do you know a control actually reaches the audio?',
        a: [
          'By measuring audio. A control can read back perfectly and reach nothing at all, and a test that only asks the model whether it changed will agree with that forever.',
          'So the signal processing is checked against values worked out on paper rather than captured from a run, graph changes are verified against the live graph rather than a model of it, and a phantom power claim needs a person at the connector rather than an indicator on a screen.',
        ],
      },
      {
        q: 'Which Roland stageboxes are supported?',
        a: [
          'S-series boxes over REAC, including head-amp control — phantom, pad and sensitivity — which is what makes a box a stagebox rather than a stream. Two boxes have been established at once on the rig.',
          'The REAC transport itself is a separate project, FreeREAC, and its own site covers what is known about the protocol and which boxes have been worked with.',
        ],
      },
    ],
  },
];
</script>

<template>
  <div>
    <PageHero
      eyebrow="FAQ"
      title="Questions with straight answers."
      lede="Including the ones where the answer is no."
    />

    <section>
      <div class="mx-auto max-w-4xl px-6 py-16">
        <div v-for="g in groups" :key="g.heading" class="mb-14 last:mb-0">
          <h2 class="font-mono text-xs uppercase tracking-[0.2em] text-accent">{{ g.heading }}</h2>
          <dl class="mt-6">
            <div v-for="qa in g.items" :key="qa.q" class="border-t border-edge py-7 first:border-t-0 first:pt-0">
              <dt class="font-display text-lg font-semibold tracking-tight text-ink">{{ qa.q }}</dt>
              <dd class="mt-3 space-y-3 text-base leading-relaxed text-ink-dim">
                <p v-for="(para, i) in qa.a" :key="i">{{ para }}</p>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  </div>
</template>
