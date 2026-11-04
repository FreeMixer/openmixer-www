---
title: From a plugin file to a page on the screen
summary: Five stages turn a CLAP or LV2 file into a menu row with its figures, controller pages and a MOD GUI on a Zynthian. Each stage has one owner, writes one artefact in a fixed place, and the stages after it read that artefact and nothing else.
measured: plugin-hostd, plugin-qualify and omx-panel on a Raspberry Pi 5 with Zynthian, October 2026.
topic: zynthian
order: 70
---

An instrument on a Zynthian is a file on the disk: a CLAP or LV2 binary. What the player sees is a row in a menu with its
figures, a chain with a MIDI input, controller pages with knobs, a MOD GUI, and a footer saying what the chain will cost.
Five stages turn one into the other. Each stage has one owner, writes one artefact in a fixed place, and what comes after
reads that artefact and nothing else.

The running example is an instrument: [Kars](https://github.com/DISTRHO/Kars), an LV2 plucked-string synth, in the
captures from the device; Surge XT (CLAP) where its figures matter; and an effect once, to show where the layout differs.

![The five stages, the artefact each writes and the surfaces that read them](/technical-notes/from-a-plugin-file-to-a-page/from-file-to-page.svg)

## 1. Scan and describe

**Owner:** plugin-hostd. **Writes:** the descriptor, one JSON document per plugin binary under
`/var/lib/omx/descriptors`, named `<id>@<version>-<hash>.json`.

The daemon loads the plugin once in the matching host (omx-clap-host for CLAP and for the LV2 plugins its adapter takes,
mod-host for the rest) and reads everything the plugin declares: id and version, audio and MIDI ports, every parameter with
symbol, name, unit, range, default, steps or enumeration, flags, declared latency, and the extensions it supports.

For an instrument the descriptor says what an effect's does not: a MIDI input port, and so the notes it takes, its
parameters and its presets. Kars's descriptor has the three parameters the engine later shows on its one page: Sustain,
Release and Volume.

The descriptor must fit the contract: omx-contract defines the vocabulary (units, port kinds, scopes, outcome codes), and a
scan that finds an unknown unit or field is refused, not invented. OpenMixer's own plugins skip the scan: their parameters
are written once in a declaration, and a generator writes the descriptor, the LV2 bundle, the CLAP parameters and the
parameter reference from it.

## 2. Qualify

**Owner:** plugin-qualify. **Writes:** the qualification record, `<plugin>@<version>-<hash>.<offer>.qualification.json`,
with the probe output it judged beside it, under `/var/lib/omx/qualification`.

The probe runs the plugin at every cell of a grid (44.1, 48, 96 and 192 kHz times blocks of 128, 256, 512 and 1024
frames) and writes the record: the checksums of the binary's files, the cost per block, declared and measured latency,
real-time safety under the interposer, or a reason code for each cell that did not run. For an instrument the probe holds
a set of notes while it measures, so the cost is the cost with those voices sounding.

A verdict for each host follows: suitable, isolated (it runs in a worker of its own and is never grouped), or unsuitable.
Kars is rated suitable for omx-clap-host, real-time safe under a parameter sweep and under notes, hosted isolated. The Pi's
figures are in [plugin-hostd on a Raspberry Pi 5](/notes/plugin-hostd-on-a-raspberry-pi-5), and Surge XT's in
[Instruments on a Pi 5](/notes/instruments-on-a-pi-5).

## 3. Pins

**Owner:** plugin-qualify. **Writes:** `/var/lib/omx/qualified.pins`, one line per plugin.

From the records, one line per plugin says what plugin-hostd may host and how (see
[Pins on first use](/notes/pins-on-first-use)). The daemon loads the pins as its only source of permission, and its
planner reads them to group workers and to place them on cores. An instrument is never put into a chain's shared worker,
so a fault or a late buffer in a voice cannot reach the effects after it.

That is also what the cores need. Surge XT 1.4.0 ignores CLAP's thread-pool extension, so one instrument is one audio
thread. Several instruments use several cores when each is in its own worker and the workers are spread over the audio
cores, with the daemon kept off them.

## 4. Layout

**Owner:** omx-panel. **Writes:** the pages, computed from the descriptor by `omx-panel layout --descriptor`; the record
keeps the layout scheme and hash it was judged against.

The layout turns a descriptor's parameters into pages: sections become groups, and every control gets a stable key. The
same layout drives the engine's controller pages in Zynthian, the MOD GUI generated for MOD-UI, and the bundle that adds
groups to third-party LV2 plugins (see [Why most LV2 plugins on a Zynthian need inferred port
groups](/notes/why-lv2-plugins-on-zynthian-need-inferred-port-groups)).

Kars has one group of three knobs, and so one page, "Controls". An effect lays out differently: OpenMixer's equaliser
puts each band on a page of its own.

## 5. Read on the device

**Owner:** Zynthian's user interface, with the daemon. **Writes:** nothing; it reads.

The interface reads the pins for its menus, the records for latency, real-time safety and cost on each row, and the layout
for the pages. Before an insert it asks the daemon's `estimate` verb what the chain will cost. Nothing is computed twice:
the descriptor for parameters, the record for figures, the pin for permission, the layout for pages.

On the device, for Kars, the plugin menu row with its tier, latency (measured and declared frames) and real-time safety:

![The plugin menu, sorted by tier](/technical-notes/from-a-plugin-file-to-a-page/list-by-tier.png)

the engine's controller page:

![The controller page of Kars](/technical-notes/from-a-plugin-file-to-a-page/controller-page-1-controls.png)

the MOD GUI from the same layout:

![The MOD GUI of Kars on a pedalboard](/technical-notes/from-a-plugin-file-to-a-page/modgui-pedalboard.png)

and the chain with the instrument:

![A chain with Kars and a compressor](/technical-notes/from-a-plugin-file-to-a-page/chain-view-kars-zamcomp.png)

A fresh device does not repeat the long stage. A package ships the records and pins of a known plugin set, keyed by
checksums, so a fresh device applies them and probes only what differs.
