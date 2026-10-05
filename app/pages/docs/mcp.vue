<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
import mcpTools from '~/data/mcp-tools.json';

const { t } = useI18n();

useSeoMeta({
  title: () => t('docsMcp.seo.title'),
  description: () => t('docsMcp.seo.description'),
});

const FAMILIES = ['console', 'rig', 'law', 'rulings', 'traps', 'compliance', 'jobs'];

interface McpTool {
  name: string;
  family: string;
  args: string[];
  writes: boolean;
  effect: string;
  answers: string;
}

const families = computed(() =>
  [...new Set((mcpTools.tools as McpTool[]).map((tool) => tool.family))].map((family) => ({
    family,
    label: FAMILIES.includes(family) ? t(`docsMcp.family.${family}`) : family,
    tools: (mcpTools.tools as McpTool[]).filter((tool) => tool.family === family),
  })),
);

const columns = computed(() => [
  { key: 'name', label: t('docsMcp.col.tool'), mono: true },
  { key: 'args', label: t('docsMcp.col.args'), mono: true },
  { key: 'answers', label: t('docsMcp.col.answers') },
]);

const envColumns = computed(() => [
  { key: 'name', label: t('docsMcp.col.variable'), mono: true },
  { key: 'meaning', label: t('docsMcp.col.meaning') },
  { key: 'default', label: t('docsMcp.col.default'), mono: true },
]);

const install = computed(() => [
  `# ${t('docsMcp.install.top')}`,
  'pnpm -r --filter "@openmixer/mcp-server..." build',
  '',
  `# ${t('docsMcp.install.stdio')}`,
  'node packages/mcp-server/dist/main.js',
]);

const SKILLS = [
  'design-first',
  'design-ruling',
  'false-signals',
  'round-trip-proof',
  'openmixer-dev-discipline',
  'lane-discipline',
  'settle-gate',
] as const;

const skills = computed(() => SKILLS.map((name) => ({ name, blurb: t(`docsMcp.skills.${name}`) })));
</script>

<template>
  <div>
    <PageHero
      :eyebrow="t('docsMcp.hero.eyebrow')"
      :title="t('docsMcp.hero.title')"
      :lede="t('docsMcp.hero.lede')"
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" :title="t('docsMcp.s1.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsMcp.s1.p1')" />
          <CodeBlock :lines="install" />
          <p v-html="t('docsMcp.s1.p2')" />
          <RefTable :columns="envColumns" :rows="mcpTools.env" />
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-5xl px-6 py-16">
        <SectionHead
          eyebrow="02"
          :title="t('docsMcp.s2.title', { count: mcpTools.meta.toolCount })"
        >
          <p class="mt-4 max-w-3xl text-base leading-relaxed text-ink-dim">
            {{ t('docsMcp.s2.p1') }}
          </p>
        </SectionHead>

        <div v-for="f in families" :key="f.family" class="mb-10 last:mb-0">
          <h3 class="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent">{{ f.label }}</h3>
          <RefTable :columns="columns" :rows="f.tools">
            <template #name="{ row }">
              <span class="text-ink">{{ (row as McpTool).name }}</span>
              <span
                v-if="(row as McpTool).writes"
                class="ml-2 rounded border border-accent/40 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-accent"
              >{{ t('docsMcp.s2.writes') }}</span>
            </template>
            <template #args="{ row }">
              <span v-if="(row as McpTool).args.length === 0" class="text-ink-faint">—</span>
              <span v-else>{{ (row as McpTool).args.join(', ') }}</span>
            </template>
          </RefTable>
        </div>
      </div>
    </section>

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="03" :title="t('docsMcp.s3.title')" />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p v-html="t('docsMcp.s3.p1')" />
          <p v-html="t('docsMcp.s3.p2')" />
          <p>{{ t('docsMcp.s3.p3') }}</p>
          <p class="text-sm text-ink-faint">{{ t('docsMcp.s3.p4') }}</p>
        </div>
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" :title="t('docsMcp.s4.title')">
          <p class="mt-4 max-w-3xl text-base leading-relaxed text-ink-dim">
            {{ t('docsMcp.s4.p1') }}
          </p>
        </SectionHead>
        <dl>
          <div v-for="s in skills" :key="s.name" class="border-t border-edge py-6 first:border-t-0 first:pt-0">
            <dt>
              <span class="font-display text-lg font-semibold tracking-tight text-ink">{{ s.name }}</span>
            </dt>
            <dd class="mt-2 text-base leading-relaxed text-ink-dim">{{ s.blurb }}</dd>
          </div>
        </dl>
        <p class="mt-8 text-sm leading-relaxed text-ink-faint">
          {{ t('docsMcp.s4.p2') }}
        </p>
      </div>
    </section>
  </div>
</template>
