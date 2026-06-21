import type { AvatarConfig } from "@600b/shared";
import { Suspense } from "react";
import { CharacterModel } from "./CharacterModel";
import { VrmAvatar } from "./VrmAvatar";

// The configured Builder avatar. Empty today (no VRM asset yet) → procedural placeholder. When the
// VRoid Builder VRM + a Mixamo idle clip land (see docs/AVATAR-PIPELINE.md), point these at the
// files (or wire to character.avatarVrmRef) and every avatar becomes a real animated VRM with no
// other code change. Put assets under apps/web/public/avatar/.
const BUILDER_VRM_URL = "/avatar/sample.vrm";
const BUILDER_IDLE_CLIP = "/avatar/clip.fbx";

/**
 * Renders the player avatar: a real animated VRM when one is configured, otherwise the procedural
 * placeholder built from the `AvatarConfig`. The single switch point so the rest of the scene never
 * cares which it is.
 */
export function AvatarView({
  config,
  vrmUrl = BUILDER_VRM_URL,
  animationUrl = BUILDER_IDLE_CLIP,
}: {
  config: AvatarConfig;
  vrmUrl?: string;
  animationUrl?: string;
}) {
  if (!vrmUrl) return <CharacterModel config={config} />;
  return (
    <Suspense fallback={<CharacterModel config={config} />}>
      <VrmAvatar animationUrl={animationUrl || undefined} url={vrmUrl} />
    </Suspense>
  );
}
