<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
useSeoMeta({
  title: 'Plugins and the insert rack — openmixer',
  description:
    'Racking LV2 plugins on a channel or a bus, where they sit in the signal, what mono and stereo mean here, the latency budget by destination, and the two refusals you will meet.',
});

const findings = [
  {
    code: 'within budget',
    text: 'This chain uses 2.1 ms of the 5.0 ms budget at 48000 Hz (2.9 ms left).',
    note: 'Carried so the rack can show headroom, not only trouble.',
  },
  {
    code: 'over budget',
    text: 'ZaMaximX2 puts this chain at 7.4 ms — over the 5.0 ms budget for a monitor destination at 48000 Hz. On a monitor send the performer hears themself that late.',
    note: 'On a monitor destination this refuses the edit; nothing is applied.',
  },
  {
    code: 'may exceed',
    text: 'Calf Limiter has parameter-dependent latency: this chain is now between 3.0 and 12.0 ms against a 5.0 ms budget at 48000 Hz. Check the look-ahead before the show.',
    note: 'A look-ahead you can turn up past the limit later in the day.',
  },
  {
    code: 'unknown at this rate',
    text: 'Dragonfly Hall has no measured latency at 96000 Hz, so this chain’s total is unknown — the 1.8 ms shown counts only what could be resolved.',
    note: 'Never counted as zero, and never quietly a pass.',
  },
];
</script>

