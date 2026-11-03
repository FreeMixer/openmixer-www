---
title: "El planificador d'agrupació: els mínims workers que permeten les empremtes i l'historial"
summary: Donats els plugins d'un canal en l'ordre del senyal, el planificador posa en un sol worker els plugins consecutius que poden compartir procés i deixa sols els altres, segons les seves empremtes, el seu cost i el que han fet en aquesta màquina; queda desactivat per defecte fins que el banc de proves demostri que guanya.
measured: El disseny de l'agrupació de plugin-hostd, octubre del 2026. L'agrupació està desactivada per defecte fins que el banc de proves publiqui una millora en una Raspberry Pi 5 i en un ordinador de taula.
topic: host
order: 50
---

## El problema

plugin-hostd pot fer córrer molts plugins en un sol procés i això estalvia CPU i memòria. Però una cadena és tot o res:
un controlador declara els membres d'un canal com una sola cadena i un sol membre que no pot compartir procés (sense
veredicte de qualificació o amb el veredicte `isolated`) fa que tot el canal corri amb un procés per plugin. Tampoc no
s'aprèn res del que un plugin ha fet a la màquina.

El planificador respon una pregunta diferent de la d'una cadena. Una cadena és l'afirmació del controlador: aquests corren
junts, en aquest ordre. Un pla és la resposta del dimoni a: donats aquests, en aquest ordre, quins poden córrer junts. Acaba
en les crides `chain` i `add` que el dimoni ja té; no afegeix cap manera nova de fer córrer un plugin.

## El planificador

Una funció pura de plugin-hostd: les mateixes entrades donen el mateix pla, byte a byte i mentre decideix no llegeix cap
rellotge ni cap fitxer.

**Entrades**: els membres en l'ordre del senyal (instància, uri, format); per a cadascun, la seva empremta (fitxers,
disposició, veredicte o cap), el seu cost (`coreFractionP95` a la freqüència i el quàntum del dimoni) i la latència del
registre de qualificació si n'hi ha i el seu historial en aquesta classe d'amfitrió; i la classe d'amfitrió i els
paràmetres (`group_max`, `group_cost_max`, `grouping`, `require_pins`, `pin_mode`).

**Sortida**: una llista de segments en l'ordre del senyal. Un segment és una tirada de membres consecutius que comparteixen
un worker o un membre sol. Un segment de dos o més es declara com una cadena; un segment d'un sol membre corre en un worker
propi. Cada membre que queda sol rep un codi de motiu.

Els segments són tirades de membres consecutius perquè una cadena és una sola crida en l'ordre declarat i un membre que
queda fora al mig ha de conservar el seu lloc en el camí del senyal. Així, `A B C D E` amb `C` no apte esdevé
`[A B] [C] [D E]`.

**Regles, en aquest ordre; la primera que coincideix amb un membre en decideix.**

| motiu | quan | el membre |
|---|---|---|
| `refused` | veredicte de l'empremta `refused` | no s'afegeix (-516) |
| `no-pin` | sense empremta, `pin_mode strict` | no s'afegeix (-508) |
| `no-verdict` | una empremta sense veredicte (una empremta apresa) | corre sol |
| `verdict-isolated` | veredicte `isolated` | corre sol |
| `format-world` | el seu format només fa empremtes en un món propi i no es pot construir el món unió de la cadena | corre sol |
| `history-crashed` | l'historial el marca com a fallat | corre sol |
| `history-xruns` | l'historial el marca com a causant de xruns quan està agrupat | corre sol |
| `cost-over` | el seu cost tot sol passa de `group_cost_max` | corre sol |
| `format-mixed` | el seu programa no és el del segment obert i tots dos no fan córrer cadenes en un sol client | comença un segment nou |
| `group-full` | el segment obert ja té `group_max` membres | comença un segment nou |
| `group-cost` | el seu cost fa passar el segment obert de `group_cost_max` | comença un segment nou |

