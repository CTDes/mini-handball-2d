import { describe, expect, it } from "vitest";
import { NO_INTENT } from "./intent";
import { PITCH } from "./pitch";
import { createRng } from "./rng";
import { initialState, type GameState } from "./state";
import { tick } from "./tick";
import type { Vec2 } from "./geometry";

const rng = createRng(1);
const [left] = PITCH.posts;

function flying(position: Vec2, velocity: Vec2): GameState {
  return { ...initialState(1), phase: "flight", ball: { position, held: false, velocity } };
}

function firstWith(s: GameState, type: string) {
  let cur = s;
  for (let i = 0; i < 200; i++) {
    const r = tick(cur, NO_INTENT, rng);
    if (r.events.some((e) => e.type === type)) return { before: cur, after: r.state };
    cur = r.state;
  }
  throw new Error(`no ${type}`);
}

describe("scoreboard stats", () => {
  it("starts with no goals and no shots", () => {
    const s = initialState(5);
    expect(s.goals).toBe(0);
    expect(s.shots).toBe(0);
  });

  it("counts a shot on the release tick", () => {
    const charging: GameState = { ...initialState(1), phase: "charging", power: 0.5 };
    const r = tick(charging, NO_INTENT, rng);
    expect(r.events.map((e) => e.type)).toContain("shot");
    expect(r.state.shots).toBe(1);
    expect(r.state.goals).toBe(0);
  });

  it("counts a goal on the goal tick, leaving shots alone", () => {
    const mid = (PITCH.posts[0].x + PITCH.posts[1].x) / 2;
    const s = { ...flying({ x: mid, y: 1 }, { x: 0, y: -15 }), shots: 3 };
    const { after } = firstWith(s, "goal");
    expect(after.goals).toBe(1);
    expect(after.shots).toBe(3);
  });

  it("leaves the stats unchanged on out", () => {
    const s = { ...flying({ x: 1, y: 1 }, { x: 0, y: -15 }), shots: 2, goals: 1 };
    const { after } = firstWith(s, "out");
    expect(after.goals).toBe(1);
    expect(after.shots).toBe(2);
  });

  it("leaves the stats unchanged on post-hit", () => {
    const s = { ...flying({ x: left.x, y: 3 }, { x: 0, y: -10 }), shots: 2, goals: 1 };
    const { after } = firstWith(s, "post-hit");
    expect(after.goals).toBe(1);
    expect(after.shots).toBe(2);
  });
});
