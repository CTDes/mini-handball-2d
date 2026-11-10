import { describe, expect, it } from "vitest";
import { insideEllipse, pushOutOfEllipse } from "./geometry";

const e = { centre: { x: 10, y: 0 }, rx: 4, ry: 2 };
const onEdge = (p: { x: number; y: number }) =>
  ((p.x - e.centre.x) / e.rx) ** 2 + ((p.y - e.centre.y) / e.ry) ** 2;

describe("insideEllipse", () => {
  it("is true for the centre and points strictly inside", () => {
    expect(insideEllipse({ x: 10, y: 0 }, e)).toBe(true);
    expect(insideEllipse({ x: 13, y: 1 }, e)).toBe(true);
  });
  it("is false for points on the edge", () => {
    expect(insideEllipse({ x: 14, y: 0 }, e)).toBe(false);
    expect(insideEllipse({ x: 10, y: 2 }, e)).toBe(false);
  });
  it("is false for points outside", () => {
    expect(insideEllipse({ x: 15, y: 0 }, e)).toBe(false);
    expect(insideEllipse({ x: 13, y: 2 }, e)).toBe(false);
  });
});

describe("pushOutOfEllipse", () => {
  it("leaves a point outside unchanged", () => {
    expect(pushOutOfEllipse({ x: 20, y: 5 }, e)).toEqual({ x: 20, y: 5 });
  });
  it("leaves a point exactly on the edge unchanged", () => {
    expect(pushOutOfEllipse({ x: 14, y: 0 }, e)).toEqual({ x: 14, y: 0 });
    expect(pushOutOfEllipse({ x: 10, y: 2 }, e)).toEqual({ x: 10, y: 2 });
  });
  it("moves an inside point along the ray from the centre onto the edge", () => {
    const p = pushOutOfEllipse({ x: 12, y: 0.5 }, e);
    expect(onEdge(p)).toBeCloseTo(1);
    // Same direction from the centre: (2, 0.5) scaled.
    expect((p.y - e.centre.y) / (p.x - e.centre.x)).toBeCloseTo(0.25);
    expect(p.x).toBeGreaterThan(12);
  });
  it("pushes the centre itself onto the edge, away from the goal line (+y)", () => {
    expect(pushOutOfEllipse({ x: 10, y: 0 }, e)).toEqual({ x: 10, y: 2 });
  });
  it("is idempotent", () => {
    const once = pushOutOfEllipse({ x: 11, y: 1 }, e);
    const twice = pushOutOfEllipse(once, e);
    expect(twice.x).toBeCloseTo(once.x, 12);
    expect(twice.y).toBeCloseTo(once.y, 12);
  });
});
