# Level-Building Handoff — Revit → game level

Canonical runbook for turning the real Revit model into the in-engine HQ level. Anyone (or any new
session) should be able to continue from here **without prior context**. This is the single source of
truth for the asset pipeline — the Revit-export step is in [`docs/REVIT-EXPORT.md`](../../docs/REVIT-EXPORT.md)
(not repeated here); the settled stack/topology is in [`docs/adr/0001`](../../docs/adr/0001-stack-and-runtime-topology.md).

## TL;DR

The HQ "Palace of Culture" is recycled from Felix's finished Revit model. The pipeline produces one
game asset — **`apps/web/public/palace.glb`** — which the engine loads in
[`apps/web/src/scene/Palace.tsx`](../../apps/web/src/scene/Palace.tsx). Current state: **building is
grounded (EG deck at y=0) + a flat floor that is the combined contour of all Geschossdecken.** The
frontend launches it via `EngineHandoff → PalaceScene` (see `apps/web/src/frontend/GameFrontend.tsx`).

## Flow

```
SanSatComCen.rvt  ──(Revit, see REVIT-EXPORT.md)──>  SanSatComCen.fbx        (84 MB; CRASHES Blender's FBX importer)
SanSatComCen.fbx  ──(FBX2glTF.exe)──────────────────>  SanSatComCen_conv.glb  (70 MB, 2.5M tris, clean geometry, NAMED parts)
SanSatComCen_conv.glb ──(gameify.py)────────────────>  600B_PALACE_HQ.glb     (decimated, merged-by-material, ~44k tris)
600B_PALACE_HQ.glb + SanSatComCen_conv.glb ─(build_level.py)─>  palace.glb    (whole building grounded + FLOOR contour)
palace.glb  ──(copy)────────────────────────────────>  apps/web/public/palace.glb   (consumed by the engine)
```

All source/intermediate GLBs live in `G:\projekte\PoC\600-Billion-Handover-final\09-art\`.
`FBX2glTF.exe` is at `C:\Users\FLX\blender_mcp\FBX2glTF.exe`.

## Scripts (`packages/assets-pipeline/blender/`)

Run pattern (Blender 5.1, headless):
```bash
"C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" --factory-startup --background --python <script>.py -- <args>
```

| Script | Purpose | Args (after `--`) |
|---|---|---|
| `inspect_fbx.py` | format-aware import + tri/object stats | `<in>` |
| `fbx_categories.py` | import + name-prefix histogram + keyword breakdown (objs+tris) — find what to keep/strip | `<in.glb\|fbx>` |
| `inspect_footprint.py` | list meshes by world XY footprint — spot environment / boundary-wall elements | `<in.glb>` |
| `strip_categories.py` | **v27 strip pass** — drop Textil, Glas, `BSH Träger…Licht`, and environment+wall (footprint > 100 m) | `<in.glb> <out.glb>` |
| `gameify.py` | **the game-ify pass** — gentle 3 mm weld + limited dissolve, solidify thin roofs, columnize round columns, classify→toon material per group, merge static groups, export | `<in.glb> <out.glb>` |
| `inspect_levels.py` | histogram horizontal face-area by Z (find slab levels geometrically) | `<in.glb>` |
| `inspect_named.py` | list objects whose name contains a keyword + world-Z range (e.g. `geschossdecke`) | `<in.glb> [keyword]` |
| **`build_level.py`** | **the current level builder** — whole building (drop blow-ups) + FLOOR = all Geschossdecken flattened to z=0 and unioned into one silhouette; one shared XY centre | `<building.glb> <conv.glb> <out.glb>` |
| `texturize.py` | per-material tileable textures + cube UVs, packed into the GLB. WALLS = strong stone **masonry** (offset courses, mortar, 3 alternating tones, ~0.33 m scale); ROOFS = **semitransparent mesh** (grid alpha); **storey/zone variation** baked into COLOR_0 vertex colours (world Z + XY noise, multiplied per glTF spec — export with `export_vertex_color='ACTIVE'`). Runs AFTER build_level | `<in.glb> <out.glb>` |
| `render_check.py` | headless **Workbench** render — geometry/grounding (no GPU; can't show transparency or vertex colours) | `<in.glb> <out.png>` |
| `render_beauty.py` | headless **EEVEE** render — shows textures × vertex colours + transparency. 3rd arg `wide`/`close`/`elev` picks the framing | `<in.glb> <out.png> [mode]` |
| `clean.py` | remove intra-mesh stray verts (>500 m from that mesh's median) | `<in.glb> <out.glb>` |
| `extract.py` | extract objects matching a keyword into a new GLB (e.g. sails) | `<in.glb> <out.glb> <keyword>` |
| `finalize.py` | ⚠️ DEPRECATED — drops palapa, grounds on EG slab, **cuts substructure below −0.6**. Superseded by `build_level.py` because Felix wants the model kept WHOLE ("don't cut the model"). Kept for reference only. |

### The current build command
```bash
blender --factory-startup -b --python build_level.py -- \
  09-art/600B_PALACE_HQ.glb  09-art/SanSatComCen_conv.glb  apps/web/public/palace.glb
