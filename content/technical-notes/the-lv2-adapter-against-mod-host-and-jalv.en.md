---
title: "The LV2 adapter against mod-host and jalv: size and structure"
summary: The LV2 adapter that presents an LV2 plugin as a CLAP plugin makes the same lilv calls in the same order as mod-host and jalv. Its code is smaller and less branched than mod-host's core and 1.4 times jalv's, and nearly all of that difference is features the CLAP contract requires and jalv does not offer.
measured: omx-clap-core's LV2 adapter, mod-host 0.10.6 and jalv 1.10.0 (jalv 1.8.0 for the coverage run), October 2026; sizes by scc 3.5.0 and lizard 1.24.1.
topic: core
order: 160
---

## What is compared

| subject | what is measured |
|---|---|
| the adapter | omx-clap-core's `lv2/core` and `lv2/clap`; "with plumbing" adds the six headers of the library it includes |
| mod-host | its `src/`, without the socket protocol, the command line, the completer and the monitor client, and without the libraries it vendors |
| jalv | its `src/`, without `main.c`, the JACK and PortAudio backends and the user-interface frontends |

mod-host and jalv are applications, each with one audio backend (JACK) and a socket or user-interface front. The adapter is
a library: it presents one LV2 plugin as a CLAP plugin and has no backend. Measuring the host cores without their fronts and
backends keeps the three comparable. The script that measures them, `tools/hosting-compare.sh` in omx-clap-core, clones the
subjects and prints every table below.

## Size

| subject | files | lines | code | comments | functions | external dependencies | public functions |
|---|---:|---:|---:|---:|---:|---:|---:|
| the adapter | 8 | 7657 | 5648 | 1160 | 273 | 4 | 90 |
| with plumbing | 14 | 9224 | 6591 | 1609 | 316 | 5 | 90 |
| mod-host | 20 | 11248 | 8164 | 1341 | 165 | 4 | 84 |
| jalv | 47 | 5492 | 3970 | 631 | 127 | 5 | 90 |

External dependencies are the distinct include roots: the adapter `clap lilv lv2 omxcontract`; mod-host `jack lilv lv2
mach`; jalv `lilv lv2 serd sratom zix`.

## Complexity

Cyclomatic complexity per function (lizard):

| subject | functions | mean CCN | p95 CCN | max CCN | CCN over 15 | mean lines per function |
|---|---:|---:|---:|---:|---:|---:|
| the adapter | 273 | 6.38 | 19 | 86 | 20 | 17.2 |
| with plumbing | 316 | 6.60 | 19 | 86 | 26 | 17.2 |
| mod-host | 165 | 9.08 | 28 | 127 | 18 | 40.9 |
| jalv | 127 | 3.62 | 9 | 21 | 1 | 19.4 |

The most branched functions are the adapter's `instance_make` (CCN 86), `plugin_process` (62), `read_ports` (57) and
`read_side` (50); mod-host's `effects_add` (127, 736 lines), `ProcessPlugin` (122), `effects_remove` (70) and
`RunPostPonedEvents` (68); jalv's `jalv_open` (21).

