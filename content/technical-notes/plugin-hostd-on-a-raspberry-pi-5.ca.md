---
title: "plugin-hostd en una Raspberry Pi 5: què s'ha mesurat i com"
summary: En una Raspberry Pi 5 amb Zynthian i una interfície d'àudio, una cadena de plugin-hostd té la càrrega DSP més baixa dels quatre amfitrions mesurats (els altres són omx-clap-host, mod-host i jalv), a 48 i a 96 kHz; a més, fa servir més o menys la meitat de memòria que mod-host. Aquesta nota en dona l'aparell, el mètode i totes les taules.
measured: Raspberry Pi 5 (4 GB) amb ZynthianOS Vangelis i una RME Babyface Pro, 5 de novembre del 2026; plugin-hostd 0.18.0 (protocol 0.3.0), omx-clap-host 0.29.0, omx-plugins 0.18.0, mod-host 0.10.9, jalv 1.6.9. Execucions anteriors, 2 de novembre del 2026; plugin-hostd 0.15.9, omx-clap-core 0.26.4, plugin-qualify 0.18.5, omx-plugins 0.17.0, el mod-host de sèrie de Zynthian.
topic: zynthian
order: 80
---

Les xifres d'aquestes execucions també són a la [pàgina dels bancs de proves](/benchmarks), fila per fila.

## L'aparell i el mètode

- Una Raspberry Pi 5 (Cortex-A76, 4 nuclis, 4 GB) amb ZynthianOS Vangelis (Debian 13, arm64), nucli 6.18 (no
  PREEMPT_RT), amb els paquets que instal·la una Zynthian amb el canal d'OpenMixer.
- JACK 1.9.22 amb el controlador ALSA d'una RME Babyface Pro, amb prioritat de temps real 70, el governador de la CPU a
  `performance` i els serveis del mateix Zynthian aturats durant l'execució i restablerts després. La càrrega DSP i els
  xruns són els del servidor JACK: tot s'ha llegit digitalment, al servidor i als seus ports; res d'aquí no afirma res
  sobre l'àudio analògic.
- Cada fila és la mediana de tres repeticions de 10 s, amb la repetició més baixa i la més alta a la pàgina dels bancs
  de proves. DSP és la càrrega DSP de JACK; PSS és la memòria proporcional dels processos de l'amfitrió, que reparteix
  les biblioteques, de manera que és la memòria que l'aparell gasta de debò.
- Els amfitrions els ha governat directament el banc de proves de plugin-hostd, no el motor de Zynthian ni MOD-UI.
- Una fila amb repeticions massa disperses a l'execució compartida s'ha tornat a executar sola; la xifra que es dona és
  la de la fila sola.

Els amfitrions:

| amfitrió | què corre |
|---|---|
| plugin-hostd, afegits en una sola cadena | el dimoni i un worker per a tota la cadena, un client JACK |
| plugin-hostd, cadena declarada de cop | la mateixa cadena, engegada amb tota la llista |
| plugin-hostd, un worker per plugin | el dimoni i un worker per plugin, un client JACK cadascun |
| omx-clap-host, un sol procés | un procés d'omx-clap-host per a tots els plugins |
| mod-host | un procés de mod-host per a tots els plugins, un client JACK cadascun (versions LV2) |
| jalv | un procés de jalv per plugin (versions LV2) |

Els conjunts de plugins: omx comp, delay i drive per torns, 3, 8 i 16, en les versions CLAP on l'amfitrió fa córrer CLAP
i en les versions LV2 a mod-host i jalv; el mateix amb Calf Compressor (LV2) als torns, 8 i 16; i un Pianoteq 9 tocant
acords de cinc notes.

## 48 kHz

16 plugins (omx comp, delay i drive), 3 períodes, el paràmetre del mateix Zynthian. Càrrega DSP, xruns quan una
repetició en va tenir i PSS:

