#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Generates the REST API reference from the console's own machine-readable contract.
// Never hand-write these pages: the address space, the field list and the refusal
// catalog all come from source files an openmixer checkout already carries.
//
// Inputs (read from OPENMIXER_SRC, default ../openmixer):
//   docs/design/travel-sheet.json        — per-field ranges, enums and per-instance limits
//   docs/design/engine-ui-rows.json      — every addressable row, its fields and a live sample
//   packages/core/src/message-code.ts    — every refusal/undo-label code, doc'd in TSDoc
//
// Outputs (consumed by app/pages/docs/rest/*.vue and app/pages/docs/refusal-codes.vue):
//   app/data/rest-reference.json
//   app/data/refusal-codes.json

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const wwwRoot = resolve(here, '..');
const src = resolve(wwwRoot, process.env.OPENMIXER_SRC || '../openmixer');

function readJson(relPath) {
  return JSON.parse(readFileSync(resolve(src, relPath), 'utf8'));
}
function readText(relPath) {
  return readFileSync(resolve(src, relPath), 'utf8');
}

// ---------------------------------------------------------------------------
// message-code.ts → refusal/undo-label code catalog
// ---------------------------------------------------------------------------

function cleanDoc(block) {
  if (!block) return '';
  return block
    .trim()
    .replace(/^\/\*\*/, '')
    .replace(/\*\/$/, '')
    .split('\n')
    .map((l) => l.trim().replace(/^\*\s?/, ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractArrayStrings(text, arrayStartRe) {
  const m = arrayStartRe.exec(text);
  if (!m) return [];
  const start = m.index + m[0].length;
  let depth = 1;
  let i = start;
  while (i < text.length && depth > 0) {
    if (text[i] === '[') depth++;
    else if (text[i] === ']') depth--;
    i++;
  }
  const body = text.slice(start, i - 1);
  return [...body.matchAll(/'([^']+)'/g)].map((mm) => mm[1]);
}

function parseMessageCode(text) {
  const listedCodes = extractArrayStrings(text, /const LISTED_CODES = \[/);
  const undoSetParams = extractArrayStrings(text, /const UNDO_SET_PARAMS = \[/);
  const undoSetCodes = undoSetParams.map((p) => `undo.label.set.${p}`);

  // First pass: collect every `export type NameParams = RHS;` declaration, its own
  // leading doc, and the fields declared directly on it (an intersection's own extra
  // fields, or the whole body for a plain object type).
  const typeDefs = new Map();
  // A plain `;\n`-terminated regex truncates a multi-field object at its FIRST field
  // (each field line itself ends in `;\n`), so the statement end is found by a
  // balanced-bracket scan instead — depth counts `{`/`(`/`<`, stopping at a `;`
  // only once every bracket it opened has closed.
  function extractStatement(fromIndex) {
    let depth = 0;
    let i = fromIndex;
    for (; i < text.length; i++) {
      const c = text[i];
      if (c === '{' || c === '(' || c === '<') depth++;
      else if (c === '}' || c === ')' || c === '>') depth--;
      else if (c === ';' && depth <= 0) break;
    }
    return text.slice(fromIndex, i);
  }
  const typeHeaderRe = /export type (\w+) = /g;
  let td;
  while ((td = typeHeaderRe.exec(text))) {
    const name = td[1];
    if (!/Params$/.test(name) || name === 'MessageParams' || name === 'UndoSetLabelParams') continue;
    const rhs = extractStatement(typeHeaderRe.lastIndex);
    const before = text.slice(0, td.index);
    const docMatch = /\/\*\*([\s\S]*?)\*\/\s*\n\s*$/.exec(before);
    const baseMatch = /^\s*(\w+)\s*&/.exec(rhs);
    const braceStart = rhs.indexOf('{');
    const braceEnd = rhs.lastIndexOf('}');
    const inner = braceStart >= 0 && braceEnd > braceStart ? rhs.slice(braceStart + 1, braceEnd) : '';
    const fields = [...inner.matchAll(/readonly\s+(\w+)\??\s*:\s*([^;,]+)[;,]?/g)].map((f) => ({
      name: f[1],
      type: f[2].replace(/\s+/g, ' ').trim(),
    }));
    typeDefs.set(name, {
      doc: docMatch ? cleanDoc(docMatch[0]) : '',
      base: baseMatch ? baseMatch[1] : null,
      fields,
    });
  }
  function resolveFields(name, seen = new Set()) {
    if (name === 'NoMessageParams' || !name || seen.has(name)) return [];
    seen.add(name);
    const def = typeDefs.get(name);
    if (!def) return [];
    const baseFields = def.base ? resolveFields(def.base, seen) : [];
    const own = new Map(baseFields.map((f) => [f.name, f]));
    for (const f of def.fields) own.set(f.name, f);
    return [...own.values()];
  }
  function resolveDoc(name) {
    if (name === 'NoMessageParams') return 'No parameters — the sentence is fixed text.';
    const def = typeDefs.get(name);
    if (!def) return '';
    if (def.doc) return def.doc;
    return def.base ? resolveDoc(def.base) : '';
  }

  // Second pass, single sweep over lines: track the nearest preceding section
  // header and the nearest preceding doc comment, and resolve each `readonly
  // 'code': ParamType;` line against them. The two mapped-type spreads
  // (stagebox assignment, insert latency) carry no per-code doc of their own in
  // this file, so their codes are grouped under the section header that
  // introduces the spread and share that group's blanket description.
  const lines = text.split('\n');
  let currentSection = 'General';
  let pendingDoc = null;
  let collectingDoc = false;
  const perCode = new Map(); // code -> { section, doc, paramType }
  const groupSpreads = [];   // { afterLineIndex, section }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Block-style divider: a dash-only line, a `// Label` line, a dash-only line.
    if (/^\s*\/\/\s*-{10,}\s*$/.test(line) && /^\s*\/\/(?!\s*-)/.test(lines[i + 1] || '') && /^\s*\/\/\s*-{10,}\s*$/.test(lines[i + 2] || '')) {
      currentSection = lines[i + 1].replace(/^\s*\/\/\s*/, '').trim();
      i += 2;
      continue;
    }
    // Inline divider: `// ---- Label ----------------`
    const inline = /^\s*\/\/\s*-{2,}\s*(.+?)\s*-{2,}\s*$/.exec(line);
    if (inline) {
      currentSection = inline[1].trim();
      continue;
    }

    if (line.includes('/**')) {
      collectingDoc = true;
      pendingDoc = line;
      if (line.includes('*/')) collectingDoc = false;
      continue;
    }
    if (collectingDoc) {
      pendingDoc += '\n' + line;
      if (line.includes('*/')) collectingDoc = false;
      continue;
    }

    const prop = /readonly\s+'([^']+)'\s*:\s*(\w+)\s*;/.exec(line);
    if (prop) {
      perCode.set(prop[1], { section: currentSection, doc: cleanDoc(pendingDoc), paramType: prop[2] });
      pendingDoc = null;
      continue;
    }

    if (line.includes('[C in StageboxAssignRefusal]')) {
      groupSpreads.push({ prefix: 'stagebox.assign.', section: currentSection, paramType: 'StageboxAssignRefusalParams' });
      pendingDoc = null;
      continue;
    }
    if (line.includes('[C in InsertLatencyCode]')) {
      groupSpreads.push({ prefix: 'insert.latency.', section: currentSection, paramType: 'LatencyBudgetParams' });
      pendingDoc = null;
      continue;
    }

    if (line.trim() !== '') pendingDoc = null;
  }

  const sections = new Map();
  function pushCode(code, section, doc, paramType) {
    const params = resolveFields(paramType);
    const entry = { code, doc: doc || resolveDoc(paramType), paramType, params };
    if (!sections.has(section)) sections.set(section, []);
    sections.get(section).push(entry);
  }

  for (const code of listedCodes) {
    const hit = perCode.get(code);
    if (hit) {
      pushCode(code, hit.section, hit.doc, hit.paramType);
      continue;
    }
    const grp = groupSpreads.find((g) => code.startsWith(g.prefix));
    if (grp) {
      pushCode(code, grp.section, '', grp.paramType);
      continue;
    }
    pushCode(code, 'Uncategorised', '', 'NoMessageParams');
  }
  for (const code of undoSetCodes) {
    pushCode(code, 'Undo — per-parameter labels', 'An undo entry naming one console scope.', 'ScopeLabelParams');
  }

  const allCodes = [...listedCodes, ...undoSetCodes];
  return {
    totalCodes: allCodes.length,
    sections: [...sections.entries()].map(([label, codes]) => ({ label, codes })),
  };
}

// ---------------------------------------------------------------------------
// travel-sheet.json + engine-ui-rows.json → the address space
// ---------------------------------------------------------------------------

function familyOf(path) {
  return path.split('/').filter(Boolean)[0] || '(root)';
}
function groupLabelOf(path, family) {
  // Coarse on purpose: the first STATIC segment after the family root, so e.g. every
  // /channel/{kind}/{index}/chain/processors/{id}[/params/{symbol}] row lands in one
  // "chain" bucket instead of one singleton group per distinct sub-path.
  const rest = path
    .split('/')
    .filter(Boolean)
    .slice(1)
    .filter((seg) => !/^\{.*\}$/.test(seg));
  return rest.length ? rest[0] : `(${family} itself)`;
}
function exampleOf(path, probeId) {
  return path.replace(/\{(\w+)\}/g, (_, name) => (probeId && probeId[name] != null ? String(probeId[name]) : name));
}

function buildRestReference(travelSheet, rowsDoc) {
  const travels = travelSheet.travels || {};
  const demand = travelSheet.demand || {};
  const rows = rowsDoc.rows || [];
  const rowPaths = new Set(rows.map((r) => r.path));

  const families = new Map();
  for (const row of rows) {
    const family = familyOf(row.path);
    const groupLabel = groupLabelOf(row.path, family);
    const travel = travels[row.path] || null;
    const fieldNames = Object.keys(row.fields || {});
    const fields = fieldNames.map((name) => {
      const t = travel && travel[name] ? travel[name] : null;
      return {
        name,
        writable: row.fields[name] === true,
        limit: t && t.limit ? t.limit : null,
        values: t && t.values ? t.values : null,
        perInstance: !!(t && t.perInstance),
      };
    });
    const rowEntry = {
      path: row.path,
      example: exampleOf(row.path, row.probeId),
      writable: fields.some((f) => f.writable),
      demand: !!demand[row.path],
      instances: row.instances || 0,
      fields,
      sample: row.sample || null,
    };
    if (!families.has(family)) families.set(family, new Map());
    const groups = families.get(family);
    if (!groups.has(groupLabel)) groups.set(groupLabel, []);
    groups.get(groupLabel).push(rowEntry);
  }

  const demandOnly = Object.keys(demand).filter((p) => !rowPaths.has(p)).sort();

  const familyList = [...families.entries()]
    .map(([slug, groups]) => {
      const groupList = [...groups.entries()].map(([label, rowsIn]) => ({ label, rows: rowsIn }));
      const count = groupList.reduce((n, g) => n + g.rows.length, 0);
      return { slug, root: `/${slug}`, count, groups: groupList };
    })
    .sort((a, b) => b.count - a.count);

  return { families: familyList, demandOnly };
}

// ---------------------------------------------------------------------------
// OpenAPI 3.1 — built by @openmixer/core's buildOpenApiDocument
// (packages/core/src/openapi-doc.ts), called through its CLI face
// (scripts/print-openapi-doc.mjs) since this site has no dependency on core. One
// author for the transform: the console is planned to serve the identical document
// from its own live registry in a later increment, and a second implementation here
// would be exactly the drift that reusable-module law exists to prevent. Verified
// against real data with `npx @redocly/cli lint` before adopting it, the same check
// this file's own former inline version was fixed against.
// ---------------------------------------------------------------------------

function buildOpenApi(rest, refusals, meta) {
  const cliPath = resolve(src, 'scripts/print-openapi-doc.mjs');
  const payload = JSON.stringify({
    families: rest.families,
    refusalSections: refusals.sections,
    serverUrl: 'http://localhost:8080/api',
    generatedAt: meta.generatedAt.slice(0, 10),
  });
  const stdout = execFileSync('node', [cliPath], { input: payload, encoding: 'utf8', cwd: src, maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(stdout);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function main() {
  const travelSheet = readJson('docs/design/travel-sheet.json');
  const rowsDoc = readJson('docs/design/engine-ui-rows.json');
  const messageCodeText = readText('packages/core/src/message-code.ts');

  const rest = buildRestReference(travelSheet, rowsDoc);
  const refusals = parseMessageCode(messageCodeText);

  // No checkoutPath in meta: it is the generating machine's local absolute path,
  // never a fact this site's reader needs, and published content carries no trace
  // of the operator's own filesystem.
  const meta = {
    generatedAt: new Date().toISOString(),
    sourceRowCount: rowsDoc.rows.length,
    sourceTravelCount: Object.keys(travelSheet.travels).length,
  };

  const openapi = buildOpenApi(rest, refusals, meta);
  const publicDir = resolve(wwwRoot, 'public');
  mkdirSync(publicDir, { recursive: true });
  writeFileSync(resolve(publicDir, 'openapi.json'), JSON.stringify(openapi, null, 2));
  console.log(`[gen-rest-reference] openapi → public/openapi.json (${Object.keys(openapi.paths).length} paths, ${Object.keys(openapi.components.schemas).length} schemas)`);

  const outDir = resolve(wwwRoot, 'app/data');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'rest-reference.json'), JSON.stringify({ meta, ...rest }, null, 2));
  writeFileSync(
    resolve(outDir, 'refusal-codes.json'),
    JSON.stringify({ meta: { ...meta, totalCodes: refusals.totalCodes }, sections: refusals.sections }, null, 2),
  );

  console.log(`[gen-rest-reference] checkout: ${src}`);
  console.log(`[gen-rest-reference] ${rowsDoc.rows.length} rows → ${rest.families.length} families`);
  console.log(`[gen-rest-reference] ${rest.demandOnly.length} demand-gated streams with no standalone row`);
  console.log(`[gen-rest-reference] ${refusals.totalCodes} refusal/label codes → ${refusals.sections.length} sections`);
}

main();
