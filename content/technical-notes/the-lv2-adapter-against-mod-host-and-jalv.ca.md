---
title: "L'adaptador LV2 comparat amb mod-host i jalv: mida i estructura"
summary: L'adaptador LV2 que presenta un plugin LV2 com un plugin CLAP fa les mateixes crides a lilv i en el mateix ordre que mod-host i jalv. El seu codi és més petit i té menys branques que el nucli de mod-host i és 1,4 vegades el de jalv; gairebé tota aquesta diferència són funcions que el contracte CLAP exigeix i que jalv no ofereix.
measured: L'adaptador LV2 d'omx-clap-core, mod-host 0.10.6 i jalv 1.10.0 (jalv 1.8.0 per a la prova de cobertura), octubre del 2026; mides amb scc 3.5.0 i lizard 1.24.1.
topic: core
order: 160
---

## Què es compara

| subjecte | què es mesura |
|---|---|
| l'adaptador | `lv2/core` i `lv2/clap` d'omx-clap-core; "amb la infraestructura" hi afegeix les sis capçaleres de la biblioteca que inclou |
| mod-host | el seu `src/`, sense el protocol de sòcol, la línia d'ordres, el completador ni el client de monitoratge i sense les biblioteques que incorpora |
| jalv | el seu `src/`, sense `main.c`, els motors JACK i PortAudio ni les interfícies d'usuari |

mod-host i jalv són aplicacions, cadascuna amb un motor d'àudio (JACK) i una interfície de sòcol o d'usuari. L'adaptador és
una biblioteca: presenta un plugin LV2 com un plugin CLAP i no té cap motor. Mesurar els nuclis dels amfitrions sense les
seves interfícies ni els seus motors manté comparables els tres. El script que els mesura, `tools/hosting-compare.sh`
d'omx-clap-core, clona els subjectes i imprimeix totes les taules d'aquí sota.

## Mida

| subjecte | fitxers | línies | codi | comentaris | funcions | dependències externes | funcions públiques |
|---|---:|---:|---:|---:|---:|---:|---:|
| l'adaptador | 8 | 7657 | 5648 | 1160 | 273 | 4 | 90 |
| amb la infraestructura | 14 | 9224 | 6591 | 1609 | 316 | 5 | 90 |
| mod-host | 20 | 11248 | 8164 | 1341 | 165 | 4 | 84 |
| jalv | 47 | 5492 | 3970 | 631 | 127 | 5 | 90 |

Les dependències externes són les arrels d'inclusió diferents: l'adaptador `clap lilv lv2 omxcontract`; mod-host `jack lilv
lv2 mach`; jalv `lilv lv2 serd sratom zix`.

## Complexitat

Complexitat ciclomàtica per funció (lizard):

| subjecte | funcions | CCN mitjana | CCN p95 | CCN màxima | CCN per sobre de 15 | línies mitjanes per funció |
|---|---:|---:|---:|---:|---:|---:|
| l'adaptador | 273 | 6,38 | 19 | 86 | 20 | 17,2 |
| amb la infraestructura | 316 | 6,60 | 19 | 86 | 26 | 17,2 |
| mod-host | 165 | 9,08 | 28 | 127 | 18 | 40,9 |
| jalv | 127 | 3,62 | 9 | 21 | 1 | 19,4 |

Les funcions amb més branques són `instance_make` de l'adaptador (CCN 86), `plugin_process` (62), `read_ports` (57) i
`read_side` (50); `effects_add` de mod-host (127, 736 línies), `ProcessPlugin` (122), `effects_remove` (70) i
`RunPostPonedEvents` (68); `jalv_open` de jalv (21).