| mostres | plugin-hostd, afegits en una sola cadena | omx-clap-host | mod-host | plugin-hostd, un worker per plugin | jalv |
|---|---|---|---|---|---|
| 128 | 6,75 % | 9,36 % | 8,86 % | 10,88 % | 11,40 % |
| 256 | 6,35 % | 7,75 % | 7,38 % | 8,63 % | 8,49 % |
| PSS | 54 a 55 MB | 53 MB | 99 MB | 143 MB | 690 MB |

La cadena declarada de cop dona el mateix que la cadena on s'afegeixen (6,75 i 6,38 %). Amb 3 plugins tots els
amfitrions donen entre un 1,5 i un 1,7 % a 256 mostres: la diferència es veu a partir de 8 plugins o a 128 mostres.

El conjunt amb Calf Compressor, 16 plugins, a cada paràmetre que ha fet córrer el banc de proves (càrrega DSP):

| mostres, períodes | cadena de plugin-hostd | omx-clap-host | mod-host | plugin-hostd, un worker per plugin | jalv |
|---|---|---|---|---|---|
| 128, 2 | 6,83 % | 10,06 % | 9,40 % | 11,31 % | 12,97 %, 38 xruns |
| 128, 3 | 7,00 % | 9,65 % | 9,24 % | 11,80 % | 12,34 %, 32 xruns |
| 256, 2 | 6,46 % | 8,43 % | 8,21 % | 12,52 % | 9,44 % |
| 256, 3 | 7,79 % | 7,73 % | 7,66 % | 9,14 % | 8,80 % |

A 128 mostres la cadena fa córrer 16 plugins amb 0,7 de la càrrega d'omx-clap-host o de mod-host i més o menys la meitat
de la de jalv; jalv és l'únic amfitrió amb xruns. A 256 mostres amb 3 períodes totes les formes d'un sol procés donen
el mateix; la xifra de la cadena en aquest cas té la dispersió més gran de la taula (de 7,47 a 8,16 %) i no s'ha tornat a
executar sola, de manera que no es llegeix com un cost del tercer període. omx-clap-host i mod-host queden a menys de 0,7
punts l'un de l'altre a cada paràmetre: l'adaptador LV2 no és el camí més lent.

Pianoteq 9, una instància, a 256 mostres i 3 períodes: 13,60 % a omx-clap-host, 13,64 % a plugin-hostd, 13,40 % a
mod-host i 14,70 % a jalv. La feina la fan els fils del mateix instrument, de manera que l'amfitrió hi compta poc; el seu
PSS és de 250 MB a plugin-hostd, 288 MB a mod-host i 279 MB a jalv.

## 96 kHz

Les mateixes files a 96000 Hz, 3 períodes. A 96 kHz un període de 256 mostres dura 2,67 ms i un de 128 mostres 1,33 ms.
Càrrega DSP, amb la mediana dels xruns quan una repetició en va tenir:

| conjunt, mostres | plugin-hostd, afegits en una sola cadena | omx-clap-host | mod-host | plugin-hostd, un worker per plugin | jalv |
|---|---|---|---|---|---|
| 16 plugins omx, 128 | 15,46 %, 1 xrun | 18,18 % | 19,93 %, 9 xruns | 21,19 %, 26 xruns | 31,12 %, 183 xruns |
| 16 plugins omx, 256 | 12,66 % | 15,43 % | 14,60 %, 8 xruns | 16,85 % | 18,16 %, 52 xruns |
| 16 amb Calf, 128 | 13,61 %, 8 xruns | 18,85 %, 4 xruns | 21,88 %, 43 xruns | 21,96 % | 23,61 % |
| Pianoteq 9, 128 | | 20,71 %, 7 xruns | 21,85 %, 4 xruns | 20,63 %, 3 xruns | 23,24 %, 10 xruns |
| Pianoteq 9, 256 | | 20,66 %, 3 xruns | 20,94 %, 1 xrun | 20,24 %, 5 xruns | 20,38 %, 3 xruns |

