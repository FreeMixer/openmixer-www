// SPDX-License-Identifier: GPL-3.0-or-later
// The generator's reading of a record, and its --verify: each refusal red, each derivation shown.
// Run: node --test scripts/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundleOf, mergeReasons, parseDimmed, recordVerdict } from './plugin-catalog-from-records.mjs';

const script = join(dirname(fileURLToPath(import.meta.url)), 'plugin-catalog-from-records.mjs');
const cpu = { measured: true, qualified: false, rating: 'unsuitable', deciding: 'hosting.rt-safety.violations-in-run' };

test('a record offered on a tier that qualified is accepted', () => {
  const v = recordVerdict({ tiers: { offeredOn: ['in-process', 'isolated'], inProcess: { qualified: true }, isolated: cpu } }, 'r');
  assert.deepEqual(v, { verdict: 'accepted', tiers: ['in-process', 'isolated'], reason: null });
});

test('a record offered only on a tier that did not qualify is accepted with conditions', () => {
  const v = recordVerdict({ tiers: { offeredOn: ['isolated'], isolated: { ...cpu, rating: 'conditional', runsAlone: true } } }, 'r');
  assert.deepEqual(v, { verdict: 'conditional', tiers: ['isolated'], reason: 'hosting.rt-safety.violations-in-run' });
});

test('a record offered nowhere is refused, with the first measured reason of its dimmed line', () => {
  const dimmed = 'openmixer-console: hosting.memory.unmeasured; omx-clap-host: omx-clap-host.silent-under-note';
  assert.equal(recordVerdict({ tiers: { offeredOn: [], dimmed } }, 'r').reason, 'omx-clap-host.silent-under-note');
  assert.equal(recordVerdict({ tiers: { offeredOn: [], dimmed: 'openmixer-console: hosting.memory.unmeasured' } }, 'r').reason, 'hosting.memory.unmeasured');
  assert.equal(recordVerdict({ tiers: { offeredOn: [], dimmed: 'a: probe.crashed; b: probe.crashed' } }, 'r').verdict, 'refused');
});

test('shapes the generator does not know are refused, not guessed', () => {
  assert.throws(() => recordVerdict({ tiers: {} }, 'r'), /offeredOn/);
  assert.throws(() => recordVerdict({ tiers: { offeredOn: ['cloud'] } }, 'r'), /unknown tier/);
  assert.throws(() => recordVerdict({ tiers: { offeredOn: [] } }, 'r'), /dimmed/);
  assert.throws(() => recordVerdict({ tiers: { offeredOn: ['isolated'] } }, 'r'), /no isolated verdict/);
  assert.throws(() => recordVerdict({ tiers: { offeredOn: ['isolated'], isolated: { qualified: false } } }, 'r'), /deciding/);
  assert.throws(() => parseDimmed('no colon here'), /cannot read/);
});

test('the bundle of a binary is the .clap it lives in, else its own file', () => {
  assert.equal(bundleOf('/usr/lib/clap/ZamComp.clap'), 'ZamComp.clap');
  assert.equal(bundleOf('/usr/lib64/clap/Ildaeil.clap/Contents/x86_64/Ildaeil'), 'Ildaeil.clap');
  assert.equal(bundleOf('3BandEQ_dsp.so'), '3BandEQ_dsp.so');
});

test('the same reason from two hosts is one reason with both hosts', () => {
  const r = { dimension: 'rtSafety', rating: 'unsuitable', code: 'c', params: { a: 1 } };
  const merged = mergeReasons([{ host: 'x', reasons: [r] }, { host: 'y', reasons: [r, { ...r, code: 'd' }] }]);
  assert.deepEqual(merged.map((m) => [m.code, m.hosts]), [['c', ['x', 'y']], ['d', ['y']]]);
});

