# Frontend Handover

Date: 2026-06-20

## What

Built the first frontend-only shell for 600 Billion from the design handoff in:

`G:\projekte\PoC\design_handoff_600b_game_ui`

The app now opens into a clickable in-game UI instead of the old placeholder. The implementation is
intentionally frontend-only: HQ and Home clicks go to a handoff screen where the 3D engine can be
mounted later.

## Implemented

- Shared 600B HUD with screen dropdown, blocktime pill, days-locked pill, avatar badge.
- Five clickable screens: Title, Map, Home, Pleb Market, Style Market.
- Right-side feed rail for each screen with mock Nostr-style posts.
- Title command card with destination picker and timelock chips.
- Map screen with matrix canvas, node markers, filters, and clickable HQ marker.
- Home screen with legend card and build dock.
- Pleb and Style market grids with clickable filter/buttons.
- Pre-engine handoff screen for `Palace of Culture HQ` and `Home Plot`.
- Design background assets copied into the web app public folder.

## Not Implemented Yet

- Real 3D engine/runtime.
- Real Nostr subscriptions or posting.
- Lightning/LNbits payments.
- Real marketplace purchase/trade flows.
- Real Leaflet/Natural Earth map integration.
- Persistent routing; screen state is in React state for now.

## Files

- `apps/web/src/App.tsx`
- `apps/web/src/frontend/GameFrontend.tsx`
- `apps/web/src/frontend/data.ts`
- `apps/web/src/frontend/icons.tsx`
- `apps/web/src/frontend/types.ts`
- `apps/web/src/frontend/frontend.css`
- `apps/web/public/frontend/bg/*.png`
- `docs/FRONTEND-HANDOVER.md`

## Verification

Run from `G:\projekte\PoC\600-Billion-Handover-final\05-build-dev`:

```bash
corepack.cmd pnpm --filter @600b/web typecheck
corepack.cmd pnpm --filter @600b/web build
node_modules\.bin\biome.CMD check apps\web\src\App.tsx apps\web\src\frontend\GameFrontend.tsx apps\web\src\frontend\data.ts apps\web\src\frontend\icons.tsx apps\web\src\frontend\types.ts apps\web\src\frontend\frontend.css
```

All three passed before this handover.

Dev server:

```bash
corepack.cmd pnpm --filter @600b/web dev -- --host 127.0.0.1
```

Current local URL: `http://localhost:5173/`

## Git Notes

Only the frontend slice should be staged for this commit. These existing untracked files are outside
this frontend handover and should stay unstaged unless explicitly needed by the engine or asset
pipeline work:

- `apps/web/public/palace.glb`
- `apps/web/src/scene/Palace.tsx`
- `apps/web/src/scene/PalaceScene.tsx`
- `docs/REVIT-EXPORT.md`
- `packages/assets-pipeline/blender/`
- `pnpm-lock.yaml`

## Next Steps

1. Decide whether URL routing should replace local screen state.
2. Split `GameFrontend.tsx` into smaller screen components once behavior stabilizes.
3. Replace mock feed/listing data with API/Nostr adapters.
4. Mount the 3D engine at the pre-engine handoff boundary.
5. Replace the placeholder map with the real Natural Earth/Leaflet or MapLibre work package.
