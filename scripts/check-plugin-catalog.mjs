#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Checks the plugin catalog's data (app/data/plugin-catalog/, written by
// scripts/plugin-catalog-from-records.mjs) against its schema, and what a schema cannot say:
//
//  - plugin-catalog/pin.json names a full commit, and index.json says it was made from that commit;
//  - the index lists a file for every platform, each file names its platform, and no file is left over;
//  - a plugin appears once per platform and format, and each count in the index (tested, formats,
//    verdicts, verdicts by format, reasons) is the count of the rows;
//  - a verdict agrees with its tiers and its reason (accepted: offered and no reason; conditional:
//    offered with a reason; refused: offered nowhere, with a reason) and with its best offer;
//  - every reason code on a row has its text in English and in Catalan, every parameter that text
//    names is a parameter of the reason, every code counted in the index has a short text, and every
//    platform has a name in both languages;
//  - a 95th percentile cost is not below the median.
//
// Usage: node scripts/check-plugin-catalog.mjs [repo-root]     Exit 0 clean, 1 on any finding.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(process.argv[2] ?? resolve(here, '..'));
const data = resolve(root, 'app/data/plugin-catalog');
const read = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
addFormats(ajv);
ajv.addSchema(read('plugin-catalog/schema/plugin-catalog.v2.schema.json'), 'catalog');
const validateIndex = ajv.getSchema('catalog#/$defs/index');
const validatePlatform = ajv.getSchema('catalog#/$defs/platformFile');

const VERDICTS = ['accepted', 'conditional', 'refused'];
const problems = [];
const bad = (where, why) => problems.push(`${where}: ${why}`);

/** The key of a reason code in the message files (a dot cannot be part of a message path). */
const keyOf = (code) => code.replace(/\./g, '_');
const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
const tally = (items) => {
  const out = {};
  for (const x of items) out[x] = (out[x] ?? 0) + 1;
  return out;
};
const same = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());

const messages = {};
for (const lang of ['en', 'ca']) messages[lang] = read(`i18n/locales/${lang}/plugins.json`).plugins;

/** Checks that a code has a text in both languages under `section`; returns the English text. */
function needText(where, section, code) {
  let en = null;
  for (const lang of ['en', 'ca']) {
    const text = messages[lang][section]?.[keyOf(code)];
    if (typeof text !== 'string' || !text) bad(where, `${code} has no ${section} text in ${lang}`);
    else if (lang === 'en') en = text;
  }
  return en;
}

// the pin
let pin = null;
try {
  pin = read('plugin-catalog/pin.json');
  if (!pin.repo || !/^[0-9a-f]{40}$/.test(pin.commit ?? '')) bad('plugin-catalog/pin.json', 'needs a repo and a full 40-character commit');
} catch (e) {
  bad('plugin-catalog/pin.json', `does not read (${e.message})`);
}

// the index
let index = null;
try {
  index = JSON.parse(readFileSync(resolve(data, 'index.json'), 'utf8'));
} catch (e) {
  bad('index.json', `does not read (${e.message})`);
}
if (index && !validateIndex(index)) {
  for (const e of validateIndex.errors.slice(0, 20)) bad('index.json', `${e.instancePath || '/'} ${e.message}`);
  index = null;
}

