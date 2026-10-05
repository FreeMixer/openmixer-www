#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// The site's translations, checked like .po files: a page is translated or the build is red.
//
//  1. Every message file of English (i18n/locales/en/*.json) has a Catalan twin with exactly
//     the same keys, and no value in either is empty. A key missing in ca is never quietly
//     the English fallback.
//  2. Every message compiles (vue-i18n syntax: a stray `{`, `}`, `@` or `|` breaks a page at
//     runtime, not at build time).
//  3. A Catalan value identical to its English one, four words or longer, is an untranslated
//     string, unless its key is listed in i18n/same-as-english.txt.
//  4. Catalan style: no comma before "i" or "o", and none of the translations the glossary
//     (i18n/glossary.json) refuses.
//  5. No visible English left in a template: every text node and every visible attribute
//     (title, lede, eyebrow, label, alt, aria-label, ...) of two words or more, under app/,
//     must come from a message. An element marked `data-i18n-skip` (a command, a code
//     sample) is not read, nor is anything inside <code>, <pre> or <kbd>.
//
// Usage: node scripts/check-i18n.mjs     Exit 0 clean, 1 on any finding.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { baseCompile } from '@intlify/message-compiler';
import { parse as parseSfc } from '@vue/compiler-sfc';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = join(root, 'i18n/locales');
const SOURCE = 'en';
const TARGETS = ['ca'];

const findings = [];
const report = (where, what) => findings.push(`${where}: ${what}`);

/** Flatten a message tree to { 'a.b.c': 'text' }. Arrays index as a.0, a.1. */
function flatten(node, prefix = '', out = {}) {
  if (typeof node === 'string') out[prefix] = node;
  else if (Array.isArray(node)) node.forEach((v, i) => flatten(v, prefix ? `${prefix}.${i}` : String(i), out));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  else out[prefix] = node;
  return out;
}

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (e) {
    report(relative(root, file), `not valid JSON: ${e.message}`);
    return {};
  }
};

const jsonFiles = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : []);

// --- 1-4: the message files -------------------------------------------------------------

const sameOk = new Set(
  existsSync(join(root, 'i18n/same-as-english.txt'))
    ? readFileSync(join(root, 'i18n/same-as-english.txt'), 'utf8')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'))
    : [],
);
const glossary = JSON.parse(readFileSync(join(root, 'i18n/glossary.json'), 'utf8'));
const refused = [...glossary.keep, ...glossary.use].flatMap((g) => g.refuse.map((form) => ({ form, rule: g.term ?? `${g.en} -> ${g.ca}` })));

/** Text with markup and placeholders taken out, for the style checks. */
const prose = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\{[^}]*\}/g, ' ');

function compiles(where, text) {
  let error;
  baseCompile(text, { onError: (e) => (error ??= e) });
  if (error) report(where, `does not compile as a vue-i18n message: ${error.message}`);
}

const sourceFiles = jsonFiles(join(LOCALES, SOURCE));
if (sourceFiles.length === 0) report('i18n/locales/en', 'no message files');
let keyCount = 0;

for (const locale of TARGETS) {
  const targetFiles = jsonFiles(join(LOCALES, locale));
  for (const f of targetFiles) if (!sourceFiles.includes(f)) report(`i18n/locales/${locale}/${f}`, 'has no English source');
  for (const f of sourceFiles) {
    const en = flatten(readJson(join(LOCALES, SOURCE, f)));
    const enKeys = Object.keys(en);
    if (locale === TARGETS[0]) keyCount += enKeys.length;
    for (const k of enKeys) {
      if (typeof en[k] !== 'string' || en[k].trim() === '') report(`en/${f} ${k}`, 'empty or not a string');
      else if (locale === TARGETS[0]) compiles(`en/${f} ${k}`, en[k]);
    }
    if (!targetFiles.includes(f)) {
      report(`i18n/locales/${locale}/${f}`, `missing: ${enKeys.length} untranslated key(s)`);
      continue;
    }
    const tr = flatten(readJson(join(LOCALES, locale, f)));
    for (const k of enKeys) {
      const where = `${locale}/${f} ${k}`;
      if (!(k in tr)) {
        report(where, 'untranslated (key missing)');
        continue;
      }
      const v = tr[k];
      if (typeof v !== 'string' || v.trim() === '') {
        report(where, 'empty or not a string');
        continue;
      }
      compiles(where, v);
      const words = prose(v).trim().split(/\s+/).filter((w) => /\p{L}{2,}/u.test(w));
      if (v === en[k] && words.length >= 4 && !sameOk.has(`${f.replace(/\.json$/, '')}.${k}`)) {
        report(where, 'identical to the English (list the key in i18n/same-as-english.txt if that is right)');
      }
      const text = prose(v);
      if (/,\s+[io]\s/u.test(text)) report(where, `comma before "i"/"o": "${text.match(/.{0,30},\s+[io]\s.{0,20}/u)?.[0]}"`);
      for (const { form, rule } of refused) {
        if (new RegExp(`(?<![\\p{L}])${form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'iu').test(text)) {
          report(where, `"${form}" is refused by the glossary (${rule})`);
        }
      }
    }
    for (const k of Object.keys(tr)) if (!(k in en)) report(`${locale}/${f} ${k}`, 'stale: no such English key');
  }
}

// --- 5: visible English left in the templates ---------------------------------------------

const VISIBLE_ATTRS = new Set(['title', 'lede', 'eyebrow', 'label', 'alt', 'aria-label', 'caption', 'tag', 'placeholder', 'blurb', 'note', 'description']);
const SKIP_TAGS = new Set(['code', 'pre', 'kbd', 'script', 'style']);
const sentence = (s) => /\p{L}{2,}[\s ]+\p{L}{2,}/u.test(s);

function walk(node, file) {
  if (node.type === 1) {
    if (SKIP_TAGS.has(node.tag) || node.props.some((p) => p.type === 6 && p.name === 'data-i18n-skip')) return;
    for (const p of node.props) {
      if (p.type === 6 && VISIBLE_ATTRS.has(p.name) && p.value && sentence(p.value.content)) {
        report(`${file}:${p.loc.start.line}`, `literal ${p.name}="${p.value.content.slice(0, 60)}"`);
      }
    }
  }
  if (node.type === 2 && sentence(node.content)) {
    report(`${file}:${node.loc.start.line}`, `literal text "${node.content.trim().replace(/\s+/g, ' ').slice(0, 60)}"`);
  }
  for (const c of node.children ?? []) walk(c, file);
}

const vueFiles = readdirSync(join(root, 'app'), { recursive: true })
  .map(String)
  .filter((f) => f.endsWith('.vue'));
for (const f of vueFiles) {
  const { descriptor } = parseSfc(readFileSync(join(root, 'app', f), 'utf8'), { filename: f });
  if (descriptor.template?.ast) walk(descriptor.template.ast, `app/${f}`);
}

if (findings.length > 0) {
  for (const line of findings) console.error(`  ${line}`);
  console.error(`[check-i18n] FAIL: ${findings.length} finding(s)`);
  process.exit(1);
}
console.log(
  `[check-i18n] clean: ${sourceFiles.length} message files, ${keyCount} keys, translated into ${TARGETS.join(', ')}; ${vueFiles.length} templates carry no literal text`,
);
