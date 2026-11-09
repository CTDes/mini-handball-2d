export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

/** Axis-aligned rectangle given by its minimum and maximum corners. */
export interface Rect {
  readonly min: Vec2;
  readonly max: Vec2;
}

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const subtract = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (v: Vec2, k: number): Vec2 => ({ x: v.x * k, y: v.y * k });
export const length = (v: Vec2): number => Math.hypot(v.x, v.y);

/** Unit vector in the same direction; the zero vector for the zero vector. */
export function normalize(v: Vec2): Vec2 {
  const l = length(v);
  return l === 0 ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l };
}

/** The nearest point of the rectangle to `p`. */
export function clampToRect(p: Vec2, rect: Rect): Vec2 {
  return {
    x: Math.min(Math.max(p.x, rect.min.x), rect.max.x),
    y: Math.min(Math.max(p.y, rect.min.y), rect.max.y),
  };
}
