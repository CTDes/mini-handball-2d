import type { Ellipse, Rect, Vec2 } from "./geometry";
import { TUNING } from "./tuning";

export type { Ellipse };

export interface Pitch {
  readonly width: number;
  readonly length: number;
  readonly goalLine: { readonly start: Vec2; readonly end: Vec2 };
  readonly posts: readonly [Vec2, Vec2];
  readonly goalArea: Ellipse;
  readonly freeThrowArc: Ellipse;
  readonly dangerZone: Rect;
}

/** The tuning numbers the markings depend on. */
export interface PitchTuning {
  readonly pitchWidth: number;
  readonly pitchLength: number;
  readonly goalWidth: number;
  readonly goalAreaRx: number;
  readonly goalAreaRy: number;
  readonly freeThrowRx: number;
  readonly freeThrowRy: number;
  readonly dangerZoneDepth: number;
}

/** Derives the markings (metres, origin top-left, y down) from tuning. */
export function pitchFrom(t: PitchTuning): Pitch {
  const cx = t.pitchWidth / 2;
  const centre = { x: cx, y: 0 };
  const left = { x: cx - t.goalWidth / 2, y: 0 };
  const right = { x: cx + t.goalWidth / 2, y: 0 };
  return {
    width: t.pitchWidth,
    length: t.pitchLength,
    goalLine: { start: left, end: right },
    posts: [left, right],
    goalArea: { centre, rx: t.goalAreaRx, ry: t.goalAreaRy },
    freeThrowArc: { centre, rx: t.freeThrowRx, ry: t.freeThrowRy },
    dangerZone: {
      min: { x: cx - t.goalAreaRx, y: 0 },
      max: { x: cx + t.goalAreaRx, y: t.dangerZoneDepth },
    },
  };
}

export const PITCH: Pitch = pitchFrom(TUNING);
