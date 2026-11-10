import { describe, expect, it } from "vitest";
import { length } from "./geometry";
import { NO_INTENT, type Intent } from "./intent";
import { createRng } from "./rng";
import { carriedBallPosition, initialState, type GameState } from "./state";
import { tick } from "./tick";
import { TUNING } from "./tuning";

const rng = createRng(1);
const hold: Intent = { ...NO_INTENT, shootHeld: true };
const sweepTicks = Math.round(TUNING.powerSweepDuration / TUNING.tickDuration);

function charge(state: GameState, ticks: number, intent: Intent = hold): GameState {
  let s = state;
  for (let i = 0; i < ticks; i++) s = tick(s, intent, rng).state;
  return s;
}

describe("charging", () => {
  it("starts charging at power 0 with the ball still held", () => {
    const s0 = initialState(1);
    const { state } = tick(s0, hold, rng);
    expect(state.phase).toBe("charging");
    expect(state.power).toBe(0);
    expect(state.ball.held).toBe(true);
    expect(state.ball.position).toEqual(carriedBallPosition(state.attacker.position));
  });

  it("sweeps the power as a triangle wave over the tuned duration", () => {
    const s1 = tick(initialState(1), hold, rng).state;
    expect(charge(s1, sweepTicks / 4).power).toBeCloseTo(0.5);
    expect(charge(s1, sweepTicks / 2).power).toBeCloseTo(1);
    expect(charge(s1, sweepTicks).power).toBeCloseTo(0);
  });

  it("charges the same when the attacker moves", () => {
    const s1 = tick(initialState(1), hold, rng).state;
    const moved = charge(s1, 5, { ...hold, move: { x: 1, y: 0 } });
    expect(moved.attacker.position.x).toBeGreaterThan(s1.attacker.position.x);
    expect(moved.phase).toBe("charging");
  });
});

describe("release", () => {
  const aim = { x: 4, y: 3 };
  const aimed: Intent = { ...hold, aim };
  const s1 = tick(initialState(1), aimed, rng).state;
  const charged = charge(s1, sweepTicks / 8, aimed);

  it("shoots along the aim at the speed of the current power", () => {
    const p = charged.power;
    const { state, events } = tick(charged, { ...NO_INTENT, aim }, rng);
    const from = state.attacker.position;
    const d = { x: aim.x - from.x, y: aim.y - from.y };
    const speed = TUNING.minShotSpeed + p * (TUNING.maxShotSpeed - TUNING.minShotSpeed);
    expect(length(state.ball.velocity)).toBeCloseTo(speed);
    expect(state.ball.velocity.x / speed).toBeCloseTo(d.x / length(d));
    expect(state.ball.velocity.y / speed).toBeCloseTo(d.y / length(d));
    expect(
      length({ x: state.ball.position.x - from.x, y: state.ball.position.y - from.y }),
    ).toBeCloseTo(TUNING.carryDistance);
    expect(state.phase).toBe("flight");
    expect(state.ball.held).toBe(false);
    expect(events.filter((e) => e.type === "shot")).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "shot", power: p });
  });

  it("points towards the goal centre when the aim is on the attacker", () => {
    const at = charged.attacker.position;
    const { state } = tick(charged, { ...NO_INTENT, aim: at }, rng);
    const v = state.ball.velocity;
    const g = { x: TUNING.goalCentre.x - at.x, y: TUNING.goalCentre.y - at.y };
    expect(v.x / length(v)).toBeCloseTo(g.x / length(g));
    expect(v.y / length(v)).toBeCloseTo(g.y / length(g));
  });
});

describe("shoot control outside charging", () => {
  it("is ignored in flight and resolved", () => {
    const s1 = tick(initialState(1), hold, rng).state;
    let flying = tick(s1, { ...NO_INTENT, aim: { x: 0, y: 30 } }, rng).state;
    expect(flying.phase).toBe("flight");
    expect(tick(flying, hold, rng)).toEqual(tick(flying, NO_INTENT, rng));
    while (flying.phase === "flight") flying = tick(flying, NO_INTENT, rng).state;
    expect(flying.phase).toBe("resolved");
    expect(tick(flying, hold, rng)).toEqual(tick(flying, NO_INTENT, rng));
  });
});

describe("purity", () => {
  it("never mutates its input through a full cycle", () => {
    let s = initialState(1);
    const intents: Intent[] = [hold, hold, { ...NO_INTENT, aim: { x: 0, y: 30 } }];
    for (let i = 0; i < 400; i++) {
      const intent = intents[Math.min(i, 2)] ?? NO_INTENT;
      const before = structuredClone(s);
      const next = tick(s, intent, rng).state;
      expect(s).toEqual(before);
      s = next;
    }
    const frozen = structuredClone(s);
    tick(s, hold, rng);
    expect(s).toEqual(frozen);
  });
});
