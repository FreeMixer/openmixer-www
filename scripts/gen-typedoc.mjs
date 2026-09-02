#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Runs typedoc against an openmixer checkout's public surface (@openmixer/core +
// @openmixer/server, per the docs generation law: API references are generated from
// TSDoc, never hand-written) and produces two things from the one pass:
//   - a static HTML tree at public/api-docs/, copied verbatim by `nuxt generate`
//   - a JSON reflection model at .docgen-tmp/typedoc-model.json, the source
//     gen-abstractions.mjs reads to build the catalogue page and this script's own
//     docstring-gap report.
//
// Runs typedoc's own CLI (via its checkout's node_modules) rather than importing the
// package, because typedoc, ts-morph and the full TS project graph live in the
// SOURCE checkout, not in this site.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const wwwRoot = resolve(here, '..');
const src = resolve(wwwRoot, process.env.OPENMIXER_SRC || '../openmixer');
const outDir = resolve(wwwRoot, 'public/api-docs');
const jsonOut = resolve(wwwRoot, '.docgen-tmp/typedoc-model.json');
const bin = resolve(src, 'node_modules/.bin/typedoc');

// The GitHub Pages runner has no sibling openmixer checkout (private, no
// credential carried by this workflow). Regeneration is an operator step done
// locally where the checkout lives, and its output IS committed so CI has
// something to build from — a missing checkout keeps the committed
// public/api-docs/ tree as-is; only a missing checkout AND no snapshot fails.
if (!existsSync(bin) || !existsSync(resolve(src, 'typedoc.json'))) {
  if (existsSync(outDir) && readdirSync(outDir).length > 0) {
    console.log(`[gen-typedoc] no checkout at ${src} — keeping the committed public/api-docs/ snapshot`);
    process.exit(0);
  }
  console.error(`[gen-typedoc] no checkout at ${src} and no committed public/api-docs/ snapshot to fall back to`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
mkdirSync(dirname(jsonOut), { recursive: true });

// The root typedoc.json lists 14 packages; this generation pass is scoped to the
// two named in the docs brief (core + server's public surface), so entryPoints is
// overridden on the CLI rather than widened at the source.
const args = [
  '--options', 'typedoc.json',
  '--entryPoints', 'packages/core',
  '--entryPoints', 'packages/server',
  '--out', outDir,
  '--json', jsonOut,
];

console.log(`[gen-typedoc] checkout: ${src}`);
execFileSync(bin, args, { cwd: src, stdio: 'inherit' });
console.log(`[gen-typedoc] html → ${outDir}`);
console.log(`[gen-typedoc] json → ${jsonOut}`);

// Source TSDoc comments cite their governing spec by path (house convention: the
// design gate reads `docs/design/specs/…` back out of the code, and TSDoc carries
// the same citations). typedoc reproduces the comment verbatim, so left alone this
// pass ships internal spec paths and the operator's own checkout paths straight
// into the published HTML — exactly the content the publish ruling excludes
// (never link or reproduce docs/design/*, plans, ledgers or findings files).
// typedoc renders such a citation inside a plain `<code>…</code>` span (never
// inside the `tsd-signature-type` span it uses for an actual literal value, so a
// real string constant like JOB_LEDGER_PATH's value is left untouched); redact the
// span's content rather than the surrounding sentence, so the prose still parses.
function redactCodeSpans(html) {
  return html
    .replace(/<code>[^<]*docs\/design[^<]*<\/code>/g, '<code>an internal spec</code>')
    .replace(/<code>[^<]*~\/Devel[^<]*<\/code>/g, '<code>an internal checkout</code>');
}

function walkHtml(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walkHtml(full);
    } else if (name.endsWith('.html')) {
      const original = readFileSync(full, 'utf8');
      const redacted = redactCodeSpans(original);
      if (redacted !== original) writeFileSync(full, redacted);
    }
  }
}

// JOB_LEDGER_PATH's page carries `docs/design/job-proofs.md` twice, both inside
// `tsd-signature-type` — the constant's actual, real, publicly-relevant VALUE, not
// a prose citation of an internal document. Redacting a literal value would falsify
// the reference rather than protect anything, so this one page is a reviewed,
// named exception to the gate below, not a silent hole in it.
const KNOWN_LITERAL_VALUE_EXCEPTION = 'variables/_openmixer_core..JOB_LEDGER_PATH.html';

function grepFileCount() {
  try {
    return execFileSync('grep', ['-rlI', '-e', 'docs/design', '-e', '~/Devel', outDir], { encoding: 'utf8' })
      .trim().split('\n').filter(Boolean)
      .filter((f) => !f.endsWith(KNOWN_LITERAL_VALUE_EXCEPTION))
      .length;
  } catch {
    return 0; // grep exits 1 when nothing matches
  }
}

const before = grepFileCount();
walkHtml(outDir);
const afterCount = grepFileCount();
console.log(`[gen-typedoc] redacted internal-path citations in ${before} file(s); ${afterCount} remain`);
if (afterCount > 0) {
  console.error('[gen-typedoc] internal-path citations survived redaction — fix redactCodeSpans before publishing');
  process.exit(1);
}