/** A tiny records repository (one set, one LV2 plugin) and a site root pinned to it. */
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'catalog-gen-'));
  const set = join(dir, 'records/rpi5/demo');
  mkdirSync(set, { recursive: true });
  const probe = JSON.stringify({ grid: [{ rate: 48000, quantum: 512, cost: { unit: 'ns-per-sample' } }] });
  writeFileSync(join(set, 'urn_demo@1.0-aaaaaaaaaaaa.default.probe.json'), probe);
  writeFileSync(join(set, 'urn_demo@1.0-aaaaaaaaaaaa.default.qualification.json'), JSON.stringify({
    schema: 'plugin-qualify.qualification-record/1',
    plugin: { format: 'lv2', id: 'urn:demo' },
    binary: { path: 'demo.so' },
    testedVersion: '1.0',
    verdicts: [{ host: 'omx-clap-host', reasons: [{ dimension: 'rtSafety', rating: 'suitable', code: 'hosting.rt-safety.clean-under-sweep', params: { blocks: 512 } }] }],
    tiers: { offeredOn: ['isolated'], isolated: { qualified: true } },
    notMeasured: [],
    measurements: { grid: [{ rate: 48000, quantum: 512, outcome: 'probe.ok', cost: { median: 10, percentile: { p: 95, value: 12 } }, latency: { declaredFrames: 0, measuredFrames: 0 } }] },
    measuredAt: '2026-01-01T00:00:00+00:00',
    probe: { file: 'urn_demo@1.0-aaaaaaaaaaaa.default.probe.json' },
  }));
  writeFileSync(join(set, 'provenance.json'), JSON.stringify({ schema: 'plugin-qualify.distributed-provenance/1', hostProfile: 'omx-clap-host', hostClass: 'rpi5', set: 'demo', measured: '2026-01-01', image: 'demo image', package: { name: 'p', version: '1' } }));
  const git = (...a) => execFileSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { encoding: 'utf8' });
  git('init', '-q');
  git('add', '-A');
  git('commit', '-q', '-m', 'records');
  const site = mkdtempSync(join(tmpdir(), 'catalog-site-'));
  mkdirSync(join(site, 'plugin-catalog'));
  writeFileSync(join(site, 'plugin-catalog/pin.json'), JSON.stringify({ repo: 'plugin-db-qualification', commit: git('rev-parse', 'HEAD').trim() }));
  const run = (...a) => spawnSync(process.execPath, [script, '--root', site, '--records', dir, ...a], { encoding: 'utf8' });
  return { dir, site, run, git };
}

test('the data is written, --verify passes on it and fails when the data or the pin moves', () => {
  const { site, run, git, dir } = fixture();
  assert.equal(run().status, 0);
  const row = readFileSync(join(site, 'app/data/plugin-catalog/platforms/rpi5-demo.json'), 'utf8').split('\n')[1];
  assert.equal(JSON.parse(row.replace(/,$/, '')).verdict, 'accepted');
  assert.equal(run('--verify').status, 0);

  writeFileSync(join(site, 'app/data/plugin-catalog/platforms/rpi5-demo.json'), readFileSync(join(site, 'app/data/plugin-catalog/platforms/rpi5-demo.json'), 'utf8').replace('accepted', 'refused'));
  const edited = run('--verify');
  assert.equal(edited.status, 1);
  assert.match(edited.stderr, /rpi5-demo\.json is not what plugin-db-qualification gives at [0-9a-f]{40}/);

  assert.equal(run().status, 0);
  writeFileSync(join(dir, 'records/rpi5/demo/extra.txt'), 'x');
  git('add', '-A');
  git('commit', '-q', '-m', 'more');
  const moved = run('--verify');
  assert.equal(moved.status, 1, 'a checkout that is not at the pin is refused');
  assert.match(moved.stderr, /not at/);
  assert.equal(run('--sync', git('rev-parse', 'HEAD').trim()).status, 0);
  assert.equal(JSON.parse(readFileSync(join(site, 'plugin-catalog/pin.json'), 'utf8')).commit, git('rev-parse', 'HEAD').trim());
});

test('a probe output that does not state ns-per-sample is refused', () => {
  const { dir, run, git } = fixture();
  const f = join(dir, 'records/rpi5/demo/urn_demo@1.0-aaaaaaaaaaaa.default.probe.json');
  writeFileSync(f, JSON.stringify({ grid: [{ rate: 48000, quantum: 512, cost: { unit: 'cycles' } }] }));
  git('add', '-A');
  git('commit', '-q', '-m', 'unit');
  const r = run('--sync', git('rev-parse', 'HEAD').trim());
  assert.equal(r.status, 1);
  assert.match(r.stderr, /ns-per-sample/);
});

test('--sync wants a full commit', () => {
  const { run } = fixture();
  assert.equal(run('--sync', 'abc').status, 1);
  assert.equal(resolve('.'), resolve('.'));
});
