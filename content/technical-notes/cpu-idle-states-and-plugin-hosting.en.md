---
title: "CPU idle states and plugin hosting: what holding cpu_dma_latency buys"
summary: Holding /dev/cpu_dma_latency at 10 µs, so no core sleeps deeper than C1, cuts the audio graph's cycle three to five times on every host measured and removes the overruns, for one to four watts; holding it at 0 costs sixty watts for a little more. With the hold, mod-host's lead over the other hosts disappears.
measured: An Intel Core Ultra 9 275HX desktop (8 performance and 16 efficiency cores), Fedora 44, kernel 7.2, PipeWire 1.6.9, 96 and 48 kHz at 128 frames, October 2026.
topic: core
order: 150
---

## The question

The host library can hold `/dev/cpu_dma_latency` while it runs, which tells the kernel not to put any core in an idle
state whose exit takes longer than the value. The same plugins were run through mod-host, omx-clap-host (CLAP and the LV2
adapter), the in-process tier, plugin-hostd and jalv, with the device held at nothing, at 10 µs (C1 only, the shipped
default) and at 0 (no idle state).

| path | what holds the device |
|---|---|
| omx-clap-host, CLAP and adapter | its own `--idle-hold=<off|µs>` |
| in-process CLAP and LV2 | the same library call the console's in-process tier makes |
| plugin-hostd | its worker, omx-clap-host, with the option passed through |
| mod-host, jalv | nothing of their own: the bench keeps the same request open for the run, as a setup script would |

"Off" is the machine at rest: its tuned profile held the device at 4000 µs, which refuses no state (C3 exits in 1048 µs).
The three holds interleaved per repetition, so a drift of the machine over the hour does not line up with one hold. The
CLAP rows carry seven plugins, the LV2 rows eight.

## The machine

Intel Core Ultra 9 275HX (8 performance and 16 efficiency cores, 24 threads), the performance governor, `intel_idle` with the
menu governor, states POLL, C1 (1 µs), C2 (127 µs) and C3 (1048 µs), all enabled. Watts are the package's RAPL counter,
integrated over each run's 30 s window. Another real-time audio graph ran on the same machine and is inside every watt
figure: only the differences between holds mean anything, not the level.

## The whole graph

Cycle end is the driver's time from wake-up to the last node finished; overruns are cycles that ended past their period.
96 kHz, 128 frames (period 1333 µs), median of three repetitions:

| path | hold | cycle end p50 µs | cycle end p99 µs | overruns / 30 s | host CPU % | RSS MiB | package W |
|---|---|---|---|---|---|---|---|
| mod-host | off | 235 | 675 | 19 | 20.7 | 41.0 | 19.4 |
| mod-host | 10 | 74 | 116 | 0 | 8.6 | 41.0 | 18.6 |
| mod-host | 0 | 27 | 47 | 1 | 3.7 | 40.9 | 79.3 |
| omx-clap-host CLAP | off | 324 | 720 | 14 | 16.5 | 42.6 | 17.9 |
| omx-clap-host CLAP | 10 | 103 | 183 | 0 | 10.4 | 42.4 | 20.1 |
| omx-clap-host CLAP | 0 | 41 | 103 | 0 | 4.4 | 42.5 | 79.6 |
| omx-clap-host adapter | off | 355 | 756 | 26 | 15.8 | 28.8 | 18.0 |
| omx-clap-host adapter | 10 | 72 | 120 | 0 | 8.6 | 28.8 | 19.2 |
| omx-clap-host adapter | 0 | 26 | 42 | 0 | 3.8 | 28.7 | 79.7 |
| in-process CLAP | off | 369 | 797 | 39 | 18.8 | 40.5 | 17.8 |
| in-process CLAP | 10 | 101 | 186 | 0 | 10.9 | 40.9 | 19.5 |
| in-process CLAP | 0 | 43 | 80 | 1 | 4.8 | 40.6 | 79.6 |
| in-process LV2 | off | 392 | 768 | 17 | 18.2 | 24.6 | 17.6 |
| in-process LV2 | 10 | 72 | 127 | 1 | 9.6 | 24.6 | 19.4 |
| in-process LV2 | 0 | 26 | 44 | 0 | 3.8 | 24.6 | 79.6 |
| plugin-hostd | off | 224 | 644 | 3 | 26.1 | 91.4 | 18.1 |
| plugin-hostd | 10 | 82 | 139 | 1 | 16.5 | 91.5 | 19.5 |
| plugin-hostd | 0 | 27 | 140 | 0 | 7.2 | 91.6 | 79.8 |
| jalv | off | 341 | 816 | 23 | 16.6 | 109.4 | 21.1 |
| jalv | 10 | 72 | 121 | 0 | 8.2 | 109.3 | 20.7 |
| jalv | 0 | 26 | 50 | 0 | 3.4 | 109.4 | 78.9 |

At 48 kHz and 128 frames the story is the same with higher numbers: 243 to 439 µs at rest, 80 to 118 at 10 and 26 to 49 at
0, and no path overran in any hold.

## What it says

- **The hold at 10 µs cuts the cycle end three to five times on every path, and mod-host's lead is gone.** With the hold
  off, mod-host and plugin-hostd end their cycles at 224 to 235 µs, where omx-clap-host and the in-process tier take 324 to
  392. At 10 every path sits between 72 and 103 µs; at 0 between 26 and 43. mod-host's advantage at rest was the cores its
  extra clients kept awake; once no core sleeps past C1 the hosts are equal for one plugin set. The two CLAP rows stay about
  30 µs above the LV2 rows at every hold: that is the CLAP paths' own cost, not an idle effect.
