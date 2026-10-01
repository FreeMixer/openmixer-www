#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Builds one plugin-catalog run file from a LIVE console: the verdicts its /api/plugins rows
// carry, as they stand, plus the facts those rows do not carry and the machine they run on
// does — the plugin's declared author (lv2info) and the exact package that installed its
// binary (rpm -qf). Nothing is typed by hand: every figure in the output is read from the
// console, lilv or the package database at the moment this runs.
//
// The qualify job (openmixer packages/plugin-qualify) is the real producer of these files;
// this script exists so a run file can be taken from a console that is already serving
// verdicts, in the same shape (plugin-catalog/schema/plugin-catalog.v1.schema.json).
//
//   node scripts/plugin-catalog-from-console.mjs [--console http://127.0.0.1:8800] [--revision <git rev>]
//
// Writes plugin-catalog/runs/<YYYY-MM-DD>.json and prints its path.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const consoleUrl = opt('--console', 'http://127.0.0.1:8800').replace(/\/+$/, '');
const revision = opt('--revision', null);

const texts = JSON.parse(readFileSync(resolve(root, 'plugin-catalog/schema/reason-texts.en.json'), 'utf8'));

async function get(path) {
  const res = await fetch(`${consoleUrl}/api${path}`);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  const body = await res.json();
  if (!body.ok) throw new Error(`${path}: ${JSON.stringify(body).slice(0, 200)}`);
  return body.state;
}

/** lv2info's "Key: value" block for one URI; empty when lilv does not know the plugin. */
function lv2info(uri) {
  let out = '';
  try {
    out = execFileSync('lv2info', [uri], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return {};
  }
  const facts = {};
  for (const line of out.split('\n')) {
    const m = /^\t([A-Za-z ]+):\s+(.*)$/.exec(line);
    if (m && !(m[1] in facts)) facts[m[1]] = m[2].trim();
  }
  return facts;
}

/** The installed package that owns a file, or null when no package does. */
function owningPackage(file) {
  try {
    const out = execFileSync(
      'rpm',
      ['-qf', '--qf', '%{NAME}\\t%{EPOCHNUM}\\t%{VERSION}\\t%{RELEASE}\\t%{ARCH}\\n', file],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    const [name, epoch, version, release, arch] = out.trim().split('\n')[0].split('\t');
    return {
      manager: 'rpm',
      name,
      nevr: `${name}-${epoch}:${version}-${release}`,
      version,
      release,
      arch,
    };
  } catch {
    return null;
  }
}

/**
 * The plugin's KIND, from the class it declares itself. LV2: lv2:InstrumentPlugin is an
 * instrument; the generator and utility branches (analysers, converters, mixers, oscillators)
 * and a bare lv2:Plugin are "other"; every processing class is an effect. Labels as lilv
 * prints them, which is what the console's lv2Class field carries.
 */
const LV2_OTHER = new Set([
  'Plugin', 'Generator Plugin', 'Oscillator Plugin', 'Constant Plugin', 'Utility Plugin',
  'Analyser Plugin', 'Converter Plugin', 'Function Plugin', 'Mixer Plugin',
]);
function lv2Kind(cls) {
  if (cls === 'Instrument Plugin') return 'instrument';
  if (!cls || LV2_OTHER.has(cls)) return 'other';
  return 'effect';
}

/** The verdict a reader sees, from the console's rating (see plugin-catalog/README.md). */
const VERDICT = { suitable: 'in-process', conditional: 'isolated', unsuitable: 'isolated', unknown: 'unknown' };

function render(code, params) {
  const template = texts.codes[code];
  if (!template) throw new Error(`no text for reason code ${code}: add it to reason-texts.en.json`);
  return template.replace(/\{(\w+)(?::(pct))?\}/g, (whole, k, fmt) => {
    if (!(k in params)) return whole;
    const v = params[k];
    if (typeof v !== 'number') return String(v);
    if (fmt === 'pct') return `${Number((v * 100).toPrecision(2))} %`;
    return Number.isInteger(v) ? String(v) : String(Number(v.toPrecision(3)));
  });
}

const CRASH_CODES = new Set([
  'hosting.stability.crashed-attributed-plugin',
  'hosting.stability.crashed-live-on-this-rig',
  'hosting.stability.crash-unattributed',
]);

const roster = await get('/plugins');
const plugins = [];
let basis = null;
for (const uri of roster.plugins) {
  const row = await get(`/plugins/${encodeURIComponent(uri)}`);
  const h = row.hosting;
  if (h?.basis) basis ??= h.basis;
  const info = lv2info(uri);
  const binary = info.Binary?.replace(/^file:\/\//, '');
  const reasons = (h?.reasons ?? []).map((r) => ({
    dimension: r.dimension,
    rating: r.rating,
    code: r.code,
    params: r.params,
    text: render(r.code, r.params),
  }));
  const costReason = reasons.find((r) => r.dimension === 'cost' && 'coreFractionP95' in r.params);
  const rating = h?.rating ?? 'unknown';
  const deciding = rating === 'suitable' ? null : (reasons.find((r) => r.rating === rating)?.code ?? null);
  plugins.push({
    uri,
    name: row.name,
    vendor: info.Author ?? null,
    format: row.format,
    kind: row.format === 'lv2' ? lv2Kind(row.lv2Class) : 'other',
    declaredClass: row.lv2Class ? [row.lv2Class] : [],
    package: binary ? owningPackage(binary) : null,
    pluginVersion: null,
    verdict: VERDICT[rating],
    rating,
    path: h?.path ?? 'isolated',
    deciding,
    reasons,
    io: { audioInputs: row.audioInputs, audioOutputs: row.audioOutputs, midiIn: row.hasMidiIn },
    latency: {
      class: row.latencyClass ?? null,
      hostingQuanta: row.offer?.cost?.quanta ?? null,
      hostingMs: row.offer?.cost?.ms ?? null,
    },
    cost: {
      coreFractionP95: costReason?.params.coreFractionP95 ?? null,
      ceiling: costReason?.params.ceiling ?? null,
    },
    incidents: reasons
      .filter((r) => CRASH_CODES.has(r.code))
      .map((r) => ({ kind: 'crash', code: r.code, text: r.text })),
  });
}
if (!basis) throw new Error('no plugin row carried a hosting basis: the console has not observed a rate and quantum');

const now = new Date();
const run = {
  schemaVersion: 1,
  run: {
    date: now.toISOString(),
    source: 'console',
    producer: { name: 'openmixer /api/plugins', revision },
    rig: { rate: basis.rate, quantum: basis.quantum },
    policy: {
      cycleFloor: basis.cycleFloor,
      soakSeconds: basis.soakSeconds,
      coreFractionCeiling: basis.coreFractionCeiling,
    },
  },
  plugins,
};
const out = resolve(root, 'plugin-catalog/runs', `${now.toISOString().slice(0, 10)}.json`);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(run, null, 2)}\n`);
console.log(out);
