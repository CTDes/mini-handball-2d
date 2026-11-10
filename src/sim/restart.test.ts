import { describe, expect, it } from "vitest";
import { NO_INTENT } from "./intent";
import { createRng } from "./rng";
import { initialState, type GameState } from "./state";
import { tick } from "./tick";

const rng = createRng(1);
const restart = { ...NO_INTENT, restart: true };

const dirty = (phase: GameState["phase"]): GameState => ({
  ...initialState(77),
  phase,
  goals: 3,
  shots: 5,
  power: 0.6,
  chargeTicks: 10,
  resolvedTicks: 4,
  tick: 41,
  attacker: { position: { x: 3, y: 12 } },
  ball: { position: { x: 5, y: 4 }, held: false, velocity: { x: 1, y: -9 } },
});

describe("NO_INTENT", () => {
  it("does not ask for a restart", () => {
    expect(NO_INTENT.restart).toBe(false);
  });
});

describe("restart", () => {
  it("returns the initial state with the same seed and an advanced tick", () => {
    const s = { ...dirty("held"), ball: { ...dirty("held").ball, held: true } };
    const r = tick(s, restart, rng);
    expect(r.state).toEqual({ ...initialState(77), tick: 42 });
    expect(r.events).toEqual([]);
  });

  it.each(["charging", "flight", "resolved"] as const)("works during %s", (phase) => {
    const r = tick(dirty(phase), restart, rng);
    expect(r.state).toEqual({ ...initialState(77), tick: 42 });
    expect(r.state.phase).toBe("held");
    expect(r.state.ball.held).toBe(true);
    expect(r.state.power).toBe(0);
    expect(r.state.goals).toBe(0);
    expect(r.state.shots).toBe(0);
    expect(r.events).toEqual([]);
  });

  it("ignores the rest of the intent", () => {
    const busy = {
      move: { x: 1, y: -1 },
      aim: { x: 2, y: 2 },
      shootHeld: true,
      restart: true,
    };
    expect(tick(dirty("charging"), busy, rng)).toEqual(tick(dirty("charging"), restart, rng));
  });

  it("does not mutate the input state", () => {
    const s = dirty("flight");
    const copy = structuredClone(s);
    tick(s, restart, rng);
    expect(s).toEqual(copy);
  });
});
