// SPDX-License-Identifier: GPL-3.0-or-later
// Proves the REST generator tells a checkout that cannot produce the reference from a machine
// with no checkout: the first is refused, naming what to run; only the second keeps the snapshot.
// Run: node --test scripts/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = join(dirname(fileURLToPath(import.meta.url)), 'gen-rest-reference.mjs');

function run(src) {
  return spawnSync('node', [script], { env: { ...process.env, OPENMIXER_SRC: src }, encoding: 'utf8' });
}

/** A checkout as far as the generator can tell: message-code.ts, and the named extras. */
function checkout(files) {
  const dir = mkdtempSync(join(tmpdir(), 'gen-rest-'));
  for (const f of ['packages/core/src/message-code.ts', ...files]) {
    mkdirSync(dirname(join(dir, f)), { recursive: true });
    writeFileSync(join(dir, f), '');
  }
  return dir;
}

test('no checkout at all keeps the committed snapshot', () => {
  const r = run(join(tmpdir(), 'no-openmixer-checkout-here'));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /keeping the committed snapshot/);
});

test('a checkout without core built is refused, naming the build', () => {
  const dir = checkout(['generated/engine-ui-rows.json']);
  try {
    const r = run(dir);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /packages\/core\/dist\/index\.js.*@freemixer\/server\.\.\." build/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a checkout without the row corpus is refused, naming the corpus command', () => {
  const dir = checkout(['packages/core/dist/index.js']);
  try {
    const r = run(dir);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /generated\/engine-ui-rows\.json.*pnpm --filter @freemixer\/server corpus/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
