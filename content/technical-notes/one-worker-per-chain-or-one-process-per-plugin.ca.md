---
title: "Un worker per cadena o un procés per plugin: els pros i els contres"
summary: Agrupar una cadena en un sol worker estalvia la major part de la memòria i bona part de la CPU que gasta un procés per plugin i una fallada continua costant només el plugin que ha fallat; el preu és que cal refiar-se dels plugins que comparteixen procés i això és el que decideix la qualificació.
measured: Raspberry Pi 5 amb Zynthian, 48 kHz, 256 mostres, octubre i novembre del 2026; les versions s'indiquen amb cada xifra.
topic: zynthian
order: 100
---

plugin-hostd fa córrer una cadena en un sol procés worker (agrupada) o cada plugin en un worker propi. Els amfitrions del
mateix Zynthian són als dos extrems: jalv fa córrer un procés per plugin, mod-host tots els plugins en un sol procés. Les
xifres són a [plugin-hostd en una Raspberry Pi 5](/ca/notes/plugin-hostd-on-a-raspberry-pi-5) i a la [pàgina de bancs de
proves](/ca/benchmarks); mesuren el dimoni directament en un graf JACK privat, no a través del motor de Zynthian.

## Què hi guanyes agrupant

- **Memòria.** 24 plugins en una sola cadena ocupen 64,1 MB de memòria proporcional, contra 183,1 MB amb un worker per
  plugin i 109,4 MB amb mod-host (plugin-hostd 0.15.9). Amb jalv, 24 plugins van ocupar 993,6 MB (plugin-hostd 0.15.4). En una Pi de 4 GB, aquesta és la diferència que creix amb la cadena.
- **CPU.** La cadena agrupada té la càrrega DSP més baixa dels amfitrions mesurats: un 12,51 % per als 24, contra un 17,76 %
  amb un worker per plugin i un 15,02 % amb mod-host.
- **Menys despertars.** Un sol client JACK fa córrer tota la cadena. Amb 16 plugins, la cadena agrupada va fer 6023 canvis de
  context en 20 s, contra 84 099 amb un worker per plugin i 72 292 amb mod-host.
- **Contenció de fallades.** El dimoni reinicia un worker perdut amb els enllaços que ell mateix havia fet, en uns 340 ms;
  jalv i mod-host perden el procés i res no torna el plugin. Dins d'una cadena, un membre que avorta deixa els altres
  sonant (vegeu [Cadenes](/ca/notes/chains-plugins-in-series-in-one-worker)). Els enllaços fets des de fora, com els de
  l'encaminament de Zynthian, el dimoni no els restableix.

## Què costa

