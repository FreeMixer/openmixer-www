# openmixer-www

The website and documentation of openmixer, a software mixing console for Linux. It holds the
operator manual and FAQ, how the console is built, and the reference for its REST interface
and code, all generated from the openmixer sources so they never drift from the console.

- The manual and FAQ: install, hardware, administration and troubleshooting, written for the person running the desk.
- A generated REST reference: every entity the console serves, with the paths and fields it really has.
- A generated API reference for the code, and an explanation of how the console is put together.
- Every feature is labelled by how far it has been proven: driven on the rig, measured in audio, or still landing.
- Plain static files, no server behind it. Licence: GPL-3.0-or-later, as openmixer.

## Read it

The site is live at <https://freemixer.github.io/>: start at Features, then the manual under
Docs.

## Install

The site itself is not installed. The FreeMixer tools that openmixer builds on are, from our
packages.

Fedora:

```
sudo dnf config-manager addrepo --from-repofile=https://freemixer.github.io/rpm/freemixer.repo
sudo dnf install plugin-hostd omx-clap-host
```

Debian and Raspberry Pi OS: add the apt line from <https://freemixer.github.io>, then
`sudo apt install plugin-hostd omx-clap-host`.

Building from source: see [BUILDING.md](BUILDING.md).
