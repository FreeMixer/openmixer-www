---
title: "Chains: plugins in series in one worker, and a crashed member quarantined"
summary: A chain runs a strip's plugins in order inside one worker process, so they wake once per cycle instead of once each; when a member crashes, it alone is quarantined and the rest of the chain goes on.
measured: plugin-hostd with omx-clap-host, October 2026.
topic: host
order: 40
---

## Why

omx-clap-host gives every plugin its own JACK client, and every client is a node of the graph with its own wake-up per
cycle. Most of a cycle's time goes on those wake-ups, not on the plugins (see
[One JACK client for a chain](/notes/one-jack-client-for-a-chain)). A strip that runs four plugins in series wakes four
nodes. omx-clap-host can run a chain of plugins in one client and call them in order inside one process callback; it must
be told which instances form a chain and in what order, and the daemon must put them in one worker.

A chain shares one process, so one member's crash would take the others down. plugin-hostd exists to isolate crashes: the
member that crashed leaves the chain and the rest go on.

## The verbs

```
chain <chain> <instance> [<instance> ...]                resp 0
chain_clear <chain>                                      resp 0
chain_get <chain>                                        resp 0 <worker> <declared> <running>
```

`chain` declares the members in order; they must be instances an `add` made. The chain gets one worker, of place
`chain:<chain>`. Each member leaves the worker it was in: its state is saved, its `remove` goes to that worker, and the new
worker replays it like a respawn: the add, the state, the verb ledger and the connections, in that order. Declaring a chain
again gives it the new order; a member left out goes back to a worker of its own. `chain_clear` gives every member a
worker of its own and forgets the chain.

`chain_get` reads a chain back: its worker, its members in the declared order, and the members its worker runs now. A
quarantined member is in the declared list and not in the running one. It is the controller's check that an add, a move
or a remove landed.

A chain declared again while its worker is up keeps that worker, and the members that stay are not restarted. A member
left out goes to a worker of its own; a new member leaves its old worker and joins the running one with its add, its state
alone, its verbs and its connections; and the worker is sent the new order. A move, a new order with no member joining or
leaving, sends the order and nothing else. The chain is formed again from scratch only when its worker is not up, when a
member is split out or rejoining, or when a joining LV2 member needs a bundle the running worker's world was not built
with.

## Which members can share a chain

`clap` and `lv2-clap` are two rows of one program, omx-clap-host, and both run chains in one client, so a CLAP member and
an LV2 member (through the LV2 adapter) form one chain. Members of two programs (LV2 on mod-host with CLAP) are refused
with `CHAIN_MIXED_FORMAT`.

A refusal changes nothing:

| code | when |
|---|---|
| `CHAIN_UNKNOWN_INSTANCE` | a member that no `add` made |
| `CHAIN_DUPLICATE` | the same instance twice in the list |
| `CHAIN_INSTANCE_BUSY` | a member already in another chain |
| `CHAIN_MIXED_FORMAT` | members that one worker program does not run together |
| `PLACEMENT_INVALID` | a member whose plugin may not share a worker while `require_pins` is on |
| `NO_SUCH_CHAIN` | `chain_clear` of a chain no `chain` declared |

A chain of one is valid: one isolated plugin is a chain like any other.

## What the worker is told

A worker that runs chains in one client is sent the same `chain` line after the adds of its replay. A worker that does not
(mod-host) holds the members in one process, and its connections give the order. Bypass, parameters and every instance
verb still name one instance by its own number; the daemon routes them to the chain's worker.

## A crash

A chain's worker is a pool to the supervisor, which attributes a death the same way:

- When the death names a culprit (the verb in flight, or a recent suspect), the culprit is quarantined
  (`instance_quarantined <instance> <worker>`) and moved to a worker of its own. The chain's worker is respawned with the
  other members in their order, and `chain_formed <chain> <worker> <instance>,...` names the order that runs now.
- When it names none, the members are split, each into a worker of its own. The member that dies again on its own is the
  culprit: it is quarantined, and the others rejoin the chain in their order.

A quarantined member keeps its place in the declared order. `quarantine_clear` puts it back, and the chain's worker is
formed again with every member that is not quarantined. `remove` of a member takes it out of the chain; a chain whose last
member is removed is forgotten.

## LV2 chains under require_pins

An LV2 pin holds only in a world narrowed to the plugin's own bundle. A chain's worker therefore gets a world narrowed to
the union of its members' bundles, so that each member's pin still holds in it. A member whose bundle is not found leaves
the world unbuilt rather than widening it, and `chain` refuses that chain with `PLACEMENT_INVALID` before anything moves.

A world narrowed to one member's bundle is the failure to avoid: in a bench of eight LV2 plugins chained through the
adapter, a member in an `LV2_PATH` of a single bundle answered `resp -101` (no plugin of that uri). A test forms a chain of
two LV2 members, checks that the worker's `LV2_PATH` holds exactly the two bundles, and a sabotage that narrows the world to
the first bundle must turn it red.
