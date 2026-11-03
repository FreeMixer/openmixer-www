---
title: "The grouping planner: the fewest workers that pins and history allow"
summary: Given a strip's plugins in signal order, the planner puts consecutive plugins that may share a process into one worker and leaves the others alone, judged by their pins, their cost and what they did on this machine; it stays off by default until the benchmark shows it wins.
measured: The design of plugin-hostd's grouping, October 2026. Grouping is off by default until the benchmark publishes a win on a Raspberry Pi 5 and on a desktop.
topic: host
order: 50
---

## The problem

plugin-hostd can run many plugins in one process, which saves CPU and memory. A chain is all-or-nothing, though: a
controller declares the members of a strip as one chain, and one member that may not share a process (no qualification
verdict, or a verdict of `isolated`) makes the whole strip run one process per plugin. Nothing is learned from what a plugin
did on the machine either.

The planner answers a different question from a chain. A chain is the controller's statement: these run together, in this
order. A plan is the daemon's answer to: given these, in this order, which of them may run together. It ends in the `chain`
and `add` calls the daemon already has; it adds no new way to run a plugin.

## The planner

A pure function in plugin-hostd: the same inputs give the same plan, byte for byte, and it reads no clock and no file while
it decides.

**Inputs**: the members in signal order (instance, uri, format); for each, its pin (files, layout, verdict or none), its
cost (`coreFractionP95` at the daemon's rate and quantum) and latency from the qualification record when there is one, and
its history on this host class; and the host class and settings (`group_max`, `group_cost_max`, `grouping`,
`require_pins`, `pin_mode`).

**Output**: a list of segments in signal order. A segment is a run of consecutive members that share one worker, or one
member alone. A segment of two or more is declared as a chain; a segment of one runs in a worker of its own. Every member
left alone gets one reason code.

Segments are runs of consecutive members because a chain is one callback in the declared order, and a member left out of
the middle must keep its place in the signal path. So `A B C D E` with `C` unfit becomes `[A B] [C] [D E]`.

**Rules, in this order; the first that matches a member decides it.**

| reason | when | the member |
|---|---|---|
| `refused` | pin verdict `refused` | is not added at all (-516) |
| `no-pin` | no pin, `pin_mode strict` | is not added (-508) |
| `no-verdict` | a pin without a verdict (a learned pin) | runs alone |
| `verdict-isolated` | verdict `isolated` | runs alone |
| `format-world` | its format pins only in a world of its own, and the chain's union world cannot be built | runs alone |
| `history-crashed` | the history marks it crashed | runs alone |
| `history-xruns` | the history marks it as raising xruns when grouped | runs alone |
| `cost-over` | its cost alone is over `group_cost_max` | runs alone |
| `format-mixed` | its program differs from the open segment's and the two do not both run chains in one client | starts a new segment |
| `group-full` | the open segment holds `group_max` members | starts a new segment |
| `group-cost` | its cost takes the open segment over `group_cost_max` | starts a new segment |

A member no rule matches joins the open segment. A plugin with no history is judged by its pin and cost alone: no history
is neutral, or a plugin could never earn one. `group_cost_max` is a fraction of one core; a segment is one callback, so its
members' costs add. A member with no known cost counts as the median of the segment's known costs (zero when none is
known), and the reasons say `cost-assumed`.

A member left alone only because it was next to an unfit one may share a pool with such members of other chains. A pool
saves resident memory, not wake-ups: each member stays a JACK client. Two chains never share a chain worker.

## The verbs

The plan runs in the daemon, so that Zynthian's engine (a Python controller) and OpenMixer's console reach the same answer
without carrying the rules.

- `plan <chain> <instance> ...` applies the plan: the segments become chains and the lone members run alone. The reply
  lists the segments as `i,i,i;i;i,i`. A chain planned again keeps the running workers of segments that did not change.
- `plan_get <chain>` reads back the last plan and the reason of each member left alone; a `plan_reason` event carries the
  same when a plan changes.
- `plan_clear <chain>` gives every member a worker of its own and forgets the plan.

Each segment's worker is pinned to the least-loaded audio core by the `placement` setting; `plan` and `plan_get` report the
core of each member.

`grouping` is a setting, `off` or `on`. Under `off`, `plan` answers the plan without applying it, with the reason
`grouping-off`.

## The history record

What each plugin did on this machine, kept per plugin, per binary and per host class: the key is the uri, the SHA-256 of
the first pinned file, and the host class (architecture, core band, clock band). A changed plugin starts a fresh record.

| key | meaning |
|---|---|
| `first`, `last` | the first and last window, UTC seconds |
| `windows_solo`, `windows_grouped` | windows run in a worker of its own, or in a worker of two or more |
| `cpu_p95_solo`, `cpu_max_solo` | percent of one core over a window, windows run alone only |
| `pss_mb_solo` | the worker's proportional memory, MiB, largest window run alone |
| `xrun_windows_solo`, `xrun_windows_grouped` | windows in which JACK counted at least one xrun |
| `crashes_solo`, `crashes_grouped` | worker deaths attributed to the plugin |
| `restarts_grouped` | worker deaths while it was a member and not the culprit |
| `quarantines` | times it was quarantined |
| `last_crash`, `last_crash_grouped` | UTC seconds |

CPU is kept per plugin only for windows run alone: a group's worker time cannot be split among its members honestly. A
window is 60 seconds; a window with the plugin up less than half of it is not counted.

The file is `$XDG_STATE_HOME/plugin-hostd/history` (else `~/.local/state/plugin-hostd/history`), mode 0600, written to a
temporary file and renamed. Only the daemon writes it, from its idle tick and when the supervisor attributes a death. The
planner reads a summary of it: `crashed` when a crash falls within 30 days, `raises-xruns` when, after at least 30 grouped
windows, the share of grouped xrun windows exceeds the share solo by 0.05.

The history is local. It holds URIs, digests and counters: no audio, no path, no user, session or preset name. The daemon
never sends it anywhere, and `history_clear` deletes it.

**Xruns.** JACK reports an xrun to a client, not to a plugin, and the daemon holds no JACK client. The worker does, so it
reports `xruns <count>` on its feedback port, and the daemon counts a window's xruns against every member of that worker. A
group's xrun window is a suspicion of each member, not proof against one: that is why the planner compares a plugin's grouped
share with its own solo share rather than reading an absolute count.

## How qualification uses it

`plugin-qualify adjust --history <file>` writes a second verdict beside the measured one, for the history's host class,
with its reason. The measured verdict never changes.

| move | when | reason |
|---|---|---|
| `in-process` to `isolated` | crashed, or raises xruns grouped, on this class | `history.crashed`, `history.xruns-grouped` |
| `isolated` to `refused` | three or more solo crashes within 30 days | `history.crashed-alone` |
| `isolated` to `in-process` | the verdict was decided by cost alone, six hours run alone with no crash or restart, and the cost under the profile's budget | `history.steady` |

A promotion never lifts a verdict decided by real-time safety, a missing feature, a crash in the prober or an `unknown`:
those are measurements of the plugin, not of this machine. A `refused` verdict is never promoted. The history can only make
the planner more careful than the pin, never less.

## In Zynthian

Zynthian's engine sends `plan` with a strip's members instead of `chain` when the daemon offers it. One plugin that may not
share no longer ungroups the strip, the engine shows the reason of a plugin left alone next to its verdict in the plugin
menu, and a restarted daemon makes the same plan from the same inputs.

## The benchmark that decides the default

The chains-against-processes scenarios of the `omx-bench/1` harness, on a Raspberry Pi 5 and on a desktop, in four modes
with the same plugins: `individual` (one process per plugin), `chain` (the whole strip as one chain), `plan` (through the
planner, with at least one plugin per strip that may not share) and `pool`. Each scenario also runs under a fixed stress
load: busy processes pinned to the host's cores plus a fixed memory touch.

`grouping` turns on by default only when, on both machines, at 8 and 16 plugins and every listed rate and quantum, each row
repeated at least three times:

1. without stress, `plan` has fewer processes than `individual`, and no more memory, CPU or xruns;
2. with stress, `plan` has no more xruns than `individual`, and fewer over the whole matrix;
3. `plan` has no more xruns than `chain` where a chain is possible, and recovers from a killed worker no slower than
   `chain` beyond the measured spread.

If the numbers lose, grouping stays off and the numbers are published anyway.

## Failure modes

- **A member crashes**: the named culprit is quarantined and moved to a worker of its own, the crash enters the history,
  and the next plan leaves it alone (`history-crashed`). A death that names no culprit splits the members; the plan is made
  again after ten minutes of steady running.
- **Xruns in a group**: once the share is over the margin, the next plan leaves the costliest members alone. A plan never
  changes by itself mid-cycle; it applies at the next declaration, quarantine or `plan` call.
- **An unreadable history** is neither read nor saved, and the planner runs on pins and costs alone
  (`history-unavailable`).
- **A worker that does not report xruns** leaves the xrun windows at zero, and nothing is marked `raises-xruns`.
- **A plan the daemon cannot make** leaves the members as they were and answers the refusal's code, with the reason
  `plan-refused:<code>`.
