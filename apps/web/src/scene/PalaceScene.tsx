import { KeyboardControls, OrbitControls, useKeyboardControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CuboidCollider, Physics, type RapierRigidBody, RigidBody } from "@react-three/rapier";
import Ecctrl from "ecctrl";
import { Leva } from "leva";
import { type RefObject, Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { timelocks } from "../frontend/data";
import { lockProgress } from "../frontend/growth";
import { Icon } from "../frontend/icons";
import type { Character, EngineTarget } from "../frontend/types";
import { ChatPanel } from "../ui/ChatPanel";
import { MediaPlayer } from "../ui/MediaPlayer";
import { AvatarView } from "./AvatarView";
import { Palace } from "./Palace";
import { GrowingTree, PlotAssets } from "./PlotAssets";
import { INTERACTABLES, type Interactable } from "./interactables";

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

/**
 * In-canvas probe (walk mode): each frame reads the keyboard + the player rigidbody to drive (a) the
 * jump (our own, since ecctrl's canJump is unreliable on the invisible floor) and (b) interact
 * proximity — the nearest interactable within range, reported up only when it changes.
 */
function WalkSystems({
  bodyRef,
  onActive,
}: {
  bodyRef: RefObject<RapierRigidBody>;
  onActive: (item: Interactable | null) => void;
}) {
  const [, getKeys] = useKeyboardControls();
  const lastId = useRef<string | null>(null);
  const jumpPrev = useRef(false);
  useFrame(() => {
    const keys = getKeys() as Record<string, boolean>;
    const body = bodyRef.current;
    if (!body) return;
    const linvel = body.linvel();
    const pos = body.translation();

    // Our own jump (ecctrl's canJump never goes true on the invisible floor, though the key registers):
    // on a fresh jump press while roughly grounded (small vertical speed), set an upward velocity
    // straight on the rigidbody. Edge-detected so holding Space doesn't repeat; |vy| gate blocks air jumps.
    const jumpNow = Boolean(keys.jump);
    if (jumpNow && !jumpPrev.current && Math.abs(linvel.y) < 2) {
      body.setLinvel({ x: linvel.x, y: 7.5, z: linvel.z }, true);
    }
    jumpPrev.current = jumpNow;

    let best: Interactable | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const item of INTERACTABLES) {
      const dist = Math.hypot(pos.x - item.position[0], pos.z - item.position[2]);
      if (dist <= item.radius && dist < bestDist) {
        best = item;
        bestDist = dist;
      }
    }
    const id = best?.id ?? null;
    if (id !== lastId.current) {
      lastId.current = id;
      onActive(best);
    }
  });
  return null;
}

/** The 3D game view, launched from the frontend UI. */
export function PalaceScene({ target, onExit, character }: PalaceSceneProps) {
  const [mode, setMode] = useState<ViewMode>("orbit");
  const accent = character.avatar.aura;
  const handle = character.handle;
  const playerBody = useRef<RapierRigidBody>(null);

  const [activeInteract, setActiveInteract] = useState<Interactable | null>(null);
  const [dialog, setDialog] = useState<string | null>(null);
  const activeRef = useRef<Interactable | null>(null);
  activeRef.current = activeInteract;

  // Interact (E key, or the on-screen button): fire the nearest interactable's action.
  useEffect(() => {
    if (mode !== "walk") return;
    const onInteractKey = (event: KeyboardEvent) => {
      if (event.code !== "KeyE") return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      if (activeRef.current) setDialog(activeRef.current.message);
    };
    window.addEventListener("keydown", onInteractKey);
    return () => {
      window.removeEventListener("keydown", onInteractKey);
      setActiveInteract(null);
      setDialog(null);
    };
  }, [mode]);

  // Make jump reliable in walk mode. In the browser, Space's default is to scroll the page or "click"
  // the focused HUD button (which toggles you back to Overview and reads as "jump is broken"). So while
  // walking we claim Space for jumping: blur the focused button on entry, and preventDefault every Space
  // keydown (except when typing in chat). drei's KeyboardControls still receives the event → ecctrl jumps.
  useEffect(() => {
    if (mode !== "walk") return;
    (document.activeElement as HTMLElement | null)?.blur();
    const claimSpaceForJump = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return; // let chat type
      event.preventDefault();
    };
    window.addEventListener("keydown", claimSpaceForJump);
    return () => window.removeEventListener("keydown", claimSpaceForJump);
  }, [mode]);

  // The personal growing tree on the Home plot: a 21-month (Tree) lock drives its 3D growth by age.
  const homeLock =
    timelocks.find((lock) => lock.tier === "21M") ??
    timelocks.find((lock) => lock.status === "growing") ??
    timelocks[0];
  const homeProgress = homeLock ? lockProgress(homeLock) : 0.5;

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
              {/* Invisible flat floor at the deck level (y=0): the palace trimesh has gaps/glass the
                  ecctrl ground ray misses, leaving the controller stuck in "fall" so it never walks.
                  A guaranteed ground plane keeps the player grounded across the whole plaza. */}
              <RigidBody type="fixed" colliders={false}>
                <CuboidCollider args={[300, 0.5, 300]} position={[0, -0.5, 0]} />
              </RigidBody>
              {mode === "walk" ? (
                <Ecctrl
                  camInitDis={-7}
                  camMaxDis={-14}
                  camMinDis={-1.5}
                  capsuleHalfHeight={0.5}
                  capsuleRadius={0.4}
                  floatHeight={0.3}
                  jumpVel={6}
                  maxVelLimit={4}
                  position={SPAWN}
                  // Widen ecctrl's ground detection so "canJump" is reliably true on the deck — the
                  // default forgiveness (0.1) gave a tight 0.8 window vs the 0.7 float, so jump often
                  // never fired. 0.5 keeps canJump solid while grounded without making mid-air jumps.
                  rayHitForgiveness={0.5}
                  ref={playerBody}
                  sprintMult={2}
                >
                  <group position={[0, -0.9, 0]}>
                    <AvatarView bodyRef={playerBody} config={character.avatar} />
                  </group>
                </Ecctrl>
              ) : null}
            </Physics>
            <PlotAssets accent={accent} />
            {/* Home plot only: your personal Tree, grown in 3D to its current age (Tamagotchi). */}
            {target === "home" ? (
              <GrowingTree position={[-7, 0, 40]} progress={homeProgress} />
            ) : null}
            {mode === "walk" ? (
              <WalkSystems bodyRef={playerBody} onActive={setActiveInteract} />
            ) : null}
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
          <span>WASD / arrows to move · Shift to run · Space to jump · E to interact</span>
        </div>
      ) : null}
      {mode === "walk" && activeInteract ? (
        <button
          className="interact-prompt"
          onClick={() => setDialog(activeInteract.message)}
          type="button"
        >
          <span className="interact-key">E</span>
          {activeInteract.label}
        </button>
      ) : null}
      {dialog ? (
        <div className="interact-dialog">
          <p>{dialog}</p>
          <button className="interact-close" onClick={() => setDialog(null)} type="button">
            Close
          </button>
        </div>
      ) : null}
      <ChatPanel handle={handle} />
      <MediaPlayer />
    </div>
  );
}
