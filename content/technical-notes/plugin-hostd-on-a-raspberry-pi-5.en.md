---
title: "plugin-hostd on a Raspberry Pi 5: what was measured and how"
summary: On a Raspberry Pi 5 running Zynthian with an audio interface, a plugin-hostd chain has the lowest DSP load of the four hosts measured, omx-clap-host, mod-host and jalv being the others, at 48 and at 96 kHz, and uses about half the memory of mod-host. This note gives the device, the method and every table.
measured: Raspberry Pi 5 (4 GB) with ZynthianOS Vangelis and an RME Babyface Pro, 5 November 2026; plugin-hostd 0.18.0 (protocol 0.3.0), omx-clap-host 0.29.0, omx-plugins 0.18.0, mod-host 0.10.9, jalv 1.6.9. Earlier runs, 2 November 2026; plugin-hostd 0.15.9, omx-clap-core 0.26.4, plugin-qualify 0.18.5, omx-plugins 0.17.0, Zynthian's stock mod-host.
topic: zynthian
order: 80
---

The figures of these runs are also on the [benchmarks page](/benchmarks), row by row.

## The device and the method

- A Raspberry Pi 5 (Cortex-A76, 4 cores, 4 GB) running ZynthianOS Vangelis (Debian 13, arm64), kernel 6.18 (not
  PREEMPT_RT), with the packages a Zynthian on the OpenMixer channel installs.
- JACK 1.9.22 on the ALSA driver of an RME Babyface Pro, at real-time priority 70, with the CPU governor at
  `performance` and Zynthian's own services stopped for the run and put back after it. DSP load and xruns are the JACK
  server's: everything was read digitally, at the server and its ports, and nothing here is a claim about analog audio.
- Each row is the median of three repeats of 10 s, with the lowest and highest repeat on the benchmarks page. DSP is
  JACK's DSP load; PSS is the host processes' proportional memory, which shares the libraries out, so it is the memory
  the device actually spends.
- The hosts were driven directly by the bench harness of plugin-hostd, not through Zynthian's engine or MOD-UI.
- A row whose repeats spread too wide in the shared run was run again alone, and the row run alone is the one given.

The hosts:

| host | what runs |
|---|---|
| plugin-hostd, added into one chain | the daemon and one worker for the whole chain, one JACK client |
| plugin-hostd, chain declared at once | the same chain, started with the whole list |
| plugin-hostd, one worker per plugin | the daemon and one worker per plugin, a JACK client each |
| omx-clap-host, one process | one omx-clap-host process for every plugin |
| mod-host | one mod-host process for every plugin, a JACK client each (LV2 builds) |
| jalv | one jalv process per plugin (LV2 builds) |

The plugin sets: omx comp, delay and drive in turn, 3, 8 and 16 of them, in their CLAP builds where the host runs CLAP
and their LV2 builds on mod-host and jalv; the same with Calf Compressor (LV2) in the turn, 8 and 16 of them; and one
Pianoteq 9 playing five-note chords.

## 48 kHz

16 plugins (omx comp, delay and drive), 3 periods, Zynthian's own setting. DSP load, xruns where a repeat had any, PSS:

| frames | plugin-hostd, added into one chain | omx-clap-host | mod-host | plugin-hostd, one worker per plugin | jalv |
|---|---|---|---|---|---|
| 128 | 6.75 % | 9.36 % | 8.86 % | 10.88 % | 11.40 % |
| 256 | 6.35 % | 7.75 % | 7.38 % | 8.63 % | 8.49 % |
| PSS | 54 to 55 MB | 53 MB | 99 MB | 143 MB | 690 MB |

The chain declared at once reads the same as the chain added into (6.75 and 6.38 %). With 3 plugins every host reads
1.5 to 1.7 % at 256 frames: the difference shows from 8 plugins up, or at 128 frames.

The set with Calf Compressor, 16 plugins, at each setting the bench ran (DSP load):

