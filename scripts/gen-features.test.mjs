// SPDX-License-Identifier: GPL-3.0-or-later
// Proves the feature generator refuses what it guards: an invalid record, a page row without a
// record, a typed state, a hand-edited or stale generated file. Run: node --test scripts/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MARK, featuresJson, pageProblems, publicDocs, readRecords } from './gen-features.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const rec = (id, extra = '') => ({
  file: `content/features/${id}.yml`,
  text: `id: ${id}\ntitle: T ${id}\nstate: live\nmanual:\n  - docs/manual/${id}.md\npublic: true\n${extra}`,
});

test('a valid record reads clean', () => {
  const { records, problems } = readRecords([rec('a')]);
  assert.deepEqual(problems, []);
  assert.equal(records[0].state, 'live');
});

test('each bad record is refused', () => {
  const bad = (text, re) => assert.match(readRecords([{ file: 'content/features/a.yml', text }]).problems.join('\n'), re);
  bad('id: a\ntitle: T\nstate: done\nmanual: []\npublic: true\n', /state must be/);
  bad('id: a\ntitle: T\nstate: live\nmanual: [design/x.md]\npublic: true\n', /manual is a list/);
  bad('id: A\ntitle: T\nstate: live\nmanual: []\npublic: true\n', /lower-kebab/);
  bad('id: a\ntitle: T\nstate: live\nmanual: []\n', /no public/);
  bad('id: a\ntitle: T\nstate: live\nmanual: []\npublic: true\nextra: 1\n', /unknown key extra/);
  assert.match(readRecords([rec('a'), { ...rec('b'), text: rec('b').text.replace('b.md', 'a.md') }]).problems.join(), /already named by a/);
});

test('the public docs list carries the pages of public records only', () => {
  const { records } = readRecords([rec('a'), { ...rec('b'), text: rec('b').text.replace('public: true', 'public: false') }]);
  const out = publicDocs(`# manual\n${MARK}\nmanual/index.md\n`, records);
  assert.match(out, /^manual\/a\.md$/m);
  assert.doesNotMatch(out, /manual\/b\.md/);
  assert.throws(() => publicDocs('manual/a.md\n' + MARK, records), /also names/);
  assert.throws(() => publicDocs('no marker', records), /exactly one/);
});

test('the page must show exactly the public records and type no state', () => {
  const { records } = readRecords([rec('a')]);
  const locales = { en: { features: { a: { title: 'T a' } } } };
  assert.deepEqual(pageProblems(records, `:state="stateOf('a')"`, locales), []);
  assert.match(pageProblems(records, '', locales).join(), /no row for the record a/);
  assert.match(pageProblems(records, `:state="stateOf('a')" :state="stateOf('z')"`, locales).join(), /z, which has no public record/);
  assert.match(pageProblems(records, `:state="stateOf('a')" state="live"`, locales).join(), /types a state by hand/);
  assert.match(pageProblems(records, `:state="stateOf('a')"`, { en: { features: { a: { title: 'Other' } } } }).join(), /the record says/);
});

/** A copy of the tree the script reads, so --verify can be run against edits. */
function tree() {
  const dir = mkdtempSync(join(tmpdir(), 'gen-features-'));
  for (const d of ['scripts', 'content/features', 'app/data', 'app/pages', 'deploy', 'i18n/locales/en', 'i18n/locales/ca']) mkdirSync(join(dir, d), { recursive: true });
  const root = join(here, '..');
  cpSync(join(here, 'gen-features.mjs'), join(dir, 'scripts/gen-features.mjs'));
  cpSync(join(root, 'node_modules'), join(dir, 'node_modules'), { recursive: true });
  cpSync(join(root, 'package.json'), join(dir, 'package.json'));
  cpSync(join(root, 'content/features'), join(dir, 'content/features'), { recursive: true });
  cpSync(join(root, 'app/data/features.json'), join(dir, 'app/data/features.json'));
  cpSync(join(root, 'app/pages/features.vue'), join(dir, 'app/pages/features.vue'));
  for (const f of ['deploy/public-docs.txt', 'deploy/public-docs.base.txt', 'i18n/locales/en/features.json', 'i18n/locales/ca/features.json']) cpSync(join(root, f), join(dir, f));
  return dir;
}
const verify = (dir) => spawnSync('node', [join(dir, 'scripts/gen-features.mjs'), '--verify'], { encoding: 'utf8' });

test('--verify: the committed files are current; a hand edit or a stale record is red', () => {
  const dir = tree();
  assert.equal(verify(dir).status, 0, verify(dir).stderr);
  const list = join(dir, 'deploy/public-docs.txt');
  const original = readFileSync(list, 'utf8');
  writeFileSync(list, original + 'manual/secret.md\n');
  assert.match(verify(dir).stderr, /public-docs\.txt is stale or was edited by hand/);
  writeFileSync(list, original);
  const data = join(dir, 'app/data/features.json');
  writeFileSync(data, readFileSync(data, 'utf8').replace('"measured"', '"live"'));
  assert.match(verify(dir).stderr, /features\.json is stale or was edited by hand/);
  cpSync(join(here, '..', 'app/data/features.json'), data);
  const record = join(dir, 'content/features/native.yml');
  writeFileSync(record, readFileSync(record, 'utf8').replace('state: measured', 'state: building'));
  assert.match(verify(dir).stderr, /features\.json is stale/);
});

test('featuresJson lists public records by id', () => {
  const { records } = readRecords([rec('b'), rec('a')]);
  assert.deepEqual(JSON.parse(featuresJson(records)).features.map((f) => f.id), ['a', 'b']);
});
