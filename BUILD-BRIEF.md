# 600 Billion — Build Brief

*Developer handoff for implementation (Claude Code + team). Derived from the whitepaper, the
engine & asset pipelines, and the full concept doc. 2026-06-19.*

This brief is the single implementation-oriented reference for building the v1 playable slice.
It organizes the source docs for building; it does not invent features beyond them.

---

## 1. System overview — the application owns the truth

The hard architectural rule: **Boltz, LNbits and Nostr are adapters, not the system.**
"They do the plumbing" is not an architecture. Our application defines:

- **The state machine** — every asset, lock, ownership transfer and world/palace change is a
  defined state with defined transitions.
- **The audit log** — an append-only event log; every world-changing decision is reproducible
  from logged inputs plus deterministic rules.
- **Verifiable ownership** — a per-asset signed hash-chain that clients verify locally, never
  "trust whichever relay answered last."

| Adapter | Role | What it is NOT |
|---|---|---|
| **Boltz** | Funding rail for user timelock outputs via swaps; reduces deterministic wallet linkage. | Not a multi-year vault product; not custodial; not the proof. |
| **LNbits** | Lightning accounts / payments for the small in-game sats economy (skins, fees, tips). | Not the prestige core. Balances are custodial to the operator — small spend only. |
| **Nostr** | Object + identity layer: every object is a signed event; the "seal", provenance, portable metadata, chat — transport + registry. | **Not consensus.** Ownership is not "latest relay wins." |
| **Bitcoin mainchain** | Myth layer — long timelocks for legends (21-year spaceship). Out of v1. | — |

Two load-bearing invariants:

