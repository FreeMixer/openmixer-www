---
title: D'un fitxer de plugin a una pàgina a la pantalla
summary: Cinc etapes converteixen un fitxer CLAP o LV2 en una fila de menú amb les seves xifres, pàgines de controls i una MOD GUI en un Zynthian. Cada etapa té un sol responsable, escriu un sol artefacte en un lloc fix i les etapes següents llegeixen aquest artefacte i res més.
measured: plugin-hostd, plugin-qualify i omx-panel en una Raspberry Pi 5 amb Zynthian, octubre del 2026.
topic: zynthian
order: 70
---

Un instrument en un Zynthian és un fitxer al disc: un binari CLAP o LV2. El que veu qui toca és una fila en un menú amb les
seves xifres, una cadena amb una entrada MIDI, pàgines de controls amb potenciòmetres, una MOD GUI i un peu de pàgina que
diu què costarà la cadena. Cinc etapes converteixen l'un en l'altre. Cada etapa té un sol responsable, escriu un sol
artefacte en un lloc fix i el que ve després llegeix aquest artefacte i res més.

L'exemple és un instrument: [Kars](https://github.com/DISTRHO/Kars), un sintetitzador LV2 de corda pinçada, a les captures
de l'aparell; Surge XT (CLAP) on importen les seves xifres; i un efecte una vegada, per mostrar on canvia la disposició.

![Les cinc etapes, l'artefacte que escriu cadascuna i les superfícies que els llegeixen](/notes/from-a-plugin-file-to-a-page/from-file-to-page.svg)

## 1. Explorar i descriure

**Responsable:** plugin-hostd. **Escriu:** el descriptor, un document JSON per binari de plugin a
`/var/lib/omx/descriptors`, amb el nom `<id>@<version>-<hash>.json`.

El dimoni carrega el plugin una vegada a l'amfitrió que li correspon (omx-clap-host per a CLAP i per als plugins LV2 que
pren el seu adaptador, mod-host per a la resta) i en llegeix tot el que declara: l'identificador i la versió, els ports
d'àudio i MIDI, cada paràmetre amb símbol, nom, unitat, rang, valor per defecte, passos o enumeració, indicadors, la
latència declarada i les extensions que admet.

Per a un instrument, el descriptor diu el que no diu el d'un efecte: un port d'entrada MIDI i per tant les notes que
accepta, els seus paràmetres i els seus presets. El descriptor de Kars té els tres paràmetres que el motor mostra després a
la seva única pàgina: Sustain, Release i Volume.

El descriptor ha d'encaixar amb el contracte: omx-contract en defineix el vocabulari (unitats, tipus de port, àmbits,
codis de resultat) i una exploració que troba una unitat o un camp desconeguts es refusa, no s'inventa. Els plugins
d'OpenMixer se salten l'exploració: els seus paràmetres s'escriuen una sola vegada en una declaració i un generador n'escriu
el descriptor, el paquet LV2, els paràmetres CLAP i la referència de paràmetres.

## 2. Qualificar

**Responsable:** plugin-qualify. **Escriu:** el registre de qualificació,
`<plugin>@<version>-<hash>.<offer>.qualification.json`, amb la sortida de la sonda que ha jutjat al costat, a
`/var/lib/omx/qualification`.

La sonda fa córrer el plugin a cada cel·la d'una graella (44,1, 48, 96 i 192 kHz per blocs de 128, 256, 512 i 1024
mostres) i n'escriu el registre: els resums dels fitxers del binari, el cost per bloc, la latència declarada i la mesurada,
la seguretat en temps real sota l'interposador o un codi de motiu per a cada cel·la que no ha corregut. Per a un
instrument, la sonda manté unes quantes notes premudes mentre mesura, de manera que el cost és el cost amb aquelles veus
sonant.

