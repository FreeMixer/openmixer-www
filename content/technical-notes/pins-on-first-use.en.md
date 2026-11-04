---
title: "Pins on first use: how plugin-hostd trusts a plugin binary"
summary: plugin-hostd records the hash of a plugin's files and of its parameter layout the first time the plugin is added, checks them on every later add, and refuses loudly when they change, so that a standalone host gets pins without a controller sending them.
measured: plugin-hostd 0.3.0 and later.
topic: host
order: 30
---

## Why

While `require_pins` is on, an unpinned plugin is refused (-508), so a standalone user's first `add` would fail unless a
controller sent `pin_set` first. A host that does not pin by itself would have to turn `require_pins` off, and then no
pin is checked at all. So the pin is taken on first use and kept, and any change after that is loud.

An external plugin carries no pins of its own, and its qualification record is evidence, not a pin. A pins file is shipped
only for the binaries of OpenMixer's own packages, and a record whose verdict is `refused` refuses an add.

## Settings

| key | default | meaning |
|---|---|---|
| `pin_mode` | `first-use` | `strict` or `first-use`, read only while `require_pins` is 1 |
| `pin_store` | empty | the file the learned pins are kept in; empty means `$XDG_STATE_HOME/plugin-hostd/pins`, else `$HOME/.local/state/plugin-hostd/pins` |
| `pin_file` | empty | a pins file loaded at startup, written by `plugin-qualify --all --pins` |

`require_pins 0` still means no pin is checked. `strict` is the earlier behaviour: a plugin with no pin is refused with
-508. A host that pins by itself sets `pin_mode strict`.

## One line format

The pin store, the pins file and the `pin_set` verb carry the same line:

```
pin_set <uri> <path>=<sha256>[,<path>=<sha256>...] <scheme>:<sha256> [verdict=<word>]
```

- In a file the leading `pin_set` is optional, `#` starts a comment and blank lines are skipped.
- The layout word is `-` while the layout has not been learned. `pin_set` as a verb refuses `-`.
- `verdict=` is the qualification verdict of the pinned bytes: `in-process`, `isolated` or `refused`. Absent means not
  qualified.

The store holds only the pins the daemon learned or accepted. A pin that arrived by `pin_set` or `pin_file` is the
controller's: it is not written to the store, and it replaces a stored one of the same uri while the daemon runs. The store
is written to a temporary file in the same directory and renamed, mode 0600.

## First use

An `add` in `first-use` mode, with no pin for the uri:

1. The daemon collects the files the format loads for the plugin, hashes them over open descriptors and records a pin with
   layout `-` and no verdict. Nothing is accepted from a failed collection: the add is refused with -509 and no pin is
   recorded.
2. The instance is placed in a worker of its own, whatever the placement asked. Sharing a process needs a verdict of
   `in-process` on the pin, and a learned pin has none.
3. Once the worker accepted the add, the daemon asks it for the parameter layout (`pin_layout <instance>`), records it in
   the pin and writes the store. A worker that does not know the verb leaves the layout at `-`; the files are still
   checked on every later add.

Later adds check the stored pin as `strict` does: the files are hashed before any worker sees the add, and the layout is
handed to the worker with `pin_expect`. A replayed add (a respawned worker) never learns: it checks the pin it has.

## A change

- Files differ: the add answers -509. Layout differs: the worker refuses and the add answers -510. In both modes the
  daemon emits `pin_changed <uri> files` or `pin_changed <uri> layout` on the feedback port.
- The pin stays as it was. Nothing loads the changed plugin until the controller decides.
- `pin_accept <uri>` takes the new pin: the files are collected and hashed again, recorded with layout `-` and without the
  verdict, so the next add learns the new layout and places the instance in a worker of its own. In `strict` mode it is
  refused: a host that pins by itself changes a pin with `pin_set`.

Accepting never makes a plugin in-process: that stays a decision of qualification.

## The pins file of plugin-qualify

`plugin-qualify --all --pins <file>` writes the same line, with `verdict=`, for every plugin it qualified. The daemon loads
it at start with `pin_file`; a line it cannot parse stops the start and names the line. One command scans, qualifies and
pins what is installed; a corrupted hash in the file makes the add answer -509.

## A format-neutral host

The daemon keeps one table of formats, and a format is one row of it:

| capability | meaning | lv2 | clap |
|---|---|---|---|
| `name` | the word `policy_set`, `worker_env` and `worker_list` use | lv2 | clap |
| `prefix`, `strip_prefix` | how a uri says it is this format, and whether the worker gets it without | `lv2:` stripped, also the default for a bare uri | `clap:` kept |
| `worker` | the program, from the settings | `mod_host` | `clap_host` |
| `pin_collect` | the root and the files the host loads for a uri | the bundle's manifest, binary and seeAlso files | the `.clap` file |
| `layout_check` | the worker takes `pin_expect` and `pin_layout` | no | yes |
| `world_scope` | what the worker's world is made of | one bundle (narrowed) | none |
| `pin_pool` | whether a pin lets the plugin share a worker | no | yes |

The protocol names no format where it means a capability. A test registers a third format at run time and takes it
through add, `param_set`, `pin_set`, `pin_check` and remove with the protocol untouched; a row with a capability missing is
refused with a named reason, so the test goes red instead of the daemon compiling it silently.

What a standalone host does with an `in-process` verdict is the host's decision: the verdict travels in the pin.
