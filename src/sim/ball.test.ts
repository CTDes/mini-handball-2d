import { describe, expect, it } from "vitest";
import { length, subtract } from "./geometry";
import { NO_INTENT } from "./intent";
import { createRng } from "./rng";
import { initialState } from "./state";
import { tick } from "./tick";
import { TUNING } from "./tuning";

const carry = TUNING.attackerRadius + TUNING.ballRadius;

describe("initialState ball", () => {
  it("C1: the ball is held", () => {
    expect(initialState(1).ball.held).toBe(true);
  });
  it("C2: the ball sits at the carry distance", () => {
    const s = initialState(1);
    expect(length(subtract(s.ball.position, s.attacker.position))).toBeCloseTo(carry, 9);
    expect(carry).toBeCloseTo(0.55, 9);
  });
  it("C3: the ball lies towards the goal centre", () => {
    const s = initialState(1);
    expect(s.ball.position.x).toBeCloseTo(10, 9);
    expect(s.ball.position.y).toBeCloseTo(12.45, 9);
  });
});

const dirs = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: 1, y: -1 },
];
const intent = (move: { x: number; y: number }) => ({ ...NO_INTENT, move });
const run = (move: { x: number; y: number }, n: number) => {
  let s = initialState(1);
  for (let i = 0; i < n; i++) s = tick(s, intent(move), createRng(1)).state;
  return s;
};

describe("tick ball", () => {
  it("C4: the ball stays at the carry distance after moving", () => {
    for (const d of dirs) {
      const s = run(d, 10);
      expect(length(subtract(s.ball.position, s.attacker.position))).toBeCloseTo(carry, 9);
    }
  });
  it("C5: the ball lies on the ray from the attacker towards the goal centre", () => {
    for (const d of dirs) {
      const s = run(d, 10);
      const b = subtract(s.ball.position, s.attacker.position);
      const g = subtract(TUNING.goalCentre, s.attacker.position);
      expect(b.x * g.y - b.y * g.x).toBeCloseTo(0, 9);
      expect(b.x * g.x + b.y * g.y).toBeGreaterThan(0);
    }
  });
  it("C6: directly below the goal centre the ball is straight above the attacker", () => {
    const s = run({ x: 0, y: -1 }, 5);
    expect(s.attacker.position.x).toBeCloseTo(10, 9);
    expect(s.ball.position.x).toBeCloseTo(10, 9);
    expect(s.ball.position.y).toBeCloseTo(s.attacker.position.y - carry, 9);
  });
  it("C7: placement runs after confinement", () => {
    for (const d of [
      { x: 1, y: 1 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
    ]) {
      const s = run(d, 600);
      const a = s.attacker.position;
      expect(a.y).toBeGreaterThanOrEqual(TUNING.attackerRadius - 1e-9);
      expect(length(subtract(s.ball.position, a))).toBeCloseTo(carry, 9);
      const b = subtract(s.ball.position, a);
      const g = subtract(TUNING.goalCentre, a);
      expect(b.x * g.y - b.y * g.x).toBeCloseTo(0, 9);
      expect(b.x * g.x + b.y * g.y).toBeGreaterThan(0);
    }
  });
  it("C8: the ball stays held and NO_INTENT leaves it in place", () => {
    const s0 = run({ x: 1, y: 0 }, 5);
    const s1 = tick(s0, NO_INTENT, createRng(1)).state;
    expect(s1.ball.held).toBe(true);
    expect(s1.ball.position.x).toBeCloseTo(s0.ball.position.x, 9);
    expect(s1.ball.position.y).toBeCloseTo(s0.ball.position.y, 9);
  });
});