En surt un veredicte per a cada amfitrió: apte, aïllat (corre en un worker propi i no s'agrupa mai) o no apte. Kars queda
apte per a omx-clap-host, segur en temps real amb un escombratge de paràmetres i amb notes, allotjat aïllat. Les xifres de
la Pi són a [plugin-hostd en una Raspberry Pi 5](/ca/notes/plugin-hostd-on-a-raspberry-pi-5) i les de Surge XT a
[Instruments en una Pi 5](/ca/notes/instruments-on-a-pi-5).

## 3. Empremtes

**Responsable:** plugin-qualify. **Escriu:** `/var/lib/omx/qualified.pins`, una línia per plugin.

A partir dels registres, una línia per plugin diu què pot allotjar plugin-hostd i com (vegeu
[Empremtes al primer ús](/ca/notes/pins-on-first-use)). El dimoni carrega les empremtes com a única font de permís i el seu
planificador les llegeix per agrupar workers i col·locar-los en nuclis. Un instrument mai no es posa al worker compartit
d'una cadena, de manera que una fallada o un búfer tardà d'una veu no poden arribar als efectes que la segueixen.

És també el que necessiten els nuclis. Surge XT 1.4.0 no fa cas de l'extensió de grup de fils de CLAP, de manera que un
instrument és un fil d'àudio. Uns quants instruments fan servir uns quants nuclis quan cadascun és en el seu worker i els
workers es reparteixen pels nuclis d'àudio, amb el dimoni fora d'aquests nuclis.

## 4. Disposició

**Responsable:** omx-panel. **Escriu:** les pàgines, calculades a partir del descriptor amb
`omx-panel layout --descriptor`; el registre guarda l'esquema i el resum de la disposició amb què s'ha jutjat.

La disposició converteix els paràmetres d'un descriptor en pàgines: les seccions esdevenen grups i cada control rep una
clau estable. La mateixa disposició governa les pàgines de controls del motor a Zynthian, la MOD GUI generada per a MOD-UI
i el paquet que afegeix grups als plugins LV2 de tercers (vegeu [Per què la majoria dels plugins LV2 d'un Zynthian
necessiten grups de ports inferits](/ca/notes/why-lv2-plugins-on-zynthian-need-inferred-port-groups)).

Kars té un grup de tres potenciòmetres i per tant una sola pàgina, "Controls". Un efecte es disposa d'una altra manera:
l'equalitzador d'OpenMixer posa cada banda en una pàgina pròpia.

## 5. Llegir a l'aparell

**Responsable:** la interfície de Zynthian, amb el dimoni. **Escriu:** res; llegeix.

La interfície llegeix les empremtes per als seus menús, els registres per a la latència, la seguretat en temps real i el
cost de cada fila i la disposició per a les pàgines. Abans d'inserir un plugin pregunta al verb `estimate` del dimoni què
costarà la cadena. Res no es calcula dues vegades: el descriptor per als paràmetres, el registre per a les xifres,
l'empremta per al permís, la disposició per a les pàgines.

A l'aparell, per a Kars, la fila del menú de plugins amb el seu nivell, la latència (mostres mesurades i declarades) i la
seguretat en temps real:

![El menú de plugins, ordenat per nivell](/notes/from-a-plugin-file-to-a-page/list-by-tier.png)

la pàgina de controls del motor:

![La pàgina de controls de Kars](/notes/from-a-plugin-file-to-a-page/controller-page-1-controls.png)

la MOD GUI a partir de la mateixa disposició:

![La MOD GUI de Kars en un pedalboard](/notes/from-a-plugin-file-to-a-page/modgui-pedalboard.png)

i la cadena amb l'instrument:

![Una cadena amb Kars i un compressor](/notes/from-a-plugin-file-to-a-page/chain-view-kars-zamcomp.png)

Un aparell nou no repeteix l'etapa llarga. Un paquet porta els registres i les empremtes d'un conjunt de plugins conegut,
indexats per resums, de manera que un aparell nou els aplica i només sondeja el que és diferent.
