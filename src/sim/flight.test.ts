import { describe, expect, it } from "vitest";
import { NO_INTENT, type Intent } from "./intent";
import { createRng } from "./rng";
import { carriedBallPosition, initialState, type GameState } from "./state";
import { tick, type GameEvent } from "./tick";
import { TUNING } from "./tuning";

const rng = createRng(1);
const hold: Intent = { ...NO_INTENT, shootHeld: true };
const pauseTicks = Math.round(TUNING.resolvedPause / TUNING.tickDuration);

/** Charge one tick then release aiming at the given point. */
function shootAt(x: number, y: number): GameState {
  const s1 = tick(initialState(1), { ...hold, aim: { x, y } }, rng).state;
  return tick(s1, { ...NO_INTENT, aim: { x, y } }, rng).state;
}

describe("flight", () => {
  it("advances the ball by velocity x tick duration in a straight line", () => {
    let s = shootAt(10, 5);
    const v = s.ball.velocity;
    const speed = Math.hypot(v.x, v.y);
    for (let i = 0; i < 5; i++) {
      const before = s.ball.position;
      s = tick(s, NO_INTENT, rng).state;
      expect(s.ball.position.x).toBeCloseTo(before.x + v.x * TUNING.tickDuration);
      expect(s.ball.position.y).toBeCloseTo(before.y + v.y * TUNING.tickDuration);
      expect(Math.hypot(s.ball.velocity.x, s.ball.velocity.y)).toBeCloseTo(speed);
    }
  });

  it("moves the attacker while the trajectory is unaffected", () => {
    const s = shootAt(10, 5);
    const still = tick(s, NO_INTENT, rng).state;
    const walking = tick(s, { ...NO_INTENT, move: { x: 1, y: 0 } }, rng).state;
    expect(walking.attacker.position.x).toBeGreaterThan(s.attacker.position.x);
    expect(walking.ball.position).toEqual(still.ball.position);
  });
});

describe("out", () => {
  it.each([
    ["left", -5, 13],
    ["right", 25, 13],
    ["bottom", 10, 25],
    ["top", 10, -5],
  ])("emits one out event on the first tick outside the %s edge", (_n, x, y) => {
    let s = shootAt(x, y);
    const outs: GameEvent[] = [];
    let ticks = 0;
    while (s.phase === "flight" && ticks++ < 1000) {
      const inside =
        s.ball.position.x >= 0 &&
        s.ball.position.x <= 20 &&
        s.ball.position.y >= 0 &&
        s.ball.position.y <= 20;
      expect(inside).toBe(true);
      const r = tick(s, NO_INTENT, rng);
      outs.push(...r.events.filter((e) => e.type === "out"));
      s = r.state;
    }
    expect(outs).toHaveLength(1);
    expect(s.phase).toBe("resolved");
    expect(s.ball.velocity).toEqual({ x: 0, y: 0 });
  });
});

describe("resolved", () => {
  it("waits the tuned pause and then resets the play once", () => {
    let s = shootAt(-5, 13);
    while (s.phase === "flight") s = tick(s, NO_INTENT, rng).state;
    for (let i = 1; i < pauseTicks; i++) {
      const r = tick(s, NO_INTENT, rng);
      expect(r.state.phase).toBe("resolved");
      expect(r.events.filter((e) => e.type === "play-reset")).toHaveLength(0);
      s = r.state;
    }
    const r = tick(s, NO_INTENT, rng);
    expect(r.events.filter((e) => e.type === "play-reset")).toHaveLength(1);
    expect(r.state.phase).toBe("held");
    expect(r.state.ball.held).toBe(true);
    expect(r.state.power).toBe(0);
    expect(r.state.ball.position).toEqual(carriedBallPosition(r.state.attacker.position));
  });
});
