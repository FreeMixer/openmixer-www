#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Builds the plugin catalog's data from the qualification records of FreeMixer/omx-qualification-records,
// at the commit plugin-catalog/pin.json names. Nothing is typed by hand: every figure is read from a
// record, its probe output or its set's provenance.json, and a shape this script does not know is
// refused rather than guessed.
//
//   node scripts/plugin-catalog-from-records.mjs                 write the data from the pinned commit
//   node scripts/plugin-catalog-from-records.mjs --sync <commit>  move the pin to <commit>, then write the data
//   node scripts/plugin-catalog-from-records.mjs --verify         the committed data is what the pinned commit gives
//   ... --records <dir>   read a local checkout of the records repository instead of downloading the commit;
//                         its HEAD must be the pinned commit (or the one given to --sync)
//
// Output (committed, read by the /plugins/ page):
//   app/data/plugin-catalog/index.json              one entry per platform: counts, provenance, where its rows are
//   app/data/plugin-catalog/platforms/<id>.json     one row per plugin of that platform, loaded when the page asks
//
// A platform is a set under records/<host class>/<set>/. A plugin has one record per offer (`default`, and for
// CLAP plugins `custom`); the plugin's row holds the best of them:
//   accepted     offered on a tier whose verdict qualified
//   conditional  offered, but only on a tier that did not qualify (it runs in a process of its own)
//   refused      offered on no tier; the first reason of the record's `dimmed` line is its reason

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PIN = join(root, 'plugin-catalog/pin.json');
export const OUT = join(root, 'app/data/plugin-catalog');
const TARBALL = 'https://codeload.github.com/FreeMixer';
export const SCHEMA_VERSION = 2;

const RECORD = '.qualification.json';
const RECORD_SCHEMA = 'plugin-qualify.qualification-record/1';
const PROVENANCE_SCHEMA = 'plugin-qualify.distributed-provenance/1';
const TIER_KEY = { 'in-process': 'inProcess', isolated: 'isolated' };
export const VERDICTS = ['accepted', 'conditional', 'refused'];
const RANK = { accepted: 0, conditional: 1, refused: 2 };
/** The provenance fields the page shows as the conditions of the run, when the set names them. */
const CONDITIONS = ['image', 'board', 'kernel', 'hostProfile', 'grid', 'realtime', 'jack'];

const fail = (where, why) => {
  throw new Error(`${where}: ${why}`);
};

/** The bundle a plugin's binary lives in: the `.clap` directory or file, else the binary's own file name. */
export function bundleOf(path) {
  const parts = path.split('/').filter(Boolean);
  return parts.find((p) => p.endsWith('.clap')) ?? parts[parts.length - 1];
}

/** `host: code; host: code` as [{host, code}]. */
export function parseDimmed(line) {
  return line.split(';').map((part) => {
    const m = /^\s*([^:\s]+):\s*(\S+)\s*$/.exec(part);
    if (!m) fail('tiers.dimmed', `cannot read ${JSON.stringify(part)}`);
    return { host: m[1], code: m[2] };
  });
}

/** The verdict one record gives its plugin, and the reason behind it. */
export function recordVerdict(rec, where) {
  const tiers = rec.tiers;
  const offered = tiers?.offeredOn;
  if (!Array.isArray(offered)) fail(where, 'tiers.offeredOn is not a list');
  for (const t of offered) if (!(t in TIER_KEY)) fail(where, `offered on the unknown tier ${JSON.stringify(t)}`);
  if (offered.length === 0) {
    if (typeof tiers.dimmed !== 'string') fail(where, 'offered nowhere and no tiers.dimmed line says why');
    return { verdict: 'refused', tiers: [], reason: parseDimmed(tiers.dimmed)[0].code };
  }
  const detail = offered.map((t) => tiers[TIER_KEY[t]] ?? fail(where, `offered on ${t} with no ${TIER_KEY[t]} verdict`));
  if (detail.some((d) => d.qualified === true)) return { verdict: 'accepted', tiers: [...offered], reason: null };
  const open = detail.find((d) => typeof d.deciding === 'string');
  if (!open) fail(where, 'offered without qualifying and no deciding reason');
  return { verdict: 'conditional', tiers: [...offered], reason: open.deciding };
}

/** The reasons of every host's verdict, one entry per distinct reason with the hosts that gave it. */
export function mergeReasons(verdicts) {
  const merged = new Map();
  for (const v of verdicts) {
    for (const r of v.reasons ?? []) {
      const entry = { dimension: r.dimension ?? null, rating: r.rating ?? null, code: r.code, params: r.params ?? {} };
      const key = JSON.stringify(entry);
      const hit = merged.get(key);
      if (hit) hit.hosts.push(v.host);
      else merged.set(key, { ...entry, hosts: [v.host] });
    }
  }
  return [...merged.values()];
}

