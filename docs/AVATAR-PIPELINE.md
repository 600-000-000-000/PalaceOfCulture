# Avatar pipeline — identity → simplified toon humanoid → rigged VRM (Linux, headless, agent-callable)

How we turn an identity reference (a PFP, a concept image, or a text prompt) into a **simplified,
stylized, humanoid VRM** that drops straight into the game and animates. Built to run **headless on
a Linux GPU box**, as a single entrypoint an **AI agent can call on demand**. FOSS-first.

This is the *authoring* side. The *runtime* side (loading the VRM, playing animations) already lives
in the client — see `apps/web/src/scene/VrmAvatar.tsx` and ADR 0003.

---

## 0. What must come out (the contract)

Every avatar the pipeline emits MUST be:

- **VRM 1.0** (`.vrm`, glTF-2.0-based) with a complete **VRM Humanoid** bone set. The humanoid bones
  are non-negotiable: they're what let one shared animation library drive every avatar (§5).
- **Simplified, stylized, humanoid, toon** — the art direction (see references in
  `G:\Github\600000000000\img`; the `sat` / `quillie` register, not the Midjourney-realistic ones).
  **MToon** toon material, warm palette. Humanoid only — animals (boar/donkey/…) are *pets*, not
  avatar bodies.
- **Within budget (target device = Pixel 8+; below that need not run):** hero avatar ≤ ~50k tris,
  ≤ 4 materials, ≤ ~90 humanoid bones + a few spring-bone chains (hair/cloth). Far-crowd avatars get
  an impostor/low-LOD (LOD-by-importance).
- **Content-hashed** (sha256) and registered in the asset manifest; optionally mirrored to **Blossom**
  (`avatarVrmRef` on the `Character` record — ADR 0003).

If a result is over budget or off-style, the pipeline **downgrades or rejects** it and logs why.

---

## 1. Where it runs

- Felix's **Linux GPU workstation** (`alflx`). NVIDIA GPU: 6 GB VRAM runs the pragmatic path
  (Hunyuan3D), 24 GB unlocks the best quality (TRELLIS.2).
