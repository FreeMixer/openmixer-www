// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * The plugin catalog's words in the visitor's language. The run file decides WHICH verdict,
 * rating and dimension a plugin has; the labels and meanings live in the message files.
 */
export function usePluginText() {
  const { t } = useI18n();
  return {
    verdictLabel: (v: Verdict): string => t(`plugins.verdict.${v}.label`),
    verdictMeaning: (v: Verdict): string => t(`plugins.verdict.${v}.meaning`),
    dimensionLabel: (d: CatalogReason['dimension']): string => t(`plugins.dimension.${d}`),
    ratingLabel: (r: Rating): string => t(`plugins.rating.${r}`),
    kindLabel: (k: Kind): string => t(`plugins.kind.${k}`),
  };
}
