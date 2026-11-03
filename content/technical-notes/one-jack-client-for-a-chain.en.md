---
title: "One JACK client for a chain: what it saves and what it does not"
summary: Running N plugins in series inside one JACK client, instead of N clients linked in series, is bit-identical and cuts the cycle's end time by 30 to 56 % at the median and the host's CPU by a third or more, with no xrun and no worse tail; the saving is the wake-ups, not the plugins.
measured: A 4-CPU Fedora 44 container on a shared machine, PipeWire 1.6.9 on its dummy driver, 48 and 96 kHz at 64 and 128 frames, October 2026; omx-plugins 0.12.0 and stock LV2 and CLAP plugins.
topic: core
order: 130
---

## The question

omx-clap-host gives every plugin its own JACK client, and every client is a node of the graph with its own wake-up per
cycle. The question was whether N plugins in series in one client are bit-identical with the same N plugins in N clients
linked in series, and whether the bench's numbers get better, with nothing getting worse. This is the measurement behind the
chain of the host library (see the [chains note](/notes/chains-plugins-in-series-in-one-worker) for how plugin-hostd uses it).

## How the chain runs

- The head is an instance with its own client, ports and process callback. The members open no client and register no port:
  their cycles run inside the head's.
- A member is accepted only when its main inputs are as wide as the previous member's outputs and its main outputs as wide as
  the head's. A plugin with a note input or output is not accepted as a member. A member's auxiliary inputs read silence.
- The head's process callback runs the head, then each member in order, each inside its own cycle gate, handing each output
  buffer to the next; the last member writes the head's output ports. Between them the outputs are 64-byte aligned blocks the
  host holds.
- Every member's audio thread is the head's; its block size and transport follow the head's.
- The head's ports report the sum of every member's latency on top of its own, recomputed when any member's latency changes.
- Bypass, parameters, meters, pins, presets and state stay per instance, by the member's own number.
- Removing a member unlinks it inside a gate of the chain's own, between cycles; removing the head frees every member with it.

## Bit identity

One host with the plugins in N clients in series, one with them in a chain, both fed the same deterministic noise and
recorded from the same cycles, left and right: every pair compared sample by sample, and the latency each arm's last output
reports compared. A control pass first runs two N-client arms against each other, so a plugin that is not deterministic
between two instances of itself shows there, not as the chain's difference. 48 kHz, quantum 1024, 96 000 samples per side:

| plugins | format | pins | control (series against series) | chain against series | latency series / chain |
|---|---|---|---|---|---|
| a test fixture: passthrough, sidechain, passthrough | CLAP | no | identical | identical | 192 / 192 |
| omx-eq8, omx-comp, omx-deesser, omx-delay | CLAP | no | identical | identical | 0 / 0 |
| omx comp, delay, deesser, eq8, reverb and an LSP compressor (6) | CLAP | no | identical | identical | 0 / 0 |
| the 6 and Dragonfly Room (7) | CLAP | no | differs at sample 0, -29.1 dB | differs at sample 0, -31.0 dB | 0 / 0 |
| omx comp, delay, deesser, eq8, reverb, ZamCompX2, caps CompressX2 (7) | LV2 | yes | identical | identical | 0 / 0 |
| the 7 and caps PlateX2 (8) | LV2 | yes | differs at sample 0, -24.5 dB | differs at sample 0, -26.8 dB | 0 / 0 |

- The two reverbs, Dragonfly Room and caps PlateX2, are not deterministic between two instances of themselves (two
  one-client-per-plugin arms differ at about -30 dB), so with either in the set no arm can be judged sample by sample: the
  chain's difference is the control's size. Every other plugin of the table is bit-identical through the chain.
- The compressor rounded one ulp apart (-142 dB) between two instances now and then, chain or not; with the blocks 64-byte
  aligned the chain was identical.
- The latency the chain reports is the members' sum: three passthroughs of 64 frames report 192.
- Sabotaged, the test goes red: with the members skipped the output differs at sample 0, and with the latency sum dropped the
  chain reports 64 against 192.

## A chain of LV2 plugins needs a union world

plugin-hostd narrows a worker's `LV2_PATH` to the plugin's own bundle, and an LV2 plugin is found on that path when it is
added. A chain's members are added in the head's process, with the head's `LV2_PATH`: in a world of the first plugin's bundle
alone, the second member answers `resp -101` (not found). A chain of LV2 plugins therefore needs its worker's `LV2_PATH` to be
the union of its members' bundles, and nothing wider. The pins need nothing new: each member's add checks its own layout, and
with pins on, every member of the 7- and 8-plugin LV2 chains refused a wrong pin and took its right one; the pinned chain was
bit-identical with the pinned series.

