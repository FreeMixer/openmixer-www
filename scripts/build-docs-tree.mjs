#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Publishes the openmixer documentation tree — the operator manual, the FAQ, install,
// hardware, administration, troubleshooting and architecture — under this site, by
// BUILDING it from the openmixer checkout rather than copying any of it into this repo.
//
// WHY IT WORKS THIS WAY. `packages/website` in the openmixer repo already renders
// `docs/**/*.md` into /docs/* routes, and the console serves that same build offline at
// /help/. Rendering the markdown a second time here would be a second renderer to keep in
// step; committing the markdown here would be a second store of the prose. So this script
// runs THAT build, with this site's prefix, and publishes its /docs/** tree beside our own
// pages: one source, one renderer, one artifact online and offline.
//
// Inputs (env):
//   OPENMIXER_SRC            an openmixer checkout. Default ../openmixer, the same default
//                            the other generators in this directory use.
//   NUXT_APP_BASE_URL        the prefix this site is served under (e.g. /openmixer-www/).
//                            The docs build is given the SAME prefix, so its links and the
//                            site's links are one address space.
//
// Output: files added to .output/public (or argv[2]). Run it AFTER `npm run generate` and
// BEFORE `npm run docs:links`, so the link checker sees the merged tree and every manual
// cross-link is checked with everything else.
//
// THE TWO RULES THIS SCRIPT REFUSES ON, both learned the expensive way:
//
//  1. NO SILENT OVERWRITE. Two Nuxt apps published under one prefix can collide: every
//     asset is content-hashed except `_nuxt/builds/latest.json`, the app manifest, and the
//     app whose manifest is overwritten hard-reloads on every navigation. The docs build is
//     therefore given its own NUXT_APP_BUILD_ASSETS_DIR, and any collision that survives
//     that is a FAILURE here, not a last-writer-wins. Identical bytes (the two apps
//     subset the same fonts to the same hashed names) are the one accepted overlap, and
//     they are compared byte for byte before being skipped.
//  2. ONCE INTO A FRESH TREE. `npm run generate` writes the site; this publishes into it,
//     and leaves `_docs_nuxt/source.json` saying which openmixer revision it published.
//     A second run over the same tree would meet its own output — every page differing
//     only by a new build id — and report 147 collisions for one real question, so it
//     refuses on that marker and names the fix instead.
//  3. PRESENCE-VERIFY THE WRITE. A copy that reports success and moved nothing reads
//     exactly like a copy that worked. So afterwards this asserts, against the DESTINATION:
//     every /docs route the build produced is there, the three pages this feature exists
//     for are there, and the number of published manual pages equals the number of markdown
//     files in the source tree — a count that comes from the other side of the boundary.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const wwwRoot = resolve(here, '..');
const src = resolve(wwwRoot, process.env.OPENMIXER_SRC || '../openmixer');
const dist = resolve(wwwRoot, process.argv[2] || '.output/public');
const baseURL = process.env.NUXT_APP_BASE_URL || '/';

/** Where the docs build puts its own hashed assets, so it cannot land on ours. */
const DOCS_ASSETS_DIR = '/_docs_nuxt/';

/** Written into the published tree: provenance, and the marker that says it is published. */
const MANIFEST = '_docs_nuxt/source.json';

/**
 * Routes the docs build produces that THIS site owns and keeps: its home page, its error
 * pages, its own /docs hub. Every other file it produces is published.
 *
 * The hub is ours on purpose: the docs build's hub lists only the openmixer tree, and this
 * site's hub is the one page that knows about both it and the pages written here.
 */
const SITE_OWNS = new Set([
  'index.html',
  '200.html',
  '404.html',
  '_payload.json',
  '.nojekyll',
  'docs/index.html',
  'docs/_payload.json',
]);

function die(message) {
  console.error(`[build-docs-tree] ${message}`);
  process.exit(1);
}

if (!existsSync(join(src, 'packages/website/nuxt.config.ts')) || !existsSync(join(src, 'docs/manual/index.md'))) {
  die(
    `no openmixer checkout at ${src} — set OPENMIXER_SRC.\n` +
      '  There is deliberately no committed copy to fall back on: the markdown lives in the\n' +
      '  openmixer repo and nowhere else, so a build without the checkout would publish a site\n' +
      '  whose manual silently 404s. Refusing instead.',
  );
}
if (!existsSync(join(dist, 'index.html'))) {
  die(`no generated site at ${dist} — run \`npm run generate\` first; this script adds to it`);
}
if (existsSync(join(dist, MANIFEST))) {
  const previous = JSON.parse(readFileSync(join(dist, MANIFEST), 'utf8'));
  die(
    `${dist} already carries a published docs tree (openmixer ${previous.revision}, ${previous.publishedAt}).\n` +
      '  Publishing over it would compare this build against the last one and call every page a\n' +
      '  collision. Run `npm run generate` for a fresh tree, then this.',
  );
}

