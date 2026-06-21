# @600b/web — r3f client (Tier 0)

The browser client. Keys/seal stay **on-device** (non-custodial); ownership is verified **locally**
using `@600b/ownership` (the same code the server runs). Data-driven rendering only — mobile 30 FPS
is a hard budget.

## src/ layout

| Dir | Responsibility |
|---|---|
| `scene/` | r3f Canvas, lighting, `InstancedMesh` + LOD world rendering |
| `map/` | Globe → Country → Plot navigation; Natural Earth polygons; randomized placement; clustering |
| `avatar/` | VRM avatar (`@pixiv/three-vrm`) + `ecctrl` controller; enforce avatar perf tiers on import |
| `assets/` | GLB/VRM loading from CDN manifest; DRACO/KTX2; IndexedDB cache |
| `ui/` | quiet, palette-true interface (gold/cream/teal/coral); the world is the hero |
| `net/` | Colyseus client (movement/presence) + Yjs (shared state) |

Run: `pnpm dev:web` (from repo root) or `pnpm dev` here.
