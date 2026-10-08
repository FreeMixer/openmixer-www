#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Publishes the openmixer documentation tree — the operator manual, the FAQ, install,
// hardware, administration, troubleshooting and architecture — under this site, from a tree
// that was BUILT from the openmixer docs rather than from copies of them in this repo.
//
// WHY IT WORKS THIS WAY. `packages/website` in the openmixer repo already renders
// `docs/**/*.md` into /docs/* routes, and the console serves that same build offline at /help/.
// Rendering the markdown a second time here would be a second renderer to keep in step;
// committing the markdown here would be a second store of the prose. So the site publishes THAT
// build's /docs/** tree beside its own pages: one source, one renderer, one artifact online and
// offline.
//
// TWO HALVES, because the build needs the private openmixer checkout and the publish does not:
//
//   BUILD    (where the checkout is: the desk)   OPENMIXER_SRC=<checkout> node scripts/build-docs-tree.mjs --emit <file.tar.gz>
//            runs the docs build on the allowlisted pages, refuses a tree the public guard
//            (check-public.mjs) objects to, and writes the tree, with docs-tree.json, as a
//            tarball. It prints the line to put in deploy/docs-tree.txt.
//   PUBLISH  (CI: public inputs only)             DOCS_TREE=<unpacked tarball> node scripts/build-docs-tree.mjs
//            checks the tree against this repo (same base URL, same list) and adds it to the
//            generated site. scripts/fetch-docs-tree.sh unpacks the tarball deploy/docs-tree.txt
//            pins, by tag and sha256, from a public release of this repository.
//
//   OPENMIXER_SRC=<checkout> node scripts/build-docs-tree.mjs   does both at once, for a desk
//            preview of the whole site.
//
// Inputs (env):
//   DOCS_TREE                an unpacked docs tree (docs-tree.json and public/): the PUBLISH half.
//   OPENMIXER_SRC            an openmixer checkout, the BUILD half. Default ../openmixer when
//                            DOCS_TREE is not set, the same default the other generators use.
//   NUXT_APP_BASE_URL        the prefix this site is served under (e.g. /openmixer-www/).
//                            The docs build is given the SAME prefix, so its links and the
//                            site's links are one address space. A tree built for another
//                            prefix is refused: its links would point past this site.
//   PUBLIC_DOCS_LIST         the allowlist, default deploy/public-docs.txt (tests point it elsewhere).
//
// Output: files added to .output/public (or the first argument). Run it AFTER `npm run
// generate` and BEFORE `npm run docs:links`, so the link checker sees the merged tree and every
// manual cross-link is checked with everything else.
//
// ONLY THE ALLOWLIST. The docs build bundles every markdown file under the repo's docs/
// into its JS, whether or not it renders a page for it. Run on the checkout, it shipped
// the whole private docs/design tree to the public site (2026-10-01). So it never runs on
// the checkout: it runs on a sparse copy of it whose docs/ holds only the pages named in
// deploy/public-docs.txt, with the edits that file lists applied, and without .claude/ and
// CLAUDE.md. A page the list does not name is not in the build at all. The tree records a hash
// of the list it was built from, and the publish half refuses a tree built from another one:
// the list stays the one list, and a change to it is a new tree.
//
// THE RULES THIS SCRIPT REFUSES ON, learned the expensive way:
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
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const wwwRoot = resolve(here, '..');
const args = process.argv.slice(2);
const emitAt = args.indexOf('--emit');
const emitTo = emitAt >= 0 ? resolve(args[emitAt + 1] ?? '') : null;
if (emitAt >= 0 && !args[emitAt + 1]) {
  console.error('[build-docs-tree] --emit needs a file name');
  process.exit(2);
}
const positional = emitAt >= 0 ? args.filter((_, i) => i !== emitAt && i !== emitAt + 1) : args;
const treeDir = process.env.DOCS_TREE ? resolve(process.env.DOCS_TREE) : null;
const src = resolve(wwwRoot, process.env.OPENMIXER_SRC || '../openmixer');
const dist = resolve(wwwRoot, positional[0] || '.output/public');
const baseURL = process.env.NUXT_APP_BASE_URL || '/';

/** Where the docs build puts its own hashed assets, so it cannot land on ours. */
const DOCS_ASSETS_DIR = '/_docs_nuxt/';

/** Written into the published tree: provenance, and the marker that says it is published. */
const MANIFEST = '_docs_nuxt/source.json';

/** Written into an emitted tree: where it came from and what it was built for. */
const TREE_META = 'docs-tree.json';

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

