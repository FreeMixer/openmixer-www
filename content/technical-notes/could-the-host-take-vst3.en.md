---
title: "Could the host take VST3? The adapter seam and its cost"
summary: A VST3 adapter is possible in plain C against Steinberg's C API, under licences a GPL host can use, and a spike hosted a real VST3 effect end to end. It would cost about 6200 lines and three weeks, for a thin demand, so it is not being built; what would change that is written down.
measured: omx-clap-core's LV2 adapter, the VST 3 SDK 3.8.1 and its C API on Fedora 44, and a survey of plugin vendors' pages, October 2026.
topic: core
order: 110
---

## The answer in numbers

- The LV2 adapter and its plumbing hold 5754 lines of code in 336 functions: 1594 lines (139 functions) format-neutral,
  1699 (73) mixed, which is neutral logic around a few format calls, and 2461 (124) specific to LV2.
- The plumbing is already shared: all six library headers the adapter includes are neutral, and four are already used
  outside it.
- The seam still to cut is the shim that presents an LV2 plugin as a CLAP plugin: 1314 of its 1319 lines are neutral or
  mixed, and 1161 of them would serve a VST3 shim. The LV2 core is two-thirds specific; its neutral code (the worker loop,
  path containment, atom helpers, a real-time memory pool) serves LV2 ideas VST3 does not have.
- On the audio thread the shim adds one indirect call per cycle and one per MIDI event out; every other indirect call there
  is the CLAP host's or the plugin's own. A shared layer must add none.
- A VST3 adapter needs no C++: Steinberg's generated C API works, and a spike of 477 lines of C11 hosted a VST3 effect end
  to end. The SDK is MIT-licensed and the C API BSD-3-Clause, both usable in a GPL-3.0-or-later host.
- The cost: about 2200 lines on the format side, about 6200 with tests and fixtures; about three weeks of work with the seam
  cut first, two and a half without.
- The demand is thin: 64 open-source plugin packages in the distribution repositories are VST3-only on Linux, none of them
  one OpenMixer depends on, and 6 closed-source vendors ship Linux VST3 without CLAP or LV2.

So: not now. The results are kept, so that a later adapter starts from them.

## The seam

Each function of the adapter was read and given a class: **neutral** (a VST3 adapter would use it unchanged: it depends only
on CLAP, the contract, the ring, the limits or plain C), **mixed** (neutral logic around a few format calls, each a hook the
format side would supply) or **specific** (LV2 only, including code where only the idea is shared). A tool in omx-clap-core
joins the classification with lizard's list, fails on a function the table does not class, and prints the sums.

| part | neutral | mixed | specific | total |
|---|---:|---:|---:|---:|
| the shim (LV2 as CLAP) | 347 (46) | 967 (44) | 5 (1) | 1319 (91) |
| LV2 features | 30 (3) | 30 (1) | 449 (31) | 509 (35) |
| LV2 instance | 275 (29) | 501 (22) | 923 (44) | 1699 (95) |
| real-time memory pool | 169 (12) | 0 (0) | 12 (3) | 181 (15) |
| LV2 world (descriptions through lilv) | 48 (6) | 201 (6) | 1072 (45) | 1321 (57) |
| the shared library headers | 725 (43) | 0 (0) | 0 (0) | 725 (43) |
| **all** | **1594 (139)** | **1699 (73)** | **2461 (124)** | **5754 (336)** |

Each cell is lines of code (functions).

When a second adapter is approved, the shim splits in two: the 1161 reusable lines go to a shared shim inside omx-clap-core
(its audio-thread half `static inline` in a header, its main-thread half in an internal static library, no public ABI), and
the LV2 remainder stays behind about 25 hooks:

