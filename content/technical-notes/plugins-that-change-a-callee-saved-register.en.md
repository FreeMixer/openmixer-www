---
title: Plugins that change a callee-saved register
summary: A plugin that returns with a callee-saved register changed breaks its host later and somewhere else. The host core now guards every plugin call, records the first change, and the qualification offers such a plugin isolated only.
measured: Raspberry Pi 5 (Debian 13, arm64) and an x86-64 desktop, October 2026; omx-clap-core 0.26.2.
topic: qualify
order: 20
---

## What happens

Every calling convention gives a callee registers it must hand back as it found them:

- aarch64: x19 to x28, d8 to d15, FPCR
- x86-64: rbx, rbp, r12 to r15, MXCSR's control bits, the x87 control word

A caller may keep a value in one of them across the call. A plugin that returns with one changed replaces that value
without anything crashing at the time. The damage shows later, somewhere else.

## How it was found

Four limiter plugins of one LV2 collection, measured on a Raspberry Pi 5, returned from `run()` with d14 and d15 changed,
from block 227 of the measurer's control sweep on, in 386 of its calls. The measurer kept its sample rate in d15. Its next
instance was opened at 0 Hz, the plugin sized a buffer from that rate and wrote through a NULL pointer: each of the four was
recorded as a crash (SIGSEGV).

Built at -O0, where the compiler keeps its locals in memory rather than in those registers, the measurer ran them to the
end. At -O2 it crashed every time. That difference is the mark of a clobbered register.

## The guard

The host core calls every plugin function through one guard, `omx_abi_call6` (`abi_guard.S`):

- it saves the callee-saved registers, calls, compares, and puts them back;
- it records the first call that changed any: the registers, the plugin function and the run block.

Its cost is 14 to 15 ns per call on a Raspberry Pi 5 and 5.6 ns on an x86-64 desktop. For 24 plugins at 48 kHz in
256-frame blocks that is 0.36 µs of each 5,333 µs block.

The LV2 measurer makes every plugin call through the same guard, `lilv_plugin_instantiate` and `lilv_instance_free`
included. Its record carries `abi`, for example:

```
{"clobbered":true,"registers":["d14","d15"],"call":"run","block":227,"calls":386}
```

A plugin that never clobbered reads `{"clobbered":false}`.

## What is done with such a plugin

The verdict is `hosting.stability.callee-saved-clobbered`, rated conditional: the plugin is offered isolated only, in a
worker of its own, never in-process in the console and never in a shared chain. The guard keeps the host's own frame
whole; it does not protect the state of other plugins in the same process.

A worker reports `abi_clobber <instance> <mask> <registers> <call> <block>` on its feedback port, once per instance, and
plugin-hostd then moves the instance, with its state, to a worker of its own.

Under the guard the four limiters measure to the end: no allocation in `run()`, and every rate sounds. Their figures from
before the guard may have been corrupted and are not used.

## What the guard does not show

A plugin that crashed without the guard and runs to the end with it, recording no clobber, is not proven clean: the guard
changes the measurer's stack frame and may hide a memory fault. And a plugin that still crashes under the guard and at -O0
has its cause elsewhere.

## How to see it again

The test fixture `native/fixtures/lv2-gain.c` of plugin-qualify, built with `-DFIXTURE_ABI_BREAKER`, returns from its third
`run()` with x19 and d15 changed (rbx and r15 on x86-64), in assembly, after the C `run()` has returned. The test
`src/lv2-measure-native.test.ts` measures it to the end and checks the record.
