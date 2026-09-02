<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
import restReference from '~/data/rest-reference.json';
import abstractions from '~/data/abstractions.json';
import mcpTools from '~/data/mcp-tools.json';

useSeoMeta({
  title: 'Documentation — openmixer',
  description:
    'Tech docs, the operator manual, user docs and the FAQ: everything published about openmixer, generated where the console can generate it and authored where a person has to.',
});

const totalRestRows = restReference.families.reduce((n: number, f: { count: number }) => n + f.count, 0);

const manualDesk = [
  { title: 'The surface', blurb: 'The header, the layout chips, the fader bay, and where to find things that are not where you would first look.' },
  { title: 'The channel strip', blurb: 'Signal order, trim, the tile controls, selecting and naming.' },
  { title: 'Head-amp control', blurb: 'Phantom power, pad, sensitivity and polarity, including on a REAC stagebox.' },
  { title: 'EQ and dynamics', blurb: 'The interactive EQ curve, the gate and the compressor.' },
  { title: 'Feedback suppression', blurb: 'Ring-out and live modes, sensitivity, notch width, and the roster of planted notches.' },
  {
    title: 'Plugins and the insert rack',
    blurb: 'Racking a plugin on a channel or a bus output, the picker, the generated editor, mono against stereo, and the latency budget the destination sets.',
    to: '/docs/plugins',
  },
  {
    title: 'Channel templates',
    blurb: 'Saving a channel’s processing for reuse, the factory instrument templates that state only the chain, and the preview of what an apply would move.',
    to: '/docs/templates',
  },
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
  {
    title: 'Recording and the virtual soundcheck',
    blurb: 'Arming channels, what a take captures, the take library, and running a soundcheck: load, engage, play, eject.',
    to: '/docs/recording',
  },
  { title: 'Scenes, snapshots and saving your work', blurb: 'Sessions, scenes, recall safe, and what a save actually captures.' },
  { title: 'Console profiles, personalities and themes', blurb: 'Console appliances, the visual personality axis, and the dark, light and high-contrast themes.' },
  {
    title: 'Undo and the history',
    blurb: 'One journal for the whole desk, undo and redo, taking back one change out of the middle, and what the journal deliberately never holds.',
    to: '/docs/history',
  },
  { title: 'Keyboard reference', blurb: 'Every shortcut the surface answers to.' },
];
const install = [
  {
    title: 'Getting started',
    blurb: 'From a built checkout to one channel audible in the main mix — start the console, patch an input, hear it.',
    to: '/docs/getting-started',
  },
  { title: 'Installing', blurb: 'What the packages are and what each one puts on the machine.' },
  { title: 'Services', blurb: 'The units that run, what starts what, and in which order.' },
  { title: 'Upgrading', blurb: 'What survives an upgrade and what to check afterwards.' },
];
const hardware = [
  { title: 'REAC stageboxes', blurb: 'Roland S-series boxes: what is supported, how they are patched, and how head-amp control behaves.' },
  {
    title: 'The REAC segment role',
    blurb: 'Which end of a REAC wire the console presents as — mixer, recorder or automatic — what automatic decides from, and the sentences it gives when it will not take a role.',
    to: '/docs/reac-role',
  },
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

const faqGroups = [
  'What it is', 'Running it', 'Building on it', 'Recording and the virtual soundcheck',
  'When the desk refuses', 'Whether to trust it',
];
</script>

<template>
  <div>
    <PageHero
      eyebrow="Documentation"
      title="Four kinds of document, one page to find them from."
      lede="Tech docs for building against the console, an operator manual for driving it, user docs for getting it running, and an FAQ for the straight answer. Tech docs are generated from the running contract wherever the console can generate them; the rest is written by a person and says so when a chapter is not there yet. It all ships with the console, too — a packaged install serves the whole set locally, so a desk with no internet still has its manual."
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="Tech docs" title="Reference for developers and integrators.">
          <p class="mt-4 max-w-3xl text-base leading-relaxed text-ink-dim">
            Generated from the running console's own contract, not hand-written —
            each one dates itself and cannot describe a control the server does
            not actually serve.
          </p>
        </SectionHead>
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <LinkCard title="API reference" href="/api-docs/" label="/api-docs/">
            <p>TSDoc for @openmixer/core and the server's public surface, generated with typedoc.</p>
          </LinkCard>
          <LinkCard title="REST reference" href="/docs/rest" label="/docs/rest">
            <p>{{ totalRestRows }} addressable rows, their fields, ranges and refusal codes.</p>
          </LinkCard>
          <LinkCard title="OpenAPI 3.1 document" href="/openapi.json" label="/openapi.json">
            <p>The same address space as one standard, tool-readable document.</p>
          </LinkCard>
          <LinkCard title="Abstractions catalog" href="/docs/abstractions" label="/docs/abstractions">
            <p>{{ abstractions.meta.generatedCount }} reusable elements — types, composables, components, C libraries — one line each.</p>
          </LinkCard>
          <LinkCard title="The MCP server" href="/docs/mcp" label="/docs/mcp">
            <p>{{ mcpTools.meta.toolCount }} tools over stdio for reading a running console and the tree's own design, and the process skills the repository keeps.</p>
          </LinkCard>
        </div>
        <DocList
          title="Architecture and administration"
          note="The architecture page covers the design; these two chapters are the concise reference for running one."
          :items="[...hardware, ...admin]"
        />
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="Manuals" title="Driving the desk.">
          <p class="mt-4 max-w-3xl text-base leading-relaxed text-ink-dim">
            Task-oriented chapters for operating a running console, grouped the
            way the surface itself is: the desk, the mix, and the show.
          </p>
        </SectionHead>
        <DocList title="The desk" :items="manualDesk" />
        <DocList title="The mix" :items="manualMix" />
        <DocList title="The show" :items="manualShow" />
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="User docs" title="Getting it running, and what to do when it is not.">
          <p class="mt-4 max-w-3xl text-base leading-relaxed text-ink-dim">
            Getting started takes a built checkout to a channel audible in
            the mix; troubleshooting is written from the symptom you can
            observe, because at the point you need one of these pages you
            know what you can hear and not what is broken.
          </p>
        </SectionHead>
        <DocList title="Getting started" :items="install" />
        <DocList title="Troubleshooting, by symptom" :items="trouble" />
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-3xl px-6 py-16">
        <SectionHead eyebrow="FAQ" title="Questions with straight answers." />
        <p class="mb-6 text-base leading-relaxed text-ink-dim">
          Including the ones where the answer is no.
          {{ faqGroups.join(' · ') }}.
        </p>
        <UButton to="/faq" color="primary" trailing-icon="i-lucide-arrow-right">Read the FAQ</UButton>
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
                <span class="text-ink">Control surfaces.</span> There is no operator
                chapter for the X-Touch yet, because nothing has been driven on real
                hardware to write one from.
              </li>
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">A deployment guide beyond a single machine.</span>
                One console on one box is documented. Anything larger is not.
              </li>
            </ul>
          </div>
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <p class="text-sm text-ink-faint">
              Development notes, design records and working material are not part of the
              published set and are not linked here. What publishes is documentation
              written to be read, or generated straight from the same contract the
              console itself answers on.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
