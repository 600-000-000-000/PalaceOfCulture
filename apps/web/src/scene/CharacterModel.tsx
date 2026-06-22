import type { AvatarConfig } from "@600b/shared";

/**
 * The player's placeholder avatar — a low-poly builder driven by the slot-based `AvatarConfig`
 * (skin, aura, body, hair, headwear, outfit). Pure visual; locomotion/physics are the Ecctrl
 * controller's job. **Vertical positions and the overall height are fixed** so the Ecctrl capsule
 * alignment never shifts — only colours, body width, the hair/hat slots and the outfit vary. The
 * VRM "Builder" kit replaces this whole component once the AvatarComposer + asset kit land (ADR 0003).
 */

// Per-gender silhouette: narrow waist + wide hips (+ a subtle chest) reads feminine; broad torso +
// narrow hips reads masculine. Tasteful, stylised — the real body shapes come from the VRM kit.
const BODY: Record<AvatarConfig["gender"], { torso: number; hip: number; chest: boolean }> = {
  feminine: { torso: 0.26, hip: 0.31, chest: true },
  masculine: { torso: 0.33, hip: 0.25, chest: false },
  neutral: { torso: 0.3, hip: 0.27, chest: false },
};

const LEG = "#2e2317";

function hairColor(age: AvatarConfig["age"]): string {
  return age === "elder" ? "#cfc6b8" : "#3a2a1a";
}

/** Hair slot — a handful of low-poly styles. Only shown when no headwear covers it. */
function Hair({ style, color }: { style: string; color: string }) {
  const crownScaleY = style === "buzz" ? 0.4 : style === "curly" ? 0.82 : 0.62;
  const crownRadius = style === "curly" ? 0.225 : 0.205;
  const hasCrown = style !== "afro" && style !== "mohawk";

  return (
    <>
      {hasCrown ? (
        <mesh position={[0, 1.75, -0.01]} scale={[1.05, crownScaleY, 1.05]}>
          <sphereGeometry args={[crownRadius, 18, 18]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      ) : null}

      {style === "long" ? (
        <mesh position={[0, 1.42, -0.13]}>
          <boxGeometry args={[0.3, 0.42, 0.1]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      ) : null}

      {style === "bun" ? (
        <mesh position={[0, 1.93, -0.06]}>
          <sphereGeometry args={[0.1, 14, 14]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      ) : null}

      {style === "ponytail" ? (
        <>
          <mesh position={[0, 1.8, -0.16]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.46, -0.2]} rotation={[0.25, 0, 0]}>
            <capsuleGeometry args={[0.05, 0.34, 4, 8]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
        </>
      ) : null}

      {style === "pigtails" ? (
        <>
          <mesh position={[-0.23, 1.5, -0.02]} rotation={[0, 0, 0.25]}>
            <capsuleGeometry args={[0.05, 0.26, 4, 8]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          <mesh position={[0.23, 1.5, -0.02]} rotation={[0, 0, -0.25]}>
            <capsuleGeometry args={[0.05, 0.26, 4, 8]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
        </>
      ) : null}

      {style === "braid" ? (
        <>
          <mesh position={[0, 1.46, -0.15]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.31, -0.15]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.18, -0.15]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
        </>
      ) : null}

      {style === "afro" ? (
        <mesh castShadow position={[0, 1.74, -0.02]}>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      ) : null}

      {style === "mohawk" ? (
        <mesh castShadow position={[0, 1.82, -0.01]}>
          <boxGeometry args={[0.07, 0.16, 0.42]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      ) : null}
    </>
  );
}

export function CharacterModel({ config }: { config: AvatarConfig }) {
  const aura = config.aura;
  const body = BODY[config.gender];
  const torsoR = body.torso;
  const hair = hairColor(config.age);

  return (
    <group>
      {/* legs */}
      <mesh castShadow position={[-0.14, 0.34, 0]}>
        <capsuleGeometry args={[0.13, 0.4, 4, 10]} />
        <meshStandardMaterial color={LEG} roughness={0.85} />
      </mesh>
      <mesh castShadow position={[0.14, 0.34, 0]}>
        <capsuleGeometry args={[0.13, 0.4, 4, 10]} />
        <meshStandardMaterial color={LEG} roughness={0.85} />
      </mesh>
      {/* hips / pelvis — width carries the gender silhouette */}
      <mesh castShadow position={[0, 0.7, 0]} scale={[1, 0.5, 0.82]}>
        <sphereGeometry args={[body.hip, 16, 12]} />
        <meshStandardMaterial color={LEG} roughness={0.85} />
      </mesh>
      {/* skirt (over the hips, available to anyone) */}
      {config.outfit === "skirt" ? (
        <mesh castShadow position={[0, 0.52, 0]}>
          <coneGeometry args={[0.34, 0.44, 20, 1, true]} />
          <meshStandardMaterial color={aura} roughness={0.7} side={2} />
        </mesh>
      ) : null}
      {/* torso (hoodie in the player's aura) */}
      <mesh castShadow position={[0, 1.0, 0]}>
        <capsuleGeometry args={[torsoR, 0.5, 6, 16]} />
        <meshStandardMaterial color={aura} roughness={0.6} />
      </mesh>
      {/* subtle chest (feminine) */}
      {body.chest ? (
        <>
          <mesh position={[-0.08, 1.12, torsoR - 0.04]}>
            <sphereGeometry args={[0.062, 12, 12]} />
            <meshStandardMaterial color={aura} roughness={0.6} />
          </mesh>
          <mesh position={[0.08, 1.12, torsoR - 0.04]}>
            <sphereGeometry args={[0.062, 12, 12]} />
            <meshStandardMaterial color={aura} roughness={0.6} />
          </mesh>
        </>
      ) : null}
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
      {config.headwear === "none" ? <Hair color={hair} style={config.hair} /> : null}
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
