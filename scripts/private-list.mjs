// SPDX-License-Identifier: GPL-3.0-or-later
//
// The private list: what the public guards look for, kept out of this repository.
//
// The guards (check-public.mjs, build-docs-tree.mjs, gen-mcp-tools.mjs) exist to keep the private
// development tree's names off the site. Spelled out here, those names would be published by the
// very scripts that hide them. So the list lives in the private ops checkout, and the scripts read
// it at run time:
//
//   PUBLIC_GUARD_LIST   path to the list (JSON). Default ../openmixer-ops/ops/public-guard/www.json,
//                       relative to this repository's root: the ops checkout beside this one.
//
// A missing, unreadable or empty list is an ERROR, never a pass: a guard with nothing to look for
// passes everything, and that looks exactly like a clean site.
//
// Shape (every key required; an empty `forbidden` is refused):
//   {
//     "forbidden":  [{ "name": "...", "pattern": "<RegExp source>", "flags": "i" }],
//     "exclude":    ["<top-level path of the openmixer checkout the docs build must not see>"],
//     "redactions": [{ "pattern": "...", "flags": "g", "with": "<replacement>" }],
//     "survivors":  ["<pattern a generated file must not still match after redaction>"]
//   }

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const wwwRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const LIST_ENV = 'PUBLIC_GUARD_LIST';
export const DEFAULT_LIST = '../openmixer-ops/ops/public-guard/www.json';

/** Where the list is read from: the environment variable, else the sibling ops checkout. */
export function listPath(env = process.env) {
  return resolve(wwwRoot, env[LIST_ENV] || DEFAULT_LIST);
}

export class PrivateListError extends Error {}

function regex(entry, where, defaultFlags) {
  if (!entry || typeof entry.pattern !== 'string' || entry.pattern === '') {
    throw new PrivateListError(`${where}: no pattern`);
  }
  try {
    return new RegExp(entry.pattern, entry.flags ?? defaultFlags);
  } catch (e) {
    throw new PrivateListError(`${where}: ${e.message}`);
  }
}

/**
 * Read and check the list. Throws PrivateListError, with the path in the message, when the list
 * is missing, is not JSON, lacks a key, has a pattern that does not compile, or forbids nothing.
 */
export function loadPrivateList(path = listPath()) {
  if (!existsSync(path)) throw new PrivateListError(`pattern list not reachable at ${path} (set ${LIST_ENV})`);
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new PrivateListError(`pattern list at ${path} is not readable JSON: ${e.message}`);
  }
  for (const key of ['forbidden', 'exclude', 'redactions', 'survivors']) {
    if (!Array.isArray(raw?.[key])) throw new PrivateListError(`pattern list at ${path} has no "${key}" array`);
  }
  if (raw.forbidden.length === 0) throw new PrivateListError(`pattern list at ${path} forbids nothing`);
  const forbidden = raw.forbidden.map((f, i) => {
    if (typeof f?.name !== 'string' || f.name === '') throw new PrivateListError(`${path} forbidden[${i}]: no name`);
    return { name: f.name, re: regex(f, `${path} forbidden[${i}]`, '') };
  });
  const exclude = raw.exclude.map((p, i) => {
    if (typeof p !== 'string' || p === '' || p.includes('/')) {
      throw new PrivateListError(`${path} exclude[${i}]: not a top-level path name`);
    }
    return p;
  });
  const redactions = raw.redactions.map((r, i) => {
    if (typeof r?.with !== 'string') throw new PrivateListError(`${path} redactions[${i}]: no "with"`);
    const flags = r.flags ?? 'g';
    return { re: regex({ ...r, flags: flags.includes('g') ? flags : `${flags}g` }, `${path} redactions[${i}]`, 'g'), with: r.with };
  });
  const survivors = raw.survivors.map((s, i) => regex({ pattern: s }, `${path} survivors[${i}]`, ''));
  return { path, forbidden, exclude, redactions, survivors };
}
