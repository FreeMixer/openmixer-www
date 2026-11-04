---
title: How a plugin's memory is judged
summary: A plugin's memory is measured per instance, watched for growth, bounded by a hard limit and judged against each host's budget, so that no plugin is qualified as good on a host it would hurt.
measured: plugin-qualify, October 2026. The Raspberry Pi budgets are provisional until read on a Pi.
topic: qualify
order: 10
---

A plugin's memory is judged, never merely recorded: a plugin must not be qualified as good on a host it would hurt,
a Raspberry Pi included. Four pieces do it: a footprint per instance, a check for growth over time, a hard limit, and a
verdict per host profile.

## Footprint per instance

Beside the cost of each rate, the record carries how far the resident set grew, in KB: after instantiate, after
activate, at rest after processing, and with notes held for an instrument (at the same count as the cost), and what a
second instance added.

Each rate's footprint is taken by a child process forked before any instance exists, so no earlier instance has grown
the process, and a plugin that dies there costs that rate its figure and nothing else. For CLAP, what loading the
`.clap` took is added to the first instance; an LV2 plugin is loaded by its first instantiate. A figure not taken is
absent, never 0, and the record says why.

Two figures come out of it, written beside the raw ones so that a client adds up the same numbers the verdict read:

- `firstInstanceKb`: the most one instance held at any step, with everything its instances share.
- `perInstanceKb`: what one more instance costs: the second instance's own part, plus the voices (notes held less at
  rest). With no second instance measured nothing separates what is shared, so it is the whole of the first.

The second instance is measured to the end of its first blocks, not only to instantiate: a plugin that allocates at
activate would otherwise read as free.

The child does not inherit the probe's memory lock. A footprint read under the lock would count every page the plugin
mapped, not what it touched.

## Growth over time

A rate whose memory keeps climbing past a ceiling fails its soak with the reason `leaks`. The prober reads the resident
set after a warm-up and again halfway from there to the end; the growth is worked out from the halfway reading to the
highest, per minute of audio. Measuring only the second half is what tells a library that finished loading late from a
leak.

The ceiling is 10 MB per minute. It ships provisional, is tightened from measurements, and the verdict's reason says
`provisional`.

## A hard limit

Two limits, each with its own job:

- **plugin-hostd enforces `memory.max`** (cgroup v2) on the supervised probe child. The kernel counts what the plugin
  really holds and kills its tree at the limit; the outcome is `probe.memory-limit`, read from `memory.events`. A machine
  with no delegated controller falls back to `RLIMIT_DATA` and says so in the record.
- **plugin-qualify enforces `RLIMIT_AS`** on the processes it starts itself. It is set to all the machine's RAM: the far
  bound of a run rather than its budget, since address space is what a plugin reserves, not what it touches. It is off
  for a sanitizer build, which reserves far more than it uses. The first refused allocation ends the child with the
  outcome `memory-limit-exceeded`.

Either way the cell carries its outcome and the limit, the record is written, and the other cells are judged. A host
whose own cell hit the limit is `unknown` there, in the memory dimension.

## A verdict per host profile

A host profile's budget holds a per-instance share and a whole-console figure. A profile with no budget declared reads
nothing here, which is not a budget of 0: `jalv`, `mod-host` and `omx-clap-host` are general hosts on no particular
machine. Memory is a dimension of the verdict with its own codes (`hosting.memory.*`) and can decide on its own.

`perInstanceKb` is read against the instance's share and `firstInstanceKb` against the whole console's, so a sampler with
a large shared library can fit a small host once and is still read correctly for two. Per cell, the worst standing wins:

| what was read | rating | code |
|---|---|---|
| a figure above a ceiling | `unsuitable` | `hosting.memory.above-ceiling` (with `provisional` when the ceiling is) |
| no figure, or a reason beside the figures | `unknown` | `hosting.memory.unmeasured` |
| under a measured budget | `suitable` | `hosting.memory.within-ceiling` |
| under a provisional budget | `conditional` | `hosting.memory.within-provisional-ceiling` |

A plugin under a provisional budget is therefore not qualified there: the figure and the ceiling are stated, and the
verdict does not say the plugin fits. Only a measured budget does that.

**The console** profile is sized for a 30 GiB machine: 16 GiB for the plugins of a console, the rest for the engine and
the system, and 4 GiB for one instance, which is also what the probe bounds a run by.

**A Raspberry Pi**: the 4 GB and 8 GB profiles have the shape of `omx-clap-host`, which is what runs a plugin on a Pi. Their
cells are what Zynthian sets a Pi to: 48000 Hz and 128 frames on a Pi 5 with the V5 kit, 256 frames on a Pi 4 and the
other kits. Wider sweeps (44.1 to 192 kHz, 128 to 1024 frames) are benchmark cells for comparing hosts, and no plugin is
judged at them. The budget is all the board's RAM but 1 GiB for the system and Zynthian's interface, and an instance's
share an eighth of that: 3 GiB and 384 MiB on 4 GB, 7 GiB and 896 MiB on 8 GB. These are provisional until read on a Pi.

Since a missing figure reads as `unknown`, a console that upgrades reads every plugin as `unknown` until it has been
measured again. That is the rule at work: nothing says the old figures still fit.

## What is not measured yet

A CLAP plugin's growth over time: the CLAP prober has no continuous render yet, so `leaks` applies to LV2 plugins only and a
CLAP plugin reads `unsoaked`. The footprint itself is measured for both formats.
