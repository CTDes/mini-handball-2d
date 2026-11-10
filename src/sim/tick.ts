import {
  add,
  clampToRect,
  length,
  pushOutOfEllipse,
  scale,
  type Ellipse,
  type Vec2,
} from "./geometry";
import type { Intent } from "./intent";
import { PITCH } from "./pitch";
import type { Rng } from "./rng";
import { carriedBallPosition, type GameState } from "./state";
import { TUNING } from "./tuning";

/** Placeholder: no events exist yet in M1. */
export type GameEvent = never;

const component = (n: number): number => (Number.isNaN(n) ? 0 : Math.min(Math.max(n, -1), 1));

/** The goal area grown by the attacker radius: where the attacker's centre may not be. */
const forbidden: Ellipse = {
  centre: PITCH.goalArea.centre,
  rx: PITCH.goalArea.rx + TUNING.attackerRadius,
  ry: PITCH.goalArea.ry + TUNING.attackerRadius,
};

function movement(raw: Vec2): Vec2 {
  const v = { x: component(raw.x), y: component(raw.y) };
  const l = length(v);
  return l > 1 ? scale(v, 1 / l) : v;
}

export function tick(
  state: GameState,
  intent: Intent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the AI will use it from a later milestone
  _rng: Rng,
): { state: GameState; events: GameEvent[] } {
  const step = scale(movement(intent.move), TUNING.attackerSpeed * TUNING.tickDuration);
  const moved = add(state.attacker.position, step);
  const r = TUNING.attackerRadius;
  const onPitch = clampToRect(moved, {
    min: { x: r, y: r },
    max: { x: TUNING.pitchWidth - r, y: TUNING.pitchLength - r },
  });
  const position = pushOutOfEllipse(onPitch, forbidden);
  return {
    state: {
      ...state,
      attacker: { ...state.attacker, position },
      ball: { position: carriedBallPosition(position), held: true },
      tick: state.tick + 1,
    },
    events: [],
  };
}
