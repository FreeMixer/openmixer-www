---
title: "Instruments en una Pi 5: les veus de Surge XT als nuclis"
summary: Un instrument que calcula totes les veus en un sol nucli fixa la polifonia que pot tocar una Pi 5, per desocupats que estiguin els altres nuclis. Surge XT no divideix les veus en tasques, de manera que els nuclis que pot aprofitar venen de fer córrer cada instrument en un worker propi, repartits pels nuclis d'àudio.
measured: Raspberry Pi 5 (4 GB) amb ZynthianOS Vangelis, 48 kHz, 256 mostres, octubre del 2026; Surge XT 1.4.0, plugin-hostd 0.13.1 amb omx-clap-host 0.23.2 i jalv.
topic: zynthian
order: 90
---

## Per què les veus necessiten nuclis

Un Zynthian es toca. Quan un so de pad manté 16 notes, cadascuna amb els seus oscil·ladors, filtres i envolupants, cada veu
es calcula a cada bloc d'àudio i el bloc té un termini: 5,3 ms a 48 kHz i 256 mostres. Una Pi 5 té quatre nuclis. Si un
instrument calcula totes les veus en un sol nucli, aquell nucli fixa la polifonia que la Pi pot tocar abans del primer xrun,
per desocupats que estiguin els altres tres.

## Què hi pot fer un amfitrió CLAP

L'extensió de grup de fils de CLAP (`clap.thread-pool`) permet a un plugin dividir el seu bloc en tasques (una per veu o
per grup de veus) i demanar a l'amfitrió que les faci córrer (`request_exec`). L'amfitrió decideix on corren. omx-clap-core
les reparteix entre fils auxiliars de temps real, un per cada nucli que pot fer servir el worker, cadascun fixat al seu
nucli i aturat entre cicles; les tasques es reparteixen amb un sol índex atòmic que cada fil incrementa, el fil d'àudio en fa la seva part i
la crida torna quan s'acaba l'última tasca, sense cap reserva de memòria, bloqueig ni crida al sistema en aquest camí
(vegeu la [referència del grup de fils](/projects/omx-clap-core)).

El grup de fils no és un interruptor global. Es dona plugin a plugin, segons la seva qualificació: un plugin segur en temps
real que demana el grup rep fils auxiliars; un plugin amb violacions de temps real s'allotja aïllat, en un worker propi,
pel camí en sèrie. Una tasca que reserva memòria o es bloqueja en un fil auxiliar també endarreriria el termini dels altres
nuclis i per això la mesura que admet un plugin en un worker compartit és la mateixa que l'admet al grup de fils.

## Què hi fa Surge XT

Res. Surge XT 1.4.0 no ofereix `clap.thread-pool` i el seu codi no crida mai `request_exec`; cap dels 489 descriptors de
plugin de l'aparell no esmenta tampoc el grup de fils. Per tant, a la Pi, les veus de Surge XT corren en un sol nucli faci
el que faci l'amfitrió: un fil de l'amfitrió que va del 3 % d'un nucli amb una veu al 39 % amb 64 veus.

El que fa servir els nuclis per als instruments són workers separats. plugin-hostd fa córrer cada instrument (o cada cadena)
en un procés worker propi i JACK fa córrer en paral·lel els clients independents. Quatre instàncies de Surge XT en quatre
workers, cadascuna amb 16 notes, van córrer als quatre nuclis entre el 14 i el 15 % cadascuna, 64 veus en total, amb una
càrrega DSP de JACK del 17,6 %; una sola instància tocant 64 veus carregava JACK al 39,7 %. El paràmetre `placement` fa
que el repartiment sigui una decisió de l'amfitrió: workers repartits pels nuclis d'àudio, amb el dimoni fora d'aquests
nuclis.

El preu del repartiment és un procés per instrument; el que en treus són els altres tres nuclis per a tres instruments més.

## Què s'ha demostrat

Surge XT com a CLAP, tocat per plugin-hostd i com a LV2 per jalv, com el toca el camí de sèrie de Zynthian. Una sonda
d'instrument envia un escenari MIDI preparat a l'entrada de notes de l'instrument i en mesura les sortides finestra a
finestra: nivell de pic i RMS, to, brillantor i xruns de JACK. Cap finestra de cap execució no va tenir cap xrun.

