# Revit export — SanSatComCen → game asset (FBX)

*Checklist to get the SanSat Community Center out of Revit and ready for Blender game-ification.
Source: `C:\Users\FLX\OneDriveArchiv\SanSat\SanSatComCen.rvt` (Revit PID 15884). Tailored to the
2026-06-20 scan: 18,991 elements, no planting, no furniture — an open, multi-level cable-stayed
pavilion over water.*

**Recycled as the v1 Palace of Culture HQ** — the master hero that national palaces copy (Design
Brief §4). Its open, walkable, ship-like form (mast + rigging = sails) suits first-person Ground
mode; the raw `.rvt` is the *source*, the budgeted GLB is what ships.

This MCP can inspect and export views/images, **not geometry** — so the FBX export itself is the one
manual Revit step. Everything after is Blender (see `BUILD-BRIEF.md` §2 + asset-pipeline doc).

## Target for test #1

**The hall only**, as one FBX — the **v1 Palace of Culture HQ** hero (the master national palaces
copy, Design Brief §4). The causeway, shore terminal, water
and site are **test #2** (repetitive → easy once the pipeline is proven). Budget after Blender:
**30–80k tris LOD0** (hero building), one atlas, draw calls < ~150.

> **Source note:** the Twinmotion scene is **set aside** (ultra-heavy, hundreds of hours of realistic
> detail we'd only strip for a toon game — and the file is mislaid). **We start fresh from Revit→FBX.**
> Upside: that scene proves the Revit materials are well-organized, so the FBX should still carry clean
> material groups (easier atlas + toon-remap).

## Keep (this is the asset — visible, open structure)

- Walls (exterior), Floors, Roofs
- Curtain Wall — Panels (1,242) + Mullions (2,340) + Roof/Wall Grids (367) → **do NOT simplify in
  Revit; keep the detailed source.** Simplification is a Blender/LOD job: LOD0 keeps the rhythm +
  cables (merged to one mesh); LOD1/2 bake the mullion grid into a normal/texture. The realistic PBR
  shading is re-stripped to **flat toon + baked AO** in Blender (Design Brief §1 — stylized, not real).
- Structural Columns (135) + Structural Framing (611) — the skeletal look **is** the design
- The **mast + cable stays** (the tensile roof) and the **beacon/lantern crown** — hero silhouette
- **Roof photovoltaics** — roof type `PVSemitransparent` → **semi-transparent** emissive PV glass (light
  passes through, dappled — not an opaque panel); can carry the world-agent energy mood (hashrate → subtle
  glow). On-theme: a palace that visibly harvests energy.
- **Palm roof `RoofPalm`** — a Mexican **palapa** → stylized toon thatch with **dappled light-through**
  (the semi-transparent quality, while keeping the palapa identity). Mostly static; optional edge sway.
- **Nautilus wind turbines** → see Animatable parts (they spin)
- Stairs / railings that are visible, Doors (18), Windows (8)
- Lighting fixtures + the LED strips → keep minimal; in Blender they become **emissive material**
  (a glow strip/light at ~0 tris), driveable later by the world-agent mood. Don't model them heavy.
- **Water bodies** (already modeled as solids) → export them; in Blender keep only the **top surface**
  (drop the volume) + apply the stylized toon-water shader (deep-teal, gentle waves, cream depth-foam,
  gold glint). The authored pond shape drives the water exactly — no re-authoring. **Category: a custom
  Floor (Geschossdecke)** → exports clean in FBX; in Blender I pick it out by its floor-type name (it
  sits among the 76 Floors) and apply the water shader; real building decks keep the deck material.

## Animatable parts — separated & pivoted in BLENDER (not pre-split in Revit)

A Revit FBX keeps every element as its **own object** (grouped by family/type) — it does **not** weld
the model into one mesh. So **export one FBX of the whole (stripped) hall**; in Blender we then
(a) **merge the static rest** by material, and (b) **pick the movers out by name, set their pivot, and
exclude them from the merge**. Nothing to pre-separate in Revit — just say, per part, *how* it moves:

- [ ] **Hinged doors** → rotate around the hinge edge
- [ ] **Sliding doors (Schiebetüren)** → translate along the track (position, no rotation)
- [ ] **Triangular tilting door** → pivot on its angled tilt axis (custom origin + axis — point it out)
- [ ] **Pirate-house lift — comment `PiratenhausUPDOWN`** (12 elems: 1 floor + 2 walls + 1 roof + 8
  windows, under roof `RovePalm  piratespot`) → an **up/down translation rig with hold positions** (up →
  hold → down → hold, event-triggered). Parent all 12 to one controller, animate its Y, no rotation.
  **Export as its OWN FBX** — the comment tag won't survive FBX, so a separate selection-export keeps the
  group intact. Ids: `2480078, 2480504, 2480505, 2480822, 2590780, 2590808, 2590826, 2590869, 2590896-899`.
- [ ] **Nautilus wind turbines** → spin axis (calm constant rotation)
- [ ] **Roof sails — roof types `Textil1` + `Textil2`** (the "Segel") → animated as **textile**: a cheap vertex-shader
  wind-billow (NOT real-time cloth sim), masked so anchored edges stay pinned and free edges sway; rest
  pose = the authored sail form. Subdivide in Blender if the export mesh is too coarse to deform. Optional
  high-end: bake a Blender cloth sim to a vertex-animation texture and loop it.
- [ ] Optional later: **beacon crown** (slow rotate / glow)

Per part the only question: *does it move, and how — rotate / slide / tilt?* Static → merged hard.

## Kick before export (un-tick in the export view)

Geometry to exclude:
- [ ] **Causeway / bridge + shore terminal** — isolate to the hall only (test #2 later)
- [ ] **Topography / Building Pad / Site** (4 topo, 3 pad) → not exported; replaced in-engine.
  **Water is KEPT** (see Keep) — it's already modeled as solid bodies, so we export it and reduce to the
  top surface in Blender + apply the toon-water shader, rather than re-authoring a plane.
- [ ] Any **interior-only** partitions/clutter not visible from outside (minimal — it's open)

Non-geometry noise (won't mesh anyway, but keep the export clean):
- [ ] Analytical Members (745) + Analytical Nodes (1,572) — **a separate representation, NOT the
  physical steel.** Hiding them does not touch the Stahlbau (Structural Framing/Columns stay). Method:
  `VG` → **Analytical Model Categories** tab → uncheck all. Never delete, just hide — and they're
  lines/nodes anyway, so they wouldn't mesh.
- [ ] HVAC / Electrical load schedules & definitions
- [ ] Sun Study / Sun Path (356), Sketch Lines (2,325), Weak Dims (1,734), Dimensions, Text Notes
- [ ] CLines (233), Constraints (76), Reference Planes, Section Boxes, Scope Boxes

## How to (Revit)

1. Open the 3D view **`{3D}`** (view id 2299063).
2. `VG` (Visibility/Graphics) → **Analytical Model** tab: turn all OFF. **Annotation** tab: turn off
   dims, text, ref planes, lines. **Model** tab: turn off Topography, anything site/water.
3. Select the causeway + terminal elements → **Hide in view** (or draw a **Section Box** tight
   around just the hall — fastest clean isolation).
4. `File → Export → CAD Formats → FBX` (a 3D view must be active).
   - Save to `G:\projekte\PoC\600-Billion-Handover-final\09-art\SanSatComCen_hall.fbx`.
   - Keep materials (helps Blender seed the atlas); units in **meters**.
5. Ping the FBX path → Blender takes over (clean → decimate/retopo → merge curtain wall →
   instance repeats → toon material + 1 atlas → bake AO → `600B_PALACE_HQ_LOD0.glb`).

## Then

Validate the GLB in `08-tools/600-billion-viewer.html` — triangle / draw-call HUD must stay **green**
against the hero budget. Once green end-to-end, the causeway + stylized re-planting (EZ-Tree /
Quaternius trees at the old conifer positions) follow as the next assets.

> Reminder: Blender's MCP bridge must be running (addon → BlenderMCP → Start MCP Server, port 9876)
> before the live game-ify step.
