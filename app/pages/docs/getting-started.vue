<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
useSeoMeta({
  title: 'Getting started — openmixer',
  description:
    'From a built checkout to one channel audible in the main mix: start the server and the surface, patch an input, and hear it.',
});

const run = [
  '# From the top of a built checkout — see Get it if you have not built one yet.',
  'pnpm --filter @openmixer/server exec openmixer-server',
  '',
  '# In a second terminal, the surface:',
  'pnpm --filter @openmixer/web-ui dev',
];
const check = [
  '# From a third terminal, at any point — this is what "in the mix" means on the wire.',
  'curl -s http://127.0.0.1:8080/api/channel/input/1/fader',
];

const next = [
  { title: 'The surface', blurb: 'The header, the layout chips, the fader bay, and where to find things that are not where you would first look.' },
  { title: 'The channel strip', blurb: 'Signal order, trim, the tile controls, selecting and naming — everything you just did on channel 1, in full.' },
  { title: 'The patchbay and the graph', blurb: 'Crosspoint patching and multi-source channels, beyond the one input you just wired.' },
  { title: 'Sends, buses, groups and DCAs', blurb: 'Once one channel is in the mix, this is how a second one joins it without fighting the first for headroom.' },
];
</script>

<template>
  <div>
    <PageHero
      eyebrow="User docs — Getting started"
      title="From nothing to one channel in the mix."
      lede="Everything below assumes a built checkout — see Get it if you have not built one yet. This chapter does one job: start the console, patch one real input, and hear it at MAIN. Once that works, the rest of the manual is about everything openmixer can do beyond it."
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" title="Start the console and the surface." />
        <p class="mb-6 text-base leading-relaxed text-ink-dim">
          Two processes, two terminals. The server is the console — it owns the mix
          and needs no configuration file to come up. The surface is a plain web
          page; nothing about it is privileged over any other client that will
          later connect to the same server.
        </p>
        <CodeBlock :lines="run" />
        <p class="mt-4 text-sm leading-relaxed text-ink-faint">
          The dev server prints the address to open — typically
          <code class="font-mono text-ink-dim">http://localhost:3000</code>. The
          surface does not hardcode the console's address: it discovers the
          endpoint from the origin that served it, so the same build works from a
          phone on the same network without being rebuilt for it.
        </p>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="02" title="Check the header before you touch a fader." />
        <p class="text-base leading-relaxed text-ink-dim">
          Open the page. The connection indicator in the header says whether you
          are looking at the live console or the offline fallback — a simulated
          board the surface shows itself when no server answers, precisely so the
          controls can be learned with nothing behind them. If you expected a live
          desk and moving a fader does nothing, this is almost always the reason:
          check the indicator before assuming anything else is broken.
        </p>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" title="Patch a real input onto channel 1." />
        <p class="text-base leading-relaxed text-ink-dim">
          The channel roster already exists — a console's strip count is fixed at
          boot, and channel 1 is there whether or not anything feeds it. What it
          hears is a separate fact: open the patchbay and connect a real source —
          the first input of a plain USB interface is enough, a stagebox is not
          required — to channel 1's input. Nothing else needs creating first.
        </p>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" title="Bring the channel up and send it to MAIN." />
        <p class="text-base leading-relaxed text-ink-dim">
          On channel 1: make sure it is not muted, and bring the fader up towards
          unity. Every channel sums into MAIN by default, so there is no separate
          routing step for this — the meter on channel 1 and the meter on MAIN
          should move together as soon as there is signal on the patched input.
          If MAIN moves but you hear nothing, the fault is downstream of the
          console — MAIN's own output patch, or whatever MAIN is patched to.
        </p>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="05" title="Verify it without your ears, if you want to be sure." />
        <p class="mb-6 text-base leading-relaxed text-ink-dim">
          The console is addressable by hand, on purpose. This reads the exact
          fader you just moved, straight from the server:
        </p>
        <CodeBlock :lines="check" />
        <p class="mt-4 text-sm leading-relaxed text-ink-dim">
          <code class="font-mono text-xs text-ink">position</code> is the
          0–1 value the fader cap sits at; <code class="font-mono text-xs text-ink">db</code>
          is what that position means in gain. Add
          <code class="font-mono text-xs text-ink">?watch=1</code> to follow it
          live instead of reading it once — the full address space is in the
          <NuxtLink to="/docs/rest" class="text-accent hover:underline">REST reference</NuxtLink>.
        </p>
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="What's next" title="One channel works. Sixteen do the same thing." />
        <DocList title="Keep going in the manual" :items="next" />
      </div>
    </section>
  </div>
</template>
