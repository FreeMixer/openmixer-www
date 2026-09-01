// SPDX-License-Identifier: GPL-3.0-or-later

/** `channelConfigs` → `Channel configs`. Turns a camelCase path segment into a label. */
export function humanizeSlug(slug: string): string {
  const words = slug.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase().split(' ');
  return words.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(' ');
}
