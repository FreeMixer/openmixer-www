// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Paths on this site that are NOT translated and have no /ca/ copy: the documentation tree
 * published from the openmixer repo (`scripts/build-docs-tree.mjs`), the typedoc tree and
 * the OpenAPI file. Must match DOCS_TREE_SECTIONS in nuxt.config.ts.
 */
const UNLOCALIZED = [
  /^\/api-docs(\/|$)/,
  /^\/openapi\.json$/,
  /^\/docs\/(install|manual|hardware|admin|troubleshooting|architecture)(\/|$)/,
];

/** Is this a site path that only exists in English? */
export function isUnlocalizedPath(path: string): boolean {
  return UNLOCALIZED.some((re) => re.test(path));
}

/**
 * The path to link to from the current language: a page of this app gets the language
 * prefix (/ca/features), a page of the published docs tree stays as it is, and an
 * external URL or a bare anchor is returned untouched. Use it for every internal `to`
 * and `href`; `LinkCard` and raw anchors still mount the result with `withSiteBase`.
 */
export function useSitePath() {
  const localePath = useLocalePath();
  return (path: string): string => {
    if (!path.startsWith('/') || isUnlocalizedPath(path)) return path;
    const hashAt = path.indexOf('#');
    const bare = hashAt < 0 ? path : path.slice(0, hashAt);
    const hash = hashAt < 0 ? '' : path.slice(hashAt);
    return `${localePath(bare)}${hash}`;
  };
}
