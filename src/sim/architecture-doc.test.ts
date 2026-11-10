import { describe, expect, it } from "vitest";
import architecture from "../../docs/architecture.md?raw";

describe("architecture doc", () => {
  it("lists each new geometry export in the geometry row", () => {
    const row = architecture.split("\n").find((l) => l.includes("`src/sim/geometry`"));
    for (const name of ["dot", "reflect", "insideRect", "SegmentContact", "sweepSegmentCircle"]) {
      expect(row).toContain(`\`${name}\``);
    }
  });
});
