#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
#
# Unpacks the docs tree that deploy/docs-tree.txt pins into <dest>, ready for
#   DOCS_TREE=<dest> node scripts/build-docs-tree.mjs
#
#   scripts/fetch-docs-tree.sh <dest>
#
# The pin names a release of this repository, the tarball attached to it and the tarball's sha256.
# The download is public (no credential), and a file whose sha256 differs is refused: the pin, not
# whatever the release holds today, decides what the site is built from.
#
# DOCS_TREE_FILE=<tarball> reads a local file instead of downloading (a desk preview of a tree
# that was just built); the sha256 is still checked.
set -euo pipefail
dest="${1:?usage: scripts/fetch-docs-tree.sh <dest>}"
here="$(cd "$(dirname "$0")/.." && pwd)"
pin="${DOCS_TREE_PIN:-$here/deploy/docs-tree.txt}"
repo="${DOCS_TREE_REPO:-FreeMixer/openmixer-www}"

field() { awk -v k="$1" '$1 == k { print $2; exit }' "$pin"; }
tag="$(field release)"; asset="$(field asset)"; want="$(field sha256)"
[ -n "$tag" ] && [ -n "$asset" ] && [ -n "$want" ] || { echo "fetch-docs-tree: $pin needs release, asset and sha256 lines" >&2; exit 2; }

work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
if [ -n "${DOCS_TREE_FILE:-}" ]; then
  cp "$DOCS_TREE_FILE" "$work/tree.tar.gz"
else
  curl -fsSL --retry 3 -o "$work/tree.tar.gz" "https://github.com/$repo/releases/download/$tag/$asset"
fi
have="$(sha256sum "$work/tree.tar.gz" | cut -d' ' -f1)"
if [ "$have" != "$want" ]; then
  echo "fetch-docs-tree: $asset of $tag is sha256 $have, the pin says $want" >&2
  exit 1
fi
rm -rf "$dest"; mkdir -p "$dest"
tar -xzf "$work/tree.tar.gz" -C "$dest"
[ -f "$dest/docs-tree.json" ] && [ -d "$dest/public" ] || { echo "fetch-docs-tree: $asset holds no docs-tree.json and public/" >&2; exit 1; }
echo "fetch-docs-tree: $asset of $tag (sha256 $have) unpacked into $dest"