Pianoteq és un sol instrument i no té cadena. La cadena declarada de cop dona un 13,2 % (16 plugins omx, 128) i un
12,64 % (256).

- El doble de freqüència, més o menys el doble de càrrega: els conjunts d'efectes donen entre 1,8 i 2,1 vegades la xifra
  de 48 kHz a tots els amfitrions. Pianoteq costa entre 1,4 i 1,6 vegades, perquè part de la seva feina no creix amb la
  freqüència.
- L'ordre dels amfitrions no canvia: la cadena és la més baixa a cada mida.
- A 96 kHz tornen els xruns on a 48 kHz no n'hi havia. La cadena es manté entre 0 i 8; jalv en té més que ningú.
- A 96 kHz, 128 mostres no són el límit: sense cap plugin, omx-clap-host, plugin-hostd i mod-host hi van córrer sense
  xruns (jalv no té amfitrió sense plugin).
- 2 períodes contra 3 a 256 mostres: el mateix per als conjunts d'efectes, però Pianoteq i els 16 plugins omx donen més
  càrrega amb 2 a omx-clap-host i a mod-host. A 96 kHz val la pena mantenir el tercer període, com el té Zynthian.
- La memòria no depèn de la freqüència: el PSS de cada amfitrió queda a menys d'1 MB de la xifra de 48 kHz.
- Dues files van fallar perquè el servidor JACK no va respondre en 10 s en una repetició: mod-host amb 16 plugins (el
  conjunt amb Calf) a 256 mostres i jalv amb 8 plugins omx a 128. Cap amfitrió no va refusar cap plugin.

Algunes files de 96 kHz tenen una dispersió gran i no es llegeixen soles: jalv amb 16 plugins omx a 128 mostres (de 22,96
a 31,52 %), omx-clap-host amb el conjunt amb Calf a 256 mostres i tres files amb 2 períodes.

## Amb càrrega

