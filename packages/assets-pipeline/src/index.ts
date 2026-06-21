// @600b/assets-pipeline — turn authored GLB/VRM into shippable, budgeted, content-hashed assets.
//
// Pipeline (BUILD-BRIEF §2): Blender cleanup → gltf-transform/gltfpack (weld, dedupe,
// Draco/meshopt geometry, KTX2/Basis textures) → LOD generation → content hash → JSON manifest.
// Validated against viewers/600-billion-viewer.html (the budget HUD every asset must pass green).
//
// Naming: 600B_<KIT>_<PART>_<LODn>. Meters, +Y up, base-centered origin, triangulated,
// one atlas per kit, baked AO. Snap grid 2 m plan / 4 m floor.

export const PIPELINE_VERSION = "0.0.0";
