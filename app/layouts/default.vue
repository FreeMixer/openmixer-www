<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/** The site shell: a fixed masthead, the page, and the footer. */
</script>

<template>
  <div class="min-h-screen bg-field text-ink font-sans antialiased flex flex-col">
    <SiteHeader />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