```

## Decisions & gotchas (hard-won — do not relearn these)

1. **0-point = Oberkante EG-Geschossdecke = world z ≈ 0.00.** Confirmed via the 65 named
   `Geschossdecke` objects in the conv GLB (FB tops at z≈0; UG/pool −3..−6, OG +4.4, Dachterrasse +8.3).
   The Revit project zero *is* the finished ground floor.
2. **Never seat the asset on `box.min.y`.** The over-water piles reach −11.6 m; seating there lifts the
   deck +11.6 m and it floats. Keep z=0 at y=0. The engine loader re-centres **XZ only**
   (`scene.position.set(-cx, 0, -cz)`).
3. **Floor = Gesamtkontur of ALL Geschossdecken**, flattened to z=0 and coplanar-dissolved into one
   `600B_FLOOR` mesh — it forms the walkable space and follows the real floor plan.
4. **Keep the building WHOLE.** Do not cut substructure (Felix was explicit). The piles below the deck
   are the over-water foundation — below the floor, mostly out of view (OrbitControls
   `maxPolarAngle ≈ π/2.05` stops you going under).
5. **Stray culling must check whole-object WORLD POSITION, not just bounding-sphere radius.** The Palapa
   solidify blew one vertex to ~93 km; a small mesh floating 21 km up has a *small* radius — a radius
   check alone misses it. `build_level.py` drops any mesh with `max(dimensions) > 1 km`; the engine
   loader also drops meshes whose world-centre is > 2 km out.
6. **Use FBX2glTF, never Blender's FBX importer** for the 84 MB FBX (access-violates even headless). GLB
   imports are robust.
7. **Verification:** Claude-Preview `preview_screenshot` **times out on the r3f canvas** (continuous RAF
   render loop never goes "idle"). Verify 3D either via headless `render_check.py` (Workbench PNG) or by
   eval-ing the three.js scene state. Browser screenshots of the 3D view do not work through the preview tool.
8. **Toolchain:** pnpm is at `C:\Users\FLX\AppData\Roaming\npm\pnpm.cmd` (installed via `npm i -g pnpm`;
   corepack's shim never landed on PATH). Install the web tree only:
   `pnpm install --filter "@600b/web..."` (skips the native better-sqlite3 build in apps/server).

## v27 model prep (current source — 2026-06-20)

Felix re-exported a lighter model: `G:\projekte\PoC\SanSatPalastofCulture\SanSatComCen27.fbx` (49 MB,
down from 84). **It still crashes Blender's FBX importer** (the bad Revit construct is size-independent)
→ FBX2glTF → `09-art/SanSatComCen27.glb` (40 MB, 2465 objs, **1.15M tris**). Then `strip_categories.py`:

| stripped | objs | tris |
|---|---|---|
| Textil (sun sails) | 26 | 208 |
| **Glas (all glass)** | **604** | **1,008,251** |
| Licht-streifen (`BSH Träger…Licht`, duplicate skeleton) | 280 | 6,184 |
| Umgebung + Mauer (132 m ground slab + 4 perimeter walls) | 5 | 568 |
| **kept** → `09-art/SanSatComCen27_clean.glb` (5.9 MB) | **1550** | **134,956** |

Lesson: **the glass railings (`Geländer Aluminco_Crystaline …Glass`) were the entire hog — 51 of them
= ~1.0M tris** (87% of the model). Stripping glass alone drops to game budget; gameify's decimation is
now almost moot, its remaining value is material-merge + toon colours + columnize. The environment/wall
is removed purely by footprint (>100 m; the building tops out at 63 m, so the threshold is unambiguous).
**`SanSatComCen27_clean.glb` is the new pipeline base, replacing `SanSatComCen_conv.glb`** — it still
carries the named Geschossdecken, so `build_level.py` can still pull the floor contour from it.

**RAN through the pipeline (2026-06-20):** `gameify.py` (clean) → `600B_PALACE_HQ_v27.glb` (8 groups,
42k tris, **8 draw calls** — was 1550 meshes) → `build_level.py` → **`apps/web/public/palace.glb`**
(8 meshes incl. `600B_FLOOR`, **40k tris, 1.9 MB**, grounded: FLOOR + deck at y=0, substructure to −6,
mast to 34.5). gameify groups: Concrete/RammedEarth/Stone/PV/Steel/Door + a **`Column` group (orange, matched before
concrete so vertical supports win but concrete *beams* stay grey)**. **Palapa (RoofPalm) is now KEPT** —
it was the gameify *solidify* that blew a vertex to >1 km; `ROOF` no longer solidifies it, so the palm
roofs stay as flat (double-sided) membranes (Felix: keep it simple — leave it as-is as much as possible).
Finally `texturize.py` adds per-material tileable textures + cube UVs so it isn't flat-monotone.
Current asset: 10 meshes, **~41.8k tris, 2.2 MB**, textured. The engine picks up the new asset on a hard
reload (cached as `/palace.glb`).

## Where the pipeline hands off to the engine

- Output `palace.glb` → `apps/web/public/palace.glb`.
- Loaded by `apps/web/src/scene/Palace.tsx` (XZ-centre, keep Y, defensive stray cull, shadows).
- Wrapped by `apps/web/src/scene/PalaceScene.tsx` (Canvas, lights, OrbitControls, HUD).
- Launched from `frontend/GameFrontend.tsx`: `EngineHandoff → <PalaceScene target="hq" />`.

## Done

- ✅ Grounded building (deck at y=0) + floor contour, in one `palace.glb`.
- ✅ Engine loads it correctly; `EngineHandoff` wired to `PalaceScene`.
- ✅ Build is reproducible via `build_level.py`.

## Next / to wire in a new session

- **Floor contour visibility** — it currently sits coincident with the building footprint (hidden under
  the building's own deck). Decide: extend it outward as a plaza, or keep as-is.
- **Over-water piles** — optional opaque water/ground plane at deck level if they read badly from low angles.
- **Palm roofs (Palapa)** — were degenerate garbage and got dropped; rebuild clean.
- **Sail furl animation** — rig exists in `09-art/palace_sails_furl.blend`; put it on the building.
- **Walkable** — character + walk controller (ecctrl), collision against `600B_FLOOR`.
- **LOD1/2**, and fold the multi-step pipeline into one orchestrating script.
- **Level-builder frontend** — wire `frontend/LevelBuildHandoff.tsx` (currently a stub) to a real
  builder/editor runtime.
