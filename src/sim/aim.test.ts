import { describe, expect, it } from "vitest";
import { NO_INTENT, type Intent } from "./intent";
import { createRng } from "./rng";
import { carriedBallPosition, initialState } from "./state";
import { tick } from "./tick";
import { TUNING } from "./tuning";

const aimAt = (x: number, y: number): Intent => ({ ...NO_INTENT, aim: { x, y } });

describe("initialState aim", () => {
  it("starts aiming at the goal centre for any seed", () => {
    for (const seed of [0, 1, 42, 123456]) {
      expect(initialState(seed).aim).toEqual(TUNING.goalCentre);
    }
  });
});

describe("tick aim", () => {
  const s0 = initialState(1);
  const rng = createRng(1);

  it.each([
    ["inside the pitch", 3, 7],
    ["behind the goal line", 10, -1.5],
    ["outside the pitch", -4, 30],
  ])("stores a finite aim %s as it is", (_name, x, y) => {
    expect(tick(s0, aimAt(x, y), rng).state.aim).toEqual({ x, y });
  });

  it("follows the aim of each tick's intent without smoothing", () => {
    let state = s0;
    for (const [x, y] of [
      [1, 2],
      [15, -1],
      [0, 0],
      [7, 7],
    ] as const) {
      state = tick(state, aimAt(x, y), rng).state;
      expect(state.aim).toEqual({ x, y });
    }
  });

  it("does not move the attacker or the ball when only the aim changes", () => {
    const a = tick(s0, aimAt(1, 1), rng).state;
    const b = tick(s0, aimAt(19, 3), rng).state;
    expect(b.attacker.position).toEqual(a.attacker.position);
    expect(b.ball.position).toEqual(a.ball.position);
    expect(b.ball.position).toEqual(carriedBallPosition(b.attacker.position));
    expect(b.ball.held).toBe(true);
  });

  it.each([
    ["NaN x", NaN, 5],
    ["NaN y", 5, NaN],
    ["Infinity x", Infinity, 5],
    ["-Infinity y", 5, -Infinity],
  ])("falls back to the goal centre for a non-finite aim (%s)", (_name, x, y) => {
    expect(() => tick(s0, aimAt(x, y), rng)).not.toThrow();
    expect(tick(s0, aimAt(x, y), rng).state.aim).toEqual(TUNING.goalCentre);
  });

  it("emits no events and does not mutate the input state", () => {
    const before = structuredClone(s0);
    const result = tick(s0, aimAt(3, 3), rng);
    expect(result.events).toEqual([]);
    expect(s0).toEqual(before);
    expect(s0.aim).toEqual(TUNING.goalCentre);
  });
});
