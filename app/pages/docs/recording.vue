<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
useSeoMeta({
  title: 'Recording and the virtual soundcheck — openmixer',
  description:
    'Arming channels, which taps a channel records, the take library, exporting the print of the main mix, and running a virtual soundcheck: load, engage, play, eject.',
});

const arriving = [
  'A wall-mode for arming — tap every channel tile to arm or disarm it, with select-all/none, the same gesture sends-on-fader already uses. Today, arming is one channel at a time.',
  'A play/pause toggle and a ±1 second nudge on the virtual-soundcheck transport, next to the scrub. Today, play is on or off and the position is set directly.',
  'A top-bar record button and a recording LED visible from any page. Today, the record control lives on the channel strip.',
  'The take’s files carrying BWF and iXML metadata (channel name, patch source, tap) so a DAW shows names without anyone retyping them. Today, that information lives only in the take’s own sidecar.',
  'A FLAC print. The export writes 24-bit WAV, which is the right depth and the wrong container for a deliverable that has to travel.',
  'A button that fires the print. The export is served and it works; no surface offers it yet, so today it is fired over the API.',
  'A tap picker on the channel. Which taps a channel records is a field the console serves and answers on, but no control writes it, so today a channel records its default set unless something drives it over the API.',
  'A take library that prints the empty and unmeasured counts it already carries. The facts are on the take; the picker does not show them yet.',
];
</script>

<template>
  <div>
    <PageHero
      eyebrow="Manual — Recording &amp; virtual soundcheck"
      title="Capture a show, then mix it again without the band."
      lede="Multitrack recording and virtual soundcheck have taken their first real take on the rig — eighty-four tracks of it — and have not yet carried a show. See the known limitations before you rely on this for anything you cannot afford to lose. What is described below is what the console does today; anything still being built is marked as such at the end of the chapter."
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
            raw input, taken straight after the trim, and its post-fader
            signal — so a re-mix afterwards has both the untouched source
            and what you actually pushed to the house that night. An input
            channel is offered a third point, pre-fader, and the three are a
            set rather than a choice: a channel can record pre and post
            fader at the same time. A bus master is offered one point,
            post-fader, and that is a stated fact about a bus rather than
            an oversight.
          </p>
          <p>
            Which taps a channel records is decided when the take starts.
            Changing the set while a take is running moves nothing and
            costs nothing — it is a decision about the files the next take
            will open.
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
          <p>
            One file per track means one file per leg, so a stereo channel
            contributes two, sharing a channel and a tap between them. Each
            one names its side in the take's own record, left or right, so
            nothing downstream has to infer a stereo pair from the order the
            files happen to be listed in. The file names stay the track
            number and the tap — <code class="font-mono text-sm text-ink">ch09.post-fader.wav</code> —
            because that is what stops a DAW laying the wrong tap under the
            vocal; the side is in the record beside them. Takes recorded
            before the side was written down do not carry it.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" title="The print of the main mix." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            MAIN is armed like any other strip, so the take already holds
            the mix you made on the night — the print. Exporting it writes
            that one capture out as a 24-bit WAV, beside the stems and never
            over them; the stems stay as they are.
          </p>
          <p>
            Nothing is summed to produce it. An offline sum of the stems
            would answer a different question: the stems are captured before
            the processing, so their sum is the console's inputs rather than
            the show. The print is the show.
          </p>
          <p>
            Clipping is reported rather than hidden. A sample past the rail
            is held at it and counted, and the count and the true peak —
            measured before the rail — go on the take, so you learn the show
            clipped from the export rather than from someone listening to it
            later.
          </p>
          <p>
            This is not the same action as a render. A render is the offline
            improvement pass over the tracks you select and writes a better
            copy of each of them; the export reads one file and writes one.
            That is also why a soundcheck playing does not block an export
            while it does block a render — refusing you your print because
            something is playing would be a rule with no cost behind it.
          </p>
          <p>
            An export refuses rather than producing a file that is not the
            print: when the take carries no MAIN capture, when that capture
            holds no frames, when it cannot be read as an audio file, when
            there is not enough disk for it, and when one is already running.
            Each refusal says which of those it is.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="05" title="Tracks the take could not fill." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            A channel that was armed but never carried a buffer records a
            file with a header and nothing in it. The take is not refused
            for it and the track is not quietly dropped: the take counts how
            many of its tracks are known empty, and separately how many it
            cannot speak for at all, because a take made before the console
            measured this carries no answer rather than a zero.
          </p>
          <p>
            An empty track is not the same thing as a take that lost frames.
            A channel with no signal path attached is skipped by the audio
            thread entirely, so nothing was dropped and the take honestly
            reports no drops. Two facts, and neither implies the other.
          </p>
          <p>
            The consequence you will meet is at soundcheck: a channel whose
            track in the take is empty is left on its live input rather than
            switched to silence, and the console names which channels those
            were. If that leaves nothing at all engaged, play refuses rather
            than running a transport no channel is listening to.
          </p>
          <p>
            Hiding an empty track would be worse than carrying an honest
            one. It is how you find out about a channel that recorded
            nothing from the library, rather than from a silent strip at the
            next soundcheck.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="06" title="Running a virtual soundcheck." />
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
              transport. Play means hear it, so pressing it with nothing
              engaged is refused rather than obeyed — <span class="text-ink">nothing
              is listening to the take, so it would play unheard — engage a
              channel first, or check the take can serve these
              channels</span>. A transport that ran to an empty room while
              the position number climbed is the kind of working control
              that wastes a soundcheck.
            </li>
            <li>
              <span class="text-ink">Eject.</span> One action: stops
              playback, hands every engaged channel back to its live input,
              and clears the loaded take. There is no partial eject.
            </li>
          </ol>
          <p>
            The live playback path still has no resampler and never will — a
            track handed to the graph has to already be at the graph's rate.
            But a take recorded at another rate is not refused for it: loading
            the take converts the tracks it will replay, offline, on disk,
            before a transport exists, and the node then opens ordinary files
            at its own rate. The conversion is cached in the take's own
            folder, so a second load costs one file check. Only what
            conversion cannot fix still refuses — no converter built in, or a
            conversion that could not finish — and that refusal names both
            rates.
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
          <code class="font-mono text-xs text-ink">/takes</code>,
          <code class="font-mono text-xs text-ink">/takes/{id}/export</code>,
          <code class="font-mono text-xs text-ink">/channel/{kind}/{index}/record</code> — are in the
          <NuxtLink to="/docs/rest/record" class="text-accent hover:underline">REST reference</NuxtLink>,
          including the refusal a given field can send back and what it means, in the
          <NuxtLink to="/docs/rest/refusal-codes" class="text-accent hover:underline">refusal and undo-label codes</NuxtLink>.
        </p>
      </div>
    </section>
  </div>
</template>
