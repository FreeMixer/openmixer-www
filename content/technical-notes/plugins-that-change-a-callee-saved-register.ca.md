---
title: Plugins que canvien un registre que el cridat ha de preservar
summary: Un plugin que torna amb un registre preservat canviat fa fallar l'amfitrió més tard i en un altre lloc. Ara el nucli de l'amfitrió protegeix cada crida a un plugin, n'enregistra el primer canvi i la qualificació només ofereix aquest plugin aïllat.
measured: Raspberry Pi 5 (Debian 13, arm64) i un ordinador x86-64, octubre del 2026; omx-clap-core 0.26.2.
topic: qualify
order: 20
---

## Què passa

Cada convenció de crides dona al cridat uns registres que ha de tornar tal com els ha trobat:

- aarch64: de x19 a x28, de d8 a d15, FPCR
- x86-64: rbx, rbp, de r12 a r15, els bits de control de l'MXCSR, la paraula de control de l'x87

El qui crida hi pot guardar un valor durant la crida. Un plugin que torna amb un d'aquests registres canviat en substitueix
el valor sense que res no falli en aquell moment. El dany es veu més tard, en un altre lloc.

## Com es va trobar

Quatre plugins limiters d'una mateixa col·lecció LV2, mesurats en una Raspberry Pi 5, tornaven de `run()` amb d14 i d15
canviats, a partir del bloc 227 de l'escombratge de controls del mesurador, en 386 de les seves crides. El mesurador guardava
la freqüència de mostratge a d15. La instància següent es va obrir a 0 Hz, el plugin va dimensionar un búfer a partir
d'aquella freqüència i va escriure a través d'un punter NULL: cadascun dels quatre es va enregistrar com una fallada
(SIGSEGV).

Compilat a -O0, on el compilador guarda les variables locals a la memòria i no en aquests registres, el mesurador els va
fer córrer fins al final. A -O2 fallava cada vegada. Aquesta diferència és el senyal d'un registre trepitjat.

## La protecció

El nucli de l'amfitrió crida cada funció d'un plugin a través d'una sola protecció, `omx_abi_call6` (`abi_guard.S`):

- desa els registres preservats, crida, compara i els torna a posar;
- enregistra la primera crida que n'ha canviat algun: els registres, la funció del plugin i el bloc.

Costa de 14 a 15 ns per crida en una Raspberry Pi 5 i 5,6 ns en un ordinador x86-64. Per a 24 plugins a 48 kHz en blocs
de 256 mostres, són 0,36 µs de cada bloc de 5.333 µs.

El mesurador LV2 fa totes les crides al plugin a través de la mateixa protecció, també `lilv_plugin_instantiate` i
`lilv_instance_free`. El seu registre porta `abi`, per exemple:

```
{"clobbered":true,"registers":["d14","d15"],"call":"run","block":227,"calls":386}
```

Un plugin que no ha trepitjat mai cap registre hi diu `{"clobbered":false}`.

## Què es fa amb un plugin així

El veredicte és `hosting.stability.callee-saved-clobbered`, qualificat de condicional: el plugin només s'ofereix aïllat, en
un worker propi, mai dins del procés de la consola ni en una cadena compartida. La protecció manté sencer el marc de
l'amfitrió; no protegeix l'estat dels altres plugins del mateix procés.

Un worker ho comunica pel seu port de retorn, `abi_clobber <instance> <mask> <registers> <call> <block>`, una vegada per
instància i aleshores plugin-hostd trasllada la instància, amb el seu estat, a un worker propi.

Amb la protecció, els quatre limiters es mesuren fins al final: cap reserva de memòria a `run()` i totes les freqüències
sonen. Les seves xifres d'abans de la protecció poden estar corrompudes i no es fan servir.

## El que la protecció no demostra

Un plugin que fallava sense la protecció i arriba al final amb ella, sense enregistrar cap canvi, no queda demostrat net: la
protecció canvia el marc de pila del mesurador i pot amagar un error de memòria. I un plugin que encara falla amb la
protecció i a -O0 té la causa en un altre lloc.

## Com tornar-ho a veure

La peça de prova `native/fixtures/lv2-gain.c` de plugin-qualify, compilada amb `-DFIXTURE_ABI_BREAKER`, torna del seu tercer
`run()` amb x19 i d15 canviats (rbx i r15 en x86-64), en assemblador, després que el `run()` de C hagi tornat. La prova
`src/lv2-measure-native.test.ts` el mesura fins al final i en comprova el registre.
