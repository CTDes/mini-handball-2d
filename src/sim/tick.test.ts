import { describe, expect, it } from "vitest";
import { length, subtract } from "./geometry";
import { NO_INTENT, type Intent } from "./intent";
import { createRng } from "./rng";
import { initialState, type GameState } from "./state";
import { tick } from "./tick";
import { TUNING } from "./tuning";

const STEP = 0.1;
const move = (x: number, y: number): Intent => ({ ...NO_INTENT, move: { x, y } });
const displacement = (a: GameState, b: GameState) =>
  subtract(b.attacker.position, a.attacker.position);

describe("NO_INTENT", () => {
  it("has zero movement and is not shooting", () => {
    expect(NO_INTENT.move).toEqual({ x: 0, y: 0 });
    expect(NO_INTENT.shootHeld).toBe(false);
  });
});

describe("tick", () => {
  const s0 = initialState(1);
  const rng = createRng(1);

  it("moves right by speed x tick duration", () => {
    expect(TUNING.attackerSpeed * TUNING.tickDuration).toBeCloseTo(STEP);
    const d = displacement(s0, tick(s0, move(1, 0), rng).state);
    expect(d.x).toBeCloseTo(STEP);
    expect(d.y).toBe(0);
  });

  it("moves diagonally the same distance", () => {
    const d = displacement(s0, tick(s0, move(1, 1), rng).state);
    expect(length(d)).toBeCloseTo(STEP);
    expect(d.x).toBeCloseTo(d.y);
  });

  it("clamps out-of-range movement", () => {
    const a = displacement(s0, tick(s0, move(5, 0), rng).state);
    const b = displacement(s0, tick(s0, move(1, 0), rng).state);
    expect(a.x).toBeCloseTo(b.x);
    expect(a.y).toBeCloseTo(b.y);
    const c = displacement(s0, tick(s0, move(-3, 7), rng).state);
    expect(length(c)).toBeLessThanOrEqual(STEP + 1e-9);
  });

  it("does not throw or produce NaN on non-finite movement", () => {
    const s = tick(s0, move(NaN, Infinity), rng).state;
    expect(Number.isFinite(s.attacker.position.x)).toBe(true);
    expect(Number.isFinite(s.attacker.position.y)).toBe(true);
  });

  it("keeps the attacker's circle inside the pitch against each edge", () => {
    const r = TUNING.attackerRadius;
    const push = (x: number, y: number, from = s0) => {
      let s = from;
      for (let i = 0; i < 400; i++) s = tick(s, move(x, y), rng).state;
      return s;
    };
    const atLeftEdge = push(-1, 0);
    expect(atLeftEdge.attacker.position.x).toBeCloseTo(r);
    expect(push(1, 0).attacker.position.x).toBeCloseTo(TUNING.pitchWidth - r);
    // The top edge is reached from the left edge, beside the goal area, which keeps the
    // attacker out of the centre of the pitch's top (see the goal area rule).
    expect(push(0, -1, atLeftEdge).attacker.position.y).toBeCloseTo(r);
    expect(push(0, 1).attacker.position.y).toBeCloseTo(TUNING.pitchLength - r);
  });

  it("leaves the position unchanged with NO_INTENT", () => {
    expect(tick(s0, NO_INTENT, rng).state.attacker.position).toEqual(s0.attacker.position);
  });

  it("increments the tick, keeps the seed, emits no events and does not mutate", () => {
    const frozen = structuredClone(s0);
    const r = tick(s0, move(1, 0), rng);
    expect(r.state.tick).toBe(1);
    expect(r.state.seed).toBe(s0.seed);
    expect(r.events).toEqual([]);
    expect(s0).toEqual(frozen);
  });
});
