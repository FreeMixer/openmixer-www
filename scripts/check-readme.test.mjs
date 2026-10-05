// SPDX-License-Identifier: GPL-3.0-or-later
// Proves the README guard sees each build command it claims to catch, passes install lines
// and prose, and passes the README as it is.
// Run: node --test scripts/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BUILD, scanText } from './check-readme.mjs';

/** One sample per pattern, as a README would carry it. */
const SAMPLES = {
  npm: '```\nnpm install\nnpm run generate\n```',
  nuxt: 'Preview with `npx nuxi dev`.',
  make: '```\n$ make\n```',
  meson: '```\nmeson setup build && ninja -C build\n```',
  cmake: '```\ncmake -B build\n```',
  ninja: '```\ncd build; ninja\n```',
  rpmbuild: '```\nrpmbuild -ba openmixer.spec\n```',
};

test('every build pattern has a sample, and each sample is caught by its own pattern', () => {
  assert.deepEqual(Object.keys(SAMPLES).sort(), BUILD.map((b) => b.name).sort());
  for (const [name, text] of Object.entries(SAMPLES)) {
    assert.ok(scanText(text).some((h) => h.name === name), `${name} not caught in ${JSON.stringify(text)}`);
  }
});

test('install lines and prose pass', () => {
  const clean = [
    'To make a mix you build it from strips; npm run generate in prose is not code.',
    '```',
    'sudo dnf config-manager addrepo --from-repofile=https://freemixer.github.io/rpm/freemixer.repo',
    'sudo dnf install plugin-hostd omx-clap-host',
    '```',
    'then `sudo apt install plugin-hostd omx-clap-host`. Building from source: see [BUILDING.md](BUILDING.md).',
  ].join('\n');
  assert.deepEqual(scanText(clean), []);
});

test('the README carries no build command', () => {
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  assert.deepEqual(scanText(readme), []);
});

test('BUILDING.md does carry them, so the guard is not blind to this repo\'s commands', () => {
  const building = readFileSync(new URL('../BUILDING.md', import.meta.url), 'utf8');
  assert.ok(scanText(building).some((h) => h.name === 'npm'));
});