- Lives in the monorepo at **`packages/assets-pipeline/avatar/`**, next to the existing Blender
  level pipeline (`packages/assets-pipeline/blender/`, see that folder's HANDOFF.md). Same spirit:
  scripted, reproducible, `blender --background`.
- An **AI agent invokes one entrypoint** (`avatar_pipeline.py`, §6) and gets a VRM + a JSON report
  back. Each stage is a separate module so any tool can be swapped without touching the others.

---

## 2. The stages

```
identity ref / prompt
        │
   (1) STYLIZE      realistic PFP → toon-humanoid concept image   [ComfyUI + SDXL, optional]
        │
   (2) IMAGE→3D     concept image → textured GLB mesh             [Hunyuan3D 2.1  | TRELLIS.2]
        │
   (3) AUTO-RIG     GLB mesh → humanoid skeleton + skin weights   [Hunyuan3D rig | UniRig | AccuRIG]
        │
   (4) → VRM+MToon  rigged GLB → VRM 1.0, humanoid bones, MToon   [Blender + VRM-Addon, headless]
        │
   (5) VALIDATE     budget + style gate (tris/materials/bones)    [gltf-transform / a small check]
        │
   (6) PUBLISH      content-hash, manifest, (optional) Blossom    [our asset pipeline]
        ▼
   builder.vrm  →  apps/web/public/avatar/  (or CDN + manifest)
```

### (1) Stylize — realistic → toon (optional)
Only needed when the input is a realistic photo/PFP. A raw image→3D of a realistic face yields a
realistic bust — off-brand. Convert to the toon-humanoid register first.
- **[ComfyUI](https://github.com/comfyanonymous/ComfyUI)** (GPL-3.0 — operate as a service, fine)
  running an **SDXL** img2img graph with a toon/stylized LoRA, full-body framing, neutral A-pose
  prompt. Headless via ComfyUI's HTTP API (`/prompt`).
- Skip this stage for text-prompt inputs — generate the concept directly in the toon style.

### (2) Image → 3D mesh
- **[Hunyuan3D 2.1](https://github.com/Tencent/Hunyuan3D-2)** (Tencent) — **pragmatic default**: runs
  on **6 GB VRAM**, two-stage DiT (geometry then texture), exports GLB, and has rigging/animation
  tooling. Check its model license for commercial terms before shipping output.
- **[TRELLIS.2](https://github.com/microsoft/TRELLIS)** (Microsoft, **MIT**) — **best quality**:
  needs **24 GB VRAM** (A100/H100-class), CUDA 12.4, sparse-voxel topology, full PBR. Use if the box
  has the GPU.
- Tripo / Rodin generate well but have **no native rigging** → they'd force stage 3 anyway; prefer the
  two above. Output of this stage: a single textured **GLB**, T/A-pose, Y-up, metres.

### (3) Auto-rig to a humanoid skeleton
The mesh must get a humanoid skeleton mappable to VRM humanoid bones.
- **Hunyuan3D's own rigging** (if staying in that toolchain) — simplest.
- **[UniRig](https://github.com/VAST-AI-Research/UniRig)** — open auto-rig (skeleton + skin weights)
  from a mesh; scriptable.
- **[AccuRIG 2](https://actorcore.reallusion.com/auto-rig)** (Reallusion, free) — excellent humanoid
  auto-rig + direct **ActorCore** animation library; GUI-first, batch via its CLI/watch-folder.
- Fallback: **Blender + Rigify** (manual-ish) for hero hand-rigs.
Name bones so stage 4's mapping is trivial (Mixamo `mixamorig*` names work — we already map them).

### (4) → VRM 1.0 + MToon (the headless heart)
**[VRM-Addon-for-Blender](https://github.com/saturday06/VRM-Addon-for-Blender)** (MIT, Blender
2.93–5.1) is the FOSS path to author/convert VRM headless. A Blender Python script
(`blender --background --python make_vrm.py -- in.glb out.vrm`) that:
1. imports the rigged GLB,
2. adds the **VRM Humanoid** and assigns each bone (`scene.vrm_addon_extension…` API / the addon's
   operators),
3. converts materials to **MToon** (toon ramp, rim, the warm palette),
4. sets a few **spring-bone** chains (hair/cloth) for life,
5. exports `.vrm` (the addon delegates mesh/material to Blender's glTF exporter, then injects the VRM
   extensions).

Keep this script in `packages/assets-pipeline/avatar/blender/make_vrm.py`. Mirror the existing level
pipeline's headless conventions (`--factory-startup`, explicit addon enable).

### (5) Validate (budget + style gate)
- **[gltf-transform](https://github.com/donmccurdy/glTF-Transform)** (MIT, CLI/Node) `inspect` →
  tris, materials, textures; reject/downgrade over budget (§0). Reuse the viewer/budget logic from
  `08-tools/600-billion-viewer.html`.
- Confirm a complete VRM Humanoid (all required bones present) — a missing bone breaks shared
  animation. Optional: a quick CLIP/aesthetic check that it still reads "toon", not "realistic".
- **No silent caps:** if a result is downgraded or rejected, log it in the JSON report.

### (6) Publish
- Content-hash the `.vrm` (sha256), name `600B_AVATAR_<id>_LOD0.vrm`, write to the CDN + JSON
  manifest (the existing asset pipeline). Optionally upload to **Blossom** (`blossom-client-sdk`) and
  put the hash in `Character.avatarVrmRef`. Generate a LOD1/impostor for far-crowd.

---

## 5. Animation — shared, NOT per-avatar (already wired)

You never rig or animate per avatar. Because every VRM shares the humanoid bone set:

1. Get clips **once** — **[Mixamo](https://www.mixamo.com)** (free), **ActorCore** (with AccuRIG),
   or **[Mesh2Motion](https://github.com/scottpetrovic/mesh2motion-app)** (open-source) — idle, walk,
   run, wave, sit.
2. They retarget to the VRM humanoid skeleton at **runtime** in `three-vrm` — already implemented:
   `apps/web/src/scene/loadMixamoAnimation.ts` + `mixamoVRMRigMap.ts` (vendored from the official
   three-vrm example), played by `VrmAvatar.tsx`.
3. Optional offline variant: bake Mixamo→VRM clips in Blender headless and ship `.vrma` files.

So the pipeline above only has to emit a **correctly-boned VRM**; movement is free.

---

## 6. The agent interface

One entrypoint, JSON in / JSON out, idempotent (content-hashed), each stage swappable:

```bash
python packages/assets-pipeline/avatar/avatar_pipeline.py \
  --input  path/to/pfp.png            # or --prompt "a calm bearded builder, teal hoodie, toolbelt"
  --identity '{"hair":"long","outfit":"hoodie","aura":"#1f6b62"}'   # optional AvatarConfig hints
  --out    out/                       # writes <hash>.vrm + report.json
  --engine hunyuan3d                  # hunyuan3d | trellis2
  --quality builder                   # budget profile
```

`report.json` = `{ vrm, sha256, tris, materials, bones, humanoidComplete, downgraded, notes }`.
The agent reads it, and on `humanoidComplete:false` or over-budget it retries/escalates. Wrap the
stages as separate Python modules (`stylize.py`, `image_to_3d.py`, `autorig.py`, `to_vrm.py`,
`validate.py`, `publish.py`) so a stage can be replaced (e.g. hunyuan3d → trellis2, or swap in a
Meshy API call) without touching the others.

---

## 7. Install (Linux), hardware, licensing

**Install** (per-tool, isolated envs):
- Conda env per model (TRELLIS.2: CUDA 12.4, Python 3.8+, 24 GB GPU; Hunyuan3D: 6 GB GPU).
- ComfyUI (own venv) + SDXL + a toon LoRA, started with `--listen` for API access.
- Blender 5.x + **VRM-Addon-for-Blender** (extensions.blender.org or the GitHub addon), enabled in
  the headless script.
- Node + `@gltf-transform/cli` for validation.

**Hardware split:** the *pipeline* needs a GPU box (6–24 GB). The *runtime* (the game) targets
**Pixel 8+ / desktop** — the avatars are authored heavy, then budget-clamped (§0) for the client.

**Licensing (FOSS-first):**
- MIT/free to use & ship output: TRELLIS.2 (MIT), VRM-Addon-for-Blender (MIT), gltf-transform (MIT),
  Blender (GPL — tool, not linked), AccuRIG/ActorCore (free, check ToS), Mesh2Motion (open).
- **Check before shipping output:** Hunyuan3D model license (commercial terms), any SDXL LoRA
  license, Mixamo clip terms (fine to use in projects; don't redistribute the raw FBX library).
- ComfyUI is GPL-3.0 — run it as a separate service (operate-only), don't fold it into a binary.

---

*The hard rule (ADR 0003): the `AvatarConfig` / identity is the source of truth; the VRM is derived
art. This pipeline is one (automatable) way to derive it — the runtime never cares how the VRM was
made, only that it's a budget-clean humanoid VRM.*