| group | hooks | VST3 counterpart |
|---|---|---|
| lifecycle | load, free, activate or keep at a rate and block range, deactivate, reset, latency | `createInstance` and `initialize`, `terminate`, `setupProcessing` and `setActive`, `setProcessing`, `getLatencySamples` |
| parameters | count, info (range, flags, steps, unit), get and set, value to text and back, symbol | `getParameterCount/Info`, normalised and plain values, `getParamStringByValue/ValueByString` |
| ports | a port table (kind, width, CLAP channel map, main or aux), buffer in and out per leg and channel | `getBusInfo`, `SpeakerArrangement`, `AudioBusBuffers` |
| process | run, MIDI in, MIDI out, transport, counters | `process(ProcessData)`, `IEventList`, `ProcessContext` |
| state and presets | save to a blob, load from one, list presets, load one | `getState/setState` (component and controller), `.vstpreset` |
| discovery | open and close a bundle, list its plugins, refuse before opening | the bundle scan, `IPluginFactory`, `moduleinfo.json` |

VST3 needs four things LV2 never asked for: the controller and the processor are split, with messages between them;
parameter changes flow back from the processor to the controller; `restartComponent` flags must become CLAP requests; and
state is two blobs, not one. That is format-side work and does not widen the interface.

The rule for the shared layer: its audio-thread half is compiled into each format's shim, and the format hooks are direct
calls bound when it is compiled, with no vtable. The test is an objdump count: no indirect call on the audio path beyond the
CLAP host's and the plugin's own.

No other OpenMixer library holds code that would replace the shared layer: the DSP library has a crossfade the host already
uses and no ring, worker or parameter table; plugin-hostd dispatches formats through a prefix table; the plugins' library
mirrors the parameter-contract vocabulary.

## The SDK

**Licence.** The VST 3 SDK 3.8.1 is MIT-licensed; its README says licensing under GPLv3 and the Steinberg proprietary licence
is no longer offered, and that "VST" may not be used in company or product names. MIT code combines into a
GPL-3.0-or-later work; the one duty is to keep the notice with any SDK file shipped.

**Language.** The SDK is C++ with COM-style interfaces, and its hosting helpers link libstdc++. Steinberg also publishes a C
API generated from those interfaces, under the BSD 3-clause licence: every interface a struct with a vtable, every id a
constant. A VST3 adapter can therefore be C like the rest of the library. The price is writing the host's COM objects by
hand: 257 lines in the spike.

**What a host implements**, estimated from the spike and from the LV2 code doing the same job:

| task | what VST3 needs from the host | lines (estimate) | reused from the seam |
|---|---|---:|---|
| instantiate and connect a stereo effect | scan `.vst3` bundles; the module entry and plugin factory; initialize the component with a host application object that also allocates messages and attribute lists; the controller; a connection point both ways; buses; the setup and activation sequence; `process` with bus buffers | 650 | the CLAP face, the port table, the leg copies, the refusal record |
| a MIDI instrument | no raw MIDI input: notes arrive as events in a list the host implements and preallocates; controllers, pitch bend and aftertouch become parameter changes through a MIDI mapping | 300 | the note ports and MIDI helpers |
| threading | no worker: each call has its thread; edits from the controller arrive on the main thread and must reach the next `process` as parameter queues; output changes travel back | 400 | the message ring, the parameter flush, the latency watch |
| state | a byte stream object; one CLAP state holds two blobs, component and controller; restore only after `setupProcessing` | 200 | the state reader and the held restore |
| a rate change | deactivate, set up with the new rate and block, activate: no re-instantiation | 60 | the activate and keep rule |
| aux and sidechain buses | aux buses after the main ones; speaker arrangements map onto CLAP port types and channel maps | 200 | the port table, the surround and ambisonic extensions |
| parameters | count and info with bypass and read-only flags, normalised doubles, text conversion, sample-accurate queues | 250 | the parameter face and the contract |
| discovery and refusals | a code per refusal, and a scan that need not open the binary when `moduleinfo.json` is there | 150 | the refusal vocabulary, the factory bookkeeping |
| **format side, total** | | **about 2200** | |

## The spike

