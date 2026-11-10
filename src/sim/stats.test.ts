import { describe, expect, it } from "vitest";
import { effectiveness, recordGoal, recordShot } from "./stats";

describe("effectiveness", () => {
  it("is goals over shots", () => {
    expect(effectiveness({ goals: 1, shots: 4 })).toBe(0.25);
  });
  it("is 0 when there are no shots", () => {
    expect(effectiveness({ goals: 0, shots: 0 })).toBe(0);
  });
});

describe("recordShot and recordGoal", () => {
  it("recordShot increments shots without mutating its input", () => {
    const s = Object.freeze({ goals: 2, shots: 3 });
    expect(recordShot(s)).toEqual({ goals: 2, shots: 4 });
    expect(s).toEqual({ goals: 2, shots: 3 });
  });
  it("recordGoal increments goals without mutating its input", () => {
    const s = Object.freeze({ goals: 2, shots: 3 });
    expect(recordGoal(s)).toEqual({ goals: 3, shots: 3 });
    expect(s).toEqual({ goals: 2, shots: 3 });
  });
});
