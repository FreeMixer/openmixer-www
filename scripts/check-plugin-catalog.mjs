#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Validates every plugin-catalog run (plugin-catalog/runs/*.json) against the schema its
// schemaVersion names, and checks what a schema cannot: every reason code has an English text,
// every URI appears once per run, and a run's file name is its date. The /plugins/ pages are
// generated from these files, so a run that fails here never reaches the site.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(here, '../plugin-catalog');
const texts = JSON.parse(readFileSync(resolve(dir, 'schema/reason-texts.en.json'), 'utf8')).codes;

const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
addFormats(ajv);
const validators = new Map();
function validatorFor(version) {
  if (!validators.has(version)) {
    const path = resolve(dir, `schema/plugin-catalog.v${version}.schema.json`);
    validators.set(version, existsSync(path) ? ajv.compile(JSON.parse(readFileSync(path, 'utf8'))) : null);
  }
  return validators.get(version);
}

const files = readdirSync(resolve(dir, 'runs')).filter((f) => f.endsWith('.json')).sort();
const problems = [];
if (files.length === 0) problems.push('plugin-catalog/runs/ holds no run');
for (const file of files) {
  const run = JSON.parse(readFileSync(resolve(dir, 'runs', file), 'utf8'));
  const validate = validatorFor(run.schemaVersion);
  if (!validate) {
    problems.push(`${file}: no schema for schemaVersion ${JSON.stringify(run.schemaVersion)}`);
    continue;
  }
  if (!validate(run)) {
    for (const e of validate.errors.slice(0, 20)) problems.push(`${file}: ${e.instancePath || '/'} ${e.message}`);
    continue;
  }
  if (!file.startsWith(run.run.date.slice(0, 10))) problems.push(`${file}: run date ${run.run.date} does not match the file name`);
  const seen = new Set();
  for (const p of run.plugins) {
    if (seen.has(p.uri)) problems.push(`${file}: ${p.uri} appears twice`);
    seen.add(p.uri);
    for (const r of p.reasons) {
      if (!(r.code in texts)) problems.push(`${file}: ${p.uri}: reason code ${r.code} has no text in reason-texts.en.json`);
    }
    if (p.deciding !== null && !p.reasons.some((r) => r.code === p.deciding)) {
      problems.push(`${file}: ${p.uri}: deciding ${p.deciding} is not among its reasons`);
    }
  }
}

if (problems.length) {
  for (const p of problems) console.error(`check-plugin-catalog: ${p}`);
  process.exit(1);
}
console.log(`check-plugin-catalog: ${files.length} run(s) valid`);
