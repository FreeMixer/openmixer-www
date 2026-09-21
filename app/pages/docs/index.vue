<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * The documentation hub: one page to find every document from.
 *
 * It LINKS the operator manual, it does not restate it. Until 2026-09-07 this page carried
 * the manual's whole table of contents — the chapter titles and the blurb sentences out of
 * `docs/manual/index.md`, retyped — and linked almost none of it, because the manual was
 * not published here. It is now, rendered from that same file by the openmixer repo's own
 * site build, so the table of contents lives in one place and this page points at it.
 */
import restReference from '~/data/rest-reference.json';
import abstractions from '~/data/abstractions.json';
import mcpTools from '~/data/mcp-tools.json';

useSeoMeta({
  title: 'Documentation — openmixer',
  description:
    'Tech docs, the operator manual, user docs and the FAQ: everything published about openmixer, generated where the console can generate it and authored where a person has to.',
});

const totalRestRows = restReference.families.reduce((n: number, f: { count: number }) => n + f.count, 0);

/**
 * Chapters written for this site rather than for the manual tree. They cover subjects the
 * manual does not carry yet; which tree should own each of them is an open question, not a
 * settled split, so the distinction is stated rather than hidden.
 */
const siteChapters = [
  {
    title: 'Getting started',
    blurb: 'From a built checkout to one channel audible in the main mix — start the console, patch an input, hear it.',
    to: '/docs/getting-started',
  },
  {
    title: 'Recording and the virtual soundcheck',
    blurb: 'Arming channels, what a take captures, the take library, and running a soundcheck: load, engage, play, eject.',
    to: '/docs/recording',
  },
  {
    title: 'Undo and the history',
    blurb: 'One journal for the whole desk, undo and redo, taking back one change out of the middle, and what the journal deliberately never holds.',
    to: '/docs/history',
  },
  {
    title: 'Channel templates',
    blurb: 'Saving a channel’s processing for reuse, the factory instrument templates that state only the chain, and the preview of what an apply would move.',
    to: '/docs/templates',
  },
  {
    title: 'Plugins and the insert rack',
    blurb: 'Racking a plugin on a channel or a bus output, the picker, the generated editor, mono against stereo, and the latency budget the destination sets.',
    to: '/docs/plugins',
  },
  {
    title: 'The REAC segment role',
    blurb: 'Which end of a REAC wire the console presents as — mixer, recorder or automatic — what automatic decides from, and the sentences it gives when it will not take a role.',
    to: '/docs/reac-role',
  },
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
          <LinkCard title="Architecture" href="/docs/architecture" label="/docs/architecture">
            <p>How the console is built and why: the one summing bus, the row grammar, native DSP against hosted inserts, and the decision records.</p>
          </LinkCard>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="The manual" title="Driving the desk.">
          <p class="mt-4 max-w-3xl text-base leading-relaxed text-ink-dim">
            The operator manual is published here from the same source the console
            serves offline, so the pages read online and the pages a desk gives an
            engineer in a hall with no internet are one document. Its table of
            contents is its own — follow it into the chapters rather than reading a
            second copy of it here.
          </p>
        </SectionHead>
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <LinkCard title="Operator manual" href="/docs/manual" label="/docs/manual">
            <p>Every chapter, grouped the way the surface is: the desk, the mix, and running a show — from the fader bay to the keyboard reference.</p>
          </LinkCard>
          <LinkCard title="Installing" href="/docs/install" label="/docs/install">
            <p>What the packages are, what each one puts on the machine, the services that run, and what survives an upgrade.</p>
          </LinkCard>
          <LinkCard title="Troubleshooting" href="/docs/troubleshooting" label="/docs/troubleshooting">
            <p>Written from the symptom you can observe — a silent main, granulated audio, a box that will not establish — because that is what you have when you need it.</p>
          </LinkCard>
          <LinkCard title="Hardware" href="/docs/hardware" label="/docs/hardware">
            <p>REAC stageboxes, clocking and sample rate, and the wiring and network-interface mistakes that quietly cost a show.</p>
          </LinkCard>
          <LinkCard title="Administration" href="/docs/admin" label="/docs/admin">
            <p>Which file owns which setting, the environment variables, the ports, where state lives, what to back up, and where the logs are.</p>
          </LinkCard>
        </div>
        <DocList
          title="Also written for this site"
          note="Chapters authored here rather than in the manual tree. They cover subjects the manual does not carry yet; which of the two should own each is an open question."
          :items="siteChapters"
        />
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-3xl px-6 py-16">
        <SectionHead eyebrow="FAQ" title="Questions with straight answers." />
        <p class="mb-6 text-base leading-relaxed text-ink-dim">
          Including the ones where the answer is no.
          {{ faqGroups.join(' · ') }}. The manual keeps a second, shorter FAQ of its
          own for the arithmetic questions; this one is about the product.
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
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">Screenshots.</span> The manual explains the
                controls in words; pictures of the surface it names are being captured.
              </li>
              <li class="border-l-2 border-edge-strong pl-4">
                <span class="text-ink">The manual's own arithmetic FAQ.</span> The
                product FAQ above is written; the manual's shorter one for the
                arithmetic questions (mono fold, how many dB twice as loud is) is not
                a chapter yet.
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
