import { describe, expect, it } from "vitest";
import { NO_INTENT } from "./intent";
import { PITCH } from "./pitch";
import { createRng } from "./rng";
import { carriedBallPosition, initialState, type GameState } from "./state";
import { tick, type GameEvent } from "./tick";
import type { Vec2 } from "./geometry";
import { TUNING } from "./tuning";

const rng = createRng(1);
const dt = TUNING.tickDuration;
const reach = TUNING.postRadius + TUNING.ballRadius;
const [left] = PITCH.posts;

function flying(position: Vec2, velocity: Vec2): GameState {
  return { ...initialState(1), phase: "flight", ball: { position, held: false, velocity } };
}

const at = <T>(a: T[], i: number): T => a[i] as T;

function run(s: GameState, ticks: number) {
  const log: { state: GameState; events: GameEvent[] }[] = [];
  let cur = s;
  for (let i = 0; i < ticks; i++) {
    const r = tick(cur, NO_INTENT, rng);
    log.push(r);
    cur = r.state;
  }
  return log;
}

describe("post rebound", () => {
  it("reverses a ball aimed at a post centre, keeping speed", () => {
    const s = flying({ x: left.x, y: 3 }, { x: 0, y: -10 });
    const r = run(s, 60)
      .flatMap((x) => x.events)
      .filter((e) => e.type === "post-hit");
    expect(r).toHaveLength(1);
    const log = run(s, 60);
    const hitIdx = log.findIndex((x) => x.events.some((e) => e.type === "post-hit"));
    const after = at(log, hitIdx).state;
    expect(after.phase).toBe("flight");
    expect(after.ball.velocity.x).toBeCloseTo(0);
    expect(after.ball.velocity.y).toBeCloseTo(10);
  });

  it("reflects about the contact normal and advances the remaining tick", () => {
    const v = { x: 3, y: -9 };
    const s = flying({ x: left.x - 0.2, y: 1 }, v);
    const log = run(s, 60);
    const i = log.findIndex((x) => x.events.some((e) => e.type === "post-hit"));
    const ev = at(log, i).events.find((e) => e.type === "post-hit")!;
    const before = i === 0 ? s : at(log, i - 1).state;
    const n = { x: (ev.position.x - left.x) / reach, y: (ev.position.y - left.y) / reach };
    const vn = v.x * n.x + v.y * n.y;
    const out = at(log, i).state.ball.velocity;
    expect(out.x).toBeCloseTo(v.x - 2 * vn * n.x);
    expect(out.y).toBeCloseTo(v.y - 2 * vn * n.y);
    expect(Math.hypot(out.x, out.y)).toBeCloseTo(Math.hypot(v.x, v.y));
    const frac = 1 - (ev.position.x - before.ball.position.x) / (v.x * dt);
    expect(at(log, i).state.ball.position.x).toBeCloseTo(ev.position.x + out.x * dt * frac);
    expect(at(log, i).state.ball.position.y).toBeCloseTo(ev.position.y + out.y * dt * frac);
  });

  it("never lets the ball closer than post plus ball radius, at max speed", () => {
    // Head-on shot at max speed.
    const s = flying({ x: left.x, y: 0.5 }, { x: 0, y: -TUNING.maxShotSpeed });
    for (const { state } of run(s, 30)) {
      for (const post of PITCH.posts) {
        const d = Math.hypot(state.ball.position.x - post.x, state.ball.position.y - post.y);
        expect(d).toBeGreaterThanOrEqual(reach - 1e-9);
      }
    }
  });
});

