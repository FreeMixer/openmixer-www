// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * What the /benchmarks page derives from omx-bench/1 runs. Pure functions over the run shape
 * (benchmarks/schema/omx-bench.v1.schema.json), no imports, so `node --test scripts/` runs them
 * as they are. `npm run benchmarks:check` has validated every run before the page is built, so
 * nothing here re-checks it. Every figure is read from a run or computed from two of its
 * figures; none is typed here.
 */

export type HostId = 'H1' | 'H2' | 'H3' | 'H4';
export type MachineClass = 'rpi5' | 'desk' | 'ci';
export type Mode = 'individual' | 'chain' | 'chain-add' | 'shared-process' | 'plan' | 'pool';

export interface BenchScenario {
  readonly id: string;
  readonly title: string;
  readonly host: HostId;
  readonly rate: number;
  readonly frames: number;
  readonly plugins?: readonly string[];
  readonly dsp_load_avg?: number | null;
  readonly dsp_load_max?: number | null;
  readonly samples?: number;
  readonly rss_mb?: number | null;
  readonly add_ms?: number | null;
  readonly recover_ms?: number | null;
  readonly mode?: Mode;
  readonly processes?: number;
  readonly rss_mb_total?: number | null;
  readonly pss_mb_total?: number | null;
  readonly cpu_pct?: number | null;
  readonly ctx_switches?: number | null;
  readonly status: 'ok' | 'unsupported' | 'failed';
  readonly note?: string;
  readonly stress?: string;
  readonly nice?: number;
  readonly xruns?: number | null;
  readonly repeats?: number | null;
  readonly jack_clients?: number | null;
  readonly latency_frames?: number | null;
  /** Versions that differ from the run's own, for this row. */
  readonly software?: Readonly<Record<string, string>>;
  /** Per measure, [lowest, highest] over the repeats; the figure beside it is the median. */
  readonly spread?: Readonly<Record<string, readonly [number, number]>>;
}

export interface AddTime {
  readonly set?: string;
  readonly builds?: string;
  readonly host: HostId;
  readonly mode: Mode;
  readonly plugins: number;
  readonly median_ms: number;
  readonly min_ms: number;
  readonly max_ms: number;
  readonly repeats: number;
}

export interface Instrument {
  readonly name: string;
  readonly host: 'H2' | 'H3' | 'standalone';
  readonly notes: number;
  readonly repeats: number;
  readonly dsp_load_avg: number;
  readonly pss_mb?: number;
  readonly peak_db?: number;
  readonly xruns: number;
  readonly status: 'ok' | 'failed';
  readonly spread: Readonly<Record<string, readonly [number, number]>>;
}

export interface BenchRun {
  readonly schema: 'omx-bench/1';
  readonly id: string;
  readonly machine: {
    readonly class: MachineClass;
    readonly model: string;
    readonly cpu?: string;
    readonly cores?: number;
    readonly ram_mb?: number;
    readonly os: string;
    readonly kernel?: string;
    readonly governor?: string;
  };
  readonly software: Readonly<Partial<Record<'plugin-hostd' | 'omx-clap-host' | 'mod-host' | 'jalv' | 'jack', string>>>;
  /** The JACK server of every row: driver, device, real-time priority, periods per buffer. */
  readonly jack?: { readonly driver: string; readonly device?: string; readonly priority?: number; readonly periods?: number };
  readonly scenarios: readonly BenchScenario[];
  readonly coverage?: {
    readonly set: string;
    readonly jalv?: number;
    readonly 'mod-host'?: number;
    readonly 'omx-clap-lv2'?: number;
  };
  readonly sources?: readonly string[];
  readonly add_times?: { readonly cold?: readonly AddTime[]; readonly warm?: readonly AddTime[] };
  readonly instruments?: readonly Instrument[];
  readonly profile?: {
    readonly audio_thread_shares: readonly { readonly where: string; readonly cvp24_lv2: string; readonly cvp24: string }[];
  };
  readonly qualification?: {
    readonly plugins: number;
    readonly seconds?: number;
    readonly lv2?: number;
    readonly clap?: number;
    readonly qualified_in_process?: number;
    readonly qualified_isolated?: number;
    readonly crashed?: number;
    readonly hung?: number;
    readonly refused?: number;
    readonly unmeasured?: number;
    readonly no_pin?: number;
    readonly records_package?: string;
    readonly packages_installed?: number;
    readonly packages_verified?: number;
    readonly rates?: readonly number[];
    readonly quanta?: readonly number[];
    readonly suitable?: number;
    readonly unsuitable?: number;
  };
}

export const HOSTS: readonly HostId[] = ['H1', 'H2', 'H3', 'H4'];
export const CLASSES: readonly MachineClass[] = ['rpi5', 'desk', 'ci'];

/** Run ids are `<class>-<yyyymmdd>-<seq>`: newest is the later day, then the higher sequence. */
export function compareRunIds(a: string, b: string): number {
  const [, dayA = '', seqA = '0'] = a.split('-');
  const [, dayB = '', seqB = '0'] = b.split('-');
  return dayA.localeCompare(dayB) || Number(seqA) - Number(seqB);
}

