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
    heading: 'Recording and the virtual soundcheck',
    items: [
      {
        q: 'Where are recordings stored, and in what format?',
        a: [
          'Under the console’s state directory — $XDG_STATE_HOME/openmixer/takes/<id>/, or ~/.local/state/openmixer/takes/<id>/ if that variable is not set, or wherever --state-dir points. Each track is its own file: one mono 32-bit float channel, WAV while it stays under 4 GB and RF64 once it does not, at the sample rate the graph was running when the take was recorded.',
          'RF64 only changes the header once a file needs 64-bit sizes; any DAW that opens a WAV opens either form the same way.',
        ],
      },
      {
        q: 'What gets recorded when I press record?',
        a: [
          'Every patched input and MAIN, by default, with a per-channel opt-out — there is no channel list to fill in first. Aux and matrix channels are not armed unless you ask for them.',
          'Each armed channel is captured at two points, simultaneously: its raw input and its post-fader signal. A pre-fader tap is offered too, off until you turn it on.',
        ],
      },
      {
        q: 'Can I arm or unarm a channel while a take is running?',
        a: [
          'No. A take’s channel set is fixed the moment it starts. Changing an arm setting mid-take affects the next take, not the one in progress — otherwise nobody could say afterwards what the first ten minutes of a show actually held.',
        ],
      },
      {
        q: 'Is there a quick way to arm a lot of channels at once?',
        a: [
          'Not yet. Arming is one channel at a time today. A wall-mode — tap tiles across the whole fader wall to arm or disarm them, with select-all and select-none — is designed, using the same mechanism sends-on-fader already has, but it is not built.',
        ],
      },
      {
        q: 'Can I export a take as something smaller than the raw stems?',
        a: [
          'Not today. The stems stay untouched RF64 float — there is no lossy export, because a mixer that recorded a show in a lesser format than it captured it would be throwing away the reason to have recorded at all. A FLAC print of the take’s main mix, as a show deliverable rather than a stem export, is planned and not built yet.',
        ],
      },
      {
        q: 'What is a virtual soundcheck?',
        a: [
          'Loading a recorded take back into the live desk so it plays as if the band were on stage again. Load a take, engage it, and every channel with a matching track switches from its live input to that track — so you can set monitors, try a plugin chain or train an operator without anyone in the room performing.',
          'A channel the take has nothing for stays on its live input; a soundcheck never replaces a working microphone with silence.',
        ],
      },
      {
        q: 'I pressed play and nothing happened — why?',
        a: [
          'Play moves the take’s transport position; it does not by itself connect a channel to the take. Engage first — that is the step that switches the channels over. Playing before engaging just advances a position number nothing is listening to yet.',
        ],
      },
      {
        q: 'Can I run a virtual soundcheck at a different sample rate than the take was recorded at?',
        a: [
          'No, and this is deliberate. There is no resampler on the playback path, so a take recorded at one rate refuses to play back at another rather than running at the wrong pitch and the wrong length. Match the graph’s rate to the take’s, or re-record.',
        ],
      },
      {
        q: 'Can I record and run a virtual soundcheck at the same time?',
        a: [
          'No. Recording and playback both use the one audio graph, and starting either while the other holds it refuses outright rather than queueing silently behind it.',
        ],
      },
      {
        q: 'Can I trust recording and the virtual soundcheck on a real show?',
        a: [
          'Not yet. The capture path, the file writer and the take library are landing now and nothing has recorded a real show through them — treat the feature as unfinished until that changes, the same way the features page already labels it.',
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
