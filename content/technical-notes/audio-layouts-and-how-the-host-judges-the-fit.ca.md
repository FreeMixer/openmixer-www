---
title: "Disposicions d'àudio: cada port que declara un plugin i com jutja l'amfitrió si hi cap"
summary: Abans l'amfitrió admetia una parella principal mono o estèreo i refusava tota la resta, cosa que deixava fora 84 dels 975 plugins LV2 que mod-host allotja. Ara la biblioteca descriu cada port d'àudio que declara un plugin i qui fa córrer el plugin jutja si pot portar aquella disposició i la refusa pel nom en lloc de reduir-la.
measured: Els plugins LV2 instal·lats en una màquina Fedora 44 (975), octubre del 2026; el disseny de les disposicions d'àudio d'omx-clap-core.
topic: core
order: 120
---

## La mancança

L'amfitrió admetia una entrada principal i una sortida principal de la mateixa amplada, mono o estèreo, més fins a vuit
entrades i sortides auxiliars d'un o dos canals i refusava tota la resta. Dels 975 plugins LV2 instal·lats en una màquina,
això en refusava 84 que mod-host allotja:

- 51 amb entrades més enllà de la parella principal: cadenes laterals, mescladors, vúmetres, mescladors matricials i patchbays,
  fins a 64 entrades;
- 33 la parella principal dels quals té amplades diferents o amb més sortides que la parella: reverbs mono amb una cua
  estèreo, divisors de bandes amb sortides per banda, un instrument de 34 sortides.

Un plugin CLAP amb un port principal envolupant o ambisònic es refusava igual i l'amfitrió no llegia mai les extensions que
descriuen aquests ports o n'ofereixen altres disposicions.

## La decisió

S'admet qualsevol disposició que declari un plugin:

- les entrades més enllà de la principal són entrades auxiliars, en silenci fins que alguna cosa les connecta;
- un port principal de qualsevol amplada es porta allà on el portador té prou canals;
- una disposició que el portador no pot portar es refusa amb un codi amb nom, mai en silenci ni reduint-la;
- una sortida mono en un canal estèreo es porta als dos costats, com una entrada mono.

El que manté això petit és un principi: **la biblioteca descriu, el portador jutja.** La biblioteca de l'amfitrió i
l'adaptador LV2 admeten qualsevol disposició d'àudio dins dels límits declarats i la descriuen sencera: cada port, els seus
canals, el seu tipus, el seu mapa de canals. Qui fa córrer el plugin en un carril d'una certa amplada llegeix aquesta
descripció i decideix què pot portar. El carril natiu de la consola té dos canals i refusa un port principal més ample, com
abans; omx-clap-host amb JACK pot portar qualsevol amplada com a ports.

## Què va trobar la revisió

Les formes que hi ha darrere dels 84 i la lectura que admet cadascuna:

- **Un grup principal declarat més altres ports.** Els compressors amb cadena lateral, els mescladors multicanal, els
  comparadors A/B, els oscil·loscopis i analitzadors d'espectre, les reverbs estèreo reals i els divisors de bandes declaren
  quin grup de ports és el principal; tots els altres ports són auxiliars.
- **Grups, però cap grup principal.** El primer grup en l'ordre dels ports es pren com a port principal: un plugin amb dos
  grups mono en té un de principal i l'altre d'auxiliar.
- **Cap grup, més de dos ports.** Quan el port principal de l'altre costat té exactament la mateixa amplada, el costat és un
  sol port principal d'aquella amplada: vúmetres envolupants, mescladors matricials, mesuradors de sonoritat multicanal,
  patchbays de N a N. Si no, els dos primers ports són la parella principal i la resta són ports auxiliars mono:
  encreuadors amb dues parelles, compressors de tres entrades, un codificador amb entrades de centre i envolupant de més.
- **Entrada mono, sortida estèreo.** Tretze reverbs estèreo reals i sis divisors tenen ports principals d'amplades diferents;
  les seves dues sortides són la parella principal, que és també el que presenta mod-host.

Els límits surten del que va mesurar la revisió, amb un marge: un port de fins a 64 canals i fins a 64 ports auxiliars per
costat (un patchbay de 64 canals, un mesurador de sonoritat de 24 canals, un instrument de 34 sortides, un
mostrejador de 98 sortides com a 49 grups estèreo). Cap plugin instal·lat no declarava un grup envolupant ni ambisònic; aquests
es proven amb peces de prova.

## Per què aquestes regles

- **Deterministes a partir del que diu el plugin.** Les regles no endevinen mai una disposició que el plugin no ha declarat.
  Un plugin que vol un port principal més ample declara un grup de ports.
- **Res no es redueix.** Un plugin 5.1 que se sentís només pels seus dos primers canals seria una pèrdua silenciosa; en lloc
  d'això es refusa pel nom, allà on el portador no pot prendre sis canals.
- **No canvia res del que ja funcionava.** Un plugin mono o estèreo en un carril estèreo es comporta com abans, bit a bit i
  els noms dels ports JACK de la parella principal no canvien.
- **Ambisònica sense normalització declarada.** Els grups de ports LV2 no declaren cap normalització, de manera que un grup
  ambisònic d'ordre complet es presenta amb ordenació ACN i normalització SN3D, la convenció AmbiX i la descripció diu que
  és suposada. Els grups d'ordre mixt, que un port ambisònic CLAP no pot expressar, es porten com a canals separats.
- **Les disposicions alternatives es demanen, no s'imposen.** A un plugin que ofereix altres disposicions se li pot demanar,
  abans d'activar-lo, la que té el portador (una reverb que ofereix entrada mono i entrada estèreo pren la del canal); un
  plugin que no pot conserva la disposició declarada i el portador la jutja.
- **Els canvis de disposició no es responen amb un reinici.** Un plugin que torna a explorar els seus ports es comunica una
  vegada; el portador el torna a descriure mentre és inactiu i el torna a activar.

## On són les regles

Les regles mateixes (quins ports són principals i quins auxiliars, els tipus de grup LV2 i els seus mapes de canals, les
extensions CLAP que es llegeixen, els noms dels ports JACK, els límits i els codis de refús) són a [la referència de la
biblioteca de l'amfitrió](https://github.com/FreeMixer/omx-clap-core/blob/main/doc/reference.md).

## Com es demostra

Peces de prova, LV2 i CLAP, una per forma: un grup principal amb dos grups auxiliars estèreo, dos grups mono sense principal,
sense grups de 4 a 4 i de 4 a 2, entrada mono amb un grup de sortida principal estèreo, una parella principal amb tres
sortides de banda, 5.1, ambisònica de primer ordre i d'ordre mixt, un costat de 64 ports i un de 65, plugins amb disposicions
alternatives. Cadascuna comprova la descripció i un valor a través dels ports. Amb sabotatge, les proves surten vermelles:
tornar a posar el refús d'amplades iguals posa en vermell els plugins d'entrada mono i sortida estèreo i treure la connexió
auxiliar posa en vermell la prova de cadena lateral. Tots els plugins mono i estèreo continuen sent idèntics bit a bit a
través de l'adaptador.
