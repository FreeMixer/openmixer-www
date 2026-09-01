<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
import restReference from '~/data/rest-reference.json';

const route = useRoute();
const slug = computed(() => String(route.params.family));
const family = computed(() => restReference.families.find((f) => f.slug === slug.value));

if (!family.value) {
  throw createError({ statusCode: 404, statusMessage: 'No such REST family' });
}

const label = computed(() => humanizeSlug(slug.value));

useSeoMeta({
  title: () => `${family.value?.root} — REST reference — openmixer`,
  description: () => `Every address under ${family.value?.root}: fields, ranges and an example response, generated from the server's own contract.`,
});
</script>

<template>
  <div v-if="family">
    <PageHero eyebrow="REST reference" :title="family.root">
      <p class="mt-6 max-w-3xl text-base leading-relaxed text-ink-dim">
        {{ family.count }} address{{ family.count === 1 ? '' : 'es' }} under
        <code class="font-mono text-sm text-ink">{{ family.root }}</code>.
        <NuxtLink to="/docs/rest" class="text-accent hover:underline">All families</NuxtLink>
        · <NuxtLink to="/docs/rest/refusal-codes" class="text-accent hover:underline">Refusal codes</NuxtLink>
      </p>
    </PageHero>

    <section>
      <div class="mx-auto max-w-6xl space-y-14 px-6 py-16">
        <div v-for="g in family.groups" :key="g.label">
          <h2 class="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            {{ g.label.startsWith('(') ? 'Root' : humanizeSlug(g.label) }}
          </h2>
          <div class="mt-4 space-y-4">
            <RestRowCard v-for="row in g.rows" :key="row.path" :row="row" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
