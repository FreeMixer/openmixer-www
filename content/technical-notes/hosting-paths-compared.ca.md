---
title: "Camins d'allotjament comparats: mod-host, omx-clap-host, l'adaptador LV2 i dins del procés"
summary: Els mateixos plugins costen el mateix per plugin en tots els camins d'allotjament, amb un microsegon de diferència i cap camí no afegeix latència. Les diferències a tot el graf vénen dels estats de repòs de la CPU i del nombre de nodes, no de com un amfitrió fa córrer un plugin; el que separa els camins és la memòria, l'arrencada i el que s'emporta una fallada.
measured: Una màquina de compilació Intel Core Ultra 9 285K compartida amb altres feines, Fedora 44, nucli 7.2, PipeWire 1.6.9 amb el controlador fictici, 48 i 96 kHz de 64 a 512 mostres, tres execucions de 60 s, octubre del 2026; omx-plugins 0.7.0 i plugins LV2 i CLAP de sèrie.
topic: core
order: 140
---

## Els camins

| camí | què fa córrer el plugin |
|---|---|
| mod-host | mod-host 0.10.6 (el paquet de la distribució), la versió LV2, un client JACK per plugin |
| omx-clap-host | la versió CLAP, un client JACK per plugin |
| l'adaptador | el mateix omx-clap-host, la versió LV2 a través de libomx-clap-lv2 |
| CLAP dins del procés | la versió CLAP dins de la crida de procés d'un filtre PipeWire natiu, a través de libomx-clap-core |
| LV2 dins del procés | la versió LV2 de la mateixa manera, oberta a través de libomx-clap-lv2 |