/** The first grid cell that measured something, as { rate, quantum, ... }. */
function cells(rec, probe, where) {
  const out = { cpu: null, latency: null };
  for (const g of rec.measurements?.grid ?? []) {
    if (g.outcome !== 'probe.ok') continue;
    const c = g.cost;
    if (c && out.cpu === null) {
      const pg = (probe.grid ?? []).find((x) => x.rate === g.rate && x.quantum === g.quantum);
      if (pg?.cost?.unit !== 'ns-per-sample') fail(where, `its cost at ${g.rate}/${g.quantum} is not stated in ns-per-sample by the probe output`);
      if (!(c.percentile?.p === 95)) fail(where, 'its cost has no 95th percentile');
      out.cpu = { rate: g.rate, quantum: g.quantum, median: c.median, p95: c.percentile.value };
    }
    const l = g.latency;
    if (l && out.latency === null && Number.isFinite(l.measuredFrames) && Number.isFinite(l.declaredFrames)) {
      out.latency = { rate: g.rate, quantum: g.quantum, declared: l.declaredFrames, measured: l.measuredFrames };
    }
  }
  return out;
}

/** Reads one set directory: its provenance and one row per plugin. */
export function readSet(dir, label) {
  const prov = JSON.parse(readFileSync(join(dir, 'provenance.json'), 'utf8'));
  if (prov.schema !== PROVENANCE_SCHEMA) fail(label, `provenance schema is ${JSON.stringify(prov.schema)}`);
  if (!prov.measured || !prov.hostClass || !prov.set) fail(label, 'provenance names no measured day, host class or set');
  const byPlugin = new Map();
  let records = 0;
  for (const name of readdirSync(dir).filter((n) => n.endsWith(RECORD)).sort()) {
    const where = `${label}/${name}`;
    const rec = JSON.parse(readFileSync(join(dir, name), 'utf8'));
    if (rec.schema !== RECORD_SCHEMA) fail(where, `schema is ${JSON.stringify(rec.schema)}`);
    const probe = JSON.parse(readFileSync(join(dir, rec.probe.file), 'utf8'));
    const offer = name.slice(0, -RECORD.length).split('.').pop();
    const { verdict, tiers, reason } = recordVerdict(rec, where);
    const key = `${rec.plugin.format}\u0000${rec.plugin.id}`;
    if (!byPlugin.has(key)) byPlugin.set(key, []);
    byPlugin.get(key).push({ name, rec, probe, offer, verdict, tiers, reason, where });
    records += 1;
  }
  const rows = [...byPlugin.values()].map((group) => {
    // best verdict first; among equals, the record the platform's own host judged, then the default offer
    const host = prov.hostProfile;
    group.sort((a, b) =>
      RANK[a.verdict] - RANK[b.verdict]
      || Number(b.rec.verdicts.some((v) => v.host === host)) - Number(a.rec.verdicts.some((v) => v.host === host))
      || (a.offer === 'default' ? 0 : 1) - (b.offer === 'default' ? 0 : 1)
      || a.name.localeCompare(b.name));
    const best = group[0];
    const { rec } = best;
    let measured = { cpu: null, latency: null };
    for (const g of group) {
      const m = cells(g.rec, g.probe, g.where);
      measured = { cpu: measured.cpu ?? m.cpu, latency: measured.latency ?? m.latency };
    }
    return {
      id: rec.plugin.id,
      format: rec.plugin.format,
      version: rec.testedVersion ?? null,
      binary: bundleOf(rec.binary.path),
      verdict: best.verdict,
      tiers: best.tiers,
      reason: best.reason,
      offers: group.map((g) => ({ offer: g.offer, verdict: g.verdict, reason: g.reason })),
      reasons: mergeReasons(rec.verdicts),
      notMeasured: (rec.notMeasured ?? []).map((n) => n.code),
      cpu: measured.cpu,
      latency: measured.latency,
      measuredAt: rec.measuredAt,
    };
  });
  rows.sort((a, b) => a.format.localeCompare(b.format) || a.id.localeCompare(b.id));
  return { prov, rows, records };
}

const tally = (items) => {
  const out = {};
  for (const x of items) out[x] = (out[x] ?? 0) + 1;
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
};

/** The platform's entry in index.json. */
export function summarise(id, prov, rows, records) {
  const conditions = {};
  for (const k of CONDITIONS) if (typeof prov[k] === 'string') conditions[k] = prov[k];
  const reasons = (v) => tally(rows.filter((r) => r.verdict === v).map((r) => r.reason));
  return {
    id,
    hostClass: prov.hostClass,
    set: prov.set,
    measured: prov.measured,
    package: prov.package ? { name: prov.package.name, version: prov.package.version } : null,
    conditions,
    records,
    tested: rows.length,
    formats: tally(rows.map((r) => r.format)),
    verdicts: Object.fromEntries(VERDICTS.map((v) => [v, rows.filter((r) => r.verdict === v).length])),
    byFormat: Object.fromEntries(
      Object.keys(tally(rows.map((r) => r.format))).map((f) => [f, Object.fromEntries(VERDICTS.map((v) => [v, rows.filter((r) => r.format === f && r.verdict === v).length]))]),
    ),
    reasons: { conditional: reasons('conditional'), refused: reasons('refused') },
  };
}