Línies de codi per àrea (funcions classificades pel nom, el nombre entre parèntesis; és una aproximació, perquè el codi de
dins d'una funció gran es compta a l'àrea d'aquella funció):

| àrea | l'adaptador | mod-host | jalv |
|---|---:|---:|---:|
| worker | 88 (8) | 78 (6) | 153 (11) |
| estat, presets i camins d'estat | 522 (34) | 456 (17) | 177 (8) |
| CV | 8 (2) | 197 (2) | 0 (0) |
| grups de ports, disposicions, auxiliars | 236 (14) | 0 (0) | 0 (0) |
| contracte CLAP, paràmetres, descriptor | 413 (30) | 201 (6) | 0 (0) |
| latència, freqüència, canvi de bloc | 157 (17) | 7 (1) | 46 (1) |
| àtoms, esdeveniments, MIDI | 945 (51) | 1820 (50) | 599 (41) |
| ports i connexió | 386 (14) | 287 (11) | 313 (13) |
| errors i refusos | 114 (9) | 141 (3) | 64 (4) |
| cicle de vida i aturada | 291 (14) | 402 (10) | 188 (12) |
| execució, procés | 164 (2) | 678 (3) | 54 (2) |
| instanciació | 1103 (44) | 1339 (12) | 470 (12) |
| altres | 278 (34) | 1141 (44) | 399 (23) |

## Les mateixes tasques en tots tres

- **Instanciar i connectar un efecte estèreo.** Tots tres llegeixen el plugin amb lilv, l'instancien i en connecten els
  ports. L'adaptador jutja el plugin per la seva descripció i el refusa amb un codi abans d'obrir cap binari i connecta
  cada port una sola vegada, a memòria que és de la instància, copiant l'àudio d'entrada i de sortida a cada bloc. mod-host
  també copia; jalv connecta el búfer de JACK directament a cada cicle.
- **Un instrument MIDI en un port d'àtoms.** Tots tres escriuen els esdeveniments d'entrada en un búfer d'esdeveniments
  abans de `run` i llegeixen els de sortida després. La sortida de l'adaptador queda limitada per la seva pròpia capacitat.
- **L'extensió worker.** El mateix disseny en tots tres: un anell de peticions, un fil, un anell de respostes que es buida
  abans de `run` i després `end_run`. El de l'adaptador fa 88 línies contra 78 i 153.
- **Desar i restaurar l'estat.** Tots tres passen per `lilv_state_*`. L'adaptador restaura en calent un plugin que declara
  `state:threadSafeRestore` i, si no, guarda l'estat i l'aplica a la propera activació; jalv atura el fil d'àudio. L'adaptador
  confina el `make_path` d'un plugin al seu directori d'estat i refusa un camí que en surti.
- **Un canvi de freqüència de mostratge.** CLAP pot tornar a activar un plugin a una altra freqüència, de manera que
  l'adaptador ho diu al plugin a través d'`options:interface` quan pot i el torna a instanciar quan cal. Cap dels dos
  amfitrions JACK no gestiona un canvi de freqüència en marxa: tots dos llegeixen la freqüència una sola vegada. Tots tres
  gestionen un canvi de longitud de bloc.
- **Ports CV i auxiliars.** L'adaptador agrupa els ports auxiliars, CV i envolupants per `pg:group` i designació i els
  ofereix com a ports d'àudio CLAP. mod-host exposa els ports CV com a ports JACK i com a font de control; jalv com a ports
  d'àudio amb metadades CV. Cap dels dos no converteix un grup de ports en un bus.

## On l'adaptador és més gran i per què

- **Refús abans d'instanciar**, amb un codi per a cada motiu: cada plugin es jutja per la seva descripció abans d'obrir-ne el
  binari. És el contracte d'allotjament.
- **La cara CLAP**: la taula de paràmetres, les seves correspondències de text i valor, el contracte i el descriptor (413
  línies), que els altres no necessiten.
- **Un canvi de freqüència o de bloc en marxa** (157 línies contra 7 i 46).
- **Disposicions, auxiliars, cadena lateral i so envolupant** com a ports d'àudio CLAP (236 línies contra cap).
- **Estat**: restauració en calent i diferida, camins confinats i descobriment de presets CLAP (522 línies contra 456 i 177).
- **Un camí d'execució sense bloquejos ni reserves de memòria**, demostrat per un testimoni de reserves a les proves; el
  camí d'execució de jalv és igual en això.

Comparat amb jalv, l'adaptador té 1,42 vegades el codi i 1,76 vegades la complexitat mitjana. Les quatre àrees que jalv no té
(la cara CLAP, les disposicions i els auxiliars, el canvi de freqüència i la part de l'estat que va més enllà de la de jalv)
sumen 1151 línies, que cobreixen la major part de la diferència de 1678 línies.

La complexitat accidental és en tres funcions: `instance_make` connecta els ports provant cada rol per a cada índex de port,
`plugin_process` repeteix el mateix bucle "canal de l'amfitrió o silenci" per a cada tipus de branca i `read_ports` i
`read_side` tenen cadascuna la regla de cada tipus de port en una sola funció. Construir una taula de rols quan es llegeix
la descripció, una sola funció auxiliar per branca i un classificador per tipus de port n'eliminarien la major part, amb les
proves de refús i de reserves existents com a protecció.

## Cobertura

La mateixa pregunta als tres amfitrions: dels 979 plugins LV2 instal·lats en una màquina Fedora 44, quants n'instancia i
n'activa cada amfitrió en un graf en marxa? Un espai de noms privat amb el seu propi PipeWire a 48 kHz, un plugin cada
vegada, deu segons per resposta. Allotjat vol dir admès, instanciat i activat; no afirma que l'àudio sigui idèntic.

| amfitrió | allotjats | no allotjats |
|---|---|---|
| l'adaptador, a través d'omx-clap-host | 979 de 979 | cap |
| mod-host 0.10.6 | 975 de 979 | drumkv1 (SIGABRT), samplv1 i synthv1 (l'amfitrió es va aturar a `add`), zynadd (`resp -102`) |
| jalv 1.8.0 | 977 de 979 | zynadd (un port MIDI d'un tipus que no coneix), synthv1 (SIGABRT en instanciar) |

## En resum

Els tres amfitrions fan les mateixes crides a lilv i en el mateix ordre: instanciar, connectar, un worker de dos anells i un
fil i l'estat a través de `lilv_state_*`. L'adaptador és més petit i té menys branques que el nucli de mod-host en totes les
mesures d'abans i és 1,4 vegades jalv, on la diferència són gairebé totes funcions que el contracte CLAP exigeix.
