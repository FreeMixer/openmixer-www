<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
/**
 * `lang` on <html>, and the hreflang alternates and canonical link of the page in each
 * language, from the i18n module's view of the current route.
 */
const head = useLocaleHead({ seo: true });
useHead(() => ({
  htmlAttrs: { lang: head.value.htmlAttrs.lang },
  link: [...(head.value.link ?? [])],
  meta: [...(head.value.meta ?? [])],
}));
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
