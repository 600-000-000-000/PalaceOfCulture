// Dynamic timelock sprite — a small Tamagotchi-style image that evolves with the lock's growth stage.
// Tree: seed → sprout → sapling → ringed oak. Ship: scattered parts → frame → hull+nose → launch-ready.
// Special: a sealed crate that brightens as it ripens. Parametric SVG so a single component covers all
// stages. Stage comes from growth.ts (driven by the lock's age). Used in the Home legendwall lock cards.

import type { TimelockAssetKind } from "../scene/timelockAssets";

function TreeSprite({ stage }: { stage: number }) {
  const baseY = 54;
  const trunkH = 7 + stage * 6;
  const top = baseY - trunkH;
  return (
    <>
      <ellipse cx="32" cy="57" fill="#4a3a22" opacity="0.7" rx="17" ry="3.5" />
      {stage >= 3 ? (
        <ellipse cx="32" cy="54.5" fill="none" rx="8" ry="2.6" stroke="#e7b23c" strokeWidth="1.6" />
      ) : null}
      <rect fill="#5a3d22" height={trunkH} rx="1.8" width="3.6" x="30.2" y={top} />
      {stage === 0 ? <circle cx="32" cy="50" fill="#2bd07a" r="3.2" /> : null}
      {stage >= 1 ? <circle cx="32" cy={top} fill="#2b9079" r={5 + stage * 2.6} /> : null}
      {stage >= 2 ? <circle cx={32 - (5 + stage)} cy={top + 3} fill="#23806f" r="4.5" /> : null}
      {stage >= 2 ? <circle cx={32 + (5 + stage)} cy={top + 3} fill="#2bd07a" r="4.5" /> : null}
      {stage >= 3 ? <circle cx="32" cy={top - 5} fill="#2bd07a" r="5" /> : null}
    </>
  );
}

function ShipSprite({ stage }: { stage: number }) {
  return (
    <>
      <ellipse cx="32" cy="51" fill="#4a4a50" opacity="0.5" rx="14" ry="3" />
      {stage === 0 ? (
        <>
          <rect fill="#9a8a62" height="4" rx="2" width="10" x="20" y="47" />
          <rect fill="#9a8a62" height="3" rx="1.5" width="8" x="34" y="49" />
        </>
      ) : null}
      {stage === 1 ? (
        <polygon fill="none" points="32,18 24,49 40,49" stroke="#b7a06a" strokeWidth="2" />
      ) : null}
      {stage >= 2 ? (
        <>
          <path d="M26 49 L26 34 Q32 22 38 34 L38 49 Z" fill="#e9e2d2" />
          <polygon fill="#f4eedd" points="32,15 28,30 36,30" />
          <circle cx="32" cy="37" fill="#9fd0ff" r="2.4" />
        </>
      ) : null}
      {stage >= 3 ? <polygon fill="#f08a55" points="28,49 36,49 32,61" /> : null}
    </>
  );
}

function SealedSprite({ stage }: { stage: number }) {
  const glow = 0.25 + stage * 0.25;
  return (
    <>
      <rect fill="#4b4540" height="24" rx="3" width="24" x="20" y="30" />
      <rect
        fill="none"
        height="24"
        opacity={glow}
        rx="3"
        stroke="#e7b23c"
        strokeWidth="1.8"
        width="24"
        x="20"
        y="30"
      />
      {stage >= 2 ? <polygon fill="#e7b23c" opacity={glow} points="32,18 28,27 36,27" /> : null}
      {stage >= 3 ? <circle cx="32" cy="21" fill="#e7b23c" r="2.2" /> : null}
    </>
  );
}

/** The evolving asset sprite for a timelock — kind (tree/ship/special) × growth stage. */
export function GrowthSprite({
  kind,
  stage,
  size = 46,
}: {
  kind: TimelockAssetKind;
  stage: number;
  size?: number;
}) {
  return (
    <svg aria-hidden="true" height={size} role="img" viewBox="0 0 64 64" width={size}>
      {kind === "tree" ? (
        <TreeSprite stage={stage} />
      ) : kind === "spaceship" ? (
        <ShipSprite stage={stage} />
      ) : (
        <SealedSprite stage={stage} />
      )}
    </svg>
  );
}
