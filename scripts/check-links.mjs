#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Checks that every internal link in the generated site resolves to a file that
// was actually written. `nuxt generate` fails on a broken ROUTE, but a link to a
// path no page claims — a mistyped /docs/rest/{family}, an /api-docs/ page that
// moved, an anchor into a chapter that was renamed — prerenders fine and 404s in
// a browser. External links are listed, not fetched: the site is built and served
// on machines with no internet, so a network check would fail for the wrong reason.
//
// Usage: node scripts/check-links.mjs [dist-dir]   (default .output/public)
//
// A project-page build sets NUXT_APP_BASE_URL (e.g. /openmixer-www/) so every
// absolute href on the live site carries that prefix — but the generated tree
// on disk has no such subdirectory, so the prefix has to come off a site-absolute
// href before it is checked against the output root.

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', process.argv[2] || '.output/public');
const base = (process.env.NUXT_APP_BASE_URL || '/').replace(/\/+$/, ''); // '' for a domain root

/** Strip the app's base path off a site-absolute path, e.g. /openmixer-www/faq -> /faq. */
function stripBase(sitePath) {
  if (!base) return sitePath;
  if (sitePath === base) return '/';
  if (sitePath.startsWith(`${base}/`)) return sitePath.slice(base.length);
  return sitePath;
}

if (!existsSync(root)) {
  console.error(`[check-links] no generated site at ${root} — run \`npm run generate\` first`);
  process.exit(1);
}

/** Every .html file under the generated tree, as absolute paths. */
function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** Does a site-absolute path exist as a file, or as a directory with an index.html? */
function resolves(sitePath) {
  const clean = sitePath.replace(/[?#].*$/, '');
  const full = join(root, decodeURIComponent(clean));
  if (existsSync(full)) {
    return statSync(full).isDirectory() ? existsSync(join(full, 'index.html')) : true;
  }
  return existsSync(`${full}.html`) || existsSync(join(full, 'index.html'));
}

const pages = htmlFiles(root);
if (pages.length === 0) {
  console.error(`[check-links] ${root} holds no HTML — nothing was checked, which is not a pass`);
  process.exit(1);
}

const HREF = /(?:href|src)="([^"]+)"/g;
const broken = [];
let internal = 0;
let external = 0;

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const from = `/${page.slice(root.length + 1)}`;
  for (const [, raw] of html.matchAll(HREF)) {
    if (/^(https?:|mailto:|data:|#|\/\/)/.test(raw)) {
      external++;
      continue;
    }
    const sitePath = raw.startsWith('/') ? stripBase(raw) : posix.join(posix.dirname(from), raw);
    internal++;
    if (!resolves(sitePath)) broken.push({ from, raw });
  }
}

console.log(`[check-links] ${pages.length} pages, ${internal} internal links checked, ${external} external links listed`);
if (broken.length > 0) {
  for (const b of broken) console.error(`  BROKEN  ${b.raw}  (linked from ${b.from})`);
  console.error(`[check-links] ${broken.length} broken internal link(s)`);
  process.exit(1);
}
console.log('[check-links] every internal link resolves');
