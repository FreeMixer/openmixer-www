#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Writes a redirect page under openmixer-www/ for every page of the generated site, so the
// addresses the site had when it lived at https://freemixer.github.io/openmixer-www/ keep
// working now that it is served from the root.
//
//   openmixer-www/faq/index.html        -> /faq/
//   openmixer-www/api-docs/x.html       -> /api-docs/x.html
//
// Each page redirects at once (meta refresh, and a script that keeps the query and the
// #anchor), names the new address as canonical, and asks search engines not to index it.
// They only answer once the old project site is switched off: until then GitHub serves
// /openmixer-www/ from that repository's own Pages site.
//
// Usage: node scripts/redirect-stubs.mjs [dist-dir]   (default .output/public)

import { mkdirSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OLD_PREFIX = 'openmixer-www';
const ORIGIN = 'https://freemixer.github.io';
const SKIP = new Set(['200.html', '404.html']);

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', process.argv[2] || '.output/public');
if (!existsSync(join(root, 'index.html'))) {
  console.error(`[redirect-stubs] no generated site at ${root}`);
  process.exit(1);
}

const pages = readdirSync(root, { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile() && e.name.endsWith('.html'))
  .map((e) => relative(root, join(e.parentPath ?? e.path, e.name)).split('\\').join('/'))
  .filter((rel) => !SKIP.has(rel) && !rel.startsWith(`${OLD_PREFIX}/`));

const escape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

for (const rel of pages) {
  const target = `/${rel.replace(/(^|\/)index\.html$/, '$1')}`;
  const url = escape(target);
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Moved to ${escape(ORIGIN + target)}</title>
<link rel="canonical" href="${escape(ORIGIN + target)}">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${url}">
<script>location.replace(${JSON.stringify(target)} + location.search + location.hash)</script>
</head><body><p>This page has moved to <a href="${url}">${escape(ORIGIN + target)}</a>.</p></body></html>
`;
  const out = join(root, OLD_PREFIX, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

if (pages.length === 0) {
  console.error('[redirect-stubs] the site holds no pages — nothing to redirect, which is not a pass');
  process.exit(1);
}
console.log(`[redirect-stubs] ${pages.length} redirect pages under /${OLD_PREFIX}/`);
