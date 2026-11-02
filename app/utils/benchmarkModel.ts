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
export type Mode = 'individual' | 'chain' | 'chain-add' | 'shared-process';

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
