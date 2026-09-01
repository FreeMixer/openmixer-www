<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
useSeoMeta({
  title: 'Recording and the virtual soundcheck — openmixer',
  description:
    'Arming channels, what a take captures, the take library, and running a virtual soundcheck: load, engage, play, eject.',
});

const arriving = [
  'A wall-mode for arming — tap every channel tile to arm or disarm it, with select-all/none, the same gesture sends-on-fader already uses. Today, arming is one channel at a time.',
  'A play/pause toggle and a ±1 second nudge on the virtual-soundcheck transport, next to the scrub. Today, play is on or off and the position is set directly.',
  'A top-bar record button and a recording LED visible from any page. Today, the record control lives on the channel strip.',
  'The take’s files carrying BWF and iXML metadata (channel name, patch source, tap) so a DAW shows names without anyone retyping them. Today, that information lives only in the take’s own sidecar.',
  'A FLAC export of the take’s main mix as a show deliverable. Today, nothing exports a mixdown — the stems are the only output.',
];
</script>

<template>
  <div>
    <PageHero
      eyebrow="Manual — Recording &amp; virtual soundcheck"
      title="Capture a show, then mix it again without the band."
      lede="Multitrack recording and virtual soundcheck are landing now and have not recorded a real show yet — see the known limitations before you rely on this for anything you cannot afford to lose. What is described below is what the console does today; anything still being built is marked as such at the end of the chapter."
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" title="What a take captures." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            There is no channel picker to fill in before you record. Every
            patched input and MAIN are armed by default, and you opt a
            channel <span class="text-ink">out</span> rather than opting
            channels in — a channel with nothing patched to it records
            nothing worth keeping, so the console leaves it out of the
            derivation without changing what you asked for: patch something
            into it later and it arms again, with no extra step. Aux and
            matrix channels are not armed unless you ask for them.
          </p>
          <p>
            Each armed channel is captured at two points by default — its
            raw input and its post-fader signal — so a re-mix afterwards has
            both the untouched source and what you actually pushed to the
            house that night. A pre-fader tap is offered too, off until you
            turn it on.
          </p>
          <p>
            The channel set is fixed for the whole take. Arming or unarming
            a channel while a take is running does nothing to that take —
            the set was decided the moment it started, on purpose: a
            capture that could gain a track mid-show is one where nobody can
            say afterwards what the first ten minutes actually held.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" title="Recording a take." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            Each channel strip carries a record control showing whether that
            channel is armed. Recording itself is a console-wide transport,
            not a per-channel one: start it and every currently-armed
            channel begins together; stop it and the take becomes part of
            the library.
          </p>
          <p>
            Starting refuses rather than half-starting: with nothing armed,
            with a take already running, or with less disk space than the
            take needs to open safely, the console says so before the first
            sample rather than leaving you with a folder to clean up. The
            refusal names the numbers — how much space it wanted and how
            much there was — because "not enough space" is not something
            you can act on and "it needs 14 GB and there is 3" is.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" title="The take library." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            Every take that finished recording is listed, newest first, by
            when it started and how long it ran. There is no upload and no
            import — the only way a take enters the library is by being
            recorded — and there is deliberately no delete yet: erasing a
            multitrack take safely, while a render or a soundcheck might
            hold it open, is real work the console has not done, and a
            delete button that is not safe is worse than no delete button.
          </p>
          <p>
            The files themselves are plain WAV — RF64 once a track passes
            4 GB, ordinary RIFF WAV below it, and every reader treats the
            two the same — one mono 32-bit float file per track, at the
            rate the graph was running when the take was recorded.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" title="Running a virtual soundcheck." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            A virtual soundcheck plays a take back through the live desk as
            if the band were on stage again, so you can set up monitors,
            check a new plugin chain or train an operator without anyone
            playing a note. It is four steps, in order.
          </p>
          <ol class="list-decimal space-y-3 pl-6">
            <li>
              <span class="text-ink">Load.</span> Pick a take from the
              library. Nothing changes on the desk yet.
            </li>
            <li>
              <span class="text-ink">Engage.</span> This is the step that
              actually reaches the channels: every channel with a matching
              track in the take switches from listening to its live input to
              listening to that track instead. A channel the take has
              nothing for is left alone, still on its live input — a
              soundcheck never replaces a working microphone with silence.
            </li>
            <li>
              <span class="text-ink">Play.</span> Moves the take's
              transport. Playing before engaging moves the position number
              without anything audible changing, because nothing is
              listening to the take yet — engage first.
            </li>
            <li>
              <span class="text-ink">Eject.</span> One action: stops
              playback, hands every engaged channel back to its live input,
              and clears the loaded take. There is no partial eject.
            </li>
          </ol>
          <p>
            One rule has no exception: a take recorded at one sample rate
            will not play back at another. There is deliberately no
            resampler on this path, so a mismatch refuses outright, naming
            both rates, rather than playing at the wrong pitch and the wrong
            length. Match the graph's rate to the take's, or re-record.
          </p>
          <p>
            Recording and virtual soundcheck cannot run at the same time —
            both use the one audio graph, and starting one while the other
            holds it refuses rather than queueing silently behind it.
          </p>
        </div>
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="Arriving" title="What this chapter does not describe yet, because it is not built." />
        <ul class="space-y-4 text-base leading-relaxed text-ink-dim">
          <li v-for="item in arriving" :key="item" class="flex gap-3 border-l-2 border-edge-strong pl-4">
            <StatusTag state="building" />
            <span>{{ item }}</span>
          </li>
        </ul>
        <p class="mt-8 text-sm leading-relaxed text-ink-faint">
          The exact fields behind every step above — <code class="font-mono text-xs text-ink">/record</code>,
          <code class="font-mono text-xs text-ink">/vsc</code>,
          <code class="font-mono text-xs text-ink">/takes</code> — are in the
          <NuxtLink to="/docs/rest/record" class="text-accent hover:underline">REST reference</NuxtLink>,
          including the refusal a given field can send back and what it means, in the
          <NuxtLink to="/docs/rest/refusal-codes" class="text-accent hover:underline">refusal and undo-label codes</NuxtLink>.
        </p>
      </div>
    </section>
  </div>
</template>
