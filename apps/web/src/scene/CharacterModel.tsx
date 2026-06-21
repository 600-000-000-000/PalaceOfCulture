import type { AvatarConfig } from "@600b/shared";

/**
 * The player's placeholder avatar — a low-poly builder driven by the slot-based `AvatarConfig`
 * (skin, aura, body, hair, headwear). Pure visual; locomotion/physics are the Ecctrl controller's
 * job. **Vertical positions and the overall height are fixed** so the Ecctrl capsule alignment
 * never shifts — only colours, the torso width, and the hair/hat slots vary. The documented VRM
 * "Builder" kit replaces this whole component once the AvatarComposer + asset kit land (ADR 0003).
 */

const TORSO_RADIUS: Record<AvatarConfig["gender"], number> = {
  feminine: 0.27,
  masculine: 0.33,
  neutral: 0.3,
};

function hairColor(age: AvatarConfig["age"]): string {
  return age === "elder" ? "#cfc6b8" : "#3a2a1a";
}

export function CharacterModel({ config }: { config: AvatarConfig }) {
  const aura = config.aura;
  const torsoR = TORSO_RADIUS[config.gender];
  const hair = hairColor(config.age);

  return (
    <group>
      {/* legs */}
      <mesh castShadow position={[-0.14, 0.34, 0]}>
        <capsuleGeometry args={[0.13, 0.4, 4, 10]} />
        <meshStandardMaterial color="#2e2317" roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0.14, 0.34, 0]}>
        <capsuleGeometry args={[0.13, 0.4, 4, 10]} />
        <meshStandardMaterial color="#2e2317" roughness={0.85} />
      </mesh>
      {/* torso (hoodie in the player's aura) */}
      <mesh castShadow position={[0, 1.0, 0]}>
        <capsuleGeometry args={[torsoR, 0.5, 6, 16]} />
        <meshStandardMaterial color={aura} roughness={0.6} />
      </mesh>
      {/* maker apron front panel */}
      {config.outfit === "apron" ? (
        <mesh position={[0, 0.92, torsoR - 0.02]}>
          <boxGeometry args={[0.32, 0.52, 0.04]} />
          <meshStandardMaterial color="#f6ecd2" roughness={0.85} />
        </mesh>
      ) : null}
      {/* tool belt (a maker, not a warrior) */}
      <mesh position={[0, 0.76, 0]}>
        <torusGeometry args={[torsoR + 0.01, 0.06, 10, 24]} />
        <meshStandardMaterial color="#e7b23c" metalness={0.5} roughness={0.35} />
      </mesh>
      {/* arms */}
      <mesh castShadow position={[-(torsoR + 0.1), 1.06, 0]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.1, 0.42, 4, 10]} />
        <meshStandardMaterial color={aura} roughness={0.6} />
      </mesh>
      <mesh castShadow position={[torsoR + 0.1, 1.06, 0]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.1, 0.42, 4, 10]} />
        <meshStandardMaterial color={aura} roughness={0.6} />
      </mesh>
      {/* head */}
      <mesh castShadow position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color={config.skinTone} roughness={0.7} />
      </mesh>
      {/* hair (only when nothing covers it) */}
      {config.headwear === "none" ? (
        <>
          <mesh
            position={[0, 1.75, -0.01]}
            scale={[1.05, config.hair === "buzz" ? 0.4 : 0.62, 1.05]}
          >
            <sphereGeometry args={[0.205, 18, 18]} />
            <meshStandardMaterial color={hair} roughness={0.85} />
          </mesh>
          {config.hair === "long" ? (
            <mesh position={[0, 1.42, -0.13]}>
              <boxGeometry args={[0.3, 0.42, 0.1]} />
              <meshStandardMaterial color={hair} roughness={0.85} />
            </mesh>
          ) : null}
          {config.hair === "bun" ? (
            <mesh position={[0, 1.93, -0.06]}>
              <sphereGeometry args={[0.1, 14, 14]} />
              <meshStandardMaterial color={hair} roughness={0.85} />
            </mesh>
          ) : null}
        </>
      ) : null}
      {/* headwear */}
      {config.headwear === "cap" ? (
        <mesh castShadow position={[0, 1.8, -0.02]}>
          <coneGeometry args={[0.2, 0.18, 18]} />
          <meshStandardMaterial color={aura} roughness={0.6} />
        </mesh>
      ) : null}
      {config.headwear === "beanie" ? (
        <mesh castShadow position={[0, 1.74, 0]} scale={[1, 0.7, 1]}>
          <sphereGeometry args={[0.23, 18, 18]} />
          <meshStandardMaterial color={aura} roughness={0.7} />
        </mesh>
      ) : null}
      {/* face visor (front = +z) */}
      <mesh position={[0, 1.63, 0.19]}>
        <boxGeometry args={[0.18, 0.05, 0.08]} />
        <meshStandardMaterial color="#1c130a" />
      </mesh>
    </group>
  );
}
