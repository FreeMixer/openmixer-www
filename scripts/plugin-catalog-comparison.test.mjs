// SPDX-License-Identifier: GPL-3.0-or-later
// The host comparison read from a record set: the headline block only from a publishable summary, the
// per-plugin results from the comparison records, and what the references do better derived, never typed.
// Run: node --test scripts/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { comparisonOf, readSet } from './plugin-catalog-from-records.mjs';

const cond = { rate: 48000, quantum: 256, cycles: 5, soakS: 10, windowMs: 2000, timeoutMs: 10000, jack: 'jackd 1.9.22', realtime: 'none' };
const checks = (over = {}) => ({
  loads: { result: 'pass' },
  instantiates: { result: 'pass' },
  output: { result: 'pass', peak: 0.3, stimulus: 'tone' },
  cycles: { result: 'pass', done: 5, of: 5 },
  soak: { result: 'pass', seconds: 10 },
  rtSafe: { result: 'pass', allocations: 0, locks: 0, syscalls: 0, cycles: 1800 },
  cpu: { result: 'measured', percent: 1.5 },
  latency: { result: 'measured', frames: 0 },
  ...over,
});
const ran = (host, version, over = {}, extra = {}) => ({ host, version, status: 'ran', checks: checks(over), runsClean: true, ...extra });
const host = (h, version, o) => ({
  host: h, version, status: 'ran', plugins: 2, loads: 2, instantiates: 2, output: 2, runsClean: 2, rtSafe: 2, rtObserved: 2, crashes: 0,
  cpuMedianPercent: 1.5, latencyObservable: h !== 'mod-host', ...o,
});

function records({ summary = 'publishable', withSummary = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'catalog-cmp-'));
  const set = join(dir, 'records/x86-64/demo');
  mkdirSync(set, { recursive: true });
  writeFileSync(join(set, 'provenance.json'), JSON.stringify({ schema: 'plugin-qualify.distributed-provenance/1', hostProfile: 'omx-clap-host', hostClass: 'x86-64', set: 'demo', measured: '2026-01-01', package: { name: 'p', version: '1' } }));
  for (const [stem, id] of [['a', 'urn:a'], ['b', 'urn:b']]) {
    writeFileSync(join(set, `${stem}.default.probe.json`), JSON.stringify({ grid: [] }));
    writeFileSync(join(set, `${stem}.default.qualification.json`), JSON.stringify({
      schema: 'plugin-qualify.qualification-record/1',
      plugin: { format: 'lv2', id },
      binary: { path: `${stem}.so` },
      testedVersion: null,
      verdicts: [{ host: 'omx-clap-host', reasons: [] }],
      tiers: { offeredOn: ['isolated'], isolated: { qualified: true } },
      notMeasured: [],
      measurements: { grid: [] },
      measuredAt: '2026-01-01T00:00:00+00:00',
      probe: { file: `${stem}.default.probe.json` },
    }));
  }
  // urn:a: every host clean but mod-host crashes; urn:b: jalv clean, ours silent, mod-host latency not observable
  writeFileSync(join(set, 'a-lv2-000000000001.comparison.json'), JSON.stringify({
    schema: 'plugin-qualify.comparison-record/1', plugin: { format: 'lv2', id: 'urn:a' }, stimulus: 'tone', conditions: cond, measuredAt: '2026-01-02T00:00:00Z',
    hosts: [
      ran('omx-clap-host', '0.27.0'),
      ran('plugin-hostd', '0.16.0'),
      { host: 'mod-host', version: '0.10.6', status: 'ran', checks: checks({ soak: { result: 'fail', seconds: 3, detail: 'the host ended during the soak (SIGSEGV)' } }), crash: { step: 'soak', signal: 'SIGSEGV' }, runsClean: false },
      ran('jalv', '1.8.0'),
    ],
  }));
  writeFileSync(join(set, 'b-lv2-000000000002.comparison.json'), JSON.stringify({
    schema: 'plugin-qualify.comparison-record/1', plugin: { format: 'lv2', id: 'urn:b' }, stimulus: 'tone', conditions: cond, measuredAt: '2026-01-02T00:00:00Z',
    hosts: [
      ran('omx-clap-host', '0.27.0', { output: { result: 'fail', peak: 0, stimulus: 'tone', detail: 'silent under tone' }, rtSafe: { result: 'not-observable', detail: 'x' } }, { runsClean: false }),
      ran('plugin-hostd', '0.16.0', { output: { result: 'fail', peak: 0, stimulus: 'tone' } }, { runsClean: false }),
      ran('mod-host', '0.10.6', { latency: { result: 'not-observable', detail: 'mod-host sets no JACK latency callback' } }),
      ran('jalv', '1.8.0'),
    ],
  }));
  const beats = {
    'omx-clap-host': [{ format: 'lv2', id: 'urn:a', over: ['mod-host'], on: 'runs-clean' }],
    'plugin-hostd': [{ format: 'lv2', id: 'urn:a', over: ['mod-host'], on: 'runs-clean' }],
    'mod-host': [{ format: 'lv2', id: 'urn:b', over: ['omx-clap-host', 'plugin-hostd'], on: 'runs-clean' }],
    jalv: [
      { format: 'lv2', id: 'urn:a', over: ['mod-host'], on: 'runs-clean' },
      { format: 'lv2', id: 'urn:b', over: ['omx-clap-host', 'plugin-hostd'], on: 'runs-clean' },
    ],
  };
  const publishable = summary === 'publishable';
  if (withSummary) writeFileSync(join(set, 'comparison-summary.json'), JSON.stringify({
    schema: 'plugin-qualify.comparison-summary/1', hostClass: 'x86-64', set: 'demo', measured: '2026-01-02', publishable,
    missing: publishable ? [] : [{ host: 'jalv', reason: 'jalv is not installed' }],
    conditions: cond, records: 2, common: 2,
    hosts: [
      host('omx-clap-host', '0.27.0', { output: 1, runsClean: 1, rtSafe: 1 }),
      host('plugin-hostd', '0.16.0', { output: 1, runsClean: 1 }),
      host('mod-host', '0.10.6', { runsClean: 1, crashes: 1 }),
      publishable ? host('jalv', '1.8.0') : { host: 'jalv', version: null, status: 'skipped', reason: 'jalv is not installed', plugins: 0, loads: 0, instantiates: 0, output: 0, runsClean: 0, rtSafe: 0, rtObserved: 0, crashes: 0, cpuMedianPercent: null, latencyObservable: true },
    ],
    beats,
  }));
  return set;
}

