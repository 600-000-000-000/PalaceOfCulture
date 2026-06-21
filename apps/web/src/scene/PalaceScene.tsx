import { KeyboardControls, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import Ecctrl from "ecctrl";
import { Leva } from "leva";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { Icon } from "../frontend/icons";
import type { Character, EngineTarget } from "../frontend/types";
import { ChatPanel } from "../ui/ChatPanel";
import { AvatarView } from "./AvatarView";
import { Palace } from "./Palace";
import { PlotAssets } from "./PlotAssets";

type PalaceSceneProps = {
  target: EngineTarget;
  onExit: () => void;
  character: Character;
};

type ViewMode = "orbit" | "walk";

const ORBIT_POSITION = new THREE.Vector3(150, 110, 150);
// On the plaza just short of the asset shelf (RESERVED_CORNER ~[0,0,52]); the default camera looks
// +z, so the tree + spaceship sit ahead in view on spawn. Tune freely with RESERVED_CORNER.
const SPAWN: [number, number, number] = [6, 4, 44];

// drei KeyboardControls map — ecctrl reads these named actions.
const KEYBOARD_MAP = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "leftward", keys: ["ArrowLeft", "KeyA"] },
  { name: "rightward", keys: ["ArrowRight", "KeyD"] },
  { name: "jump", keys: ["Space"] },
  { name: "run", keys: ["ShiftLeft", "ShiftRight"] },
];

/** Orbit/overview camera — resets the rig on entry so toggling back from walk isn't jarring. */
function OrbitView() {
  const { camera } = useThree();
  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera;
    camera.position.copy(ORBIT_POSITION);
    camera.lookAt(0, 0, 0);
    if (perspective.isPerspectiveCamera) {
      perspective.fov = 42;
      perspective.updateProjectionMatrix();
    }
  }, [camera]);
  return <OrbitControls enableDamping makeDefault maxPolarAngle={Math.PI / 2.05} />;
}

/** The 3D game view, launched from the frontend UI. */
export function PalaceScene({ target, onExit, character }: PalaceSceneProps) {
  const [mode, setMode] = useState<ViewMode>("orbit");
  const accent = character.avatar.aura;
  const handle = character.handle;

  const title = target === "hq" ? "Palace of Culture HQ" : "Home Plot";
  const subtitle =
    mode === "walk"
      ? "third-person — walk the palace"
      : target === "hq"
        ? "3D engine — global palace"
        : "3D engine — private plot";

  return (
    <div className="engine-shell">
      <KeyboardControls map={KEYBOARD_MAP}>
        <Canvas camera={{ position: [150, 110, 150], fov: 42, near: 0.5, far: 6000 }} shadows>
          <color args={["#efe6d2"]} attach="background" />
          <fog args={["#efe6d2", 400, 1500]} attach="fog" />
          <ambientLight intensity={0.55} />
          <hemisphereLight args={["#fff2d6", "#9a8a62", 0.6]} />
          <directionalLight
            castShadow
            color="#ffe6ad"
            intensity={2.8}
            position={[200, 350, 120]}
            shadow-camera-bottom={-200}
            shadow-camera-far={1200}
            shadow-camera-left={-200}
            shadow-camera-right={200}
            shadow-camera-top={200}
            shadow-mapSize={[2048, 2048]}
          />
          <Suspense fallback={null}>
            <Physics timeStep="vary">
              <Palace />
              {mode === "walk" ? (
                <Ecctrl
                  camInitDis={-7}
                  camMaxDis={-14}
                  camMinDis={-1.5}
                  capsuleHalfHeight={0.5}
                  capsuleRadius={0.4}
                  floatHeight={0.3}
                  jumpVel={5}
                  maxVelLimit={4}
                  position={SPAWN}
                  sprintMult={2}
                >
                  <group position={[0, -0.9, 0]}>
                    <AvatarView config={character.avatar} />
                  </group>
                </Ecctrl>
              ) : null}
            </Physics>
            <PlotAssets accent={accent} />
          </Suspense>
          {mode === "orbit" ? <OrbitView /> : null}
        </Canvas>
      </KeyboardControls>
      <Leva hidden />
      <div className="engine-hud">
        <button className="nav-pill nav-pill--engine" onClick={onExit} type="button">
          <Icon name="chevron" size={16} />
          <span>Back to UI</span>
        </button>
        <div className="engine-title">
          <span>{title}</span>
          <small>{subtitle}</small>
        </div>
        <button
          className="nav-pill nav-pill--engine engine-mode"
          onClick={() => setMode((value) => (value === "orbit" ? "walk" : "orbit"))}
          type="button"
        >
          <Icon name={mode === "walk" ? "globe" : "play"} size={16} />
          <span>{mode === "walk" ? "Overview" : "Walk"}</span>
        </button>
      </div>
      {mode === "walk" ? (
        <div className="fp-hint">
          <strong>Drag to look around</strong>
          <span>WASD / arrows to move · Shift to run · Space to jump</span>
        </div>
      ) : null}
      <ChatPanel handle={handle} />
    </div>
  );
}