/** The newest run of each machine class that has one. */
export function latestPerClass(runs: readonly BenchRun[]): Map<MachineClass, BenchRun> {
  const out = new Map<MachineClass, BenchRun>();
  for (const run of runs) {
    const have = out.get(run.machine.class);
    if (!have || compareRunIds(run.id, have.id) > 0) out.set(run.machine.class, run);
  }
  return out;
}

/** A measured number as written, never rounded: 24 stays 24, 12.4 stays 12.4. */
export function show(n: number | null | undefined): string {
  return n === null || n === undefined ? '—' : String(n);
}

export interface Family {
  readonly id: string;
  readonly title: string;
}

/** The scenario families of a run in the order they first appear. */
export function families(run: BenchRun): Family[] {
  const out = new Map<string, Family>();
  for (const s of run.scenarios) if (!out.has(s.id)) out.set(s.id, { id: s.id, title: s.title });
  return [...out.values()];
}

/** A column of the comparison: a host in one mode. */
export interface Variant {
  readonly host: HostId;
  readonly mode: Mode | '';
}

export const variantKey = (v: { readonly host: HostId; readonly mode?: Mode | '' }): string => `${v.host}|${v.mode ?? ''}`;

const VARIANT_ORDER: readonly string[] = ['H2|chain-add', 'H2|chain', 'H1|shared-process', 'H3|shared-process', 'H2|individual', 'H2|', 'H1|', 'H3|', 'H4|'];

/** The columns of a family: every host and mode a row of it was measured in (or failed in), in a fixed order. */
export function variants(run: BenchRun, id: string): Variant[] {
  const seen = new Map<string, Variant>();
  for (const s of run.scenarios) if (s.id === id) seen.set(variantKey(s), { host: s.host, mode: s.mode ?? '' });
  const rank = (k: string) => { const i = VARIANT_ORDER.indexOf(k); return i < 0 ? VARIANT_ORDER.length : i; };
  return [...seen.entries()].sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0])).map(([, v]) => v);
}

export interface CompareRow {
  readonly rate: number;
  readonly frames: number;
  readonly stress: string;
  readonly cells: Readonly<Record<string, BenchScenario>>;
}

/** One row per rate, frames and stress of a family, one cell per host and mode. No row is dropped for its status. */
export function compareRows(run: BenchRun, id: string): CompareRow[] {
  const rows = new Map<string, { rate: number; frames: number; stress: string; cells: Record<string, BenchScenario> }>();
  for (const s of run.scenarios) {
    if (s.id !== id) continue;
    const stress = s.stress ?? 'none';
    const key = `${s.rate}|${s.frames}|${stress}`;
    const row = rows.get(key) ?? { rate: s.rate, frames: s.frames, stress, cells: {} };
    row.cells[variantKey(s)] ??= s;
    rows.set(key, row);
  }
  return [...rows.values()].sort((a, b) => a.rate - b.rate || a.frames - b.frames || a.stress.localeCompare(b.stress));
}

/** The largest load of a family's rows, the length of a full bar: the highest repeat when measured, else the median. */
export function barScale(rows: readonly CompareRow[]): number {
  let top = 0;
  for (const r of rows) {
    for (const s of Object.values(r.cells)) {
      const v = s.status === 'ok' ? (s.spread?.dsp_load_avg?.[1] ?? s.dsp_load_max ?? s.dsp_load_avg ?? 0) : 0;
      if (v > top) top = v;
    }
  }
  return top;
}

/** A bar's width as a percentage of the family's scale; 0 when there is nothing to scale. */
export function barPercent(value: number | null | undefined, scale: number): number {
  return value && scale > 0 ? (value / scale) * 100 : 0;
}

/** "lowest to highest" of a measure over the repeats, as measured; null when the row has no spread for it. */
export function spreadOf(s: BenchScenario | Instrument, key: string): readonly [number, number] | null {
  return s.spread?.[key] ?? null;
}

export type Failure = 'failed' | 'xruns';

export interface Acceptance {
  readonly pass: boolean;
  readonly reasons: readonly Failure[];
}

/**
 * The acceptance a row must meet: it ran (a host that was asked and did not is a failure, a host
 * that cannot run the scenario is declared unsupported and is not) and not one repeat had an xrun.
 * The median alone would hide a repeat with 21 xruns behind a 0, so the highest repeat decides.
 */
export function acceptance(s: Pick<BenchScenario, 'status' | 'xruns' | 'spread'>): Acceptance {
  const reasons: Failure[] = [];
  if (s.status === 'failed') reasons.push('failed');
  const worst = Math.max(s.xruns ?? 0, s.spread?.xruns?.[1] ?? 0);
  if (s.status === 'ok' && worst > 0) reasons.push('xruns');
  return { pass: reasons.length === 0, reasons };
}

export interface FailingRow {
  readonly runId: string;
  readonly scenario: BenchScenario;
  readonly reasons: readonly Failure[];
}

