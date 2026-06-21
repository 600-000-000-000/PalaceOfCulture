/**
 * The reserved-corner asset shelf in the 3D world: a plinth holding the player's hero personal
 * assets — a Tree (organic, "let it grow") and a Spaceship (built, the 21-year life-vault). Built
 * from primitives like the character; decorative for the pilot (not in the collider). Community
 * landmarks (library/lighthouse/spaceport) are shown as map dots, not here. See plan + ADR 0001.
 */

/** On the open plaza in front of the palace, framed as you walk out toward +z. Adjust freely. */
export const RESERVED_CORNER: [number, number, number] = [0, 0, 52];
const SHELF_SCALE = 1.6;

function Plinth() {
  return (
    <mesh castShadow position={[0, 0.2, 0]} receiveShadow>
      <cylinderGeometry args={[4.1, 4.5, 0.4, 48]} />
      <meshStandardMaterial color="#6e6e73" roughness={0.92} />
    </mesh>
  );
}

const CANOPY: Array<{ p: [number, number, number]; r: number; c: string }> = [
  { p: [0, 3.3, 0], r: 1.55, c: "#23806f" },
  { p: [-1.05, 2.85, 0.4], r: 1.15, c: "#1f6b62" },
  { p: [1.0, 2.95, -0.35], r: 1.2, c: "#2b9079" },
  { p: [0.25, 4.25, 0.15], r: 1.05, c: "#2bd07a" },
  { p: [-0.45, 3.95, -0.55], r: 0.9, c: "#23806f" },
  { p: [0.6, 3.55, 0.7], r: 0.85, c: "#2b9079" },
];

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* gold annual-ring base — the Ringed Oak motif, laid flat */}
      <mesh position={[0, 0.08, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.95, 0.11, 14, 40]} />
        <meshStandardMaterial
          color="#e7b23c"
          emissive="#e7b23c"
          emissiveIntensity={0.3}
          metalness={0.5}
          roughness={0.35}
        />
      </mesh>
      {/* tapered trunk */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.18, 0.34, 2.4, 14]} />
        <meshStandardMaterial color="#5a3d22" roughness={0.95} />
      </mesh>
      {/* two forking branches */}
      {[1, -1].map((dir) => (
        <mesh castShadow key={dir} position={[dir * 0.45, 2.1, 0]} rotation={[0, 0, dir * 0.7]}>
          <cylinderGeometry args={[0.08, 0.14, 1.1, 8]} />
          <meshStandardMaterial color="#5a3d22" roughness={0.95} />
        </mesh>
      ))}
      {/* rounded foliage clumps */}
      {CANOPY.map((clump, index) => (
        <mesh castShadow key={`${clump.c}-${index}`} position={clump.p}>
          <icosahedronGeometry args={[clump.r, 1]} />
          <meshStandardMaterial color={clump.c} flatShading roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Spaceship({ position, accent }: { position: [number, number, number]; accent: string }) {
  return (
    <group position={position}>
      {/* engine glow ring at the base */}
      <mesh position={[0, 0.18, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.62, 0.12, 12, 30]} />
        <meshStandardMaterial
          color="#e8704f"
          emissive="#f08a55"
          emissiveIntensity={0.9}
          roughness={0.4}
        />
      </mesh>
      {/* streamlined hull — flared base into a tapered body */}
      <mesh castShadow position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.5, 0.78, 1.7, 24]} />
        <meshStandardMaterial color="#e9e2d2" metalness={0.35} roughness={0.4} />
      </mesh>
      <mesh castShadow position={[0, 2.35, 0]}>
        <cylinderGeometry args={[0.34, 0.5, 1.2, 24]} />
        <meshStandardMaterial color="#f4eedd" metalness={0.35} roughness={0.4} />
      </mesh>
      {/* nose cone (player aura) */}
      <mesh castShadow position={[0, 3.5, 0]}>
        <coneGeometry args={[0.34, 1.3, 24]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.25}
          metalness={0.4}
          roughness={0.35}
        />
      </mesh>
      {/* cockpit dome */}
      <mesh position={[0, 2.55, 0.34]}>
        <sphereGeometry args={[0.3, 18, 14]} />
        <meshStandardMaterial
          color="#2a3a4a"
          emissive="#9fd0ff"
          emissiveIntensity={0.35}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>
      {/* three swept-back wings */}
      {[0, 1, 2].map((index) => {
        const angle = (index * Math.PI * 2) / 3;
        return (
          <mesh
            castShadow
            key={angle}
            position={[Math.sin(angle) * 0.62, 0.85, Math.cos(angle) * 0.62]}
            rotation={[0.35, -angle, 0]}
          >
            <boxGeometry args={[0.09, 1.3, 0.85]} />
            <meshStandardMaterial color={accent} metalness={0.35} roughness={0.45} />
          </mesh>
        );
      })}
      {/* three engine nozzles under the base */}
      {[0, 1, 2].map((index) => {
        const angle = (index * Math.PI * 2) / 3 + Math.PI / 3;
        return (
          <mesh
            key={`n-${angle}`}
            position={[Math.sin(angle) * 0.32, 0.16, Math.cos(angle) * 0.32]}
            rotation-x={Math.PI}
          >
            <coneGeometry args={[0.16, 0.4, 12]} />
            <meshStandardMaterial color="#3a3a40" metalness={0.6} roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

/** The reserved-corner shelf: plinth + Tree + Spaceship, on the plaza in front of the palace. */
export function PlotAssets({ accent }: { accent: string }) {
  return (
    <group position={RESERVED_CORNER} scale={SHELF_SCALE}>
      <Plinth />
      <Tree position={[-2.3, 0.4, 0]} />
      <Spaceship accent={accent} position={[2.3, 0.4, 0]} />
    </group>
  );
}
