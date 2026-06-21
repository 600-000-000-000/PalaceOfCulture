# CLAUDE.md — 600 Billion build workspace

Project-specific guidance for this monorepo. Inherits the global standards in
`~/.claude/CLAUDE.md` (Conventional Commits, ISO-19650 framing, read-only source data, FOSS-first,
SQLite→Postgres, no `*.db`/`.env` committed). This file adds what is specific to building
**600 Billion — The Palace of Culture**.

## What this is

A web-first stylized 3D social MMO where Bitcoin timelocks become visible, ownable objects.
Authoritative engineering docs live in this repo — [`BUILD-BRIEF.md`](BUILD-BRIEF.md) and
[`docs/adr/`](docs/adr/); the product docs (whitepaper, concept §17 architecture / §18 MVP, design
brief) are maintained in the separate 600 Billion documentation package. The stack decision is recorded in
[`docs/adr/0001`](docs/adr/0001-stack-and-runtime-topology.md) — read it before changing topology.

## The invariants (do not violate)

1. **The app owns the truth.** Boltz / LNbits / Nostr are adapters behind
   `apps/server/src/adapters/`, never the source of truth. State machine + append-only event log
   + signed hash-chain ownership live in our code.
2. **Ownership verification is identical on client and server** — it lives once in
   `packages/ownership` and is imported by both `apps/web` and `apps/server`. Never fork it.
3. **The locked principal stays non-custodial** and claimable without our servers.
4. **The AI world-agent only proposes; the app decides** deterministically and auditably. No
   path may let the world-agent finalize state.
5. **Art is static, state is data.** Geometry/textures are immutable content-hashed files;
   everything that changes is data from the DB + Nostr — never baked into a model.
6. **Mobile 30 FPS is a hard budget.** Data-driven rendering: `InstancedMesh` + LOD + clustering,
   not thousands of React components.

## Languages & where they run

- **TypeScript** — `apps/web` (Tier 0, browser), `apps/server` (Tier 2), all `packages/*`.
- **Python** — `services/world-agent` only (Tier 3, suggestion-only, isolated behind a queue/API).
- Never reach into the truth core from Python; the boundary is the queue/API, by design.

## Conventions

- **TS:** Biome for lint+format (`pnpm lint` / `pnpm format`); TypeScript strict; double quotes;
  100-col. Run `pnpm typecheck` before committing.
- **Python:** `ruff check . && ruff format .` before commit; type hints on all signatures;
  one-line docstrings on public functions; `logging`, never `print()`; pytest.
- **Both:** add a test when you add a feature. Commit working checkpoints incrementally.
- Function naming follows the global `{verb}_{noun}_{qualifier}` where it reads naturally.

## Status

Skeleton (structure + config only). First-sprint backlog: `BUILD-BRIEF.md` §6.