/** Every row of the given runs that fails the acceptance, in run and row order. Nothing is filtered by version or host. */
export function failingRows(runs: readonly BenchRun[]): FailingRow[] {
  const out: FailingRow[] = [];
  for (const run of runs) {
    for (const scenario of run.scenarios) {
      const a = acceptance(scenario);
      if (!a.pass) out.push({ runId: run.id, scenario, reasons: a.reasons });
    }
  }
  return out;
}

/** Rows measured under a stress other than none. */
export function stressRows(run: BenchRun): BenchScenario[] {
  return run.scenarios.filter((s) => s.stress !== undefined && s.stress !== 'none');
}

/** The runs of the same machine class and the same day as `run`, `run` first, the others by sequence, newest first. */
export function sameDayRuns(runs: readonly BenchRun[], run: BenchRun): BenchRun[] {
  const day = run.id.split('-')[1];
  const others = runs.filter((r) => r.id !== run.id && r.machine.class === run.machine.class && r.id.split('-')[1] === day);
  return [run, ...others.sort((a, b) => compareRunIds(b.id, a.id))];
}

/** A host as the headline table names it: the host, and for plugin-hostd the mode it ran in. */
export interface LowestHost {
  readonly key: string;
  readonly host: HostId;
  readonly mode?: Mode;
}

/** The hosts of the headline table, in order: plugin-hostd's chain and one-worker-per-plugin modes are apart. */
export const LOWEST_HOSTS: readonly LowestHost[] = [
  { key: 'H1', host: 'H1' },
  { key: 'H2|chain', host: 'H2', mode: 'chain' },
  { key: 'H2|individual', host: 'H2', mode: 'individual' },
  { key: 'H3', host: 'H3' },
  { key: 'H4', host: 'H4' },
];

export type LowestCell =
  | { readonly kind: 'clean'; readonly frames: number; readonly ms: number; readonly vsModHost: number | null; readonly vsJalv: number | null }
  | { readonly kind: 'none'; readonly smallest: number; readonly ms: number }
  | { readonly kind: 'unsupported' | 'failed'; readonly note: string }
  | { readonly kind: 'absent' };

export interface LowestLine {
  readonly host: LowestHost;
  readonly cell: LowestCell;
}

export interface LowestGroup {
  readonly family: string;
  readonly title: string;
  readonly rate: number;
  readonly lines: readonly LowestLine[];
}

/** Milliseconds of a buffer: frames over the rate. */
export const bufferMs = (frames: number, rate: number): number => (frames / rate) * 1000;

/** A row is clean when it ran and no repeat had an xrun (the highest repeat decides, as in the acceptance). */
const isClean = (s: BenchScenario): boolean => s.status === 'ok' && acceptance(s).pass;

function lowestCell(rows: readonly BenchScenario[], rate: number): Exclude<LowestCell, { kind: 'clean' }> | { kind: 'clean'; frames: number; ms: number } {
  if (rows.length === 0) return { kind: 'absent' };
  const clean = rows.filter(isClean).map((s) => s.frames);
  if (clean.length) {
    const frames = Math.min(...clean);
    return { kind: 'clean', frames, ms: bufferMs(frames, rate) };
  }
  const ran = rows.filter((s) => s.status === 'ok').map((s) => s.frames);
  if (ran.length) {
    const smallest = Math.min(...ran);
    return { kind: 'none', smallest, ms: bufferMs(smallest, rate) };
  }
  const failed = rows.find((s) => s.status === 'failed');
  if (failed) return { kind: 'failed', note: failed.note ?? '' };
  return { kind: 'unsupported', note: rows[0]!.note ?? '' };
}

/**
 * The headline: per scenario family and rate, per host, the smallest frames at which every repeat
 * had no xrun, with its milliseconds and its ratio to mod-host and to jalv. Read from the rows of
 * the run (stress none), nothing else.
 */
export function lowestBuffers(run: BenchRun): LowestGroup[] {
  const groups: LowestGroup[] = [];
  for (const f of families(run)) {
    const rows = run.scenarios.filter((s) => s.id === f.id && (s.stress ?? 'none') === 'none');
    const rates = [...new Set(rows.map((s) => s.rate))].sort((a, b) => a - b);
    for (const rate of rates) {
      const base = LOWEST_HOSTS.map((h) => ({
        host: h,
        cell: lowestCell(rows.filter((s) => s.rate === rate && s.host === h.host && (h.mode === undefined || h.host !== 'H2' || s.mode === h.mode)), rate),
      }));
      const framesOf = (key: string) => {
        const c = base.find((b) => b.host.key === key)?.cell;
        return c?.kind === 'clean' ? c.frames : null;
      };
      const mod = framesOf('H3');
      const jalv = framesOf('H4');
      const lines = base.map(({ host, cell }): LowestLine => cell.kind === 'clean'
        ? { host, cell: { ...cell, vsModHost: mod === null ? null : mod / cell.frames, vsJalv: jalv === null ? null : jalv / cell.frames } }
        : { host, cell });
      if (lines.every((l) => l.cell.kind === 'absent')) continue;
      groups.push({ family: f.id, title: f.title, rate, lines });
    }
  }
  return groups;
}
