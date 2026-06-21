# 600 Billion — The Palace of Culture

> **A social world where Bitcoin timelocks become visible, ownable objects.** You lock sats and
> something grows — a tree, a vehicle, a 21-year spaceship — on one shared map of the real Earth.
> Status is earned through time, never pay-to-win. Non-custodial & FOSS. *Not an NFT game.*
>
> **Money buys style. Time builds legend.**

> ⚠️ **This is the raw stone — the statue still has to be carved.**
> Early proof-of-concept. A walkable 3D Palace HQ runs today; the load-bearing systems (timelock
> flow, signed ownership chain, world-agent) are scaffolding, not yet implemented. Contributions
> welcome — see [Contributing](#contributing).

This repository is the **application** — a web-first, stylized 3D social MMO. The product vision,
whitepaper, concept bible, and design brief are maintained separately in the 600 Billion
documentation package.

## The load-bearing ideas

- **Two protocols, nothing else.** *Bitcoin proves the time; Nostr owns the object.* No new token,
  no federation, no shitcoins.
- **The app owns the truth.** A deterministic state machine + append-only audit log + per-asset
  **signed hash-chain** ownership. Boltz / LNbits / Nostr are swappable adapters, never the source
  of truth — and the same ownership-verification code runs on client **and** server.
- **Non-custodial by design.** The locked principal stays the user's and is claimable without our
  servers. You commit time; you do not spend it.
- **Earned, not bought.** Cosmetics sell for small sats; maturity, provenance, and legend are
  earned only. No loot boxes, no gacha, no pay-to-win.
- **Mobile 30 FPS is a hard budget.** Data-driven 3D (`InstancedMesh` + LOD), not thousands of
  components.

Start with **[BUILD-BRIEF.md](BUILD-BRIEF.md)** and **[ADR 0001](docs/adr/0001-stack-and-runtime-topology.md)**
(what runs where, in which language). The invariants are in [CLAUDE.md](CLAUDE.md).

## Stack

- **Client** (`apps/web`) — Three.js + react-three-fiber, `@pixiv/three-vrm` avatars + `ecctrl`,
  GLTF/Draco/KTX2, data-driven instancing & LOD. TypeScript.
- **Server** (`apps/server`) — Colyseus (authoritative movement) + Fastify (REST) + reconcile
  worker. SQLite → Postgres, append-only event log. TypeScript.
- **Shared core** (`packages/*`) — event/asset-model types, the signed-hash-chain ownership engine,
  and the Blender→glTF asset pipeline.
- **World-agent** (`services/world-agent`) — suggestion-only, isolated behind a queue/API. Python.

## Layout

```
.
├── apps/
│   ├── web/                  r3f client (three + react-three-fiber)   — TypeScript, Tier 0
│   └── server/               Colyseus rooms + Fastify API + worker    — TypeScript, Tier 2
├── packages/
│   ├── shared/               event / asset-model / state-machine types
│   ├── ownership/            signed hash-chain build + local verify (imported by web AND server)
│   └── assets-pipeline/      GLB/VRM cleanup → Draco/meshopt → LOD → hash → manifest (+ Blender)
├── services/
│   └── world-agent/          suggestion-only world-agent             — Python, Tier 3
├── docs/adr/                 architecture decision records
├── infra/                    deployment topology (one app / one worker / one DB)
└── viewers/                  drag-and-drop GLB/VRM budget viewer
```

`packages/ownership` is the home of "the app owns the truth" — the **same** verification code runs
on client and server. `apps/server/src/adapters/` isolates Boltz / LNbits / Nostr so they stay
swappable.

## Quick start

```bash
corepack enable          # provides pnpm
pnpm install             # install the TS workspace
pnpm dev:web             # run the client (Vite)
pnpm dev:server          # run the server (tsx watch)

# Python service (world-agent)
cd services/world-agent
uv sync && uv run pytest
```

Requires Node ≥ 20 and pnpm (`corepack enable`); the world-agent needs Python ≥ 3.12 + `uv`.

## Status

Early proof-of-concept.

- ✅ Monorepo scaffold; architecture decided (ADR 0001); asset/budget viewer.
- ✅ A walkable 3D Palace HQ scene — the real Revit model, game-ified through the Blender pipeline
  ([packages/assets-pipeline/HANDOFF.md](packages/assets-pipeline/HANDOFF.md)).
- ✅ Frontend shell: intro → start flow → walkable doors (`ecctrl`).
- ⏳ Timelock flow, signed ownership chain, identity/seal, world-agent — **not built yet.**

The first milestone is "tree first" — the playable MVP slice in `BUILD-BRIEF.md` §4/§6.

## Contributing

The world is built bottom-up, by its inhabitants — outside contributors very welcome.

1. Read [BUILD-BRIEF.md](BUILD-BRIEF.md) (architecture + first-sprint backlog) and the invariants in
   [CLAUDE.md](CLAUDE.md).
2. Commit style is [Conventional Commits](https://www.conventionalcommits.org/); work on a branch,
   open a PR.
3. **TypeScript** is linted/formatted with **Biome** (`pnpm lint` / `pnpm format`; `pnpm typecheck`
   before committing). **Python** with **Ruff** (`ruff check . && ruff format .`). Add a test when
   you add a feature.

## License

[MIT](LICENSE) — FOSS-first. (A separate license for community/art assets is still to be decided.)

---

*Officially, we are building a Palace of Culture for humanity. Unofficially, it is a giant digital
pyramid with a Head of Culture at the top. We are definitely not a cult.*
