---
title: Why most LV2 plugins on a Zynthian need inferred port groups
summary: Half the LV2 plugins installed on a Zynthian have more than four controls and no port groups, so the touchscreen cuts them into screens of four in port order. A generated bundle that replaces the plugin's own description, never its files, can add groups that every Zynthian consumer reads.
measured: A Raspberry Pi 5 running ZynthianOS Vangelis-2610.1, October 2026.
topic: zynthian
order: 60
---

## The measured gap

On a Zynthian image (ZynthianOS Vangelis-2610.1) 1243 installed LV2 plugins have controls, and only 105 of them declare
port groups. 623 have no groups and more than four controls, so the touchscreen cuts them into screens of four, in port
order, whatever the controls are.

## Where each Zynthian consumer reads

- **MOD-UI** finds a MOD GUI in any loaded file whose subject is the plugin's URI. That is why a generated, separate GUI
  bundle already works.
- **The touchscreen engine** reads ports through lilv. On each port it reads `pg:group`, and on the group node
  `lv2:symbol` (required: without it every port falls into one "params" group), `lv2:name` (falling back to `rdfs:label`)
  and `lv2:displayPriority`. Screens of four are cut per group, sorted by display priority. It never reads `pg:mainInput`,
  `lv2:portGroups`, `units:unit` or `rdfs:comment` on a port, and no layout file keyed by plugin URI or port symbol exists.
  The plugin's name, type, category and description are cached per URI after the first scan, so a changed description
  needs a regenerate from the web configuration.

## Why an added bundle cannot complement a plugin

lilv ignores a second bundle that declares a plugin it already loaded ("Duplicate plugin ... ignored"), and a plugin's
ports are anonymous nodes, so a separate file has nothing stable to attach `pg:group` to. Tried on a small envelope plugin,
the groups stayed empty.

## The channel that works: a replacing bundle

lilv's duplicate rule is a version comparison, not a flat refusal: a second bundle for the same URI **replaces** the one
already loaded when its `lv2:minorVersion` or `lv2:microVersion` is newer; an equal or older one is dropped. The test that
found empty groups had used an equal version.

So, for a plugin OpenMixer does not own, the complement is a generated bundle that:

- restates the plugin's own description in full (every port, every parameter, as the plugin states it), read through the
  Turtle parser, never retyped;
- keeps `lv2:binary` pointing at the plugin's installed library: no shim;
- raises `lv2:microVersion` by one over the installed value, so lilv loads it and drops the original;
- adds group nodes, each with `lv2:symbol`, `lv2:name` and `lv2:displayPriority`, attached to the restated ports **by port
  symbol**: symbols are stable, blank nodes are not;
- is marked with a file beside it, so a later run tells its own output from the plugin's bundle and never touches the
  plugin's installed files.

Deleting the marked bundle restores the original: lilv has nothing newer to prefer and loads the plugin's own files again.
A plugin that already declares its own groups is left alone, with no marker and nothing generated.

## Which groups

The groups are inferred automatically, over every installed plugin at install time, never laid out by hand per plugin. The
rules, in order: the plugin's own partial groups; `lv2:designation`; a shared name or symbol prefix ("Band 1 …", `b1_`);
a shared unit; a contiguous run of port indexes; the plugin's own MOD GUI layout when it has one. A plugin the rules cannot
group with confidence gets no complement at all, never a guessed layout.

The rules and the bundle writer are specified by omx-panel: [group inference](/projects/omx-panel/group-inference) and
[the LV2 complement](/projects/omx-panel/lv2-complement).

## When a proxy is needed instead

A proxy bundle, with its own URI, ports and groups and a shim forwarding audio, parameters and state to plugin-hostd, is
only the exception: for a plugin whose description the Turtle reader cannot parse, whose version field is already at its
ceiling, or whose files declare more than one subject for the same URI.

## What proves it on the device

1. lilv, loaded after the generator, sees the inferred groups on a matched plugin, and the original bundle lost the
   replace.
2. Zynthian's port reader returns those groups, and the touchscreen shows the expected screens.
3. A plugin that declares its own full groups loads exactly as before: no marker, the same bytes.
4. Deleting a marked bundle brings back the plugin's original files.
5. A complemented plugin still runs through plugin-hostd unchanged: add, parameters and state behave as for any LV2
   plugin.