- **Overruns go with it**: 14 to 39 per 30 s with the hold off at 96 kHz, 0 or 1 at 10.
- **10 µs costs one to four watts; 0 costs sixty.** At 96 kHz the hold at 10 reads 1.2 to 2.2 W more than rest on most
  paths; at 48 kHz 1.6 to 3.7 W more, since the cores have twice as long to sleep between cycles there. The hold at 0 refuses
  even C1, so every thread polls between cycles: 58 to 64 W more, four times the package power, for a further 45 to 60 µs of
  cycle end. So 10 µs is the default, and 0 only an explicit choice.
- **Host CPU is clock time**, so it falls as cycles shorten; it is not the host working less.
- **Memory does not move with the hold.** Between paths: in-process LV2 25 MiB, the adapter 29, mod-host and the CLAP rows
  41 to 43, plugin-hostd 91 (the daemon and its worker), jalv 109 for eight processes.

## Per plugin

The node's own time per cycle (the plugin plus what its host does inside the node's cycle), 96 kHz, 128 frames, median of
three repetitions, µs, hold off / 10 / 0:

| plugin | mod-host | omx-clap-host CLAP | adapter | in-process CLAP | in-process LV2 | plugin-hostd | jalv |
|---|---|---|---|---|---|---|---|
| omx-comp | 3.8 / 2.7 / 2.4 | 4.6 / 5.4 / 2.7 | 3.1 / 4.1 / 2.4 | 3.9 / 3.5 / 3.5 | 3.3 / 3.3 / 3.2 | 5.5 / 5.6 / 2.6 | 2.6 / 2.4 / 2.2 |
| omx-delay | 2.2 / 1.2 / 0.9 | 2.8 / 1.3 / 0.8 | 3.4 / 1.5 / 0.9 | 5.0 / 3.7 / 1.6 | 5.6 / 3.9 / 1.8 | 3.1 / 2.3 / 1.0 | 4.0 / 2.0 / 0.8 |
| omx-deesser | 4.6 / 5.7 / 3.3 | 6.1 / 6.7 / 3.6 | 5.5 / 5.8 / 3.4 | 8.2 / 8.2 / 3.9 | 7.6 / 7.6 / 3.4 | 6.1 / 6.2 / 3.4 | 5.5 / 5.7 / 3.2 |
| omx-eq8 | 1.7 / 1.2 / 0.6 | 1.9 / 1.1 / 0.5 | 2.4 / 1.5 / 0.6 | 4.6 / 2.7 / 1.5 | 5.4 / 3.1 / 1.4 | 2.5 / 2.0 / 0.7 | 2.3 / 1.4 / 0.5 |
| omx-reverb | 5.8 / 7.7 / 3.7 | 5.7 / 7.3 / 3.2 | 6.3 / 7.7 / 3.5 | 8.2 / 8.5 / 4.5 | 8.5 / 8.8 / 4.0 | 8.0 / 8.6 / 3.9 | 6.5 / 7.0 / 3.2 |
| ZamCompX2 | 3.8 / 4.6 / 2.4 | | 4.4 / 5.0 / 2.5 | | 6.7 / 6.6 / 3.1 | 5.2 / 5.5 / 2.7 | 4.1 / 4.6 / 2.4 |
| caps PlateX2 | 5.7 / 9.4 / 4.4 | | 6.2 / 9.7 / 4.3 | | 8.8 / 11.2 / 5.2 | 7.1 / 9.8 / 4.6 | 6.0 / 8.8 / 4.3 |
| caps CompressX2 | 9.8 / 16.8 / 8.5 | | 10.2 / 16.8 / 8.6 | | 12.8 / 19.0 / 9.7 | 11.6 / 17.4 / 7.9 | 10.0 / 16.7 / 8.4 |
| LSP compressor | | 5.7 / 4.8 / 2.0 | | 8.3 / 6.0 / 2.8 | | | |
| Dragonfly Room | | 28.0 / 49.6 / 25.0 | | 31.5 / 51.1 / 26.7 | | | |

- **Across hosts, at one hold, a plugin costs the same within one or two microseconds.** The in-process rows read one to
  three microseconds higher on the light plugins: the per-block guards the in-process tier runs (a clamp and a non-finite
  scan), which the socket hosts do not.
- **The hold's effect per node is not monotonic.** From rest to 10 the light plugins get faster but the heavy ones slower, on
  every host alike: one compressor from about 10 to 17 µs, a reverb from 28 to 50. At 0 everything is fastest. The whole
  graph still gains at 10, because the idle-state exit it removes is hundreds of microseconds.

Two checks were made for that slowdown, and neither explains it. Core placement: the host's real-time threads sat on
performance cores 65 % of the time at rest, 77 % at 10 and 61 % at 0, so the slowest hold had the most performance-core
time. Clocks: the uncore held its maximum under every hold, and the cores read 3.8 to 4.6 GHz at rest and at 10. So a
reverb or a look-ahead compressor runs slower per cycle with every core halted in C1, on every host, and this run does not
say why. The whole-graph gain stands over it by an order of magnitude.

## jalv, as Zynthian runs a layer

One `jalv -i` process per plugin, eight processes, the LV2 build of the same set:

- **Eight processes cost the same cycle as one.** With the hold at 10, jalv ends the cycle at 72 µs against 72 to 74 for
  mod-host and the adapter in one process; at 0, 26 against 26 to 27.
- **They cost memory and a little power**: 109 MiB for eight jalv processes against 29 to 41 for one process holding the
  same plugins.
- **jalv's probe cycles arrive late more often** at every hold, though its node times per plugin are everyone's.
- **A plugin GUI shown on a virtual X server changes the cycle by nothing** and costs 94 MiB and about a watt.

## Caveats

One machine, one plugin set, 30 s windows, three repetitions. The in-process rows are the bench's own small host making
the same library calls as the console's tier, not the console itself.
