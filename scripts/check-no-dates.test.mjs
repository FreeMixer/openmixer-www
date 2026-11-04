// SPDX-License-Identifier: GPL-3.0-or-later
// Proves the no-dates guard sees each kind of date in the text, leaves the footer data alone,
// and passes the site as it is.
// Run: node --test scripts/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { check, datesIn, messages, noteText } from './check-no-dates.mjs';

test('each kind of date is caught, in English and in Catalan', () => {
  for (const s of ['in October 2026', '2 November', 'del novembre del 2026', "2 d'octubre", 'run of 2026-10-29', 'since 2025', 'on 3 May 2026', 'March 5'])
    assert.ok(datesIn(s).length, s);
});

test('versions, counts and the verb may are not dates', () => {
  for (const s of ['plugin-hostd 0.15.9', '2000 Hz', '1602 plugins', 'it may run', 'package 2026110101'])
    assert.deepEqual(datesIn(s), [], s);
});

test('a note keeps its date in measured: only', () => {
  const note = '---\ntitle: T\nsummary: S\nmeasured: Pi 5, October 2026\n---\nBody.\n\n```\n2026-10-01\n```\n';
  assert.deepEqual(datesIn(noteText(note)), []);
  assert.equal(datesIn(noteText(note.replace('Body.', 'Body of October 2026.'))).length, 2);
});

test('a footer key is data, any other key is text', () => {
  const found = [...messages({ a: { footer: 'on 2 November 2026', intro: 'fine' } })];
  assert.deepEqual(found, [['a.intro', 'fine']]);
});

test('a sample tree with a date in a message, a note and a template fails; the footer passes', () => {
  const root = mkdtempSync(join(tmpdir(), 'nodates-'));
  for (const d of ['content/technical-notes', 'i18n/locales/en', 'app/pages']) mkdirSync(join(root, d), { recursive: true });
  writeFileSync(join(root, 'content/technical-notes/a.en.md'), '---\ntitle: T\nsummary: S\nmeasured: October 2026\n---\nRead in October 2026.\n');
  writeFileSync(join(root, 'i18n/locales/en/x.json'), JSON.stringify({ intro: 'With the packages of November 2026', footer: '2 November 2026' }));
  writeFileSync(join(root, 'app/pages/p.vue'), '<template><p>Since 2026-10-01</p><!-- 2026 --></template>');
  const found = check(root);
  assert.ok(found.some((f) => f.includes('a.en.md')) && found.some((f) => f.includes('x.json (intro)')) && found.some((f) => f.includes('p.vue')));
  assert.ok(!found.some((f) => f.includes('footer')));
});

test('the site as it is has no dates in its text', () => {
  assert.deepEqual(check(new URL('..', import.meta.url).pathname), []);
});
