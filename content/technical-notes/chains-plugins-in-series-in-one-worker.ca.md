---
title: "Cadenes: plugins en sèrie en un sol worker i el membre que falla, en quarantena"
summary: Una cadena fa córrer en ordre els plugins d'un canal dins d'un sol procés worker, de manera que es desperten una vegada per cicle i no una cadascun; quan un membre falla, només aquest queda en quarantena i la resta de la cadena continua.
measured: plugin-hostd amb omx-clap-host, octubre del 2026.
topic: host
order: 40
---

## Per què

omx-clap-host dona a cada plugin el seu propi client JACK i cada client és un node del graf amb el seu propi despertar a
cada cicle. La major part del temps d'un cicle se'n va en aquests despertars, no pas en els plugins (vegeu
[Un sol client JACK per a una cadena](/ca/notes/one-jack-client-for-a-chain)). Un canal amb quatre plugins en sèrie
desperta quatre nodes. omx-clap-host pot fer córrer una cadena de plugins en un sol client i cridar-los en ordre dins d'una
sola crida de procés; cal dir-li quines instàncies formen una cadena i en quin ordre i el dimoni les ha de posar en un sol
worker.

Una cadena comparteix un procés, de manera que la fallada d'un membre s'enduria els altres. plugin-hostd existeix per aïllar
fallades: el membre que ha fallat surt de la cadena i la resta continua.

## Els verbs

```
chain <chain> <instance> [<instance> ...]                resp 0
chain_clear <chain>                                      resp 0
chain_get <chain>                                        resp 0 <worker> <declared> <running>
```

`chain` declara els membres en ordre; han de ser instàncies creades amb `add`. La cadena té un sol worker, de lloc
`chain:<chain>`. Cada membre deixa el worker on era: se'n desa l'estat, el seu `remove` va a aquell worker i el worker nou
el reprodueix com en un reinici: l'addició, l'estat, el registre de verbs i les connexions, en aquest ordre. Tornar a
declarar una cadena li dona l'ordre nou; un membre que hi queda fora torna a un worker propi. `chain_clear` dona a cada
membre un worker propi i oblida la cadena.

`chain_get` llegeix una cadena: el seu worker, els membres en l'ordre declarat i els que el worker fa córrer ara. Un membre
en quarantena és a la llista declarada i no a la que corre. És la comprovació del controlador que una addició, un moviment
o una retirada han arribat.

Una cadena que es torna a declarar mentre el seu worker està en marxa conserva aquell worker i els membres que s'hi queden
no es reinicien. Un membre que en surt va a un worker propi; un membre nou deixa el seu worker antic i s'afegeix al que
corre amb la seva addició, només el seu estat, els seus verbs i les seves connexions; i al worker se li envia l'ordre nou.
Un moviment, un ordre nou sense cap membre que entri ni surti, envia l'ordre i res més. La cadena només es torna a formar de
zero quan el seu worker no està en marxa, quan un membre se n'ha separat o s'hi torna a afegir o quan un membre LV2 que
s'hi afegeix necessita un paquet amb què no es va construir el món del worker en marxa.

## Quins membres poden compartir una cadena

`clap` i `lv2-clap` són dues files d'un mateix programa, omx-clap-host i totes dues fan córrer cadenes en un sol client;
per tant un membre CLAP i un membre LV2 (a través de l'adaptador LV2) formen una sola cadena. Els membres de dos programes
(LV2 a mod-host amb CLAP) es refusen amb `CHAIN_MIXED_FORMAT`.

Un refús no canvia res:

| codi | quan |
|---|---|
| `CHAIN_UNKNOWN_INSTANCE` | un membre que cap `add` no ha creat |
| `CHAIN_DUPLICATE` | la mateixa instància dues vegades a la llista |
| `CHAIN_INSTANCE_BUSY` | un membre que ja és en una altra cadena |
| `CHAIN_MIXED_FORMAT` | membres que un mateix programa worker no fa córrer junts |
| `PLACEMENT_INVALID` | un membre el plugin del qual no pot compartir worker mentre `require_pins` està activat |
| `NO_SUCH_CHAIN` | `chain_clear` d'una cadena que cap `chain` no ha declarat |

Una cadena d'un sol membre és vàlida: un plugin aïllat és una cadena com qualsevol altra.

## Què se li diu al worker

A un worker que fa córrer cadenes en un sol client se li envia la mateixa línia `chain` després de les addicions de la
reproducció. Un worker que no ho fa (mod-host) té els membres en un sol procés i les connexions en donen l'ordre. El
bypass, els paràmetres i tots els verbs d'instància continuen anomenant una instància pel seu número; el dimoni els
encamina al worker de la cadena.

## Una fallada

Per al supervisor, el worker d'una cadena és un grup de workers compartit i atribueix una mort de la mateixa manera:

- Quan la mort assenyala un culpable (el verb en curs o un sospitós recent), el culpable queda en quarantena
  (`instance_quarantined <instance> <worker>`) i passa a un worker propi. El worker de la cadena es reinicia amb els altres
  membres en el seu ordre i `chain_formed <chain> <worker> <instance>,...` diu l'ordre que corre ara.
- Quan no n'assenyala cap, els membres se separen, cadascun en un worker propi. El membre que torna a morir tot sol és el
  culpable: queda en quarantena i els altres tornen a la cadena en el seu ordre.

Un membre en quarantena conserva el seu lloc en l'ordre declarat. `quarantine_clear` el torna a posar i el worker de la
cadena es torna a formar amb tots els membres que no són en quarantena. `remove` d'un membre el treu de la cadena; una
cadena a la qual es treu l'últim membre s'oblida.

## Cadenes LV2 amb require_pins

Una empremta LV2 només és vàlida en un món reduït al paquet del mateix plugin. Per això el worker d'una cadena rep un món
reduït a la unió dels paquets dels seus membres, de manera que l'empremta de cada membre hi continua sent vàlida. Un membre
el paquet del qual no es troba deixa el món sense construir en lloc d'eixamplar-lo i `chain` refusa la cadena amb
`PLACEMENT_INVALID` abans que res no es mogui.

Un món reduït al paquet d'un sol membre és la fallada que cal evitar: en un banc de proves de vuit plugins LV2 encadenats
a través de l'adaptador, un membre amb un `LV2_PATH` d'un sol paquet responia `resp -101` (cap plugin amb aquell uri). Una
prova forma una cadena de dos membres LV2, comprova que l'`LV2_PATH` del worker té exactament els dos paquets i un sabotatge
que redueix el món al primer paquet l'ha de fer sortir vermella.
