# Catalan glossary

How the Catalan site says the words a sound engineer uses. The machine-readable copy is
`i18n/glossary.json`; `npm run check:i18n` reads it and fails on any form it refuses.

## The rules

- Write Catalan, not English with Catalan words. Rebuild the sentence; never translate word
  for word.
- No comma before "i" (or "o"), unless it closes an inserted clause.
- Technical terms that Catalan sound engineers say in English stay in English, in roman, with
  no quotes and no italics. They take Catalan articles and plurals: el fader, els faders, el
  gate, els busos, un plugin, els plugins.
- Product, protocol and package names never change: OpenMixer, REAC, PipeWire, CLAP, LV2,
  omx-clap-host, plugin-hostd, dnf, apt.
- The public name is OpenMixer. The wordmark in the header stays as drawn.
- Commands, paths, code and REST paths are never translated.

## Terms that stay in English

fader, gate, compressor, limiter, bypass, plugin, bus (plural: busos), stagebox, mute, solo,
cue, send, insert, patchbay, DCA, matrix, mix, monitor, talkback, delay (the effect), reverb,
EQ, pan, xrun. Latency is latència.

## Terms with one Catalan form

| English | Catalan | Not |
|---|---|---|
| mixing console | taula de mescles | consola de mescla, taula de barreja |
| desk | taula | escriptori |
| channel, channel strip | canal | tira de canal |
| head-amp, preamp | previ | preamplificador de capçal |
| phantom power | Phantom 48V | alimentació fantasma, alimentació phantom, poder fantasma |
| track | pista | |
| recording | enregistrament | gravació |
| sample rate | freqüència de mostratge | taxa de mostra |
| meter | vúmetre | comptador |
| threshold | llindar | |
| surface (the browser UI) | superfície | |
| scene | escena | |
| show (a performance) | actuació | espectacle |
| rig | equip | |
| free software | programari lliure | software lliure |
| download | baixar | descarregar |
| browser | navegador | explorador |
