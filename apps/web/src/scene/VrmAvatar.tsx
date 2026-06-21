import { type VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { GLTFLoader, GLTFParser } from "three/examples/jsm/loaders/GLTFLoader.js";
import { loadMixamoAnimation } from "./loadMixamoAnimation";

// Normalise any VRM to a known height with feet at the group origin, so it drops into the builder
// preview and (with the −0.9 capsule offset) the PalaceScene without per-asset tuning.
const TARGET_HEIGHT = 1.7;

/**
 * Renders a VRM avatar and (optionally) plays a Mixamo clip retargeted to its humanoid skeleton.
 * Always rendered behind `AvatarView`, which falls back to the procedural `CharacterModel` when no
 * VRM is configured yet (ADR 0003).
 */
export function VrmAvatar({ url, animationUrl }: { url: string; animationUrl?: string }) {
  // drei and three ship structurally-different GLTFLoader types; cast once (same loader at runtime).
  const gltf = useGLTF(url, true, true, (loader) => {
    (loader as unknown as GLTFLoader).register((parser: GLTFParser) => new VRMLoaderPlugin(parser));
  });
  const vrm = gltf.userData.vrm as VRM;
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  // One-time per cached asset: drop unused data, face +Z, scale to TARGET_HEIGHT, feet to y=0.
  const root = useMemo(() => {
    if (!vrm.scene.userData.prepared) {
      VRMUtils.removeUnnecessaryVertices(vrm.scene);
      VRMUtils.combineSkeletons(vrm.scene);
      VRMUtils.rotateVRM0(vrm);

      const bounds = new THREE.Box3().setFromObject(vrm.scene);
      const height = bounds.max.y - bounds.min.y || 1;
      vrm.scene.scale.setScalar(TARGET_HEIGHT / height);
      vrm.scene.position.y -= new THREE.Box3().setFromObject(vrm.scene).min.y;

      vrm.scene.traverse((object) => {
        object.castShadow = true;
        object.frustumCulled = false;
      });
      vrm.scene.userData.prepared = true;
    }
    return vrm.scene;
  }, [vrm]);

  useEffect(() => {
    if (!animationUrl) return;
    let cancelled = false;
    const mixer = new THREE.AnimationMixer(vrm.scene);
    mixerRef.current = mixer;
    loadMixamoAnimation(animationUrl, vrm)
      .then((clip) => {
        if (cancelled || !clip) return;
        mixer.clipAction(clip).play();
      })
      .catch(() => {
        /* missing/invalid clip — the avatar just stands in its rest pose */
      });
    return () => {
      cancelled = true;
      mixer.stopAllAction();
      mixerRef.current = null;
    };
  }, [animationUrl, vrm]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
    vrm.update(delta);
  });

  return <primitive object={root} />;
}