Un membre amb el qual no coincideix cap regla s'afegeix al segment obert. Un plugin sense historial es jutja només per la
seva empremta i el seu cost: no tenir historial és neutral, si no, un plugin no se'n podria guanyar mai cap. `group_cost_max`
és una fracció d'un nucli; un segment és una sola crida, de manera que els costos dels membres se sumen. Un membre de cost
desconegut compta com la mediana dels costos coneguts del segment (zero si no se'n coneix cap) i els motius diuen
`cost-assumed`.

Un membre que queda sol només perquè era al costat d'un de no apte pot compartir un grup de workers amb membres així
d'altres cadenes. Un grup estalvia memòria resident, no despertars: cada membre continua sent un client JACK. Dues cadenes
no comparteixen mai un worker de cadena.

## Els verbs

El pla es fa al dimoni, perquè el motor de Zynthian (un controlador en Python) i la consola d'OpenMixer arribin a la mateixa
resposta sense haver de portar les regles.

- `plan <chain> <instance> ...` aplica el pla: els segments esdevenen cadenes i els membres sols corren sols. La resposta
  dona els segments com `i,i,i;i;i,i`. Una cadena que es torna a planificar conserva els workers en marxa dels segments que
  no han canviat.
- `plan_get <chain>` llegeix l'últim pla i el motiu de cada membre que ha quedat sol; un esdeveniment `plan_reason` porta
  el mateix quan un pla canvia.
- `plan_clear <chain>` dona a cada membre un worker propi i oblida el pla.

El paràmetre `placement` fixa el worker de cada segment al nucli d'àudio menys carregat; `plan` i `plan_get` diuen el
nucli de cada membre.

`grouping` és un paràmetre, `off` o `on`. Amb `off`, `plan` respon el pla sense aplicar-lo, amb el motiu `grouping-off`.

## L'historial

El que ha fet cada plugin en aquesta màquina, guardat per plugin, per binari i per classe d'amfitrió: la clau és l'uri, el
SHA-256 del primer fitxer amb empremta i la classe d'amfitrió (arquitectura, franja de nuclis, franja de rellotge). Un
plugin canviat comença un registre nou.

| clau | significat |
|---|---|
| `first`, `last` | la primera i l'última finestra, segons UTC |
| `windows_solo`, `windows_grouped` | finestres en un worker propi o en un worker de dos o més |
| `cpu_p95_solo`, `cpu_max_solo` | percentatge d'un nucli en una finestra, només finestres en solitari |
| `pss_mb_solo` | la memòria proporcional del worker, MiB, la finestra en solitari més gran |
| `xrun_windows_solo`, `xrun_windows_grouped` | finestres en què JACK ha comptat almenys un xrun |
| `crashes_solo`, `crashes_grouped` | morts de worker atribuïdes al plugin |
| `restarts_grouped` | morts de worker mentre n'era membre i no n'era el culpable |
| `quarantines` | vegades que ha quedat en quarantena |
| `last_crash`, `last_crash_grouped` | segons UTC |

La CPU per plugin només es guarda de les finestres en solitari: el temps del worker d'un grup no es pot repartir
honestament entre els seus membres. Una finestra dura 60 segons; una finestra en què el plugin ha estat en marxa menys de
la meitat no compta.

El fitxer és `$XDG_STATE_HOME/plugin-hostd/history` (si no, `~/.local/state/plugin-hostd/history`), amb permisos 0600,
escrit en un fitxer temporal i reanomenat. Només l'escriu el dimoni, des del seu tic de repòs i quan el supervisor atribueix
una mort. El planificador en llegeix un resum: `crashed` quan hi ha una fallada en els últims 30 dies, `raises-xruns` quan,
després d'almenys 30 finestres agrupat, la proporció de finestres agrupades amb xruns supera en 0,05 la proporció en
solitari.

L'historial és local. Conté URI, resums i comptadors: ni àudio, ni camins, ni noms d'usuari, de sessió o de preset. El
dimoni no l'envia enlloc i `history_clear` l'esborra.

**Els xruns.** JACK comunica un xrun a un client, no a un plugin i el dimoni no té cap client JACK. El worker sí que en
té, de manera que comunica `xruns <count>` pel seu port de retorn i el dimoni compta els xruns d'una finestra a tots els
membres d'aquell worker. Una finestra amb xruns d'un grup és una sospita sobre cada membre, no una prova contra un de sol:
per això el planificador compara la proporció agrupada d'un plugin amb la seva pròpia proporció en solitari en lloc de
llegir-ne un recompte absolut.

## Com ho fa servir la qualificació

`plugin-qualify adjust --history <file>` escriu un segon veredicte al costat del mesurat, per a la classe d'amfitrió de
l'historial, amb el seu motiu. El veredicte mesurat no canvia mai.

| canvi | quan | motiu |
|---|---|---|
| d'`in-process` a `isolated` | ha fallat o causa xruns agrupat, en aquesta classe | `history.crashed`, `history.xruns-grouped` |
| d'`isolated` a `refused` | tres o més fallades en solitari en 30 dies | `history.crashed-alone` |
| d'`isolated` a `in-process` | el veredicte el decidia només el cost, sis hores en solitari sense cap fallada ni reinici i el cost dins del pressupost del perfil | `history.steady` |

Una promoció no aixeca mai un veredicte decidit per la seguretat en temps real, per una funció que falta, per una fallada a
la sonda o per un `unknown`: són mesures del plugin, no d'aquesta màquina. Un veredicte `refused` no es promou mai.
L'historial només pot fer el planificador més prudent que l'empremta, mai menys.

## A Zynthian

El motor de Zynthian envia `plan` amb els membres d'un canal en lloc de `chain` quan el dimoni ho ofereix. Un sol plugin que
no pot compartir ja no desagrupa el canal, el motor mostra el motiu d'un plugin que ha quedat sol al costat del seu
veredicte al menú de plugins i un dimoni reiniciat fa el mateix pla a partir de les mateixes entrades.

## El banc de proves que decideix el valor per defecte

Els escenaris de cadenes contra processos del banc de proves `omx-bench/1`, en una Raspberry Pi 5 i en un ordinador de
taula, en quatre modes amb els mateixos plugins: `individual` (un procés per plugin), `chain` (tot el canal com una sola
cadena), `plan` (a través del planificador, amb almenys un plugin per canal que no pot compartir) i `pool`. Cada escenari
també corre amb una càrrega fixa: processos ocupats fixats als nuclis de l'amfitrió més un ús de memòria fix.

`grouping` s'activa per defecte només quan, a totes dues màquines, amb 8 i 16 plugins i a cada freqüència i quàntum
llistats, amb cada fila repetida almenys tres vegades:

1. sense càrrega, `plan` té menys processos que `individual` i no més memòria, CPU ni xruns;
2. amb càrrega, `plan` no té més xruns que `individual` i en té menys en el conjunt de la matriu;
3. `plan` no té més xruns que `chain` on una cadena és possible i es recupera d'un worker mort no més lentament que
   `chain` més enllà de la dispersió mesurada.

Si les xifres perden, l'agrupació es queda desactivada i les xifres es publiquen igualment.

## Modes de fallada

- **Un membre falla**: el culpable assenyalat queda en quarantena i passa a un worker propi, la fallada entra a
  l'historial i el pla següent el deixa sol (`history-crashed`). Una mort que no assenyala cap culpable separa els
  membres; el pla es torna a fer després de deu minuts de funcionament estable.
- **Xruns en un grup**: quan la proporció supera el marge, el pla següent deixa sols els membres més costosos. Un pla mai no
  canvia tot sol a mig cicle; s'aplica a la propera declaració, quarantena o crida `plan`.
- **Un historial il·legible** no es llegeix ni es desa i el planificador treballa només amb empremtes i costos
  (`history-unavailable`).
- **Un worker que no comunica xruns** deixa les finestres de xruns a zero i res no es marca `raises-xruns`.
- **Un pla que el dimoni no pot fer** deixa els membres com estaven i respon el codi del refús, amb el motiu
  `plan-refused:<code>`.
