# Benchmark data

What the bench harness of `plugin-hostd` measured: one JSON document per run, format `omx-bench/1`.
The website's `/benchmarks` page is generated from the newest run of each machine class in `runs/`.

- `schema/omx-bench.v1.schema.json`: the contract (JSON Schema 2020-12), the one the harness writes to.
- `runs/<run id>.json`: one run each. The file name is the run id, `<class>-<yyyymmdd>-<seq>`, and the
  class is `rpi5`, `desk` or `ci`.

`npm run benchmarks:check` validates every run against the schema and refuses a file name that is not
the run id, a class the id and the machine disagree on, a scenario measured twice, a maximum below its
average, and a chain or shared process on a host that does not run one. The website build runs it first.

## The hosts

| Id | Host |
| --- | --- |
| H1 | omx-clap-host alone, driven through the mod-host protocol on its own port |
| H2 | plugin-hostd with omx-clap-host as its worker |
| H3 | mod-host (LV2 only) |
| H4 | jalv, one process per plugin |

## Scenarios

A scenario is one host running one set of plugins at one rate and frames. `id` names the family the page
shows as one table (`idle`, `clap1`, `lv2-1`, `chain3`, `clap16`, `pianoteq`), `title` is its text.
A host that cannot run a scenario has `status: "unsupported"` and the reason in `note`; a host that dies has
`status: "failed"` and the reason in `note` (`host process lost` when it was killed). A number is a measured
value or absent. `dsp_load_avg` and `dsp_load_max` are percent of the audio cycle. `recover_ms` is the time
from `kill -9` of the process that holds one plugin until audio runs again, and only H2 has one.

## Chains and processes

The family `chains-vs-processes` runs the same N plugins (`plugins` lists them) in each mode at the same
rate and frames, one scenario per mode and host, `mode` saying which:

| Mode | Host | What runs |
| --- | --- | --- |
| `individual` | H2 | no chain declared, each instance in its own worker (`worker_list` shows N workers) |
| `individual` | H4 | N jalv processes |
| `shared-process` | H1 | N instances inside the one omx-clap-host process |
| `chain` | H2 | one chain (`chain 1 <ids>`), one worker |

Per mode the scenario records `processes` (the daemon plus its workers, from `worker_list` and `/proc`),
`rss_mb_total` and `pss_mb_total` (the sums over those processes of `VmRSS` and of the `Pss` field of
`/proc/<pid>/smaps_rollup`), `cpu_pct` (utime plus stime of those processes over a ten second window, in
percent of one core), `ctx_switches` (voluntary plus involuntary over the same window), `add_ms` (the
whole set) and the DSP load as in every other scenario.

## Adding a run

Run the bench harness on the machine, copy the document it writes to `benchmarks/runs/<run id>.json`
without editing a figure, run `npm run benchmarks:check`, and open a pull request. A run replaces the one
shown for its class when its day is later, or its sequence higher on the same day.

## Versioning

`schema` is the string `omx-bench/1`. Adding an optional field keeps the version; renaming or removing a
field or changing its meaning is a new version with its own schema file.
