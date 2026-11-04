#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// No date in the text of the site. A page, guide, note or message says which versions a figure
// was read with, never the day: the date belongs to the technical data footer under the figures.
//
// Read: the title, summary and body of every technical note (content/technical-notes/*.md), every
// message of i18n/locales/**/*.json, and the <template> of every page and component under app/.
// Not read, because they are data and the pages render them as a footer: a note's front-matter
// `measured:` field, and any i18n key named `footer`. content/projects/ is copied from the
// projects' own repositories by `gen-pages.mjs --sync`, so it is not edited here and not read.
//
// A date is: a month name (English or Catalan), a year 2020 to 2039, or an ISO date.
//
// Usage: node scripts/check-no-dates.mjs [root]     Exit 0 clean, 1 on any finding.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseSfc } from '@vue/compiler-sfc';

const EN = 'January|February|March|April|June|July|August|September|October|November|December';
const CA = 'gener|febrer|març|abril|maig|juny|juliol|agost|setembre|octubre|novembre|desembre';
export const PATTERNS = [
  { name: 'month', re: new RegExp(`\\b(?:${EN})\\b|\\b(?:\\d{1,2}\\s+)?May\\s+\\d|\\d\\s+May\\b|\\b(?:${CA})\\b`, 'giu') },
  { name: 'year', re: /\b20[23]\d\b/g },
  { name: 'iso date', re: /\b\d{4}-\d{2}-\d{2}\b/g },
];

/** The dates in one piece of text: [{ name, text }]. */
export function datesIn(text) {
  const hits = [];
  for (const { name, re } of PATTERNS) for (const m of text.matchAll(re)) hits.push({ name, text: m[0] });
  return hits;
}

const stripCode = (md) => md.replace(/^(```|~~~)[\s\S]*?^\1/gm, '');

/** A technical note's title, summary and body; the `measured:` line is the footer's data. */
export function noteText(text) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  if (!m) return text;
  const keep = m[1].split('\n').filter((l) => /^(title|summary):/.test(l)).join('\n');
  return `${keep}\n${stripCode(m[2])}`;
}

/** Every [key path, string] of a message tree, skipping keys named `footer`. */
export function* messages(node, path = '') {
  if (typeof node === 'string') yield [path, node];
  else if (Array.isArray(node)) for (const [i, v] of node.entries()) yield* messages(v, `${path}.${i}`);
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) if (k !== 'footer') yield* messages(v, path ? `${path}.${k}` : k);
}

/** The visible template of a Vue file, comments left out. */
export function templateText(src) {
  const { descriptor } = parseSfc(src);
  return (descriptor.template?.content ?? '').replace(/<!--[\s\S]*?-->/g, '');
}

function* walk(dir, ext) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir).sort()) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* walk(p, ext);
    else if (f.endsWith(ext)) yield p;
  }
}

/** All findings under `root`, as 'file: kind "text"' lines. */
export function check(root) {
  const out = [];
  const scan = (file, where, text) => {
    for (const h of datesIn(text)) out.push(`${relative(root, file)}${where}: ${h.name} "${h.text}"`);
  };
  for (const f of walk(join(root, 'content/technical-notes'), '.md')) scan(f, '', noteText(readFileSync(f, 'utf8')));
  for (const f of walk(join(root, 'i18n/locales'), '.json')) {
    for (const [k, v] of messages(JSON.parse(readFileSync(f, 'utf8')))) scan(f, ` (${k})`, v);
  }
  for (const f of walk(join(root, 'app'), '.vue')) scan(f, ' (template)', templateText(readFileSync(f, 'utf8')));
  return out;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(process.argv[2] ?? resolve(dirname(fileURLToPath(import.meta.url)), '..'));
  const findings = check(root);
  for (const f of findings) console.error(f);
  if (findings.length) {
    console.error(`\n${findings.length} date(s) in the text. Name the versions instead; the date goes in the footer data (note \`measured:\`, an i18n \`footer\` key, a run).`);
    process.exit(1);
  }
  console.log('no dates in the text');
}
