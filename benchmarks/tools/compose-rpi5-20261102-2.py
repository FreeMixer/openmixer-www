#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""Composes benchmarks/runs/rpi5-20261102-2.json from the evidence directories of FreeMixer/plugin-hostd
(docs/zynthian/evidence). Every figure is read from those files; nothing is typed here.

  compose-rpi5-20261102-2.py <path to a plugin-hostd checkout> > benchmarks/runs/rpi5-20261102-2.json

The scenario rows are the harness's own rows, unedited: H1 and H3 from the all-hosts run
(pi5-matrix-2026-11-02/rpi5-20261102-1.json, omx-clap-core 0.26.3) and H2 from the same bench rerun on
omx-clap-core 0.26.4 (h2-occ-0.26.4/). Each row says which omx-clap-core it ran on.
"""
import csv, json, re, statistics, sys
from pathlib import Path

ev = Path(sys.argv[1]) / 'docs/zynthian/evidence'
jl = lambda p: json.load(open(ev / p))
med = lambda xs: round(statistics.median(xs), 2)

first = jl('pi5-matrix-2026-11-02/rpi5-20261102-1.json')
h2 = jl('pi5-matrix-2026-11-02/h2-occ-0.26.4/rpi5-20261102-1.json')

scenarios = []
for core, src, hosts in (('0.26.4', h2, {'H2'}), ('0.26.3', first, {'H1', 'H3'})):
    for s in src['scenarios']:
        if s['host'] in hosts:
            s = dict(s)
            if s['host'] != 'H3':
                s['software'] = {'omx-clap-core': core}
            scenarios.append(s)

software = {k: v for k, v in first['software'].items() if k != 'omx-clap-host'}

# time to add
cold = []
for f, host_of in (('cold-to-snapshot-grouped.json', None), ('cold-to-snapshot-own.json', None)):
    for r in jl(f'pi5-add-times-2026-11-02/{f}')['rows']:
        mode = 'individual' if r['host'].endswith('own') else ('chain' if r['host'] == 'plugin-hostd' else 'shared-process')
        host = {'plugin-hostd': 'H2', 'plugin-hostd own': 'H2', 'omx-clap-host': 'H1', 'mod-host': 'H3'}[r['host']]
        v = r['cold_to_loaded_ms']
        cold.append({'set': r['set'], 'builds': r['builds'], 'host': host, 'mode': mode, 'plugins': r['plugins'],
                     'median_ms': r['median_loaded_ms'], 'min_ms': min(v), 'max_ms': max(v), 'repeats': len(v),
                     'start_to_answering_ms': r['median_start_ms']})
warm = []
for r in jl('pi5-add-times-2026-11-02/add-times-lv2.json')['rows']:
    if r['phase'] != 'warm':
        continue
    host = {'plugin-hostd': 'H2', 'omx-clap-host': 'H1', 'mod-host': 'H3'}[r['host']]
    mode = {'grouped': 'chain', 'own': 'individual', 'one process': 'shared-process'}[r['mode']]
    warm.append({'plugins': r['plugins'], 'builds': r['builds'], 'host': host, 'mode': mode,
                 'median_ms': r['ms'], 'min_ms': r['min'], 'max_ms': r['max'], 'repeats': r['repeats']})

# instruments
groups = {}
for f in ('pi5-instruments-2026-11-02/voices-cores.tsv', 'pi5-acceptance-2026-11-02/ca72-voices-cores.tsv'):
    for r in csv.DictReader(open(ev / f), delimiter='\t'):
        groups.setdefault((r['name'], r['host'], int(r['notes_total'])), []).append(r)
instruments = []
for (name, host, notes), rs in groups.items():
    dsp = [float(r['dsp_avg']) for r in rs]
    x = [int(r['xruns']) for r in rs]
    row = {'name': name, 'host': {'hostd': 'H2', 'mod-host': 'H3', 'cmd': 'standalone'}[host], 'notes': notes,
           'repeats': len(rs), 'dsp_load_avg': med(dsp), 'spread': {'dsp_load_avg': [min(dsp), max(dsp)], 'xruns': [min(x), max(x)]},
           'xruns': int(statistics.median(x)), 'status': 'ok' if all(r['status'] == 'ok' for r in rs) else 'failed'}
    if rs[0].get('pss_mb'):
        pss = [float(r['pss_mb']) for r in rs]
        row['pss_mb'] = med(pss)
        row['spread']['pss_mb'] = [min(pss), max(pss)]
    peak = [float(r['peak_db']) for r in rs]
    row['peak_db'] = med(peak)
    instruments.append(row)

# qualification
q = jl('pi5-qualification-2026-11-02/qualification-2026-11-02.json')
t = q['totals']
fmt = q['by_format']
inst = [l for l in (ev / 'pi5-acceptance-2026-11-02/s5-install-check.txt').read_text().splitlines() if 'candidate' in l]
qualification = {
    'plugins': q['plugins'],
    'lv2': sum(v for k, v in fmt.items() if k.startswith('lv2')),
    'clap': sum(v for k, v in fmt.items() if k.startswith('clap')),
    'qualified_in_process': t['qualified, in-process'], 'qualified_isolated': t['qualified, isolated'],
    'crashed': t['unsuitable: crashed'], 'hung': t['unsuitable: hung'], 'refused': t['unsuitable: refused'],
    'unmeasured': t['unmeasured'], 'no_pin': t['qualified, no pin (console memory unmeasured)'],
    'records_package': q['records_package'],
    'packages_installed': len(inst), 'packages_verified': sum('verify:ok' in l for l in inst),
}

# profile (the table of pi5-profile-2026-11-02/README.md, text as written there)
rows = []
for l in (ev / 'pi5-profile-2026-11-02/README.md').read_text().splitlines():
    m = re.match(r'\| (.+?) \| (.+?) \| (.+?) \|$', l)
    if m and not m.group(1).startswith(('where', '---')):
        rows.append({'where': re.sub(r'`', '', m.group(1)), 'cvp24_lv2': m.group(2), 'cvp24': m.group(3)})

run = {
    'schema': 'omx-bench/1', 'id': 'rpi5-20261102-2', 'machine': first['machine'], 'software': software,
    'scenarios': scenarios, 'add_times': {'cold': cold, 'warm': warm}, 'instruments': instruments,
    'qualification': qualification, 'profile': {'audio_thread_shares': rows},
    'sources': [
        'plugin-hostd docs/zynthian/evidence/pi5-matrix-2026-11-02 (rpi5-20261102-1.json, h2-occ-0.26.4/rpi5-20261102-1.json)',
        'plugin-hostd docs/zynthian/evidence/pi5-add-times-2026-11-02',
        'plugin-hostd docs/zynthian/evidence/pi5-instruments-2026-11-02',
        'plugin-hostd docs/zynthian/evidence/pi5-acceptance-2026-11-02',
        'plugin-hostd docs/zynthian/evidence/pi5-qualification-2026-11-02',
        'plugin-hostd docs/zynthian/evidence/pi5-profile-2026-11-02',
    ],
}
json.dump(run, sys.stdout, indent=2, ensure_ascii=False)
print()
