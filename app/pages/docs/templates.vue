<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
useSeoMeta({
  title: 'Channel templates — openmixer',
  description:
    'Saving a channel’s processing for reuse, the factory instrument templates that state only the chain, and the preview that names every field an apply would move before it moves it.',
});

const carried = [
  'The EQ, the gate and the compressor.',
  'The insert rack and the order the processing runs in.',
  'Digital gain, trim and pan.',
  'Phantom, pad and head-amp gain.',
  'Polarity, and the alignment delay with what it is aligned against.',
];

const notCarried = [
  'The fader, the mute, the solo and solo-safe.',
  'The channel’s name, its colour and its instrument.',
  'Recall safe, and whether the channel is armed to record.',
  'Every send to every bus.',
  'What is patched into the channel, and what the channel is linked to.',
];
</script>

<template>
  <div>
    <PageHero
      eyebrow="Manual — channel templates"
      title="A known-good channel, carried from one gig to the next."
      lede="A channel config is one channel’s processing, saved under a name and applied to any other channel. The console ships a set of factory instrument templates alongside the ones you save, and both go on through the same door — but they say different things, and the difference is the whole chapter. Before any apply lands, the desk shows you exactly which fields it would move."
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" title="Saving one." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            In the library, pick the channel to capture, give it a name, and save. You can
            file it under a family — Vocals, Drums, Guitars — which groups it beside the
            factory templates for the same family in the picker. Naming no family is a
            choice rather than a missing field: it lands as an ungrouped entry.
          </p>
          <p>
            The library is sorted by name, never by date. A config library is something you
            browse for the chain you want, not something you replay in the order you made it.
          </p>
          <p>What a save captures:</p>
          <ul class="space-y-2">
            <li v-for="c in carried" :key="c" class="border-l-2 border-accent/50 pl-4 text-ink">{{ c }}</li>
          </ul>
          <p>And what it deliberately does not:</p>
          <ul class="space-y-2">
            <li v-for="c in notCarried" :key="c" class="border-l-2 border-edge pl-4">{{ c }}</li>
          </ul>
          <p>
            A config says what this channel’s processing <span class="text-ink">is</span>. It
            says nothing about where the channel is patched, how loud it sits in the mix, or
            what it is called — those belong to the show, and they are what a session saves.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" title="A factory template states the chain, and only the chain." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            The instrument templates that come with the console — Kick In, Lead Vocal, and
            the rest — are a statement about the <span class="text-ink">instrument</span>: the
            EQ, the gate, the compressor, the insert rack and the order they run in. Applying
            one leaves the strip’s own facts exactly where you put them. Your gain, trim, pan,
            polarity and alignment do not move.
          </p>
          <p>
            A kick drum’s compressor is much the same in every room. Its trim never is. Those
            two sentences are why the split exists: a template describes an instrument, and
            the head stage describes this strip and the source plugged into it.
          </p>
          <p>
            A config you saved yourself is the other kind of statement — a whole one. It was
            captured from a real channel with a real head stage, so applying it moves the head
            stage too, including back to fresh if that is where you captured it. That is not
            an inconsistency between the two: a factory template never mentions the head stage,
            and something that is not mentioned is not changed.
          </p>
          <p>
            Factory templates are read-only. They cannot be deleted, and a save cannot take
            one of their names out from under them.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" title="The preview of moves." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            Applying a config is not additive, so before it lands the console asks the desk
            what would actually change and shows you the answer:
          </p>
          <blockquote class="space-y-2 border-l-2 border-accent/60 pl-4">
            <p class="text-ink">Apply “Lead Vocal”?</p>
            <p class="text-sm">
              A config is a whole statement about a channel, so applying it will move what CH3
              holds now:
            </p>
            <ul class="font-mono text-sm text-ink">
              <li>Gain −6.0 dB → 0.0 dB</li>
              <li>Trim −8.0 dB → 0.0 dB</li>
              <li>Pan 0.60 → 0.00</li>
              <li>EQ replaced</li>
              <li>Insert chain replaced</li>
            </ul>
          </blockquote>
          <p>
            The list is one line per field that would move, computed by the console against
            what the channel holds at that moment — never by the surface, so what you are shown
            and what the door will do cannot disagree. A fact that rides several fields is
            listed field by field: you are warned about the 48 V, not about “the head amp”.
          </p>
          <p>
            Three things read differently on purpose. A structured fact — an EQ curve, a gate,
            an insert rack — says <span class="text-ink">replaced</span> rather than printing a
            before and an after, because “from 8 bands to 8 bands” is not a readable sentence.
            A dash means the desk does not know what is there now, which happens on a head-amp
            fact from a preamp that has never reported; unknown is not zero. And a config
            applied to a channel that already matches it moves nothing, so it applies on one
            tap with no dialog at all — applying the same config twice must not ask twice.
          </p>
          <p>
            The warning can be turned off with <span class="text-ink">Don’t warn me again</span>,
            which is a console-wide setting of its own. It is deliberately not the same switch
            as the one that arms destructive actions: an apply removes nothing, and an operator
            who turned off delete-arming did not ask to lose this.
          </p>
          <p>
            Every way into an apply obeys it — the instrument picker on the processing view and
            the Apply button in the library both ask the same question. Cancelling leaves both
            doors shut, so a channel is never labelled with a template it did not get.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" title="An apply clears the history." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            Applying a config restates a whole channel in one action, so it empties the
            journal rather than appearing in it — the same rule that covers loading a session
            or recalling a scene. Saving or deleting a config empties it too. See
            <NuxtLink to="/docs/history" class="text-accent hover:underline">undo and the history</NuxtLink>
            for what that means and what the way back is.
          </p>
        </div>
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="Arriving" title="What this chapter does not describe yet." />
        <ul class="space-y-4 text-base leading-relaxed text-ink-dim">
          <li class="flex gap-3 border-l-2 border-edge-strong pl-4">
            <StatusTag state="building" />
            <span>
              The preview on surfaces that have no dialog. The console publishes the warning as
              protocol — which row to read and which setting governs it — so an OSC surface or a
              control surface can ask the same question. None of them reads it before its write
              today, so an apply from one of those lands without a preview.
            </span>
          </li>
        </ul>
        <p class="mt-8 text-sm leading-relaxed text-ink-faint">
          The library is <code class="font-mono text-xs text-ink">/channelConfigs</code>, the apply is
          <code class="font-mono text-xs text-ink">/channelConfigs/{id}/apply/{kind}/{index}</code>
          and the preview is the read-only sibling at
          <code class="font-mono text-xs text-ink">…/applyMoves/{kind}/{index}</code> — both in the
          <NuxtLink to="/docs/rest/channelConfigs" class="text-accent hover:underline">REST reference</NuxtLink>.
        </p>
      </div>
    </section>
  </div>
</template>
