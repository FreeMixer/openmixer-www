<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
import restReference from '~/data/rest-reference.json';

useSeoMeta({
  title: 'REST reference — openmixer',
  description: 'Every addressable entity on the console, generated from the server’s own contract: the rows, their fields, the field limits and the refusal codes.',
});

const families = [...restReference.families].sort((a, b) => humanizeSlug(a.slug).localeCompare(humanizeSlug(b.slug)));
const totalRows = restReference.families.reduce((n, f) => n + f.count, 0);
</script>

<template>
  <div>
    <PageHero
      eyebrow="Tech docs — REST reference"
      title="Every entity, straight from the contract."
      lede="This reference is generated, not written: it comes from the same address space, field limits and refusal catalog the running server publishes through OPTIONS. It cannot describe a control the server does not actually serve, and it cannot miss one either."
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="Before you read a row" title="Three things true of every entity here." />
        <div class="grid gap-5 md:grid-cols-3">
          <Slab title="GET, PATCH, OPTIONS" tag="every row">
            <p>Every address answers <code class="font-mono text-xs text-ink">GET</code>. One that takes a write below answers <code class="font-mono text-xs text-ink">PATCH</code> too, and <code class="font-mono text-xs text-ink">OPTIONS</code> always publishes the live contract — the writable fields, the ranges and the enumerated options — for whichever is true on the server you are talking to.</p>
          </Slab>
          <Slab title="?watch=1 on any address" tag="streaming">
            <p>Add it to a <code class="font-mono text-xs text-ink">GET</code> and it becomes a server-sent event stream emitting exactly what that <code class="font-mono text-xs text-ink">GET</code> returns, snapshot first. A handful of rows — marked <span class="text-ink">on demand</span> below — only compute while at least one client is watching them.</p>
          </Slab>
          <Slab title="Generated, so it dates itself" tag="provenance">
            <p>Built from an openmixer checkout's <code class="font-mono text-xs text-ink">travel-sheet.json</code>, <code class="font-mono text-xs text-ink">engine-ui-rows.json</code> and <code class="font-mono text-xs text-ink">message-code.ts</code> — {{ totalRows }} rows across {{ families.length }} families, generated {{ new Date(restReference.meta.generatedAt).toISOString().slice(0, 10) }}.</p>
          </Slab>
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="By family" title="Pick a resource." />
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="f in families" :key="f.slug"
            :to="`/docs/rest/${f.slug}`"
            class="group flex items-baseline justify-between rounded border border-edge bg-surface/60 px-4 py-3 transition-colors hover:border-accent/60"
          >
            <span class="font-mono text-sm text-ink group-hover:text-accent">{{ f.root }}</span>
            <span class="ml-3 font-mono text-xs text-ink-faint">{{ f.count }}</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-6xl px-6 py-16">
        <div class="grid gap-5 sm:grid-cols-2">
          <LinkCard
            title="Refusal and undo-label codes"
            href="/docs/rest/refusal-codes"
            label="/docs/rest/refusal-codes"
          >
            <p>
              Every refusal, warning and undo-entry label the server can send, with
              the parameters each one carries. Nothing below the surface renders
              display prose directly — a code plus its parameters travels the wire,
              and the client's own locale supplies the sentence.
            </p>
          </LinkCard>
          <LinkCard
            title="OpenAPI 3.1 document"
            href="/openapi.json"
            label="/openapi.json"
          >
            <p>
              The same {{ totalRows }} rows and the refusal catalog as one standard,
              tool-readable document — paths, request and response JSON Schema, and
              the refusal codes as reusable components. Generated, not hand-written,
              same as everything else on this page.
            </p>
          </LinkCard>
        </div>
      </div>
    </section>
  </div>
</template>
