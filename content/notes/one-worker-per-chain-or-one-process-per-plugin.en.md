---
title: "One worker per chain or one process per plugin: the trade-offs"
summary: Grouping a chain into one worker saves most of the memory and much of the CPU that one process per plugin spends, and a crash still costs only the plugin that crashed; the price is that plugins sharing a process must be trusted, which is what qualification decides.
measured: Raspberry Pi 5 with Zynthian, 48 kHz, 256 frames, October and November 2026; the versions are named with each figure.
topic: zynthian
order: 100
---

plugin-hostd runs a chain in one worker process (grouped) or each plugin in a worker of its own. Zynthian's own hosts sit at
either end: jalv runs one process per plugin, mod-host every plugin in one process. The figures are in
[plugin-hostd on a Raspberry Pi 5](/notes/plugin-hostd-on-a-raspberry-pi-5) and on the [benchmarks page](/benchmarks); they
measure the daemon directly on a private JACK graph, not through Zynthian's engine.

## What grouping buys

- **Memory.** 24 plugins in one chain take 64.1 MB of proportional memory, against 183.1 MB with one worker per plugin and
  109.4 MB under mod-host (plugin-hostd 0.15.9, 2 November 2026). Under jalv, 24 plugins took 993.6 MB (31 October,
  plugin-hostd 0.15.4). On a 4 GB Pi this is the difference that grows with the chain.
- **CPU.** The grouped chain has the lowest DSP load of the hosts measured: 12.51 % for the 24, against 17.76 % with one
  worker per plugin and 15.02 % under mod-host.
- **Fewer wake-ups.** One JACK client runs the whole chain. With 16 plugins, the grouped chain made 6023 context switches in
  20 s, against 84 099 with one worker per plugin and 72 292 under mod-host.
- **Crash containment.** A lost worker is restarted by the daemon with the links it made itself, in about 340 ms; jalv and
  mod-host lose the process and nothing brings the plugin back. Inside a chain, a member that aborts leaves the others
  playing (see [Chains](/notes/chains-plugins-in-series-in-one-worker)). Links made from outside, as Zynthian's routing is,
  are not restored by the daemon.

## What it costs

- **A shared process must be trusted.** A plugin that corrupts memory instead of crashing cleanly can take the chain with it.
  Qualification is the guard: a plugin that fails the real-time safety sweep is isolated (it runs in a worker of its own and
  is never grouped), and one that crashes, hangs or fails to load is not offered.
- **Isolation has its own cost.** Each isolated plugin is one more worker, one more process and one more JACK client: the
  one-worker-per-plugin figures above. On the device, 306 of 1602 plugins qualify as isolated.
- **Adding to a chain.** Added into the chain's worker, 24 plugins take 549 ms cold against mod-host's 1459 ms, and from four
  plugins on a warm add is faster than mod-host's; mod-host adds two plugins to a running host faster (44.8 ms against
  55.9 ms).
- **Latency** is only the latency the clients declare (none for these plugins). A measured round trip per host needs a
  loopback through an audio interface, and has not been taken.

## CLAP hosting

Zynthian has no CLAP host of its own: jalv and mod-host host LV2 only. plugin-hostd hosts CLAP in its worker,
omx-clap-host, and LV2 through the same worker's LV2 adapter, so a chain can mix the two.

- Every one of OpenMixer's own plugins sweeps clean in both formats.
- The CLAP and LV2 builds of one plugin are not interchangeable in cost: at 192 kHz and 512 frames, the LV2 build of one
  chorus costs 592.2 ns per sample at the median against 0.85 for its CLAP build. The reason is not established.
- CLAP behind MOD-UI does not carry over: MOD-UI reads LV2 descriptions, so CLAP ports, parameters, presets and MIDI maps
  do not reach it. Zynthian's plugin-hostd engine does not go through MOD-UI.

## Qualification and pins

Every plugin on the device is measured once, and plugin-hostd reads the result as a pin per binary: a plugin whose files
change is measured again.

- Three classes: **suitable**; **isolated**, a plugin that fails the real-time safety sweep, run in a worker of its own and
  never grouped; and **unsuitable**, a plugin that crashes, hangs, fails to load or breaks the host.
- LV2 suitability came out the same for jalv, mod-host and plugin-hostd's worker, so qualification does not shrink what
  Zynthian offers for LV2: it isolates the plugins found allocating, locking or calling into the kernel on the audio thread,
  and leaves out the ones that crash or hang.
- A plugin plugin-hostd refuses stays on jalv, listed in its menu: nothing the user has disappears.
- Cost is not part of any verdict yet: the probe times 512-frame blocks only, so the menus' cost tags are not from Zynthian's
  own quantum.
- A full qualification of every plugin on a Pi 5 takes about six hours. It runs once per plugin set, not at boot, and a
  package carries the records of a known set so a fresh device probes only what differs.

## mod-host compatibility

plugin-hostd speaks mod-host's protocol on its port, so MOD-UI and Zynthian code written for mod-host talk to it unchanged.
In a session driven through MOD-UI, 130 of 135 replies were identical. The five that differed: `connect` to the
`mod-monitor` client (no worker owns it), `feature_enable aggregated-midi` (a worker started later never hears it), and
`preset_load` of a user preset after a pedalboard reload. Feedback differs by worker: `transport` was reported six times
instead of once. The protocol and every verb are in the [plugin-hostd-protocol reference](/projects/plugin-hostd-protocol/protocol).

## Packaging

The packages come from the OpenMixer apt repository for Debian 13 arm64: plugin-hostd, omx-clap-host, omx-plugins and
omx-panel. ZynthianOS Vangelis ships Python 3.13, on which MOD-UI's install recipe did not build; the change that makes it
build is offered to Zynthian. A second apt source is a cost for an image: a mirror, keys, and a release cadence that is not
Zynthian's.

## What is not done

- A listening test through an audio interface: the plugins are measured digitally at JACK ports on the Pi, and the
  sample-by-sample round trip of a chain ran in containers.
- The cost grid at the hosts' own quantums (128, 256 and 1024 frames).
- A cost estimate at Zynthian's quantum before an insert.
- The MOD-UI engine on plugin-hostd, measured on the device.
