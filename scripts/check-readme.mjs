#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Fails when the README carries a build command. The README sells the packages and says
// how to install them; how to build from source lives in BUILDING.md, which the README
// links. A build step that drifts back onto the README is the thing this catches.
//
// It reads only the README's CODE: fenced blocks and inline `spans`. Prose may say "make"
// or "build", and an install line (dnf install, apt install) is not a build command.
//
// Usage: node scripts/check-readme.mjs [file]   (default README.md)
// Exit 0 clean, 1 on any hit, 2 when the file is missing.

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Build commands, as they would start a command (line start, sudo, &&, ;, |). */
const AT = String.raw`(?:^|[;&|]\s*|sudo\s+|\$\s+)`;
export const BUILD = [
  { name: 'npm', re: new RegExp(`${AT}(?:npm|pnpm|yarn)\\s+(?:install|i|ci|build|generate|dev|run\\s+\\S+)(?![\\w-])`) },
  { name: 'nuxt', re: new RegExp(`${AT}(?:npx\\s+)?nuxi?\\s+(?:generate|build|dev|preview)\\b`) },
  { name: 'make', re: new RegExp(`${AT}make(?:\\s|$)`) },
  { name: 'meson', re: new RegExp(`${AT}meson(?:\\s|$)`) },
  { name: 'cmake', re: new RegExp(`${AT}cmake(?:\\s|$)`) },
  { name: 'ninja', re: new RegExp(`${AT}ninja(?:\\s|$)`) },
  { name: 'rpmbuild', re: new RegExp(`${AT}rpmbuild(?:\\s|$)`) },
];

/** The code of a markdown text, as { line, code }: fenced-block lines and inline spans. */
export function codeOf(text) {
  const out = [];
  let fence = null;
  text.split('\n').forEach((raw, i) => {
    const m = raw.match(/^\s*(`{3,}|~{3,})/);
    if (m) {
      if (fence === null) fence = m[1];
      else if (m[1][0] === fence[0] && m[1].length >= fence.length) fence = null;
      return;
    }
    if (fence !== null) out.push({ line: i + 1, code: raw.trim() });
    else for (const s of raw.matchAll(/(`+)([^`]+?)\1/g)) out.push({ line: i + 1, code: s[2].trim() });
  });
  return out;
}

/** Every build command in one markdown text, as { name, line, code }. */
export function scanText(text) {
  const hits = [];
  for (const { line, code } of codeOf(text)) {
    for (const { name, re } of BUILD) if (re.test(code)) hits.push({ name, line, code });
  }
  return hits;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = resolve(process.argv[2] ?? 'README.md');
  if (!existsSync(file)) {
    console.error(`[check-readme] no ${file}`);
    process.exit(2);
  }
  const hits = scanText(readFileSync(file, 'utf8'));
  if (hits.length === 0) {
    console.log(`[check-readme] clean: no build command in ${file}`);
    process.exit(0);
  }
  for (const h of hits) console.error(`[check-readme] ${file}:${h.line}: ${h.name}: ${h.code}`);
  console.error(`[check-readme] ${hits.length} build command(s) on the README; they belong in BUILDING.md`);
  process.exit(1);
}