| frames, periods | plugin-hostd chain | omx-clap-host | mod-host | plugin-hostd, one worker per plugin | jalv |
|---|---|---|---|---|---|
| 128, 2 | 6.83 % | 10.06 % | 9.40 % | 11.31 % | 12.97 %, 38 xruns |
| 128, 3 | 7.00 % | 9.65 % | 9.24 % | 11.80 % | 12.34 %, 32 xruns |
| 256, 2 | 6.46 % | 8.43 % | 8.21 % | 12.52 % | 9.44 % |
| 256, 3 | 7.79 % | 7.73 % | 7.66 % | 9.14 % | 8.80 % |

At 128 frames the chain runs 16 plugins at 0.7 of omx-clap-host or mod-host and about half of jalv, and jalv is the only
host with xruns. At 256 frames with 3 periods every one-process form reads the same; the chain's figure there has the
widest spread of the table (7.47 to 8.16 %) and was not run again alone, so it is not read as a cost of the third period.
omx-clap-host and mod-host are within 0.7 points of each other at every setting: the LV2 adapter is not the slower path.

Pianoteq 9, one instance, at 256 frames and 3 periods: 13.60 % on omx-clap-host, 13.64 % on plugin-hostd, 13.40 % on
mod-host and 14.70 % on jalv. The instrument's own threads do the work, so the host makes little difference; its PSS is
250 MB on plugin-hostd, 288 MB on mod-host and 279 MB on jalv.

## 96 kHz

The same rows at 96000 Hz, 3 periods. At 96 kHz a 256-frame period is 2.67 ms and a 128-frame period 1.33 ms. DSP load,
with the median xruns where a repeat had any:

| set, frames | plugin-hostd, added into one chain | omx-clap-host | mod-host | plugin-hostd, one worker per plugin | jalv |
|---|---|---|---|---|---|
| 16 omx plugins, 128 | 15.46 %, 1 xrun | 18.18 % | 19.93 %, 9 xruns | 21.19 %, 26 xruns | 31.12 %, 183 xruns |
| 16 omx plugins, 256 | 12.66 % | 15.43 % | 14.60 %, 8 xruns | 16.85 % | 18.16 %, 52 xruns |
| 16 with Calf, 128 | 13.61 %, 8 xruns | 18.85 %, 4 xruns | 21.88 %, 43 xruns | 21.96 % | 23.61 % |
| Pianoteq 9, 128 | | 20.71 %, 7 xruns | 21.85 %, 4 xruns | 20.63 %, 3 xruns | 23.24 %, 10 xruns |
| Pianoteq 9, 256 | | 20.66 %, 3 xruns | 20.94 %, 1 xrun | 20.24 %, 5 xruns | 20.38 %, 3 xruns |

Pianoteq is one instrument, so it has no chain. The chain declared at once reads 13.2 % (16 omx plugins, 128) and 12.64 % (256).

- Twice the rate, about twice the load: the effects sets read 1.8 to 2.1 times their 48 kHz figure on every host.
  Pianoteq costs 1.4 to 1.6 times, since part of its work does not grow with the rate.
- The order of the hosts does not change: the chain is the lowest at every size.
- Xruns come back at 96 kHz where 48 kHz had none. The chain holds at 0 to 8; jalv has the most.
- 128 frames is not the floor at 96 kHz: with no plugin, omx-clap-host, plugin-hostd and mod-host ran it with no xrun
  (jalv has no host without a plugin).
- 2 periods against 3 at 256 frames: the same for the effects sets, but Pianoteq and the 16 omx plugins read higher with
  2 on omx-clap-host and mod-host. At 96 kHz the third period is worth keeping, as Zynthian has it.
- Memory does not depend on the rate: each host's PSS is within 1 MB of its 48 kHz figure.
- Two rows failed because the JACK server did not answer within 10 s in one repeat: mod-host with 16 plugins (Calf set)
  at 256 frames and jalv with 8 omx plugins at 128. No host refused a plugin.

Some 96 kHz rows have a wide spread and are not read on their own: jalv with 16 omx plugins at 128 frames (22.96 to
31.52 %), omx-clap-host with the Calf set at 256 frames, and three rows with 2 periods.

## Under load

