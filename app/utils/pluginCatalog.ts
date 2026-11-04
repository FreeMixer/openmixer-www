// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * The plugin catalog the /plugins/ page renders. The data is app/data/plugin-catalog/, written by
 * scripts/plugin-catalog-from-records.mjs from the qualification records and checked by
 * `npm run catalog:check` before this module is ever bundled, so nothing here re-checks it. Every
 * number on the page is read from that data; none is typed here. This file holds types and pure
 * functions only, so a test can run it without Nuxt.
 */

export type Verdict = 'accepted' | 'conditional' | 'refused';
export type Rating = 'suitable' | 'conditional' | 'unknown' | 'unsuitable';
export type Format = 'lv2' | 'clap';
export type Tier = 'in-process' | 'isolated';

export interface CatalogReason {
  readonly dimension: 'stability' | 'rtSafety' | 'features' | 'cost' | 'latency' | 'topology' | 'memory' | 'hostAdmission' | null;
  readonly rating: Rating | null;
  readonly code: string;
  readonly params: Readonly<Record<string, string | number>>;
  /** The hosts whose verdict gave this reason. */
  readonly hosts: readonly string[];
}

export interface CatalogRow {
  readonly id: string;
  readonly format: Format;
  /** The plugin version the record names; null when the plugin declares none. */
  readonly version: string | null;
  /** The file or bundle that was tested. */
  readonly binary: string;
  readonly verdict: Verdict;
  readonly tiers: readonly Tier[];
  readonly reason: string | null;
  readonly offers: readonly { readonly offer: string; readonly verdict: Verdict; readonly reason: string | null }[];
  readonly reasons: readonly CatalogReason[];
  readonly notMeasured: readonly string[];
  /** CPU per sample in nanoseconds, at the stated rate and block size. */
  readonly cpu: { readonly rate: number; readonly quantum: number; readonly median: number; readonly p95: number } | null;
  readonly latency: { readonly rate: number; readonly quantum: number; readonly declared: number; readonly measured: number } | null;
  readonly measuredAt: string;
}

export interface PlatformSummary {
  readonly id: string;
  readonly hostClass: string;
  readonly set: string;
  readonly measured: string;
  readonly package: { readonly name: string; readonly version: string } | null;
  readonly conditions: Readonly<Record<string, string>>;
  readonly records: number;
  readonly tested: number;
  readonly formats: Readonly<Record<string, number>>;
  readonly verdicts: Readonly<Record<Verdict, number>>;
  readonly byFormat: Readonly<Record<string, Readonly<Record<Verdict, number>>>>;
  readonly reasons: { readonly conditional: Readonly<Record<string, number>>; readonly refused: Readonly<Record<string, number>> };
}

export interface CatalogIndex {
  readonly schemaVersion: 2;
  readonly source: { readonly repo: string; readonly commit: string };
  readonly platforms: readonly PlatformSummary[];
}

export interface PlatformFile {
  readonly schemaVersion: 2;
  readonly platform: string;
  readonly rows: readonly CatalogRow[];
}

export const VERDICT_ORDER: readonly Verdict[] = ['accepted', 'conditional', 'refused'];

/** Nuxt UI badge colours per verdict. */
export const VERDICT_COLOR: Record<Verdict, 'success' | 'warning' | 'error'> = {
  accepted: 'success',
  conditional: 'warning',
  refused: 'error',
};

/** The message key of a reason code's text: the dots of the code cannot be a message path. */
export function reasonKey(code: string): string {
  return `plugins.reason.${code.replace(/\./g, '_')}`;
}

/** The p95 cost as a percentage of one core: ns per sample, times samples per second. */
export function cpuPercent(cpu: NonNullable<CatalogRow['cpu']>): number {
  return (cpu.p95 * cpu.rate) / 1e7;
}

/** A percentage to two significant figures. */
export function pct(value: number): string {
  return `${Number(value.toPrecision(2))} %`;
}

/** Measured latency in milliseconds. */
export function latencyMs(l: NonNullable<CatalogRow['latency']>): number {
  return (l.measured / l.rate) * 1000;
}

export interface Filters {
  readonly search: string;
  readonly format: string;
  readonly verdict: string;
  readonly pkg: string;
}

export const ANY = 'any';

/** The rows that match every filter: the search in the plugin id, the package text in the file and version tested. */
export function filterRows(rows: readonly CatalogRow[], f: Filters): CatalogRow[] {
  const q = f.search.trim().toLowerCase();
  const p = f.pkg.trim().toLowerCase();
  return rows.filter((r) =>
    (f.format === ANY || r.format === f.format)
    && (f.verdict === ANY || r.verdict === f.verdict)
    && (!q || r.id.toLowerCase().includes(q))
    && (!p || `${r.binary} ${r.version ?? ''}`.toLowerCase().includes(p)));
}

/** One page of a list, counting pages from 1. */
export function pageOf<T>(items: readonly T[], page: number, size: number): T[] {
  const last = Math.max(1, Math.ceil(items.length / size));
  const at = Math.min(Math.max(1, page), last);
  return items.slice((at - 1) * size, at * size);
}

/** Where a plugin author reports a mistake: the issue form, with the plugin filled in. */
export function reportUrl(r: CatalogRow, day: string): string {
  const q = new URLSearchParams({
    template: 'plugin-verdict.yml',
    title: `Plugin verdict: ${r.id}`,
    plugin: r.id,
    package: `${r.binary}${r.version ? ` ${r.version}` : ''}`,
    run: day,
  });
  return `https://github.com/FreeMixer/openmixer-www/issues/new?${q.toString()}`;
}
