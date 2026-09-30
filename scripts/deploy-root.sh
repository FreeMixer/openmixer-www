#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
#
# Puts the built site into a checkout of FreeMixer/freemixer.github.io, which serves
# https://freemixer.github.io/ and also holds the package repositories.
#
#   scripts/deploy-root.sh <site-dir> <pages-checkout> [--publish]
#
# Only the top-level paths listed in deploy/site-owns.txt are replaced. Everything else in
# the checkout (rpm/, deb/, the keys, .nojekyll, README.md) is left alone, and the staged
# change is checked before anything is committed: a path outside the list, or any change
# under a package path, stops the deploy.
#
# Without --publish it stages the change, prints what would change and stops (dry run).
# With --publish it commits and pushes to main. The commit is signed when a key is
# configured (git config user.signingkey); without one it refuses to publish.
set -euo pipefail

site=$(realpath "$1")
pages=$(realpath "$2")
mode=${3:-}
here=$(dirname "$(realpath "$0")")
owns_file="$here/../deploy/site-owns.txt"

die() { echo "deploy-root: $*" >&2; exit 1; }

[ -f "$site/index.html" ] || die "no built site at $site"
git -C "$pages" rev-parse --git-dir >/dev/null || die "$pages is not a git checkout"

mapfile -t owns < <(grep -v '^\s*\(#\|$\)' "$owns_file")
[ "${#owns[@]}" -gt 0 ] || die "empty allow-list"

# Paths the package workflows write, or that the Pages host needs. Never the site's.
protected_re='^(rpm|deb)(/|$)|^\.nojekyll$|^README\.md$|^\.git(hub)?(/|$)|^CNAME$|\.repo$|\.asc$|RPM-GPG-KEY'

for name in "${owns[@]}"; do
  [[ "$name" =~ $protected_re ]] && die "allow-list names a protected path: $name"
  [[ "$name" == */* || "$name" == . || "$name" == .. ]] && die "allow-list entries are top-level names: $name"
done

# Every top-level path the build produced must be on the list.
unlisted=()
while IFS= read -r name; do
  printf '%s\n' "${owns[@]}" | grep -qxF -- "$name" || unlisted+=("$name")
done < <(ls -A "$site")
[ "${#unlisted[@]}" -eq 0 ] || die "the build produced paths not in deploy/site-owns.txt: ${unlisted[*]}"

# Replace exactly the listed paths.
for name in "${owns[@]}"; do
  rm -rf -- "${pages:?}/$name"
  if [ -e "$site/$name" ]; then cp -a -- "$site/$name" "$pages/$name"; fi
done

git -C "$pages" add -A

# The guard: read back what is actually staged, not what the loop above meant to do.
changed=$(git -C "$pages" diff --cached --name-only)
bad=$(printf '%s\n' "$changed" | awk -F/ 'NF' | while IFS= read -r path; do
  top=${path%%/*}
  if [[ "$path" =~ $protected_re ]] || ! printf '%s\n' "${owns[@]}" | grep -qxF -- "$top"; then
    echo "$path"
  fi
done)
if [ -n "$bad" ]; then
  echo "$bad" | head -20 >&2
  die "the change touches paths the site does not own (above); nothing was committed"
fi
if ! git -C "$pages" diff --cached --quiet -- rpm deb .nojekyll README.md; then
  die "the change touches rpm/, deb/, .nojekyll or README.md; nothing was committed"
fi

if git -C "$pages" diff --cached --quiet; then
  echo "deploy-root: the site is already up to date"
  exit 0
fi

git -C "$pages" diff --cached --shortstat
echo "deploy-root: top-level paths changed:"
printf '%s\n' "$changed" | cut -d/ -f1 | sort | uniq -c

if [ "$mode" != "--publish" ]; then
  echo "deploy-root: dry run, nothing committed or pushed"
  exit 0
fi

git -C "$pages" config --get user.signingkey >/dev/null || die "no signing key configured; refusing to publish an unsigned commit"
rev=${SITE_REVISION:-$(git -C "$here/.." rev-parse --short HEAD)}
git -C "$pages" commit -q -S -m "site: publish openmixer-www $rev"

# The package workflows push to the same branch. Their paths never overlap ours, so a
# rebase onto theirs is clean; git refuses the push rather than overwrite them.
for attempt in 1 2 3; do
  if git -C "$pages" push origin HEAD:main; then
    echo "deploy-root: published $rev"
    exit 0
  fi
  echo "deploy-root: push refused (attempt $attempt), rebasing onto the new main" >&2
  git -C "$pages" pull -q --rebase origin main
done
die "could not push after 3 attempts"
