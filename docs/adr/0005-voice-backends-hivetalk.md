# ADR 0005 — Voice/video backends: HiveTalk as a second SFU behind the voice adapter

- **Status:** Accepted
- **Date:** 2026-06-22
- **Deciders:** Felix (@bimbeam), Claude Code
- **Supersedes:** — (revisits the *voice* half of [ADR 0002](0002-chat-and-voice-transport.md); the
  adapter seam and the "central / room-scoped, non-positional" model are unchanged)

## Context

ADR 0002 put voice behind a thin `VoiceTransport` adapter (`apps/web/src/net/voice.ts`), shipped a
mock, and named **LiveKit** (Apache-2.0 WebRTC SFU) as the stage-1 "boring, ships-today" backend, with
**MoQ** as the stage-2 Nostr-native target.

Felix surfaced **[HiveTalk](https://github.com/HiveTalk)** and asked to wire it in as a **second
option, for testing**. Findings:

- **`hivetalksfu`** — "Nostr + Lightning enabled browser-based real-time video calls." A WebRTC **SFU**
  (a MiroTalk-SFU fork), self-hosted, PWA, rooms/streaming/host-protection, up to 4–8k. Nostr identity
  for auth, Lightning for value. **License: AGPL-3.0.**
- **`swarm`** — a Nostr **team relay** (Go) with kind controls + Blossom media mirroring + scheduled
  notes. A candidate for *our own* relay (the self-host option already noted in `infra/hosting.md`).

HiveTalk occupies the **same slot** as LiveKit: a room-scoped SFU the client connects to. It is more
Nostr-native out of the box; LiveKit is more permissively licensed and has the cleaner client SDK +
RTMP egress (the Fountain interop path in ADR 0004).

## Decision

**Keep the `VoiceTransport` adapter; give it two real, self-hostable backends to choose between, plus
the mock.** Selectable at build/run time:

```
VITE_VOICE_BACKEND = mock (default) | livekit | hivetalk
```

- **mock** — today's simulated room state (no audio), unchanged. Default until an SFU is hosted.
- **livekit** — `room.connect(url, token)` + publish mic track (ADR 0002's stage-1 pick).
- **hivetalk** — join a self-hosted HiveTalk SFU room for the current plaza.

Both are **self-hosted services** the client reaches over the network. The `net/voice.ts` factory
returns the configured backend; the WoW-style dock and the rest of the UI never change (the ADR-0002
rule holds). MoQ remains the stage-2 target behind the same seam.

### License boundary (load-bearing — the repo is MIT, FOSS-first)

HiveTalk SFU is **AGPL-3.0**. We use it **only as a separate, self-hosted service** reached over
WebRTC / its room API:

- We **never copy or link HiveTalk's code into our MIT client or repo.** The browser client is a
  separate work that talks to the SFU over the network — not a derivative of it.
- If we **self-host** the SFU (especially if modified), the **AGPL obligation falls on that service**:
  offer its (modified) source to its users. Running an *unmodified* upstream HiveTalk + linking its
  source satisfies this — the same "operate-only, don't fork-into-our-tree" stance ADR 0002 took toward
  strfry and rejected for `mumble-web-proxy`.
- LiveKit (Apache-2.0) carries no such obligation — it stays the lower-friction default for a public
  build; HiveTalk is the Nostr-native test/experiment backend.

`swarm` (AGPL-3.0 too) is noted as a candidate for our self-hosted Nostr relay under the same boundary
(operate the service; don't fork it into the MIT tree). Decision on the relay is deferred to the infra
follow-up (`infra/hosting.md`).

## Consequences

**Positive**
- We can A/B a Nostr-native SFU (HiveTalk) against the boring default (LiveKit) without touching UI.
- Honours "adapters, not the system": the SFU is swappable; the app still owns the truth.
- Aligns with `infra/hosting.md` (self-hosted services on the VPS; AGPL services at the boundary).

**Negative / trade-offs**
- Two backends = two integrations to maintain behind one interface (accepted for the test value).
- HiveTalk is a full app, not a small client lib — the first cut may be a room-join/deeplink for the
  plaza rather than a deeply embedded client.
- **Both need a running SFU** (deferred infra). Until one is hosted, `mock` stays the default and the
  livekit/hivetalk backends are inert scaffolds.

**Rejected**
- *HiveTalk as the only voice backend.* Its AGPL license + full-app surface make LiveKit the better
  default for a public build; HiveTalk earns its place as the second, Nostr-native option.
- *Copying HiveTalk/swarm code into our tree.* Forbidden by the license boundary + FOSS-first doctrine.

## ISO 19650 note

Published record extending the voice decision. The actual SFU choice for production (and the relay
decision re `swarm`) supersede via a later ADR once an instance is hosted and tested.
