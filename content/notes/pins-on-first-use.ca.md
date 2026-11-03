---
title: "Empremtes al primer ús: com plugin-hostd es refia del binari d'un plugin"
summary: plugin-hostd enregistra el resum dels fitxers d'un plugin i de la disposició dels seus paràmetres la primera vegada que s'afegeix, els comprova en cada addició posterior i ho refusa en veu alta quan canvien; així un amfitrió autònom té empremtes sense que cap controlador les hi enviï.
measured: plugin-hostd 0.3.0 i posteriors.
topic: host
order: 30
---

## Per què

Mentre `require_pins` està activat, un plugin sense empremta es refusa (-508): el primer `add` d'un usuari autònom
fallaria si cap controlador no hagués enviat abans `pin_set`. Un amfitrió que no fa empremtes pel seu compte hauria de
desactivar `require_pins` i aleshores no es comprovaria cap empremta. Per això l'empremta es pren al primer ús i es
conserva i qualsevol canvi posterior es fa sentir.

Un plugin extern no porta empremtes pròpies i el seu registre de qualificació és una prova, no una empremta. Només es
distribueix un fitxer d'empremtes per als binaris dels paquets d'OpenMixer i un registre amb el veredicte `refused`
refusa l'addició.

## Paràmetres

| clau | per defecte | significat |
|---|---|---|
| `pin_mode` | `first-use` | `strict` o `first-use`; només es llegeix mentre `require_pins` val 1 |
| `pin_store` | buit | el fitxer on es guarden les empremtes apreses; buit vol dir `$XDG_STATE_HOME/plugin-hostd/pins`, si no `$HOME/.local/state/plugin-hostd/pins` |
| `pin_file` | buit | un fitxer d'empremtes que es carrega en arrencar, escrit per `plugin-qualify --all --pins` |

`require_pins 0` continua volent dir que no es comprova cap empremta. `strict` és el comportament d'abans: un plugin sense
empremta es refusa amb -508. Un amfitrió que fa empremtes pel seu compte posa `pin_mode strict`.

## Un sol format de línia

El magatzem d'empremtes, el fitxer d'empremtes i el verb `pin_set` porten la mateixa línia:

```
pin_set <uri> <path>=<sha256>[,<path>=<sha256>...] <scheme>:<sha256> [verdict=<word>]
```

- En un fitxer el `pin_set` inicial és opcional, `#` comença un comentari i les línies buides se salten.
- La paraula de disposició és `-` mentre la disposició no s'ha après. `pin_set` com a verb refusa `-`.
- `verdict=` és el veredicte de qualificació dels bytes amb empremta: `in-process`, `isolated` o `refused`. Si no hi és, el
  plugin no està qualificat.

El magatzem només guarda les empremtes que el dimoni ha après o acceptat. Una empremta arribada per `pin_set` o `pin_file`
és del controlador: no s'escriu al magatzem i, mentre el dimoni corre, substitueix la que hi hagi guardada del mateix uri.
El magatzem s'escriu en un fitxer temporal del mateix directori i es reanomena, amb permisos 0600.

## Primer ús

Un `add` en mode `first-use` sense empremta per a l'uri:

1. El dimoni recull els fitxers que el format carrega per al plugin, en calcula el resum sobre descriptors oberts i
   enregistra una empremta amb disposició `-` i sense veredicte. D'una recollida fallida no s'accepta res: l'addició es
   refusa amb -509 i no s'enregistra cap empremta.
2. La instància es col·loca en un worker propi, demani el que demani la col·locació. Compartir procés demana el veredicte
   `in-process` a l'empremta i una empremta apresa no en té.
3. Quan el worker ha acceptat l'addició, el dimoni li demana la disposició dels paràmetres (`pin_layout <instance>`), la
   desa a l'empremta i escriu el magatzem. Un worker que no coneix el verb deixa la disposició a `-`; els fitxers es
   continuen comprovant en cada addició posterior.

Les addicions posteriors comproven l'empremta guardada com fa `strict`: els fitxers es resumeixen abans que cap worker vegi
l'addició i la disposició es passa al worker amb `pin_expect`. Una addició repetida (un worker que es reinicia) mai no
aprèn: comprova l'empremta que té.

## Un canvi

- Si els fitxers són diferents, l'addició respon -509. Si la disposició és diferent, el worker la refusa i l'addició
  respon -510. En tots dos modes el dimoni emet `pin_changed <uri> files` o `pin_changed <uri> layout` pel port de retorn.
- L'empremta es queda com estava. Res no carrega el plugin canviat fins que el controlador decideix.
- `pin_accept <uri>` pren l'empremta nova: els fitxers es tornen a recollir i resumir, s'enregistren amb disposició `-` i
  sense veredicte, de manera que la propera addició aprèn la nova disposició i col·loca la instància en un worker propi. En
  mode `strict` es refusa: un amfitrió que fa empremtes pel seu compte canvia una empremta amb `pin_set`.

Acceptar mai no fa que un plugin vagi dins del procés: això continua sent una decisió de la qualificació.

## El fitxer d'empremtes de plugin-qualify

`plugin-qualify --all --pins <file>` escriu la mateixa línia, amb `verdict=`, per a cada plugin que ha qualificat. El dimoni
el carrega en arrencar amb `pin_file`; una línia que no pot llegir n'atura l'arrencada i en diu el número. Una sola ordre
explora, qualifica i fa l'empremta del que hi ha instal·lat; un resum corromput al fitxer fa que l'addició respongui -509.

## Un amfitrió neutral quant al format

El dimoni té una sola taula de formats i un format n'és una fila:

| capacitat | significat | lv2 | clap |
|---|---|---|---|
| `name` | la paraula que fan servir `policy_set`, `worker_env` i `worker_list` | lv2 | clap |
| `prefix`, `strip_prefix` | com diu un uri que és d'aquest format i si el worker el rep sense el prefix | `lv2:` tret; també és el format d'un uri sense prefix | `clap:` conservat |
| `worker` | el programa, segons els paràmetres | `mod_host` | `clap_host` |
| `pin_collect` | l'arrel i els fitxers que l'amfitrió carrega per a un uri | el manifest, el binari i els fitxers seeAlso del paquet | el fitxer `.clap` |
| `layout_check` | el worker accepta `pin_expect` i `pin_layout` | no | sí |
| `world_scope` | de què està fet el món del worker | un paquet (reduït) | res |
| `pin_pool` | si l'empremta deixa el plugin compartir worker | no | sí |

El protocol no anomena cap format quan es refereix a una capacitat. Una prova registra un tercer format en temps
d'execució i el porta per `add`, `param_set`, `pin_set`, `pin_check` i `remove` sense tocar el protocol; una fila a la qual
falta una capacitat es refusa amb un motiu explícit, de manera que la prova surt vermella en lloc que el dimoni la compili
en silenci.

El que fa un amfitrió autònom amb un veredicte `in-process` és decisió seva: el veredicte viatja a l'empremta.
