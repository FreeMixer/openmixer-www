// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * The benchmark runs the /benchmarks page renders: every file of benchmarks/runs/, read at build
 * time. `npm run benchmarks:check` has validated each against benchmarks/schema before this module
 * is bundled. The functions that derive the tables are in benchmarkModel.ts.
 */

const files = import.meta.glob<BenchRun>('../../benchmarks/runs/*.json', { eager: true, import: 'default' });

/** Every run, as committed. */
export function benchRuns(): BenchRun[] {
  return Object.values(files);
}

/** The run of each machine class the site shows: the newest of that class. */
export function benchLatest(): Map<MachineClass, BenchRun> {
  return latestPerClass(benchRuns());
}
