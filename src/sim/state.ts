import { add, normalize, scale, subtract, type Vec2 } from "./geometry";
import { TUNING } from "./tuning";

export interface Attacker {
  readonly position: Vec2;
}

export interface Ball {
  readonly position: Vec2;
  /** Always true in M1. */
  readonly held: boolean;
}

export interface GameState {
  readonly attacker: Attacker;
  readonly ball: Ball;
  readonly tick: number;
  readonly seed: number;
}

/** Where the held ball sits: carry distance from the attacker, towards the goal centre. */
export function carriedBallPosition(attacker: Vec2): Vec2 {
  const towardsGoal = normalize(subtract(TUNING.goalCentre, attacker));
  return add(attacker, scale(towardsGoal, TUNING.carryDistance));
}

export function initialState(seed: number): GameState {
  const start = { ...TUNING.attackerStart };
  return {
    attacker: { position: start },
    ball: { position: carriedBallPosition(start), held: true },
    tick: 0,
    seed,
  };
}
