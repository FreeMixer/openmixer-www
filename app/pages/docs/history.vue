<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
useSeoMeta({
  title: 'Undo and the history — openmixer',
  description:
    'The console’s journal: one list of changes for the whole desk, undo and redo, reverting one change out of the middle, and the offer you get when the field has moved since.',
});

/** What the list reads like. The label comes from the change, the two values from the entry. */
const sentences = [
  { line: 'CH3 fader −6.0 → −12.0', note: 'A fader move. One drag is one entry, not forty.' },
  { line: 'CH1 phantom power off → on', note: 'A discrete change: the two values are the words the control uses.' },
  { line: 'CH3 → Aux1 send −20.0 → −14.0', note: 'A send names both ends, because “send” alone would not say which.' },
  { line: 'Paste onto 8 channels', note: 'One gesture that touched eight strips is one entry, and reverts as one.' },
  { line: 'Strip order', note: 'A reorder has no before-and-after worth printing, so it prints neither.' },
];

const never = [
  'Mute, solo and solo-safe.',
  'Cue, the monitor, talkback and dim.',
  'A spare’s hold.',
  'Recall safe.',
];
</script>

<template>
  <div>
    <PageHero
      eyebrow="Manual — undo &amp; history"
      title="One list of what changed, for the whole desk."
      lede="The console keeps a journal of the changes made to it: one entry per gesture, in plain sentences, with who made it and when. Ctrl+Z walks back through it, and any single entry can be taken back on its own without disturbing the ones after it. What the journal deliberately does not hold is as important as what it does."
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" title="One console, one journal." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            The journal belongs to the desk, not to your screen. Every surface writing to
            the console — the laptop at front of house, the tablet on the wing, a control
            surface, a script — appends to the same list, so your Ctrl+Z can walk back the
            change somebody else just made.
          </p>
          <p>
            That is the point rather than a hazard, and the list is what makes it safe: each
            entry says where it came from before you press anything. An entry made on a
            surface names the surface, one made by a REST client names the client’s address,
            one made by the console itself says so, and an entry that is itself an undo says
            that too.
          </p>
          <p>
            It holds the last 512 changes and the panel says so at the foot of the list. The
            bound is a count and not a span of time, because a quiet passage should not cost
            you the history of the noisy one before it.
          </p>
          <p>
            The journal is not saved. It lives for as long as the console is running, and a
            restart starts a fresh one — an entry remembers what a field read a moment ago,
            which is a claim only the running process can make honestly.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" title="What an entry says." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            An entry is one sentence: what was changed, then what it read before and what it
            reads now. Channels are named the way the rest of the desk names them —
            <span class="text-ink">CH3</span>, <span class="text-ink">Aux2</span>,
            <span class="text-ink">Main</span> — levels carry one decimal, and a switch reads
            <span class="text-ink">on</span> or <span class="text-ink">off</span>.
          </p>
          <ul class="space-y-3">
            <li v-for="s in sentences" :key="s.line" class="border-l-2 border-edge-strong pl-4">
              <p class="font-mono text-sm text-ink">{{ s.line }}</p>
              <p class="mt-1 text-sm">{{ s.note }}</p>
            </li>
          </ul>
          <p>
            A drag is one entry. While you are moving a fader the console keeps folding the
            movement into the entry it already opened, keeping the value you started from and
            the value you are at now, and seals it half a second after you stop. Two separate
            nudges a second apart are two entries, and CH3’s fader never folds into CH4’s.
          </p>
          <p>
            The sentence is built on your screen, in your language, from a change the console
            describes rather than a phrase it writes — so the same entry reads as a sentence
            in Catalan, Spanish or English depending on who is looking at it.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" title="Undo, redo, and where the cursor sits." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            The undo and redo buttons live in the header, and each one names what it would
            hit before you press it — <span class="text-ink">Undo: CH3 fader</span> rather
            than an arrow with no object. The keys are Ctrl+Z, Ctrl+Shift+Z and Ctrl+Y, and
            they do nothing while you are typing in a field.
          </p>
          <p>
            Undo and redo move a cursor through the one list; they do not add to it. Entries
            below the cursor are the ones the desk is currently sounding; entries above it are
            undone and stay in the list, dimmed and struck through, because redo is one press
            away. The foot of the panel counts how many are in that state.
          </p>
          <p>
            Making any new change from an undone position drops the undone entries — the
            ordinary rule, and the reason the panel shows them struck through rather than
            hiding them: you can see what you are about to lose.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" title="Taking back one change out of the middle." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            Every entry in the list carries an <span class="text-ink">Undo this</span> button.
            It writes exactly one field — the one that entry addressed — back to the value the
            entry started from. Nothing else moves. Move a fader, mute another channel, pan a
            third, then take back the fader: the fader returns and the mute and the pan stay
            where they are.
          </p>
          <p>
            A revert is a change like any other, so it appends its own entry, marked as having
            come from the history rather than from a surface. The list grows by one; it never
            rewrites itself.
          </p>
          <p>
            There is no entry in the list you cannot take back. Anything that must never be
            replayed never became an entry in the first place — which is the next section.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="05" title="When the field has moved since." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            An entry can be minutes old, and in that time somebody else — or a later gesture of
            your own — may have moved the same control. Taking the entry back would then jump
            the field from a value nobody expects to another value nobody asked for, so the
            console asks first, in the entry’s own row:
          </p>
          <blockquote class="border-l-2 border-accent/60 pl-4 text-ink">
            CH3 fader is −3.0 dB now, not the −12.0 this step left. X-Touch moved it two
            minutes ago. Go back to −6.0 anyway?
          </blockquote>
          <p>
            <span class="text-ink">Go back anyway</span> makes the write and records in the new
            entry that it went over the later one, so the list says a jump-back happened and
            what it jumped over. <span class="text-ink">Leave it</span> does nothing. The offer
            is drawn in space the row already reserves, so nothing under your finger moves when
            it appears.
          </p>
          <p>
            The console never takes that decision for you and never retries behind your back.
            If the desk moves again while the question is on screen, the offer is dropped
            rather than answered against a value that has gone stale.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="06" title="What the journal never holds." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            The gig-safety controls are not in the list at all. No entry, no address, no
            refusal — the list simply never mentions them:
          </p>
          <ul class="space-y-2">
            <li v-for="n in never" :key="n" class="border-l-2 border-edge-strong pl-4 text-ink">{{ n }}</li>
          </ul>
          <p>
            A list with a per-entry revert is a more dangerous thing than a single Ctrl+Z:
            it can reach back past everything that happened since. Undoing a spare swap puts
            a dead microphone back on a channel; undoing a mute opens one you closed for a
            reason. These controls are one press to set and one press to clear, and that is
            the whole recovery they need.
          </p>
          <p>
            Changes the console makes on its own account are also absent — recalling a scene,
            loading a session, healing a route, a control surface re-driving itself. The list
            is what people did to the desk.
          </p>
          <p>
            Meters, RTA and telemetry never appear: they are measurements, not settings.
          </p>
        </div>
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="07" title="What empties it." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            Loading a show empties the journal, and so does anything else that restates the
            desk wholesale: recalling a scene, loading a session or a patch, applying a channel
            config, saving or deleting one, and resizing the console. After one of those the
            list starts again from empty.
          </p>
          <p>
            That is deliberate. Those actions rewrite hundreds of facts at once, and a list
            that offered to take one of them back out of the middle would be offering something
            it cannot honestly do. The way back from a load is the autosave the console takes
            before it, which is its own mechanism.
          </p>
        </div>
        <p class="mt-8 text-sm leading-relaxed text-ink-faint">
          The list itself is
          <code class="font-mono text-xs text-ink">/history</code>, the cursor is
          <code class="font-mono text-xs text-ink">/history/cursor</code>, and a single entry is
          taken back at <code class="font-mono text-xs text-ink">/history/entries/{id}/revert</code> —
          fields, ranges and the refusals each can send back are in the
          <NuxtLink to="/docs/rest/history" class="text-accent hover:underline">REST reference</NuxtLink>
          and the
          <NuxtLink to="/docs/rest/refusal-codes" class="text-accent hover:underline">refusal and undo-label codes</NuxtLink>.
        </p>
      </div>
    </section>
  </div>
</template>
