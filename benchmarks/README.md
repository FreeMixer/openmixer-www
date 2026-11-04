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

## Repeats, xruns and acceptance

A scenario measured over several repeats records `repeats`, the median of each measure beside it, and
`spread`: per measure, `[lowest, highest]` over the repeats. `xruns` is the median number of xruns of a
repeat and `spread.xruns` the lowest and highest repeat. The check refuses a repeated row that records no
xruns, a figure outside its own spread and a spread that runs backwards.

The acceptance of a row is that it ran and that no repeat had an xrun. The page decides it from the highest
repeat, never from the median alone, marks a row that fails, and lists every such row of the day's runs.
A row is never dropped for failing: `status: "failed"` keeps the reason in `note`.

`stress` names the load applied while measuring (`none` for an idle graph). A run with no stress rows says
so on the page.

## Scenarios of the Pi 5 matrix

`cvp24` is 24 plugins with CLAP builds (Calf as LV2), `cvp24-lv2` the same 24 as LV2 builds, `tp10` ten
third-party LV2 effects. `mode` names how a host ran them:

| Mode | Host | What runs |
| --- | --- | --- |
| `chain-add` | H2 | plugins added one by one into one chain, one worker |
| `chain` | H2 | the chain built after the adds |
| `individual` | H2 | no chain, each instance in its own worker |
| `shared-process` | H1, H3 | every instance inside the one process |

Per row: `processes`, `rss_mb_total`, `pss_mb_total` (sums over the host's processes of `VmRSS` and of the
`Pss` field of `/proc/<pid>/smaps_rollup`), `cpu_pct`, `ctx_switches`, `jack_clients`, `latency_frames`,
`add_ms` and the DSP load. A row can carry `software` for a version that differs from the run's: the
`rpi5-20261102-2` run has omx-clap-host rows on omx-clap-core 0.26.3 and plugin-hostd rows on 0.26.4.

## Other sections of a run

`add_times` (cold and warm, each with median, lowest and highest), `instruments` (DSP load, PSS, xruns and
peak per note count), `qualification` (the device's counts), `profile` (shares of the worker's audio thread)
and `sources` (the records the figures were read from).

## Adding a run

Run the bench harness on the machine, copy the document it writes to `benchmarks/runs/<run id>.json`
without editing a figure, run `npm run benchmarks:check`, and open a pull request. A run replaces the one
shown for its class when its day is later, or its sequence higher on the same day. The page also lists the
rows that did not pass in the other runs of that day.

`rpi5-20261102-1.json` is the document the harness wrote for every host on omx-clap-core 0.26.3. `rpi5-20261102-2.json`
is composed from the device runs of the same day: its H1 and H3 rows are the first run's, its H2 rows the same bench
rerun on 0.26.4, each row unedited. The method and every table are in the technical note
[plugin-hostd on a Raspberry Pi 5](https://openmixer.org/notes/plugin-hostd-on-a-raspberry-pi-5).

## Versioning

`schema` is the string `omx-bench/1`. Adding an optional field keeps the version; renaming or removing a
field or changing its meaning is a new version with its own schema file.
