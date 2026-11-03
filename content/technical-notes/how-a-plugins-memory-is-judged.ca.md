---
title: Com es jutja la memòria d'un plugin
summary: La memòria d'un plugin es mesura per instància, es vigila si creix, es limita amb un límit dur i es jutja contra el pressupost de cada amfitrió, perquè cap plugin no es qualifiqui de bo en un amfitrió al qual faria mal.
measured: plugin-qualify, octubre del 2026. Els pressupostos de la Raspberry Pi són provisionals fins que es llegeixin en una Pi.
topic: qualify
order: 10
---

La memòria d'un plugin es jutja, no només s'enregistra: un plugin no s'ha de qualificar de bo en un amfitrió al
qual faria mal i una Raspberry Pi també ho és. Ho fan quatre peces: una petjada per instància, una comprovació del
creixement en el temps, un límit dur i un veredicte per perfil d'amfitrió.

## Petjada per instància

Al costat del cost de cada freqüència, el registre diu quant ha crescut la memòria resident, en KB: després
d'instanciar, després d'activar, en repòs després de processar i, per a un instrument, amb notes premudes (al mateix
nombre que el cost) i què hi ha afegit una segona instància.

La petjada de cada freqüència la pren un procés fill creat abans que existeixi cap instància, de manera que cap
instància anterior no ha fet créixer el procés i un plugin que hi mor només fa perdre la xifra d'aquella freqüència.
En CLAP, el que ha costat carregar el `.clap` se suma a la primera instància; un plugin LV2 es carrega amb la primera
instanciació. Una xifra que no s'ha pres no hi és, mai no val 0 i el registre en diu el motiu.

En surten dues xifres, escrites al costat de les brutes perquè un client sumi els mateixos nombres que ha llegit el
veredicte:

- `firstInstanceKb`: el màxim que ha ocupat una instància en qualsevol pas, amb tot el que comparteixen les seves
  instàncies.
- `perInstanceKb`: el que costa una instància més: la part pròpia de la segona instància, més les veus (notes premudes
  menys repòs). Sense una segona instància mesurada no hi ha res que separi el que es comparteix i és tota la primera.

La segona instància es mesura fins al final dels seus primers blocs, no només fins a instanciar-la: altrament, un
plugin que reserva memòria en activar-se semblaria gratuït.

El fill no hereta el bloqueig de memòria de la sonda. Una petjada llegida amb el bloqueig comptaria cada pàgina que el
plugin ha mapat, no les que ha tocat.

## Creixement en el temps

Una freqüència la memòria de la qual continua pujant per sobre d'un sostre no supera la prova de durada, amb el motiu
`leaks`. La sonda llegeix la memòria resident després d'un escalfament i un altre cop a mig camí fins al final; el
creixement es calcula de la lectura del mig a la més alta, per minut d'àudio. Mesurar només la segona meitat és el que
distingeix una biblioteca que ha acabat de carregar tard d'una fuita.

El sostre és de 10 MB per minut. És provisional, s'ajusta a partir de mesures i el motiu del veredicte diu
`provisional`.

## Un límit dur

Dos límits, cadascun amb la seva feina:

- **plugin-hostd aplica `memory.max`** (cgroup v2) al fill de la sonda que supervisa. El nucli compta el que el plugin
  ocupa de debò i en mata l'arbre al límit; el resultat és `probe.memory-limit`, llegit de `memory.events`. Una màquina
  sense el controlador delegat recorre a `RLIMIT_DATA` i ho diu al registre.
- **plugin-qualify aplica `RLIMIT_AS`** als processos que engega ell mateix. Val tota la memòria de la màquina: la fita
  llunyana d'una execució més que no pas el seu pressupost, perquè l'espai d'adreces és el que un plugin reserva, no
  el que toca. No s'aplica en una compilació amb sanititzadors, que reserva molt més del que fa servir. La primera
  reserva refusada acaba el fill amb el resultat `memory-limit-exceeded`.

En tots dos casos la cel·la porta el seu resultat i el límit, el registre s'escriu i les altres cel·les es jutgen. Un
amfitrió la cel·la del qual ha tocat el límit hi és `unknown`, en la dimensió de memòria.

## Un veredicte per perfil d'amfitrió

El pressupost d'un perfil d'amfitrió té una part per instància i una xifra per a tota la consola. Un perfil sense
pressupost no hi llegeix res, que no vol dir un pressupost de 0: `jalv`, `mod-host` i `omx-clap-host` són amfitrions
generals que no corresponen a cap màquina concreta. La memòria és una dimensió del veredicte amb els seus propis codis
(`hosting.memory.*`) i pot decidir tota sola.

`perInstanceKb` es llegeix contra la part d'una instància i `firstInstanceKb` contra la de tota la consola, de manera que
un mostrejador amb una biblioteca compartida gran pot cabre una vegada en un amfitrió petit i es llegeix bé per a dues.
Per cel·la, mana la pitjor situació:

| què s'ha llegit | qualificació | codi |
|---|---|---|
| una xifra per sobre d'un sostre | `unsuitable` | `hosting.memory.above-ceiling` (amb `provisional` quan el sostre ho és) |
| cap xifra o un motiu al costat de les xifres | `unknown` | `hosting.memory.unmeasured` |
| dins d'un pressupost mesurat | `suitable` | `hosting.memory.within-ceiling` |
| dins d'un pressupost provisional | `conditional` | `hosting.memory.within-provisional-ceiling` |

Un plugin dins d'un pressupost provisional, doncs, no hi queda qualificat: es diuen la xifra i el sostre i el
veredicte no diu que el plugin hi cap. Només ho fa un pressupost mesurat.

**El perfil de consola** és per a una màquina de 30 GiB: 16 GiB per als plugins d'una consola, la resta per al motor i
el sistema i 4 GiB per a una instància, que és també la fita amb què la sonda limita una execució.

**Una Raspberry Pi**: els perfils de 4 GB i 8 GB tenen la forma d'`omx-clap-host`, que és el que fa córrer un plugin en
una Pi. Les seves cel·les són les que Zynthian configura en una Pi: 48000 Hz i 128 mostres en una Pi 5 amb el kit V5, 256
mostres en una Pi 4 i els altres kits. Els escombratges més amplis (de 44,1 a 192 kHz, de 128 a 1024 mostres) són cel·les
de banc de proves per comparar amfitrions i cap plugin no s'hi jutja. El pressupost és tota la memòria de la placa
menys 1 GiB per al sistema i la interfície de Zynthian i la part d'una instància n'és una vuitena: 3 GiB i 384 MiB en 4
GB, 7 GiB i 896 MiB en 8 GB. Són provisionals fins que es llegeixin en una Pi.

Com que una xifra que falta es llegeix `unknown`, una consola que s'actualitza llegeix tots els plugins com a
`unknown` fins que s'han tornat a mesurar. És la regla en acció: res no diu que les xifres antigues encara hi càpiguen.

## El que encara no es mesura

El creixement en el temps d'un plugin CLAP: la sonda CLAP encara no fa una renderització contínua, de manera que
`leaks` només s'aplica als plugins LV2 i un plugin CLAP es llegeix `unsoaked`. La petjada es mesura en tots dos
formats.
