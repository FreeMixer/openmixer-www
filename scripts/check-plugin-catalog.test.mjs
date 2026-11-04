// SPDX-License-Identifier: GPL-3.0-or-later
// Proves the catalog check passes the committed data and refuses each kind of bad data: every case
// breaks one thing in a copy of the data and expects the check to say so.  Run: node --test scripts/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const script = join(root, 'scripts/check-plugin-catalog.mjs');
const PLATFORM = 'rpi5-zynthian-vangelis';

/** A copy of what the check reads, changed by `edit({ pin, index, rows, en, ca })`; returns the check's result. */
function check(edit = () => {}) {
  const dir = mkdtempSync(join(tmpdir(), 'catalog-check-'));
  cpSync(join(root, 'plugin-catalog'), join(dir, 'plugin-catalog'), { recursive: true });
  cpSync(join(root, 'app/data/plugin-catalog'), join(dir, 'app/data/plugin-catalog'), { recursive: true });
  for (const lang of ['en', 'ca']) {
    mkdirSync(join(dir, 'i18n/locales', lang), { recursive: true });
    cpSync(join(root, 'i18n/locales', lang, 'plugins.json'), join(dir, 'i18n/locales', lang, 'plugins.json'));
  }
  const file = (p) => join(dir, p);
  const load = (p) => JSON.parse(readFileSync(file(p), 'utf8'));
  const platformPath = `app/data/plugin-catalog/platforms/${PLATFORM}.json`;
  const state = {
    pin: load('plugin-catalog/pin.json'),
    index: load('app/data/plugin-catalog/index.json'),
    platform: load(platformPath),
    en: load('i18n/locales/en/plugins.json'),
    ca: load('i18n/locales/ca/plugins.json'),
  };
  edit(state);
  const save = (p, v) => writeFileSync(file(p), JSON.stringify(v));
  save('plugin-catalog/pin.json', state.pin);
  save('app/data/plugin-catalog/index.json', state.index);
  save(platformPath, state.platform);
  save('i18n/locales/en/plugins.json', state.en);
  save('i18n/locales/ca/plugins.json', state.ca);
  return spawnSync(process.execPath, [script, dir], { encoding: 'utf8' });
}
const rejects = (edit, pattern) => {
  const r = check(edit);
  assert.equal(r.status, 1, `expected a refusal, got: ${r.stdout}${r.stderr}`);
  assert.match(r.stderr, pattern);
};
const first = (s, verdict) => s.platform.rows.find((r) => r.verdict === verdict);
const platform = (s) => s.index.platforms.find((p) => p.id === PLATFORM);

test('the committed data passes', () => {
  const r = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /2 platform\(s\), \d+ plugins, valid/);
  assert.equal(check().status, 0);
});

test('refusals: the pin and the index', () => {
  rejects((s) => { s.pin.commit = 'abc'; }, /pin\.json.*full 40-character commit/);
  rejects((s) => { s.pin.commit = 'f'.repeat(40); }, /not from the pin/);
  rejects((s) => { s.index.platforms[0].tested += 1; }, /says \d+ plugins tested/);
  rejects((s) => { s.index.platforms.push({ ...platform(s), id: 'ghost' }); }, /ghost/);
  rejects((s) => { s.index.platforms.pop(); }, /listed by no platform/);
  rejects((s) => { s.platform.platform = 'other'; }, /names the platform other/);
  rejects((s) => { delete s.platform.rows[0].binary; }, /binary/);
});

test('refusals: counts that are not the rows', () => {
  rejects((s) => { platform(s).verdicts.accepted += 1; }, /says \d+ accepted/);
  rejects((s) => { platform(s).formats.lv2 += 1; }, /formats counted/);
  rejects((s) => { platform(s).byFormat.lv2.refused += 1; }, /lv2 refused/);
  rejects((s) => { platform(s).reasons.refused['probe.crashed'] += 1; }, /refused reasons counted/);
  rejects((s) => { s.platform.rows.push(structuredClone(s.platform.rows[0])); }, /appears twice/);
});

test('refusals: a verdict that disagrees with its tiers, reason or offers', () => {
  rejects((s) => { first(s, 'accepted').tiers = []; }, /accepted but offered on no tier/);
  rejects((s) => { first(s, 'accepted').reason = 'probe.crashed'; }, /accepted but carries the reason/);
  rejects((s) => { first(s, 'refused').tiers = ['isolated']; }, /refused but offered on a tier/);
  rejects((s) => { first(s, 'refused').reason = null; }, /refused and says no reason/);
  rejects((s) => { first(s, 'refused').offers[0].verdict = 'accepted'; }, /first offer is accepted/);
  rejects((s) => { const r = first(s, 'refused'); r.offers.push({ offer: 'x', verdict: 'accepted', reason: null }); }, /not the best verdict/);
  rejects((s) => { const r = s.platform.rows.find((x) => x.cpu); r.cpu.p95 = r.cpu.median - 1; }, /below its median/);
});

test('refusals: a reason with no text in a language, or a text that names a missing parameter', () => {
  rejects((s) => { delete s.ca.plugins.reason['hosting_rt-safety_violations-in-run']; }, /no reason text in ca/);
  rejects((s) => { delete s.en.plugins.reason['probe_timeout']; }, /probe\.timeout has no reason text in en/);
  rejects((s) => { delete s.en.plugins.reasonShort['probe_crashed']; }, /probe\.crashed has no reasonShort text in en/);
  rejects((s) => { s.en.plugins.reason['hosting_rt-safety_clean-under-sweep'] = 'Clean over {blocks} blocks at {rate} Hz.'; }, /names \{rate\}/);
  rejects((s) => { delete s.ca.plugins.platform[PLATFORM]; }, /no name in the ca messages/);
  rejects((s) => { delete s.en.plugins.conditions.board; }, /condition board has no label in the en messages/);
  rejects((s) => { first(s, 'accepted').notMeasured.push('no.such.code'); }, /no\.such\.code has no reason text/);
});
