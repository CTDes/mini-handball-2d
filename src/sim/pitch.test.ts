import { describe, expect, it } from "vitest";
import { PITCH, pitchFrom } from "./pitch";
import { TUNING } from "./tuning";

const onEllipse = (
  e: { centre: { x: number; y: number }; rx: number; ry: number },
  x: number,
  y: number,
): number => ((x - e.centre.x) / e.rx) ** 2 + ((y - e.centre.y) / e.ry) ** 2;

describe("PITCH goal and posts", () => {
  it("places posts 3 m apart on the top edge, symmetric about the centre line", () => {
    const [a, b] = PITCH.posts;
    expect(a.y).toBeCloseTo(0);
    expect(b.y).toBeCloseTo(0);
    expect(a.x).toBeCloseTo(8.5);
    expect(b.x).toBeCloseTo(11.5);
    expect(PITCH.goalLine.start).toEqual(a);
    expect(PITCH.goalLine.end).toEqual(b);
  });
});

describe("PITCH goal area", () => {
  it("is centred on the goal line centre with its edge 6 m ahead and 6 m beside each post", () => {
    expect(PITCH.goalArea.centre.x).toBeCloseTo(10);
    expect(PITCH.goalArea.centre.y).toBeCloseTo(0);
    expect(onEllipse(PITCH.goalArea, 10, 6)).toBeCloseTo(1);
    expect(onEllipse(PITCH.goalArea, 2.5, 0)).toBeCloseTo(1);
    expect(onEllipse(PITCH.goalArea, 17.5, 0)).toBeCloseTo(1);
  });
});

describe("PITCH free-throw ellipse", () => {
  it("is centred on the goal line centre, 9 m deep and 10.5 m half-wide", () => {
    expect(PITCH.freeThrowArc.centre.x).toBeCloseTo(10);
    expect(PITCH.freeThrowArc.centre.y).toBeCloseTo(0);
    expect(onEllipse(PITCH.freeThrowArc, 10, 9)).toBeCloseTo(1);
    expect(PITCH.freeThrowArc.rx).toBeCloseTo(10.5);
  });
});

describe("PITCH danger zone", () => {
  it("spans the goal area's width from the goal line to 4 m", () => {
    expect(PITCH.dangerZone.min.x).toBeCloseTo(2.5);
    expect(PITCH.dangerZone.max.x).toBeCloseTo(17.5);
    expect(PITCH.dangerZone.min.y).toBeCloseTo(0);
    expect(PITCH.dangerZone.max.y).toBeCloseTo(4);
  });
});

describe("pitchFrom", () => {
  it("moves the posts with the goal width, keeping them symmetric", () => {
    const p = pitchFrom({ ...TUNING, goalWidth: 5 });
    const [a, b] = p.posts;
    expect(b.x - a.x).toBeCloseTo(5);
    expect((a.x + b.x) / 2).toBeCloseTo(10);
  });

  it("recentres every shape on a new pitch width", () => {
    const p = pitchFrom({ ...TUNING, pitchWidth: 30 });
    expect(p.width).toBe(30);
    expect((p.posts[0].x + p.posts[1].x) / 2).toBeCloseTo(15);
    expect(p.goalArea.centre.x).toBeCloseTo(15);
    expect(p.freeThrowArc.centre.x).toBeCloseTo(15);
    expect((p.dangerZone.min.x + p.dangerZone.max.x) / 2).toBeCloseTo(15);
  });

  it("takes goal area, free-throw and danger zone sizes from tuning", () => {
    const p = pitchFrom({
      ...TUNING,
      goalAreaRx: 5,
      goalAreaRy: 4,
      freeThrowRx: 8,
      freeThrowRy: 7,
      dangerZoneDepth: 2,
    });
    expect([p.goalArea.rx, p.goalArea.ry]).toEqual([5, 4]);
    expect([p.freeThrowArc.rx, p.freeThrowArc.ry]).toEqual([8, 7]);
    expect(p.dangerZone.max.y).toBeCloseTo(2);
    expect(p.dangerZone.max.x - p.dangerZone.min.x).toBeCloseTo(10);
  });
});
