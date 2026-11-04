---
title: "Podria l'amfitrió acceptar VST3? La costura de l'adaptador i el seu cost"
summary: Un adaptador VST3 és possible en C pla contra l'API C de Steinberg, amb llicències que un amfitrió GPL pot fer servir i una prova va allotjar un efecte VST3 real de cap a cap. Costaria unes 6200 línies i tres setmanes, per a una demanda escassa i per això no es fa; el que ho faria canviar queda escrit.
measured: L'adaptador LV2 d'omx-clap-core, el VST 3 SDK 3.8.1 i la seva API C a Fedora 44 i una revisió de les pàgines dels fabricants de plugins, octubre del 2026.
topic: core
order: 110
---

## La resposta en xifres

- L'adaptador LV2 i la seva infraestructura tenen 5754 línies de codi en 336 funcions: 1594 línies (139 funcions) neutrals
  quant al format, 1699 (73) mixtes, és a dir lògica neutral al voltant d'unes quantes crides al format i 2461 (124)
  pròpies d'LV2.
- La infraestructura ja es comparteix: les sis capçaleres de la biblioteca que inclou l'adaptador són neutrals i quatre ja
  es fan servir fora de l'adaptador.
- La costura que falta tallar és la capa que presenta un plugin LV2 com un plugin CLAP: 1314 de les seves 1319 línies són
  neutrals o mixtes i 1161 servirien per a una capa VST3. El nucli LV2 és pròpia d'LV2 en dos terços; el seu codi neutral (el
  bucle del worker, el confinament de camins, les funcions d'àtoms, un dipòsit de memòria de temps real) serveix idees d'LV2
  que VST3 no té.
- Al fil d'àudio, la capa afegeix una crida indirecta per cicle i una per esdeveniment MIDI de sortida; totes les altres
  crides indirectes d'allà són de l'amfitrió CLAP o del mateix plugin. Una capa compartida no n'ha d'afegir cap.
- Un adaptador VST3 no necessita C++: l'API C generada per Steinberg funciona i una prova de 477 línies de C11 va allotjar un
  efecte VST3 de cap a cap. L'SDK té llicència MIT i l'API C BSD-3-Clause, totes dues utilitzables en un amfitrió
  GPL-3.0-or-later.
- El cost: unes 2200 línies a la part del format, unes 6200 amb proves i peces de prova; unes tres setmanes de feina tallant
  primer la costura, dues i mitja sense.
- La demanda és escassa: 64 paquets de plugins de codi obert dels repositoris de la distribució són només VST3 a Linux, cap
  dels quals és un que OpenMixer necessiti i 6 fabricants de codi tancat distribueixen VST3 per a Linux sense CLAP ni LV2.

Per tant: ara no. Els resultats es conserven perquè un adaptador futur en pugui partir.

## La costura

Cada funció de l'adaptador es va llegir i classificar: **neutral** (un adaptador VST3 la faria servir sense canvis: només
depèn de CLAP, del contracte, de l'anell, dels límits o de C pla), **mixta** (lògica neutral al voltant d'unes quantes crides
al format, cadascuna un ganxo que aportaria la part del format) o **pròpia** (només LV2, també el codi on només es comparteix
la idea). Una eina d'omx-clap-core uneix la classificació amb la llista de lizard, falla si hi ha una funció que la taula no
classifica i n'imprimeix les sumes.

| part | neutral | mixta | pròpia | total |
|---|---:|---:|---:|---:|
| la capa (LV2 com a CLAP) | 347 (46) | 967 (44) | 5 (1) | 1319 (91) |
| funcions LV2 | 30 (3) | 30 (1) | 449 (31) | 509 (35) |
| instància LV2 | 275 (29) | 501 (22) | 923 (44) | 1699 (95) |
| dipòsit de memòria de temps real | 169 (12) | 0 (0) | 12 (3) | 181 (15) |
| món LV2 (descripcions a través de lilv) | 48 (6) | 201 (6) | 1072 (45) | 1321 (57) |
| les capçaleres compartides de la biblioteca | 725 (43) | 0 (0) | 0 (0) | 725 (43) |
| **total** | **1594 (139)** | **1699 (73)** | **2461 (124)** | **5754 (336)** |