The bench's load is one busy loop on each core the host may use plus 256 MiB of memory being touched. 16 plugins with
Calf at 48 kHz, 256 frames, 3 periods: the chain read 6.68 to 6.76 %, the one-process hosts rose by up to 0.4 points
(omx-clap-host 8.14 %, mod-host 7.87 %, jalv 8.82 %), and one worker per plugin, 17 processes, is the one that had xruns
(10.13 %, 30). The same holds for 16 omx plugins at 128 frames: the chain 6.94 % under load against 6.75 % without, one worker per
plugin 90 xruns. At 96 kHz every form has xruns under this load, the chain the fewest (1 to 9) with jalv (0, with 690 MB
for its 16 processes).

## The floor at 48 kHz

64 frames at 48 kHz has xruns on omx-clap-host, plugin-hostd and mod-host with no plugin loaded, at JACK priority 70 and
at JACK's default 10: it is the device's floor, not a host's, and no row says a host is clean at 64. Priority 70 helps
the hosts that do the work in one process: mod-host with 16 plugins 12.0 % at priority 70 against 14.8 % at 10.

## Time to add

16 omx plugins at 48 kHz and 128 frames, the host running, every plugin added until the last one runs:

| plugin-hostd, added into one chain | plugin-hostd, chain declared at once | omx-clap-host | mod-host | plugin-hostd, one worker per plugin | jalv |
|---|---|---|---|---|---|
| 80 ms | 2.034 s | 397 ms | 364 ms | 640 ms | 13.8 s |

Adding into a running chain is the fast path. A chain declared at once starts the worker with the whole list, which
takes longer; jalv starts a process and a JACK client per plugin.

## From the earlier runs

These sections come from runs on plugin-hostd 0.15.9 and omx-clap-core 0.26.4 on JACK's dummy driver at 48000 Hz and
256 frames, against Zynthian's own mod-host build, unless a section names other versions. They have not been repeated
on the audio interface yet.
jalv is named where it was measured; the earlier mod-host and omx-clap-host tables did not include it.

### Time to add, cold and warm

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

### Instruments

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

### Where the chain's time goes

perf on the worker's audio thread, 24 plugins in one chain, measured with builds carrying symbols: the plugins and libm take
88 to 92 % of it. The host's own code takes about 4 to 7 %: the LV2 adapter's copies (1.9 % when every plugin is LV2), the
copies at the chain's input and output (about 1 %), the adapter's control and event work (about 1 % on LV2), and the guards
of the stage with the clamp (about 0.5 %). The kernel and libjack take 0.5 %, where mod-host on the same chain spends 10 to
14 % of its samples there, across its 24 JACK clients. The heaviest single symbol is `tanhf` in omx-drive, 14 to 15 %.

### Many chains at once

An earlier stress run, on plugin-hostd 0.13.1 and the device's own JACK server at 48000 Hz and 256 frames, held chains of
four LV2 plugins at 1, 2, 4, 8 and 16 chains for 60 s each. At 16 chains the hosting processes used 70.6 % of a core
grouped (one worker per chain, 60 plugins), 100.8 % alone (one worker per plugin) and 82.3 % on jalv (64 plugins); PSS was
224.2, 359.3 and 2745.6 MB. Grouped and alone reached 16 chains without a limit; jalv stopped there on memory, with 2
xruns.

### Qualification on the device (plugin-qualify 0.18.5)

With the qualification records package omx-qualification-rpi5-zynthian-vangelis 2026110101: 1602 plugins (1341 LV2, 261 CLAP); 1079 qualified in-process
and 306 isolated; 93 crashed, 46 hung and 13 refused; 27 unmeasured, each with its reason. Every package installs from the
channel and `dpkg -V` finds nothing changed; each of the five instruments above sounds under its notes.

## What is not measured yet

- Listening through the audio interface, and latency measured on audio per host: every figure above is read digitally.
- Instruments on the audio interface with plugin-hostd 0.18.0, and the thread-pool row: Surge XT declares no thread
  pool, so that row can only show that nothing changes, and the bench tool did not reach its ports this time.
- The qualification on plugin-qualify 0.19.0, which replaces the counts above when it is done.
- The per-block cost of every plugin at Zynthian's own quantum (128 and 256 frames): the qualification probe times
  512-frame blocks only.
- The cost estimate a chain editor would ask the daemon for before an insert.