Aleshores omx-clap-host no podia carregar tot sol un plugin LV2, de manera que el camí de l'adaptador carregava els plugins
LV2 a través d'un `.clap` fet només per al banc de proves que enllaça libomx-clap-lv2: mesura el codi de l'adaptador dins
d'un omx-clap-host sense modificar. Els camins dins del procés fan les crides que fa el nivell dins del procés de la consola
(obrir, activar, publicar, fer córrer al fil de dades de PipeWire, amb la limitació, la revisió de valors no finits i
l'escalfament del nucli activats), però donen a cada plugin un node de filtre propi, on la consola fa córrer els plugins
d'un carril en línia dins del seu node. Se'n donen dues xifres: el temps del node, comparable amb el dels nodes dels altres
camins i el temps en línia, només la crida de procés, que és el que un plugin afegeix al cicle d'una consola.

Els plugins: comp, delay, deesser, eq8 i reverb d'omx-plugins en totes dues versions; un compressor estèreo LSP i Dragonfly
Room com a CLAP; ZamCompX2, caps PlateX2 i caps CompressX2 com a LV2. Per tant, els camins CLAP fan córrer set plugins i els
LV2 vuit i la comparació entre formats és la dels cinc bessons omx. Tots els plugins d'un camí es munten en un sol
amfitrió, cadascun alimentat amb el mateix soroll blanc estèreo a -20 dBFS i enregistrat; un pas porta un impuls unitari
quatre vegades per segon, contra un enllaç directe que porta el mateix impuls.

## Què s'ha mesurat

- **Temps de node per cicle**: el temps d'actiu a acabat de pw-profiler per al node de cada plugin, cada cicle de la
  finestra: el plugin més el que hi fa el seu amfitrió al voltant.
- **Temps en línia** (només dins del procés): la crida de procés cronometrada al fil de dades.
- **Final del cicle**: el temps del controlador des del despertar fins que acaba l'últim node.
- **Excessos**: cicles que acaben passat el seu període; **tardans**: cicles de la sonda que arriben més d'1,5 períodes
  després de l'anterior.
- **Latència afegida**: l'impuls a través del pas contra l'enllaç directe, en mostres.
- **Memòria**: la memòria resident de l'amfitrió, buit i amb tots els plugins muntats.
- **Arrencada**: de llançar l'amfitrió a tenir-lo a punt; d'`add` a la seva resposta; d'`add` al primer so a l'enregistrador.
- **Fallada**: l'amfitrió mort mentre fa córrer un plugin i després reiniciat; i als camins CLAP, un plugin de prova que
  avorta al costat d'un de sa al mateix amfitrió.

## Tot el graf

Mediana de tres execucions de 60 s. mod-host, l'adaptador i LV2 dins del procés fan córrer els mateixos vuit plugins;
omx-clap-host i CLAP dins del procés els mateixos set.

| freqüència | quàntum | camí | plugins | final del cicle p50 µs | final del cicle p99 µs | excessos | CPU de l'amfitrió % | RSS MiB |
|---|---|---|---|---|---|---|---|---|
| 48000 | 128 | mod-host | 8 | 250,2 | 719,4 | 3 | 8,2 | 40,0 |
| 48000 | 128 | omx-clap-host | 7 | 287,5 | 759,9 | 5 | 9,1 | 40,1 |
| 48000 | 128 | adaptador | 8 | 293,3 | 772,7 | 3 | 10,0 | 26,5 |
| 48000 | 128 | CLAP dins del procés | 7 | 337,5 | 788,5 | 2 | 8,5 | 38,3 |
| 48000 | 128 | LV2 dins del procés | 8 | 265,5 | 692,5 | 4 | 7,9 | 22,8 |
| 96000 | 128 | mod-host | 8 | 275,4 | 748,1 | 20 | 23,7 | 40,4 |
| 96000 | 128 | omx-clap-host | 7 | 447,0 | 926,9 | 230 | 32,4 | 40,3 |
| 96000 | 128 | adaptador | 8 | 403,0 | 844,6 | 17 | 31,4 | 26,7 |
| 96000 | 128 | CLAP dins del procés | 7 | 446,2 | 915,4 | 109 | 35,4 | 38,8 |
| 96000 | 128 | LV2 dins del procés | 8 | 436,9 | 863,4 | 18 | 33,5 | 22,9 |

A 96 kHz i 64 mostres tots els camins van tenir excessos en aquesta màquina amb aquests conjunts (98 mod-host, de 310 a 332
l'adaptador i LV2 dins del procés); els excessos del conjunt CLAP a 96 kHz i 128 mostres segueixen els màxims de la reverb,
d'1,3 a 1,5 ms contra un període d'1,33 ms.

## Per plugin

El temps propi del node per cicle, p50 / p99 / màxim, µs, 48 kHz i 128 mostres; dins del procés, el temps en línia:

| plugin | mod-host | omx-clap-host | adaptador | CLAP dins del procés, en línia | LV2 dins del procés, en línia |
|---|---|---|---|---|---|
| omx-comp | 3,6 / 19,5 / 46 | 4,3 / 29,3 / 63 | 5,1 / 17,9 / 52 | 3,5 / 15,7 / 44 | 4,2 / 16,9 / 59 |
| omx-delay | 2,1 / 9,2 / 25 | 2,1 / 10,8 / 44 | 2,9 / 13,6 / 37 | 2,0 / 9,3 / 52 | 2,5 / 10,4 / 49 |
| omx-deesser | 4,5 / 22,9 / 53 | 4,5 / 25,9 / 54 | 5,1 / 29,5 / 59 | 4,5 / 22,6 / 46 | 5,0 / 20,9 / 51 |
| omx-eq8 | 2,1 / 10,1 / 23 | 1,9 / 8,8 / 34 | 2,6 / 12,1 / 38 | 1,8 / 8,1 / 24 | 2,2 / 9,9 / 23 |
| omx-reverb | 5,7 / 28,9 / 59 | 5,9 / 24,4 / 55 | 6,7 / 32,6 / 67 | 5,5 / 23,6 / 69 | 6,5 / 23,9 / 68 |
| ZamCompX2 | 3,9 / 20,2 / 46 | | 4,4 / 22,2 / 56 | | 3,9 / 17,1 / 46 |
| caps PlateX2 | 5,7 / 29,1 / 61 | | 6,3 / 26,6 / 93 | | 5,8 / 23,4 / 68 |
| caps CompressX2 | 9,8 / 57,3 / 118 | | 10,3 / 58,0 / 119 | | 9,9 / 54,8 / 115 |
| compressor LSP | | 6,6 / 28,5 / 67 | | 6,5 / 25,8 / 71 | |
| Dragonfly Room | | 28,4 / 140,0 / 1462 | | 27,9 / 128,4 / 1448 | |

## Arrencada i memòria

| camí | p50 de node µs (tots els plugins i configuracions) | p50 en línia µs | `add` ms | d'`add` al primer so ms | amfitrió a punt ms | RSS buit MiB | RSS per plugin MiB |
|---|---|---|---|---|---|---|---|
| mod-host | 7,3 | | 4,2 | 68,6 | 24,4 | 19,4 | 2,31 |
| omx-clap-host | 8,3 | | 4,5 | 68,2 | 13,5 | 5,8 | 4,30 |
| adaptador | 7,5 | | 3,7 | 67,2 | 13,7 | 5,8 | 2,31 |
| CLAP dins del procés | 13,5 | 8,3 | 13,2 | 75,9 | 2,6 | 3,3 | 4,41 |
| LV2 dins del procés | 13,1 | 8,4 | 12,6 | 74,9 | 2,5 | 3,3 | 2,17 |

## Una fallada

A 48 kHz i 128 mostres, tres vegades per camí: un SIGKILL de l'amfitrió fa callar els seus plugins en 1 a 3 ms, el graf
continua fent cicles (cap cicle tardà; el buit més llarg de la sonda és de 3,0 a 4,4 ms contra un període de 2,67 ms) i un
amfitrió reiniciat torna a sonar de 70 a 100 ms després. Un plugin que avorta s'endú el seu amfitrió de 150 a 175 ms
després de l'escriptura que ho provoca (l'avortament i el seu bolcat de memòria) i amb ell tots els altres plugins
d'aquell amfitrió; el graf va sobreviure en tots dos camins CLAP. Dins del procés, el procés amfitrió és la consola: la
mateixa fallada allà vol dir l'àudio de la consola perdut fins que el motor es reinicia.

## Què diuen les xifres

- **Un plugin costa el mateix en tots els camins.** Per al mateix plugin a la mateixa freqüència i quàntum, la mediana del
  node a mod-host, omx-clap-host i l'adaptador són a prop d'1 µs les unes de les altres i del temps en línia dins del procés
  (omx-eq8: 2,1, 1,9, 2,6 i d'1,8 a 2,2 µs; caps CompressX2: 9,8, 10,3 i 9,9 µs). Les cues es mouen desenes de microsegons
  entre repeticions d'una mateixa configuració: és la màquina, no el camí.
- **El node dins del procés del banc de proves costa de 2 a 5 µs més que els altres nodes**, mentre que el seu temps en
  línia hi coincideix: el preu del filtre propi del banc de proves per plugin (quatre búfers de port, dues còpies) a més de
  l'etapa del nucli. Una consola que fa córrer el plugin en línia dins del seu carril paga la xifra en línia i cap node.
- **Cap camí no afegeix latència.** L'impuls a través del pas va arribar al mateix cicle en què va sortir en tots els camins,
  freqüències i quàntums, cada impuls de cada execució. Un client JACK en un graf PipeWire es planifica de manera síncrona
  dins del cicle, de manera que un plugin de mod-host no costa cap quàntum de més.
- **Memòria**: amb els mateixos vuit plugins, 40 MiB resident per a mod-host (19 MiB abans de cap plugin: carrega tot el
  món LV2), 26,5 MiB per a omx-clap-host amb l'adaptador, 22,8 MiB dins del procés. Uns 2,2 o 2,3 MiB per plugin LV2 en tots
  tres.
- **Arrencada**: un amfitrió és a punt en 2,5 ms dins del procés, 13,5 ms omx-clap-host, 24 ms mod-host.

## Què mesura la xifra de tot el graf

Amb els mateixos vuit plugins LV2, mod-host va tenir el final del cicle més baix en totes les configuracions, tot i que els
seus nodes costen el mateix que els dels altres. El mateix banc de proves a 96 kHz i 128 mostres, amb
`/dev/cpu_dma_latency` retingut per refusar els estats de repòs de la CPU, mostra per què. Final del cicle p50, µs, d'una a
tres execucions cadascun:

| estats de repòs | mod-host | adaptador | LV2 dins del procés |
|---|---|---|---|
| tots permesos (C1, C2, C3) | 265, 279 | 380, 400, 412 | 413 |
| `cpu_dma_latency` 1000 µs: C3 refusat | 243, 244 | 273, 333 | 248, 322 |
| `cpu_dma_latency` 10 µs: només C1 | 80 | 73 | 95 |
| `cpu_dma_latency` 0: cap | 26, 30 | 23, 31 | 24, 25 |

- **La major part de la xifra de tot el graf és la sortida dels estats de repòs.** Amb els estats de repòs permesos, la
  font de la sonda desperta els nou nodes de plugin a uns 10 µs l'un de l'altre els primers quatre o cinc i la resta de 60
  a 130 µs més tard: els seus nuclis eren a C2 o més avall. Sense cap estat permès es desperten a uns 1,1 µs l'un de
  l'altre i els camins són iguals.
- **L'avantatge de mod-host són els seus dos clients sempre en marxa.** A més d'un client per plugin, mod-host fa córrer
  el seu propi client `mod-host` i `mod-monitor`, que es desperten a cada cicle i mantenen més nuclis fora del repòs
  profund. Uns clients JACK desocupats afegits al camí de l'adaptador n'escurcen el cicle de la mateixa manera i amb sis a
  cada camí l'ordre desapareix.

Per tant, el que costa és el nombre de nodes, no l'amfitrió. Això és el que va portar a fer córrer una cadena en un sol
client JACK (vegeu [Un sol client JACK per a una cadena](/ca/notes/one-jack-client-for-a-chain)) i a la retenció dels estats
de repòs (vegeu [Estats de repòs de la CPU i allotjament de plugins](/ca/notes/cpu-idle-states-and-plugin-hosting)).

## Límits

La màquina era una màquina de compilació compartida amb una càrrega d'uns 3, amb el governador `powersave`, sense aïllament i
sense fixar fils: les cues i les xifres de tot el graf en porten el soroll. El graf corria amb el controlador fictici de
PipeWire en un contenidor; un controlador real es desperta d'una altra manera. Els plugins s'alimentaven amb soroll blanc; un
plugin el cost del qual depèn de l'entrada donaria una altra lectura amb material musical. Tres plugins LV2 de sèrie que
llavors l'adaptador refusava i un amb entrada MIDI, no són al conjunt LV2.

## Què en va sortir

Amb els plugins que tots els camins poden allotjar, els camins costen el mateix per plugin: mana el `process()` del mateix
plugin i l'embolcall de l'amfitrió hi afegeix un microsegon. Dins del procés només costa el temps en línia del plugin, però
una fallada allà s'endú l'àudio de la consola, mentre que fora del procés el graf continua viu i un reinici torna a sonar en
menys de 0,1 s. Per això el worker per defecte de plugin-hostd va passar a ser omx-clap-host, fora del procés, per als plugins
CLAP i, a través de l'adaptador, per als plugins LV2 que admet, amb mod-host per a la resta i dins del procés només per als
plugins que admet la qualificació.
