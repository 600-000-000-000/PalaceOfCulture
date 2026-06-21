import type { VRM } from "@pixiv/three-vrm";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { mixamoVRMRigMap } from "./mixamoVRMRigMap";

/**
 * Load a Mixamo `.fbx` clip and retarget it onto a VRM's normalized humanoid skeleton, returning a
 * three.js `AnimationClip` ready for an `AnimationMixer`. Vendored from the official @pixiv/three-vrm
 * example (MIT) and typed for our strict build.
 *
 * This is the "Mixamo → VRM bones" bridge (ADR 0003): because every VRM shares the same humanoid
 * bone set, one shared clip library (Mixamo / ActorCore / Mesh2Motion) animates every avatar — you
 * never rig or animate per avatar.
 */
export function loadMixamoAnimation(url: string, vrm: VRM): Promise<THREE.AnimationClip | null> {
  const loader = new FBXLoader();
  return loader.loadAsync(url).then((asset) => {
    const clip = THREE.AnimationClip.findByName(asset.animations, "mixamo.com");
    if (!clip) return null;

    const tracks: THREE.KeyframeTrack[] = [];
    const restRotationInverse = new THREE.Quaternion();
    const parentRestWorldRotation = new THREE.Quaternion();
    const quat = new THREE.Quaternion();
    const vec = new THREE.Vector3();

    const hipsNode = asset.getObjectByName("mixamorigHips");
    const vrmHips = vrm.humanoid?.getNormalizedBoneNode("hips");
    if (!hipsNode || !vrmHips) return null;

    const motionHipsHeight = hipsNode.position.y;
    const vrmHipsY = vrmHips.getWorldPosition(vec).y;
    const vrmRootY = vrm.scene.getWorldPosition(vec).y;
    const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY);
    const hipsPositionScale = motionHipsHeight === 0 ? 1 : vrmHipsHeight / motionHipsHeight;

    const isVrm0 = vrm.meta?.metaVersion === "0";

    for (const track of clip.tracks) {
      const [mixamoRigName, propertyName] = track.name.split(".");
      if (!mixamoRigName || !propertyName) continue;
      const vrmBoneName = mixamoVRMRigMap[mixamoRigName];
      if (!vrmBoneName) continue;
      const vrmNodeName = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName)?.name;
      const mixamoRigNode = asset.getObjectByName(mixamoRigName);
      if (!vrmNodeName || !mixamoRigNode?.parent) continue;

      mixamoRigNode.getWorldQuaternion(restRotationInverse).invert();
      mixamoRigNode.parent.getWorldQuaternion(parentRestWorldRotation);

      if (track instanceof THREE.QuaternionKeyframeTrack) {
        const values = Array.from(track.values);
        for (let i = 0; i < values.length; i += 4) {
          quat.fromArray(values, i);
          quat.premultiply(parentRestWorldRotation).multiply(restRotationInverse);
          quat.toArray(values, i);
          if (isVrm0) {
            values[i] = -(values[i] ?? 0);
            values[i + 2] = -(values[i + 2] ?? 0);
          }
        }
        tracks.push(
          new THREE.QuaternionKeyframeTrack(
            `${vrmNodeName}.${propertyName}`,
            Array.from(track.times),
            values,
          ),
        );
      } else if (track instanceof THREE.VectorKeyframeTrack) {
        const values = Array.from(track.values).map(
          (v, i) => (isVrm0 && i % 3 !== 1 ? -v : v) * hipsPositionScale,
        );
        tracks.push(
          new THREE.VectorKeyframeTrack(
            `${vrmNodeName}.${propertyName}`,
            Array.from(track.times),
            values,
          ),
        );
      }
    }

    return new THREE.AnimationClip("vrmAnimation", clip.duration, tracks);
  });
}
