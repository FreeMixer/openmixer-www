---
title: "plugin-hostd on a Raspberry Pi 5: what was measured and how"
summary: On a Raspberry Pi 5 running Zynthian, a plugin-hostd chain has the lowest DSP load of the three hosts measured and uses 41 to 49 % less memory than mod-host; from four plugins on it is also the fastest to add to. This note gives the device, the method and every table.
measured: Raspberry Pi 5 (4 GB) with ZynthianOS Vangelis, 2 November 2026; plugin-hostd 0.15.9, omx-clap-core 0.26.4, plugin-qualify 0.18.5, omx-plugins 0.17.0, Zynthian's stock mod-host.
topic: zynthian
order: 80
---

The figures of these runs are also on the [benchmarks page](/benchmarks), row by row.

## The device and the method

- A Raspberry Pi 5 (Cortex-A76, 4 cores, 4 GB) running ZynthianOS Vangelis (Debian 13, arm64), kernel 6.18 (not
  PREEMPT_RT), with the packages a Zynthian on the OpenMixer channel installs.
- Every run used a private JACK server on the dummy driver, at 48000 Hz and 256 frames, with the CPU governor at
  `performance`. DSP load, xruns and latency are the dummy driver's: everything was read digitally at JACK ports, and
  nothing here is a claim about analog audio.
- Each row is the median of three repeats; DSP is JACK's DSP load, PSS the host processes' proportional memory (which
  shares the libraries out, so it is the memory the device actually spends).
- The daemon was measured directly, not through Zynthian's engine. The mod-host rows are Zynthian's own binary, started on
  a private port; no row measures MOD-UI or the device's own mod-host service.

The hosts:

| mode | what runs |
|---|---|
| plugin-hostd, added into one chain | the daemon and one worker for the whole chain, one JACK client |
| plugin-hostd, chain built after the adds | each plugin added in a worker of its own, then the chain declared |
| plugin-hostd, one worker per plugin | the daemon and one worker per plugin, a JACK client each |
| omx-clap-host, one process | one omx-clap-host process for every plugin |
| mod-host | one mod-host process for every plugin, a JACK client each |

The plugin sets: 24 plugins in series (omx comp, delay and drive in turn, and Calf Compressor), in their CLAP builds where a
host can run CLAP or in their LV2 builds on every host; and ten third-party LV2 effects in series, all rated suitable for
the three hosts and real-time clean in qualification.

## The three hosts

0 xruns in every repeat of every row. DSP load / PSS:

| scenario | plugin-hostd, added into one chain | omx-clap-host, one process | mod-host |
|---|---|---|---|
| 24 plugins, CLAP builds (Calf LV2; mod-host runs the LV2 builds) | 12.51 % / 64.1 MB | 15.31 % / 64.6 MB | 15.02 % / 109.4 MB |
| the same 24, LV2 builds on every host | 12.73 % / 63.3 MB | 16.40 % / 63.9 MB | 15.43 % / 109.4 MB |
| ten third-party LV2 plugins | 5.64 % / 45.2 MB | 6.87 % / 44.1 MB | 6.58 % / 89.5 MB |

plugin-hostd's chain has the lowest DSP load of the three in every scenario and every repeat (its highest repeat, 12.55 %,
is below mod-host's lowest, 14.88 %), and uses 41 to 49 % less memory than mod-host, as omx-clap-host does. One JACK client
runs the whole chain, where mod-host puts one client per plugin on the graph.

The other plugin-hostd modes:

| scenario | chain built after the adds | one worker per plugin |
|---|---|---|
| 24 plugins, CLAP builds | 12.48 % / 65.8 MB | 17.76 % / 183.1 MB |
| the same 24, LV2 builds | 12.74 % / 64.3 MB | 18.78 % / 189.6 MB |
| ten third-party LV2 plugins | 5.50 % / 45.8 MB | 7.25 % / 111.2 MB |

One worker per plugin is the expensive mode: 24 processes and 24 JACK clients, and the only rows with xruns (one repeat of
24 plugins with 21). It is not the default.

## Time to add

Cold: the host started, then every plugin of the set added, until the last one runs; the median of three. mod-host scans
the whole LV2 world (1336 plugins on this device) before it answers, and that start, 800 to 945 ms, is part of its time.

