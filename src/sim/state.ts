import { add, normalize, scale, subtract, type Vec2 } from "./geometry";
import { TUNING } from "./tuning";

export interface Attacker {
  readonly position: Vec2;
}

export interface Ball {
  readonly position: Vec2;
  /** True while carried by the attacker (phases `held` and `charging`). */
  readonly held: boolean;
  /** Metres per second; zero unless in flight. */
  readonly velocity: Vec2;
}

export type PlayPhase = "held" | "charging" | "flight" | "resolved";

export interface GameState {
  readonly attacker: Attacker;
  readonly ball: Ball;
  /** Where the human aims, in pitch metres. May lie beyond the pitch edges. */
  readonly aim: Vec2;
  readonly phase: PlayPhase;
  /** Power bar, 0..1. */
  readonly power: number;
  /** Ticks spent charging; drives the power triangle wave. */
  readonly chargeTicks: number;
  /** Ticks left in `resolved` before the play resets. */
  readonly resolvedTicks: number;
  /** Goals scored this session. */
  readonly goals: number;
  /** Shots released this session. */
  readonly shots: number;
  /** False from release until a held tick without the shoot control: charging needs a fresh press. */
  readonly shootArmed: boolean;
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
    ball: { position: carriedBallPosition(start), held: true, velocity: { x: 0, y: 0 } },
    phase: "held",
    power: 0,
    chargeTicks: 0,
    resolvedTicks: 0,
    aim: { ...TUNING.goalCentre },
    goals: 0,
    shots: 0,
    shootArmed: true,
    tick: 0,
    seed,
  };
}