Cada cel·la són línies de codi (funcions).

Quan s'aprovi un segon adaptador, la capa es dividirà en dues: les 1161 línies reutilitzables aniran a una capa compartida
dins d'omx-clap-core (la meitat del fil d'àudio `static inline` en una capçalera, la del fil principal en una biblioteca
estàtica interna, sense ABI pública) i la resta LV2 es quedarà darrere d'uns 25 ganxos:

| grup | ganxos | equivalent VST3 |
|---|---|---|
| cicle de vida | carregar, alliberar, activar o conservar a una freqüència i un rang de blocs, desactivar, reiniciar, latència | `createInstance` i `initialize`, `terminate`, `setupProcessing` i `setActive`, `setProcessing`, `getLatencySamples` |
| paràmetres | nombre, informació (rang, indicadors, passos, unitat), llegir i escriure, valor a text i a l'inrevés, símbol | `getParameterCount/Info`, valors normalitzats i reals, `getParamStringByValue/ValueByString` |
| ports | una taula de ports (tipus, amplada, mapa de canals CLAP, principal o auxiliar), búfer d'entrada i de sortida per branca i canal | `getBusInfo`, `SpeakerArrangement`, `AudioBusBuffers` |
| procés | executar, entrada MIDI, sortida MIDI, transport, comptatges | `process(ProcessData)`, `IEventList`, `ProcessContext` |
| estat i presets | desar en un bloc, carregar-ne un, llistar presets, carregar-ne un | `getState/setState` (component i controlador), `.vstpreset` |
| descobriment | obrir i tancar un paquet, llistar-ne els plugins, refusar abans d'obrir | l'exploració de paquets, `IPluginFactory`, `moduleinfo.json` |

VST3 necessita quatre coses que LV2 no va demanar mai: el controlador i el processador estan separats, amb missatges entre
tots dos; els canvis de paràmetres tornen del processador al controlador; els indicadors de `restartComponent` s'han de
convertir en peticions CLAP; i l'estat són dos blocs, no un. És feina de la part del format i no eixampla la interfície.

La regla de la capa compartida: la seva meitat del fil d'àudio es compila dins de la capa de cada format i els ganxos del
format són crides directes lligades en compilar, sense taula virtual. La prova és un recompte amb objdump: cap crida indirecta
al camí d'àudio més enllà de les de l'amfitrió CLAP i del mateix plugin.

Cap altra biblioteca d'OpenMixer no té codi que pugui substituir la capa compartida: la biblioteca de DSP té un encreuament
que l'amfitrió ja fa servir i cap anell, worker ni taula de paràmetres; plugin-hostd distribueix els formats amb una taula de
prefixos; la biblioteca dels plugins reflecteix el vocabulari del contracte de paràmetres.

## L'SDK

**Llicència.** El VST 3 SDK 3.8.1 té llicència MIT; el seu README diu que ja no s'ofereix la llicència GPLv3 ni la llicència
propietària de Steinberg i que "VST" no es pot fer servir en noms d'empresa ni de producte. El codi MIT es combina en una
obra GPL-3.0-or-later; l'única obligació és conservar l'avís amb qualsevol fitxer de l'SDK que es distribueixi.

**Llenguatge.** L'SDK és C++ amb interfícies a l'estil COM i les seves funcions d'allotjament enllacen libstdc++. Steinberg
també publica una API C generada a partir d'aquestes interfícies, amb la llicència BSD de tres clàusules: cada interfície és
una estructura amb una taula virtual, cada identificador una constant. Un adaptador VST3 pot ser, doncs, en C com la resta de
la biblioteca. El preu és escriure a mà els objectes COM de l'amfitrió: 257 línies a la prova.

