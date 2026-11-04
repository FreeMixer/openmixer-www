---
title: "Estats de repòs de la CPU i allotjament de plugins: què s'hi guanya retenint cpu_dma_latency"
summary: Retenir /dev/cpu_dma_latency a 10 µs, perquè cap nucli no dormi més profund que C1, retalla de tres a cinc vegades el cicle del graf d'àudio en tots els amfitrions mesurats i n'elimina els excessos, per un o quatre watts; retenir-lo a 0 costa seixanta watts per una mica més. Amb la retenció, l'avantatge de mod-host sobre els altres amfitrions desapareix.
measured: Un ordinador de taula Intel Core Ultra 9 275HX (8 nuclis de rendiment i 16 d'eficiència), Fedora 44, nucli 7.2, PipeWire 1.6.9, 96 i 48 kHz a 128 mostres, octubre del 2026.
topic: core
order: 150
---

## La pregunta

La biblioteca de l'amfitrió pot retenir `/dev/cpu_dma_latency` mentre corre, cosa que diu al nucli del sistema que no posi
cap nucli de la CPU en un estat de repòs la sortida del qual trigui més que aquest valor. Els mateixos plugins es van fer
córrer a través de mod-host, omx-clap-host (CLAP i l'adaptador LV2), el nivell dins del procés, plugin-hostd i jalv, amb el
dispositiu retingut a res, a 10 µs (només C1, el valor per defecte) i a 0 (cap estat de repòs).

| camí | què reté el dispositiu |
|---|---|
| omx-clap-host, CLAP i adaptador | el seu propi `--idle-hold=<off|µs>` |
| CLAP i LV2 dins del procés | la mateixa crida de biblioteca que fa el nivell dins del procés de la consola |
| plugin-hostd | el seu worker, omx-clap-host, amb l'opció passada |
| mod-host, jalv | res de propi: el banc de proves manté oberta la mateixa petició durant l'execució, com ho faria un script de configuració |

"Off" és la màquina en repòs: el seu perfil de tuned retenia el dispositiu a 4000 µs, que no refusa cap estat (C3 surt en
1048 µs). Les tres retencions s'intercalaven a cada repetició, de manera que una deriva de la màquina al llarg de l'hora no
coincideix amb una sola retenció. Les files CLAP porten set plugins, les LV2 vuit.

## La màquina

Intel Core Ultra 9 275HX (8 nuclis de rendiment i 16 d'eficiència, 24 fils), el governador de rendiment, `intel_idle` amb el
governador menu, estats POLL, C1 (1 µs), C2 (127 µs) i C3 (1048 µs), tots activats. Els watts són el comptatge RAPL del
paquet, integrat sobre la finestra de 30 s de cada execució. Un altre graf d'àudio en temps real corria a la mateixa màquina
i és dins de cada xifra de watts: només signifiquen alguna cosa les diferències entre retencions, no el nivell.

## Tot el graf

El final del cicle és el temps del controlador des del despertar fins que acaba l'últim node; els excessos són els cicles que
han acabat després del seu període. 96 kHz, 128 mostres (període de 1333 µs), mediana de tres repeticions:

| camí | retenció | final del cicle p50 µs | final del cicle p99 µs | excessos / 30 s | CPU de l'amfitrió % | RSS MiB | W del paquet |
|---|---|---|---|---|---|---|---|
| mod-host | off | 235 | 675 | 19 | 20,7 | 41,0 | 19,4 |
| mod-host | 10 | 74 | 116 | 0 | 8,6 | 41,0 | 18,6 |
| mod-host | 0 | 27 | 47 | 1 | 3,7 | 40,9 | 79,3 |
| omx-clap-host CLAP | off | 324 | 720 | 14 | 16,5 | 42,6 | 17,9 |
| omx-clap-host CLAP | 10 | 103 | 183 | 0 | 10,4 | 42,4 | 20,1 |
| omx-clap-host CLAP | 0 | 41 | 103 | 0 | 4,4 | 42,5 | 79,6 |
| omx-clap-host adaptador | off | 355 | 756 | 26 | 15,8 | 28,8 | 18,0 |
| omx-clap-host adaptador | 10 | 72 | 120 | 0 | 8,6 | 28,8 | 19,2 |
| omx-clap-host adaptador | 0 | 26 | 42 | 0 | 3,8 | 28,7 | 79,7 |
| CLAP dins del procés | off | 369 | 797 | 39 | 18,8 | 40,5 | 17,8 |
| CLAP dins del procés | 10 | 101 | 186 | 0 | 10,9 | 40,9 | 19,5 |
| CLAP dins del procés | 0 | 43 | 80 | 1 | 4,8 | 40,6 | 79,6 |
| LV2 dins del procés | off | 392 | 768 | 17 | 18,2 | 24,6 | 17,6 |
| LV2 dins del procés | 10 | 72 | 127 | 1 | 9,6 | 24,6 | 19,4 |
| LV2 dins del procés | 0 | 26 | 44 | 0 | 3,8 | 24,6 | 79,6 |
| plugin-hostd | off | 224 | 644 | 3 | 26,1 | 91,4 | 18,1 |
| plugin-hostd | 10 | 82 | 139 | 1 | 16,5 | 91,5 | 19,5 |
| plugin-hostd | 0 | 27 | 140 | 0 | 7,2 | 91,6 | 79,8 |
| jalv | off | 341 | 816 | 23 | 16,6 | 109,4 | 21,1 |
| jalv | 10 | 72 | 121 | 0 | 8,2 | 109,3 | 20,7 |
| jalv | 0 | 26 | 50 | 0 | 3,4 | 109,4 | 78,9 |

A 48 kHz i 128 mostres passa el mateix amb xifres més altes: de 243 a 439 µs en repòs, de 80 a 118 a 10 i de 26 a 49 a 0 i
cap camí no va tenir excessos amb cap retenció.

## Què en surt

- **La retenció a 10 µs retalla de tres a cinc vegades el final del cicle en tots els camins i l'avantatge de mod-host
  desapareix.** Sense retenció, mod-host i plugin-hostd acaben els cicles a 224 o 235 µs, on omx-clap-host i el nivell dins
  del procés en triguen de 324 a 392. A 10, tots els camins són entre 72 i 103 µs; a 0, entre 26 i 43. L'avantatge de
  mod-host en repòs eren els nuclis que els seus clients de més mantenien desperts; quan cap nucli no dorm més enllà de C1,
  els amfitrions són iguals per a un conjunt de plugins. Les dues files CLAP queden uns 30 µs per sobre de les LV2 amb
  qualsevol retenció: és el cost propi dels camins CLAP, no un efecte del repòs.
- **Els excessos se'n van amb ella**: de 14 a 39 cada 30 s sense retenció a 96 kHz, 0 o 1 a 10.
- **10 µs costa d'un a quatre watts; 0 en costa seixanta.** A 96 kHz, la retenció a 10 marca d'1,2 a 2,2 W més que en repòs
  a la majoria de camins; a 48 kHz, d'1,6 a 3,7 W més, perquè els nuclis tenen el doble de temps per dormir entre cicles. La
  retenció a 0 refusa fins i tot C1, de manera que cada fil fa espera activa entre cicles: de 58 a 64 W més, quatre vegades
  la potència del paquet, per 45 a 60 µs més de final del cicle. Per això 10 µs és el valor per defecte i 0 només una tria
  explícita.
- **La CPU de l'amfitrió és temps de rellotge**, de manera que baixa quan els cicles s'escurcen; no és que l'amfitrió
  treballi menys.
- **La memòria no es mou amb la retenció.** Entre camins: LV2 dins del procés 25 MiB, l'adaptador 29, mod-host i les files
  CLAP de 41 a 43, plugin-hostd 91 (el dimoni i el seu worker), jalv 109 per a vuit processos.

## Per plugin

El temps propi del node per cicle (el plugin més el que fa el seu amfitrió dins del cicle del node), 96 kHz, 128 mostres,
mediana de tres repeticions, µs, retenció off / 10 / 0:

| plugin | mod-host | omx-clap-host CLAP | adaptador | CLAP dins del procés | LV2 dins del procés | plugin-hostd | jalv |
|---|---|---|---|---|---|---|---|
| omx-comp | 3,8 / 2,7 / 2,4 | 4,6 / 5,4 / 2,7 | 3,1 / 4,1 / 2,4 | 3,9 / 3,5 / 3,5 | 3,3 / 3,3 / 3,2 | 5,5 / 5,6 / 2,6 | 2,6 / 2,4 / 2,2 |
| omx-delay | 2,2 / 1,2 / 0,9 | 2,8 / 1,3 / 0,8 | 3,4 / 1,5 / 0,9 | 5,0 / 3,7 / 1,6 | 5,6 / 3,9 / 1,8 | 3,1 / 2,3 / 1,0 | 4,0 / 2,0 / 0,8 |
| omx-deesser | 4,6 / 5,7 / 3,3 | 6,1 / 6,7 / 3,6 | 5,5 / 5,8 / 3,4 | 8,2 / 8,2 / 3,9 | 7,6 / 7,6 / 3,4 | 6,1 / 6,2 / 3,4 | 5,5 / 5,7 / 3,2 |
| omx-eq8 | 1,7 / 1,2 / 0,6 | 1,9 / 1,1 / 0,5 | 2,4 / 1,5 / 0,6 | 4,6 / 2,7 / 1,5 | 5,4 / 3,1 / 1,4 | 2,5 / 2,0 / 0,7 | 2,3 / 1,4 / 0,5 |
| omx-reverb | 5,8 / 7,7 / 3,7 | 5,7 / 7,3 / 3,2 | 6,3 / 7,7 / 3,5 | 8,2 / 8,5 / 4,5 | 8,5 / 8,8 / 4,0 | 8,0 / 8,6 / 3,9 | 6,5 / 7,0 / 3,2 |
| ZamCompX2 | 3,8 / 4,6 / 2,4 | | 4,4 / 5,0 / 2,5 | | 6,7 / 6,6 / 3,1 | 5,2 / 5,5 / 2,7 | 4,1 / 4,6 / 2,4 |
| caps PlateX2 | 5,7 / 9,4 / 4,4 | | 6,2 / 9,7 / 4,3 | | 8,8 / 11,2 / 5,2 | 7,1 / 9,8 / 4,6 | 6,0 / 8,8 / 4,3 |
| caps CompressX2 | 9,8 / 16,8 / 8,5 | | 10,2 / 16,8 / 8,6 | | 12,8 / 19,0 / 9,7 | 11,6 / 17,4 / 7,9 | 10,0 / 16,7 / 8,4 |
| compressor LSP | | 5,7 / 4,8 / 2,0 | | 8,3 / 6,0 / 2,8 | | | |
| Dragonfly Room | | 28,0 / 49,6 / 25,0 | | 31,5 / 51,1 / 26,7 | | | |

- **Entre amfitrions, amb una mateixa retenció, un plugin costa el mateix amb una diferència d'un o dos microsegons.** Les
  files dins del procés marquen d'un a tres microsegons més en els plugins lleugers: les proteccions per bloc que aplica el
  nivell dins del procés (una limitació i una revisió de valors no finits), que els amfitrions per sòcol no apliquen.
- **L'efecte de la retenció per node no és monòton.** De repòs a 10, els plugins lleugers van més de pressa però els pesants
  més a poc a poc, en tots els amfitrions igual: un compressor passa d'uns 10 a 17 µs, una reverb de 28 a 50. A 0 tot és més
  ràpid. Tot el graf continua guanyant a 10, perquè la sortida de l'estat de repòs que elimina és de centenars de
  microsegons.

Es van fer dues comprovacions per a aquest alentiment i cap no l'explica. La col·locació als nuclis: els fils de temps real
de l'amfitrió eren en nuclis de rendiment el 65 % del temps en repòs, el 77 % a 10 i el 61 % a 0, de manera que la retenció
més lenta és la que tenia més temps en nuclis de rendiment. Els rellotges: la part no nuclear es va mantenir al seu màxim
amb totes les retencions i els nuclis marcaven de 3,8 a 4,6 GHz en repòs i a 10. Per tant, una reverb o un compressor amb
anticipació corren més a poc a poc per cicle amb tots els nuclis aturats a C1, en tots els amfitrions i aquesta execució no
diu per què. El guany de tot el graf hi és per sobre en un ordre de magnitud.

## jalv, com Zynthian fa córrer una capa

Un procés `jalv -i` per plugin, vuit processos, la versió LV2 del mateix conjunt:

- **Vuit processos costen el mateix cicle que un.** Amb la retenció a 10, jalv acaba el cicle a 72 µs contra 72 a 74 de
  mod-host i de l'adaptador en un sol procés; a 0, 26 contra 26 o 27.
- **Costen memòria i una mica de potència**: 109 MiB per a vuit processos jalv contra 29 a 41 per a un sol procés amb els
  mateixos plugins.
- **Els cicles de la sonda de jalv arriben tard més sovint** amb totes les retencions, tot i que els seus temps de node per
  plugin són els de tothom.
- **La GUI d'un plugin mostrada en un servidor X virtual no canvia gens el cicle** i costa 94 MiB i prop d'un watt.

## Advertiments

Una màquina, un conjunt de plugins, finestres de 30 s, tres repeticions. Les files dins del procés són el petit amfitrió
propi del banc de proves fent les mateixes crides de biblioteca que el nivell de la consola, no la consola mateixa.
