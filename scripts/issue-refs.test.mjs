// SPDX-License-Identifier: GPL-3.0-or-later
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { scrubIssueRefs, findIssueRefs, redactDir, ISSUE_REFS } from './issue-refs.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ref = (n) => `${['open', 'mixer'].join('')}#${n}`;

test('a reference goes, with its separator, and the sentence still reads', () => {
  assert.equal(scrubIssueRefs(`erases a leg (settle #144, ${ref(182)}). Handing`), 'erases a leg (settle #144). Handing');
  assert.equal(scrubIssueRefs(`(channel-contract spec, revision 8; ${ref(1989)}).`), '(channel-contract spec, revision 8).');
  assert.equal(scrubIssueRefs(`(${ref(2134)} audit row 4). The test`), '(audit row 4). The test');
  assert.equal(scrubIssueRefs(`(${ref(2134)} audit rows 1 and 3)`), '(audit rows 1 and 3)');
  assert.equal(scrubIssueRefs('nothing to strip here #12'), 'nothing to strip here #12');
});

test('the shape check sees a reference and not a bare number', () => {
  const [{ re }] = ISSUE_REFS;
  assert.ok(new RegExp(re.source, 'i').test(`see ${ref(5)}`));
  assert.ok(!new RegExp(re.source, 'i').test('see #5'));
});

function tree(content) {
  const dir = mkdtempSync(join(tmpdir(), 'refs-'));
  mkdirSync(join(dir, 'public', 'api-docs'), { recursive: true });
  writeFileSync(join(dir, 'public', 'api-docs', 'a.html'), content);
  return dir;
}

test('the check fails on a tree that carries a reference and passes after redaction', () => {
  const dir = tree(`<p>(${ref(7)} audit row 1)</p>\n`);
  try {
    const run = () => spawnSync('node', [join(here, 'issue-refs.mjs'), 'check', join(dir, 'public')], { encoding: 'utf8' });
    assert.equal(run().status, 1);
    assert.equal(findIssueRefs([join(dir, 'public')]).length, 1);
    assert.equal(redactDir(join(dir, 'public', 'api-docs')), 1);
    assert.equal(readFileSync(join(dir, 'public', 'api-docs', 'a.html'), 'utf8'), '<p>(audit row 1)</p>\n');
    assert.equal(run().status, 0);
  } finally { rmSync(dir, { recursive: true }); }
});

test('a missing directory is a failure, not a pass', () => {
  const r = spawnSync('node', [join(here, 'issue-refs.mjs'), 'check', join(tmpdir(), 'no-such-dir-refs')], { encoding: 'utf8' });
  assert.equal(r.status, 2);
});

test('the committed public tree carries no reference', () => {
  const r = spawnSync('node', [join(here, 'issue-refs.mjs'), 'check'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
});
