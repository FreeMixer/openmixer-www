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
// It also writes one under plugin-hostd/ for every page of plugin-hostd's retired documentation site, to where that
// page lives now (deploy/plugin-hostd-redirects.txt), and fails when a target page of this site is not in the build.
//
// Usage: node scripts/redirect-stubs.mjs [dist-dir]   (default .output/public)

import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
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
  .filter((rel) => !SKIP.has(rel) && !rel.startsWith(`${OLD_PREFIX}/`) && !rel.startsWith('plugin-hostd/'));

const escape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** A page that sends its visitor to `target` (a path of this site, or a full URL), named canonical there. */
function stub(target, origin) {
  const canonical = /^https?:/.test(target) ? target : origin + target;
  const url = escape(target);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Moved to ${escape(canonical)}</title>
<link rel="canonical" href="${escape(canonical)}">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${url}">
<script>location.replace(${JSON.stringify(target)} + location.search + location.hash)</script>
</head><body><p>This page has moved to <a href="${url}">${escape(canonical)}</a>.</p></body></html>
`;
}

function write(rel, html) {
  const out = join(root, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

for (const rel of pages) write(`${OLD_PREFIX}/${rel}`, stub(`/${rel.replace(/(^|\/)index\.html$/, '$1')}`, ORIGIN));

// plugin-hostd's retired site: every old page to its new home, which must be a page of this build
const HOSTD_MAP = resolve(here, '..', 'deploy/plugin-hostd-redirects.txt');
const hostd = readFileSync(HOSTD_MAP, 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => l.split(/\s+/));
const missing = hostd.filter(([, to]) => !/^https?:/.test(to) && !existsSync(join(root, to.replace(/^\//, ''), 'index.html')));
if (missing.length) {
  for (const [from, to] of missing) console.error(`[redirect-stubs] plugin-hostd/${from} -> ${to}: no such page in the build`);
  process.exit(1);
}
for (const [from, to] of hostd) write(`plugin-hostd/${from}`, stub(to, 'https://openmixer.org'));
console.log(`[redirect-stubs] ${pages.length} pages under ${OLD_PREFIX}/, ${hostd.length} under plugin-hostd/`);

if (pages.length === 0) {
  console.error('[redirect-stubs] the site holds no pages — nothing to redirect, which is not a pass');
  process.exit(1);
}
console.log(`[redirect-stubs] ${pages.length} redirect pages under /${OLD_PREFIX}/`);
