#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
#
# The publish half of a new docs tree: attach a built tarball to a release of this repository and open the
# pull request that moves deploy/docs-tree.txt to it. The tree is built elsewhere (scripts/build-docs-tree.mjs
# --emit, where the openmixer checkout is); this script needs only this repository and `gh`, so the same call
# serves the desk and the job on the openmixer side. The pin stays a reviewed pull request.
#
#   scripts/pin-docs-tree.sh <docs-tree.tar.gz> <openmixer-revision>
#
# DRY_RUN=1 rewrites deploy/docs-tree.txt in the working tree and stops: no release, no branch, no push.
set -euo pipefail
tarball="${1:?usage: scripts/pin-docs-tree.sh <docs-tree.tar.gz> <openmixer-revision>}"
rev="${2:?usage: scripts/pin-docs-tree.sh <docs-tree.tar.gz> <openmixer-revision>}"
here="$(cd "$(dirname "$0")/.." && pwd)"
pin="${DOCS_TREE_PIN:-$here/deploy/docs-tree.txt}"
repo="${DOCS_TREE_REPO:-FreeMixer/openmixer-www}"

[ -f "$tarball" ] || { echo "pin-docs-tree: no file $tarball" >&2; exit 2; }
case "$rev" in *[!0-9a-f]*|'') echo "pin-docs-tree: the openmixer revision is a commit hash, got '$rev'" >&2; exit 2 ;; esac
tag="docs-$rev"; asset="$(basename "$tarball")"; sha="$(sha256sum "$tarball" | cut -d' ' -f1)"

# the comment block stays; only the four pin lines change
tmp="$(mktemp)"; trap 'rm -f "$tmp"' EXIT
awk -v tag="$tag" -v asset="$asset" -v sha="$sha" -v rev="$rev" '
  $1 == "release" { print "release " tag; next }
  $1 == "asset"   { print "asset " asset; next }
  $1 == "sha256"  { print "sha256 " sha; next }
  $1 == "openmixer" { print "openmixer " rev; next }
  { print }' "$pin" > "$tmp"
cat "$tmp" > "$pin"
if [ -n "${DRY_RUN:-}" ]; then echo "pin-docs-tree: $pin now pins $tag ($sha)"; exit 0; fi

cd "$here"
gh release view "$tag" -R "$repo" >/dev/null 2>&1 || \
  gh release create "$tag" "$tarball" -R "$repo" --prerelease --title "Docs tree from openmixer $rev" \
    --notes "The documentation tree built from FreeMixer/openmixer at $rev."
branch="docs-tree-$rev"
git switch -c "$branch"
git add "$pin"
git commit -S -m "Docs tree from openmixer $rev"
git push -u origin "$branch"
gh pr create -R "$repo" --title "Docs tree from openmixer $rev" \
  --body "Moves deploy/docs-tree.txt to release $tag (sha256 $sha). The run of this pull request is the dry run of the whole site."