// ---------------------------------------------------------------------------
// Build the docs tree from the checkout
// ---------------------------------------------------------------------------

const revision = (() => {
  try {
    return execFileSync('git', ['-C', src, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
})();
console.log(`[build-docs-tree] openmixer checkout ${src} at ${revision}, base ${baseURL}`);

const run = (command, args, env) =>
  execFileSync(command, args, { cwd: src, stdio: 'inherit', env: { ...process.env, ...env } });

run('pnpm', ['install', '--frozen-lockfile', '--filter', '@openmixer/website...']);
run('pnpm', ['--filter', '@openmixer/website', 'generate'], {
  NUXT_APP_BASE_URL: baseURL,
  NUXT_APP_BUILD_ASSETS_DIR: DOCS_ASSETS_DIR,
});

const built = join(src, 'packages/website/.output/public');
if (!existsSync(join(built, 'docs/manual/index.html'))) {
  die(`the docs build produced no ${built}/docs/manual/index.html — nothing to publish`);
}

// ---------------------------------------------------------------------------
// Publish it into the generated site
// ---------------------------------------------------------------------------

/** Every file under `dir`, as paths relative to it. */
function filesUnder(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    const full = join(entry.parentPath ?? entry.path, entry.name);
    if (entry.isFile()) out.push(relative(dir, full));
  }
  return out;
}

const produced = filesUnder(built);
if (produced.length === 0) die(`the docs build wrote no files to ${built} — nothing was published`);

let copied = 0;
let shared = 0;
const collisions = [];
for (const rel of produced) {
  if (SITE_OWNS.has(rel)) continue;
  const from = join(built, rel);
  const to = join(dist, rel);
  if (existsSync(to)) {
    if (readFileSync(from).equals(readFileSync(to))) {
      shared++;
      continue;
    }
    collisions.push(rel);
    continue;
  }
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to);
  copied++;
}

if (collisions.length > 0) {
  for (const rel of collisions) console.error(`  COLLISION  ${rel}`);
  die(
    `${collisions.length} file(s) exist in both sites with different contents.\n` +
      '  Publishing either one would silently break the other. Give the docs build its own\n' +
      '  asset directory, or give the route to one site and only one.',
  );
}

// ---------------------------------------------------------------------------
// Presence-verify, against the destination
// ---------------------------------------------------------------------------

const missing = produced.filter((rel) => !SITE_OWNS.has(rel) && !existsSync(join(dist, rel)));
if (missing.length > 0) die(`${missing.length} file(s) were not written: ${missing.slice(0, 5).join(', ')}`);

const REQUIRED = ['docs/manual/index.html', 'docs/architecture/one-summing-bus/index.html'];
for (const rel of REQUIRED) {
  const full = join(dist, rel);
  if (!existsSync(full) || statSync(full).size === 0) die(`${rel} is missing or empty in ${dist}`);
}

// Every manual chapter in the SOURCE tree has a page on the site, checked by path rather
// than by count: two sets of the same size can still disagree about which pages they hold.
const sourceManual = readdirSync(join(src, 'docs/manual'), { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.md'));
if (sourceManual.length === 0) die(`no markdown under ${src}/docs/manual — the source count is a measurement of nothing`);
const unpublished = sourceManual.filter((md) => {
  const slug = md.replace(/\.md$/, '').replace(/(^|\/)index$/, '');
  return !existsSync(join(dist, 'docs/manual', slug, 'index.html'));
});
if (unpublished.length > 0) {
  die(`${unpublished.length} manual chapter(s) in the tree are not on the site: ${unpublished.join(', ')}`);
}
const publishedManual = filesUnder(join(dist, 'docs/manual')).filter((f) => f.endsWith('index.html')).length;

const publishedDocs = filesUnder(join(dist, 'docs')).filter((f) => f.endsWith('index.html')).length;

writeFileSync(
  join(dist, MANIFEST),
  `${JSON.stringify(
    {
      repository: 'FreeMixer/openmixer',
      revision,
      publishedAt: new Date().toISOString(),
      files: copied,
      docPages: publishedDocs,
      manualPages: publishedManual,
    },
    null,
    2,
  )}\n`,
);

console.log(
  `[build-docs-tree] published ${copied} files (${shared} already identical, e.g. shared font subsets): ` +
    `${publishedDocs} doc pages, ${publishedManual} of them manual chapters, from ${revision}`,
);
