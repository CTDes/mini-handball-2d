import { add, clampToRect, length, scale, type Vec2 } from "./geometry";
import type { Intent } from "./intent";
import type { Rng } from "./rng";
import type { GameState } from "./state";
import { TUNING } from "./tuning";

/** Placeholder: no events exist yet in M1. */
export type GameEvent = never;

const component = (n: number): number => (Number.isNaN(n) ? 0 : Math.min(Math.max(n, -1), 1));

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
  const position = clampToRect(moved, {
    min: { x: r, y: r },
    max: { x: TUNING.pitchWidth - r, y: TUNING.pitchLength - r },
  });
  return {
    state: { ...state, attacker: { ...state.attacker, position }, tick: state.tick + 1 },
    events: [],
  };
}
