<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
import mcpTools from '~/data/mcp-tools.json';

useSeoMeta({
  title: 'The MCP server — openmixer',
  description:
    'An MCP server over stdio that lets a coding agent read a running console through the console’s own contract, and read the repository’s design records at call time.',
});

const FAMILY_LABEL: Record<string, string> = {
  console: 'The console',
  rig: 'The rig',
  law: 'The governing design',
  rulings: 'The design corpus',
  traps: 'The traps',
  compliance: 'Before an edit',
  jobs: 'The job ledger',
};

interface McpTool {
  name: string;
  family: string;
  args: string[];
  writes: boolean;
  effect: string;
  answers: string;
}

const families = [...new Set((mcpTools.tools as McpTool[]).map((t) => t.family))].map((family) => ({
  family,
  label: FAMILY_LABEL[family] ?? family,
  tools: (mcpTools.tools as McpTool[]).filter((t) => t.family === family),
}));

const columns = [
  { key: 'name', label: 'Tool', mono: true },
  { key: 'args', label: 'Arguments', mono: true },
  { key: 'answers', label: 'What it answers' },
];

const envColumns = [
  { key: 'name', label: 'Variable', mono: true },
  { key: 'meaning', label: 'Meaning' },
  { key: 'default', label: 'Default', mono: true },
];

const install = [
  '# From the top of the workspace.',
  'pnpm -r --filter "@openmixer/mcp-server..." build',
  '',
  '# stdio; an MCP client starts it and speaks to it over the pipe.',
  'node packages/mcp-server/dist/main.js',
];

const skills = [
  {
    name: 'design-first',
    blurb:
      'Resolve the governing design before reading or writing a line. It is three questions — which primitive does this belong to, does it need a new word in the vocabulary, and why is it not an existing thing configured differently — and a search of the specs and the log for the subject before anything is built. The week that produced it lost most of its time re-deriving decisions that were already written down.',
  },
  {
    name: 'design-ruling',
    blurb:
      'Record a decision where the automation reads it. When a spec is written or amended, a contract field changes, or a law is superseded, the ruling goes into the design records and the spec map that the pre-edit gate consults — otherwise the next person to touch that file is told the old law.',
  },
  {
    name: 'false-signals',
    blurb:
      'The house rule for a signal that does not observe what it claims to. A green suite over an empty function body, a grep that finds nothing because it is broken, a probe that reports silence because it was pointed at the wrong strip: each one has cost a night here. The rule it enforces is to prove a check can detect presence before believing its report of absence.',
  },
  {
    name: 'round-trip-proof',
    blurb:
      'A feature is done when the operator’s whole job has been measured end to end, not when its parts pass. It is the skill to read before calling anything finished, and the one that governs any audio measurement that comes back a null, a ratio or a surprise — a gain test needs a real signal well above the noise floor before its delta means anything.',
  },
  {
    name: 'openmixer-dev-discipline',
    blurb:
      'The house style, in one place: how a change lands in git, what the TypeScript and C look like, the rules for the surface’s components and its translations, which testing tier a change owes, and how the packaging stays parametrised. Its first principle is operator authority — the console states the cost of a choice and lets the operator make it, rather than vetoing; the narrow exception is anything irreversible that lands on people who are not at the desk.',
  },
  {
    name: 'lane-discipline',
    blurb:
      'How parallel work stays separable. Each lane gets its own worktree and branch, commits often with explicit paths, keeps its evidence in the repository rather than in a scratch file, and never merges its own work onto the integration branch. Written after a fan-out lost a night of findings that existed only outside the repository.',
  },
  {
    name: 'settle-gate',
    blurb:
      'The procedure that puts an integration branch on the live console. It is deliberately not something a lane can invoke: it builds before it deploys, verifies with a question only the new commit can answer rather than with a health check, and drops real audio if it is wrong.',
  },
];
</script>

