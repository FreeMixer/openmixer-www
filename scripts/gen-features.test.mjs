// SPDX-License-Identifier: GPL-3.0-or-later
// Proves the feature generator refuses what it guards: an invalid record, a page row without a
// record, a typed state, a hand-edited or stale generated file. Run: node --test scripts/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MARK, featuresJson, pageProblems, publicDocs, readRecords } from './gen-features.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const rec = (id, extra = '') => ({
  file: `content/features/${id}.yml`,
  text: `id: ${id}\ntitle: T ${id}\nstate: live\nconfirmed: true\nmanual:\n  - docs/manual/${id}.md\npublic: true\n${extra}`,
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
  symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'));
  cpSync(join(root, 'package.json'), join(dir, 'package.json'));
  cpSync(join(root, 'content/features'), join(dir, 'content/features'), { recursive: true });
  cpSync(join(root, 'app/data/features.json'), join(dir, 'app/data/features.json'));
  cpSync(join(root, 'app/data/feature-cards.json'), join(dir, 'app/data/feature-cards.json'));
  cpSync(join(root, 'app/pages'), join(dir, 'app/pages'), { recursive: true });
  cpSync(join(root, 'app/components'), join(dir, 'app/components'), { recursive: true });
  cpSync(join(root, 'content/technical-notes'), join(dir, 'content/technical-notes'), { recursive: true });
  cpSync(join(root, 'i18n/locales'), join(dir, 'i18n/locales'), { recursive: true });
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

// ---- the selling points: one source, in the records -------------------------------------------------------

import { cardProblems, cardsJson, detailProblems, handTextProblems } from './gen-features.mjs';

const card = (over = {}) => ({
  id: 'x',
  card: { en: { title: 'A title', line: 'A line.', text: 'A longer paragraph here.' }, ca: { title: 'Un títol', line: 'Una línia.', text: 'Un paràgraf més llarg aquí.' } },
  surfaces: { console: { state: 'none' }, zynthian: { state: 'released', version: 'plugin-hostd 0.19.0' }, libraries: { state: 'none' } },
  detail: '/notes/a-note',
  proof: [],
  ...over,
});
const probs = (r) => cardProblems('content/features/x.yml', r).join('\n');

test('a valid card reads clean', () => assert.equal(probs(card()), ''));

test('each bad card is refused', () => {
  assert.match(probs(card({ card: { en: card().card.en } })), /card has no ca/);
  assert.match(probs(card({ card: { ...card().card, ca: { ...card().card.ca, line: ' ' } } })), /card\.ca\.line is empty/);
  assert.match(probs(card({ surfaces: { ...card().surfaces, zynthian: { state: 'released' } } })), /released and names no version/);
  assert.match(probs(card({ surfaces: { ...card().surfaces, zynthian: { state: 'done' } } })), /state must be one of/);
  assert.match(probs(card({ surfaces: { ...card().surfaces, zynthian: { state: 'none' } } })), /every surface is none/);
  assert.match(probs(card({ detail: 'https://x.org' })), /detail must be/);
  const bench = (p) => probs(card({ proof: [{ kind: 'bench', with: 'plugin-hostd 0.18.0', rate: '48 kHz', en: '6 % load', ca: '6 % de càrrega', ...p }] }));
  assert.equal(bench({}), '');
  assert.match(bench({ rate: undefined }), /names no rate/);
  assert.match(bench({ with: 'plugin-hostd' }), /names no versions/);
  assert.match(bench({ en: '6 % load against mod-host' }), /names only one of mod-host and jalv/);
  assert.match(bench({ en: '6 % against mod-host and jalv', with: 'plugin-hostd 0.18.0' }), /must name the mod-host and jalv versions/);
  assert.equal(bench({ en: '6 % against mod-host. jalv was not measured', ca: '6 % contra mod-host. jalv no s\'ha mesurat', with: 'mod-host v0.10.6' }), '');
  assert.match(bench({ en: '6 % against mod-host. jalv was not measured', ca: '6 % contra mod-host. jalv no s\'ha mesurat', with: 'plugin-hostd 0.18.0' }), /must name/);
  assert.equal(bench({ en: '6 % against mod-host and jalv', ca: '6 % contra mod-host i jalv', with: 'mod-host 0.10.9, jalv 1.6.9' }), '');
});

test('card text written by hand outside the records is refused', () => {
  const { records } = readRecords([{ file: 'content/features/x.yml', text: `id: x\ntitle: X\nmanual: []\npublic: false\nsurfaces:\n  console: {state: none}\n  zynthian: {state: released, version: plugin-hostd 0.19.0}\n  libraries: {state: none}\ndetail: /notes/a-note\ncard:\n  en: {title: A title here, line: A line of words., text: A longer paragraph here.}\n  ca: {title: Un títol aquí, line: Una línia de paraules., text: Un paràgraf més llarg aquí.}\nproof: []\n` }]);
  assert.equal(handTextProblems(records, [{ file: 'app/pages/x.vue', text: '<p>nothing</p>' }]).length, 0);
  assert.match(handTextProblems(records, [{ file: 'app/pages/x.vue', text: '<p>A longer paragraph here.</p>' }]).join(), /repeats card\.en\.text of the record x/);
  assert.match(handTextProblems(records, [{ file: 'i18n/locales/ca/m.json', text: '{"a":"Una línia de paraules."}' }]).join(), /repeats card\.ca\.line/);
  const read = JSON.stringify({ docsZynthian: { read: { title: 'T', bench: { title: 'b', body: 'c' } } } });
  assert.match(handTextProblems(records, [{ file: 'i18n/locales/en/docsZynthian.json', text: read }]).join(), /hand-written card/);
});

test('a detail link must reach a page', () => {
  const r = [{ id: 'x', card: {}, detail: '/notes/gone' }];
  assert.match(detailProblems(r, () => false).join(), /not a page of the site/);
  assert.deepEqual(detailProblems(r, () => true), []);
});

test('the cards file carries the cards only', () => {
  const out = JSON.parse(cardsJson([{ id: 'a', title: 'A', state: 'live', public: true, confirmed: false }, { ...card(), id: 'b' }]));
  assert.deepEqual(out.cards.map((c) => c.id), ['b']);
});

test('--verify on the tree: hand-written card text in a page or a message file is red, a hand edit of the cards file is red', () => {
  const dir = tree();
  assert.equal(verify(dir).status, 0, verify(dir).stderr);
  const rec = readFileSync(join(dir, 'content/features/crash-isolation.yml'), 'utf8');
  const line = /line: (.+)/.exec(rec)[1];
  const msg = join(dir, 'i18n/locales/en/docsZynthian.json');
  const original = readFileSync(msg, 'utf8');
  writeFileSync(msg, original.replace('"read": {', `"read": {\n      "copy": ${JSON.stringify(line)},`));
  assert.match(verify(dir).stderr, /repeats card\.en\.line of the record crash-isolation/);
  writeFileSync(msg, original);
  const page = join(dir, 'app/pages/zynthian.vue');
  const pageText = readFileSync(page, 'utf8');
  writeFileSync(page, pageText.replace('<div>', `<div><p>${line}</p>`));
  assert.match(verify(dir).stderr, /repeats card\.en\.line/);
  writeFileSync(page, pageText);
  const cards = join(dir, 'app/data/feature-cards.json');
  writeFileSync(cards, readFileSync(cards, 'utf8').replace('"released"', '"merged"'));
  assert.match(verify(dir).stderr, /feature-cards\.json is stale or was edited by hand/);
});
