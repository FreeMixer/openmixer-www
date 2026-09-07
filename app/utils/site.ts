// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Join this site's mount prefix onto a site-absolute path.
 *
 * The site is served from a sub-path on GitHub Pages (`/openmixer-www/`), so a
 * hand-written `/img/mark.svg` in a raw `<a href>` or `<img src>` points one level ABOVE
 * the mount and 404s — while resolving perfectly in a local preview, whose root IS the
 * mount. `NuxtLink` and Vite's `?url` imports apply the prefix themselves; anything that
 * cannot use them goes through here, and `scripts/check-links.mjs` fails the build on a
 * site-absolute link that missed it.
 *
 * External URLs and relative paths are returned untouched.
 */
export function withSiteBase(base: string, path: string): string {
  if (!path.startsWith('/')) return path;
  const prefix = base.replace(/\/+$/, '');
  return path.startsWith(`${prefix}/`) ? path : `${prefix}${path}`;
}
