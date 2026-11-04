---
title: Per què la majoria dels plugins LV2 d'un Zynthian necessiten grups de ports inferits
summary: La meitat dels plugins LV2 instal·lats en un Zynthian tenen més de quatre controls i cap grup de ports i la pantalla tàctil els talla en pantalles de quatre en l'ordre dels ports. Un paquet generat que substitueix la descripció del plugin, mai els seus fitxers, hi pot afegir grups que llegeixen tots els consumidors de Zynthian.
measured: Una Raspberry Pi 5 amb ZynthianOS Vangelis-2610.1, octubre del 2026.
topic: zynthian
order: 60
---

## La mancança mesurada

En una imatge de Zynthian (ZynthianOS Vangelis-2610.1) hi ha 1243 plugins LV2 instal·lats amb controls i només 105
declaren grups de ports. 623 no tenen grups i tenen més de quatre controls, de manera que la pantalla tàctil els talla en
pantalles de quatre, en l'ordre dels ports, siguin quins siguin els controls.

## On llegeix cada consumidor de Zynthian

- **MOD-UI** troba una MOD GUI en qualsevol fitxer carregat el subjecte del qual és l'URI del plugin. Per això ja funciona
  un paquet de GUI generat a part.
- **El motor de la pantalla tàctil** llegeix els ports a través de lilv. En cada port llegeix `pg:group` i en el node del
  grup `lv2:symbol` (obligatori: sense ell tots els ports cauen en un sol grup "params"), `lv2:name` (o, si no hi és,
  `rdfs:label`) i `lv2:displayPriority`. Les pantalles de quatre es tallen per grup, ordenades per prioritat de
  visualització. Mai no llegeix `pg:mainInput`, `lv2:portGroups`, `units:unit` ni `rdfs:comment` en un port i no existeix
  cap fitxer de disposició indexat per URI de plugin o per símbol de port. El nom, el tipus, la categoria i la descripció
  del plugin es desen per URI després de la primera exploració, de manera que una descripció canviada necessita una
  regeneració des de la configuració web.

## Per què un paquet afegit no pot completar un plugin

lilv ignora un segon paquet que declara un plugin que ja ha carregat ("Duplicate plugin ... ignored") i els ports d'un
plugin són nodes anònims, de manera que un fitxer a part no té res d'estable on lligar `pg:group`. Provat amb un petit
plugin d'envolupant, els grups van quedar buits.

## El canal que funciona: un paquet que substitueix

La regla dels duplicats de lilv és una comparació de versions, no un refús pla: un segon paquet per al mateix URI
**substitueix** el que ja s'ha carregat quan el seu `lv2:minorVersion` o `lv2:microVersion` és més nou; un d'igual o més
antic es descarta. La prova que va trobar els grups buits feia servir una versió igual.

Per tant, per a un plugin que no és d'OpenMixer, el paquet complementari és un paquet generat que:

- reprodueix sencera la descripció del plugin (cada port, cada paràmetre, tal com els declara el plugin), llegida amb
  l'analitzador de Turtle, mai reescrita a mà;
- manté `lv2:binary` apuntant a la biblioteca instal·lada del plugin: cap intermediari;
- augmenta en un el `lv2:microVersion` instal·lat, perquè lilv el carregui i descarti l'original;
- afegeix nodes de grup, cadascun amb `lv2:symbol`, `lv2:name` i `lv2:displayPriority`, lligats als ports reproduïts **pel
  símbol del port**: els símbols són estables, els nodes anònims no;
- porta un fitxer de marca al costat, perquè una execució posterior distingeixi la seva sortida del paquet del plugin i no
  toqui mai els fitxers instal·lats del plugin.

Esborrar el paquet marcat restaura l'original: lilv no té res de més nou per preferir i torna a carregar els fitxers del
plugin. Un plugin que ja declara els seus propis grups es deixa tal com és, sense marca i sense generar res.

## Quins grups

Els grups s'infereixen automàticament, sobre tots els plugins instal·lats en el moment d'instal·lar, mai amb una disposició
feta a mà per a cada plugin. Les regles, per ordre: els grups parcials del mateix plugin; `lv2:designation`; un prefix
comú de nom o de símbol ("Band 1 …", `b1_`); una unitat comuna; una tirada contigua d'índexs de port; la disposició de la
MOD GUI del plugin si en té. Un plugin que les regles no poden agrupar amb seguretat no rep cap paquet complementari, mai una
disposició endevinada.

Les regles i l'escriptor del paquet els especifica omx-panel: [inferència de grups](/projects/omx-panel/group-inference) i
[el paquet complementari LV2](/projects/omx-panel/lv2-complement).

## Quan cal un intermediari

Un paquet intermediari, amb URI, ports i grups propis i una capa que reenvia l'àudio, els paràmetres i l'estat a
plugin-hostd, és només l'excepció: per a un plugin la descripció del qual l'analitzador de Turtle no pot llegir, el camp de
versió del qual ja és al màxim o els fitxers del qual declaren més d'un subjecte per al mateix URI.

## Què ho demostra a l'aparell

1. lilv, carregat després del generador, veu els grups inferits en un plugin que ha coincidit amb les regles i el paquet
   original ha perdut la substitució.
2. El lector de ports de Zynthian retorna aquests grups i la pantalla tàctil mostra les pantalles esperades.
3. Un plugin que declara tots els seus grups es carrega exactament com abans: sense marca, els mateixos bytes.
4. Esborrar un paquet marcat torna els fitxers originals del plugin.
5. Un plugin completat així continua corrent per plugin-hostd sense canvis: l'addició, els paràmetres i l'estat funcionen com
   en qualsevol plugin LV2.