| set | plugin-hostd, into a chain | plugin-hostd, one worker each | omx-clap-host | mod-host |
|---|---|---|---|---|
| 24 plugins, LV2 builds | 549 ms | 1976 ms | 948 ms | 1459 ms |
| 24 plugins, CLAP builds (Calf LV2) | 440 ms | | 848 ms | |
| ten third-party LV2 plugins | 255 ms | 497 ms | 458 ms | 1044 ms |

Warm: chains of 2, 4 and 7 of omx comp, delay and drive, LV2 builds, the host already running.

| plugins | mod-host | plugin-hostd, into a chain | omx-clap-host | plugin-hostd, one worker each |
|---|---|---|---|---|
| 2 | 44.8 ms | 55.9 ms | 72.4 ms | 79.5 ms |
| 4 | 98 ms | 73 ms | 137 ms | 154 ms |
| 7 | 189 ms | 96 ms | 234 ms | 272 ms |

mod-host is the fastest to add two plugins to a running host; from four on, the chain is. A worker of its own costs about
40 ms per plugin: the process and its JACK client.

## Instruments

One instance with 1, 8 and 16 notes held; DSP load and PSS:

| instrument | plugin-hostd | mod-host |
|---|---|---|
| mda Piano | 0.6 / 2.0 / 3.5 %, 29 MB | 0.6 / 2.0 / 3.5 %, 72 MB |
| Odin 2 | 3.6 / 11.8 / 21.3 %, 89 MB | 3.8 / 11.7 / 21.0 %, 132 MB |
| Surge XT (CLAP on plugin-hostd, LV2 on mod-host) | 1.8 / 4.2 / 6.9 %, 68 MB | 2.0 / 4.1 / 6.9 %, 112 MB |

The same DSP load on both hosts, and 43 to 44 MB less memory on plugin-hostd. ZynAddSubFX and sfizz run as their own JACK
programs, as Zynthian runs them, through neither host: ZynAddSubFX with Analog Pad 1 at 0.6 / 1.6 / 2.6 %, 90 MB; sfizz with
the Salamander piano at 0.9 / 2.9 / 5.1 %, 86 to 119 MB. None of the five offers a thread pool. One plugin-hostd repeat of
Odin 2 at one note had one xrun. How instruments use the cores is in [Instruments on a Pi 5](/notes/instruments-on-a-pi-5).

## Where the chain's time goes

perf on the worker's audio thread, 24 plugins in one chain, measured with builds carrying symbols: the plugins and libm take
88 to 92 % of it. The host's own code takes about 4 to 7 %: the LV2 adapter's copies (1.9 % when every plugin is LV2), the
copies at the chain's input and output (about 1 %), the adapter's control and event work (about 1 % on LV2), and the guards
of the stage with the clamp (about 0.5 %). The kernel and libjack take 0.5 %, where mod-host on the same chain spends 10 to
14 % of its samples there, across its 24 JACK clients. The heaviest single symbol is `tanhf` in omx-drive, 14 to 15 %.

## Many chains at once

An earlier stress run, on plugin-hostd 0.13.1 and the device's own JACK server at 48000 Hz and 256 frames, held chains of
four LV2 plugins at 1, 2, 4, 8 and 16 chains for 60 s each. At 16 chains the hosting processes used 70.6 % of a core
grouped (one worker per chain, 60 plugins), 100.8 % alone (one worker per plugin) and 82.3 % on jalv (64 plugins); PSS was
224.2, 359.3 and 2745.6 MB. Grouped and alone reached 16 chains without a limit; jalv stopped there on memory, with 2
xruns.

## Qualification on the device

With the qualification records package of 1 November 2026: 1602 plugins (1341 LV2, 261 CLAP); 1079 qualified in-process
and 306 isolated; 93 crashed, 46 hung and 13 refused; 27 unmeasured, each with its reason. Every package installs from the
channel and `dpkg -V` finds nothing changed; each of the five instruments above sounds under its notes.

## What is not measured yet

- Audio through a chain on a Zynthian with an audio interface, and latency measured on audio per host: both need a loopback
  through the interface.
- The per-block cost of every plugin at Zynthian's own quantum (128 and 256 frames): the qualification probe times
  512-frame blocks only.
- The cost estimate a chain editor would ask the daemon for before an insert.
