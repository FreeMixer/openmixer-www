<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
useSeoMeta({
  title: 'Features — openmixer',
  description:
    'What the console does today, each item labelled by how far it has actually been proven: driven on the rig, measured in audio, or still landing.',
});

/** The smart-alignment rig run of 2026-08-31, as measured. */
const alignRows = [
  { dialled: '0 ms', measured: '0.000 ms', coherence: '1.000' },
  { dialled: '0.5 ms', measured: '0.473 ms', coherence: '1.000' },
  { dialled: '2 ms', measured: '1.903 ms', coherence: '0.998' },
  { dialled: '5 ms', measured: '4.731 ms', coherence: '0.990' },
  { dialled: '10 ms', measured: '9.374 ms', coherence: '0.767' },
];
</script>

<template>
  <div>
    <PageHero
      eyebrow="Features"
      title="What it does, and how far it has been proven."
      lede="Three labels, and they mean different things. Proven on the rig means a person drove it on a real console with real hardware. Built and measured means audio was measured through it. In development means the code is landing and nothing has proved it yet."
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <FeatureRow title="The desk" state="live">
          <div class="space-y-3">
            <p>
              Input channels with head gain, trim, pan, polarity, phantom and pad; a
              full processing rack per strip; buses, aux sends with pre and post tap
              points, DCAs, a matrix, mix-minus, stereo channel linking and output
              inserts.
            </p>
            <p>
              Sessions persist and reload at boot. Scenes recall. Mute groups, solo
              (PFL, AFL, solo-in-place with an arming step), a dim, and two panic
              buttons that separate the mains from the whole console.
            </p>
          </div>
          <div class="space-y-3">
            <p>
              Mix-minus is a first-class kind with its own addresses rather than an
              index-offset hack. Buses and MAIN are strips like any other — there are
              no master-only mechanisms hiding behind a different code path.
            </p>
            <p class="text-ink-faint">
              Two honest exceptions worth knowing before you plan a show around them:
              the matrix has been measured digitally silent with a crosspoint open, and
              a show load is not a clean slate — loading show B over show A leaves A's
              curves, dynamics and tails running on every channel B does not mention.
              Both are open, and both are listed under known limitations below.
            </p>
          </div>
        </FeatureRow>

        <FeatureRow title="Native processing" state="measured">
          <div class="space-y-3">
            <p>
              A parametric EQ bank with a graphical curve, a gate, a compressor, a
              delay line and a reverb — all of them in the console's own C node, all
              of them checked against hand-computed values rather than against a
              recording of themselves.
            </p>
          </div>
          <div class="space-y-3">
            <p>
              Moving a fader, a mute, a pan, an EQ band, a gate, a compressor, a delay
              or a reverb moves audio on the kinds where the console says it does, and
              where it cannot, it refuses by name rather than lying. That is the
              strongest part of the console and it is worth saying plainly.
            </p>
          </div>
        </FeatureRow>

        <FeatureRow title="Real-time analyser" state="live">
          <div class="space-y-3">
            <p>
              A native FFT with a multi-resolution zoom tier — bins of about 0.73 Hz
              below a 300 Hz crossover, where a broad-band analyser tells you nothing
              useful. Peak hold, pre- and post-EQ overlay, and a per-band difference
              trace.
            </p>
          </div>
          <div class="space-y-3">
            <p>
              Nothing computes unwatched. The analyser is demand-gated per channel and
              the arming survives a reload because it rides the session, not the
              browser. Buses got their own analyser on 2026-09-01, proven by feeding a
              tone into one bus and reading the spectrum peak at the fed frequency
              while a bus with no send read a floor with no peak.
            </p>
          </div>
        </FeatureRow>

        <div class="my-10">
          <Shot
            src="/img/console-rta.png"
            alt="The analyser at full height: a live spectrum from 20 Hz to 20 kHz with peak hold and four EQ band handles on the curve."
            caption="The analyser running on a live input, with the channel's EQ band handles on the same curve."
          />
        </div>

        <FeatureRow title="Feedback detection and correction" state="live">
          <div class="space-y-3">
            <p>
              The detector watches for the signature of a ringing room and the
              corrector plants notches into the channel EQ. Two modes with genuinely
              different behaviour: a ring-out pass plants a true full-cut notch at a
              very high Q, while live mode plants a gain-carrying bell whose depth
              comes from the signal's peak-to-average ratio.
            </p>
          </div>
          <div class="space-y-3">
            <p>
              Live-mode notches lift again in staged ramps as the room settles — two
              thirds, one third, gone — and re-clamp with a doubled hold if the
              frequency comes back. It never touches an operator's own bands; only its
              own tagged ones.
            </p>
            <p class="text-ink-faint">
              It is declared input-only by design. Feedback correction on aux, mix and
              matrix strips is not offered yet.
            </p>
          </div>
        </FeatureRow>

        <FeatureRow title="Smart alignment" state="live">
          <div class="space-y-3">
            <p>
              Two microphones on one source arrive at different times. Pick the
              reference, watch coherence rise, apply. The fit reads the phase slope
              across frequency, which is why it needs programme material — a pure tone
              cannot measure delay, because a sine occupies one bin.
            </p>
            <p>
              It corrects with delay and polarity, and <em class="text-ink">reports</em>
              the residual rather than silently correcting it. A control that says
              "137°" without naming the frequency invites the operator to discover that
              changing the analysis band changes the answer.
            </p>
            <p class="text-ink-faint">
              Known limitation: a saved show does not carry the alignment, and loading one
              clears it. Do not rely on a show file to restore it.
            </p>
          </div>
          <div>
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">
              Measured on the rig, 2026-08-31
            </p>
            <div class="mt-3 overflow-x-auto rounded border border-edge">
              <table class="w-full border-collapse font-mono text-sm">
                <thead>
                  <tr class="border-b border-edge bg-surface/60 text-left text-ink-faint">
                    <th class="px-4 py-2 font-normal">Dialled in</th>
                    <th class="px-4 py-2 font-normal">Measured</th>
                    <th class="px-4 py-2 font-normal">Coherence</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in alignRows" :key="r.dialled" class="border-b border-edge/60 last:border-0">
                    <td class="px-4 py-2 text-ink-dim">{{ r.dialled }}</td>
                    <td class="px-4 py-2 text-ink">{{ r.measured }}</td>
                    <td class="px-4 py-2 text-ink-dim">{{ r.coherence }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="mt-3 text-sm leading-relaxed text-ink-faint">
              Repeated apply converges: 4.748 → 0.252 → 0.016 → 0.001 → 0.000 ms, at a
              coherence of 1.000.
            </p>
          </div>
        </FeatureRow>

        <FeatureRow title="LV2 plugin inserts" state="measured">
          <div class="space-y-3">
            <p>
              Per-strip and per-output insert chains hosted by
              <code class="font-mono text-sm text-ink">mod-host</code>, with a plugin
              picker and an editor generated from the plugin's own ports.
            </p>
            <p>
              The catalog tiers a plugin by <em class="text-ink">measured</em>
              round-trip latency — live at 5 ms or under, studio above it, ambiguous
              ones quarantined — and then ranks within a tier by curation and CPU cost,
              so the live-safe choice wins by default.
            </p>
          </div>
          <div class="space-y-3">
            <p>
              Insert audio is verified by measurement rather than by inspection: a tone
              through a real graph, a notch racked as an LV2, and a reading at the other
              end. The reference measurement is a baseline of &minus;12.04 dBFS, the same
              notch through the plugin door at &minus;100.56 dBFS, and bypass returning
              to &minus;12.04 exactly &mdash; 88.52 dB of cut, through the plugin and not
              around it.
            </p>
            <p class="text-ink-faint">
              Known limitations: plugin delay compensation is computed and reported but
              not yet applied, so a chain with differing insert latencies is not
              time-aligned for you; and removing a plugin from a running chain is
              unreliable on some <code class="font-mono text-xs">mod-host</code> builds.
            </p>
          </div>
        </FeatureRow>

        <FeatureRow title="REAC stageboxes" state="live">
          <div class="space-y-3">
            <p>
              Roland S-series stageboxes are discovered, patched and driven — including
              head-amp control, which is what makes them a stagebox rather than a
              stream. Two boxes have been established at once on the rig with all 128
              links intact across a rebind, and a live 48 to 96 kHz re-pace has been
              run with the house up.
            </p>
            <p>
              Phantom power has been confirmed physically at the XLR pins on two inputs
              with the console independently agreeing. Three sources, one answer — which
              is the only kind of confirmation a phantom claim is allowed to have.
            </p>
          </div>
          <div class="space-y-3">
            <p>
              The transport lives in the sibling FreeREAC projects, not in this
              project. openmixer holds the control path: discovery, head-amp, the patch and
              the adapter side.
            </p>
            <p class="text-ink-faint">
              Open and dated: on the S-1608 the audio patch and the head-amp addressing
              use two different offsets in one box; the reported set of known head-amp
              capabilities over-reports, so it is not proof a head-amp landed; the
              upper bank of a 16-input box can stay at the converter floor when it is
              not enrolled; and 44.1 kHz pacing has never been proven, because that
              needs a real desk running at 44.1.
            </p>
          </div>
        </FeatureRow>

        <div class="my-10">
          <Shot
            src="/img/console-patchbay.png"
            alt="The patchbay: a crosspoint grid of sources against channels, with detected stageboxes grouped down the left edge."
            caption="The patchbay. Sources down the side, channels across the top, detected stageboxes grouped and counted."
          />
        </div>

        <FeatureRow title="The web surface" state="live">
          <div class="space-y-3">
            <p>
              A fader wall with banks and user pages, channel strips with a reorderable
              processing rack, bus-send and matrix views, the patchbay, a graph view, a
              telemetry view, and a docked multi-window workspace that can be pulled
              apart and saved as a layout.
            </p>
            <p>
              English, Catalan and Spanish. Dark, light and a high-contrast theme, on
              an axis independent of the console personality.
            </p>
          </div>
          <div class="space-y-3">
            <p>
              Its entire state intake is one <code class="font-mono text-sm text-ink">EventSource</code>
              and nothing else. The surface cannot open a second channel to the console, by
              construction rather than by convention.
            </p>
            <p>
              A change is a PATCH, never a reconnect. There is a deploy gate that drives
              a real browser through real gestures against a real console and measures
              long tasks, request bursts, stream re-dials, framework warnings and
              server-side heals — a green unit suite cannot see a frozen tab.
            </p>
          </div>
        </FeatureRow>

        <FeatureRow title="Control surfaces" state="building">
          <div class="space-y-3">
            <p>
              The Behringer X-Touch and X-Touch Mini are implemented as a bidirectional
              client: surface gestures become canonical operations, and canonical state
              drives the motor faders, the LEDs, the V-Pot rings, the scribble strips
              and the meters. It is wired into the production composition root.
            </p>
          </div>
          <div class="space-y-3">
            <p class="text-ink-faint">
              It is not marked proven because none of it has been driven on a real surface:
              not a replug, not select, not a fader sweep, not the encoders, not the
              meter ladders. The code is built; the hardware verification is owed.
              Adapters for Midas, X32/M32 and Roland stand on the same footing — real
              implementations, no hardware proof.
            </p>
          </div>
        </FeatureRow>

        <FeatureRow title="Recorder and virtual soundcard" state="building">
          <div class="space-y-3">
            <p>
              Multitrack capture to RF64 takes at 48 kHz, a take library, and a virtual
              soundcard so another application on the same machine can be a source or a
              destination on the desk.
            </p>
          </div>
          <div class="space-y-3">
            <p>
              The design was ruled on 2026-09-01 and the code is landing now: the C
              capture and playback paths, the RF64 writer and its oracle tests, and the
              server rows are in. The arm set is derived rather than stored, and
              playback is refused outright when the graph rate does not match the
              take's, because there is no resampler on that path.
            </p>
            <p class="text-ink-faint">There is no rig proof yet. Treat it as unfinished.</p>
          </div>
        </FeatureRow>
      </div>
    </section>

    <section class="bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="Before you plan a show" title="Known limitations." />
        <div class="grid gap-8 lg:grid-cols-2">
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <p>
              A product page that lists only what works is not a description of a
              console. These are the limits worth knowing before openmixer carries
              anything you cannot afford to lose, and they are the same list the
              manual carries.
            </p>
            <ul class="space-y-3">
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">Loading a show is not a reset.</span> Loading a
                second show over a first leaves the first show&rsquo;s curves, dynamics,
                delay tails and feedback notches running on every channel the second
                does not mention.
              </li>
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">Alignment does not survive a show load.</span>
                Delay alignment is not stored in the show file, and loading one clears
                it.
              </li>
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">The matrix does not carry audio yet.</span> The
                addresses, the surface and the crosspoints are there; the audio is not.
                Do not test it by ear and conclude something else is broken.
              </li>
            </ul>
          </div>
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <ul class="space-y-3">
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">Control surfaces are unverified on hardware.</span>
                The X-Touch implementation is complete and wired in, and no part of it
                has been walked on a real surface.
              </li>
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">44.1 kHz is unproven with stageboxes.</span>
                48 and 96 kHz have been run on the rig, including a live change between
                them. 44.1 has not.
              </li>
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">Recording is not finished.</span> The capture
                path, the file writer and the take library are landing now and nothing
                has recorded a show through them.
              </li>
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">There is no packaged download.</span> Building
                from source is the way in today.
              </li>
            </ul>
            <p class="text-sm text-ink-faint">
              This list changes as work lands. The documentation set carries the current
              version of it.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
