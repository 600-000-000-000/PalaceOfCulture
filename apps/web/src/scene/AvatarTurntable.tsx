import type { AvatarConfig } from "@600b/shared";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { AvatarView } from "./AvatarView";

/** A slow turntable preview of an avatar — drag to spin, auto-rotates otherwise. Shared by the
 * character builder and the member-select screen. */
export function AvatarTurntable({ config }: { config: AvatarConfig }) {
  return (
    <Canvas camera={{ fov: 38, position: [0, 1.05, 3.1] }} dpr={[1, 2]} shadows>
      <color args={["#1b140d"]} attach="background" />
      <ambientLight intensity={0.7} />
      <hemisphereLight args={["#fff2d6", "#3a2a14", 0.5]} />
      <directionalLight castShadow color="#ffe6ad" intensity={1.7} position={[3, 6, 4]} />
      <AvatarView config={config} locomotion={false} />
      <mesh position={[0, 0.19, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.72, 40]} />
        <meshStandardMaterial color="#241710" roughness={1} />
      </mesh>
      <OrbitControls
        autoRotate
        autoRotateSpeed={1.4}
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI / 2.02}
        minPolarAngle={Math.PI / 3.4}
        target={[0, 1, 0]}
      />
    </Canvas>
  );
}
