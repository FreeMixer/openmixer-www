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
// OpenAPI 3.1 — the same rows and refusal catalog, in a standard shape
// ---------------------------------------------------------------------------

function opId(verb, path) {
  return verb + path.replace(/\{(\w+)\}/g, '_$1_').replace(/[^a-zA-Z0-9]+/g, '_').replace(/_+$/, '');
}
function fieldSchema(field, sampleValue) {
  if (field.values) {
    const allNumeric = field.values.every((v) => typeof v === 'number');
    const baseType = allNumeric ? 'number' : 'string';
    const enumSchema = { type: baseType, enum: [...field.values] };
    if (sampleValue === null) {
      // Unset — e.g. no instrument tag assigned. JSON Schema needs null in both the type
      // array and the enum list itself, or a null instance fails to validate either way.
      return { type: [baseType, 'null'], enum: [...field.values, null] };
    }
    if (sampleValue !== undefined && !field.values.includes(sampleValue)) {
      const sampleType = typeof sampleValue === 'number' ? 'number' : typeof sampleValue === 'boolean' ? 'boolean' : 'string';
      if (sampleType !== baseType) {
        // A live sample outside the declared enum, of a DIFFERENT type, means the enum is a
        // sentinel layered over an otherwise free-typed field (e.g. a numeric hold time with a
        // "never" sentinel) — found by running this generator's output through an external
        // OpenAPI linter, not asserted a priori.
        return { oneOf: [{ type: sampleType }, enumSchema] };
      }
      // Same primitive type, just a value the travel sheet's enum didn't happen to list:
      // the enum isn't proven exhaustive, so don't pretend it is.
      return { type: baseType };
    }
    return enumSchema;
  }
  if (field.limit) {
    const s = { type: 'number' };
    if (typeof field.limit.min === 'number') s.minimum = field.limit.min;
    if (typeof field.limit.max === 'number') s.maximum = field.limit.max;
    if (field.limit.unit) s.description = `Unit: ${field.limit.unit}`;
    return s;
  }
  if (field.perInstance) return { type: 'number', description: 'Range depends on the instance (e.g. hardware-reported limits).' };
  if (typeof sampleValue === 'boolean') return { type: 'boolean' };
  if (typeof sampleValue === 'number') return { type: 'number' };
  if (typeof sampleValue === 'string') return { type: 'string' };
  return {};
}
function refusalSchemaName(code) {
  return 'Refusal_' + code.replace(/[^a-zA-Z0-9]+/g, '_');
}

function buildOpenApi(rest, refusals, meta) {
  const paths = {};
  for (const family of rest.families) {
    for (const group of family.groups) {
      for (const row of group.rows) {
        const parameters = [...row.path.matchAll(/\{(\w+)\}/g)].map((m) => ({
          name: m[1],
          in: 'path',
          required: true,
          schema: { type: 'string' },
        }));
        const properties = {};
        const writableProperties = {};
        for (const f of row.fields) {
          const schema = fieldSchema(f, row.sample ? row.sample[f.name] : undefined);
          if (!f.writable) schema.readOnly = true;
          properties[f.name] = schema;
          if (f.writable) writableProperties[f.name] = schema;
        }
        const stateSchema = { type: 'object', properties };
        const shared = {
          tags: [family.slug],
          parameters,
          ...(row.demand ? { description: 'On demand: only computes while at least one client is watching it (`?watch=1`).' } : {}),
        };
        const notFound = {
          description: 'No such instance of this entity — the address is well-formed but nothing lives there.',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Refusal' } } },
        };
        const pathItem = {
          get: {
            ...shared,
            operationId: opId('get', row.path),
            summary: `Read ${row.path}`,
            responses: {
              '200': {
                description: 'Current state.',
                content: { 'application/json': { schema: stateSchema, ...(row.sample ? { example: row.sample } : {}) } },
              },
              '404': notFound,
            },
          },
          options: {
            ...shared,
            operationId: opId('options', row.path),
            summary: `The declared contract of ${row.path}`,
            description: (shared.description ? shared.description + ' ' : '') + "Publishes this entity's live contract: writable fields, ranges, units and enumerated options.",
            responses: {
              '200': { description: 'The contract.', content: { 'application/json': { schema: {} } } },
              '404': notFound,
            },
          },
        };
        if (row.writable) {
          pathItem.patch = {
            ...shared,
            operationId: opId('patch', row.path),
            summary: `Write ${row.path}`,
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { type: 'object', properties: writableProperties, additionalProperties: false } } },
            },
            responses: {
              '200': { description: 'Updated state.', content: { 'application/json': { schema: stateSchema } } },
              '4XX': {
                description: 'Refused. See the refusal-codes reference for the full catalog.',
                content: { 'application/json': { schema: { $ref: '#/components/schemas/Refusal' } } },
              },
            },
          };
        }
        paths['/api' + row.path] = pathItem;
      }
    }
  }

  const schemas = {
    Refusal: {
      type: 'object',
      description: 'The envelope every refusal, warning and undo-label rides in. See the named Refusal_* schemas for individual codes.',
      properties: {
        code: { type: 'string' },
        params: { type: 'object', additionalProperties: { type: ['string', 'number'] } },
      },
      required: ['code', 'params'],
    },
  };
  for (const section of refusals.sections) {
    for (const c of section.codes) {
      schemas[refusalSchemaName(c.code)] = {
        type: 'object',
        description: c.doc || `See ${c.paramType}.`,
        properties: {
          code: { const: c.code },
          params: {
            type: 'object',
            properties: Object.fromEntries(c.params.map((p) => [p.name, { type: /number/.test(p.type) ? 'number' : 'string' }])),
            required: c.params.map((p) => p.name),
          },
        },
        required: ['code', 'params'],
      };
    }
  }

  return {
    openapi: '3.1.0',
    info: {
      title: 'openmixer console API',
      version: `0.0.0-generated.${meta.generatedAt.slice(0, 10)}`,
      license: { name: 'GPL-3.0-or-later', identifier: 'GPL-3.0-or-later' },
      description:
        "Generated from the running console's own contract (travel-sheet.json, engine-ui-rows.json, message-code.ts) — never hand-written. " +
        'Every path also answers `?watch=1` as a server-sent event stream emitting exactly what its `GET` returns; that half has no OpenAPI shape of its own, so it rides as a plain note on each operation rather than a fabricated one. ' +
        'The console has no authentication today, hence the empty top-level `security`.',
    },
    servers: [{ url: 'http://localhost:8080/api', description: 'A default local console.' }],
    security: [],
    tags: rest.families.map((f) => ({ name: f.slug, description: `Every address under ${f.root}.` })),
    paths,
    components: { schemas },
  };
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

  const meta = {
    generatedAt: new Date().toISOString(),
    checkoutPath: src,
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
