// SPDX-License-Identifier: GPL-3.0-or-later
//
// Branch and tag names of the private development tree, by their shape rather than by name.
//
// The openmixer docs build stamps every manual page with `git describe --tags`, and the nearest
// tag of any name wins: a tree built from a commit whose nearest tag is an archived working
// branch printed `archive/<date>/lane/<name>-g<sha>` on a dozen pages. That shape, and any
// `lane/<name>` ref, is a working name of the private tree, never a release. So the docs-tree build
// replaces it (scrubBranchNames) and check-public.mjs refuses a tree that still carries it
// (BRANCH_NAMES), whatever the private list says.

/** An archive tag: archive/<yyyy-mm-dd>/<anything>, with the describe suffix that follows it. */
const ARCHIVE_TAG = /archive\/\d{4}-\d{2}-\d{2}\/[A-Za-z0-9_-]+(?:[./][A-Za-z0-9_-]+)*/g;

/** A working-branch ref, lane/<name>, not the tail of a longer word (plane/, sub-lane/). A name
 *  never ends in a dot, so the full stop after one stays in the sentence. */
const LANE_REF = /(?<![A-Za-z0-9_.-])lane\/[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*/g;

/** In check-public.mjs's shape: [{ name, re }]. */
export const BRANCH_NAMES = [
  { name: 'archive tag', re: ARCHIVE_TAG },
  { name: 'working branch', re: LANE_REF },
];

/**
 * `text` with every archive tag replaced by `revision` (the short sha the tree was built from)
 * and every remaining working-branch ref by the word "development".
 */
export function scrubBranchNames(text, revision) {
  return text.replace(ARCHIVE_TAG, revision).replace(LANE_REF, 'development');
}
