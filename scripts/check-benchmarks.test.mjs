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
  barPercent, barScale, compareRows, cvpGroups, cvpRatios, families, isolationLoads, isolationRecovers, latestPerClass, show,
} from '../app/utils/benchmarkModel.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'scripts/check-benchmarks.mjs');
const example = JSON.parse(readFileSync(join(root, 'benchmarks/runs/rpi5-20261026-1.json'), 'utf8'));

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
    'a class that disagrees with the id': [{ 'rpi5-20261026-1.json': { ...example, machine: { ...example.machine, class: 'desk' } } }, 'names class rpi5'],
    'a day that does not exist': [{ 'rpi5-20261342-1.json': { ...example, id: 'rpi5-20261342-1' } }, 'not a calendar day'],
    'a wrong schema id': [{ 'rpi5-20261026-1.json': { ...example, schema: 'omx-bench/2' } }, 'schema'],
    'a scenario measured twice': [{ 'rpi5-20261026-1.json': withScenario({}) }, 'measured twice'],
    'an ok scenario with no load': [{ 'rpi5-20261026-1.json': withScenario({ host: 'H3', dsp_load_avg: undefined }) }, 'dsp_load_avg'],
    'an unsupported scenario with no reason': [{ 'rpi5-20261026-1.json': withScenario({ host: 'H3', status: 'unsupported', dsp_load_avg: undefined }) }, 'note'],
    'a maximum below its average': [{ 'rpi5-20261026-1.json': withScenario({ host: 'H3', dsp_load_avg: 5, dsp_load_max: 4 }) }, 'below dsp_load_avg'],
    'a chain on a host that has none': [{ 'rpi5-20261026-1.json': withScenario({ host: 'H3', mode: 'chain' }) }, 'only H2 runs a chain'],
    'a field the schema does not know': [{ 'rpi5-20261026-1.json': withScenario({ host: 'H3', speed: 1 }) }, 'additional properties'],
    'a file that is not JSON': [{ 'rpi5-20261026-1.json': '{' }, 'not valid JSON'],
    'no run at all': [{}, 'holds no run'],
  };
  for (const [name, [runs, expected]] of Object.entries(cases)) {
    const r = check(runs);
    assert.equal(r.status, 1, `${name}: ${r.stdout}`);
    assert.match(r.stderr, new RegExp(expected), name);
  }
});

test('the new scenario fields pass', () => {
  const ok = withScenario({
    id: 'chains-vs-processes', host: 'H2', mode: 'individual', processes: 4, rss_mb_total: 120.5, pss_mb_total: 80.2, cpu_pct: 3.1, ctx_switches: 900, dsp_load_avg: 1,
  });
  const r = check({ 'rpi5-20261026-1.json': ok });
  assert.equal(r.status, 0, r.stderr);
});

const sc = (o) => ({ id: 'x', title: 'X', rate: 48000, frames: 256, status: 'ok', ...o });
const run = (scenarios, id = 'rpi5-20261026-1', klass = 'rpi5') => ({ ...example, id, machine: { ...example.machine, class: klass }, scenarios });

test('the latest run of each class wins, by day then sequence', () => {
  const runs = [run([], 'rpi5-20261026-2'), run([], 'rpi5-20261026-10'), run([], 'rpi5-20261001-99'), run([], 'desk-20260101-1', 'desk')];
  const latest = latestPerClass(runs);
  assert.equal(latest.get('rpi5').id, 'rpi5-20261026-10');
  assert.equal(latest.get('desk').id, 'desk-20260101-1');
  assert.equal(latest.has('ci'), false);
});

test('the example run reads as measured', () => {
  assert.deepEqual(families(example).map((f) => f.id), ['chain3', 'pianoteq']);
  const rows = compareRows(example, 'pianoteq');
  assert.deepEqual(rows.map((r) => r.rate), [48000, 96000]);
  assert.equal(rows[1].cells.H2.dsp_load_max, 24);
  assert.equal(rows[0].cells.H1, undefined);
  assert.equal(show(rows[0].cells.H2.dsp_load_avg), '12.4');
  assert.equal(barScale(rows), 24);
  assert.equal(barPercent(12, 24), 50);
  assert.equal(barPercent(null, 24), 0);
});

test('isolation figures compute from the rows', () => {
  const r = run([
    sc({ host: 'H1', dsp_load_avg: 0.3 }),
    sc({ host: 'H2', dsp_load_avg: 0.4, recover_ms: 180 }),
    sc({ host: 'H3', status: 'failed', note: 'host process lost' }),
    sc({ host: 'H4', status: 'unsupported', note: 'LV2 only' }),
  ]);
  const [load] = isolationLoads(r);
  assert.equal(load.delta, 0.1);
  const [rec] = isolationRecovers(r);
  assert.equal(rec.recoverMs, 180);
  assert.deepEqual(rec.lost, [{ host: 'H3', note: 'host process lost' }]);
  assert.deepEqual(isolationLoads(example), []);
});

test('chains versus processes: groups by count and ratios from the data', () => {
  const plugins = (n) => Array.from({ length: n }, (_, i) => `p${i}`);
  const cvp = (n, host, mode, o) => sc({ id: 'chains-vs-processes', host, mode, plugins: plugins(n), ...o });
  const r = run([
    cvp(8, 'H2', 'chain', { processes: 2, pss_mb_total: 50, cpu_pct: 2, dsp_load_avg: 1 }),
    cvp(8, 'H2', 'individual', { processes: 9, pss_mb_total: 150, cpu_pct: 5, dsp_load_avg: 1 }),
    cvp(8, 'H1', 'shared-process', { processes: 1, pss_mb_total: 40, cpu_pct: 2, dsp_load_avg: 1 }),
    cvp(3, 'H2', 'individual', { processes: 4, dsp_load_avg: 1 }),
  ]);
  const groups = cvpGroups(r);
  assert.deepEqual(groups.map((g) => g.n), [3, 8]);
  assert.deepEqual(groups[1].rows.map((s) => s.mode), ['individual', 'shared-process', 'chain']);
  assert.deepEqual(families(r), []);
  assert.deepEqual(cvpRatios(r), [{ n: 8, rate: 48000, frames: 256, processes: 4.5, pss: 3, cpu: 2.5 }]);
});
