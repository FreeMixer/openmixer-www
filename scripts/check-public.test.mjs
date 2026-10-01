// SPDX-License-Identifier: GPL-3.0-or-later
// Proves the guard sees each thing it claims to catch, and passes a clean page.
// Run: node --test scripts/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FORBIDDEN, scanDir, scanText } from './check-public.mjs';

/** One sample per pattern, as it appeared in the leaked bundle. */
const SAMPLES = {
  'home directory': 'see /home/pau/Devel/audio/reac-pw',
  'CLAUDE.md': 'the notes in CLAUDE.md say',
  '.claude/ directory': 'wired in .claude/settings.local.json',
  'internal domain 0cs.lan': 'ssh r1.0cs.lan',
  tecman: 'mail pau@Tecman.eu',
  'desk host name msi': '"host": "msi"',
  'private address 192.168.x.x': 'box at 192.168.1.40',
  'private address 10.x.x.x': 'gateway 10.0.0.1',
  claude: 'ghcr.io/zerosignage/claude-worker',
  anthropic: 'api.anthropic.com',
};

test('every forbidden pattern has a sample, and each sample is caught by its own pattern', () => {
  assert.deepEqual(Object.keys(SAMPLES).sort(), FORBIDDEN.map((f) => f.name).sort());
  for (const [name, text] of Object.entries(SAMPLES)) {
    assert.ok(scanText(text).some((h) => h.name === name), `${name} not caught in ${JSON.stringify(text)}`);
  }
});

test('ordinary site text passes', () => {
  const clean = [
    'OpenMixer is a digital mixing console on Linux.',
    'Version 0.10.6, sample rate 96 kHz, 2.10.4.1 is a version, not an address.',
    'class="rounded-r1 admin"',
    'Install with dnf install openmixer',
  ].join('\n');
  assert.deepEqual(scanText(clean), []);
});

test('a private design page dropped into the output turns the directory red', () => {
  const dir = mkdtempSync(join(tmpdir(), 'check-public-'));
  try {
    mkdirSync(join(dir, 'docs/manual'), { recursive: true });
    writeFileSync(join(dir, 'docs/manual/index.html'), '<h1>Operator manual</h1>');
    assert.equal(scanDir(dir).hits.length, 0);
    mkdirSync(join(dir, '_docs_nuxt'), { recursive: true });
    writeFileSync(
      join(dir, '_docs_nuxt/chunk.js'),
      'const a="# HANDOVER - overnight run; msi clone at /home/pau/Devel/audio, see CLAUDE.md";',
    );
    const { hits } = scanDir(dir);
    assert.deepEqual([...new Set(hits.map((h) => h.name))].sort(), ['CLAUDE.md', 'claude', 'desk host name msi', 'home directory'].sort());
    assert.ok(hits.every((h) => h.file === '_docs_nuxt/chunk.js'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
