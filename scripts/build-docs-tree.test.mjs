// SPDX-License-Identifier: GPL-3.0-or-later
//
// The publish half of build-docs-tree.mjs, on a small fixture: a tree it takes, and every tree
// it must refuse. The build half needs the private openmixer checkout and is not run here.
//
// Run: node --test scripts/build-docs-tree.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = resolve(dirname(fileURLToPath(import.meta.url)), 'build-docs-tree.mjs');
const PAGES = ['index.md', 'manual/index.md', 'manual/rta.md', 'architecture/one-summing-bus.md'];

const hashOf = (pages) => createHash('sha256').update(JSON.stringify({ pages: [...pages].sort(), dirs: [], edits: [] })).digest('hex');

function put(root, rel, text) {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), text);
}

/** A generated site, a docs tree and a list; `tweak` changes the tree before the run. */
function fixture({ base = '/', listed = PAGES, built = PAGES, treeBase = '/', tweak = () => {} } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'docs-tree-test-'));
  const dist = join(root, 'dist');
  const tree = join(root, 'tree');
  put(dist, 'index.html', '<html>site</html>');
  put(tree, 'docs-tree.json', JSON.stringify({ revision: 'abc1234', baseURL: treeBase, listHash: hashOf(built) }));
  put(tree, 'public/index.html', '<html>docs home</html>');
  put(tree, 'public/docs/index.html', '<html>docs hub</html>');
  put(tree, 'public/docs/manual/index.html', '<html>manual</html>');
  put(tree, 'public/docs/manual/rta/index.html', '<html>rta</html>');
  put(tree, 'public/docs/architecture/one-summing-bus/index.html', '<html>bus</html>');
  put(tree, 'public/_docs_nuxt/app.js', 'docs app');
  tweak({ dist, tree });
  const list = join(root, 'list.txt');
  writeFileSync(list, `${listed.join('\n')}\n`);
  const run = () =>
    spawnSync('node', [script, dist], {
      encoding: 'utf8',
      env: { ...process.env, DOCS_TREE: tree, PUBLIC_DOCS_LIST: list, NUXT_APP_BASE_URL: base },
    });
  return { root, dist, tree, run };
}

function refused(t, f, pattern) {
  const r = f.run();
  rmSync(f.root, { recursive: true, force: true });
  assert.equal(r.status, 1, `expected a refusal, got ${r.status}: ${r.stdout}${r.stderr}`);
  assert.match(r.stderr, pattern);
}

test('a tree built for this base and this list is published', () => {
  const f = fixture();
  const r = f.run();
  try {
    assert.equal(r.status, 0, r.stderr);
    assert.ok(existsSync(join(f.dist, 'docs/manual/index.html')), 'the manual page is on the site');
    assert.ok(existsSync(join(f.dist, '_docs_nuxt/app.js')), "the docs build's assets are on the site");
    assert.equal(readFileSync(join(f.dist, 'index.html'), 'utf8'), '<html>site</html>', "the site's own home page is kept");
    assert.equal(JSON.parse(readFileSync(join(f.dist, '_docs_nuxt/source.json'), 'utf8')).revision, 'abc1234');
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test('a tree built for another base URL is refused', () => {
  refused(test, fixture({ treeBase: '/openmixer-www/' }), /built for base \/openmixer-www\//);
});

test('a tree built from another list is refused', () => {
  refused(test, fixture({ listed: [...PAGES, 'manual/look.md'] }), /another deploy\/public-docs\.txt/);
});

test('a page the list does not name is refused', () => {
  refused(
    test,
    fixture({ tweak: ({ tree }) => put(tree, 'public/docs/manual/design-notes/index.html', '<html>private</html>') }),
    /not on the list: docs\/manual\/design-notes/,
  );
});

test('a listed page the tree lacks is refused', () => {
  refused(
    test,
    fixture({ tweak: ({ tree }) => rmSync(join(tree, 'public/docs/manual/rta'), { recursive: true }) }),
    /listed page\(s\) are not on the site: docs\/manual\/rta/,
  );
});

test('a file that differs from one of the site is refused, not overwritten', () => {
  refused(test, fixture({ tweak: ({ dist }) => put(dist, '_docs_nuxt/app.js', 'the site own file') }), /COLLISION|exist in both sites/);
});

test('something that is not a docs tree is refused', () => {
  refused(test, fixture({ tweak: ({ tree }) => rmSync(join(tree, 'docs-tree.json')) }), /is not a docs tree/);
});

test('a second publish over the same site is refused', () => {
  const f = fixture();
  try {
    assert.equal(f.run().status, 0);
    const again = f.run();
    assert.equal(again.status, 1);
    assert.match(again.stderr, /already carries a published docs tree/);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});
