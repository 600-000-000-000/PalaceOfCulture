# @600b/assets-pipeline

Turns authored GLB/VRM into shippable, budgeted, content-hashed assets + a JSON manifest:
Blender cleanup → `gltf-transform`/`gltfpack` (weld, dedupe, Draco/meshopt, KTX2/Basis) → LOD →
content hash → manifest. Every asset must pass the budget HUD in
[`../../viewers`](../../viewers) green.

Conventions: `600B_<KIT>_<PART>_<LODn>`, meters, +Y up, base-centered origin, triangulated, one
atlas per kit, baked AO; snap grid 2 m plan / 4 m floor. Budgets in `BUILD-BRIEF.md` §4.

Status: stub (`src/cli.ts`) — implemented in first-sprint backlog item 3.