1. **The locked principal stays non-custodial and claimable without our servers** (self-custodial
   recovery: script/keys/instructions are the user's).
2. **The AI world-agent only proposes; the application decides** — deterministically and auditably.

**Art is static, state is data:** geometry/textures are immutable files; everything that changes
(ownership, placement, growth, mood) is data from the app DB and Nostr, never baked into a model.

---

## 2. Tech stack (specific FOSS libraries)

**Client (3D world):** `three` (MIT) · `react-three-fiber` (MIT) · `@pixiv/three-vrm` (MIT,
avatars) · `ecctrl` (avatar controller) · GLTFLoader / DRACOLoader / KTX2Loader · shared humanoid
animation library (Mixamo) retargeted via VRM bones. Data-driven, not component-driven:
`InstancedMesh` + spatial index, LOD by distance, clustering at globe zoom, IndexedDB cache.
**Mobile 30 FPS is a hard budget.** (Alternative, not chosen: Babylon.js.)

**Authoring:** Blender (modeling + scripted cleanup/decimate/atlas/export) · VRoid Studio (quick
VRM avatars). Users bring their own `.vrm`, attachable to their seal.

**Asset pipeline:** one format in — **glTF 2.0 (.glb)**; avatars are **VRM** (also glTF).
`gltf-transform` / `gltfpack` → weld, dedupe, Draco/meshopt geometry, KTX2/Basis textures, LOD gen.
Content-hashed, versioned files on a CDN + JSON manifest.

**Networking & shared state:** `Colyseus` (MIT, authoritative movement/presence) + `Yjs` (MIT, CRDT
persistent shared state). Both are adapters — the app DB + event log remain the source of truth for
ownership and world-changing decisions.

**Backend ("boring on purpose"):** SQLite-first · one app, one worker, one DB · append-only event
log · provider webhooks stored raw · **reconcile jobs mandatory** (reconcile against chain / LN /
relay state, never trust-and-forget).

---

## 3. Data model & the three streams

Keep the three streams strictly separated.

- **A — Art assets (immutable):** content-hashed GLB/VRM on a CDN, referenced from a JSON manifest,
  lazy-loaded by zone/LOD, IndexedDB cached. Naming `600B_<KIT>_<PART>_<LODn>`. Meters, +Y up,
  base-centered origin, triangulated, one atlas per kit, baked AO. Snap grid 2 m plan / 4 m floor.
- **B — World/map data:** country polygons (Natural Earth GeoJSON; OSM base map), per-vault
  placement (chosen country, city optional, never address; randomized point-in-country), ownership
  in app DB + Nostr. Later: BTC Map merchant layer (consume API/OSM, don't fork — AGPL).
- **C — Live state:** asset growth (from the lock's real-time progress + visits), seasons, events,
  mood — world-agent proposes, app applies deterministically. Cosmetic, never a financial signal.

**Ownership = per-asset signed hash-chain** (the core primitive). Nostr is transport, not consensus:

```
ownership event (per asset, per transfer):
  asset_id        // the object instance (signed Nostr event)
  revision        // monotonic counter
  prev_hash       // hash of the previous ownership event
  owner_pubkey    // current owner (Nostr / seal key)
  payload         // transfer metadata
  signature       // signed by the transferring owner's key
```

Explicit conflict-resolution rules; local verification in every client; export = signed JSONL /
event-chain, verifiable offline. Proof of timelock is the asset's birth certificate; Bitcoin is the
backing; art/metadata off-chain — no chain spam, no Ordinals-style inscription.

**Asset model (Nostr):** a series (class event = class, 1 instance event = 1 instance) or a one-of-one
(supply 1, reissuance disabled, immutable genesis). Tokenize objects with real presence; **do not
tokenize state** (XP, patience points, leaderboard rank, boosts, UI state, community-landmark
ownership).

---

## 4. MVP scope (v1, tree first)

In v1: character + private world + globe→country map with **synthetic users**; **two hero assets**
(tree + one vehicle), 3 LODs, mobile 30 FPS; **first timelock flow on testnet/signet** with a
**server-independent claim path**; **skin shop** with a small sats fee; **founding of one national
palace** shown by its first halls rising (architecture is the progress bar); signed Nostr export of
seal + ownership; AI suggestion-only.

Out of v1: marketplace, trading-for-money (gifting/one-way only — LN payment + Nostr transfer not
atomic), AI-decided state/moderation, spaceship/fleet track, UGC economy.

**Asset budgets:** hero building 30–80k tris LOD0; house/vehicle 5–20k; props 200–3000; draw calls
< ~150 visible; private world < ~500k visible tris with LODs. **Avatar tiers** (enforced on import):
≤ 20–40k tris, 1–2 materials, ≤ ~90 bones, few spring-bones; over-budget downgraded/fallback.

---

## 5. Proposed monorepo structure

```
600-billion/
├── apps/
│   ├── web/                  # r3f client (three + react-three-fiber)
│   │   └── src/{scene,map,avatar,assets,ui,net}/
│   └── server/               # Colyseus rooms + REST/API + worker
│       └── src/{rooms,api,worker,statemachine,eventlog,adapters,db}/
├── packages/
│   ├── shared/               # TS types: events, asset model, state-machine defs, conflict rules
│   ├── assets-pipeline/      # gltf-transform/gltfpack + Blender scripts, LOD, hash, manifest
│   └── ownership/            # signed hash-chain build + local verify + signed JSONL export
├── infra/                    # one app/one worker/one DB; CDN; testnet/signet; reconcile schedule
├── viewers/                  # 600-billion-viewer.html (drag-drop GLB/VRM budget HUD)
└── README.md
```

`packages/shared` + `packages/ownership` are the home of "the app owns the truth" — imported by
client AND server so verification is identical on both. `apps/server/src/adapters/` isolates Boltz /
LNbits / Nostr so they stay swappable.

---

## 6. First-sprint backlog (ordered)

1. Repo + tooling skeleton; SQLite + append-only event log + typed event writer.
2. Asset viewer + budget HUD (the gate every asset passes).
3. Asset pipeline scripts (Blender cleanup → GLB → gltfpack Draco/meshopt + KTX2 → LOD → hash →
   manifest), validated against the viewer.
4. Two hero assets (tree + vehicle), LOD0/1/2 within budget, named per convention.
5. Minimal r3f scene: ground + instanced building + LOD swap; confirm mobile 30 FPS.
6. VRM avatar + ecctrl controller + walk clip; enforce avatar tiers on import.
7. Globe → country → plot map (Natural Earth GeoJSON, randomized placement, clustering); synthetic
   users.
8. Colyseus authoritative movement + Yjs persistent shared state; wire client `net/`.
9. Ownership hash-chain in `packages/ownership` (revision/prev_hash/signature, conflict rules, local
   verify, signed JSONL); unit-test offline verify.
10. Seal identity + per-lock fresh key + Nostr export.
11. First timelock flow on testnet/signet (LN → Boltz swap → Bitcoin CLTV timelock → object
    born → signed Nostr instance event → DB+Nostr); webhooks stored raw; server-independent claim path.
12. Reconcile jobs (mandatory) against chain/LN/relay.
13. Skin shop with sats minifee (LNbits); principal-sacred rule respected.
14. Asset growth + Tamagotchi state from lock progress + visits; cosmetic, never a signal.
15. Palace founding milestone from kit-of-parts; ≈21-active threshold shown as first halls rising;
    world-agent proposes mood, app decides + logs.

---

## 7. Open technical questions & risks

1. **Ownership hash-chain conflict rules** — must be precisely specified and identical in client &
   server verification, or "latest relay wins" sneaks back in.
2. **Atomic trade deferred** — LN payment + Nostr transfer are not atomic; v1 = gifting (one-way)
   only; marketplace waits for real escrow.
3. **Coin privacy = user-side self-custodial tool, never an operated service** (the Tornado/Samourai
   line — personal criminal exposure). It is *linkage reduction, not anonymity*; never overclaim.
4. **Timelock construction & server-independent claim** — define the lock + a self-custodial recovery
   path; start on testnet/signet, not an open-ended mainnet vault.
5. **Avatar performance tiers** — enforce automatically on import (user `.vrm` can blow the frame
   budget); downgrade/fallback.
6. **AI world-agent stays suggestion-only** — any path where AI finalizes state breaks auditability
   and the "app owns the truth" invariant.

Carried open details: exact tier formula (amount × duration); matured-asset re-lock vs. final
prestige; vault-key storage on unlock; optional city-pin granularity; FOSS license for code vs.
community assets.
