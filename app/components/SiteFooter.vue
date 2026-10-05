<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
const { t } = useI18n();
const sitePath = useSitePath();
const pages = ['architecture', 'features', 'docs', 'faq', 'get-it', 'links'] as const;
</script>

<template>
  <footer class="mt-24 border-t border-edge bg-surface/40">
    <div class="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
      <div>
        <p class="font-display text-lg font-semibold tracking-tight">
          <span class="text-ink">open</span><span class="text-accent">mixer</span>
        </p>
        <p class="mt-2 max-w-xs text-sm leading-relaxed text-ink-dim">{{ t('common.footer.tagline') }}</p>
      </div>
      <div>
        <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">{{ t('common.footer.pages') }}</p>
        <ul class="mt-3 space-y-2 text-sm">
          <li v-for="page in pages" :key="page">
            <NuxtLink :to="sitePath(`/${page}`)" class="text-ink-dim hover:text-accent">{{ t(`common.footer.page.${page}`) }}</NuxtLink>
          </li>
        </ul>
      </div>
      <div>
        <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">{{ t('common.footer.licence') }}</p>
        <p class="mt-3 text-sm leading-relaxed text-ink-dim" v-html="t('common.footer.licenceText')" />
      </div>
    </div>
    <div class="border-t border-edge">
      <p class="mx-auto max-w-6xl px-6 py-5 font-mono text-xs text-ink-faint">{{ t('common.footer.trademarks') }}</p>
    </div>
  </footer>
</template>
