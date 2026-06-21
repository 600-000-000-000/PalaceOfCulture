// Local type shim for ecctrl 1.0.88.
//
// ecctrl's published .d.ts re-exports its mobile-joystick from `../src/EcctrlJoystick.tsx`, which
// tsc then compiles under our strict config and reports errors *inside the library* (null checks we
// can't fix in node_modules). We only use the default <Ecctrl> third-person controller, so we
// declare just that here and point tsconfig `paths` at this file. The bundler still resolves the
// real package at runtime — this only swaps the types tsc reads.
declare module "ecctrl" {
  import type { FC, ReactNode } from "react";
  import type { RigidBodyProps } from "@react-three/rapier";

  export interface EcctrlProps extends RigidBodyProps {
    children?: ReactNode;
    debug?: boolean;
    capsuleHalfHeight?: number;
    capsuleRadius?: number;
    characterInitDir?: number;
    floatHeight?: number;
    camInitDis?: number;
    camMaxDis?: number;
    camMinDis?: number;
    camCollision?: boolean;
    maxVelLimit?: number;
    turnSpeed?: number;
    sprintMult?: number;
    jumpVel?: number;
  }

  const Ecctrl: FC<EcctrlProps>;
  export default Ecctrl;
}
