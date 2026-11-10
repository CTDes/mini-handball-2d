import type { Vec2 } from "./geometry";

/** What the human asks for in a tick.  */
export interface Intent {
  readonly move: Vec2;
  readonly aim: Vec2;
  readonly shootHeld: boolean;
  /** Abandon the session: back to the initial state, stats zeroed. */
  readonly restart: boolean;
}

export const NO_INTENT: Intent = {
  move: { x: 0, y: 0 },
  aim: { x: 0, y: 0 },
  shootHeld: false,
  restart: false,
};
