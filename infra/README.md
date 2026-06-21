# infra

Deployment topology — "boring on purpose" (BUILD-BRIEF §2, ADR 0001).

## Tier 2 — the truth tier

**One app, one worker, one DB.** A single VPS / container to start; fully self-hostable (FOSS DNA).

- App + worker: `@600b/server` (Colyseus rooms, Fastify API, reconcile worker).
- DB: SQLite-first, append-only event log → Postgres later.
- **Reconcile jobs are mandatory** — scheduled reconciliation against chain / LN / relay state;
  provider webhooks stored **raw**, never trust-and-forget.

## Tier 1 — edge / static

- CDN for content-hashed GLB/VRM + JSON manifest (immutable art).
- Static map data (Natural Earth GeoJSON; OSM tiles).

## Tier 3 — world-agent

`services/world-agent` (Python) as a separate process; talks to the app over a queue/API only.

## Chain environment

Start on **testnet / signet** (or a clearly bounded mainchain path) — never an open-ended
mainnet vault on day one. The **server-independent claim path** is a hard requirement: if our
infra vanishes, users still claim their principal.

## Jurisdiction (later)

Bitcoin-friendly base + multi-flag structure (concept §15) — corporate/legal advice required
before incorporating. Not a code concern; noted here so it isn't lost.

> Nothing is provisioned yet. This file is the target shape, not running infra.
