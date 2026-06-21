# @600b/server — truth tier (Tier 2)

The application that **owns the truth**. One app, one worker, one DB — boring on purpose.
SQLite-first, append-only event log, reconcile jobs mandatory.

## src/ layout

| Dir | Responsibility |
|---|---|
| `db/` | SQLite (→ Postgres); append-only event log; typed event writer |
| `eventlog/` | the audit log; every world-changing decision reproducible from logged inputs + rules |
| `statemachine/` | defined states + transitions for asset / lock / ownership / palace |
| `api/` | Fastify REST: read models, claim helpers (server-independent claim path stays the user's) |
| `rooms/` | Colyseus authoritative movement + presence; Yjs persistent shared state (adapters, not truth) |
| `worker/` | reconcile jobs against chain / LN / relay; provider webhooks stored **raw** |
| `adapters/` | Boltz · LNbits · Nostr behind one swappable interface — never the source of truth |

Ownership verification is imported from `@600b/ownership` and is **identical to the client's**.

Run: `pnpm dev:server` (from repo root) or `pnpm dev` here.
