# ADR 0001 — Stack language & runtime topology ("wo rennt was")

- **Status:** Accepted
- **Date:** 2026-06-20
- **Deciders:** Felix (@bimbeam), Claude Code
- **Supersedes:** —

## Context

We are building **600 Billion — The Palace of Culture**, a web-first stylized 3D social
MMO in which Bitcoin timelocks become visible, ownable objects. The canonical references are
`01-whitepaper`, `02-concept` (§17 architecture, §18 MVP) and `05-build-dev/BUILD-BRIEF.md`.

Two hard, load-bearing invariants come from those docs:

1. **The application owns the truth.** Boltz, LNbits and Nostr are *adapters, not the
   system*. Our app defines the state machine, the append-only audit log, and verifiable
   ownership (a per-asset **signed hash-chain**). Ownership is **not** "latest relay wins".
2. **Ownership is verified locally in every client.** The same verification of
   `revision / prev_hash / signature` must run on **client and server** so a client never has
   to trust whichever relay answered last.

The open question this ADR resolves: **which language runs where?** The user's global standard
favours Python (FastAPI / uv / ruff / pytest); the BUILD-BRIEF specifies a TypeScript stack
(three.js + react-three-fiber client, Colyseus + Yjs realtime). These genuinely conflict, so we
decide deliberately rather than by default.

## Decision

**TypeScript on the entire client + realtime + truth path. Python only for the isolated,
suggestion-only world-agent (and future data/ML work).**

### Why TypeScript for the truth path

- **The client is unavoidably TypeScript.** A browser-native 3D world (three.js / r3f) has no
  Python equivalent. This is not a choice.
- **Ownership verification must be byte-identical on client and server** (invariant 2). The
  cleanest way to guarantee that is a single shared package — `packages/ownership` — imported by
  **both** `apps/web` and `apps/server`. Re-implementing the hash-chain verify in a second
  language reintroduces exactly the divergence risk ("latest relay wins sneaks back in") the
  BUILD-BRIEF §7.1 warns about.
- **Colyseus** (authoritative movement/presence) and **Yjs** (CRDT shared state) are Node-native
  with no serious Python equivalent. Re-implementing them would be reinventing load-bearing
  wheels.

### Where Python keeps a clean home

- The **world-agent** (Tier 3) is **suggestion-only**: it reads Bitcoin signals (price, hashrate,
  mempool, halving) and Nostr culture, and emits *proposals* onto a queue. The app consumes them,
  **decides deterministically, and logs**. The agent **never writes truth**, so nothing there can
  diverge from the shared verification.
- This is AI/ML territory — Python's strength and the user's preferred toolchain (uv / ruff /
  pytest, Python ≥ 3.12, per the global CLAUDE.md). It lives in `services/world-agent`, fully
  isolated behind a queue/API boundary.

## Runtime topology — wo rennt was

| Tier | Runs on | Language | Responsibility |
|---|---|---|---|
| **0 · Browser** | user's device | TypeScript | r3f 3D client; **keys/seal on-device** (non-custodial); local ownership-verify; server-independent claim path |
| **1 · Edge / Static** | CDN + static hosting | — | content-hashed GLB/VRM + JSON manifest (immutable art); Natural Earth / OSM map data |
| **2 · Truth-Tier** | one VPS/container ("one app, one worker, one DB"), self-hostable | TypeScript | state machine, append-only event log, ownership hash-chain (author + verify), Colyseus + Yjs realtime, reconcile worker, SQLite → Postgres |
| **3 · KI** | separate worker/service | **Python** | world-agent; reads BTC + Nostr signals → **proposals only**; app decides + logs |
| **4 · External adapters** | not our servers | — | Boltz (swaps/funding), LNbits (Lightning/sats), Nostr (object/identity/chat), BTC/signet (timelock backing), BTC Map/OSM — swappable behind `apps/server/src/adapters/` |

Two invariants the topology protects:

1. **The locked principal stays non-custodial and claimable without our servers.** If we vanish,
   the coins still come back (self-custodial recovery: script/keys/instructions are the user's).
2. **The AI proposes; the app decides** — deterministically and auditably; every world-changing
   decision is reproducible from logged inputs + rules.

## Consequences

**Positive**

- One language across client + server + shared packages → ownership verification is literally the
  same code on both sides. The core invariant is structurally enforced, not hoped for.
- Colyseus / Yjs used as intended; no reimplementation.
- Python keeps a real, idiomatic home (the world-agent), honouring the user's toolchain without
  letting it touch the truth core.

**Negative / trade-offs**

- The team carries **two toolchains** (pnpm/TypeScript and uv/Python). Mitigated by a hard
  boundary: they only ever talk over a queue/API, never share a process or a database write path.
- TypeScript for the backend is a deviation from the user's default "Python backend" standard —
  accepted here for the reasons above and scoped to this project.

**Toolchain**

- TS: pnpm workspaces, TypeScript strict, Vite (web), tsx/tsc (server), Biome (lint+format — the
  TS analogue of ruff: one tool, replaces ESLint+Prettier).
- Python: uv, ruff (lint+format), pytest, Python ≥ 3.12 — per the global CLAUDE.md.
- DB: SQLite-first (append-only event log) → Postgres later, matching the global standard.

## Alternatives considered

- **Python backend (FastAPI) + TS client.** Rejected: forces a second implementation of ownership
  verification (divergence risk) and loses Colyseus/Yjs. The user's guidance was explicitly
  "if TypeScript is better for the job, use it" — and here it is.
- **Babylon.js instead of three.js/r3f.** Out of scope for this ADR; the client-language
  conclusion is identical either way (still TypeScript). Revisit only if r3f proves limiting.

## ISO 19650 note

Treated as a CDE decision record: this ADR is the *Published* (merged-to-main) statement of the
stack decision. Future stack changes supersede it via a new numbered ADR rather than editing this
one — preserving the audit trail.
