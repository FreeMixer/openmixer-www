#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Validates every benchmark run (benchmarks/runs/*.json) against the omx-bench/1 schema and
// checks what a schema cannot: a run's file name is its id, the id names the machine class
// the run holds, the id's date is a real day, no scenario is measured twice, a maximum is not
// below its average, and a chain is a plugin-hostd mode, a median lies inside its own spread. The /benchmarks page is generated from
// these files, so a run that fails here never reaches the site.
//
// Usage: node scripts/check-benchmarks.mjs [benchmarks-dir]     Exit 0 clean, 1 on any finding.

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(process.argv[2] ?? resolve(here, '../benchmarks'));

const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
addFormats(ajv);
const validate = ajv.compile(JSON.parse(readFileSync(resolve(dir, 'schema/omx-bench.v1.schema.json'), 'utf8')));

/** The findings for a row whose spread does not bracket its own figures. */
function spreadProblems(who, row, spread) {
  const out = [];
  for (const [k, [lo, hi]] of Object.entries(spread ?? {})) {
    if (lo > hi) out.push(`${who}: spread of ${k} runs backwards`);
    else if (row[k] != null && (row[k] < lo || row[k] > hi)) out.push(`${who}: ${k} ${row[k]} is outside its spread [${lo}, ${hi}]`);
  }
  return out;
}

const files = readdirSync(resolve(dir, 'runs')).filter((f) => f.endsWith('.json')).sort();
const problems = [];
if (files.length === 0) problems.push('benchmarks/runs/ holds no run');

for (const file of files) {
  let run;
  try {
    run = JSON.parse(readFileSync(resolve(dir, 'runs', file), 'utf8'));
  } catch (e) {
    problems.push(`${file}: not valid JSON: ${e.message}`);
    continue;
  }
  if (!validate(run)) {
    for (const e of validate.errors.slice(0, 20)) problems.push(`${file}: ${e.instancePath || '/'} ${e.message}`);
    continue;
  }
  if (file !== `${run.id}.json`) problems.push(`${file}: the file name is not the run id ${run.id}`);
  const [klass, day] = run.id.split('-');
  if (klass !== run.machine.class) problems.push(`${file}: the id names class ${klass}, the machine is ${run.machine.class}`);
  const iso = `${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}`;
  if (Number.isNaN(Date.parse(iso)) || new Date(iso).toISOString().slice(0, 10) !== iso) {
    problems.push(`${file}: the id's day ${day} is not a calendar day`);
  }
  for (const a of [...(run.add_times?.cold ?? []), ...(run.add_times?.warm ?? [])]) {
    const who = `${file}: add time ${a.host} ${a.mode} ${a.plugins} plugins`;
    problems.push(...spreadProblems(who, { median_ms: a.median_ms }, { median_ms: [a.min_ms, a.max_ms] }));
  }
  for (const i of run.instruments ?? []) {
    problems.push(...spreadProblems(`${file}: instrument ${i.name} ${i.host} ${i.notes}`, i, i.spread));
  }
  const q = run.qualification;
  if (q && q.qualified_in_process != null) {
    const sum = q.qualified_in_process + q.qualified_isolated + q.crashed + q.hung + q.refused + q.unmeasured + (q.no_pin ?? 0);
    if (sum !== q.plugins) problems.push(`${file}: qualification classes add up to ${sum}, not ${q.plugins} plugins`);
  }
  const seen = new Set();
  for (const s of run.scenarios) {
    const key = [s.id, s.host, s.rate, s.frames, s.mode ?? '', (s.plugins ?? []).length, s.stress ?? ''].join('|');
    if (seen.has(key)) problems.push(`${file}: scenario ${key} is measured twice`);
    seen.add(key);
    if (s.dsp_load_avg != null && s.dsp_load_max != null && s.dsp_load_max < s.dsp_load_avg) {
      problems.push(`${file}: ${s.id} ${s.host}: dsp_load_max is below dsp_load_avg`);
    }
    if (s.mode === 'chain' && s.host !== 'H2') problems.push(`${file}: ${s.id} ${s.host}: only H2 runs a chain`);
    if (s.mode === 'shared-process' && s.host !== 'H1' && s.host !== 'H3') problems.push(`${file}: ${s.id} ${s.host}: only H1 and H3 run every plugin in one process`);
    if (s.mode === 'chain-add' && s.host !== 'H2') problems.push(`${file}: ${s.id} ${s.host}: only H2 runs a chain`);
    // A row measured over several repeats says what the repeats did: xruns and the spread of every
    // measure it spread. A figure outside its own spread, or a row with no xruns, is not a median.
    if (s.status === 'ok' && (s.repeats ?? 1) > 1 && (s.xruns == null || !s.spread?.xruns)) {
      problems.push(`${file}: ${s.id} ${s.host} ${s.mode ?? ''}: measured over ${s.repeats} repeats and records no xruns with their spread`);
    }
    problems.push(...spreadProblems(`${file}: ${s.id} ${s.host} ${s.mode ?? ''}`, s, s.spread));
    if (s.host !== 'H2' && s.recover_ms != null) problems.push(`${file}: ${s.id} ${s.host}: only H2 recovers, the others lose the host`);
  }
}

if (problems.length) {
  for (const p of problems) console.error(`check-benchmarks: ${p}`);
  process.exit(1);
}
console.log(`check-benchmarks: ${files.length} run(s) valid`);
