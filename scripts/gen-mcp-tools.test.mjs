// SPDX-License-Identifier: GPL-3.0-or-later
// Proves /docs/mcp publishes only what deploy/public-mcp.txt names: the committed table holds no
// other row, the generator drops a tool the list does not name, and a list that names a row the
// registry no longer has is refused.
// Run: node --test scripts/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIST_ENV } from './private-list.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

/** deploy/public-mcp.txt as { tools, env }. */
function publicList(file = join(root, 'deploy/public-mcp.txt')) {
  const out = { tool: new Set(), env: new Set() };
  for (const raw of readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;
    const [kind, name] = line.split(/\s+/);
    out[kind].add(name);
  }
  return { tools: out.tool, env: out.env };
}

/** The rows a table carries that the list does not name. */
function unlisted(table, list) {
  return [
    ...table.tools.filter((t) => !list.tools.has(t.name)).map((t) => t.name),
    ...table.env.filter((v) => !list.env.has(v.name)).map((v) => v.name),
  ];
}

test('the committed MCP table holds only the rows deploy/public-mcp.txt names', () => {
  const table = JSON.parse(readFileSync(join(root, 'app/data/mcp-tools.json'), 'utf8'));
  const list = publicList();
  assert.deepEqual(unlisted(table, list), []);
  assert.equal(table.meta.toolCount, table.tools.length);
  assert.ok(table.tools.length > 0);
});

test('a development tool in the table is caught', () => {
  const table = JSON.parse(readFileSync(join(root, 'app/data/mcp-tools.json'), 'utf8'));
  table.tools.push({ name: 'bulk_read', family: 'decisions', args: [], writes: false, effect: '', answers: '' });
  assert.deepEqual(unlisted(table, publicList()), ['bulk_read']);
});

/** Run the generator on a README with `tools` rows and one env row, against `list` as the public list. */
function generate(tools, list) {
  const dir = mkdtempSync(join(tmpdir(), 'gen-mcp-'));
  try {
    const src = join(dir, 'checkout');
    mkdirSync(join(src, 'packages/mcp-server'), { recursive: true });
    writeFileSync(
      join(src, 'packages/mcp-server/README.md'),
      [
        '<!-- tools:begin -->', '| tool | family | args | effect | answers |', '|---|---|---|---|---|',
        ...tools.map((t) => `| \`${t}\` | console | — | reads | what ${t} answers |`),
        '<!-- tools:end -->', '', '## Running it', '', '| variable | meaning | default |', '|---|---|---|',
        '| `OPENMIXER_CONSOLE` | the console | http://127.0.0.1:8080 |', '| `OPENMIXER_WORKER_URL` | a worker | unset |', '', '## Next', '',
      ].join('\n'),
    );
    const guard = join(dir, 'guard.json');
    writeFileSync(guard, JSON.stringify({ forbidden: [{ name: 'm', pattern: 'zq-marker' }], exclude: [], redactions: [], survivors: [] }));
    writeFileSync(join(dir, 'public-mcp.txt'), list);
    const out = join(dir, 'mcp-tools.json');
    const r = spawnSync('node', [join(here, 'gen-mcp-tools.mjs')], {
      encoding: 'utf8',
      env: { ...process.env, [LIST_ENV]: guard, OPENMIXER_SRC: src, MCP_TOOLS_OUT: out, MCP_PUBLIC_LIST: join(dir, 'public-mcp.txt') },
    });
    return { r, table: r.status === 0 ? JSON.parse(readFileSync(out, 'utf8')) : null };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('the generator publishes a listed tool and keeps an unlisted one off the page', () => {
  const { r, table } = generate(['console_get', 'bulk_read'], 'tool console_get\nenv OPENMIXER_CONSOLE\n');
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(table.tools.map((t) => t.name), ['console_get']);
  assert.deepEqual(table.env.map((v) => v.name), ['OPENMIXER_CONSOLE']);
  assert.equal(table.meta.toolCount, 1);
  assert.doesNotMatch(JSON.stringify(table), /bulk_read|OPENMIXER_WORKER_URL/);
});

test('the generator refuses a list that names a tool the registry does not have', () => {
  const { r } = generate(['console_get'], 'tool console_get\ntool console_gone\n');
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /names rows the README does not have: tool console_gone/);
});

test('the generator refuses a list line it cannot read', () => {
  const { r } = generate(['console_get'], 'console_get\n');
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /a line is "tool <name>" or "env <NAME>"/);
});