Lines of code by area (functions matched by name, the count in brackets; a heuristic, since code inside one large function
is filed under that function's area):

| area | the adapter | mod-host | jalv |
|---|---:|---:|---:|
| worker | 88 (8) | 78 (6) | 153 (11) |
| state, presets and state paths | 522 (34) | 456 (17) | 177 (8) |
| CV | 8 (2) | 197 (2) | 0 (0) |
| port groups, layouts, aux | 236 (14) | 0 (0) | 0 (0) |
| CLAP contract, parameters, descriptor | 413 (30) | 201 (6) | 0 (0) |
| latency, rate, block change | 157 (17) | 7 (1) | 46 (1) |
| atoms, events, MIDI | 945 (51) | 1820 (50) | 599 (41) |
| ports and connection | 386 (14) | 287 (11) | 313 (13) |
| errors and refusals | 114 (9) | 141 (3) | 64 (4) |
| lifecycle and shutdown | 291 (14) | 402 (10) | 188 (12) |
| run, process | 164 (2) | 678 (3) | 54 (2) |
| instantiate | 1103 (44) | 1339 (12) | 470 (12) |
| other | 278 (34) | 1141 (44) | 399 (23) |

## The same tasks in the three

- **Instantiate and connect a stereo effect.** All three read the plugin through lilv, instantiate it and connect its
  ports. The adapter judges the plugin from its description and refuses it with a code before any binary is opened, and it
  connects every port once, to memory the instance owns, copying audio in and out each block. mod-host copies too; jalv
  connects the JACK buffer in place every cycle.
- **A MIDI instrument on an atom port.** All three write the incoming events into an event buffer before `run` and read the
  outgoing ones after. The adapter's output is bounded by its own capacity.
- **The worker extension.** The same design in all three: a request ring, a thread, a response ring drained before `run`,
  then `end_run`. The adapter's is 88 lines against 78 and 153.
- **State save and restore.** All three go through `lilv_state_*`. The adapter restores live for a plugin that declares
  `state:threadSafeRestore` and otherwise holds the state and applies it at the next activate; jalv pauses the audio thread
  instead. The adapter confines a plugin's `make_path` to its state directory and refuses a path outside it.
- **A sample-rate change.** CLAP may activate a plugin again at another rate, so the adapter tells the plugin through
  `options:interface` when it can and instantiates it again when it must. Neither JACK host handles a rate change at run
  time: both read the rate once. All three handle a change of block length.
- **CV and aux ports.** The adapter groups aux, CV and surround ports by `pg:group` and designation and offers them as CLAP
  audio ports. mod-host exposes CV ports as JACK ports and as a control source; jalv as audio ports with CV metadata. Neither
  turns a port group into a bus.

## Where the adapter is bigger, and why

- **Refusal before instantiation**, with a code for each reason: every plugin is judged from its description before its
  binary is opened. This is the hosting contract.
- **The CLAP face**: the parameter table, its text and value maps, the contract and the descriptor (413 lines), which the
  others have no need of.
- **A live rate or block change** (157 lines against 7 and 46).
- **Layouts, aux, sidechain and surround** as CLAP audio ports (236 lines against none).
- **State**: live and held restore, confined paths and CLAP preset discovery (522 lines against 456 and 177).
- **A run path with no lock and no allocation**, proven by an allocation witness in the tests; jalv's run path is the same
  in this respect.

Against jalv, the adapter has 1.42 times the code and 1.76 times the mean complexity. The four areas jalv does not have (the
CLAP face, layouts and aux, a rate change, and the part of state beyond jalv's) come to 1151 lines, which covers most of
the 1678-line gap.

The accidental complexity is in three functions: `instance_make` binds ports by testing every role for every port index,
`plugin_process` repeats one "host channel or silence" loop for each kind of leg, and `read_ports` and `read_side` hold the
rule of every port kind in one function each. Building a role table when the description is read, one helper per leg, and
one classifier per port kind would remove most of it, with the existing refusal and allocation tests as the guard.

## Coverage

The same question put to the three hosts: of 979 LV2 plugins installed on one Fedora 44 machine, how many does each host
instantiate and activate on a live graph? A private namespace with its own PipeWire at 48 kHz, one plugin at a time, ten
seconds per reply. Hosted means admitted, instantiated and activated; it is not a claim of identical audio.

| host | hosted | not hosted |
|---|---|---|
| the adapter, through omx-clap-host | 979 of 979 | none |
| mod-host 0.10.6 | 975 of 979 | drumkv1 (SIGABRT), samplv1 and synthv1 (the host stopped on `add`), zynadd (`resp -102`) |
| jalv 1.8.0 | 977 of 979 | zynadd (a MIDI port of a type it does not know), synthv1 (SIGABRT at instantiate) |

## In short

The three hosts make the same lilv calls in the same order: instantiate, connect, a worker of two rings and a thread, and
state through `lilv_state_*`. The adapter is smaller and less branched than mod-host's core on every measure above, and
1.4 times jalv, where the difference is almost all features the CLAP contract requires.
