import type { Vec2 } from "./geometry";
import { TUNING } from "./tuning";

export interface Attacker {
  readonly position: Vec2;
}

export interface GameState {
  readonly attacker: Attacker;
  readonly tick: number;
  readonly seed: number;
}

export function initialState(seed: number): GameState {
  return { attacker: { position: { ...TUNING.attackerStart } }, tick: 0, seed };
}
