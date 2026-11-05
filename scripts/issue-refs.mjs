// SPDX-License-Identifier: GPL-3.0-or-later
//
// Issue numbers of the private development tree, by their shape.
//
// typedoc reproduces the doc comments of the private console's source, and those cite the issue
// that asked for a line. `<repo>#<number>` of the private repository points nowhere for a reader of
// the site, so gen-typedoc.mjs strips it (scrubIssueRefs), check-public.mjs refuses a built site
// that still carries one (ISSUE_REFS), and `npm run check:refs` reads the committed public/ tree
// without needing the private list:
//
//   node scripts/issue-refs.mjs check [dir ...]    fail on a reference (default: public)
//   node scripts/issue-refs.mjs redact [dir ...]   strip them from every .html file (default: public/api-docs)
//
// The pattern is built from parts, so this file does not spell the shape it looks for.

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = ['open', 'mixer'].join('');
const ISSUE_REF = new RegExp(`${REPO} ?#\\d+`, 'gi');
// a reference that follows a separator takes the separator with it: "(spec, rev 8; <ref>)" -> "(spec, rev 8)"
const AFTER_SEPARATOR = new RegExp(`\\s*[;,]\\s*${REPO} ?#\\d+`, 'gi');
const WITH_SPACE = new RegExp(`${REPO} ?#\\d+[ \\t]*`, 'gi');

/** In check-public.mjs's shape: [{ name, re }]. */
export const ISSUE_REFS = [{ name: 'private issue reference', re: ISSUE_REF }];

/** `text` without any private issue reference. */
export function scrubIssueRefs(text) {
  return text.replace(AFTER_SEPARATOR, '').replace(WITH_SPACE, '');
}

function filesUnder(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (e.isFile()) out.push(join(e.parentPath ?? e.path, e.name));
  }
  return out;
}

const TEXT = new Set(['.html', '.json', '.js', '.css', '.txt', '.xml', '.md', '.svg', '.mjs', '.map']);

/** Every reference under the directories, as "file:line: excerpt". */
export function findIssueRefs(dirs) {
  const hits = [];
  for (const dir of dirs) {
    for (const f of filesUnder(dir)) {
      if (!TEXT.has(extname(f).toLowerCase())) continue;
      readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
        if (new RegExp(ISSUE_REF.source, 'i').test(line)) hits.push(`${f}:${i + 1}: ${line.trim().slice(0, 120)}`);
      });
    }
  }
  return hits;
}

/** Strip the references from every .html file under dir; returns the number of files changed. */
export function redactDir(dir) {
  let changed = 0;
  for (const f of filesUnder(dir)) {
    if (extname(f) !== '.html') continue;
    const before = readFileSync(f, 'utf8');
    const after = scrubIssueRefs(before);
    if (after !== before) { writeFileSync(f, after); changed++; }
  }
  return changed;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, ...rest] = process.argv.slice(2);
  const wwwRoot = resolve(fileURLToPath(import.meta.url), '..', '..');
  if (mode === 'check') {
    const dirs = (rest.length ? rest : ['public']).map((d) => resolve(wwwRoot, d));
    for (const d of dirs) {
      if (!existsSync(d) || !statSync(d).isDirectory()) { console.error(`[issue-refs] no directory ${d}: nothing was checked`); process.exit(2); }
    }
    const hits = findIssueRefs(dirs);
    if (hits.length) { console.error(hits.join('\n')); console.error(`[issue-refs] ${hits.length} reference(s) to a private issue`); process.exit(1); }
    console.log('[issue-refs] no reference to a private issue');
  } else if (mode === 'redact') {
    const dirs = (rest.length ? rest : ['public/api-docs']).map((d) => resolve(wwwRoot, d));
    for (const d of dirs) console.log(`[issue-refs] ${d}: ${redactDir(d)} file(s) changed`);
  } else {
    console.error('usage: issue-refs.mjs check|redact [dir ...]');
    process.exit(2);
  }
}