**Què implementa un amfitrió**, estimat a partir de la prova i del codi LV2 que fa la mateixa feina:

| tasca | què necessita VST3 de l'amfitrió | línies (estimació) | reutilitzat de la costura |
|---|---|---:|---|
| instanciar i connectar un efecte estèreo | explorar els paquets `.vst3`; l'entrada del mòdul i la fàbrica de plugins; inicialitzar el component amb un objecte d'aplicació amfitriona que també reserva missatges i llistes d'atributs; el controlador; un punt de connexió en tots dos sentits; els busos; la seqüència de preparació i activació; `process` amb búfers de bus | 650 | la cara CLAP, la taula de ports, les còpies de branques, el registre de refusos |
| un instrument MIDI | cap entrada MIDI directa: les notes arriben com a esdeveniments en una llista que l'amfitrió implementa i reserva per endavant; els controladors, la inflexió de to i la pressió esdevenen canvis de paràmetre a través d'una assignació MIDI | 300 | els ports de notes i les funcions MIDI |
| fils | cap worker: cada crida té el seu fil; les edicions del controlador arriben al fil principal i han d'arribar al `process` següent com a cues de paràmetres; els canvis de sortida tornen enrere | 400 | l'anell de missatges, el buidatge de paràmetres, la vigilància de latència |
| estat | un objecte de flux de bytes; un estat CLAP té dos blocs, component i controlador; restaurar només després de `setupProcessing` | 200 | el lector d'estat i la restauració diferida |
| un canvi de freqüència | desactivar, preparar amb la nova freqüència i el nou bloc, activar: sense tornar a instanciar | 60 | la regla d'activar i conservar |
| busos auxiliars i de cadena lateral | busos auxiliars després dels principals; les disposicions d'altaveus es corresponen amb tipus de port i mapes de canals CLAP | 200 | la taula de ports, les extensions envolupant i ambisònica |
| paràmetres | nombre i informació amb indicadors de bypass i de només lectura, valors normalitzats, conversió a text, cues precises a la mostra | 250 | la cara de paràmetres i el contracte |
| descobriment i refusos | un codi per refús i una exploració que no cal que obri el binari quan hi ha `moduleinfo.json` | 150 | el vocabulari de refusos, la comptabilitat de la fàbrica |
| **part del format, total** | | **unes 2200** | |

## La prova

Una sonda en C11 va obrir la versió VST3 per a Linux d'un compressor LSP del paquet de la distribució, en va llegir la
fàbrica, va crear el plugin, en va llistar els busos i els paràmetres, en va fer anar i tornar l'estat i va processar un bloc
de silenci i vuit de soroll.

