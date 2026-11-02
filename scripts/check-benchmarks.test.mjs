// SPDX-License-Identifier: GPL-3.0-or-later
// Proves the benchmark check passes the committed runs, refuses each kind of bad file, and that
// the page's derivations (latest per class, side-by-side rows, isolation figures, chains versus
// processes ratios) compute from the data. Run: node --test scripts/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  acceptance, barPercent, barScale, compareRows, failingRows, families, latestPerClass, sameDayRuns, show, spreadOf, stressRows, variantKey, variants,
} from '../app/utils/benchmarkModel.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'scripts/check-benchmarks.mjs');
const runFile = (id) => JSON.parse(readFileSync(join(root, `benchmarks/runs/${id}.json`), 'utf8'));
const first = runFile('rpi5-20261102-1');
const example = runFile('rpi5-20261102-2');
const NAME = 'rpi5-20261102-2.json';

/** A copy of benchmarks/ in a temp dir holding only the given runs; returns the check's result. */
function check(runs) {
  const dir = mkdtempSync(join(tmpdir(), 'bench-'));
  cpSync(join(root, 'benchmarks/schema'), join(dir, 'schema'), { recursive: true });
  mkdirSync(join(dir, 'runs'));
  for (const [name, run] of Object.entries(runs)) writeFileSync(join(dir, 'runs', name), typeof run === 'string' ? run : JSON.stringify(run));
  return spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
}
const withScenario = (patch) => ({ ...example, scenarios: [...example.scenarios, { ...example.scenarios[0], ...patch }] });

test('the committed runs pass', () => {
  const r = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(readdirSync(join(root, 'benchmarks/runs')).length >= 1);
});

test('refusals', () => {
  const cases = {
    'a file name that is not the id': [{ 'other.json': example }, 'not the run id'],
    'a class that disagrees with the id': [{ [NAME]: { ...example, machine: { ...example.machine, class: 'desk' } } }, 'names class rpi5'],
    'a day that does not exist': [{ 'rpi5-20261342-1.json': { ...example, id: 'rpi5-20261342-1' } }, 'not a calendar day'],
    'a wrong schema id': [{ [NAME]: { ...example, schema: 'omx-bench/2' } }, 'schema'],
    'a scenario measured twice': [{ [NAME]: withScenario({}) }, 'measured twice'],
    'an ok scenario with no load': [{ [NAME]: withScenario({ host: 'H3', dsp_load_avg: undefined }) }, 'dsp_load_avg'],
    'an unsupported scenario with no reason': [{ [NAME]: withScenario({ host: 'H3', status: 'unsupported', dsp_load_avg: undefined }) }, 'note'],
    'a maximum below its average': [{ [NAME]: withScenario({ host: 'H3', dsp_load_avg: 5, dsp_load_max: 4 }) }, 'below dsp_load_avg'],
    'a chain on a host that has none': [{ [NAME]: withScenario({ host: 'H3', mode: 'chain' }) }, 'only H2 runs a chain'],
    'a field the schema does not know': [{ [NAME]: withScenario({ host: 'H3', speed: 1 }) }, 'additional properties'],
    'a median outside its own spread': [{ [NAME]: withScenario({ host: 'H3', dsp_load_avg: 30, spread: { dsp_load_avg: [1, 2], xruns: [0, 0] }, xruns: 0 }) }, 'outside its spread'],
    'a spread that runs backwards': [{ [NAME]: withScenario({ host: 'H3', spread: { dsp_load_avg: [9, 1], xruns: [0, 0] }, xruns: 0 }) }, 'runs backwards'],
    'a repeated row that records no xruns': [{ [NAME]: withScenario({ host: 'H3', xruns: undefined, spread: { dsp_load_avg: [1, 30] } }) }, 'records no xruns'],
    'an xrun median above the highest repeat': [{ [NAME]: withScenario({ host: 'H3', xruns: 5, spread: { xruns: [0, 1] } }) }, 'xruns 5 is outside'],
    'an add time outside its range': [{ [NAME]: { ...example, add_times: { warm: [{ host: 'H3', mode: 'shared-process', plugins: 2, median_ms: 90, min_ms: 40, max_ms: 50, repeats: 3 }] } } }, 'outside its spread'],
    'qualification classes that do not add up': [{ [NAME]: { ...example, qualification: { ...example.qualification, crashed: example.qualification.crashed + 1 } } }, 'add up to'],
    'a file that is not JSON': [{ [NAME]: '{' }, 'not valid JSON'],
    'no run at all': [{}, 'holds no run'],
  };
  for (const [name, [runs, expected]] of Object.entries(cases)) {
    const r = check(runs);
    assert.equal(r.status, 1, `${name}: ${r.stdout}`);
    assert.match(r.stderr, new RegExp(expected), name);
  }
});

