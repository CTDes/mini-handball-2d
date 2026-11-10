import { describe, expect, it } from "vitest";
import { insideEllipse, length, subtract, type Vec2 } from "./geometry";
import { NO_INTENT, type Intent } from "./intent";
import { PITCH } from "./pitch";
import { createRng } from "./rng";
import { initialState, type GameState } from "./state";
import { tick } from "./tick";
import { TUNING } from "./tuning";

const rng = createRng(7);
const r = TUNING.attackerRadius;
const grown = {
  centre: PITCH.goalArea.centre,
  rx: PITCH.goalArea.rx + r,
  ry: PITCH.goalArea.ry + r,
};
const move = (x: number, y: number): Intent => ({ ...NO_INTENT, move: { x, y } });
const at = (position: Vec2): GameState => {
  const s = initialState(7);
  return { ...s, attacker: { position } };
};
const edgeValue = (p: Vec2) =>
  ((p.x - grown.centre.x) / grown.rx) ** 2 + ((p.y - grown.centre.y) / grown.ry) ** 2;

describe("tick: goal area confinement", () => {
  it("never lets the attacker's circle enter the goal area from any approach direction", () => {
    for (let k = 0; k < 32; k++) {
      const angle = (k / 32) * Math.PI; // the half of the ellipse inside the pitch
      const dir = { x: Math.cos(angle), y: Math.sin(angle) };
      // Start outside the grown ellipse on this ray and walk straight at the centre.
      let s = at({
        x: grown.centre.x + dir.x * (grown.rx + 2),
        y: Math.max(r, grown.centre.y + dir.y * (grown.ry + 2)),
      });
      for (let i = 0; i < 200; i++) {
        s = tick(s, move(-dir.x, -dir.y), rng).state;
        expect(insideEllipse(s.attacker.position, grown)).toBe(false);
      }
    }
  });

  it("walking straight at the goal from the start stops on the goal area edge", () => {
    let s = initialState(7);
    for (let i = 0; i < 300; i++) s = tick(s, move(0, -1), rng).state;
    expect(s.attacker.position.x).toBeCloseTo(10);
    // The goal area edge is 6 m in front of the goal line, plus the attacker radius.
    expect(s.attacker.position.y).toBeCloseTo(6 + r);
  });

  it("slides along the goal area edge without sticking or jitter when pushing into it", () => {
    // Pressed against the edge in front of the goal, pushing up and to the right.
    let s = at({ x: 10, y: 6 + r });
    const xs: number[] = [];
    for (let i = 0; i < 40; i++) {
      const next = tick(s, move(1, -1), rng).state;
      expect(edgeValue(next.attacker.position)).toBeCloseTo(1, 9);
      const step = length(subtract(next.attacker.position, s.attacker.position));
      expect(step).toBeGreaterThan(0.01); // keeps moving: not sticky
      expect(step).toBeLessThanOrEqual(TUNING.attackerSpeed * TUNING.tickDuration + 1e-9);
      xs.push(next.attacker.position.x);
      s = next;
    }
    // Monotonic progress along the edge: no back-and-forth jitter.
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThan(xs[i - 1]!);
  });

  it("stays put when pressed straight into the edge (idempotent projection)", () => {
    const edge = { x: 10, y: 6 + r };
    let s = at(edge);
    for (let i = 0; i < 20; i++) s = tick(s, move(0, -1), rng).state;
    expect(s.attacker.position.x).toBeCloseTo(edge.x, 9);
    expect(s.attacker.position.y).toBeCloseTo(edge.y, 9);
  });
});
