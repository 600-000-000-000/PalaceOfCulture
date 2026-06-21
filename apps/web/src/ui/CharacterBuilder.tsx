import { type AvatarConfig, type Character, DEFAULT_AVATAR } from "@600b/shared";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { type CSSProperties, useState } from "react";
import { Icon } from "../frontend/icons";
import { AvatarView } from "../scene/AvatarView";
import { AGES, AURAS, GENDERS, HAIR, HEADWEAR, OUTFITS, SKIN_TONES } from "./avatarTraits";

/** A slow turntable preview of the avatar being built — drag to spin, it auto-rotates otherwise. */
function AvatarPreview({ config }: { config: AvatarConfig }) {
  return (
    <Canvas camera={{ fov: 38, position: [0, 1.05, 3.1] }} dpr={[1, 2]} shadows>
      <color args={["#1b140d"]} attach="background" />
      <ambientLight intensity={0.7} />
      <hemisphereLight args={["#fff2d6", "#3a2a14", 0.5]} />
      <directionalLight castShadow color="#ffe6ad" intensity={1.7} position={[3, 6, 4]} />
      <AvatarView config={config} />
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

function ChipRow<T extends string>({
  options,
  value,
  onSelect,
}: {
  options: ReadonlyArray<{ id: T; label: string }>;
  value: T;
  onSelect: (id: T) => void;
}) {
  return (
    <div className="trait-row">
      {options.map((option) => (
        <button
          className={value === option.id ? "tier-chip tier-chip--active" : "tier-chip"}
          key={option.id}
          onClick={() => onSelect(option.id)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SwatchRow({
  colors,
  value,
  onSelect,
}: {
  colors: readonly string[];
  value: string;
  onSelect: (color: string) => void;
}) {
  return (
    <div className="palette-row">
      {colors.map((color) => (
        <button
          aria-label={color}
          className={value === color ? "palette-swatch palette-swatch--active" : "palette-swatch"}
          key={color}
          onClick={() => onSelect(color)}
          style={{ "--aura": color } as CSSProperties}
          type="button"
        >
          {value === color ? <Icon name="check" size={14} /> : null}
        </button>
      ))}
    </div>
  );
}

/**
 * The character creation step — our own slot-based VRM builder (ADR 0003). Builds an `AvatarConfig`
 * (the source of truth) with a live 3D preview, then hands a full `Character` record to the caller
 * to persist. The VRM mesh assembly from the config arrives with the Builder asset kit.
 */
export function CharacterBuilder({ onComplete }: { onComplete: (character: Character) => void }) {
  const [handle, setHandle] = useState("");
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const canBegin = handle.trim().length > 0;

  const set = (patch: Partial<AvatarConfig>) =>
    setConfig((previous) => ({ ...previous, ...patch }));

  const begin = () => {
    if (!canBegin) return;
    const handleTrim = handle.trim();
    const now = Date.now();
    onComplete({
      id: crypto.randomUUID(),
      handle: handleTrim,
      avatar: config,
      createdAt: now,
      updatedAt: now,
      updatedBy: `user:${handleTrim}`,
    });
  };

  return (
    <main className="game-screen screen--title builder-screen">
      <section className="builder-card">
        <header className="builder-head">
          <h1>Create your Builder</h1>
          <p>before the palace, become someone</p>
        </header>

        <div className="builder-body">
          <div className="builder-preview">
            <AvatarPreview config={config} />
            <span className="builder-preview-tag">live preview · drag to spin</span>
          </div>

          <div className="builder-controls">
            <div className="field-block">
              <label htmlFor="handle-input">Handle</label>
              <input
                autoComplete="off"
                className="text-input"
                id="handle-input"
                maxLength={24}
                onChange={(event) => setHandle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") begin();
                }}
                placeholder="name your legend..."
                value={handle}
              />
            </div>

            <div className="field-block">
              <span className="field-label">Body</span>
              <ChipRow
                onSelect={(gender) => set({ gender })}
                options={GENDERS}
                value={config.gender}
              />
            </div>

            <div className="field-block">
              <span className="field-label">Age</span>
              <ChipRow onSelect={(age) => set({ age })} options={AGES} value={config.age} />
            </div>

            <div className="field-block">
              <span className="field-label">Skin</span>
              <SwatchRow
                colors={SKIN_TONES}
                onSelect={(skinTone) => set({ skinTone })}
                value={config.skinTone}
              />
            </div>

            <div className="field-block">
              <span className="field-label">Aura</span>
              <SwatchRow colors={AURAS} onSelect={(aura) => set({ aura })} value={config.aura} />
            </div>

            <div className="field-block">
              <span className="field-label">Hair</span>
              <ChipRow onSelect={(hair) => set({ hair })} options={HAIR} value={config.hair} />
            </div>

            <div className="field-block">
              <span className="field-label">Outfit</span>
              <ChipRow
                onSelect={(outfit) => set({ outfit })}
                options={OUTFITS}
                value={config.outfit}
              />
            </div>

            <div className="field-block">
              <span className="field-label">Headwear</span>
              <ChipRow
                onSelect={(headwear) => set({ headwear })}
                options={HEADWEAR}
                value={config.headwear}
              />
            </div>
          </div>
        </div>

        <button
          className="coral-button coral-button--hero"
          disabled={!canBegin}
          onClick={begin}
          type="button"
        >
          <Icon name="play" size={18} />
          Begin your legend
          <small>enter the palace</small>
        </button>
      </section>
    </main>
  );
}
