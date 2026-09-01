// SPDX-License-Identifier: GPL-3.0-or-later
/**
 * Nuxt UI runtime config. Point its colour system at the console accent so buttons
 * and controls render on-brand cyan rather than the default green. `omx` is the
 * ramp declared as `--color-omx-*` in assets/css/main.css; 500 is the live accent.
 * Same choice the console surface makes — one brand.
 */
export default defineAppConfig({
  ui: {
    colors: { primary: 'omx', neutral: 'slate' },
  },
});
