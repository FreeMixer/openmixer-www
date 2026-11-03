---
title: "Un sol client JACK per a una cadena: què estalvia i què no"
summary: Fer córrer N plugins en sèrie dins d'un sol client JACK, en lloc de N clients enllaçats en sèrie, és idèntic bit a bit i retalla entre un 30 i un 56 % el temps final del cicle a la mediana i un terç o més la CPU de l'amfitrió, sense cap xrun i sense empitjorar la cua; l'estalvi són els despertars, no els plugins.
measured: Un contenidor Fedora 44 de 4 CPU en una màquina compartida, PipeWire 1.6.9 amb el controlador fictici, 48 i 96 kHz a 64 i 128 mostres, octubre del 2026; omx-plugins 0.12.0 i plugins LV2 i CLAP de sèrie.
topic: core
order: 130
---

## La pregunta

omx-clap-host dona a cada plugin el seu propi client JACK i cada client és un node del graf amb el seu propi despertar a
cada cicle. La pregunta era si N plugins en sèrie en un sol client són idèntics bit a bit als mateixos N plugins en N
clients enllaçats en sèrie i si les xifres del banc de proves milloren sense que res empitjori. És la mesura que hi ha
darrere de la cadena de la biblioteca de l'amfitrió (vegeu la [nota de les cadenes](/ca/notes/chains-plugins-in-series-in-one-worker)
per a com la fa servir plugin-hostd).

## Com corre la cadena

- El cap és una instància amb el seu propi client, ports i crida de procés. Els membres no obren cap client ni registren cap
  port: els seus cicles corren dins dels del cap.
- Un membre només s'accepta quan les seves entrades principals són tan amples com les sortides del membre anterior i les
  seves sortides principals tan amples com les del cap. Un plugin amb entrada o sortida de notes no s'accepta com a membre.
  Les entrades auxiliars d'un membre llegeixen silenci.
- La crida de procés del cap fa córrer el cap i després cada membre en ordre, cadascun dins de la seva pròpia porta de
  cicle, passant cada búfer de sortida al següent; l'últim membre escriu els ports de sortida del cap. Entremig, les sortides
  són blocs alineats a 64 bytes que guarda l'amfitrió.
- El fil d'àudio de cada membre és el del cap; la mida de bloc i el transport segueixen els del cap.
- Els ports del cap informen de la suma de la latència de cada membre a més de la seva, que es torna a calcular quan canvia la
  latència d'un membre.
- El bypass, els paràmetres, els vúmetres, les empremtes, els presets i l'estat continuen sent per instància, pel número del
  mateix membre.
- Treure un membre el desenllaça dins d'una porta pròpia de la cadena, entre cicles; treure el cap allibera tots els membres.

## Identitat bit a bit

Un amfitrió amb els plugins en N clients en sèrie, un amb els plugins en una cadena, tots dos alimentats amb el mateix
soroll determinista i enregistrats dels mateixos cicles, esquerra i dreta: cada parell es compara mostra a mostra i es
compara la latència que declara la darrera sortida de cada branca. Una passada de control fa córrer primer dues branques de
N clients l'una contra l'altra, de manera que un plugin que no és determinista entre dues instàncies d'ell mateix es veu
allà, no com una diferència de la cadena. 48 kHz, quàntum 1024, 96 000 mostres per banda:

| plugins | format | empremtes | control (sèrie contra sèrie) | cadena contra sèrie | latència sèrie / cadena |
|---|---|---|---|---|---|
| una peça de prova: pas directe, cadena lateral, pas directe | CLAP | no | idèntic | idèntic | 192 / 192 |
| omx-eq8, omx-comp, omx-deesser, omx-delay | CLAP | no | idèntic | idèntic | 0 / 0 |
| omx comp, delay, deesser, eq8, reverb i un compressor LSP (6) | CLAP | no | idèntic | idèntic | 0 / 0 |
| els 6 i Dragonfly Room (7) | CLAP | no | difereix a la mostra 0, -29,1 dB | difereix a la mostra 0, -31,0 dB | 0 / 0 |
| omx comp, delay, deesser, eq8, reverb, ZamCompX2, caps CompressX2 (7) | LV2 | sí | idèntic | idèntic | 0 / 0 |
| els 7 i caps PlateX2 (8) | LV2 | sí | difereix a la mostra 0, -24,5 dB | difereix a la mostra 0, -26,8 dB | 0 / 0 |

- Les dues reverbs, Dragonfly Room i caps PlateX2, no són deterministes entre dues instàncies d'elles mateixes (dues branques
  d'un client per plugin difereixen a uns -30 dB), de manera que amb qualsevol de les dues al conjunt cap branca no es pot
  jutjar mostra a mostra: la diferència de la cadena és de la mida de la del control. Tots els altres plugins de la taula són
  idèntics bit a bit a través de la cadena.
- El compressor arrodonia de tant en tant a un ulp de distància (-142 dB) entre dues instàncies, amb cadena o sense; amb els
  blocs alineats a 64 bytes, la cadena era idèntica.
- La latència que declara la cadena és la suma dels membres: tres passos directes de 64 mostres declaren 192.
- Amb sabotatge, la prova surt vermella: si se salten els membres, la sortida difereix a la mostra 0 i si es treu la suma de
  latències, la cadena declara 64 contra 192.

## Una cadena de plugins LV2 necessita un món unió