if (treeDir && emitTo) die('--emit builds a tree from a checkout; DOCS_TREE already is one');
if (!emitTo && !existsSync(join(dist, 'index.html'))) {
  die(`no generated site at ${dist} — run \`npm run generate\` first; this script adds to it`);
}
if (!emitTo && existsSync(join(dist, MANIFEST))) {
  const previous = JSON.parse(readFileSync(join(dist, MANIFEST), 'utf8'));
  die(
    `${dist} already carries a published docs tree (openmixer ${previous.revision}, ${previous.publishedAt}).\n` +
      '  Publishing over it would compare this build against the last one and call every page a\n' +
      '  collision. Run `npm run generate` for a fresh tree, then this.',
  );
}

// ---------------------------------------------------------------------------
// The allowlist and the sparse copy of the checkout that holds only the public pages
// ---------------------------------------------------------------------------

const ALLOWLIST_FILE = process.env.PUBLIC_DOCS_LIST ? resolve(process.env.PUBLIC_DOCS_LIST) : join(wwwRoot, 'deploy/public-docs.txt');
const stage = join(wwwRoot, '.docs-stage');

/** Parse deploy/public-docs.txt into { pages, dirs, edits }. */
function readAllowlist(file) {
  const pages = [];
  const dirs = [];
  const edits = [];
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((raw, i) => {
      const line = raw.trim();
      if (line === '' || line.startsWith('#')) return;
      const where = `${file}:${i + 1}`;
      const [path, verb] = line.split(/\s+/, 2);
      if (path.startsWith('/') || path.split('/').includes('..')) die(`${where}: ${path} is not a path under docs/`);
      if (/^(design|audits|operations|research|migration|brand|reference)\//.test(path)) {
        die(`${where}: docs/${path} is private material and is never published`);
      }
      if (verb === undefined) {
        if (path.endsWith('/')) dirs.push(path);
        else if (path.endsWith('.md')) pages.push(path);
        else die(`${where}: a page ends in .md, a directory in /`);
        return;
      }
      const args = [...line.slice(line.indexOf(verb) + verb.length).matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
      if (verb === 'drop-section' && args.length === 1) edits.push({ path, verb, heading: args[0], where });
      else if (verb === 'replace' && args.length === 2) edits.push({ path, verb, from: args[0], to: args[1], where });
      else die(`${where}: unknown edit "${line}"`);
    });
  for (const e of edits) if (!pages.includes(e.path)) die(`${e.where}: ${e.path} is edited but not published`);
  return { pages, dirs, edits };
}

/** Apply one edit; returns the new text, or dies when it changes nothing. */
function applyEdit(text, e) {
  let out = text;
  if (e.verb === 'replace') out = text.split(e.from).join(e.to);
  if (e.verb === 'drop-section') {
    const lines = text.split('\n');
    const at = lines.findIndex((l) => l.trim() === `## ${e.heading}`);
    if (at >= 0) {
      let end = lines.findIndex((l, i) => i > at && /^#{1,2}\s/.test(l));
      if (end < 0) end = lines.length;
      out = [...lines.slice(0, at), ...lines.slice(end)].join('\n');
    }
  }
  if (out === text) die(`${e.where}: the edit changed nothing in docs/${e.path}; the source moved, update the list`);
  return out;
}

// ---------------------------------------------------------------------------
// The BUILD half: the docs tree from the openmixer checkout
// ---------------------------------------------------------------------------

const allow = readAllowlist(ALLOWLIST_FILE);
/** What the list says, as one hash: a tree built from another list is not this site's tree. */
const listHash = createHash('sha256')
  .update(JSON.stringify({ pages: [...allow.pages].sort(), dirs: [...allow.dirs].sort(), edits: allow.edits.map(({ where, ...e }) => e) }))
  .digest('hex');

function buildFromCheckout() {
  if (!existsSync(join(src, 'packages/website/nuxt.config.ts')) || !existsSync(join(src, 'docs/manual/index.md'))) {
    die(
      `no openmixer checkout at ${src} — set OPENMIXER_SRC.\n` +
        '  There is deliberately no committed copy to fall back on: the markdown lives in the\n' +
        '  openmixer repo and nowhere else, so a build without the checkout would publish a site\n' +
        '  whose manual silently 404s. Refusing instead.',
    );
  }
  const revision = (() => {
    try {
      return execFileSync('git', ['-C', src, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  })();
  console.log(`[build-docs-tree] openmixer checkout ${src} at ${revision}, base ${baseURL}`);

  for (const page of allow.pages) {
    if (!existsSync(join(src, 'docs', page))) die(`deploy/public-docs.txt names docs/${page}, which the checkout does not have`);
  }

  const git = (args, cwd = stage) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  rmSync(stage, { recursive: true, force: true });
  git(['clone', '--quiet', '--shared', '--no-checkout', src, stage], wwwRoot);
  // Sparse, so the copy is a clean checkout of the same commit: `git describe --dirty`, which
  // stamps the manual's version line, reads it as the revision it is.
  git(['sparse-checkout', 'set', '--no-cone', '/*', '!/docs/', '!/.claude/', '!/CLAUDE.md', ...allow.pages.map((p) => `/docs/${p}`), ...allow.dirs.map((d) => `/docs/${d}`)]);
  git(['checkout', '--quiet', '--detach', git(['rev-parse', 'HEAD'], src).trim()]);

  for (const e of allow.edits) {
    const file = join(stage, 'docs', e.path);
    writeFileSync(file, applyEdit(readFileSync(file, 'utf8'), e));
  }
  // An edited page is still the revision it came from, not a dirty tree.
  if (allow.edits.length > 0) git(['update-index', '--assume-unchanged', ...new Set(allow.edits.map((e) => `docs/${e.path}`))]);

  // Presence-verify the copy: its docs/ markdown is exactly the list, and nothing private is in it.
  const stagedPages = existsSync(join(stage, 'docs'))
    ? readdirSync(join(stage, 'docs'), { recursive: true }).map(String).filter((f) => f.endsWith('.md'))
    : [];
  const extra = stagedPages.filter((p) => !allow.pages.includes(p));
  const absent = allow.pages.filter((p) => !stagedPages.includes(p));
  if (extra.length > 0) die(`the staged copy carries pages the list does not name: ${extra.slice(0, 5).join(', ')}`);
  if (absent.length > 0) die(`the staged copy lacks pages the list names: ${absent.slice(0, 5).join(', ')}`);
  for (const p of ['.claude', 'CLAUDE.md', 'docs/design']) if (existsSync(join(stage, p))) die(`the staged copy still has ${p}`);
  const allPages = git(['ls-tree', '-r', '--name-only', 'HEAD', 'docs/'], src).split('\n').filter((f) => f.endsWith('.md'));
  console.log(`[build-docs-tree] staged ${stagedPages.length} of ${allPages.length} docs pages (deploy/public-docs.txt), ${allow.edits.length} edit(s)`);

  const run = (command, args, env) =>
    execFileSync(command, args, { cwd: stage, stdio: 'inherit', env: { ...process.env, ...env } });

  // `website` sits at stratum S0 and reads `core` (S1) and `catalog` (S2) by a plain relative
  // filesystem path into their BUILT dist, never a package.json dependency — that edge would
  // violate the strata (`2026-08-26-dependency-model.md`), and `docs:check` / `feature-manifest.mjs`
  // say so in their own comments. That means `--filter '@freemixer/website...'` selects `website`
  // ALONE (verified: `pnpm -r --filter '@freemixer/website...' list --depth -1` prints one line) —
  // pnpm's `...` closure follows package.json edges, and there is deliberately none here. So the
  // two packages `pregenerate` actually reaches into (`catalog`, and `core` beneath it) are named
  // explicitly; multiple `--filter` flags UNION (verified empirically), so this installs and builds
  // website + catalog + core + declarations + ratchet — no native package (`pipewire-native`, which
  // needs libpipewire headers the runner does not have) is anywhere in that closure.
  const CLOSURE_FILTERS = ['--filter', '@freemixer/website...', '--filter', '@freemixer/catalog...'];
  run('pnpm', ['install', '--frozen-lockfile', ...CLOSURE_FILTERS]);
  // Build catalog's own closure (core, declarations) so `docs:check`'s `../dist/*.js` reads and
  // `feature-manifest.mjs`'s `../../core/dist/index.js` read land on real files, not a stale or
  // absent dist (`2026-08-04` dist law) — `website` itself has no `build` step of its own to run
  // here; `generate` below is what actually builds it, with the site's own base URL and assets dir.
  run('pnpm', ['-r', '--filter', '@freemixer/catalog...', 'build']);
  run('pnpm', ['--filter', '@freemixer/website', 'generate'], {
    NUXT_APP_BASE_URL: baseURL,
    NUXT_APP_BUILD_ASSETS_DIR: DOCS_ASSETS_DIR,
  });

  const built = join(stage, 'packages/website/.output/public');
  if (!existsSync(join(built, 'docs/manual/index.html'))) {
    die(`the docs build produced no ${built}/docs/manual/index.html — nothing to publish`);
  }

  return { built, revision };
}

// ---------------------------------------------------------------------------
// The PUBLISH half's input: a tree somebody built, taken only if it is this site's
// ---------------------------------------------------------------------------

function readTree(dir) {
  const metaFile = join(dir, TREE_META);
  if (!existsSync(metaFile) || !existsSync(join(dir, 'public'))) {
    die(`${dir} is not a docs tree: it needs ${TREE_META} and public/`);
  }
  const meta = JSON.parse(readFileSync(metaFile, 'utf8'));
  // A tree carries its links, so a tree built for another prefix points past this site.
  if (meta.baseURL !== baseURL) {
    die(`the docs tree (openmixer ${meta.revision}) was built for base ${meta.baseURL}, this site is built for ${baseURL}; build the tree again for ${baseURL}`);
  }
  // The list is the one list: a tree built from another one carries pages it does not name
  // or lacks pages it does.
  if (meta.listHash !== listHash) {
    die(
      `the docs tree (openmixer ${meta.revision}) was built from another deploy/public-docs.txt than this one.\n` +
        '  A change to the list is a new tree: build it again from the checkout (--emit) and pin it in deploy/docs-tree.txt.',
    );
  }
  return { built: join(dir, 'public'), revision: meta.revision };
}

/** Writes the tree for --emit: docs-tree.json and public/, as one tarball. */
function emitTree({ built, revision }) {
  // What leaves the desk is public the moment it is attached to a release.
  try {
    execFileSync('node', [join(here, 'check-public.mjs'), built], { stdio: 'inherit' });
  } catch {
    die('the public guard refused the built docs tree; nothing was written');
  }
  const out = mkdtempSync(join(tmpdir(), 'docs-tree-'));
  try {
    cpSync(built, join(out, 'public'), { recursive: true });
    writeFileSync(
      join(out, TREE_META),
      `${JSON.stringify({ repository: 'FreeMixer/openmixer', revision, baseURL, listHash, pages: allow.pages.length, builtAt: new Date().toISOString() }, null, 2)}\n`,
    );
    mkdirSync(dirname(emitTo), { recursive: true });
    execFileSync('tar', ['-czf', emitTo, '-C', out, TREE_META, 'public']);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
  const sha256 = createHash('sha256').update(readFileSync(emitTo)).digest('hex');
  console.log(`[build-docs-tree] wrote ${emitTo} (${statSync(emitTo).size} bytes, openmixer ${revision}, base ${baseURL}, ${allow.pages.length} pages)`);
  console.log('[build-docs-tree] deploy/docs-tree.txt, after attaching the file to the release named there:');
  console.log(`  release <tag>\n  asset ${emitTo.split('/').pop()}\n  sha256 ${sha256}\n  openmixer ${revision}`);
}

const tree = treeDir ? readTree(treeDir) : buildFromCheckout();
if (emitTo) {
  emitTree(tree);
  process.exit(0);
}
const { built, revision } = tree;
if (!existsSync(join(built, 'docs/manual/index.html'))) {
  die(`the docs tree has no ${built}/docs/manual/index.html — nothing to publish`);
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

// Every listed page has a page on the site, and no doc page is there that the list does not
// name: checked by path, against the destination.
const routeOf = (md) => `docs/${md.replace(/\.md$/, '').replace(/(^|\/)index$/, '')}`.replace(/\/$/, '');
const expected = new Set(allow.pages.filter((p) => p !== 'index.md').map(routeOf));
const unpublished = [...expected].filter((r) => !existsSync(join(dist, r, 'index.html')));
if (unpublished.length > 0) die(`${unpublished.length} listed page(s) are not on the site: ${unpublished.join(', ')}`);
const DOCS_SECTIONS = new Set(allow.pages.filter((p) => p.includes('/')).map((p) => p.split('/')[0]));
const strays = filesUnder(join(dist, 'docs'))
  .filter((f) => f.endsWith('index.html') && DOCS_SECTIONS.has(f.split('/')[0]))
  .map((f) => `docs/${f.replace(/\/?index\.html$/, '')}`)
  .filter((r) => !expected.has(r));
if (strays.length > 0) die(`${strays.length} doc page(s) on the site are not on the list: ${strays.slice(0, 5).join(', ')}`);
const publishedManual = filesUnder(join(dist, 'docs/manual')).filter((f) => f.endsWith('index.html')).length;

const publishedDocs = filesUnder(join(dist, 'docs')).filter((f) => f.endsWith('index.html')).length;

writeFileSync(
  join(dist, MANIFEST),
  `${JSON.stringify(
    {
      repository: 'FreeMixer/openmixer',
      revision,
      from: treeDir ? 'docs tree' : 'checkout',
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