La càrrega del banc de proves és un bucle ocupat a cada nucli que pot fer servir l'amfitrió més 256 MiB de memòria que es
van tocant. 16 plugins amb Calf a 48 kHz, 256 mostres, 3 períodes: la cadena dona entre un 6,68 i un 6,76 %, els
amfitrions d'un sol procés pugen fins a 0,4 punts (omx-clap-host 8,14 %, mod-host 7,87 %, jalv 8,82 %) i un worker per
plugin, 17 processos, és el que té xruns (10,13 %, 30). Passa el mateix amb 16 plugins omx a 128 mostres: la cadena un
6,94 % amb càrrega contra un 6,75 % sense, un worker per plugin 90 xruns. A 96 kHz totes les formes tenen xruns amb
aquesta càrrega, la cadena menys que les altres (d'1 a 9) junt amb jalv (0, amb 690 MB per als seus 16 processos).

## El límit a 48 kHz

A 48 kHz, 64 mostres tenen xruns a omx-clap-host, plugin-hostd i mod-host sense cap plugin carregat, amb prioritat de
JACK 70 i amb la de sèrie de JACK, 10: és el límit de l'aparell i no d'un amfitrió: cap fila no diu que un amfitrió
estigui net a 64. La prioritat 70 ajuda els amfitrions que fan la feina en un sol procés: mod-host amb 16 plugins un
12,0 % amb prioritat 70 contra un 14,8 % amb 10.

## Temps d'addició

16 plugins omx a 48 kHz i 128 mostres, amb l'amfitrió en marxa, tots els plugins afegits fins que l'últim sona:

| plugin-hostd, afegits en una sola cadena | plugin-hostd, cadena declarada de cop | omx-clap-host | mod-host | plugin-hostd, un worker per plugin | jalv |
|---|---|---|---|---|---|
| 80 ms | 2,034 s | 397 ms | 364 ms | 640 ms | 13,8 s |

Afegir a una cadena que ja corre és el camí ràpid. Una cadena declarada de cop engega el worker amb tota la llista, cosa
que triga més; jalv engega un procés i un client JACK per plugin.

## De les execucions anteriors

Aquestes seccions vénen d'execucions amb plugin-hostd 0.15.9 i omx-clap-core 0.26.4 amb el controlador dummy de JACK a
48000 Hz i 256 mostres, contra la compilació de mod-host del mateix Zynthian, tret que una secció digui altres versions.
Encara no s'han repetit amb la interfície d'àudio. jalv hi surt on es va mesurar; les taules anteriors de mod-host i
omx-clap-host no l'incloïen.

### Temps d'addició, en fred i en calent

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

### Instruments

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

### On se'n va el temps de la cadena

perf sobre el fil d'àudio del worker, 24 plugins en una sola cadena, mesurat amb versions que porten símbols: els plugins i
libm se'n queden entre el 88 i el 92 %. El codi del mateix amfitrió en pren entre un 4 i un 7 %: les còpies de l'adaptador
LV2 (1,9 % quan tots els plugins són LV2), les còpies a l'entrada i la sortida de la cadena (prop de l'1 %), la feina de
control i d'esdeveniments de l'adaptador (prop de l'1 % en LV2) i les proteccions de l'etapa amb la limitació (prop del 0,5
%). El nucli del sistema i libjack en prenen el 0,5 %, on mod-host, amb la mateixa cadena, hi passa entre el 10 i el 14 %
de les seves mostres, repartides entre els seus 24 clients JACK. El símbol més pesant és `tanhf` a omx-drive, del 14 al 15
%.

### Moltes cadenes alhora

Una prova de càrrega anterior, amb plugin-hostd 0.13.1 i el servidor JACK del mateix aparell a 48000 Hz i 256 mostres, va
mantenir cadenes de quatre plugins LV2 amb 1, 2, 4, 8 i 16 cadenes, 60 s cada nivell. Amb 16 cadenes, els processos
amfitrions feien servir el 70,6 % d'un nucli agrupats (un worker per cadena, 60 plugins), el 100,8 % sols (un worker per
plugin) i el 82,3 % amb jalv (64 plugins); la PSS era de 224,2, 359,3 i 2745,6 MB. Agrupats i sols van arribar a 16 cadenes
sense cap límit; jalv s'hi va aturar per memòria, amb 2 xruns.

### Qualificació a l'aparell (plugin-qualify 0.18.5)

Amb el paquet de registres de qualificació omx-qualification-rpi5-zynthian-vangelis 2026110101: 1602 plugins (1341 LV2, 261 CLAP); 1079 qualificats
dins del procés i 306 aïllats; 93 han fallat, 46 s'han penjat i 13 s'han refusat; 27 sense mesura, cadascun amb el seu motiu.
Tots els paquets s'instal·len des del canal i `dpkg -V` no hi troba res canviat; cadascun dels cinc instruments d'abans sona
amb les seves notes.

## El que encara no s'ha mesurat

- Escoltar a través de la interfície d'àudio i mesurar la latència sobre l'àudio per a cada amfitrió: totes les xifres
  d'aquí s'han llegit digitalment.
- Els instruments amb la interfície d'àudio i plugin-hostd 0.18.0; també la fila del grup de fils: Surge XT no declara cap
  grup de fils, de manera que aquesta fila només pot mostrar que no canvia res; a més, aquesta vegada l'eina del banc de proves
  no va arribar als seus ports.
- La qualificació amb plugin-qualify 0.19.0, que substituirà els comptes d'aquí dalt quan s'hagi fet.
- El cost per bloc de cada plugin al quàntum del mateix Zynthian (128 i 256 mostres): la sonda de qualificació només
  cronometra blocs de 512 mostres.
- L'estimació de cost que un editor de cadenes demanaria al dimoni abans d'inserir un plugin.
