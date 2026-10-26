// SPDX-License-Identifier: GPL-3.0-or-later
// Proves the guard sees what its list names, passes a clean page, and refuses to run without
// a list. The real list is private and is tested where it lives; these tests hand the guard a
// neutral list of planted markers, so they run anywhere and skip nothing.
// Run: node --test scripts/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanDir, scanText } from './check-public.mjs';
import { loadPrivateList, listPath, DEFAULT_LIST, LIST_ENV, PrivateListError } from './private-list.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, 'check-public.mjs');

/** A list in the private list's shape, holding only made-up markers. */
const SYNTHETIC = {
  forbidden: [
    { name: 'marker alpha', pattern: 'zq-alpha-marker' },
    { name: 'marker beta', pattern: 'BETA\\.notes', flags: 'i' },
    { name: 'marker gamma', pattern: '(?<![A-Za-z0-9_])gmhost(?![A-Za-z0-9_])' },
  ],
  exclude: ['.zq-tooling', 'ZQ-NOTES.md'],
  redactions: [{ pattern: '\\.zq-tooling/[A-Za-z0-9_./-]+', with: 'the tooling documents' }],
  survivors: ['\\.zq-tooling'],
};

/** One sample per synthetic marker. */
const SAMPLES = {
  'marker alpha': 'see zq-alpha-marker/reac-pw',
  'marker beta': 'the notes in beta.NOTES say',
  'marker gamma': '"host": "gmhost"',
};