describe("post rebound tunnelling", () => {
  it("catches a post crossed within one tick whose start and end are both outside the circle", () => {
    // Offset 0.28 m: the chord is 0.22 m but the step is 0.37 m, so the tick jumps over it.
    const start = { x: left.x + 0.28, y: 0.2 };
    const s = flying(start, { x: 0, y: -TUNING.maxShotSpeed });
    const end = { x: start.x, y: start.y - TUNING.maxShotSpeed * dt };
    expect(Math.hypot(start.x - left.x, start.y - left.y)).toBeGreaterThan(reach);
    expect(Math.hypot(end.x - left.x, end.y - left.y)).toBeGreaterThan(reach);
    const log = run(s, 10);
    expect(at(log, 0).events.map((e) => e.type)).toContain("post-hit");
    for (const { state } of log) {
      const d = Math.hypot(state.ball.position.x - left.x, state.ball.position.y - left.y);
      expect(d).toBeGreaterThanOrEqual(reach - 1e-9);
    }
  });
});

describe("goal", () => {
  const cx = TUNING.goalCentre.x;
  const s = flying({ x: cx, y: 1 }, { x: 0, y: -TUNING.maxShotSpeed / 2 });
  const log = run(s, 120);
  const goalIdx = log.findIndex((x) => x.events.some((e) => e.type === "goal"));

  it("fires on the first tick the centre reaches y <= -ballRadius, never out", () => {
    expect(goalIdx).toBeGreaterThan(0);
    expect(at(log, goalIdx).state.ball.position.y).toBeLessThanOrEqual(-TUNING.ballRadius);
    expect(at(log, goalIdx - 1).state.ball.position.y).toBeGreaterThan(-TUNING.ballRadius);
    const kinds = log.flatMap((x) => x.events.map((e) => e.type));
    expect(kinds.filter((k) => k === "goal")).toHaveLength(1);
    expect(kinds).not.toContain("out");
    expect(at(log, goalIdx).state.phase).toBe("resolved");
    expect(at(log, goalIdx).state.ball.velocity).toEqual({ x: 0, y: 0 });
  });

  it("passes through 0 > y > -ballRadius without an outcome", () => {
    const slow = flying({ x: cx, y: 0.02 }, { x: 0, y: -2 });
    const r = tick(slow, NO_INTENT, rng);
    expect(r.state.ball.position.y).toBeLessThan(0);
    expect(r.state.ball.position.y).toBeGreaterThan(-TUNING.ballRadius);
    expect(r.events).toEqual([]);
    expect(r.state.phase).toBe("flight");
  });

  it("resets to the attacker after the pause with one play-reset", () => {
    const pause = Math.round(TUNING.resolvedPause / dt);
    const after = run(at(log, goalIdx).state, pause + 5);
    const resets = after.filter((x) => x.events.some((e) => e.type === "play-reset"));
    expect(resets).toHaveLength(1);
    const idx = after.indexOf(at(resets, 0));
    expect(idx).toBe(pause - 1);
    for (let i = 0; i < idx; i++) expect(at(after, i).state.phase).toBe("resolved");
    expect(at(after, idx).state.phase).toBe("held");
    expect(at(after, idx).state.ball.position).toEqual(
      carriedBallPosition(at(after, idx).state.attacker.position),
    );
  });
});

describe("out at the top edge", () => {
  it("emits out, not goal, outside the posts", () => {
    const s = flying({ x: 5, y: 1 }, { x: 0, y: -10 });
    const kinds = run(s, 30).flatMap((x) => x.events.map((e) => e.type));
    expect(kinds).toContain("out");
    expect(kinds).not.toContain("goal");
  });

  it("emits post-hit then out after a rebound, with no goal", () => {
    // Bounces straight back and leaves through the bottom edge.
    const s = flying({ x: left.x, y: 3 }, { x: 0, y: -TUNING.maxShotSpeed });
    const log = run(s, 120);
    const kinds = log.map((x) => x.events.map((e) => e.type));
    const hit = kinds.findIndex((k) => k.includes("post-hit"));
    const out = kinds.findIndex((k) => k.includes("out"));
    expect(hit).toBeGreaterThanOrEqual(0);
    expect(out).toBeGreaterThan(hit);
    expect(kinds.flat()).not.toContain("goal");
  });
});
