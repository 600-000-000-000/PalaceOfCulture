import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useMemo } from "react";
import * as THREE from "three";

const MODEL_URL = "/palace.glb";

/** Door/curtain meshes the player should walk through — these become the building's passages. */
function isPassable(mesh: THREE.Mesh): boolean {
  const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  const name = (material?.name ?? "").toLowerCase();
  return /door|glass/.test(name);
}

/**
 * The HQ level asset (finished EG floor at y=0). Cloned so we can mutate freely without corrupting
 * the cached GLB; re-centred on XZ; and split so the rapier trimesh collider only covers the SOLID
 * shell — door/curtain meshes are lifted out into a render-only group so you can walk through them.
 */
export function Palace() {
  const { scene: original } = useGLTF(MODEL_URL);

  const { solids, passable } = useMemo(() => {
    const solidScene = original.clone(true);
    const passableGroup = new THREE.Group();
    solidScene.updateMatrixWorld(true);

    // drop any stray / blown-up mesh that would wreck the bounds
    const strays: THREE.Object3D[] = [];
    solidScene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry) return;
      mesh.geometry.computeBoundingSphere();
      const sphere = mesh.geometry.boundingSphere;
      if (!sphere) {
        strays.push(mesh);
        return;
      }
      const worldCenter = sphere.center.clone().applyMatrix4(mesh.matrixWorld);
      if (sphere.radius > 2000 || worldCenter.length() > 2000) strays.push(mesh);
    });
    for (const mesh of strays) mesh.parent?.remove(mesh);

    // re-centre on XZ, keep Y (the deck sits at y=0)
    const box = new THREE.Box3().setFromObject(solidScene);
    const center = box.getCenter(new THREE.Vector3());
    solidScene.position.set(-center.x, 0, -center.z);
    solidScene.updateMatrixWorld(true);

    // shadows + collect the passable (door/glass) meshes
    const doors: THREE.Mesh[] = [];
    solidScene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (isPassable(mesh)) doors.push(mesh);
    });
    // move them out of the collider scene, preserving world transform → still visible, no collision
    for (const door of doors) passableGroup.attach(door);

    return { solids: solidScene, passable: passableGroup };
  }, [original]);

  return (
    <>
      <RigidBody colliders="trimesh" friction={1} type="fixed">
        <primitive object={solids} />
      </RigidBody>
      <primitive object={passable} />
    </>
  );
}

useGLTF.preload(MODEL_URL);
