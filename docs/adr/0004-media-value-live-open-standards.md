# ADR 0004 — Media, value & live as the core: Podcasting 2.0 + V4V + Nostr (Fountain as an endpoint)

- **Status:** Accepted
- **Date:** 2026-06-21
- **Deciders:** Felix (@bimbeam), Claude Code
- **Supersedes:** — (supersedes the "deferred" note on live/value from the 2026-06-20 voice decision)

## Context

Felix: media is **the actual game**, not a feature. Three things must be built in: **live broadcasts
as in-world events**, **podcasts + music as an in-game player**, and **Nostr as the social layer** —
all carrying **value (V4V)**. [Fountain.fm](https://fountain.fm) is the inspiration. The question:
"does this all go over Podcasting 2.0 and V4V?"

**Answer: yes — with one addition for *live*.** Fountain itself is "RSS + Lightning + Nostr": it
publishes Podcasting 2.0 feeds (incl. **music**), pays via **V4V** (streaming sats + boostagrams),
and its livestreams + social run on **Nostr**. Crucially Fountain lets you "go live on Fountain **and
other Nostr apps**" and its radio "RSS feed tunes in on **any** podcast app" — i.e. the integration
surface is the **open standards**, and Fountain is one interoperable client. So we integrate the
standards, never Fountain's private API. This confirms the prior "take the standard, not the vendor"
decision and promotes it from deferred to **core**.

## Decision

Build the media/value/live core on open standards, behind swappable adapters (same rule as
Boltz/LNbits/Liquid/Nostr — the app owns the truth, adapters do the plumbing):

| Layer | Standard | In our world |
|---|---|---|
| **Podcasts + Music** | **Podcasting 2.0 RSS** — `<podcast:medium>` (podcast/music), enclosures, chapters, transcripts | **in-game media player** (diegetic: jukebox/radio in plots & plazas) |
| **Value (V4V)** | **`<podcast:value>`** Lightning splits → streaming sats/min + **boostagrams** (boost + message); Nostr-side **NIP-57 zaps** | the boost/zap **economy** — pay performers/creators in-world (small spend via **LNbits**, principal stays sacred) |
| **Live broadcasts** | **Nostr NIP-53** (`kind:30311` live event: title/status/participants/**streaming URL**) + **HLS** media + live chat **`kind:1311`** + zaps. PC2.0 **`<podcast:liveItem>`** for podcast-app feed interop | **plaza live stages** (DESIGN-BRIEF §4 "the stream") — players gather, the stream plays on the stage, chat + boosts flow |
| **Social** | **Nostr** (NIP-53/57/1311, NIP-29 groups, profiles via Applesauce) | the feeds, comments, presence, discovery ("The Signal") |

**Fountain interop, not dependency:** we *consume* Fountain feeds / NIP-53 events like any other; and
our own broadcasts (LiveKit RTMP egress, per ADR 0002) publish a **NIP-53 event + a `liveItem`** so
Fountain and every other PC2.0/Nostr app can tune in. No vendor lock-in; the whole ecosystem is the
audience.

### Adapters (where it lives)

- `apps/web/src/net/media.ts` — `MediaCatalog` (parse PC2.0 feeds → podcast/music items) + the
  in-game player state. Mock feed first → real RSS.
- `apps/web/src/net/live.ts` — `LiveEvents` (subscribe NIP-53 `kind:30311` → in-world stage events;
  status/participants; `kind:1311` chat into the existing ChatPanel).
- `apps/web/src/net/value.ts` — `Value` (V4V): streaming sats, boostagram, zap — over **LNbits/NWC**.
  Mock balance first → real Lightning.
- Server: `apps/server/src/adapters/` isolates LN/relay/feed; the **event log** records plays,
  boosts, event-joins; **reconcile jobs** against LN + relays (never trust-and-forget) — per BUILD-BRIEF.

**Built (2026-06-21) — catalog search + feed proxy.** `apps/server/src/api/podcasts.ts` +
`src/index.ts` expose `/api/podcasts/search?q=` (the whole public catalog — the same shows Fountain
lists; keyless Apple iTunes today, swappable to the Podcast Index API via `PODCASTINDEX_KEY`) and
`/api/podcasts/feed?url=` (server-fetches the real RSS with a browser UA → the client's PC2.0 parser
reads `<podcast:value>`/V4V straight from the feed). This clears the browser-CORS blocker: the web
client calls same-origin `/api/*` (vite proxies to `:8787`). `net/feed.ts` (`searchPodcastShows` /
`loadShowEpisodes`) + the searchable Podcasts tab in `MediaPlayer.tsx` consume it. Built on Node's
`http` (zero-dep) for now; folds into Fastify + the event log per BUILD-BRIEF §6.

## Consequences

**Positive**
- The core loop (gather → listen/watch → boost) is built on open rails: interoperable with the
  entire Podcasting 2.0 + Nostr universe, not just Fountain. Creators keep their feeds/audience.
- FOSS-first intact: PC2.0 (open spec), Lightning/V4V (open), Nostr (open), LNbits (FOSS). Fountain
  is proprietary but only touched through standards → swappable/zero lock-in.
- Reuses what's built: the **ChatPanel** hosts NIP-1311 live chat; **voice/LiveKit** (ADR 0002) is
  the broadcast egress; Nostr identity (ADR 0003 seal keys) signs zaps/boosts.

**Negative / trade-offs**
- V4V needs a wallet UX (LNbits/NWC connect) and careful "small-spend only, principal sacred" framing.
- HLS live in a 3D scene = a video texture on the stage screen (perf + autoplay/codec care).
- Feeds/relays are external → mandatory reconcile + graceful offline (cache last-known).

## Alternatives considered

- **Fountain's API directly.** Rejected: vendor lock-in, violates the doctrine; Fountain itself
  exposes everything via the open standards anyway.
- **LiveKit-only for "events".** Rejected as the *standard*: LiveKit is our broadcast transport, but
  discovery/value/interop must be NIP-53 + V4V so the rest of the ecosystem (incl. Fountain) sees it.
- **Treat media as a side-feature.** Rejected by Felix: it is the core mechanic.

## ISO 19650 note

Published record promoting media/value/live to the core architecture. Future changes (e.g. a new
live transport) supersede via a new ADR. Plays/boosts/joins are audit-logged like every other
world-changing action.
