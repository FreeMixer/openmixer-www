#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Fails when the built site contains anything that belongs to the private development
// tree: a home directory, the agent notes, internal host names, private addresses.
//
// It reads the OUTPUT, every text file under the published tree (HTML, JS bundles,
// payloads, JSON), because that is what a visitor can fetch. The docs bundle that leaked
// on 2026-10-01 rendered only a few pages but shipped every markdown file of the source
// tree inside one JS chunk; a check on rendered pages alone would have passed it.
//
// Usage: node scripts/check-public.mjs [dir]   (default .output/public)
// Exit 0 clean, 1 on any hit, 2 when there is nothing to check.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** What must never be published. Each entry: a name for the report and a pattern. */
export const FORBIDDEN = [
  { name: 'home directory', re: /\/home\/pau\b/ },
  { name: 'CLAUDE.md', re: /CLAUDE\.md/ },
  { name: '.claude/ directory', re: /\.claude\// },
  { name: 'internal domain 0cs.lan', re: /0cs\.lan/i },
  { name: 'tecman', re: /tecman/i },
  { name: 'desk host name msi', re: /(?<![A-Za-z0-9_])msi(?![A-Za-z0-9_])/ },
  { name: 'private address 192.168.x.x', re: /(?<![\d.])192\.168\.\d{1,3}\.\d{1,3}(?![\d.])/ },
  { name: 'private address 10.x.x.x', re: /(?<![\d.])10\.\d{1,3}\.\d{1,3}\.\d{1,3}(?![\d.])/ },
  { name: 'claude', re: /claude/i },
  { name: 'anthropic', re: /anthropic/i },
];

/** Files read as text. Images and fonts are skipped; an unknown extension is read too. */
const BINARY = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.pdf', '.gz', '.br', '.zip']);

/** Every hit in one text, as { name, line, excerpt }. */
export function scanText(text) {
  const hits = [];
  const lines = text.split('\n');
  for (const { name, re } of FORBIDDEN) {
    const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    for (let i = 0; i < lines.length; i++) {
      for (const m of lines[i].matchAll(global)) {
        const from = Math.max(0, m.index - 40);
        hits.push({ name, line: i + 1, excerpt: lines[i].slice(from, m.index + m[0].length + 40) });
      }
    }
  }
  return hits;
}

/** Every file under dir, relative to it. */
function filesUnder(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile()) out.push(relative(dir, join(entry.parentPath ?? entry.path, entry.name)));
  }
  return out;
}

/** Scan a directory; returns { files, hits: [{ file, name, line, excerpt }] }. */
export function scanDir(dir) {
  const files = filesUnder(dir).filter((f) => !BINARY.has(extname(f).toLowerCase()));
  const hits = [];
  for (const file of files) {
    for (const hit of scanText(readFileSync(join(dir, file), 'utf8'))) hits.push({ file, ...hit });
  }
  return { files: files.length, hits };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = resolve(process.argv[2] || '.output/public');
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    console.error(`[check-public] no built site at ${dir}: nothing was checked`);
    process.exit(2);
  }
  const { files, hits } = scanDir(dir);
  if (files === 0) {
    console.error(`[check-public] ${dir} holds no text files: nothing was checked`);
    process.exit(2);
  }
  if (hits.length > 0) {
    const byFile = new Map();
    for (const h of hits) byFile.set(h.file, [...(byFile.get(h.file) ?? []), h]);
    for (const [file, list] of byFile) {
      console.error(`  ${file}: ${list.length} hit(s)`);
      for (const h of list.slice(0, 5)) console.error(`    ${h.line}: [${h.name}] ${h.excerpt.trim()}`);
    }
    const counts = {};
    for (const h of hits) counts[h.name] = (counts[h.name] ?? 0) + 1;
    console.error(`[check-public] FAIL: ${hits.length} hit(s) in ${byFile.size} of ${files} files`);
    for (const [name, n] of Object.entries(counts)) console.error(`    ${name}: ${n}`);
    process.exit(1);
  }
  console.log(`[check-public] clean: ${files} text files under ${dir}`);
}
