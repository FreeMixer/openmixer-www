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
export type Mode = 'individual' | 'chain' | 'shared-process';

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
  readonly qualification?: {
    readonly plugins: number;
    readonly seconds: number;
    readonly rates?: readonly number[];
    readonly quanta?: readonly number[];
    readonly suitable?: number;
    readonly unsuitable?: number;
  };
}

export const HOSTS: readonly HostId[] = ['H1', 'H2', 'H3', 'H4'];
export const CLASSES: readonly MachineClass[] = ['rpi5', 'desk', 'ci'];
/** The scenario family the chains-versus-processes table shows. */
export const CVP = 'chains-vs-processes';
const MODE_ORDER: readonly Mode[] = ['individual', 'shared-process', 'chain'];

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

/** The scenario families of a run in the order they first appear, chains-vs-processes apart. */
export function families(run: BenchRun): Family[] {
  const out = new Map<string, Family>();
  for (const s of run.scenarios) if (s.id !== CVP && !out.has(s.id)) out.set(s.id, { id: s.id, title: s.title });
  return [...out.values()];
}

export interface CompareRow {
  readonly rate: number;
  readonly frames: number;
  readonly cells: Readonly<Partial<Record<HostId, BenchScenario>>>;
}

/** One row per rate and frames of a family, the four hosts as columns. */
export function compareRows(run: BenchRun, id: string): CompareRow[] {
  const rows = new Map<string, { rate: number; frames: number; cells: Partial<Record<HostId, BenchScenario>> }>();
  for (const s of run.scenarios) {
    if (s.id !== id) continue;
    const key = `${s.rate}|${s.frames}`;
    const row = rows.get(key) ?? { rate: s.rate, frames: s.frames, cells: {} };
    row.cells[s.host] ??= s;
    rows.set(key, row);
  }
  return [...rows.values()].sort((a, b) => a.rate - b.rate || a.frames - b.frames);
}

/** The largest load of a family's rows, the length of a full bar: the maximum when measured, else the average. */
export function barScale(rows: readonly CompareRow[]): number {
  let top = 0;
  for (const r of rows) {
    for (const s of Object.values(r.cells)) {
      const v = s?.status === 'ok' ? (s.dsp_load_max ?? s.dsp_load_avg ?? 0) : 0;
      if (v > top) top = v;
    }
  }
  return top;
}

/** A bar's width as a percentage of the family's scale; 0 when there is nothing to scale. */
export function barPercent(value: number | null | undefined, scale: number): number {
  return value && scale > 0 ? (value / scale) * 100 : 0;
}

/** A difference of two measured numbers, without floating-point noise. */
export function diff(a: number, b: number): number {
  return Number((a - b).toPrecision(12));
}

export interface IsolationLoad {
  readonly id: string;
  readonly title: string;
  readonly rate: number;
  readonly frames: number;
  readonly h1: number;
  readonly h2: number;
  /** H2 load minus H1 load. */
  readonly delta: number;
}

export interface IsolationRecover {
  readonly id: string;
  readonly title: string;
  readonly rate: number;
  readonly frames: number;
  readonly recoverMs: number;
  /** The hosts that lost the process and recovered nothing, with their own note. */
  readonly lost: readonly { readonly host: HostId; readonly note: string }[];
}

/** What isolation costs: H2 load minus H1 load wherever both ran the same scenario. */
export function isolationLoads(run: BenchRun): IsolationLoad[] {
  const out: IsolationLoad[] = [];
  for (const f of families(run)) {
    for (const row of compareRows(run, f.id)) {
      const [h1, h2] = [row.cells.H1, row.cells.H2];
      if (h1?.status !== 'ok' || h2?.status !== 'ok') continue;
      if (h1.dsp_load_avg == null || h2.dsp_load_avg == null) continue;
      out.push({ id: f.id, title: f.title, rate: row.rate, frames: row.frames, h1: h1.dsp_load_avg, h2: h2.dsp_load_avg, delta: diff(h2.dsp_load_avg, h1.dsp_load_avg) });
    }
  }
  return out;
}

/** What isolation buys: the time H2 takes to run again after the worker is killed, against the hosts that are lost. */
export function isolationRecovers(run: BenchRun): IsolationRecover[] {
  const out: IsolationRecover[] = [];
  for (const f of families(run)) {
    for (const row of compareRows(run, f.id)) {
      const h2 = row.cells.H2;
      if (h2?.recover_ms == null) continue;
      const lost = HOSTS.filter((h) => h !== 'H2' && row.cells[h]?.status === 'failed')
        .map((host) => ({ host, note: row.cells[host]?.note ?? '' }));
      out.push({ id: f.id, title: f.title, rate: row.rate, frames: row.frames, recoverMs: h2.recover_ms, lost });
    }
  }
  return out;
}

export interface CvpGroup {
  readonly n: number;
  readonly rate: number;
  readonly frames: number;
  /** One scenario per mode and host, for the same plugins. */
  readonly rows: readonly BenchScenario[];
}

/** The chains-versus-processes rows grouped by plugin count, rate and frames. */
export function cvpGroups(run: BenchRun): CvpGroup[] {
  const groups = new Map<string, { n: number; rate: number; frames: number; rows: BenchScenario[] }>();
  for (const s of run.scenarios) {
    if (s.id !== CVP) continue;
    const n = s.plugins?.length ?? 0;
    const key = `${n}|${s.rate}|${s.frames}`;
    const g = groups.get(key) ?? { n, rate: s.rate, frames: s.frames, rows: [] };
    g.rows.push(s);
    groups.set(key, g);
  }
  const modeRank = (s: BenchScenario) => (s.mode ? MODE_ORDER.indexOf(s.mode) : MODE_ORDER.length);
  return [...groups.values()]
    .map((g) => ({ ...g, rows: [...g.rows].sort((a, b) => modeRank(a) - modeRank(b) || a.host.localeCompare(b.host)) }))
    .sort((a, b) => a.n - b.n || a.rate - b.rate || a.frames - b.frames);
}

export interface CvpRatio {
  readonly n: number;
  readonly rate: number;
  readonly frames: number;
  /** Individual processes over the one chain, under plugin-hostd; null when either figure is missing or zero. */
  readonly processes: number | null;
  readonly pss: number | null;
  readonly cpu: number | null;
}

const ratio = (a: number | null | undefined, b: number | null | undefined): number | null =>
  a == null || b == null || b === 0 ? null : Number((a / b).toPrecision(2));

/** For each group that has H2 both as individual workers and as one chain: how many times the chain's figures the individual mode uses. */
export function cvpRatios(run: BenchRun): CvpRatio[] {
  const out: CvpRatio[] = [];
  for (const g of cvpGroups(run)) {
    const ind = g.rows.find((s) => s.host === 'H2' && s.mode === 'individual' && s.status === 'ok');
    const chain = g.rows.find((s) => s.host === 'H2' && s.mode === 'chain' && s.status === 'ok');
    if (!ind || !chain) continue;
    out.push({
      n: g.n,
      rate: g.rate,
      frames: g.frames,
      processes: ratio(ind.processes, chain.processes),
      pss: ratio(ind.pss_mb_total, chain.pss_mb_total),
      cpu: ratio(ind.cpu_pct, chain.cpu_pct),
    });
  }
  return out;
}
