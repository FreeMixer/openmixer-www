---
title: "Audio layouts: every port a plugin declares, and how the host judges the fit"
summary: The host used to admit a mono or stereo main pair and refuse everything else, which left out 84 of 975 LV2 plugins that mod-host hosts. Now the library describes every audio port a plugin declares, and whoever runs the plugin judges whether it can carry that layout, refusing by name rather than folding a layout down.
measured: The LV2 plugins installed on one Fedora 44 machine (975), October 2026; the design of omx-clap-core's audio layouts.
topic: core
order: 120
---

## The gap

The host admitted one main input and one main output of the same width, mono or stereo, plus up to eight auxiliary inputs
and outputs of one or two channels, and refused everything else. Of the 975 LV2 plugins installed on one machine, that
refused 84 that mod-host hosts:

- 51 with inputs beyond the main pair: side chains, mixers, meters, matrix mixers and patchbays, up to 64 inputs;
- 33 whose main pair differs in width, or whose outputs are more than the pair: mono reverbs with a stereo tail, crossovers
  with band outputs, a 34-output instrument.

A CLAP plugin with a surround or ambisonic main port was refused the same way, and the host never read the extensions that
describe such ports or offer other layouts.

## The decision

Every layout a plugin declares is supported:

- inputs beyond the main one are auxiliary inputs, silent until something binds them;
- a main port of any width is carried where the carrier has that many channels;
- a layout the carrier cannot carry is refused with a named code, never silently and never folded down;
- a mono output on a stereo strip is carried to both sides, as a mono input is.

What keeps this small is one principle: **the library describes, the carrier judges.** The host library and the LV2 adapter
admit any audio layout within declared limits and describe it completely: every port, its channels, its kind, its channel
map. Whoever runs the plugin on a lane of a given width reads that description and decides what it can carry. The console's
native lane is two channels wide and refuses a wider main port, as before; omx-clap-host under JACK can carry any width as
ports.

## What the survey found

The shapes behind the 84, and the reading that admits each:

- **A declared main group plus other ports.** Side-chain compressors, multichannel mixers, A/B testers, oscilloscopes and
  spectrum analysers, true-stereo reverbs and crossovers declare which port group is the main one; every other port is
  auxiliary.
- **Groups, but no main group.** The first group in port order is taken as the main port: a plugin with two mono groups gets
  one as main and the other as auxiliary.
- **No groups at all, more than two ports.** When the other side's main port is exactly as wide, the side is one main port
  of that width: surround meters, matrix mixers, multichannel loudness meters, N-to-N patchbays. Otherwise the first two
  ports are the main pair and the rest are mono auxiliary ports: crossfaders with two pairs, three-input compressors, an
  encoder with extra centre and surround inputs.
- **Mono in, stereo out.** Thirteen true-stereo reverbs and six splitters have main ports of different widths; their two
  outputs are the main pair, which is also what mod-host presents.

The limits come from what the survey measured, plus a margin: a port of up to 64 channels, and up to 64 auxiliary ports per
side (a 64-channel patchbay, a 24-channel loudness meter, an instrument with 34 outputs, a sampler with 98 outputs as 49
stereo groups). No installed plugin declared a surround or ambisonic group; those are exercised by test fixtures.

## Why these rules

- **Deterministic from what the plugin says.** The rules never guess a layout the plugin did not declare. A plugin that means
  a wider main declares a port group.
- **Nothing folded down.** A 5.1 plugin heard as its first two channels would be a silent loss; it is refused by name
  instead, where the carrier cannot take six channels.
- **Nothing changes for what worked.** A mono or stereo plugin on a stereo lane behaves as before, bit for bit, and the JACK
  port names of the main pair stay as they were.
- **Ambisonics without a declared normalisation.** LV2 port groups state no normalisation, so a full-order ambisonic group is
  presented as ACN ordering with SN3D normalisation, the AmbiX convention, and the description says it is assumed.
  Mixed-order groups, which a CLAP ambisonic port cannot express, are carried as discrete channels.
- **Alternative layouts are asked for, not imposed.** A plugin that offers other layouts can be asked, before activation, for
  the one the carrier has (a reverb offering mono-in and stereo-in takes the strip's); a plugin that cannot keeps its declared
  layout, and the carrier judges that.
- **Layout changes are not answered by a restart.** A plugin that rescans its ports is reported once; the carrier describes
  it again while inactive and activates it again.

## Where the rules are

The rules themselves (which ports are main and which auxiliary, the LV2 group types and their channel maps, the CLAP
extensions read, the JACK port names, the limits and the refusal codes) are in [the host library's reference](https://github.com/FreeMixer/omx-clap-core/blob/main/doc/reference.md).

## How it is proven

Test fixtures, LV2 and CLAP, one per shape: a main group with two stereo auxiliary groups, two mono groups without a main,
ungrouped 4 to 4 and 4 to 2, mono in with a stereo main output, a main pair with three band outputs, 5.1, first-order and
mixed-order ambisonics, a 64-port side and a 65-port one, plugins with alternative layouts. Each asserts the description and
a value through the ports. Sabotaged, the tests go red: restoring the equal-width refusal turns the mono-in, stereo-out
plugins red, and dropping the auxiliary binding turns the side-chain test red. Every mono and stereo plugin stays
bit-identical through the adapter.