const sc = (o) => ({ id: 'x', title: 'X', rate: 48000, frames: 256, status: 'ok', ...o });
const run = (scenarios, id = 'rpi5-20261102-2', klass = 'rpi5') => ({ ...example, id, machine: { ...example.machine, class: klass }, scenarios });

test('the committed run states what was measured', () => {
  const find = (id, host, mode) => example.scenarios.find((s) => s.id === id && s.host === host && s.mode === mode);
  // The headline figures, read from the committed run: H2 chain, H3, H1 shared.
  assert.deepEqual([find('cvp24', 'H2', 'chain').dsp_load_avg, find('cvp24', 'H2', 'chain').pss_mb_total], [12.48, 65.8]);
  assert.deepEqual([find('cvp24', 'H3', 'shared-process').dsp_load_avg, find('cvp24', 'H3', 'shared-process').pss_mb_total], [15.02, 109.4]);
  assert.deepEqual([find('cvp24', 'H1', 'shared-process').dsp_load_avg, find('cvp24', 'H1', 'shared-process').pss_mb_total], [15.31, 64.6]);
  assert.equal(find('cvp24', 'H1', 'shared-process').software['omx-clap-core'], '0.26.3');
  assert.equal(find('cvp24', 'H2', 'chain').software['omx-clap-core'], '0.26.4');
  assert.deepEqual(spreadOf(find('cvp24', 'H2', 'individual'), 'xruns'), [0, 21]);
});

test('every row is kept: variants and rows hold the failures and the xruns', () => {
  assert.deepEqual(families(example).map((f) => f.id), ['cvp24', 'cvp24-lv2', 'tp10']);
  assert.deepEqual(variants(example, 'cvp24').map(variantKey), ['H2|chain-add', 'H2|chain', 'H1|shared-process', 'H3|shared-process', 'H2|individual']);
  const [row] = compareRows(example, 'cvp24');
  assert.equal(Object.keys(row.cells).length, 5);
  assert.equal(row.stress, 'none');
  // The first run of the day holds the failed chains; they are rows, not gaps.
  const [firstRow] = compareRows(first, 'cvp24');
  assert.equal(firstRow.cells['H2|chain'].status, 'failed');
  assert.equal(show(row.cells['H2|chain'].dsp_load_avg), '12.48');
  assert.ok(barScale(compareRows(example, 'cvp24')) >= 18);
  assert.equal(barPercent(12, 24), 50);
  assert.equal(barPercent(null, 24), 0);
});

test('acceptance: a failed row and a row with an xrun in any repeat fail, and none is dropped', () => {
  assert.deepEqual(acceptance(sc({ xruns: 0, spread: { xruns: [0, 0] } })), { pass: true, reasons: [] });
  assert.deepEqual(acceptance(sc({ xruns: 0, spread: { xruns: [0, 21] } })).reasons, ['xruns']);
  assert.deepEqual(acceptance(sc({ status: 'failed', note: 'x' })).reasons, ['failed']);
  assert.equal(acceptance(sc({ status: 'unsupported', note: 'LV2 only' })).pass, true);
  const rows = failingRows(sameDayRuns([first, example], example));
  const keys = rows.map((r) => `${r.runId} ${r.scenario.id} ${r.scenario.host} ${r.scenario.mode} ${r.reasons}`);
  assert.ok(keys.includes('rpi5-20261102-2 cvp24 H2 individual xruns'));
  assert.ok(keys.includes('rpi5-20261102-1 cvp24 H2 chain failed'));
  assert.ok(keys.includes('rpi5-20261102-1 cvp24-lv2 H2 individual xruns'));
  assert.equal(rows.filter((r) => r.reasons.includes('failed')).length, 6);
  // The rows of the run that passed are not in the list.
  assert.ok(!keys.includes('rpi5-20261102-2 cvp24 H2 chain'));
});

test('stress rows: none in this run, and a stressed row is found when there is one', () => {
  assert.deepEqual(stressRows(example), []);
  assert.equal(stressRows(run([sc({ host: 'H2', stress: 'cpu', dsp_load_avg: 1 }), sc({ host: 'H1', stress: 'none', dsp_load_avg: 1 })])).length, 1);
});

test('the latest run of each class wins, by day then sequence, and the same day is kept together', () => {
  const runs = [run([], 'rpi5-20261026-2'), run([], 'rpi5-20261026-10'), run([], 'rpi5-20261001-99'), run([], 'desk-20260101-1', 'desk')];
  const latest = latestPerClass(runs);
  assert.equal(latest.get('rpi5').id, 'rpi5-20261026-10');
  assert.equal(latest.get('desk').id, 'desk-20260101-1');
  assert.equal(latest.has('ci'), false);
  assert.deepEqual(sameDayRuns(runs, runs[1]).map((r) => r.id), ['rpi5-20261026-10', 'rpi5-20261026-2']);
});
