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

/** Ellipse given by its centre and semi-axes (metres). */
export interface Ellipse {
  readonly centre: Vec2;
  readonly rx: number;
  readonly ry: number;
}

const ellipseValue = (p: Vec2, e: Ellipse): number =>
  ((p.x - e.centre.x) / e.rx) ** 2 + ((p.y - e.centre.y) / e.ry) ** 2;

/** Tolerance that absorbs rounding, so a point just projected onto the edge counts as on it. */
const EDGE_TOLERANCE = 1e-9;

/** True when `p` lies strictly inside the ellipse; points on the edge are outside. */
export const insideEllipse = (p: Vec2, e: Ellipse): boolean =>
  ellipseValue(p, e) < 1 - EDGE_TOLERANCE;

/**
 * Moves a point inside the ellipse along the ray from the centre onto the edge; any other
 * point is returned unchanged. The centre itself goes out along +y (away from the goal line).
 */
export function pushOutOfEllipse(p: Vec2, e: Ellipse): Vec2 {
  if (!insideEllipse(p, e)) return p;
  const v = ellipseValue(p, e);
  if (v === 0) return { x: e.centre.x, y: e.centre.y + e.ry };
  return add(e.centre, scale(subtract(p, e.centre), 1 / Math.sqrt(v)));
}
