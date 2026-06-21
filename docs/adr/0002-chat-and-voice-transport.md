# ADR 0002 — Chat & voice transport ("plug-and-play first, Nostr-native later")

- **Status:** Accepted
- **Date:** 2026-06-21
- **Deciders:** Felix (@bimbeam), Claude Code
- **Supersedes:** —

## Context

The in-world social layer needs two live channels: **text chat** (WoW-style, in the 3D engine
shell) and **voice chat**. Two constraints from Felix shape the decision:

1. **"Central voice, characters don't collide — that's the simplest."** Voice is **room-scoped
   (non-positional)**: everyone in a space hears everyone, no spatial-audio math. This is a
   deliberate simplicity choice, not a temporary shortcut.
2. **"Plug-and-play first, then step-by-step onto Nostr tech."** Ship something that works today,
   then migrate the *implementation* to the Nostr-native stack without rewriting the UI.

The FOSS-foundation research (`07-research`) already picked Nostr for chat/identity (NDK, khatru
relay, NIP-29 groups, NIP-17 DMs, per-vault keys). Today's research added three findings:

- The canonical "Mumble in the browser" path (`mumble-web` + `mumble-web-proxy`) is **AGPL-3.0**,
  **upstream-unmaintained**, and needs a **non-stabilised Mumble protocol extension**. It violates
  our FOSS doctrine the moment it is forked, and is not actually "the simplest". **Rejected as a
  dependency.** (A standard Mumble server + an *unmodified* `mumble-web` sidecar stays possible the
  same way strfry is "operate-only", but it is not our path.)
- **[innpub](https://github.com/futurepaul/innpub)** (futurepaul) is the reference architecture:
  room-scoped voice + presence over **MoQ (Media over QUIC, `@kixelated/moq`)**, identity = Nostr
  **npub**, profiles via **Applesauce** — one modern transport carrying both audio and movement.
  This is exactly our "central, non-positional, simplest" shape, Nostr-native. 2D (PixiJS),
  early-stage, **no LICENSE yet** → study/architecture reference, not a code dependency today.
- **LiveKit** (Apache-2.0, mature, self-hostable WebRTC SFU) is the "boring, ships-today" central
  voice room.

## Decision

**Put every transport behind a thin adapter interface and ship a plug-and-play mock today.** The UI
(`apps/web/src/ui/ChatPanel.tsx`) only ever sees `ChatTransport` and `VoiceTransport`; swapping the
implementation never touches a line of UI. This is the same "adapters, not the system" rule the
BUILD-BRIEF applies to Boltz/LNbits/Nostr, applied to the social layer.

- **Chat** — `apps/web/src/net/chat.ts` exposes `ChatTransport` (`send` / `subscribe` / `dispose`)
  with `createMockChatTransport` (loopback + calm ambient townsfolk) shipping now.
- **Voice** — `apps/web/src/net/voice.ts` exposes `VoiceTransport` (`connect` / `disconnect` /
  `setMuted` / `subscribe`) with `createMockVoiceTransport` (simulated room state, no audio) now.

### Migration path (each step is one file, UI untouched)

| Stage | Chat | Voice |
|---|---|---|
| **0 — now** | mock loopback + ambient | mock room state (no audio) |
| **1 — plug-and-play real** | NIP-29 group via NDK against our khatru relay (read-only/anon first) | **LiveKit** room: `room.connect(url, token)` + publish mic track |
| **2 — Nostr-native** | per-seal key **signs** every send; whispers move to NIP-17/44 DMs; `author` resolves from npub via Applesauce | **MoQ** `audio.pcm` + `speaking.json` tracks keyed by npub (the innpub pattern), shared with presence |

Channels map directly: `world`/`plaza` → NIP-29 groups (kind-9; one group per channel, per-plaza
groups later); `whisper` → NIP-17 gift-wrapped DM. Voice status (`off`/`connecting`/`live`) and the
`speakers[]` list map onto LiveKit participant events, then MoQ `speaking.json`.

## Consequences

**Positive**
- A working, demoable chat + voice dock today with zero new infra or external accounts.
- The Nostr/voice migration is structurally contained to `net/chat.ts` and `net/voice.ts` — the
  WoW-style panel, channel colours, slash commands and idle-fade are written once.
- Honours the "app owns the truth, adapters do the plumbing" invariant: the relay/SFU is swappable,
  never the source of truth.

**Negative / trade-offs**
- The mock is not a network — it proves the seam and the UX, not relay/SFU behaviour. Stage 1 must
  still validate real reconnection, auth, and NAT traversal.
- Carrying an interface boundary has a small indirection cost; accepted for the swappability.

**Rejected**
- `mumble-web-proxy` as a dependency (AGPL-3.0 + unmaintained + non-standard protocol extension).
  Mumble is no longer the planned voice backend; LiveKit → MoQ replaces it. Voice stays **central /
  room-scoped** either way, as Felix specified.

## Alternatives considered

- **Mumble end-to-end (server + web bridge).** Rejected: see above. The simplicity win Felix wanted
  is delivered by *room-scoped, non-positional* voice — which LiveKit and MoQ both give natively —
  not by Mumble specifically.
- **Go straight to MoQ now.** Rejected for stage 0/1: MoQ is emerging (IETF draft, sparse relay
  infra, `@kixelated/moq` early). It is the stage-2 target, reached after LiveKit proves the room.
- **Skip the adapter, wire Nostr directly into the panel.** Rejected: couples UI to transport and
  forfeits the plug-and-play-first directive.

## ISO 19650 note

Published (merged-to-main) record of the social-transport decision. The mock→LiveKit→MoQ migration
will be tracked as it lands; a future ADR supersedes this one if the room model itself changes
(e.g. positional audio is ever introduced).
