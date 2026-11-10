import { describe, expect, it } from "vitest";
import { add, clampToRect, length, normalize, scale, subtract } from "./geometry";

describe("add, subtract and scale", () => {
  it("add sums components", () => {
    expect(add({ x: 1, y: 2 }, { x: 3, y: -5 })).toEqual({ x: 4, y: -3 });
  });
  it("subtract subtracts components", () => {
    expect(subtract({ x: 1, y: 2 }, { x: 3, y: -5 })).toEqual({ x: -2, y: 7 });
  });
  it("scale multiplies components", () => {
    expect(scale({ x: 1, y: -2 }, 3)).toEqual({ x: 3, y: -6 });
  });
});

describe("length", () => {
  it("is the Euclidean length", () => {
    expect(length({ x: 3, y: 4 })).toBeCloseTo(5);
    expect(length({ x: 0, y: 0 })).toBe(0);
  });
});

describe("normalize", () => {
  it("returns a unit vector in the same direction", () => {
    const n = normalize({ x: 3, y: 4 });
    expect(n.x).toBeCloseTo(0.6);
    expect(n.y).toBeCloseTo(0.8);
    expect(length(n)).toBeCloseTo(1);
  });
  it("returns the zero vector for the zero vector", () => {
    expect(normalize({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
  });
});

describe("clampToRect", () => {
  const rect = { min: { x: 1, y: 2 }, max: { x: 5, y: 8 } };
  it("leaves an inside point unchanged", () => {
    expect(clampToRect({ x: 3, y: 4 }, rect)).toEqual({ x: 3, y: 4 });
  });
  it("moves a point outside each side onto the edge", () => {
    expect(clampToRect({ x: 0, y: 4 }, rect)).toEqual({ x: 1, y: 4 });
    expect(clampToRect({ x: 9, y: 4 }, rect)).toEqual({ x: 5, y: 4 });
    expect(clampToRect({ x: 3, y: -1 }, rect)).toEqual({ x: 3, y: 2 });
    expect(clampToRect({ x: 3, y: 20 }, rect)).toEqual({ x: 3, y: 8 });
  });
  it("moves a point beyond a corner onto the corner", () => {
    expect(clampToRect({ x: 10, y: 10 }, rect)).toEqual({ x: 5, y: 8 });
    expect(clampToRect({ x: -10, y: -10 }, rect)).toEqual({ x: 1, y: 2 });
  });
});
