#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Builds the MCP server's tool table for /docs/mcp from the checkout's own
// generated source. packages/mcp-server/README.md carries the table between
// `<!-- tools:begin -->` and `<!-- tools:end -->`; that block is produced by the
// package's `readme:tools` script from the registered tool table, and its own
// readme.test.ts refuses a README that differs from the registry. Parsing that
// block keeps the site one hop from the registry rather than a retyped copy.
//
// Input  (from OPENMIXER_SRC, default ../openmixer):
//   packages/mcp-server/README.md
// Output (consumed by app/pages/docs/mcp.vue):
//   app/data/mcp-tools.json

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const wwwRoot = resolve(here, '..');
const src = resolve(wwwRoot, process.env.OPENMIXER_SRC || '../openmixer');
const OUT = resolve(wwwRoot, 'app/data/mcp-tools.json');
const readmePath = resolve(src, 'packages/mcp-server/README.md');

// Same rule as the other generators: the Pages runner has no openmixer checkout,
// so the output IS committed and a missing checkout publishes the snapshot.
if (!existsSync(readmePath)) {
  if (existsSync(OUT)) {
    console.log(`[gen-mcp-tools] no checkout at ${src} — keeping the committed snapshot`);
    process.exit(0);
  }
  console.error(`[gen-mcp-tools] no checkout at ${src} and no committed snapshot to fall back to`);
  process.exit(1);
}

const readme = readFileSync(readmePath, 'utf8');
const block = /<!--\s*tools:begin\s*-->([\s\S]*?)<!--\s*tools:end\s*-->/.exec(readme);
if (!block) {
  console.error('[gen-mcp-tools] the README carries no tools:begin/tools:end block — the generator that writes it has moved');
  process.exit(1);
}

/** Strip the markdown a table cell uses for emphasis and code, leaving plain text. */
function plain(cell) {
  return cell.replace(/`/g, '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
}

// The same publishing rule gen-typedoc enforces over the API tree: design records
// and an operator's checkout path are internal, so a citation of one is named for
// what it is rather than published as a path a reader cannot open.
function redactInternalPaths(text) {
  return text
    .replace(/docs\/design\/specs and docs\/design\/notes/g, 'the design specs and the working notes')
    .replace(/docs\/design\/[A-Za-z0-9_./*-]+/g, 'an internal design record')
    .replace(/docs\/design\b/g, 'the internal design records')
    .replace(/~\/Devel[A-Za-z0-9_./-]*/g, 'an internal checkout')
    // The tooling directory and the working-notes file are named for the editor
    // that reads them. The site describes what they hold, not what they are called.
    .replace(/\.claude\/spec-map\.txt/g, 'the design gate’s spec map')
    .replace(/the tree's local CLAUDE\.md/g, 'the tree’s own working notes')
    .replace(/\.claude\/[A-Za-z0-9_./*-]+/g, 'the tree’s discipline documents');
}

const rows = [];
for (const line of block[1].split('\n')) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) continue;
  const cells = trimmed.slice(1, -1).split('|').map((c) => c.trim());
  if (cells.length !== 5) continue;
  if (/^-+$/.test(cells[0].replace(/[:\s]/g, ''))) continue; // the ---|--- rule
  if (plain(cells[0]) === 'tool') continue; // the header
  const args = plain(cells[2]);
  rows.push({
    name: plain(cells[0]),
    family: plain(cells[1]),
    args: args === '—' || args === '' ? [] : args.split(',').map((a) => plain(a)),
    writes: cells[3].includes('**'),
    effect: plain(cells[3]),
    answers: redactInternalPaths(plain(cells[4])),
  });
}

if (rows.length === 0) {
  console.error('[gen-mcp-tools] the tools block parsed to zero rows — the table shape has changed');
  process.exit(1);
}

// Environment variables come from the README's own table, one row per variable.
const env = [];
const envSection = /##\s*Running it([\s\S]*?)\n##\s/.exec(readme);
if (envSection) {
  for (const line of envSection[1].split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    const cells = trimmed.slice(1, -1).split('|').map((c) => c.trim());
    if (cells.length !== 3) continue;
    if (/^-+$/.test(cells[0].replace(/[:\s]/g, ''))) continue;
    if (plain(cells[0]) === 'variable') continue;
    // A default pointing at a host on someone's private network is a fact about
    // that network, not about the software. The site names the variable and what
    // it is for; the address to put in it is the reader's own.
    const fallback = plain(cells[2]).replace(
      /https?:\/\/[^\s)]*\.(?:lan|local|internal)(?:[:/][^\s)]*)?/g,
      'a site-local address',
    );
    env.push({ name: plain(cells[0]), meaning: plain(cells[1]), default: fallback });
  }
}

// A redaction nobody checks is decoration: refuse to write a file that still
// carries what the rule above exists to keep off the site.
const leaks = [...rows, ...env]
  .flatMap((r) => Object.values(r))
  .filter((v) => typeof v === 'string' && /docs\/design|~\/Devel|\.claude|CLAUDE\.md/.test(v));
if (leaks.length > 0) {
  console.error(`[gen-mcp-tools] ${leaks.length} internal-path citation(s) survived redaction — fix redactInternalPaths before publishing`);
  for (const leak of leaks) console.error(`  ${leak}`);
  process.exit(1);
}

const families = [...new Set(rows.map((r) => r.family))];
writeFileSync(
  OUT,
  `${JSON.stringify({ meta: { generatedAt: new Date().toISOString(), toolCount: rows.length }, tools: rows, env }, null, 2)}\n`,
);
console.log(`[gen-mcp-tools] ${rows.length} tools in ${families.length} families (${families.join(', ')}), ${env.length} environment variables → app/data/mcp-tools.json`);
