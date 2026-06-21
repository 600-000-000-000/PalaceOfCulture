import { Icon } from "./icons";

type LevelBuildHandoffProps = {
  onExit: () => void;
};

/**
 * STUB — entry point for the in-app level-building / editor mode.
 *
 * Mirrors `EngineHandoff` (which hands off to the 3D runtime). This one is NOT wired yet: a new
 * session connects it to the real builder runtime. The asset pipeline that produces the levels it
 * will edit is documented in `packages/assets-pipeline/HANDOFF.md`.
 *
 * To wire later: add a trigger in `GameFrontend.tsx` (e.g. a `buildTarget` state set from the Home
 * "Build" action) and render `<LevelBuildHandoff onExit={...} />` when it is set.
 */
export function LevelBuildHandoff({ onExit }: LevelBuildHandoffProps) {
  return (
    <main className="game-screen screen--home pre-engine-screen">
      <div className="pre-engine-scrim" />
      <section className="pre-engine-card">
        <div className="pre-engine-mark">
          <Icon name="hammer" size={42} />
        </div>
        <small>The buildable world</small>
        <h1>Build your plot</h1>
        <p>
          This is where Build opens the editable world — placing trees, structures and decor on your
          plot. It is intentionally out of scope for the pilot: the entry point is wired, the world
          itself comes later. The asset pipeline behind it (Revit → build_level.py → palace.glb) is
          documented in packages/assets-pipeline/HANDOFF.md.
        </p>
        <div className="pre-engine-meta">
          <span>
            <Icon name="block" size={14} />
            buildable world — not in the pilot
          </span>
          <span>
            <Icon name="sprout" size={14} />
            asset pipeline ready
          </span>
        </div>
        <button className="coral-button" onClick={onExit} type="button">
          <Icon name="chevron" size={16} />
          Back to UI
        </button>
      </section>
    </main>
  );
}