test('a publishable summary gives the headline block: hosts, versions, counts and the conditions', () => {
  const c = comparisonOf(records(), 'x86-64/demo');
  assert.equal(c.available, true);
  assert.deepEqual(c.conditions, { rate: 48000, quantum: 256, cycles: 5, soakS: 10 });
  assert.deepEqual(c.hosts.map((h) => [h.host, h.version, h.status]), [['omx-clap-host', '0.27.0', 'ran'], ['plugin-hostd', '0.16.0', 'ran'], ['mod-host', '0.10.6', 'ran'], ['jalv', '1.8.0', 'ran']]);
  const mod = c.hosts.find((h) => h.host === 'mod-host');
  assert.deepEqual([mod.plugins, mod.loads, mod.runsClean, mod.rtSafe, mod.rtObserved, mod.crashes, mod.latencyObservable], [2, 2, 1, 2, 2, 1, false]);
});

test('where mod-host or jalv do better is derived from the beats, plugin by plugin', () => {
  const c = comparisonOf(records(), 'x86-64/demo');
  assert.deepEqual(c.referencesBetter, [
    { host: 'mod-host', plugins: [{ format: 'lv2', id: 'urn:b', over: ['omx-clap-host', 'plugin-hostd'], on: ['runs-clean'] }] },
    { host: 'jalv', plugins: [{ format: 'lv2', id: 'urn:b', over: ['omx-clap-host', 'plugin-hostd'], on: ['runs-clean'] }] },
  ]);
  // over a reference only: what ours do better than mod-host and jalv
  assert.deepEqual(c.oursBetter, [
    { host: 'omx-clap-host', plugins: [{ format: 'lv2', id: 'urn:a', over: ['mod-host'], on: ['runs-clean'] }] },
    { host: 'plugin-hostd', plugins: [{ format: 'lv2', id: 'urn:a', over: ['mod-host'], on: ['runs-clean'] }] },
  ]);
});

test('each plugin row carries its result per host, not-observable kept as such', () => {
  const { rows } = readSet(records(), 'x86-64/demo');
  const b = rows.find((r) => r.id === 'urn:b');
  assert.deepEqual(b.comparison.map((h) => [h.host, h.runsClean, h.output, h.rtSafe, h.latency]), [
    ['omx-clap-host', false, 'fail', 'not-observable', 0],
    ['plugin-hostd', false, 'fail', 'pass', 0],
    ['mod-host', true, 'pass', 'pass', null],
    ['jalv', true, 'pass', 'pass', 0],
  ]);
  const a = rows.find((r) => r.id === 'urn:a');
  assert.deepEqual(a.comparison.find((h) => h.host === 'mod-host').crash, 'SIGSEGV');
  assert.equal(a.comparison[0].cpu, 1.5);
});

test('an unpublishable summary, or none, gives no block and no per-plugin results, and says why', () => {
  const un = records({ summary: 'local' });
  assert.deepEqual(comparisonOf(un, 'x86-64/demo'), { available: false, why: 'not-publishable' });
  assert.ok(readSet(un, 'x86-64/demo').rows.every((r) => !('comparison' in r)));
  const none = records({ withSummary: false });
  assert.deepEqual(comparisonOf(none, 'x86-64/demo'), { available: false, why: 'no-summary' });
  assert.ok(readSet(none, 'x86-64/demo').rows.every((r) => !('comparison' in r)));
});

test('a summary that says publishable without both references, or an unknown schema, is refused', () => {
  const set = records();
  const s = JSON.parse(JSON.stringify({ schema: 'plugin-qualify.comparison-summary/9' }));
  writeFileSync(join(set, 'comparison-summary.json'), JSON.stringify(s));
  assert.throws(() => comparisonOf(set, 'x86-64/demo'), /schema/);
  const set2 = records({ summary: 'local' });
  const p = join(set2, 'comparison-summary.json');
  const bad = { schema: 'plugin-qualify.comparison-summary/1', publishable: true, missing: [], conditions: cond, hosts: [host('mod-host', '0.10.6')], beats: {} };
  writeFileSync(p, JSON.stringify(bad));
  assert.throws(() => comparisonOf(set2, 'x86-64/demo'), /jalv/);
  const set3 = records();
  writeFileSync(join(set3, 'a-lv2-000000000001.comparison.json'), JSON.stringify({ schema: 'plugin-qualify.comparison-record/7' }));
  assert.throws(() => readSet(set3, 'x86-64/demo'), /comparison-record/);
});
