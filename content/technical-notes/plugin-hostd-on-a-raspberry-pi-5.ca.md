---
title: "plugin-hostd en una Raspberry Pi 5: què s'ha mesurat i com"
summary: En una Raspberry Pi 5 amb Zynthian, una cadena de plugin-hostd té la càrrega DSP més baixa dels tres amfitrions mesurats i fa servir entre un 41 i un 49 % menys de memòria que mod-host; a partir de quatre plugins també és la més ràpida d'ampliar. Aquesta nota en dona l'aparell, el mètode i totes les taules.
measured: Raspberry Pi 5 (4 GB) amb ZynthianOS Vangelis, 2 de novembre del 2026; plugin-hostd 0.15.9, omx-clap-core 0.26.4, plugin-qualify 0.18.5, omx-plugins 0.17.0, el mod-host de sèrie de Zynthian.
topic: zynthian
order: 80
---

Les xifres d'aquestes execucions també són a la [pàgina de bancs de proves](/ca/benchmarks), fila per fila.

## L'aparell i el mètode

- Una Raspberry Pi 5 (Cortex-A76, 4 nuclis, 4 GB) amb ZynthianOS Vangelis (Debian 13, arm64), nucli 6.18 (sense
  PREEMPT_RT), amb els paquets que instal·la un Zynthian des del canal d'OpenMixer.
- Cada execució ha fet servir un servidor JACK privat amb el controlador fictici, a 48000 Hz i 256 mostres, amb el
  governador de la CPU a `performance`. La càrrega DSP, els xruns i la latència són els del controlador fictici: tot s'ha
  llegit digitalment als ports de JACK i res d'això no afirma res sobre l'àudio analògic.
- Cada fila és la mediana de tres repeticions; DSP és la càrrega DSP de JACK, PSS la memòria proporcional dels processos de
  l'amfitrió (que reparteix les biblioteques i per tant és la memòria que gasta de debò l'aparell).
- El dimoni s'ha mesurat directament, no a través del motor de Zynthian. Les files de mod-host són el binari del mateix
  Zynthian, engegat en un port privat; cap fila no mesura MOD-UI ni el servei mod-host de l'aparell.

Els amfitrions:

| mode | què corre |
|---|---|
| plugin-hostd, afegit a una sola cadena | el dimoni i un worker per a tota la cadena, un client JACK |
| plugin-hostd, cadena feta després de les addicions | cada plugin afegit en un worker propi i després es declara la cadena |
| plugin-hostd, un worker per plugin | el dimoni i un worker per plugin, un client JACK cadascun |
| omx-clap-host, un procés | un procés omx-clap-host per a tots els plugins |
| mod-host | un procés mod-host per a tots els plugins, un client JACK cadascun |

Els conjunts de plugins: 24 plugins en sèrie (omx comp, delay i drive alternats i Calf Compressor), en les seves versions
CLAP on un amfitrió pot fer córrer CLAP o en les seves versions LV2 a tots els amfitrions; i deu efectes LV2 de tercers en
sèrie, tots qualificats d'aptes per als tres amfitrions i nets en temps real a la qualificació.

## Els tres amfitrions

0 xruns en cada repetició de cada fila. Càrrega DSP / PSS:

| escenari | plugin-hostd, afegit a una sola cadena | omx-clap-host, un procés | mod-host |
|---|---|---|---|
| 24 plugins, versions CLAP (Calf LV2; mod-host fa córrer les versions LV2) | 12,51 % / 64,1 MB | 15,31 % / 64,6 MB | 15,02 % / 109,4 MB |
| els mateixos 24, versions LV2 a tots els amfitrions | 12,73 % / 63,3 MB | 16,40 % / 63,9 MB | 15,43 % / 109,4 MB |
| deu plugins LV2 de tercers | 5,64 % / 45,2 MB | 6,87 % / 44,1 MB | 6,58 % / 89,5 MB |

La cadena de plugin-hostd té la càrrega DSP més baixa dels tres en cada escenari i en cada repetició (la seva repetició més
alta, 12,55 %, és per sota de la més baixa de mod-host, 14,88 %) i fa servir entre un 41 i un 49 % menys de memòria que
mod-host, com omx-clap-host. Un sol client JACK fa córrer tota la cadena, on mod-host posa al graf un client per plugin.

Els altres modes de plugin-hostd:

| escenari | cadena feta després de les addicions | un worker per plugin |
|---|---|---|
| 24 plugins, versions CLAP | 12,48 % / 65,8 MB | 17,76 % / 183,1 MB |
| els mateixos 24, versions LV2 | 12,74 % / 64,3 MB | 18,78 % / 189,6 MB |
| deu plugins LV2 de tercers | 5,50 % / 45,8 MB | 7,25 % / 111,2 MB |

Un worker per plugin és el mode car: 24 processos i 24 clients JACK i les úniques files amb xruns (una repetició de 24
plugins amb 21). No és el valor per defecte.

## Temps d'addició

En fred: s'engega l'amfitrió i s'hi afegeixen tots els plugins del conjunt, fins que corre l'últim; la mediana de tres.
mod-host explora tot el món LV2 (1336 plugins en aquest aparell) abans de respondre i aquesta arrencada, de 800 a 945 ms,
forma part del seu temps.