- **Cal refiar-se d'un procés compartit.** Un plugin que corromp la memòria en lloc de fallar netament es pot endur la
  cadena. La qualificació n'és la protecció: un plugin que no supera l'escombratge de seguretat en temps real queda aïllat
  (corre en un worker propi i no s'agrupa mai) i un que falla, es penja o no es carrega no s'ofereix.
- **L'aïllament també té el seu cost.** Cada plugin aïllat és un worker més, un procés més i un client JACK més: les xifres
  d'un worker per plugin d'abans. A l'aparell, 306 dels 1602 plugins es qualifiquen com a aïllats.
- **Afegir a una cadena.** Afegits al worker de la cadena, 24 plugins triguen 549 ms en fred contra els 1459 ms de mod-host
  i a partir de quatre plugins una addició en calent és més ràpida que la de mod-host; mod-host afegeix dos plugins a un
  amfitrió en marxa més de pressa (44,8 ms contra 55,9 ms).
- **La latència** és només la que declaren els clients (cap per a aquests plugins). Una anada i tornada mesurada per a cada
  amfitrió necessita un bucle de retorn a través d'una interfície d'àudio i no s'ha fet.

## Allotjar CLAP

Zynthian no té un amfitrió CLAP propi: jalv i mod-host només allotgen LV2. plugin-hostd allotja CLAP al seu worker,
omx-clap-host i LV2 a través de l'adaptador LV2 del mateix worker, de manera que una cadena pot barrejar tots dos formats.

- Tots els plugins d'OpenMixer superen nets l'escombratge en tots dos formats.
- Les versions CLAP i LV2 d'un mateix plugin no són intercanviables pel que fa al cost: a 192 kHz i 512 mostres, la versió
  LV2 d'un chorus costa 592,2 ns per mostra de mediana contra 0,85 la seva versió CLAP. No se n'ha establert el motiu.
- CLAP darrere de MOD-UI no funciona: MOD-UI llegeix descripcions LV2, de manera que els ports, els paràmetres, els presets
  i les assignacions MIDI de CLAP no hi arriben. El motor plugin-hostd de Zynthian no passa per MOD-UI.

## Qualificació i empremtes

Cada plugin de l'aparell es mesura una vegada i plugin-hostd en llegeix el resultat com una empremta per binari: un plugin
els fitxers del qual canvien es torna a mesurar.

- Tres classes: **apte**; **aïllat**, un plugin que no supera l'escombratge de seguretat en temps real, que corre en un
  worker propi i no s'agrupa mai; i **no apte**, un plugin que falla, es penja, no es carrega o fa fallar l'amfitrió.
- L'aptitud dels LV2 va sortir igual per a jalv, mod-host i el worker de plugin-hostd, de manera que la qualificació no
  redueix el que Zynthian ofereix en LV2: aïlla els plugins que reserven memòria, es bloquegen o criden el nucli al fil
  d'àudio i deixa fora els que fallen o es pengen.
- Un plugin que plugin-hostd refusa es queda a jalv, llistat al seu menú: no desapareix res del que té l'usuari.
- El cost encara no forma part de cap veredicte: la sonda només cronometra blocs de 512 mostres, de manera que les
  etiquetes de cost dels menús no són del quàntum del mateix Zynthian.
- Una qualificació completa de tots els plugins en una Pi 5 triga unes sis hores. Es fa una vegada per conjunt de plugins,
  no en arrencar i un paquet porta els registres d'un conjunt conegut perquè un aparell nou només sondegi el que és
  diferent.

## Compatibilitat amb mod-host

plugin-hostd parla el protocol de mod-host al seu port, de manera que MOD-UI i el codi de Zynthian escrit per a mod-host hi
parlen sense canvis. En una sessió conduïda a través de MOD-UI, 130 de les 135 respostes van ser idèntiques. Les cinc que
diferien: `connect` al client `mod-monitor` (cap worker no n'és el propietari), `feature_enable aggregated-midi` (un worker
engegat després no ho sent mai) i `preset_load` d'un preset d'usuari després de recarregar un pedalboard. El retorn canvia
per worker: `transport` es va comunicar sis vegades en lloc d'una. El protocol i tots els verbs són a la [referència de
plugin-hostd-protocol](/projects/plugin-hostd-protocol/protocol).

## Paquets

Els paquets vénen del repositori apt d'OpenMixer per a Debian 13 arm64: plugin-hostd, omx-clap-host, omx-plugins i
omx-panel. ZynthianOS Vangelis porta Python 3.13, amb el qual la recepta d'instal·lació de MOD-UI no compilava; el canvi que
la fa compilar s'ha ofert a Zynthian. Una segona font apt és un cost per a una imatge: una rèplica, claus i un ritme de
versions que no és el de Zynthian.

## El que no està fet

- Una prova d'escolta a través d'una interfície d'àudio: els plugins es mesuren digitalment als ports de JACK a la Pi i
  l'anada i tornada mostra a mostra d'una cadena es va fer en contenidors.
- La graella de costos als quàntums propis dels amfitrions (128, 256 i 1024 mostres).
- Una estimació de cost al quàntum de Zynthian abans d'inserir un plugin.
- El motor MOD-UI sobre plugin-hostd, mesurat a l'aparell.
