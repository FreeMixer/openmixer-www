// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * The plugin catalog the /plugins/ pages render: the NEWEST run in plugin-catalog/runs/,
 * read at build time. The shape is plugin-catalog/schema/plugin-catalog.v1.schema.json, and
 * `npm run catalog:check` has validated every run before this module is ever bundled, so nothing
 * here re-checks it. Every number on those pages is read from that file; none is typed here.
 */

export type Verdict = 'in-process' | 'isolated' | 'refused' | 'unknown';
export type Kind = 'effect' | 'instrument' | 'other';
export type Rating = 'suitable' | 'conditional' | 'unknown' | 'unsuitable';

export interface CatalogReason {
  readonly dimension: 'stability' | 'rtSafety' | 'features' | 'cost' | 'latency' | 'topology';
  readonly rating: Rating;
  readonly code: string;
  readonly params: Readonly<Record<string, string | number>>;
  readonly text: string;
}

export interface CatalogPlugin {
  readonly uri: string;
  readonly name: string;
  readonly vendor: string | null;
  readonly format: 'lv2' | 'clap';
  readonly kind: Kind;
  readonly declaredClass: readonly string[];
  readonly package: {
    readonly manager: 'rpm' | 'deb';
    readonly name: string;
    readonly nevr: string;
    readonly version: string;
    readonly release: string;
    readonly arch: string;
  } | null;
  readonly pluginVersion: string | null;
  readonly verdict: Verdict;
  readonly rating: Rating;
  readonly path: 'in-process' | 'isolated';
  readonly deciding: string | null;
  readonly reasons: readonly CatalogReason[];
  readonly io: { readonly audioInputs: number; readonly audioOutputs: number; readonly midiIn: boolean };
  readonly latency: { readonly class: 'zero' | 'low' | 'high' | null; readonly hostingQuanta: number | null; readonly hostingMs: number | null };
  readonly cost: { readonly coreFractionP95: number | null; readonly ceiling: number | null };
  readonly incidents: readonly { readonly kind: 'crash' | 'timeout' | 'load-refused'; readonly code: string | null; readonly text: string }[];
}

export interface CatalogRun {
  readonly schemaVersion: 1;
  readonly run: {
    readonly date: string;
    readonly source: 'qualify' | 'console';
    readonly producer: { readonly name: string; readonly revision: string | null };
    readonly rig: { readonly rate: number; readonly quantum: number };
    readonly policy: { readonly cycleFloor: number; readonly soakSeconds: number; readonly coreFractionCeiling: number };
  };
  readonly plugins: readonly CatalogPlugin[];
}

/** One row on the site: a plugin, and the format it is NOT shown as when it has a twin. */
export interface CatalogRow extends CatalogPlugin {
  readonly slug: string;
  readonly alsoAs: CatalogPlugin | null;
}

const runs = import.meta.glob<CatalogRun>('../../plugin-catalog/runs/*.json', { eager: true, import: 'default' });

/** The run the site shows: the newest by its own date. */
export function latestRun(): { file: string; run: CatalogRun } {
  const entries = Object.entries(runs).sort(([, a], [, b]) => b.run.date.localeCompare(a.run.date));
  const first = entries[0];
  if (!first) throw new Error('plugin-catalog/runs/ holds no run');
  return { file: first[0].replace(/^.*\/plugin-catalog\//, 'plugin-catalog/'), run: first[1] };
}

/** A URL-safe, stable name for a plugin's page, from its URI. */
export function slugOf(uri: string): string {
  return uri
    .replace(/^[a-z]+:\/\//i, '')
    .replace(/^urn:/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Name and vendor with the format named in them taken out, so twins compare equal. */
function twinKey(p: CatalogPlugin): string {
  const bare = (s: string) => s.toLowerCase().replace(/\(?\b(lv2|clap)\b\)?/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  return `${bare(p.vendor ?? '')}|${bare(p.name)}`;
}

/**
 * One row per plugin. Where the same plugin exists as CLAP and LV2, the row is the twin the
 * qualifier accepted (anything but refused); when both were accepted, or neither, CLAP.
 */
export function catalogRows(run: CatalogRun): CatalogRow[] {
  const groups = new Map<string, CatalogPlugin[]>();
  for (const p of run.plugins) {
    const key = twinKey(p);
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  const rows: CatalogRow[] = [];
  for (const group of groups.values()) {
    const clap = group.filter((p) => p.format === 'clap');
    const lv2 = group.filter((p) => p.format === 'lv2');
    if (clap.length !== 1 || lv2.length !== 1) {
      // Not a CLAP/LV2 pair (a lone plugin, or several plugins sharing a name): one row each.
      for (const p of group) rows.push({ ...p, slug: slugOf(p.uri), alsoAs: null });
      continue;
    }
    const [c, l] = [clap[0]!, lv2[0]!];
    const shown = c.verdict === 'refused' && l.verdict !== 'refused' ? l : c;
    rows.push({ ...shown, slug: slugOf(shown.uri), alsoAs: shown === c ? l : c });
  }
  const seen = new Map<string, string>();
  for (const r of rows) {
    const other = seen.get(r.slug);
    if (other) throw new Error(`plugin pages ${other} and ${r.uri} would share the slug ${r.slug}`);
    seen.set(r.slug, r.uri);
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  'in-process': 'In-process',
  isolated: 'Isolated',
  unknown: 'Not fully measured',
  refused: 'Refused',
};

export const VERDICT_MEANING: Record<Verdict, string> = {
  'in-process': 'Passed every measured dimension. Qualified to run inside the engine’s own process.',
  isolated: 'Runs, in a separate process. The deciding reason says why it is not in-process.',
  unknown: 'At least one dimension was not measured, so no verdict is given. Runs in a separate process.',
  refused: 'The qualifier could not load or run it.',
};

export const VERDICT_ORDER: readonly Verdict[] = ['in-process', 'isolated', 'unknown', 'refused'];

/** Nuxt UI badge colours per verdict. */
export const VERDICT_COLOR: Record<Verdict, 'success' | 'info' | 'neutral' | 'error'> = {
  'in-process': 'success',
  isolated: 'info',
  unknown: 'neutral',
  refused: 'error',
};

export const DIMENSION_LABEL: Record<CatalogReason['dimension'], string> = {
  stability: 'Stability',
  rtSafety: 'Real-time safety',
  features: 'Host features',
  cost: 'CPU cost',
  latency: 'Latency',
  topology: 'Inputs and outputs',
};

/** The text of the reason that decided a plugin's verdict, or null when nothing below suitable. */
export function decidingText(p: CatalogPlugin): string | null {
  return p.reasons.find((r) => r.code === p.deciding)?.text ?? null;
}

/** A core fraction as a short percentage. */
export function pct(fraction: number | null): string {
  return fraction === null ? '—' : `${Number((fraction * 100).toPrecision(2))} %`;
}

/** The run date as a plain day. */
export function runDay(iso: string): string {
  return iso.slice(0, 10);
}

/** Where a plugin author reports a mistake: the issue form, with the plugin filled in. */
export function reportUrl(p: CatalogPlugin, runDate: string): string {
  const q = new URLSearchParams({
    template: 'plugin-verdict.yml',
    title: `Plugin verdict: ${p.name}`,
    plugin: p.uri,
    package: p.package?.nevr ?? 'not from a package',
    run: runDay(runDate),
  });
  return `https://github.com/FreeMixer/openmixer-www/issues/new?${q.toString()}`;
}