/** index.json and every platform file, as { path: text }, from a records checkout. */
export function build(recordsDir, pin) {
  const out = {};
  const platforms = [];
  const root0 = join(recordsDir, 'records');
  for (const hostClass of readdirSync(root0).sort()) {
    for (const set of readdirSync(join(root0, hostClass)).sort()) {
      const dir = join(root0, hostClass, set);
      if (!existsSync(join(dir, 'provenance.json'))) continue;
      const id = `${hostClass}-${set}`;
      const { prov, rows, records } = readSet(dir, `${hostClass}/${set}`);
      platforms.push(summarise(id, prov, rows, records));
      out[`platforms/${id}.json`] = `{"schemaVersion":${SCHEMA_VERSION},"platform":${JSON.stringify(id)},"rows":[\n${rows.map((r) => JSON.stringify(r)).join(',\n')}\n]}\n`;
    }
  }
  if (platforms.length === 0) fail(recordsDir, 'holds no record set');
  out['index.json'] = `${JSON.stringify({ schemaVersion: SCHEMA_VERSION, source: { repo: pin.repo, commit: pin.commit }, platforms }, null, 2)}\n`;
  return out;
}

function readPin() {
  const pin = JSON.parse(readFileSync(PIN, 'utf8'));
  if (!/^[0-9a-f]{40}$/.test(pin.commit) || !pin.repo) fail('plugin-catalog/pin.json', 'needs a repo and a full 40-character commit');
  return pin;
}

/** A checkout of the records at a commit: the local one when given (its HEAD must match), else the downloaded tarball. */
function checkout(pin, commit, local) {
  if (local) {
    const head = execFileSync('git', ['-C', local, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    if (head !== commit) fail(local, `is at ${head}, not at ${commit}`);
    return { dir: local, cleanup: () => {} };
  }
  const tmp = mkdtempSync(join(tmpdir(), 'omx-records-'));
  return fetch(`${TARBALL}/${pin.repo}/tar.gz/${commit}`).then(async (res) => {
    if (!res.ok) fail(`${TARBALL}/${pin.repo}/tar.gz/${commit}`, `HTTP ${res.status}`);
    const file = join(tmp, 'records.tar.gz');
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    execFileSync('tar', ['-xzf', file, '-C', tmp, '--strip-components=1', '--wildcards', '*/records/*', '*/README.md'], { stdio: 'ignore' });
    return { dir: tmp, cleanup: () => rmSync(tmp, { recursive: true, force: true }) };
  });
}

function committed() {
  const out = {};
  const walk = (rel) => {
    for (const e of readdirSync(join(OUT, rel), { withFileTypes: true })) {
      const p = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(p);
      else out[p] = readFileSync(join(OUT, p), 'utf8');
    }
  };
  if (existsSync(OUT)) walk('');
  return out;
}

async function main(args) {
  const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
  const local = opt('--records');
  const pin = readPin();
  const sync = args.includes('--sync');
  const verify = args.includes('--verify');
  if (sync && verify) fail('usage', '--sync and --verify do not go together');
  if (sync) {
    const commit = opt('--sync');
    if (!/^[0-9a-f]{40}$/.test(commit ?? '')) fail('usage', '--sync needs a full 40-character commit');
    pin.commit = commit;
  }
  const { dir, cleanup } = await checkout(pin, pin.commit, local);
  try {
    const files = build(dir, pin);
    if (verify) {
      const have = committed();
      let bad = 0;
      for (const p of new Set([...Object.keys(files), ...Object.keys(have)])) {
        if (files[p] !== have[p]) {
          console.error(`[plugin-catalog] app/data/plugin-catalog/${p} is ${p in have ? (p in files ? 'not what' : 'not made by') : 'missing from'} ${pin.repo} at ${pin.commit}`);
          bad = 1;
        }
      }
      if (!bad) console.log(`[plugin-catalog] the data is what ${pin.repo} gives at ${pin.commit}`);
      return bad;
    }
    rmSync(OUT, { recursive: true, force: true });
    for (const [p, text] of Object.entries(files)) {
      mkdirSync(dirname(join(OUT, p)), { recursive: true });
      writeFileSync(join(OUT, p), text);
    }
    if (sync) writeFileSync(PIN, `${JSON.stringify(pin, null, 2)}\n`);
    const idx = JSON.parse(files['index.json']);
    for (const p of idx.platforms) console.log(`[plugin-catalog] ${p.id}: ${p.tested} plugins, ${p.verdicts.accepted} accepted, ${p.verdicts.conditional} with conditions, ${p.verdicts.refused} refused`);
    return 0;
  } finally {
    cleanup();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exit(await main(process.argv.slice(2)));
  } catch (e) {
    console.error(`[plugin-catalog] ${e.message}`);
    process.exit(1);
  }
}