plugin-hostd redueix l'`LV2_PATH` d'un worker al paquet del mateix plugin i un plugin LV2 es troba en aquest camí quan
s'afegeix. Els membres d'una cadena s'afegeixen al procés del cap, amb l'`LV2_PATH` del cap: en un món només amb el paquet
del primer plugin, el segon membre respon `resp -101` (no trobat). Per tant, una cadena de plugins LV2 necessita que
l'`LV2_PATH` del seu worker sigui la unió dels paquets dels seus membres i res més ample. Les empremtes no necessiten res de
nou: l'addició de cada membre comprova la seva pròpia disposició i amb les empremtes activades, cada membre de les cadenes
LV2 de 7 i 8 plugins va refusar una empremta equivocada i va acceptar la bona; la cadena amb empremtes era idèntica bit a bit
a la sèrie amb empremtes.

## El banc de proves

Les branques s'intercalaven dins de cada repetició, tres repeticions de 30 s, medianes; sèrie / cadena, canvi = (cadena -
sèrie) / sèrie. El contenidor compartia la màquina (càrrega mitjana d'uns 3 en 4 fils) i aquesta càrrega va caure igual a
les dues branques.

| freqüència | quàntum | plugins | final del cicle p50 µs | canvi | final del cicle p99 µs | canvi | excessos | CPU de l'amfitrió % | RSS MiB |
|---|---|---|---|---|---|---|---|---|---|
| 96000 | 64 | 7 CLAP | 336,8 / 187,6 | -44,3 % | 776,0 / 570,5 | -26,5 % | 7390 / 241 | 20,8 / 12,4 | 42,4 / 34,7 |
| 96000 | 128 | 7 CLAP | 461,3 / 261,1 | -43,4 % | 1256,7 / 693,7 | -44,8 % | 172 / 71 | 16,6 / 10,0 | 42,5 / 34,4 |
| 48000 | 64 | 7 CLAP | 452,7 / 257,1 | -43,2 % | 1181,8 / 679,2 | -42,5 % | 113 / 86 | 14,6 / 8,6 | 41,9 / 33,9 |
| 48000 | 128 | 7 CLAP | 687,4 / 345,5 | -49,7 % | 1557,3 / 857,5 | -44,9 % | 23 / 4 | 11,7 / 7,8 | 42,0 / 34,3 |
| 96000 | 64 | 8 LV2 | 391,2 / 171,1 | -56,3 % | 799,7 / 545,3 | -31,8 % | 9222 / 98 | 22,1 / 10,4 | 29,4 / 20,2 |
| 96000 | 128 | 8 LV2 | 491,4 / 223,0 | -54,6 % | 1204,4 / 649,1 | -46,1 % | 102 / 18 | 16,4 / 9,6 | 29,4 / 20,2 |
| 48000 | 64 | 8 LV2 | 457,7 / 217,6 | -52,5 % | 1146,0 / 631,5 | -44,9 % | 44 / 14 | 14,1 / 8,0 | 29,2 / 19,9 |
| 48000 | 128 | 8 LV2 | 583,3 / 282,5 | -51,6 % | 1402,0 / 721,6 | -48,5 % | 8 / 3 | 8,1 / 5,3 | 29,3 / 20,1 |

Amb quatre plugins (omx-eq8, omx-comp, omx-deesser, omx-delay, CLAP):

| freqüència | quàntum | final del cicle p50 µs | canvi | final del cicle p99 µs | canvi | excessos | CPU de l'amfitrió % | RSS MiB |
|---|---|---|---|---|---|---|---|---|
| 96000 | 64 | 239,2 / 166,1 | -30,6 % | 685,6 / 541,5 | -21,0 % | 1175 / 98 | 11,8 / 7,9 | 15,8 / 12,1 |
| 96000 | 128 | 272,9 / 173,4 | -36,5 % | 852,7 / 599,8 | -29,7 % | 17 / 9 | 7,4 / 4,5 | 15,6 / 12,2 |
| 48000 | 64 | 262,9 / 184,0 | -30,0 % | 860,0 / 605,0 | -29,6 % | 11 / 12 | 7,4 / 3,8 | 15,6 / 12,1 |
| 48000 | 128 | 444,2 / 273,4 | -38,5 % | 1019,0 / 678,2 | -33,4 % | 4 / 5 | 5,7 / 3,6 | 15,6 / 12,2 |

- El final del cicle baixa entre un 30 i un 56 % a la mediana i entre un 21 i un 49 % al percentil 99; repetició a repetició,
  la pitjor de la cadena és per sota de la millor de la sèrie en totes les files.
- Cap xrun en cap execució de cap branca. Els excessos baixen en deu files de dotze; en dues files de quatre plugins la
  mediana de la cadena té un excés més (12 contra 11, 5 contra 4, d'uns 22 500 i 11 250 cicles), dins de la dispersió de les
  repeticions.
- L'únic node de la cadena espera el seu despertar tant com el primer node de la sèrie o més i després fa córrer tota la
  sèrie sense cap altre despertar: aquí és on hi ha l'estalvi.
- La CPU de l'amfitrió baixa un terç o més i la seva memòria entre 4 i 9 MiB: N-1 clients JACK menys, amb els seus fils i
  búfers.

## El que no s'ha mesurat

El contenidor no tenia `/dev/cpu_dma_latency`, de manera que no hi havia cap retenció dels estats de repòs de la CPU (vegeu
[Estats de repòs de la CPU i allotjament de plugins](/ca/notes/cpu-idle-states-and-plugin-hosting)) i el seu límit de temps
real era 0, de manera que els fils de PipeWire corrien amb `SCHED_OTHER`: les xifres són més grans i amb més soroll que les
d'un graf en temps real, igual per a les dues branques. Si una part de l'estalvi és la sortida de l'estat de repòs queda
obert fins que el mateix banc de proves corri en una màquina amb el dispositiu, a cada nivell de retenció.
