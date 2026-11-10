import { describe, expect, it } from "vitest";
import { insideRect, reflect, sweepSegmentCircle } from "./geometry";

const O = { x: 0, y: 0 };

describe("sweepSegmentCircle", () => {
  it("returns nothing when the closest approach is beyond the radius", () => {
    expect(sweepSegmentCircle({ x: -5, y: 2 }, { x: 5, y: 2 }, O, 1)).toBeNull();
  });
  it("returns nothing when the segment ends before reaching the circle", () => {
    expect(sweepSegmentCircle({ x: -5, y: 0 }, { x: -3, y: 0 }, O, 1)).toBeNull();
  });
  it("returns the first-contact fraction for an axis-aligned entry", () => {
    const c = sweepSegmentCircle({ x: -5, y: 0 }, { x: 5, y: 0 }, O, 1);
    expect(c).not.toBeNull();
    expect(c!.t).toBeCloseTo(0.4);
    expect(c!.point.x).toBeCloseTo(-1);
    expect(c!.point.y).toBeCloseTo(0);
  });
  it("puts the contact point on the circle and on the segment", () => {
    const from = { x: -4, y: -3 };
    const to = { x: 6, y: 2 };
    const centre = { x: 1, y: 0 };
    const c = sweepSegmentCircle(from, to, centre, 1.5)!;
    expect(c).not.toBeNull();
    expect(Math.hypot(c.point.x - centre.x, c.point.y - centre.y)).toBeCloseTo(1.5);
    expect(c.point.x).toBeCloseTo(from.x + c.t * (to.x - from.x));
    expect(c.point.y).toBeCloseTo(from.y + c.t * (to.y - from.y));
  });
  it("gives a unit normal pointing from the centre to the contact point on oblique entry", () => {
    const centre = { x: 1, y: 0 };
    const c = sweepSegmentCircle({ x: -4, y: -3 }, { x: 6, y: 2 }, centre, 1.5)!;
    expect(Math.hypot(c.normal.x, c.normal.y)).toBeCloseTo(1);
    expect(c.normal.x * 1.5).toBeCloseTo(c.point.x - centre.x);
    expect(c.normal.y * 1.5).toBeCloseTo(c.point.y - centre.y);
  });
  it("returns contact at t = 0 for a segment starting strictly inside", () => {
    const from = { x: 0.3, y: 0.4 };
    const c = sweepSegmentCircle(from, { x: 5, y: 5 }, O, 1)!;
    expect(c.t).toBe(0);
    expect(c.point).toEqual(from);
    expect(Math.hypot(c.normal.x, c.normal.y)).toBeCloseTo(1);
  });
  it("does not throw when the start is the centre or the segment has zero length", () => {
    const a = sweepSegmentCircle(O, { x: 3, y: 0 }, O, 1)!;
    expect(Math.hypot(a.normal.x, a.normal.y)).toBeCloseTo(1);
    const b = sweepSegmentCircle(O, O, O, 1)!;
    expect(b.t).toBe(0);
    expect(Math.hypot(b.normal.x, b.normal.y)).toBeCloseTo(1);
    expect(sweepSegmentCircle({ x: 5, y: 5 }, { x: 5, y: 5 }, O, 1)).toBeNull();
  });
  it("hits a tangent segment at the tangent point with a perpendicular normal", () => {
    const c = sweepSegmentCircle({ x: -5, y: 1 }, { x: 5, y: 1 }, O, 1)!;
    expect(c).not.toBeNull();
    expect(c.t).toBeCloseTo(0.5);
    expect(c.point.x).toBeCloseTo(0);
    expect(c.point.y).toBeCloseTo(1);
    expect(c.normal.x * 10 + c.normal.y * 0).toBeCloseTo(0);
  });
  it("ignores a segment starting on the circle and moving away", () => {
    expect(sweepSegmentCircle({ x: 1, y: 0 }, { x: 5, y: 3 }, O, 1)).toBeNull();
    expect(sweepSegmentCircle({ x: 1, y: 0 }, { x: 1, y: 4 }, O, 1)).toBeNull();
  });
});

describe("reflect", () => {
  const n = { x: 0.6, y: 0.8 };
  const v = { x: 3, y: -1 };
  const r = reflect(v, n);
  it("preserves the length", () => {
    expect(Math.hypot(r.x, r.y)).toBeCloseTo(Math.hypot(v.x, v.y));
  });
  it("negates the normal component and keeps the tangential one", () => {
    const tan = { x: -0.8, y: 0.6 };
    expect(r.x * n.x + r.y * n.y).toBeCloseTo(-(v.x * n.x + v.y * n.y));
    expect(r.x * tan.x + r.y * tan.y).toBeCloseTo(v.x * tan.x + v.y * tan.y);
  });
  it("returns the original vector when applied twice", () => {
    const back = reflect(r, n);
    expect(back.x).toBeCloseTo(v.x);
    expect(back.y).toBeCloseTo(v.y);
  });
});

describe("insideRect", () => {
  const rect = { min: { x: 0, y: 0 }, max: { x: 4, y: 2 } };
  it("is true for an interior point", () => {
    expect(insideRect({ x: 2, y: 1 }, rect)).toBe(true);
  });
  it("is false outside each side", () => {
    expect(insideRect({ x: -0.1, y: 1 }, rect)).toBe(false);
    expect(insideRect({ x: 4.1, y: 1 }, rect)).toBe(false);
    expect(insideRect({ x: 2, y: -0.1 }, rect)).toBe(false);
    expect(insideRect({ x: 2, y: 2.1 }, rect)).toBe(false);
  });
  it("is true on every edge and corner", () => {
    expect(insideRect({ x: 0, y: 1 }, rect)).toBe(true);
    expect(insideRect({ x: 4, y: 1 }, rect)).toBe(true);
    expect(insideRect({ x: 2, y: 0 }, rect)).toBe(true);
    expect(insideRect({ x: 2, y: 2 }, rect)).toBe(true);
    expect(insideRect({ x: 0, y: 0 }, rect)).toBe(true);
    expect(insideRect({ x: 4, y: 2 }, rect)).toBe(true);
  });
});

describe("architecture doc", () => {
  it("lists each new geometry export in the geometry row", async () => {
    const { readFileSync } = await import("node:fs");
    const row = readFileSync("docs/architecture.md", "utf8")
      .split("\n")
      .find((l) => l.includes("`src/sim/geometry`"));
    for (const name of ["dot", "reflect", "insideRect", "SegmentContact", "sweepSegmentCircle"]) {
      expect(row).toContain(`\`${name}\``);
    }
  });
});