| pas | resultat |
|---|---|
| mòdul | entrada correcta; 388 classes (194 mòduls d'àudio, 194 controladors) |
| component i controlador | un controlador separat; tots dos inicialitzats; connectats en tots dos sentits |
| busos | una entrada i una sortida principals estèreo; la variant amb cadena lateral hi afegeix una entrada auxiliar i processa passant-li només el bus principal |
| paràmetres | 48, amb el bypass marcat com a tal; noms, unitats i text per defecte a través de la conversió a text |
| estat | 517 bytes; escriure i després llegir, idèntic byte a byte |
| procés | silenci d'entrada, silenci de sortida; soroll d'entrada a -6,04 dBFS de pic, sortida a -6,57 |
| C++ necessari | cap: C11 i l'API C |
| mida | 477 línies de codi, 257 de les quals són els objectes COM de l'amfitrió |

En van sortir tres regles, que l'adaptador hauria de portar:

1. **L'amfitrió ha de reservar els objectes de missatge.** El plugin va demanar un missatge a l'aplicació amfitriona durant
   `setState` i fallava si se li refusava; la biblioteca d'allotjament en C++ de l'SDK ho amaga i en C són 147 línies.
2. **Restaurar l'estat només després de `setupProcessing`.** L'especificació permet `setState` abans, però el plugin hi feia
   servir la freqüència de mostratge, que encara valia zero.
3. **Una instància que ha fallat pot enverinar la següent.** El plugin guarda un catàleg a la memòria compartida; una fallada
   va deixar aquell fitxer buit i totes les instàncies posteriors morien en llegir-lo, fins que es va esborrar el fitxer. Fer
   córrer cada plugin en un procés worker propi, com fa plugin-hostd, conté una fallada així.

## El pla de proves, si es fa

- Una petita peça de prova VST3 per a cada comportament, escrita en C contra l'API C, com fan les proves LV2, perquè la CI
  continuï hermètica i cada refús es provi expressament.
- Les versions VST3 dels repositoris de la distribució com a plugins reals.
- Paritat: el mateix plugin com a VST3, LV2 i CLAP a través de l'amfitrió, alimentat amb el mateix soroll llavorat i el
  mateix escombratge, comparat mostra a mostra; passa si el residu és almenys 100 dB per sota o si la diferència té nom. La
  correspondència de paràmetres es compara de la mateixa manera.
- El testimoni de reserves al voltant del camí `process` de VST3.
- El catàleg enverinat com a prova de regressió: un refús amb un codi del worker, mai un motor mort.

## Es podria allotjar

| àrea | es pot? | per què |
|---|---|---|
| llicència | sí | MIT i BSD-3-Clause es combinen en GPL-3.0-or-later; "VST" no pot aparèixer en un nom de producte |
| C++ | sí, en C | l'API C; la prova és C11 sense libstdc++ |
| regles de temps real | sí | `process` corre al fil de procés; l'amfitrió reserva per endavant les llistes de paràmetres i d'esdeveniments |
| fils | sí | les crides del "fil d'interfície" corresponen al fil principal de l'amfitrió; no hi ha worker |
| sense pantalla | sí per al plugin provat, no per a tots | la prova va córrer sense pantalla; el validador de Steinberg va fallar en el mateix contenidor sense pantalla |
| activació de codi tancat | depèn del fabricant | l'activació per número de sèrie o fitxer de clau funciona sense pantalla; l'activació dins de l'editor del plugin necessita una sessió gràfica una vegada; iLok no té client per a Linux |
| contenció de fallades | sí | plugin-hostd fa córrer cada plugin en un procés worker propi |

Dels 14 fabricants de codi tancat que distribueixen versions VST3 per a Linux (una revisió de les pàgines dels fabricants,
feta per a aquesta nota), 8 també distribueixen CLAP o LV2, que l'amfitrió ja accepta. Els 6 que són només VST3 a Linux són
ToneBoosters, Loomer, Renoise (Redux), Tracktion (BioTek 3, F'em), Bertom Audio i DDMF.

## Per què ara no i què ho faria canviar

La demanda és escassa, el cost és d'unes 6200 línies i escriure l'adaptador confirmaria la costura dibuixada abans més que
no pas en descobriria una de nova: cada tasca VST3 correspon a un grup de funcions de la capa que ja existeix. Mentrestant, el
codi nou de la capa manté les funcions neutrals lliures de crides LV2, perquè tallar la costura continuï sent barat.

Qualsevol d'aquestes coses torna a obrir la decisió:

1. Un plugin concret només VST3 que valgui la pena allotjar: una versió per a Linux x86-64, cap versió LV2 ni CLAP, una
   activació que funcioni sense el seu editor i unes condicions que permetin un amfitrió de tercers. Tres peticions així
   n'argumenten la necessitat; una n'hi ha prou si cobreix un paper que no cobreix res del que s'allotja.
2. Un segon adaptador que no sigui CLAP aprovat per un altre motiu: aleshores primer es talla la costura, sigui quin sigui el
   format.
3. Un fabricant que avui distribueix tots dos formats deixa CLAP i LV2 a Linux per a un plugin que s'allotja.