| prova | plugin-hostd, Surge XT CLAP | jalv, Surge XT LV2 |
|---|---|---|
| sona | C4 a 261,4 Hz, pic de -13,5 dBFS | el mateix |
| velocitat | amb la sensibilitat a la velocitat activada, les velocitats 20, 64 i 127 donen -53,9, -37,3 i -13,5 dBFS | no s'ha configurat (jalv no pot fixar el paràmetre en arrencar) |
| polifonia | 1, 8, 16, 32, 48 i 64 notes premudes, totes sonant (límit pujat a 64) | d'1 a 32 amb el límit per defecte |
| robatori de veus | límit per defecte de 16: 32 notes costen el mateix que 16 | el mateix |
| inflexió de to | A4 440,0 Hz, a dalt del tot 494,0 Hz, a baix del tot 392,0 Hz, de tornada a 440,0 Hz | 440,0, 494,0, 392,0, 441,0 Hz |
| sosteniment (CC 64) | deixada anar: silenci; deixada anar amb el pedal: -13,5 dBFS; pedal amunt: silenci | el mateix |
| totes les notes fora | 8 notes, CC 123: silenci 1,5 s després; el verb `all_notes_off`: silenci | CC 123: silenci |
| roda de modulació (CC 1) | un so que porta la roda al filtre: brillantor 0,029 a 0, 0,300 a 127, 0,025 de tornada a 0 | 0,033, 0,300, 0,025 |
| MPE | zona definida pel missatge de configuració MPE; una nota al canal membre 2 a 440 Hz; una inflexió completa en un altre canal no la mou; una inflexió d'un quart del rang al seu canal: 880 Hz (el rang de 48 semitons) | 440, 440, 880 Hz |
| finestra pròpia | la finestra de Surge XT apareix a la pantalla de la Pi en 664 ms, quan es demana | |

## Les xifres

CPU del fil de l'amfitrió que fa córrer Surge XT (percentatge d'un nucli en una finestra de 4 s, ±1 a 2 %), càrrega DSP de
JACK, notes premudes:

| notes | plugin-hostd, límit 16 (per defecte) | plugin-hostd, límit 64 | jalv, límit 16 (per defecte) |
|---|---|---|---|
| 1 | 3 %, DSP 3,7 | 2 %, DSP 3,5 | 3 %, DSP 3,6 |
| 8 | 6 %, DSP 7,0 | 6 %, DSP 7,0 | 6 %, DSP 6,7 |
| 16 | 10 %, DSP 11,3 | 10 %, DSP 11,3 | 9 %, DSP 10,4 |
| 32 | 10 %, DSP 11,3 | 19 %, DSP 20,2 | 9 %, DSP 10,5 |
| 48 | | 29 %, DSP 29,7 | |
| 64 | | 39 %, DSP 39,7 | |
| 4 instàncies × 16 | del 14 al 15 % a cadascun dels quatre nuclis, DSP 17,6 | | |

El mateix instrument costa el mateix als dos amfitrions, amb menys d'un punt de diferència a cada nombre de notes. De la
petició als ports de l'instrument a JACK, plugin-hostd va respondre `add` en 580 a 585 ms en cinc execucions; els ports de
jalv van aparèixer 1,85 i 1,98 s després d'engegar-lo.

La qualificació va classificar Surge XT com a aïllat per als dos perfils d'amfitrió, per la seguretat en temps real: 410 966
reserves de memòria i 115 032 bloquejos al fil d'àudio durant l'escombratge de paràmetres, 18 884 i 98 304 amb notes. Aïllat
és una manera d'allotjar, no un refús: Surge XT corre, en un worker propi i no s'agrupa mai amb plugins segurs en temps
real. El seu cost a 512 mostres té una mediana d'uns 2,1 µs per mostra a totes les freqüències (prop del 10 % d'un nucli a
48 kHz), amb un percentil 95 de 27 a 37 µs per mostra als blocs on comencen notes.

## Altres instruments

A 48 kHz i 256 mostres, llegit digitalment als ports de JACK. FluidSynth i Pianoteq corren pel seu compte, amb els seus fils:

| instrument | fils ocupats | DSP de JACK % | xruns per finestra |
|---|---|---|---|
| Surge XT, una instància, 64 veus, a través de plugin-hostd | 1 | 27,5 | 0 |
| Surge XT, quatre instàncies, 16 veus cadascuna, a través de plugin-hostd | 4, un per worker | 18,8 | 0 |
| FluidSynth, 1200 veus, `cpu-cores=1` | 1 | 68 | de 0 a 1 |
| FluidSynth, 1200 veus, `cpu-cores=2` | 2 | 36 | 0 |
| FluidSynth, 1200 veus, `cpu-cores=4` | 4 | 19 | 0 |
| Pianoteq 9.2.1 de prova, 64 notes, `multicore=4` | 4 | de 44 a 49 | de 0 a 1 |

## El que faltava en aquell moment

Mesurat amb plugin-hostd 0.13.1 i omx-clap-host 0.23.2:

- Els noms de fitxer de Surge XT contenen un espai (`Surge XT.clap` i un binari LV2 codificat amb percentatges), que
  l'amfitrió no acceptava: totes les proves d'abans van fer servir un enllaç sense l'espai.
- Presets: el camí CLAP no llistava cap preset de fàbrica i un fitxer de preset amb un espai al camí no es carregava.
- El motor passava pels 775 paràmetres; l'amfitrió llegia les cinc pàgines de control remot de Surge però no es mostraven.
- Cap extensió CLAP no porta la matriu de modulació de Surge; la seva finestra pròpia sí.

## El que no s'ha mostrat

El primer xrun (cap execució no hi va arribar: 64 veus en una instància van prendre el 39 % d'un nucli); l'efecte del grup
de fils, que Surge XT no fa servir; els esdeveniments de modulació de paràmetres, l'afinació i el context d'estat; res a
cap altra freqüència o mida de bloc que no sigui 48 kHz i 256 mostres.
