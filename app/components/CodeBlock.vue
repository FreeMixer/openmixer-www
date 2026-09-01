<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/** A shell transcript. `lines` starting with `#` render as comments. */
defineProps<{ lines: readonly string[] }>();
</script>

<template>
  <pre class="overflow-x-auto rounded border border-edge bg-field p-5 font-mono text-sm leading-relaxed"><code><template
    v-for="(l, i) in lines" :key="i"
  ><span :class="l.startsWith('#') ? 'text-ink-faint' : 'text-ink'">{{ l }}</span>{{ '\n' }}</template></code></pre>
</template>
