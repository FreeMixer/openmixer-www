#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Builds the abstractions catalog page's data from two inputs:
//   - GENERATED: the typedoc JSON model (.docgen-tmp/typedoc-model.json, produced by
//     gen-typedoc.mjs) — every exported class/interface/type/function in
//     @openmixer/core + @openmixer/server's public surface, one line each from its
//     TSDoc first sentence.
//   - CURATED: app/data/abstractions-curated.json, hand-distilled from an in-tree
//     audit for packages/web-ui (Vue) and packages/pipewire-native (C), which
//     typedoc cannot read.
//
// Also prints the docstring-gap findings to stdout: exported symbols in the
// generated half with no TSDoc comment at all. That list is a report for the
// operator, not published content — this script never writes it to a file.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const wwwRoot = resolve(here, '..');
const src = resolve(wwwRoot, process.env.OPENMIXER_SRC || '../openmixer');
const modelPath = resolve(wwwRoot, '.docgen-tmp/typedoc-model.json');
const curatedPath = resolve(wwwRoot, 'app/data/abstractions-curated.json');
const outPath = resolve(wwwRoot, 'app/data/abstractions.json');

const KIND_NAME = { 128: 'Class', 256: 'Interface', 2097152: 'Type', 64: 'Function', 8: 'Enum' };
const CATALOG_KINDS = new Set([128, 256, 2097152, 64, 8]);

// Source TSDoc comments cite their governing spec by path (house convention: the
// design gate reads `docs/design/specs/…` back out of the code). That citation is
// exactly the internal-notes content the publish ruling excludes — never link or
// reproduce docs/design/*, plans, ledgers or findings files. Strip a citation's path
// down to a neutral phrase rather than the summary's whole clause, so the sentence
// a reader sees still parses.
function redactInternalRefs(text) {
  return text
    .replace(/`docs\/design\/[^`]*`/g, '`an internal spec`')
    .replace(/`~\/Devel\/[^`]*`/g, '`an internal checkout`')
    .replace(/(?<!`)docs\/design\/\S+/g, 'an internal spec')
    .replace(/(?<!`)~\/Devel\/\S+/g, 'an internal checkout');
}

function firstSentence(comment) {
  if (!comment || !comment.summary) return '';
  const text = comment.summary
    .map((p) => p.text || '')
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  const m = /^(.*?[.!?])(\s|$)/.exec(text);
  const sentence = redactInternalRefs(m ? m[1] : text);
  return sentence.length > 220 ? sentence.slice(0, 217) + '…' : sentence;
}
function commentOf(node) {
  if (node.comment) return node.comment;
  if (node.signatures && node.signatures[0] && node.signatures[0].comment) return node.signatures[0].comment;
  return null;
}

function crawl(model) {
  const generated = [];
  const gaps = [];
  function walk(node, pkg) {
    const nextPkg = node.kind === 2 && pkg === null ? node.name : pkg;
    if (CATALOG_KINDS.has(node.kind)) {
      const comment = commentOf(node);
      const summary = firstSentence(comment);
      const file = node.sources && node.sources[0] ? `${node.sources[0].fileName}:${node.sources[0].line}` : '';
      const entry = { kind: KIND_NAME[node.kind], name: node.name, package: nextPkg || pkg, file, summary };
      generated.push(entry);
      if (!summary) {
        gaps.push({ ...entry, size: (node.children || []).length });
      }
    }
    for (const child of node.children || []) walk(child, nextPkg);
  }
  walk(model, null);
  return { generated, gaps };
}

function main() {
  // gen-typedoc.mjs itself falls back to its committed HTML snapshot when there is
  // no sibling openmixer checkout (the Pages runner never has one) — and in that
  // case it never writes a fresh typedoc-model.json. Fall back the same way here:
  // keep the committed app/data/abstractions.json rather than fail the build.
  // The absence to test is the CHECKOUT, not the model file. A machine that has run
  // this pipeline before still has a typedoc-model.json in .docgen-tmp/ from whatever
  // tree it last read, and gen-typedoc leaves it exactly as it found it when it falls
  // back — so testing the model alone would rebuild this page off a stale model while
  // the HTML beside it stayed on the committed snapshot, and the two would disagree.
  const haveCheckout = existsSync(resolve(src, 'typedoc.json'));
  if (!haveCheckout || !existsSync(modelPath)) {
    const why = haveCheckout ? `no typedoc model at ${modelPath}` : `no checkout at ${src}`;
    if (existsSync(outPath)) {
      console.log(`[gen-abstractions] ${why} — keeping the committed app/data/abstractions.json`);
      process.exit(0);
    }
    console.error(`[gen-abstractions] ${why} and no committed abstractions.json to fall back to`);
    process.exit(1);
  }
  const model = JSON.parse(readFileSync(modelPath, 'utf8'));
  const curated = JSON.parse(readFileSync(curatedPath, 'utf8'));
  const { generated, gaps } = crawl(model);

  const byKind = new Map();
  for (const e of generated) {
    if (!byKind.has(e.kind)) byKind.set(e.kind, []);
    byKind.get(e.kind).push(e);
  }
  for (const list of byKind.values()) list.sort((a, b) => a.package.localeCompare(b.package) || a.name.localeCompare(b.name));

  const generatedGroups = [...byKind.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([kind, items]) => ({ label: kind + 's', items }));

  const out = {
    meta: {
      generatedAt: new Date().toISOString(),
      generatedCount: generated.length,
      documentedCount: generated.length - gaps.length,
    },
    curated: curated.groups,
    generated: generatedGroups,
  };
  writeFileSync(outPath, JSON.stringify(out, null, 2));

  const KIND_RANK = { Class: 0, Interface: 1, Function: 2, Type: 3, Enum: 4 };
  const top20 = gaps
    .sort((a, b) => (KIND_RANK[a.kind] - KIND_RANK[b.kind]) || b.size - a.size || a.name.localeCompare(b.name))
    .slice(0, 20);

  console.log(`[gen-abstractions] ${generated.length} generated symbols (${out.meta.documentedCount} documented, ${gaps.length} with no TSDoc summary)`);
  console.log(`[gen-abstractions] curated groups: ${curated.groups.map((g) => `${g.label} (${g.items.length})`).join(', ')}`);
  console.log(`[gen-abstractions] --- docstring-gap top ${top20.length} (report only, not published) ---`);
  for (const g of top20) {
    console.log(`  ${g.kind.padEnd(10)} ${g.name.padEnd(32)} ${g.file}`);
  }
}

main();
