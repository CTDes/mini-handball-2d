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

export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;

/** Mirrors `v` about the unit normal `n`: `v - 2(v·n)n`. */
export const reflect = (v: Vec2, n: Vec2): Vec2 => subtract(v, scale(n, 2 * dot(v, n)));

/** True when `p` lies inside the rectangle; edges and corners count as inside. */
export const insideRect = (p: Vec2, rect: Rect): boolean =>
  p.x >= rect.min.x && p.x <= rect.max.x && p.y >= rect.min.y && p.y <= rect.max.y;

/** First contact of a segment with a circle. */
export interface SegmentContact {
  /** Fraction along the segment, in [0, 1]. */
  readonly t: number;
  /** Contact point. */
  readonly point: Vec2;
  /** Outward unit normal, from the circle centre to the contact point. */
  readonly normal: Vec2;
}

/**
 * Sweeps the segment `from`→`to` against a circle and returns the first contact, or null.
 * A segment starting strictly inside the circle contacts at t = 0. A tangent segment hits at the
 * tangent point. A segment starting on the circle (within tolerance) only hits when it moves
 * inward, so a ball continuing from a contact point after reflection is not caught again.
 * When the start is the circle centre the normal is undefined: it is the reversed segment
 * direction, or +y for a zero-length segment. Never throws.
 */
export function sweepSegmentCircle(
  from: Vec2,
  to: Vec2,
  centre: Vec2,
  radius: number,
): SegmentContact | null {
  const d = subtract(to, from);
  const f = subtract(from, centre);
  const a = dot(d, d);
  const b = dot(f, d);
  const c = dot(f, f) - radius * radius;

  const startContact = (): SegmentContact => {
    const n = length(f) > 0 ? normalize(f) : a > 0 ? normalize(scale(d, -1)) : { x: 0, y: 1 };
    return { t: 0, point: from, normal: n };
  };

  if (c < -EDGE_TOLERANCE) return startContact();
  if (c <= EDGE_TOLERANCE) return b < 0 ? startContact() : null;
  if (a === 0) return null;

  const disc = b * b - a * c;
  if (disc < 0) return null;
  const t = (-b - Math.sqrt(disc)) / a;
  if (t < 0 || t > 1) return null;
  const point = add(from, scale(d, t));
  return { t, point, normal: normalize(subtract(point, centre)) };
}