<template>
  <div>
    <PageHero
      eyebrow="Tech docs — the agent door"
      title="A console an editing agent can read, and a tree that answers with its own law."
      lede="openmixer ships an MCP server over stdio. Its tools read a running console through the console’s own REST contract, and read the repository’s governing design — the spec map, the rulings, the traps, the conformance suites, the job ledger — at the moment they are asked. It decides nothing: every answer is data the desk or the tree already holds, named with where it came from."
    />

    <section class="border-b border-edge">
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="01" title="Running it." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            It is a workspace package, <code class="font-mono text-sm text-ink">@openmixer/mcp-server</code>,
            and it speaks MCP over stdio — an MCP client starts the process and talks to it over
            the pipe. There is no port, no daemon and nothing to leave running.
          </p>
          <CodeBlock :lines="install" />
          <p>
            The server walks up from its working directory to the workspace root and reads the
            laws of <span class="text-ink">that</span> tree, so a second checkout answers with
            its own design records and nothing is bundled into the package.
          </p>
          <RefTable :columns="envColumns" :rows="mcpTools.env" />
        </div>
      </div>
    </section>

    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-5xl px-6 py-16">
        <SectionHead
          eyebrow="02"
          :title="`${mcpTools.meta.toolCount} tools, in two halves.`"
        >
          <p class="mt-4 max-w-3xl text-base leading-relaxed text-ink-dim">
            One half is the REST entity door as it stands — the roster, a row, its declared
            travels, one frame of a metered row. The other half is the tree’s own design
            material. The table below is generated from the package’s registered tool table,
            not written by hand, and the package’s own test refuses a description that has
            drifted from the registry.
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
              >writes</span>
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
        <SectionHead eyebrow="03" title="One tool writes, and it writes once." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            Fifteen of the sixteen tools read. The sixteenth,
            <code class="font-mono text-sm text-ink">console_patch</code>, sends a real write to a
            real desk — so it sends exactly one request, never retries it, and hands back the
            console’s status, its <code class="font-mono text-sm text-ink">Allow</code> header and
            its body as they arrived. A refusal is the desk’s ruling and is returned verbatim
            rather than interpreted, which is the same contract every other client works under:
            the console decides, and what comes back is what it decided.
          </p>
          <p>
            The tool holds nothing back on its own account. A write that fires an operation the
            console’s own <code class="font-mono text-sm text-ink">confirms</code> sheet gates —
            a channel-config apply that would move gain, trim or pan is the example — is sent,
            and the console refuses it with
            <code class="font-mono text-sm text-ink">CONFIRM_REQUIRED</code> while the preview
            lists moves and the operator’s sign-off is on. The refusal comes back with the
            preview in the body, like any other answer. Calling again with
            <code class="font-mono text-sm text-ink">confirm: true</code> — which rides the delta
            as the row’s own confirm argument — applies it, because the agent has now been shown
            what it is agreeing to. The gate is the desk’s, so an agent, a browser and an OSC
            surface are refused identically and answer identically; there is no client-side
            policy to keep in step.
          </p>
          <p>
            The metered row is the one place a read is not simply a GET. A pump-fed row measures
            only while something is watching it, so an unmeasured frame is followed by a single
            watch that closes the moment the first measured frame lands. No stream is left open.
          </p>
          <p class="text-sm text-ink-faint">
            The tools stand on a fake console with the real console’s shapes, checked across the
            wire on values rather than on shapes — a −20 dBFS reading has to decode to −20. A
            live desk is not part of that suite.
          </p>
        </div>
      </div>
    </section>

    <section>
      <div class="mx-auto max-w-4xl px-6 py-16">
        <SectionHead eyebrow="04" title="The process skills the tree carries.">
          <p class="mt-4 max-w-3xl text-base leading-relaxed text-ink-dim">
            Alongside the server, the repository keeps its working discipline as readable
            documents, one per subject, checked in beside the code they govern. Each one exists
            because something went wrong the other way. They are listed here because they
            describe how this project is built, not because a reader needs to run them.
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
          The repository is not public yet, so these documents live in a tree you cannot clone
          today. They are named rather than summarised away, because a name is what makes the
          description checkable the day it opens.
        </p>
      </div>
    </section>
  </div>
</template>