## The bench

The arms interleaved inside each repetition, three repetitions of 30 s, medians; series / chain, change = (chain - series) /
series. The container shared its machine (load average about 3 on 4 threads), and that load landed on both arms alike.

| rate | quantum | plugins | cycle end p50 µs | change | cycle end p99 µs | change | overruns | host CPU % | RSS MiB |
|---|---|---|---|---|---|---|---|---|---|
| 96000 | 64 | 7 CLAP | 336.8 / 187.6 | -44.3 % | 776.0 / 570.5 | -26.5 % | 7390 / 241 | 20.8 / 12.4 | 42.4 / 34.7 |
| 96000 | 128 | 7 CLAP | 461.3 / 261.1 | -43.4 % | 1256.7 / 693.7 | -44.8 % | 172 / 71 | 16.6 / 10.0 | 42.5 / 34.4 |
| 48000 | 64 | 7 CLAP | 452.7 / 257.1 | -43.2 % | 1181.8 / 679.2 | -42.5 % | 113 / 86 | 14.6 / 8.6 | 41.9 / 33.9 |
| 48000 | 128 | 7 CLAP | 687.4 / 345.5 | -49.7 % | 1557.3 / 857.5 | -44.9 % | 23 / 4 | 11.7 / 7.8 | 42.0 / 34.3 |
| 96000 | 64 | 8 LV2 | 391.2 / 171.1 | -56.3 % | 799.7 / 545.3 | -31.8 % | 9222 / 98 | 22.1 / 10.4 | 29.4 / 20.2 |
| 96000 | 128 | 8 LV2 | 491.4 / 223.0 | -54.6 % | 1204.4 / 649.1 | -46.1 % | 102 / 18 | 16.4 / 9.6 | 29.4 / 20.2 |
| 48000 | 64 | 8 LV2 | 457.7 / 217.6 | -52.5 % | 1146.0 / 631.5 | -44.9 % | 44 / 14 | 14.1 / 8.0 | 29.2 / 19.9 |
| 48000 | 128 | 8 LV2 | 583.3 / 282.5 | -51.6 % | 1402.0 / 721.6 | -48.5 % | 8 / 3 | 8.1 / 5.3 | 29.3 / 20.1 |

With four plugins (omx-eq8, omx-comp, omx-deesser, omx-delay, CLAP):

| rate | quantum | cycle end p50 µs | change | cycle end p99 µs | change | overruns | host CPU % | RSS MiB |
|---|---|---|---|---|---|---|---|---|
| 96000 | 64 | 239.2 / 166.1 | -30.6 % | 685.6 / 541.5 | -21.0 % | 1175 / 98 | 11.8 / 7.9 | 15.8 / 12.1 |
| 96000 | 128 | 272.9 / 173.4 | -36.5 % | 852.7 / 599.8 | -29.7 % | 17 / 9 | 7.4 / 4.5 | 15.6 / 12.2 |
| 48000 | 64 | 262.9 / 184.0 | -30.0 % | 860.0 / 605.0 | -29.6 % | 11 / 12 | 7.4 / 3.8 | 15.6 / 12.1 |
| 48000 | 128 | 444.2 / 273.4 | -38.5 % | 1019.0 / 678.2 | -33.4 % | 4 / 5 | 5.7 / 3.6 | 15.6 / 12.2 |

- The cycle's end falls 30 to 56 % at the median and 21 to 49 % at the 99th percentile; repetition by repetition, the
  chain's worst is below the series' best in every row.
- No xrun in any run of either arm. Overruns fall in ten rows of twelve; in two four-plugin rows the chain's median is one
  overrun higher (12 against 11, 5 against 4, out of about 22 500 and 11 250 cycles), within the spread of the repetitions.
- The chain's one node waits for its wake-up as long as the series' first node, or longer, and then runs the whole series
  without another wake-up: that is where the saving is.
- The host's CPU falls by a third or more, and its memory by 4 to 9 MiB: N-1 JACK clients fewer, their threads and buffers.

## What was not measured

The container had no `/dev/cpu_dma_latency`, so no CPU idle-state hold was in effect (see [CPU idle states and plugin
hosting](/notes/cpu-idle-states-and-plugin-hosting)), and its real-time limit was 0, so PipeWire's threads ran
`SCHED_OTHER`: the figures are larger and noisier than a real-time graph's, the same for both arms. Whether part of the
saving is the idle-state exit stays open until the same bench runs on a machine with the device, at each hold.