if (index) {
  if (pin && (index.source.repo !== pin.repo || index.source.commit !== pin.commit)) {
    bad('index.json', `was made from ${index.source.repo} at ${index.source.commit}, not from the pin ${pin.repo} at ${pin.commit}`);
  }
  const wanted = new Set(index.platforms.map((p) => `${p.id}.json`));
  const platformDir = resolve(data, 'platforms');
  const onDisk = existsSync(platformDir) ? readdirSync(platformDir) : [];
  for (const f of onDisk) if (!wanted.has(f)) bad(`platforms/${f}`, 'is listed by no platform of index.json');
  const seenIds = new Set();

  for (const p of index.platforms) {
    const where = `platforms/${p.id}.json`;
    if (seenIds.has(p.id)) bad('index.json', `${p.id} is listed twice`);
    seenIds.add(p.id);
    for (const lang of ['en', 'ca']) {
      if (typeof messages[lang].platform?.[p.id]?.name !== 'string') bad(where, `${p.id} has no name in the ${lang} messages (plugins.platform.${p.id}.name)`);
      for (const k of Object.keys(p.conditions)) {
        if (typeof messages[lang].conditions?.[k] !== 'string') bad(where, `the condition ${k} has no label in the ${lang} messages`);
      }
    }
    let file = null;
    try {
      file = JSON.parse(readFileSync(resolve(platformDir, `${p.id}.json`), 'utf8'));
    } catch (e) {
      bad(where, `does not read (${e.message})`);
      continue;
    }
    if (!validatePlatform(file)) {
      for (const e of validatePlatform.errors.slice(0, 20)) bad(where, `${e.instancePath || '/'} ${e.message}`);
      continue;
    }
    if (file.platform !== p.id) bad(where, `names the platform ${file.platform}`);
    const rows = file.rows;

    const keys = new Set();
    for (const r of rows) {
      const who = `${where}: ${r.format} ${r.id}`;
      const key = `${r.format}\u0000${r.id}`;
      if (keys.has(key)) bad(where, `${r.format} ${r.id} appears twice`);
      keys.add(key);

      if (r.verdict === 'accepted') {
        if (r.tiers.length === 0) bad(who, 'is accepted but offered on no tier');
        if (r.reason !== null) bad(who, `is accepted but carries the reason ${r.reason}`);
      } else if (r.verdict === 'conditional') {
        if (r.tiers.length === 0) bad(who, 'is accepted with conditions but offered on no tier');
        if (r.reason === null) bad(who, 'is accepted with conditions and says no reason');
      } else {
        if (r.tiers.length !== 0) bad(who, 'is refused but offered on a tier');
        if (r.reason === null) bad(who, 'is refused and says no reason');
      }
      if (r.offers[0].verdict !== r.verdict) bad(who, `is ${r.verdict} but its first offer is ${r.offers[0].verdict}`);
      const best = Math.min(...r.offers.map((o) => VERDICTS.indexOf(o.verdict)));
      if (best !== VERDICTS.indexOf(r.verdict)) bad(who, 'is not the best verdict of its offers');
      if (r.cpu && r.cpu.p95 < r.cpu.median) bad(who, 'has a 95th percentile cost below its median');

      for (const reason of r.reasons) {
        const text = needText(who, 'reason', reason.code);
        if (text) for (const name of placeholders(text)) if (!(name in reason.params)) bad(who, `the text of ${reason.code} names {${name}}, which the reason does not carry`);
      }
      for (const code of r.notMeasured) needText(who, 'reason', code);
      for (const code of [r.reason, ...r.offers.map((o) => o.reason)]) if (code) needText(who, 'reasonShort', code);
    }

    const count = (v, list = rows) => list.filter((r) => r.verdict === v).length;
    if (p.tested !== rows.length) bad(where, `index.json says ${p.tested} plugins tested, the file holds ${rows.length}`);
    if (!same(p.formats, tally(rows.map((r) => r.format)))) bad(where, 'the formats counted in index.json are not the formats of the rows');
    for (const v of VERDICTS) if (p.verdicts[v] !== count(v)) bad(where, `index.json says ${p.verdicts[v]} ${v}, the rows hold ${count(v)}`);
    for (const [format, counts] of Object.entries(p.byFormat)) {
      const of = rows.filter((r) => r.format === format);
      for (const v of VERDICTS) if (counts[v] !== count(v, of)) bad(where, `index.json says ${counts[v]} ${format} ${v}, the rows hold ${count(v, of)}`);
    }
    if (Object.keys(p.byFormat).sort().join() !== Object.keys(p.formats).sort().join()) {
      bad(where, 'the formats broken down by verdict are not the formats of the rows');
    }
    for (const kind of ['conditional', 'refused']) {
      const counted = tally(rows.filter((r) => r.verdict === kind).map((r) => r.reason));
      if (!same(p.reasons[kind], counted)) bad(where, `the ${kind} reasons counted in index.json are not those of the rows`);
      for (const code of Object.keys(p.reasons[kind])) needText(where, 'reasonShort', code);
    }
    if (p.records < rows.length) bad(where, `index.json says ${p.records} records for ${rows.length} plugins`);
  }
}

if (problems.length) {
  for (const p of problems) console.error(`check-plugin-catalog: ${p}`);
  process.exit(1);
}
const total = index.platforms.reduce((n, p) => n + p.tested, 0);
console.log(`check-plugin-catalog: ${index.platforms.length} platform(s), ${total} plugins, valid`);
