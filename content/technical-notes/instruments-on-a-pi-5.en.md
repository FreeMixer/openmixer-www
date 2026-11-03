---
title: "Instruments on a Pi 5: Surge XT voices across the cores"
summary: An instrument that computes every voice on one core sets the polyphony a Pi 5 can play, however idle the other cores are. Surge XT does not split its voices into tasks, so the cores it can use come from running each instrument in a worker of its own, spread over the audio cores.
measured: Raspberry Pi 5 (4 GB) with ZynthianOS Vangelis, 48 kHz, 256 frames, October 2026; Surge XT 1.4.0, plugin-hostd 0.13.1 with omx-clap-host 0.23.2, and jalv.
topic: zynthian
order: 90
---

## Why voices need cores

A Zynthian is played. When a pad patch holds 16 notes, each with its own oscillators, filters and envelopes, every voice is
computed in every audio block, and the block has a deadline: 5.3 ms at 48 kHz and 256 frames. A Pi 5 has four cores. If one
instrument computes all its voices on one core, that core sets the polyphony the Pi can play before the first xrun,
however idle the other three are.

## What a CLAP host can do about it

CLAP's thread-pool extension (`clap.thread-pool`) lets a plugin split its block into tasks (one per voice, or per group of
voices) and ask the host to run them (`request_exec`). The host decides where they run. omx-clap-core spreads them over
real-time helper threads, one per core the worker may use, each pinned to its core and parked between cycles; the tasks are
handed out by one atomic counter, the audio thread takes its share, and the call returns when the last task is done, with
no allocation, lock or system call on that path (see the [thread pool reference](/projects/omx-clap-core)).

The pool is not a global switch. It is given per plugin, by its qualification: a plugin that is real-time safe and asks for
the pool gets helper threads; a plugin with real-time violations is hosted isolated, in a worker of its own, on the serial
path. A task that allocates or locks on a helper thread would stall the other cores' deadline too, so the measurement that
admits a plugin to a shared worker is the same one that admits it to the pool.

## What Surge XT does with it

Nothing. Surge XT 1.4.0 does not offer `clap.thread-pool` and its source never calls `request_exec`; none of the 489
plugin descriptors on the device names the thread pool either. So on the Pi, Surge XT's voices run on one core whatever the
host does: one host thread from 3 % of a core at one voice to 39 % at 64 voices.

What does use the cores for instruments is separate workers. plugin-hostd runs each instrument (or each chain) in a worker
process of its own, and JACK runs independent clients in parallel. Four Surge XT instances in four workers, each holding 16
notes, ran on the four cores at 14 to 15 % each, 64 voices in all, at a JACK DSP load of 17.6 %; one instance playing 64
voices loaded JACK at 39.7 %. The `placement` setting makes the spreading the host's decision: workers across the audio
cores, the daemon kept off them.

The cost of placement is one process per instrument; what it buys is the other three cores for three more instruments.

## What was proven

Surge XT as CLAP, played by plugin-hostd, and as LV2 by jalv, the way Zynthian's stock path plays it. An instrument probe
sends a scripted MIDI scenario into the instrument's note input and measures its outputs window by window: peak and RMS
level, pitch, brightness and JACK xruns. No window of any run had an xrun.

| proof | plugin-hostd, Surge XT CLAP | jalv, Surge XT LV2 |
|---|---|---|
| it plays | C4 at 261.4 Hz, -13.5 dBFS peak | the same |
| velocity | with velocity sensitivity on, velocity 20, 64 and 127 give -53.9, -37.3 and -13.5 dBFS | not set (jalv cannot set the parameter at start) |
| polyphony | 1, 8, 16, 32, 48 and 64 notes held, all sounding (limit raised to 64) | 1 to 32 at the default limit |
| voice stealing | default limit 16: 32 notes cost what 16 do | the same |
| pitch bend | A4 440.0 Hz, full up 494.0 Hz, full down 392.0 Hz, back to 440.0 Hz | 440.0, 494.0, 392.0, 441.0 Hz |
| sustain (CC 64) | released: silent; released under the pedal: -13.5 dBFS; pedal up: silent | the same |
| all notes off | 8 notes, CC 123: silent 1.5 s later; the `all_notes_off` verb: silent | CC 123: silent |
| mod wheel (CC 1) | a patch routing the wheel to the filter: brightness 0.029 at 0, 0.300 at 127, 0.025 back at 0 | 0.033, 0.300, 0.025 |
| MPE | zone set by the MPE configuration message; a note on member channel 2 at 440 Hz; a full bend on another channel leaves it; a quarter-range bend on its own channel: 880 Hz (the 48-semitone range) | 440, 440, 880 Hz |
| native window | Surge XT's own window maps on the Pi's display in 664 ms on request | |

