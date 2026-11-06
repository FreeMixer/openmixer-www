# Plugin catalog data

What was measured about each audio plugin, per platform. The `/plugins/` page is built from the files
in `app/data/plugin-catalog/`, and those are generated from the public qualification records, plugin-db's qualification layer, in
[FreeMixer/plugin-db-qualification](https://github.com/FreeMixer/plugin-db-qualification). Nothing is
typed by hand: every figure is read from a record, from the probe output beside it, or from its set's
`provenance.json`.

- `pin.json` — the repository and the one commit of it the data is made from.
- `schema/plugin-catalog.v2.schema.json` — the contract of the generated files (JSON Schema 2020-12).
- `app/data/plugin-catalog/index.json` — one entry per platform: the counts, the conditions of the run, where its rows are.
- `app/data/plugin-catalog/platforms/<host class>-<set>.json` — one row per plugin of that platform. The page
  fetches one of these when that platform is shown, so the headline counts load with the page and the rows load after it.

## Commands

```
node scripts/plugin-catalog-from-records.mjs                  write the data from the pinned commit
node scripts/plugin-catalog-from-records.mjs --sync <commit>  move the pin to a full 40-character commit, then write the data
node scripts/plugin-catalog-from-records.mjs --verify         the committed data is what the pinned commit gives
node scripts/check-plugin-catalog.mjs                         the committed data is well formed and agrees with itself
```

The same as `npm run catalog:gen`, `npm run catalog:sync -- <commit>`, `npm run catalog:verify` and
`npm run catalog:check`. The first three download the pinned commit as one archive;
`--records <checkout>` reads a local clone instead, and refuses one whose HEAD is not that commit. The build
runs only the check, so it needs no network. After a `--sync`, commit the pin and the data together.

## What a row is

A platform is one set of records, `records/<host class>/<set>/`. A plugin has one record for each way it can be
offered (`default`, and for CLAP plugins `custom`); its row holds the best of them.

| Field | Read from |
| --- | --- |
| `id`, `format` | the record's `plugin` |
| `version` | the record's `testedVersion` (null when the plugin declares none) |
| `binary` | the file of the record's `binary.path`, or the `.clap` bundle it sits in. The records name no operating-system package, so the file and the version are what was tested. |
| `verdict`, `tiers`, `reason` | the record's `tiers`, see below |
| `offers` | the verdict of each record of the plugin |
| `reasons` | the `reasons` of every host's verdict, one entry for each distinct reason with the hosts that gave it |
| `notMeasured` | the record's `notMeasured` codes |
| `cpu` | the first measured grid cell: median and 95th percentile in ns per sample (the unit the probe output states; any other unit is refused), at its rate and block size |
| `latency` | the same cell's declared and measured frames, when it has them |
| `measuredAt` | the record's `measuredAt` |

The index entry carries the set's `provenance.json` as the page shows it: the day it was measured and the
conditions (system, machine, kernel, host, rate and block size, real-time class, audio server) the set names.

## Verdict

| `verdict` | Meaning |
| --- | --- |
| `accepted` | offered on a tier whose verdict qualified |
| `conditional` | offered, but only on a tier that did not qualify: it runs in a process of its own |
| `refused` | offered on no tier; `reason` is the first reason of the record's `dimmed` line, skipping a memory figure missing at the console's rate when a measured failure of another host is named |

`reason` is the code that decides it, and every code needs its text in both languages (`plugins.reason`, and
`plugins.reasonShort` for the counts) before `npm run catalog:check` passes. A shape the generator does not
know is an error, not a guess.

## Versioning

`schemaVersion` is an integer. A new optional field keeps it; renaming or removing a field or changing its
meaning is a new version with its own schema file. The page refuses nothing it does not know, so change the
page and the check in the same commit.