function withList(content, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'guard-list-'));
  try {
    const path = join(dir, 'list.json');
    if (content !== undefined) writeFileSync(path, typeof content === 'string' ? content : JSON.stringify(content));
    return fn(path, dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const forbidden = () => withList(SYNTHETIC, (path) => loadPrivateList(path).forbidden);

test('every marker of the list is caught by its own pattern', () => {
  const list = forbidden();
  assert.deepEqual(Object.keys(SAMPLES).sort(), list.map((f) => f.name).sort());
  for (const [name, text] of Object.entries(SAMPLES)) {
    assert.ok(scanText(text, list).some((h) => h.name === name), `${name} not caught in ${JSON.stringify(text)}`);
  }
});

test('ordinary site text passes', () => {
  const clean = [
    'OpenMixer is a digital mixing console on Linux.',
    'Version 0.10.6, sample rate 96 kHz.',
    'class="rounded-gmhosting admin"',
    'Install with dnf install openmixer',
  ].join('\n');
  assert.deepEqual(scanText(clean, forbidden()), []);
});

test('scanning with no patterns is an error, not a pass', () => {
  assert.throws(() => scanText('anything', []), /no forbidden patterns/);
  assert.throws(() => scanText('anything'), /no forbidden patterns/);
});

test('a private page dropped into the output turns the directory red', () => {
  const list = forbidden();
  const dir = mkdtempSync(join(tmpdir(), 'check-public-'));
  try {
    mkdirSync(join(dir, 'docs/manual'), { recursive: true });
    writeFileSync(join(dir, 'docs/manual/index.html'), '<h1>Operator manual</h1>');
    assert.equal(scanDir(dir, list).hits.length, 0);
    mkdirSync(join(dir, '_docs_nuxt'), { recursive: true });
    writeFileSync(join(dir, '_docs_nuxt/chunk.js'), 'const a="# HANDOVER - gmhost clone at zq-alpha-marker/audio";');
    const { hits } = scanDir(dir, list);
    assert.deepEqual([...new Set(hits.map((h) => h.name))].sort(), ['marker alpha', 'marker gamma']);
    assert.ok(hits.every((h) => h.file === '_docs_nuxt/chunk.js'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** Run the guard on a one-file site, with PUBLIC_GUARD_LIST set to `listFile`. */
function runGuard(listFile, pageText) {
  const site = mkdtempSync(join(tmpdir(), 'check-public-site-'));
  try {
    writeFileSync(join(site, 'index.html'), pageText);
    return spawnSync('node', [script, site], { encoding: 'utf8', env: { ...process.env, [LIST_ENV]: listFile } });
  } finally {
    rmSync(site, { recursive: true, force: true });
  }
}

test('the command: a hit fails with 1 and names the marker', () => {
  withList(SYNTHETIC, (path) => {
    const r = runGuard(path, '<p>built on gmhost</p>');
    assert.equal(r.status, 1, r.stderr);
    assert.match(r.stderr, /\[marker gamma\]/);
  });
});

test('the command: a clean site passes with 0', () => {
  withList(SYNTHETIC, (path) => {
    const r = runGuard(path, '<p>OpenMixer</p>');
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /clean: 1 text files/);
  });
});

test('the command: a missing list fails closed with 3', () => {
  withList(undefined, (path) => {
    const r = runGuard(path, '<p>OpenMixer</p>');
    assert.equal(r.status, 3, r.stdout + r.stderr);
    assert.match(r.stderr, /pattern list not reachable/);
  });
});

test('the command: a list that forbids nothing, or is not JSON, fails closed with 3', () => {
  withList({ ...SYNTHETIC, forbidden: [] }, (path) => {
    const r = runGuard(path, '<p>OpenMixer</p>');
    assert.equal(r.status, 3, r.stdout + r.stderr);
    assert.match(r.stderr, /forbids nothing/);
  });
  withList('{ not json', (path) => {
    const r = runGuard(path, '<p>OpenMixer</p>');
    assert.equal(r.status, 3, r.stdout + r.stderr);
    assert.match(r.stderr, /not readable JSON/);
  });
});

test('the list loader refuses every malformed list', () => {
  const bad = [
    [{ ...SYNTHETIC, exclude: undefined }, /no "exclude" array/],
    [{ ...SYNTHETIC, forbidden: [{ pattern: 'x' }] }, /no name/],
    [{ ...SYNTHETIC, forbidden: [{ name: 'x', pattern: '(' }] }, /forbidden\[0\]/],
    [{ ...SYNTHETIC, exclude: ['a/b'] }, /not a top-level path/],
    [{ ...SYNTHETIC, redactions: [{ pattern: 'x' }] }, /no "with"/],
  ];
  for (const [content, message] of bad) {
    withList(content, (path) =>
      assert.throws(() => loadPrivateList(path), (e) => e instanceof PrivateListError && message.test(e.message)),
    );
  }
});

test('redactions always replace every occurrence', () => {
  withList({ ...SYNTHETIC, redactions: [{ pattern: 'zq', flags: 'i', with: '-' }] }, (path) => {
    const [r] = loadPrivateList(path).redactions;
    assert.equal('ZQ zq'.replace(r.re, r.with), '- -');
  });
});

test('the list path: the environment variable wins, else the sibling ops checkout', () => {
  assert.equal(listPath({ [LIST_ENV]: '/some/where.json' }), '/some/where.json');
  assert.equal(listPath({}), resolve(here, '..', DEFAULT_LIST));
});

test('the docs build refuses to stage a tree without the list', () => {
  withList(undefined, (path, dir) => {
    const r = spawnSync('node', [join(here, 'build-docs-tree.mjs'), '--emit', join(dir, 'tree.tar.gz')], {
      encoding: 'utf8',
      env: { ...process.env, [LIST_ENV]: path, OPENMIXER_SRC: join(dir, 'no-checkout'), DOCS_TREE: '' },
    });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stderr, /pattern list not reachable/);
  });
});

test('the MCP table generator refuses to run without the list', () => {
  withList(undefined, (path, dir) => {
    const src = join(dir, 'checkout');
    mkdirSync(join(src, 'packages/mcp-server'), { recursive: true });
    writeFileSync(join(src, 'packages/mcp-server/README.md'), '<!-- tools:begin -->\n<!-- tools:end -->\n');
    const r = spawnSync('node', [join(here, 'gen-mcp-tools.mjs')], {
      encoding: 'utf8',
      env: { ...process.env, [LIST_ENV]: path, OPENMIXER_SRC: src },
    });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stderr, /pattern list not reachable/);
  });
});

/** Run the MCP table generator on a README holding one tool row whose answer is `answer`. */
function runMcp(list, answer) {
  return withList(list, (path, dir) => {
    const src = join(dir, 'checkout');
    mkdirSync(join(src, 'packages/mcp-server'), { recursive: true });
    writeFileSync(
      join(src, 'packages/mcp-server/README.md'),
      ['<!-- tools:begin -->', '| tool | family | args | effect | answers |', '|---|---|---|---|---|',
        `| \`rules\` | design | — | reads | ${answer} |`, '<!-- tools:end -->', ''].join('\n'),
    );
    const out = join(dir, 'mcp-tools.json');
    writeFileSync(join(dir, 'public-mcp.txt'), 'tool rules\n');
    const r = spawnSync('node', [join(here, 'gen-mcp-tools.mjs')], {
      encoding: 'utf8',
      env: { ...process.env, [LIST_ENV]: path, OPENMIXER_SRC: src, MCP_TOOLS_OUT: out, MCP_PUBLIC_LIST: join(dir, 'public-mcp.txt') },
    });
    return { r, json: r.status === 0 ? readFileSync(out, 'utf8') : null };
  });
}

test('the MCP table generator applies the list\'s redactions', () => {
  const { r, json } = runMcp(SYNTHETIC, 'the rows of .zq-tooling/spec-map.txt');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(json, /the rows of the tooling documents/);
  assert.doesNotMatch(json, /zq-tooling/);
});

test('the MCP table generator refuses a value the list says must not survive', () => {
  const { r } = runMcp({ ...SYNTHETIC, redactions: [] }, 'the rows of .zq-tooling/spec-map.txt');
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /survived redaction/);
});
