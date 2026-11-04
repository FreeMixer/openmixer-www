---
title: "Hosting paths compared: mod-host, omx-clap-host, the LV2 adapter and in-process"
summary: The same plugins cost the same per plugin on every hosting path, within about a microsecond, and no path adds latency. The differences in the whole graph come from CPU idle states and the number of nodes, not from how a host runs a plugin; what separates the paths is memory, start-up and what a crash takes with it.
measured: An Intel Core Ultra 9 285K build machine shared with other jobs, Fedora 44, kernel 7.2, PipeWire 1.6.9 on its dummy driver, 48 and 96 kHz at 64 to 512 frames, three runs of 60 s, October 2026; omx-plugins 0.7.0 and stock LV2 and CLAP plugins.
topic: core
order: 140
---

## The paths

| path | what runs the plugin |
|---|---|
| mod-host | mod-host 0.10.6 (the distribution's package), the LV2 build, one JACK client per plugin |
| omx-clap-host | the CLAP build, one JACK client per plugin |
| the adapter | the same omx-clap-host, the LV2 build through libomx-clap-lv2 |
| in-process CLAP | the CLAP build in a native PipeWire filter's process callback, through libomx-clap-core |
| in-process LV2 | the LV2 build the same way, opened through libomx-clap-lv2 |

At the time, omx-clap-host could not load an LV2 plugin by itself, so the adapter path loaded the LV2 plugins through a
bench-only `.clap` that links libomx-clap-lv2: it measures the adapter's code inside an unmodified omx-clap-host. The
in-process paths make the calls the console's in-process tier makes (open, activate, publish, run on the PipeWire data
thread, with the core's clamp, non-finite scan and warm-up on), but give each plugin a filter node of its own, where the
console runs a lane's plugins inline in its own node. Two figures are reported for them: the node's time, comparable with the
other paths' nodes, and the inline time, the run call alone, which is what a plugin adds to a console's cycle.

The plugins: omx-plugins comp, delay, deesser, eq8 and reverb in both builds; an LSP stereo compressor and Dragonfly Room as
CLAP; ZamCompX2, caps PlateX2 and caps CompressX2 as LV2. So the CLAP paths run seven plugins and the LV2 paths eight, and
the comparison across formats is the five omx twins. Every plugin of a path is racked in one host, each fed the same stereo
white noise at -20 dBFS and recorded; a pad carries a unit impulse four times a second, against a direct link carrying the
same impulse.

## What was measured

- **Node time per cycle**: pw-profiler's active to finished for each plugin's node, every cycle of the window: the plugin
  plus what its host does around it.
- **Inline time** (in-process only): the run call timed on the data thread.
- **Cycle end**: the driver's time from wake-up to the last node finished.
- **Overruns**: cycles whose end passed their period; **late**: probe cycles more than 1.5 periods after the one before.
- **Added latency**: the impulse through the pad against the direct link, in frames.
- **Memory**: the host's resident set, empty and with every plugin racked.
- **Start-up**: host spawn to ready; `add` to its answer; `add` to the first sound at the recorder.
- **Crash**: the host killed while it runs a plugin, then respawned; and on the CLAP paths, a test plugin made to abort
  beside a healthy one in the same host.

## The whole graph

Median of three 60 s runs. mod-host, the adapter and in-process LV2 run the same eight plugins; omx-clap-host and in-process
CLAP the same seven.

| rate | quantum | path | plugins | cycle end p50 µs | cycle end p99 µs | overruns | host CPU % | RSS MiB |
|---|---|---|---|---|---|---|---|---|
| 48000 | 128 | mod-host | 8 | 250.2 | 719.4 | 3 | 8.2 | 40.0 |
| 48000 | 128 | omx-clap-host | 7 | 287.5 | 759.9 | 5 | 9.1 | 40.1 |
| 48000 | 128 | adapter | 8 | 293.3 | 772.7 | 3 | 10.0 | 26.5 |
| 48000 | 128 | in-process CLAP | 7 | 337.5 | 788.5 | 2 | 8.5 | 38.3 |
| 48000 | 128 | in-process LV2 | 8 | 265.5 | 692.5 | 4 | 7.9 | 22.8 |
| 96000 | 128 | mod-host | 8 | 275.4 | 748.1 | 20 | 23.7 | 40.4 |
| 96000 | 128 | omx-clap-host | 7 | 447.0 | 926.9 | 230 | 32.4 | 40.3 |
| 96000 | 128 | adapter | 8 | 403.0 | 844.6 | 17 | 31.4 | 26.7 |
| 96000 | 128 | in-process CLAP | 7 | 446.2 | 915.4 | 109 | 35.4 | 38.8 |
| 96000 | 128 | in-process LV2 | 8 | 436.9 | 863.4 | 18 | 33.5 | 22.9 |

At 96 kHz and 64 frames every path overran on this machine with these sets (98 for mod-host, 310 to 332 for the adapter and
in-process LV2); the CLAP set's overruns at 96 kHz and 128 frames follow the reverb's maxima, 1.3 to 1.5 ms against a period
of 1.33 ms.

## Per plugin

The node's own time per cycle, p50 / p99 / max, µs, 48 kHz and 128 frames; for in-process, the inline time:

| plugin | mod-host | omx-clap-host | adapter | in-process CLAP inline | in-process LV2 inline |
|---|---|---|---|---|---|
| omx-comp | 3.6 / 19.5 / 46 | 4.3 / 29.3 / 63 | 5.1 / 17.9 / 52 | 3.5 / 15.7 / 44 | 4.2 / 16.9 / 59 |
| omx-delay | 2.1 / 9.2 / 25 | 2.1 / 10.8 / 44 | 2.9 / 13.6 / 37 | 2.0 / 9.3 / 52 | 2.5 / 10.4 / 49 |
| omx-deesser | 4.5 / 22.9 / 53 | 4.5 / 25.9 / 54 | 5.1 / 29.5 / 59 | 4.5 / 22.6 / 46 | 5.0 / 20.9 / 51 |
| omx-eq8 | 2.1 / 10.1 / 23 | 1.9 / 8.8 / 34 | 2.6 / 12.1 / 38 | 1.8 / 8.1 / 24 | 2.2 / 9.9 / 23 |
| omx-reverb | 5.7 / 28.9 / 59 | 5.9 / 24.4 / 55 | 6.7 / 32.6 / 67 | 5.5 / 23.6 / 69 | 6.5 / 23.9 / 68 |
| ZamCompX2 | 3.9 / 20.2 / 46 | | 4.4 / 22.2 / 56 | | 3.9 / 17.1 / 46 |
| caps PlateX2 | 5.7 / 29.1 / 61 | | 6.3 / 26.6 / 93 | | 5.8 / 23.4 / 68 |
| caps CompressX2 | 9.8 / 57.3 / 118 | | 10.3 / 58.0 / 119 | | 9.9 / 54.8 / 115 |
| LSP compressor | | 6.6 / 28.5 / 67 | | 6.5 / 25.8 / 71 | |
| Dragonfly Room | | 28.4 / 140.0 / 1462 | | 27.9 / 128.4 / 1448 | |

## Start-up and memory

| path | node p50 µs (all plugins and configurations) | inline p50 µs | `add` ms | `add` to first sound ms | host ready ms | RSS empty MiB | RSS per plugin MiB |
|---|---|---|---|---|---|---|---|
| mod-host | 7.3 | | 4.2 | 68.6 | 24.4 | 19.4 | 2.31 |
| omx-clap-host | 8.3 | | 4.5 | 68.2 | 13.5 | 5.8 | 4.30 |
| adapter | 7.5 | | 3.7 | 67.2 | 13.7 | 5.8 | 2.31 |
| in-process CLAP | 13.5 | 8.3 | 13.2 | 75.9 | 2.6 | 3.3 | 4.41 |
| in-process LV2 | 13.1 | 8.4 | 12.6 | 74.9 | 2.5 | 3.3 | 2.17 |

## A crash

At 48 kHz and 128 frames, three times per path: a SIGKILL of the host silences its plugins within 1 to 3 ms, the graph keeps
cycling (no late cycle; the probe's longest gap 3.0 to 4.4 ms against a 2.67 ms period), and a respawned host sounds again 70
to 100 ms later. A plugin that aborts takes its host down 150 to 175 ms after the write that triggers it (the abort and its
core dump), and every other plugin in that host with it; the graph survived on both CLAP paths. In process, the host process
is the console: the same crash there is the console's audio gone until the engine restarts.

## What the numbers say

- **A plugin costs the same on every path.** For the same plugin at the same rate and quantum, the node's median on mod-host,
  omx-clap-host and the adapter lie within about 1 µs of each other and of the in-process inline time (omx-eq8: 2.1, 1.9, 2.6
  and 1.8 to 2.2 µs; caps CompressX2: 9.8, 10.3 and 9.9 µs). The tails move by tens of microseconds between repetitions of
  one configuration: that is the machine, not the path.
- **The bench's in-process node costs 2 to 5 µs more than the other nodes**, while its inline time matches them: the price
  of the bench's own filter per plugin (four port buffers, two copies) on top of the core's stage. A console running the
  plugin inline in its lane pays the inline figure and no node.
- **No path adds latency.** The impulse through the pad arrived in the cycle it left on every path, rate and quantum, every
  impulse of every run. A JACK client in a PipeWire graph is scheduled synchronously in the cycle, so a mod-host plugin costs
  no extra quantum.
- **Memory**: on the same eight plugins, 40 MiB resident for mod-host (19 MiB before any plugin: it loads the whole LV2
  world), 26.5 MiB for omx-clap-host with the adapter, 22.8 MiB in process. About 2.2 to 2.3 MiB per LV2 plugin on all three.
- **Start-up**: a host is ready in 2.5 ms in process, 13.5 ms for omx-clap-host, 24 ms for mod-host.

## What the whole-graph figure measures

On the same eight LV2 plugins mod-host had the lowest cycle end in every configuration, while its nodes cost the same as the
others'. The same harness at 96 kHz and 128 frames, with `/dev/cpu_dma_latency` held to refuse CPU idle states, shows why.
Cycle end p50, µs, one to three runs each:

| idle states | mod-host | adapter | in-process LV2 |
|---|---|---|---|
| all allowed (C1, C2, C3) | 265, 279 | 380, 400, 412 | 413 |
| `cpu_dma_latency` 1000 µs: C3 refused | 243, 244 | 273, 333 | 248, 322 |
| `cpu_dma_latency` 10 µs: C1 only | 80 | 73 | 95 |
| `cpu_dma_latency` 0: none | 26, 30 | 23, 31 | 24, 25 |

- **Most of the whole-graph figure is the exit from idle states.** With idle states allowed, the probe's source wakes the
  nine plugin nodes about 10 µs apart for the first four or five, then the rest 60 to 130 µs later: their cores were in C2 or
  deeper. With none allowed they wake about 1.1 µs apart, and the paths are equal.
- **mod-host's lead is its two always-running clients.** Besides one client per plugin, mod-host runs its own `mod-host`
  client and `mod-monitor`, which wake every cycle and keep more cores out of deep idle. Idle JACK clients added to the
  adapter path shorten its cycle the same way, and with six on every path the order goes away.

So it is the number of nodes that costs, not the host. That is what led to running a chain in one JACK client (see [One JACK
client for a chain](/notes/one-jack-client-for-a-chain)) and to the idle-state hold (see [CPU idle states and plugin
hosting](/notes/cpu-idle-states-and-plugin-hosting)).

## Limits

The machine was a shared build machine under a load of about 3, with the `powersave` governor, no isolation and no pinning:
the tails and the whole-graph figures carry its noise. The graph ran on PipeWire's dummy driver in a container; a real driver
wakes differently. The plugins were fed white noise; a plugin whose cost depends on its input would read differently on
programme material. Three stock LV2 plugins the adapter refused then, and one with a MIDI input, are not in the LV2 set.

## What followed

On the plugins every path can host, the paths cost the same per plugin: the plugin's own `process()` dominates, and the
host's wrapper adds about a microsecond. In process costs the plugin's inline time and nothing else, but a crash there takes
the console's audio with it, where out of process the graph lives and a respawn sounds within 0.1 s. So plugin-hostd's
default worker became omx-clap-host, out of process, for CLAP plugins and, through the adapter, for the LV2 plugins it
admits, with mod-host kept for the rest and in-process only for plugins qualification admits.
