# ADR 0003 — Character data model & our own VRM slot-builder

- **Status:** Accepted
- **Date:** 2026-06-21
- **Deciders:** Felix (@bimbeam), Claude Code
- **Supersedes:** —

## Context

The character-creation step needs to become a real avatar builder, and we need to "start the
character database". Two questions: **which builder**, and **where the character record lives**.

**Character Studio** (`M3-org/CharacterStudio`) was the researched recommendation (MIT, web, VRM
export, custom asset packs). On checking the published package it is **not embeddable in-process**:
`@m3-org/characterstudio@0.5.0` requires **React ^19.2** and **three ^0.183**, ships **no
`main`/`module`/`exports`** entry points, and brings `@pixiv/three-vrm@^3.5`. Our 3D client is
pinned to **React 18.3 / three 0.169 / r3f 8** (ADR-era pins chosen so `ecctrl` + `react-three-rapier`
walk-mode works — see the project log). Embedding CS would mean two three.js versions in one bundle
(the classic "multiple instances of Three.js" breakage, worst around VRM/skinning) **and** a full
stack bump (React 19 / three 0.183 / r3f 9) that re-opens the just-stabilised ecctrl/rapier walk-mode.

## Decision

**Build our own lightweight, data-driven VRM slot-builder inside our stack. Character Studio stays a
design reference only.** Persist characters plug-and-play on the device now, behind an adapter, with
the schema shared client/server.

### Avatar = config-as-source, VRM-as-derived

- **`AvatarConfig` is the source of truth** (`packages/shared/src/character.ts`): a small, portable,
  verifiable set of slot/trait choices (gender, age, skinTone, aura, hair, outfit, headwear). This is
  *data*.
- The rendered avatar is **derived art**: today a procedural placeholder (`scene/CharacterModel.tsx`,
  driven by the config); later a composed/loaded **VRM** referenced by `avatarVrmRef`. This is exactly
  the BUILD-BRIEF invariant **"art is static, state is data"** applied to avatars.
- The builder is **data-driven by a trait catalog** (`ui/avatarTraits.ts`); each trait has an `asset`
  slot for its VRM/GLB mesh (`null` = procedural today). When the Builder asset kit lands
  (DESIGN-BRIEF first deliverable), an **AvatarComposer** assembles the slot meshes / loads the VRM —
  a change confined to the catalog + composer; **the builder UI and `AvatarConfig` never change.**

### Character database = plug-and-play first (same pattern as ADR 0002)

- The `Character` record (id, handle, avatar config, future `pubkey`/`avatarVrmRef`, timestamps,
  `updatedBy`) is typed once in **`packages/shared`** so client and server speak it.
- It is persisted today via a **`CharacterStore` adapter** (`apps/web/src/character/store.ts`) backed
  by **IndexedDB on the device** — the player owns their record, survives reload, no server needed.
- The same interface swaps to the **apps/server SQLite truth-tier + append-only event log** later.
  `updatedBy` already carries the ISO-19650 audit prefix (`user:<handle>` / `auto:<source>`).

## Consequences

**Positive**
- No stack conflict, no risk to the working walk-mode; everything stays on our pinned R18/three-0.169.
- On-brand: the builder produces the toon Builder look from *our* kit, not a foreign avatar style.
- The config-as-source rule keeps avatars portable and verifiable, and makes the eventual VRM purely
  derived — re-composable, swappable, never the source of truth.
- A working, persistent character DB today (build → save → reload-restore), with a clean path to the
  server truth-tier.

**Negative / trade-offs**
- We build (and own) the builder UI + trait system ourselves — the FOSS research already flagged "no
  drop-in" here. Mitigated: the builder engine is small and the art is the real cost either way.
- The procedural placeholder avatar is not the final look; it stands in until the VRM Builder kit +
  AvatarComposer land.

## Alternatives considered

- **Embed Character Studio in-process.** Rejected: React 19 / three 0.183 / no exports vs. our pinned
  stack (see Context). Revisit only if we ever bump the whole client to R19 / three 0.18x / r3f 9.
- **Staged standalone CS + VRM handoff** (host CS, export a `.vrm`, import it). Viable later as an
  *additional* avatar source, but heavier to stand up and not needed for our own on-brand builder.
- **Character record in apps/server SQLite now.** Deferred: the server isn't running (better-sqlite3
  build was skipped); IndexedDB is the plug-and-play-first move, consistent with ADR 0002.

## ISO 19650 note

Published record of the character-data + builder decision. The IndexedDB→SQLite migration and the
AvatarComposer/VRM-kit step will be tracked as they land; a future ADR supersedes this if the
config-as-source model itself changes.
