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
// and the private list (PUBLIC_GUARD_LIST, see private-list.mjs) for the redactions,
// and deploy/public-mcp.txt (MCP_PUBLIC_LIST in tests), the tools and variables the page
// publishes: a row that file does not name stays out of the output.
// Output (consumed by app/pages/docs/mcp.vue):
//   app/data/mcp-tools.json

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPrivateList } from './private-list.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const wwwRoot = resolve(here, '..');
const src = resolve(wwwRoot, process.env.OPENMIXER_SRC || '../openmixer');
const OUT = resolve(wwwRoot, process.env.MCP_TOOLS_OUT || 'app/data/mcp-tools.json'); // tests point it elsewhere
const readmePath = resolve(src, 'packages/mcp-server/README.md');
const PUBLIC_LIST = resolve(wwwRoot, process.env.MCP_PUBLIC_LIST || 'deploy/public-mcp.txt');

/** Parse deploy/public-mcp.txt into { tools, env }, two sets of names. */
function readPublicList(file) {
  const tools = new Set();
  const env = new Set();
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((raw, i) => {
      const line = raw.trim();
      if (line === '' || line.startsWith('#')) return;
      const [kind, name, extra] = line.split(/\s+/);
      if (!name || extra !== undefined || (kind !== 'tool' && kind !== 'env')) {
        throw new Error(`${file}:${i + 1}: a line is "tool <name>" or "env <NAME>", got "${line}"`);
      }
      (kind === 'tool' ? tools : env).add(name);
    });
  return { tools, env };
}

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

// Read only once there is a checkout to generate from: the Pages runner keeps the snapshot above
// and never needs it. Here, a missing list is a refusal, never an unredacted table.
let privateList;
try {
  privateList = loadPrivateList();
} catch (e) {
  console.error(`[gen-mcp-tools] ${e.message} — refusing to generate a table that cannot be redacted`);
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
  let out = text
    .replace(/docs\/design\/specs and docs\/design\/notes/g, 'the design specs and the working notes')
    .replace(/docs\/design\/[A-Za-z0-9_./*-]+/g, 'an internal design record')
    .replace(/docs\/design\b/g, 'the internal design records')
    .replace(/~\/Devel[A-Za-z0-9_./-]*/g, 'an internal checkout');
  // The tooling directory and the working-notes file are private names: their redactions
  // are in the private list, applied in its order. The site describes what those files
  // hold, not what they are called.
  for (const r of privateList.redactions) out = out.replace(r.re, r.with);
  return out;
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
    // The `meaning` column is prose about what the variable does, same source as the
    // tools table's `answers` column and the same leak risk (OPENMIXER_MEMORY_DIR's row
    // names a path under the private tooling directory) — same redaction, not a special case.
    env.push({ name: plain(cells[0]), meaning: redactInternalPaths(plain(cells[1])), default: fallback });
  }
}

// Only what deploy/public-mcp.txt names is published. A name the list keeps and the README no
// longer has is a list that has drifted from the registry: refused, like an edit that changes
// nothing in deploy/public-docs.txt.
let publicList;
try {
  publicList = readPublicList(PUBLIC_LIST);
} catch (e) {
  console.error(`[gen-mcp-tools] ${e.message} — refusing to publish a table without the list of what is public`);
  process.exit(1);
}
const gone = [
  ...[...publicList.tools].filter((n) => !rows.some((r) => r.name === n)).map((n) => `tool ${n}`),
  ...[...publicList.env].filter((n) => !env.some((v) => v.name === n)).map((n) => `env ${n}`),
];
if (gone.length > 0) {
  console.error(`[gen-mcp-tools] ${relative(wwwRoot, PUBLIC_LIST)} names rows the README does not have: ${gone.join(', ')}`);
  process.exit(1);
}
const heldTools = rows.filter((r) => !publicList.tools.has(r.name)).map((r) => r.name);
const heldEnv = env.filter((v) => !publicList.env.has(v.name)).map((v) => v.name);
rows.splice(0, rows.length, ...rows.filter((r) => publicList.tools.has(r.name)));
env.splice(0, env.length, ...env.filter((v) => publicList.env.has(v.name)));
if (rows.length === 0) {
  console.error(`[gen-mcp-tools] ${relative(wwwRoot, PUBLIC_LIST)} lets no tool through — nothing to publish`);
  process.exit(1);
}
console.log(`[gen-mcp-tools] kept off the page (not in ${relative(wwwRoot, PUBLIC_LIST)}): ${heldTools.length} tools, ${heldEnv.length} variables`);

// A redaction nobody checks is decoration: refuse to write a file that still
// carries what the rule above exists to keep off the site.
const leaks = [...rows, ...env]
  .flatMap((r) => Object.values(r))
  .filter((v) => typeof v === 'string' && (/docs\/design|~\/Devel/.test(v) || privateList.survivors.some((re) => re.test(v))));
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
console.log(`[gen-mcp-tools] ${rows.length} tools in ${families.length} families (${families.join(', ')}), ${env.length} environment variables → ${relative(wwwRoot, OUT)}`);
