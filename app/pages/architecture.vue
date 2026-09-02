<!-- SPDX-License-Identifier: GPL-3.0-or-later -->
<script setup lang="ts">
useSeoMeta({
  title: 'Architecture — openmixer',
  description:
    'A technical overview of openmixer: one canonical model, one REST door with live streams, one native PipeWire node carrying the audio, and a C signal-processing core.',
});
</script>

<template>
  <div>
    <PageHero
      eyebrow="Technical overview"
      title="One model. One door. One path to audio."
      lede="This page explains how openmixer is put together and why it is put together that way. It is written for someone deciding whether to build on it, run it, or take it apart."
    />

    <!-- 1. The model -->
    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="01 — Ownership" title="The server owns console state. Clients render it." />
        <div class="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <p>
              There is one canonical mixer model — channels, faders, buses, sends,
              DCAs, the matrix, latency paths, sessions — and it is device-neutral. The
              surface, the audio engine and the I/O all plug into that model, and none
              of them assumes a particular desk. Real consoles can be attached through
              adapters, but they are one optional control path, not the product.
            </p>
            <p>
              The server holds that state authoritatively. Clients ask for changes and
              render what comes back; nothing else holds an opinion about what the desk
              is. This matters more than it sounds. A limit that lives in a client — a
              channel cap, a permitted range, a safety interlock — is advisory, and the
              next client walks straight past it. A limit that lives at the door applies
              to everything that knocks.
            </p>
            <p>
              Every client is a remote client. A laptop at front of house has exactly
              the same standing as a tablet on the wing or a phone on stage. Keeping
              them all looking at the same desk is not a feature of the product; it is
              the product.
            </p>
          </div>
          <div class="rounded border border-edge bg-surface/60 p-6 font-mono text-sm leading-relaxed text-ink-dim">
            <p class="text-ink-faint">// the whole wire</p>
            <p class="mt-3"><span class="text-accent">GET</span> /api/channel/input/9/mute</p>
            <p><span class="text-accent">PATCH</span> /api/channel/input/9/mute</p>
            <p><span class="text-accent">OPTIONS</span> /api/channel/input/9/mute</p>
            <p class="mt-3"><span class="text-accent">GET</span> /api/channel/input/9/mute?watch=1</p>
            <p class="mt-4 text-ink-faint">// one stream for the whole desk</p>
            <p><span class="text-accent">GET</span> /api/?watch=1</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. The rows -->
    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="02 — The address space" title="Every fact has an address, and the address has a grammar." />
        <div class="space-y-4 text-base leading-relaxed text-ink-dim">
          <p>
            The console publishes about eighty-five entities, and every one of them is
            reachable at a path built from the same grammar:
            <code class="rounded bg-field px-2 py-0.5 font-mono text-sm text-ink">/{root}/{kind}/{index}[/{sub}…]</code>.
            <code class="font-mono text-sm text-ink">kind</code> and
            <code class="font-mono text-sm text-ink">index</code> are two segments and
            never one, so an address stays typeable and
            <code class="font-mono text-sm text-ink">curl</code> stays a usable
            acceptance test. A console you cannot address by hand is a console you
            cannot debug at three in the afternoon with doors at seven.
          </p>
          <p>
            Each entity answers <code class="font-mono text-sm text-ink">GET</code>,
            <code class="font-mono text-sm text-ink">PATCH</code> and
            <code class="font-mono text-sm text-ink">OPTIONS</code>.
            <code class="font-mono text-sm text-ink">OPTIONS</code> is the contract: the
            writable fields, the ranges, the units and the enumerated options are
            published by the server, so a client renders the limits the wire sent it
            rather than carrying its own copy of them.
          </p>
        </div>

        <div class="mt-10 grid gap-5 md:grid-cols-3">
          <Slab title="Kinds, not separate families" tag="addressing">
            <p>
              Buses, DCAs, mute groups and matrices are not separate address spaces.
              They are <em class="text-ink">kinds</em> of channel:
              <code class="font-mono text-xs text-ink">/channel/aux/3</code>,
              <code class="font-mono text-xs text-ink">/channel/dca/2</code>,
              <code class="font-mono text-xs text-ink">/channel/muteGroup/1</code>,
              <code class="font-mono text-xs text-ink">/channel/main/1</code>.
            </p>
            <p>
              Collapsing them removed most of the protocol's duplication through an
              addressing decision rather than a refactor, and it is why MAIN and the
              buses are ordinary strips with no master-only machinery behind them.
            </p>
          </Slab>
          <Slab title="The contract generates the URLs" tag="derivation">
            <p>
              A row does not mint its own address space and does not mint its own path.
              Both are derived from the contract and the console's configuration, so
              the shape of the API is a consequence of the declaration rather than a
              thing maintained alongside it.
            </p>
            <p>
              The console currently registers 183 path templates, 58 of them under
              <code class="font-mono text-xs text-ink">/channel</code>.
            </p>
          </Slab>
          <Slab title="Declared means served" tag="invariant">
            <p>
              An entity that the design declares is an entity the server answers. There
              is no backlog of names that exist on paper and 404 on the wire, and the
              two directions are checked against each other automatically rather than
              by inspection.
            </p>
            <p>
              A control nothing can name is not a small defect — it is a control that no
              surface, script or automation can ever reach.
            </p>
          </Slab>
        </div>
      </div>
    </section>

    <!-- 3. Streams -->
    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="03 — Live state" title="A stream is not a different resource." />
        <div class="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <blockquote class="border-l-2 border-accent pl-5 font-display text-xl leading-snug text-ink">
              A stream is not a different resource. It is the same resource, still
              being sent.
            </blockquote>
            <p class="mt-6 text-base leading-relaxed text-ink-dim">
              Any <code class="font-mono text-sm text-ink">GET</code> takes
              <code class="font-mono text-sm text-ink">?watch=1</code> and becomes a
              server-sent event stream. The rule under it is testable in one line: a
              stream on URL R emits exactly the JSON that
              <code class="font-mono text-sm text-ink">GET R</code> returns. There is no
              second schema, no event vocabulary to learn, and no chance of the two
              drifting apart.
            </p>
            <p class="mt-4 text-base leading-relaxed text-ink-dim">
              Every stream opens with a full snapshot, so a client that has just
              connected and a client that has been up all night are looking at the same
              desk. After that, a change is a patch on a row — never a reconnect.
            </p>
          </div>
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <p>
              The root stream carries every committed change on one connection. That is
              deliberate: a browser allows only six connections to an origin, and a
              surface that opens a stream per panel spends them all and then queues
              every subsequent request forever.
            </p>
            <p>
              A handful of query parameters are clamped by the server rather than
              trusted from the client. One of them earns its place with a measurement:
              asking for a reduced number of analyser bands reduces the FFT at the
              source instead of after the wire, which is the difference between 372 KB
              and about 13 KB per frame.
            </p>
            <p>
              There is no WebSocket. One door, one wire, one vocabulary — and the
              honest counterweight, since this page is not a sales brochure: proxy
              buffering is the real argument against server-sent events. Its failure
              mode is that things work but stutter, which at least you can see.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. Southbound -->
    <section class="border-b border-edge bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="04 — How state reaches audio" title="One declaration, both directions." />
        <div class="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <p>
              A resource declares four things: its identity, its one state, its writable
              fields, and its projection to audio. From that single declaration the
              system derives the read, the write, the published contract, the broadcast
              frame <em class="text-ink">and</em> the actuation that reaches the engine.
            </p>
            <p>
              Deriving both directions from one declaration is the load-bearing choice.
              When the northbound and southbound halves are written separately, they
              agree only as long as someone keeps them agreeing — and the failure is
              silent, because a control that reaches nothing still reads back correctly
              from the model that never doubted it. Here there is no second half to
              forget.
            </p>
            <p>
              Three rules follow from it. An actuation that reached nothing reports
              failure rather than success. A control sends the composed value, never a
              raw flag — the engine is told what the strip's gain now <em>is</em>, not
              which of six contributing reasons changed. And buses and MAIN are strips,
              so they travel the same path as everything else.
            </p>
          </div>
          <div class="rounded border border-edge bg-field p-6">
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">
              Keeping a latch honest
            </p>
            <p class="mt-4 text-base leading-relaxed text-ink-dim">
              For state that lives in outboard hardware, the cheapest correct answer is
              <span class="text-ink">query and compare</span>: ask the device what it
              holds, and write only on a mismatch. Blind periodic re-assertion is the
              fallback, used only where a device cannot be asked.
            </p>
            <p class="mt-4 text-sm leading-relaxed text-ink-dim">
              Querying is not merely cheaper. A blind re-assert during a show overwrites
              whatever someone changed at the box, so drift becomes information instead
              of being papered over. Two questions decide whether a control needs the
              care at all: does it repair itself, and would the operator find out? A
              fader is self-correcting and audible, so it needs neither. Phantom power
              and a pad are set once at soundcheck and never re-sent — which is exactly
              how 20 dB of pad error can survive a whole run as "that channel sounds
              odd".
            </p>
            <p class="mt-4 text-sm leading-relaxed text-ink-faint">
              The honest exception: a REAC stagebox offers no head-amp query path. There
              the console's record <em>is</em> the state rather than a cache of it, and
              what the console reports as applied still may not lie about that.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. The native node -->
    <section class="border-b border-edge">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="05 — The audio path" title="One native node, not forty subprocesses." />
        <div class="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <p>
              The structural signal processing is one C
              <code class="font-mono text-sm text-ink">pw_filter</code> node per
              stagebox group: per-strip gain, fader, pan, polarity, summing, the EQ
              bank, the gate and compressor, native delay and reverb, and the analyser
              tap. One node, one real-time callback, one cache-friendly pass over the
              whole mix.
            </p>
            <p>
              It replaced roughly forty <code class="font-mono text-sm text-ink">pw-loopback</code>
              subprocesses, for two reasons that are about cardinality rather than about
              PipeWire. The daemon's file-descriptor ceiling was reached around strip
              eleven and the graph froze. And when a real interface suspended, PipeWire
              fell back to its dummy driver: the whole graph sat idle, zero busy, no
              audio.
            </p>
            <p>
              The single-node shape also wins on merit. One real-time callback has lower
              jitter than N separately scheduled nodes, and one node with output links
              binds cleanly to the sink's driver group by construction. Nodes are created
              when a stagebox is plugged in and destroyed when it goes; strips are added
              to a live node without interrupting it; and every node shares one client,
              so the file-descriptor cost of the entire console is a single connection.
            </p>
            <p>
              Asked for a console wider than it can carry, it refuses rather than
              truncating. Truncating produced a mixer that reported success and then
              simply had no strips past the ceiling — channels that existed in the
              model, drew faders on the surface, and carried no audio.
            </p>
          </div>
          <div class="space-y-5">
            <div class="rounded border border-edge bg-surface/60 p-6">
              <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">The kernel</p>
              <p class="mt-3 text-sm leading-relaxed text-ink-dim">
                The arithmetic lives in a single header of small
                <code class="font-mono text-xs text-ink">static inline</code> functions
                with no PipeWire, no allocation, and no libc beyond
                <code class="font-mono text-xs text-ink">&lt;math.h&gt;</code>. That is
                deliberate. A pan law is the kind of thing that has to be provably
                correct, so it is kept testable in isolation from the filter's life
                cycle.
              </p>
            </div>
            <div class="rounded border border-edge bg-surface/60 p-6">
              <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">The real-time contract</p>
              <p class="mt-3 text-sm leading-relaxed text-ink-dim">
                The callback reads per-strip parameters word-atomically, takes the strip
                count with an acquire, allocates nothing, logs nothing, and ramps every
                gain change so a moved control cannot click.
              </p>
            </div>
            <div class="rounded border border-edge bg-surface/60 p-6">
              <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">On top of it</p>
              <p class="mt-3 text-sm leading-relaxed text-ink-dim">
                LV2 plugin inserts are hosted by
                <code class="font-mono text-xs text-ink">mod-host</code> and threaded
                into that node's boundary, per strip and per output. Two layers of
                signal processing, and they are not interchangeable: one is the desk,
                the other is what you rack into it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. Verification -->
    <section class="bg-surface/40">
      <div class="mx-auto max-w-6xl px-6 py-16">
        <SectionHead eyebrow="06 — Verification" title="The signal processing is checked against arithmetic." />
        <div class="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div class="space-y-4 text-base leading-relaxed text-ink-dim">
            <p>
              The C core is verified by closed-form oracles: every expected value is
              worked out on paper first, never captured from a run of the code. The
              distinction is the entire point. A test that records what the
              implementation produced and then checks the implementation still produces
              it will agree with a bug forever. A test that names 500.0 ms before
              anything runs cannot.
            </p>
            <p>
              The oracle suite is plain C with no PipeWire and no allocation, so it
              compiles and runs in seconds and is safe to run beside a live console.
            </p>
            <p>
              Above it, controls that claim to affect audio are verified by measuring
              audio — a tone through a real graph, and a reading at the other end — not
              by asserting that a model changed. A model is correct in exactly the cases
              where it is the thing that is wrong.
            </p>
            <p>
              A test that needs a real graph gets one of its own. Each test process
              starts a private PipeWire daemon in a scratch directory, on a socket named
              after the process, and points both the daemon and its clients at that
              socket rather than at the session's — so a suite cannot reach the
              operator's audio, two suites running at once cannot see each other, and
              nothing survives the process that made it. The daemon is not waited for by
              a sleep: it counts as up when it answers a question.
            </p>
          </div>
          <div class="rounded border border-edge bg-field p-6">
            <p class="font-mono text-xs uppercase tracking-[0.14em] text-ink-faint">
              What an oracle looks like — the delay line
            </p>
            <ul class="mt-4 space-y-3 text-sm leading-relaxed text-ink-dim">
              <li>
                A quarter note at 120 BPM is 500.0 ms. Not approximately: the test names
                500.0, and 250.0 for an eighth, and 166.6667 for a triplet.
              </li>
              <li>
                At full wet with no feedback, an impulse at sample 0 must reappear at
                sample 100 with value 1.0, and sample 0 must read exactly 0.0.
              </li>
              <li>
                At feedback 0.5, the echoes at frames 10, 20 and 30 must read 1.0, 0.5
                and 0.25 — the second is <code class="font-mono text-xs text-ink">fb¹</code>,
                the third is <code class="font-mono text-xs text-ink">fb²</code>.
              </li>
              <li>
                At mix 0 the output must be <em class="text-ink">bit-identical</em> to
                the dry signal. Exact equality, not a tolerance.
              </li>
              <li>
                Absurd feedback of 5.0 must clamp, and stay bounded over 64 frames.
              </li>
            </ul>
            <p class="mt-5 text-sm leading-relaxed text-ink-faint">
              The same discipline covers the summing bus, the pan law, the routing
              matrix, the alignment fit and the recorder's file format.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
