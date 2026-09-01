<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<template>
  <footer class="mt-24 border-t border-edge bg-surface/40">
    <div class="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
      <div>
        <p class="font-display text-lg font-semibold tracking-tight">
          <span class="text-ink">open</span><span class="text-accent">mixer</span>
        </p>
        <p class="mt-2 max-w-xs text-sm leading-relaxed text-ink-dim">
          A software mixing console for Linux. The desk is the software; the
          browser is the surface.
        </p>
      </div>
      <div>
        <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">Pages</p>
        <ul class="mt-3 space-y-2 text-sm">
          <li><NuxtLink to="/architecture" class="text-ink-dim hover:text-accent">Architecture</NuxtLink></li>
          <li><NuxtLink to="/features" class="text-ink-dim hover:text-accent">Features</NuxtLink></li>
          <li><NuxtLink to="/docs" class="text-ink-dim hover:text-accent">Documentation</NuxtLink></li>
          <li><NuxtLink to="/faq" class="text-ink-dim hover:text-accent">FAQ</NuxtLink></li>
          <li><NuxtLink to="/get-it" class="text-ink-dim hover:text-accent">Get it</NuxtLink></li>
          <li><NuxtLink to="/links" class="text-ink-dim hover:text-accent">Links</NuxtLink></li>
        </ul>
      </div>
      <div>
        <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">Licence</p>
        <p class="mt-3 text-sm leading-relaxed text-ink-dim">
          openmixer is free software under the
          <span class="font-mono text-ink">GPL-3.0-or-later</span>. Every package in
          the workspace carries the same licence.
        </p>
      </div>
    </div>
    <div class="border-t border-edge">
      <p class="mx-auto max-w-6xl px-6 py-5 font-mono text-xs text-ink-faint">
        Roland, Midas, Behringer, RME and the product names used here belong to their
        respective owners. openmixer is an independent project and is not affiliated
        with any of them.
      </p>
    </div>
  </footer>
</template>