A probe in C11 opened a Linux VST3 build of an LSP compressor from the distribution's package, read the factory, created the
plugin, listed its buses and parameters, round-tripped its state, and processed one block of silence and eight of noise.

| step | result |
|---|---|
| module | entry ok; 388 classes (194 audio modules, 194 controllers) |
| component and controller | a separate controller; both initialised; connected both ways |
| buses | a stereo main input and output; the sidechain variant adds an aux input and processes with only the main bus handed over |
| parameters | 48, bypass flagged as such; names, units and default text through the text conversion |
| state | 517 bytes; set then get byte-identical |
| process | silence in, silence out; noise in at -6.04 dBFS peak, out at -6.57 |
| C++ needed | none: C11 and the C API |
| size | 477 lines of code, 257 of them the host's COM objects |

Three rules came out of it, each one the adapter would carry:

1. **The host must allocate the message objects.** The plugin asked the host application for a message during `setState` and
   failed when refused; the SDK's C++ hosting library hides this, and in C it is 147 lines.
2. **Restore state only after `setupProcessing`.** The specification allows `setState` earlier, but the plugin used its sample
   rate there, which was still zero.
3. **A crashed instance can poison the next.** The plugin keeps a catalogue in shared memory; a crash left that file empty, and
   every later instance died reading it, until the file was removed. Running each plugin in a worker process of its own, as
   plugin-hostd does, contains such a crash.

## The test plan, if it is built

- One small VST3 fixture per behaviour, written in C against the C API, as the LV2 tests do, so CI stays hermetic and every
  refusal is exercised on purpose.
- The VST3 builds in the distribution repositories as real plugins.
- Parity: the same plugin as VST3, LV2 and CLAP through the host, fed the same seeded noise and sweep, compared sample by
  sample; a pass is a residual at least 100 dB down, or a named difference. The parameter map is compared the same way.
- The allocation witness around the VST3 `process` path.
- The poisoned catalogue as a regression test: a refusal with a code from the worker, never a dead engine.

## Could it be hosted

| area | can it? | why |
|---|---|---|
| licence | yes | MIT and BSD-3-Clause combine into GPL-3.0-or-later; "VST" may not appear in a product name |
| C++ | yes, in C | the C API; the spike is C11 with no libstdc++ |
| real-time rules | yes | `process` runs on the processing thread; the host preallocates its parameter and event lists |
| threading | yes | the "UI thread" calls map onto the host's main thread; there is no worker |
| headless | yes for the plugin tested, not for every plugin | the spike ran headless; Steinberg's own validator failed in the same headless container |
| closed-source activation | depends on the vendor | serial or key-file activation works headless; activation inside the plugin's editor needs a desktop session once; iLok has no Linux client |
| crash containment | yes | plugin-hostd runs each plugin in a worker process of its own |

Of 14 closed-source vendors that ship Linux VST3 builds (a survey of the vendors' own pages, made for this note), 8 also ship CLAP
or LV2, which the host already takes. The 6 that are VST3-only on Linux are ToneBoosters, Loomer, Renoise (Redux), Tracktion
(BioTek 3, F'em), Bertom Audio and DDMF.

## Why not now, and what would change it

The demand is thin, the cost is about 6200 lines, and writing the adapter would confirm the seam drawn above rather than
discover a new one: every VST3 task maps onto an existing group of shim functions. Meanwhile new code in the shim keeps its
neutral functions free of LV2 calls, so the seam stays cheap to cut.

Any one of these reopens the decision:

1. A named VST3-only plugin worth hosting: a Linux x86-64 build, no LV2 or CLAP build, activation that works without its
   editor, and terms that allow a third-party host. Three such requests make the case; one is enough if it fills a role
   nothing hosted fills.
2. A second non-CLAP adapter approved for another reason: then the seam is cut first, whatever the format.
3. A vendor that ships both formats today dropping CLAP and LV2 on Linux for a plugin that is hosted.