| conjunt | plugin-hostd, a una cadena | plugin-hostd, un worker cadascun | omx-clap-host | mod-host |
|---|---|---|---|---|
| 24 plugins, versions LV2 | 549 ms | 1976 ms | 948 ms | 1459 ms |
| 24 plugins, versions CLAP (Calf LV2) | 440 ms | | 848 ms | |
| deu plugins LV2 de tercers | 255 ms | 497 ms | 458 ms | 1044 ms |

En calent: cadenes de 2, 4 i 7 d'omx comp, delay i drive, versions LV2, amb l'amfitrió ja en marxa.

| plugins | mod-host | plugin-hostd, a una cadena | omx-clap-host | plugin-hostd, un worker cadascun |
|---|---|---|---|---|
| 2 | 44,8 ms | 55,9 ms | 72,4 ms | 79,5 ms |
| 4 | 98 ms | 73 ms | 137 ms | 154 ms |
| 7 | 189 ms | 96 ms | 234 ms | 272 ms |

mod-host és el més ràpid per afegir dos plugins a un amfitrió en marxa; a partir de quatre, ho és la cadena. Un worker propi
costa uns 40 ms per plugin: el procés i el seu client JACK.

## Instruments

Una instància amb 1, 8 i 16 notes premudes; càrrega DSP i PSS:

| instrument | plugin-hostd | mod-host |
|---|---|---|
| mda Piano | 0,6 / 2,0 / 3,5 %, 29 MB | 0,6 / 2,0 / 3,5 %, 72 MB |
| Odin 2 | 3,6 / 11,8 / 21,3 %, 89 MB | 3,8 / 11,7 / 21,0 %, 132 MB |
| Surge XT (CLAP a plugin-hostd, LV2 a mod-host) | 1,8 / 4,2 / 6,9 %, 68 MB | 2,0 / 4,1 / 6,9 %, 112 MB |

La mateixa càrrega DSP als dos amfitrions i entre 43 i 44 MB menys de memòria a plugin-hostd. ZynAddSubFX i sfizz corren com
a programes JACK propis, com els fa córrer Zynthian, sense cap dels dos amfitrions: ZynAddSubFX amb Analog Pad 1 a 0,6 / 1,6
/ 2,6 %, 90 MB; sfizz amb el piano Salamander a 0,9 / 2,9 / 5,1 %, de 86 a 119 MB. Cap dels cinc no ofereix un grup de fils.
Una repetició d'Odin 2 a plugin-hostd amb una nota va tenir un xrun. Com fan servir els nuclis els instruments és a
[Instruments en una Pi 5](/ca/notes/instruments-on-a-pi-5).

## On se'n va el temps de la cadena

perf sobre el fil d'àudio del worker, 24 plugins en una sola cadena, mesurat amb versions que porten símbols: els plugins i
libm se'n queden entre el 88 i el 92 %. El codi del mateix amfitrió en pren entre un 4 i un 7 %: les còpies de l'adaptador
LV2 (1,9 % quan tots els plugins són LV2), les còpies a l'entrada i la sortida de la cadena (prop de l'1 %), la feina de
control i d'esdeveniments de l'adaptador (prop de l'1 % en LV2) i les proteccions de l'etapa amb la limitació (prop del 0,5
%). El nucli del sistema i libjack en prenen el 0,5 %, on mod-host, amb la mateixa cadena, hi passa entre el 10 i el 14 %
de les seves mostres, repartides entre els seus 24 clients JACK. El símbol més pesant és `tanhf` a omx-drive, del 14 al 15
%.

## Moltes cadenes alhora

Una prova de càrrega anterior, amb plugin-hostd 0.13.1 i el servidor JACK del mateix aparell a 48000 Hz i 256 mostres, va
mantenir cadenes de quatre plugins LV2 amb 1, 2, 4, 8 i 16 cadenes, 60 s cada nivell. Amb 16 cadenes, els processos
amfitrions feien servir el 70,6 % d'un nucli agrupats (un worker per cadena, 60 plugins), el 100,8 % sols (un worker per
plugin) i el 82,3 % amb jalv (64 plugins); la PSS era de 224,2, 359,3 i 2745,6 MB. Agrupats i sols van arribar a 16 cadenes
sense cap límit; jalv s'hi va aturar per memòria, amb 2 xruns.

## Qualificació a l'aparell

Amb el paquet de registres de qualificació omx-qualification-rpi5-zynthian-vangelis 2026110101: 1602 plugins (1341 LV2, 261 CLAP); 1079 qualificats
dins del procés i 306 aïllats; 93 han fallat, 46 s'han penjat i 13 s'han refusat; 27 sense mesura, cadascun amb el seu motiu.
Tots els paquets s'instal·len des del canal i `dpkg -V` no hi troba res canviat; cadascun dels cinc instruments d'abans sona
amb les seves notes.

## El que encara no s'ha mesurat

- L'àudio a través d'una cadena en un Zynthian amb una interfície d'àudio i la latència mesurada en àudio per a cada
  amfitrió: totes dues coses necessiten un bucle de retorn a través de la interfície.
- El cost per bloc de cada plugin al quàntum del mateix Zynthian (128 i 256 mostres): la sonda de qualificació només
  cronometra blocs de 512 mostres.
- L'estimació de cost que un editor de cadenes demanaria al dimoni abans d'inserir un plugin.
