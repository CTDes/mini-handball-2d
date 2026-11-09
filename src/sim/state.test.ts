import { describe, expect, it } from "vitest";
import { initialState } from "./state";
import { TUNING } from "./tuning";

describe("initialState", () => {
  it("places the attacker at the start position with tick 0 and the seed", () => {
    const s = initialState(1234);
    expect(s.attacker.position).toEqual({ x: 10, y: 13 });
    expect(s.attacker.position).toEqual(TUNING.attackerStart);
    expect(s.tick).toBe(0);
    expect(s.seed).toBe(1234);
  });
});