## The numbers

CPU of the host thread that runs Surge XT (percent of one core over a 4 s window, ±1 to 2 %), JACK's DSP load, notes held:

| notes | plugin-hostd, limit 16 (default) | plugin-hostd, limit 64 | jalv, limit 16 (default) |
|---|---|---|---|
| 1 | 3 %, DSP 3.7 | 2 %, DSP 3.5 | 3 %, DSP 3.6 |
| 8 | 6 %, DSP 7.0 | 6 %, DSP 7.0 | 6 %, DSP 6.7 |
| 16 | 10 %, DSP 11.3 | 10 %, DSP 11.3 | 9 %, DSP 10.4 |
| 32 | 10 %, DSP 11.3 | 19 %, DSP 20.2 | 9 %, DSP 10.5 |
| 48 | | 29 %, DSP 29.7 | |
| 64 | | 39 %, DSP 39.7 | |
| 4 instances × 16 | 14 to 15 % on each of the four cores, DSP 17.6 | | |

The same instrument costs the same in both hosts, within a point at every note count. From the request to the instrument's
ports in JACK, plugin-hostd answered `add` in 580 to 585 ms over five runs; jalv's ports appeared 1.85 and 1.98 s after it
was started.

Qualification rated Surge XT isolated for both host profiles, on real-time safety: 410 966 allocations and 115 032 locks on
the audio thread over the parameter sweep, 18 884 and 98 304 under notes. Isolated is a way of hosting, not a refusal:
Surge XT runs, in a worker of its own, and is never grouped with real-time safe plugins. Its cost at 512 frames is a median
of about 2.1 µs per sample at every rate (about 10 % of a core at 48 kHz), with a 95th percentile of 27 to 37 µs per sample
in the note-on blocks.

## Other instruments

At 48 kHz and 256 frames, read digitally at JACK ports. FluidSynth and Pianoteq run on their own, with their own threads:

| instrument | busy threads | JACK DSP % | xruns per window |
|---|---|---|---|
| Surge XT, one instance, 64 voices, through plugin-hostd | 1 | 27.5 | 0 |
| Surge XT, four instances, 16 voices each, through plugin-hostd | 4, one per worker | 18.8 | 0 |
| FluidSynth, 1200 voices, `cpu-cores=1` | 1 | 68 | 0 to 1 |
| FluidSynth, 1200 voices, `cpu-cores=2` | 2 | 36 | 0 |
| FluidSynth, 1200 voices, `cpu-cores=4` | 4 | 19 | 0 |
| Pianoteq 9.2.1 trial, 64 notes, `multicore=4` | 4 | 44 to 49 | 0 to 1 |

## What was missing at the time

Measured with plugin-hostd 0.13.1 and omx-clap-host 0.23.2:

- Surge XT's own file names hold a space (`Surge XT.clap`, and a percent-encoded LV2 binary), which the host did not
  accept: every proof above used a link without the space.
- Presets: the CLAP path listed no factory presets, and a preset file whose path holds a space was not loaded.
- The engine paged through all 775 parameters; Surge's five remote-control pages were read by the host and not shown.
- No CLAP extension carries Surge's modulation matrix; its own window does.

## What was not shown

The first xrun (no run reached it: 64 voices on one instance took 39 % of a core); the effect of the thread pool, which Surge
XT does not use; parameter modulation events, tuning and state context; anything at another rate or block size than 48 kHz
and 256 frames.
