# viewers

The drag-and-drop GLB/GLTF/VRM asset viewer with a triangle / mesh / draw-call **budget HUD** is
the gate every asset must pass (green) before it ships.

It already exists in the handover package — **do not duplicate it**:

→ [`../../08-tools/600-billion-viewer.html`](../../08-tools/600-billion-viewer.html)

Open it in a browser and drop a `.glb` / `.vrm` to check it against the budgets in
`BUILD-BRIEF.md` §4. When the pipeline (`@600b/assets-pipeline`) produces real output, this is
where it gets validated.
