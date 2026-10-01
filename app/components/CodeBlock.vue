<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * A shell transcript. `lines` starting with `#` render as comments. The copy button
 * copies the commands only, comments and blank lines left out.
 */
const props = defineProps<{ lines: readonly string[] }>();
const copied = ref(false);
async function copy() {
  const text = props.lines.filter((l) => l && !l.startsWith('#')).join('\n');
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1600);
  } catch {
    // No clipboard (insecure origin, denied): the text is still there to select.
  }
}
</script>

<template>
  <div class="relative">
    <pre class="overflow-x-auto rounded border border-edge bg-field p-5 pr-20 font-mono text-sm leading-relaxed"><code><template
      v-for="(l, i) in lines" :key="i"
    ><span :class="l.startsWith('#') ? 'text-ink-faint' : 'text-ink'">{{ l }}</span>{{ '\n' }}</template></code></pre>
    <UButton
      class="absolute top-2 right-2 font-mono"
      size="xs"
      color="neutral"
      variant="outline"
      :label="copied ? 'Copied' : 'Copy'"
      @click="copy"
    />
  </div>
</template>