<template>
  <div>
    <PageHero
      eyebrow="Manual — plugins &amp; the rack"
      title="Racking a plugin, and what the desk checks before it lets you."
      lede="openmixer hosts LV2 plugins on channels and on bus outputs. Everything the desk itself does — EQ, gate, compressor, delay, reverb, buses, routing — is native and needs nothing installed; plugins are what you add on top. The console decides two things for you before a rack lands: whether the plugin fits the strip’s width, and whether the destination can afford the delay it adds."
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" title="Two places a plugin can sit." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            <span class="text-ink">The rack</span> is the list of plugins on the way out of the
            strip, after the fader and before the bus. It is the ordinary one: open the
            Plugins tab on the processing view, or the plugin rack pane, press add, pick a
            plugin, and it appears as the next slot.
          </p>
          <p>
            <span class="text-ink">The chain</span> is the strip’s own structure — trim, EQ,
            gate, fader — and it offers named points inside that structure where one plugin can
            be placed: Top-Of-Ch, Post-Trim, Pre-EQ, Post-EQ and Pre-Fader. Use it when the
            plugin has to run <em>before</em> something the console does natively rather than
            after everything.
          </p>
          <p>
            On a bus, the rack is the output rack: crossover, limiter, output EQ — the
            loudspeaker management for what leaves the desk on that output.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" title="Slots, order and bypass." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            A slot is a position in the rack, not a fixed bay: there is no such thing as an
            empty slot, only a shorter rack. Drag to reorder, or use the arrows; the × removes
            a plugin; the bypass toggle passes the signal through it untouched. A bypassed
            plugin is still loaded and still owns its delay, which is why the rack shows its
            latency whether it is bypassed or not — and why un-bypassing is judged exactly like
            adding it back.
          </p>
          <p>
            Removing a plugin bypasses it, unlinks it and retires its slot: the strip is fed
            straight through before anything else happens, and the console never hands that
            instance out again. What it does not do is give the instance back to the plugin
            host — the host cannot free one without falling over, so an un-racked plugin sits
            on the graph, silent and unlinked, until the host next starts. The host has 9991
            instance slots and they are never recycled inside one run, so this is an accounting
            fact rather than a daily one; if you ever do reach the end of them, the console says
            exactly that and names how many un-racked plugins are holding the rest:
          </p>
          <blockquote class="border-l-2 border-accent/60 pl-4 text-ink">
            the plugin host has no instance slot left (9991 in all, 9803 of them held by
            un-racked plugins it cannot free) — restart the plugin host to reclaim them
          </blockquote>
          <p>
            The rack itself is one list, and every edit is that list rewritten: adding,
            removing, reordering and swapping a slot for another plugin all go through the same
            door, so there is one place a rack can be judged and one place it can be refused.
          </p>
          <p>
            Each slot shows the plugin’s measured latency in milliseconds, and the rack shows
            the total at the foot, with the console’s own verdict on it underneath. A verdict
            that has not arrived yet shows nothing under the total, never a false <em>fine</em>.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" title="What is in the picker." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            The picker lists LV2 plugins that are both installed on this machine and in the
            console’s curated palette, grouped by the job they do rather than by vendor. The
            palette exists so the list is a short, sensible one instead of six hundred raw
            plugin identifiers; a plugin the machine does not have drops out of it rather than
            sitting there as a dead entry.
          </p>
          <p>
            On a fresh machine the picker is empty. That is expected: nothing about the desk
            depends on a plugin being installed.
          </p>
          <p>
            Each entry carries two chips. One is its latency class — zero or low, high, or not
            measured — and a plugin that is not for live use says so regardless of its figure.
            The other is how its family stands: the plugin sets behave differently enough that
            the family is worth knowing before you commit a channel to one.
          </p>
          <p>
            The list is not the same on every strip. The strip’s own rack door publishes what it
            will accept here, narrowed by the same width test the refusal below uses, and the
            picker greys everything that is not on that list rather than letting you pick it and
            then reading the refusal. The narrowing is worked out each time you ask, from the
            strip’s width as it is at that moment, so making a strip stereo makes the stereo
            plugins pickable with no reload. A plugin whose leg count the catalog does not know
            is offered rather than hidden — the desk does not refuse on a fact it does not have.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" title="Mono and stereo: a plugin wider than the strip is refused." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            The desk already knows the strip’s width — mono or stereo, from what is patched
            into it — and the catalog already knows how many audio legs a plugin puts out. A
            mono plugin on a stereo strip is fine. A stereo plugin on a mono strip is refused:
          </p>
          <blockquote class="border-l-2 border-accent/60 pl-4 text-ink">
            http://lsp-plug.in/plugins/lv2/para_equalizer_x16_stereo has 2 audio legs and this
            strip is mono — rack the plugin’s mono build, or make the strip stereo.
          </blockquote>
          <p>
            It is a refusal rather than a fold because folding it would be silent and wrong.
            Both of the plugin’s output legs land in the strip’s one input port and are summed
            there, which is a measured 6.02 dB lift on the main mix with no control touched —
            a stereo EQ at unity, doing nothing, making the channel twice as loud. The mono
            twin of the same plugin moves the main mix by 0.00 dB.
          </p>
          <p>
            The whole rack is refused, not silently trimmed, and the refusal names the first
            plugin that does not fit. A plugin whose leg count the catalog does not know is not
            a finding and refuses nothing.
          </p>
          <p>
            The other refusal you can meet is about the point rather than the width:
          </p>
          <blockquote class="border-l-2 border-accent/60 pl-4 text-ink">
            a plugin cannot run at Post-Fader yet — rack it at one of Top-Of-Ch, Post-Trim,
            Pre-EQ, Post-EQ, Pre-Fader instead.
          </blockquote>
          <p>
            Post-Fader is a real point on the chain and the slot for it is deliberately still
            there, because a missing mechanism you can see is better than one that has been
            tidied away. Until it carries audio, the console greys the control and says so
            rather than accepting a rack that would never run. Nothing is written when either
            refusal fires.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="05" title="The latency budget, by where the signal is going." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            Delay that is unremarkable on a reverb send is unusable on a wedge, so the budget
            is a property of the destination rather than of the plugin. A monitor destination
            is held to 5 ms and the edit is <span class="text-ink">refused</span> if the chain
            exceeds it; a program destination has 100 ms and an effects destination 60 ms, and
            both of those <span class="text-ink">warn</span> — the edit lands and the finding
            rides along with it. Every figure names the sample rate it was judged at.
          </p>
          <ul class="space-y-4">
            <li v-for="f in findings" :key="f.code" class="border-l-2 border-edge-strong pl-4">
              <p class="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">{{ f.code }}</p>
              <p class="mt-1 text-ink">{{ f.text }}</p>
              <p class="mt-1 text-sm">{{ f.note }}</p>
            </li>
          </ul>
          <p>
            When the budget refuses, the write comes back as
            <span class="text-ink">the destination cannot afford this insert chain</span>,
            carrying the finding above as its reason. Latency adds up across the whole chain, a
            bypassed slot costs nothing, and a plugin whose delay could not be resolved at this
            rate is never counted as zero.
          </p>
          <p>
            The verdict is also a row you can simply read, at any time, without making an edit:
            it answers whether this channel’s destination can afford the rack it is carrying
            right now. Before it existed the only way to learn that a re-clocked graph had
            pushed a chain over its budget was for the next edit to fail.
          </p>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="06" title="The editor, and what a control is showing you." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            Selecting a slot opens a control panel built entirely from what the plugin declares
            about itself — one control per parameter, each choosing its own kind of widget. There
            is no hand-written panel per plugin, which is why an eleven-parameter compressor and a
            hundred-and-eighty-parameter EQ both open. The grid never scrolls; the panel sizes
            itself to the number of parameters. Its header carries the plugin name and a bypass
            toggle, so A/B is one press, and an EQ-role plugin also gets a response curve.
          </p>
          <p>
            The ranges, defaults, units and named steps those controls bind come from the
            console, not from the browser: the desk serves the descriptor it scanned on its own
            machine for the plugin in the open slot, and the panel is drawn from that. It matters
            because the same plugin identifier can be a different build on a different rig, and a
            knob drawn at another machine’s range would send values this one never accepts. The
            copy shipped with the interface is used only where no desk has answered — offline, in
            the mock, in the first moment before the row lands.
          </p>
          <p>
            A plugin the console has not been told to change shows the plugin’s own default,
            which is a fact about the plugin and not a reading from it. The host cannot be asked
            what a control is at this instant, so what the desk shows is what it commanded; a
            value it never commanded is a placeholder.
          </p>
          <p>
            Parameter values, bypass state, the selected preset and the order of the rack are all
            part of the session, so a saved show comes back with its racks as they were.
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
              Post-Fader as a working insert point on the chain. When it carries audio, it joins
              the list the refusal above prints and both stop firing, with no change to anything
              that talks to the console.
            </span>
          </li>
        </ul>
        <p class="mt-8 text-sm leading-relaxed text-ink-faint">
          The rack is <code class="font-mono text-xs text-ink">/channel/{kind}/{index}/inserts</code>,
          a slot’s controls are one row each at
          <code class="font-mono text-xs text-ink">…/inserts/{slot}/params/{symbol}</code>
          and <code class="font-mono text-xs text-ink">…/inserts/{slot}/properties/{property}</code>,
          the verdict is <code class="font-mono text-xs text-ink">…/inserts/suitability</code>,
          and a plugin’s served descriptor is
          <code class="font-mono text-xs text-ink">/plugins/{uri}</code> — all in the
          <NuxtLink to="/docs/rest/channel" class="text-accent hover:underline">REST reference</NuxtLink>,
          with the refusals in the
          <NuxtLink to="/docs/rest/refusal-codes" class="text-accent hover:underline">refusal and undo-label codes</NuxtLink>.
        </p>
      </div>
    </section>
  </div>
</template>
