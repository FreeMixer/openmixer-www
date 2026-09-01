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
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const wwwRoot = resolve(here, '..');
const src = resolve(wwwRoot, process.env.OPENMIXER_SRC || '../openmixer');
const outDir = resolve(wwwRoot, 'public/api-docs');
const jsonOut = resolve(wwwRoot, '.docgen-tmp/typedoc-model.json');
const bin = resolve(src, 'node_modules/.bin/typedoc');

if (!existsSync(bin)) {
  console.error(`[gen-typedoc] no typedoc binary at ${bin} — run "pnpm install" in ${src} first`);
  process.exit(1);
}
if (!existsSync(resolve(src, 'typedoc.json'))) {
  console.error(`[gen-typedoc] no typedoc.json at ${src}`);
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
