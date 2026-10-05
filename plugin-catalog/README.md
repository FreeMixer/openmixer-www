# Plugin catalog data

What openmixer measured about each audio plugin it was asked to host: one JSON file per
qualification run. The website's `/plugins/` pages are generated from the newest file in `runs/`;
the `openmixer-plugin-catalog` package installs the same files to
`/usr/share/openmixer/plugin-catalog/` for consoles to read.

- `schema/plugin-catalog.v1.schema.json` — the contract (JSON Schema 2020-12).
- `schema/reason-texts.en.json` — the English text for every reason code.
- `runs/<YYYY-MM-DD>.json` — one run each.

`npm run catalog:check` validates every run against the schema and fails on a reason code with no
text. The website build runs it first.

## Versioning

`schemaVersion` is an integer. Adding an optional field or a new reason code keeps the version;
renaming or removing a field, changing a field's meaning, or renaming a code is a new version with
its own schema file (`plugin-catalog.v2.schema.json`). A reader refuses a version it does not know.

## Where the fields come from

The file is a projection of two producers in the openmixer repository; it adds no judgement of
its own.

| Field | Source |
| --- | --- |
| `rating`, `path`, `reasons[].dimension/rating/code/params` | `classifyPluginHosting` (`packages/plugin-qualify/src/hosting-suitability.ts`), as served in `/api/plugins/{uri}.hosting` |
| `run.rig`, `run.policy` | the same verdict's `basis` |
| `io`, `latency.class` | the `/api/plugins/{uri}` row (`audioInputs`, `audioOutputs`, `hasMidiIn`, `latencyClass`) |
| `latency.hostingQuanta/hostingMs` | the row's `offer.cost` |
| `cost` | the `cost` reason's parameters |
| `name`, `vendor`, `pluginVersion`, `declaredClass` (CLAP) | `omx-clap-qualify --scan` descriptor (`name`, `vendor`, `version`, `features`) |
| `vendor`, `declaredClass` (LV2) | lilv: the plugin's author and class |
| `package` | the package database entry owning the plugin binary |
| `incidents` | crash reasons, the CLAP qualifier's load refusal and timeouts |

## Verdict

| `verdict` | Meaning |
| --- | --- |
| `in-process` | rated `suitable` on every dimension |
| `isolated` | rated `conditional` or `unsuitable`; hosted in a separate process, with the deciding reason |
| `unknown` | at least one dimension not measured; hosted in a separate process |
| `refused` | the qualifier could not load or run it |

## Kind

From the plugin's own declared class, never from its name. LV2: `lv2:InstrumentPlugin` is
`instrument`; the generator and utility classes and a bare `lv2:Plugin` are `other`; every
processing class is `effect`. CLAP: feature `instrument` is `instrument`, else `audio-effect` is
`effect`, else `other`.

## One row per plugin

When a plugin is offered both as CLAP and as LV2 (same vendor, same name without the format),
the website shows one row: the twin the qualifier accepted (verdict not `refused`), and CLAP when
both were accepted. Run files keep both.

## Producing a file

The qualify job writes these files. `scripts/plugin-catalog-from-console.mjs` takes one from a
running console instead (its `/api/plugins` verdicts, lilv and rpm on the same machine):

```
node scripts/plugin-catalog-from-console.mjs --console http://127.0.0.1:8800 --revision <git rev>
```
