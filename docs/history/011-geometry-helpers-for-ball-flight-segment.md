---
job: "011-geometry-helpers-for-ball-flight-segment"
kind: "ticket"
issue: 11
title: "Geometry helpers for ball flight: segment sweep, reflection, point in rectangle"
spec: "010-m2-shooting-and-outcomes"
stage: "merging"
risk: "medium"
surfaces: ["sim"]
rounds: 2
created: "2026-11-10T09:44:53+01:00"
updated: "2026-11-10T09:50:42+01:00"
---

# #11 Geometry helpers for ball flight: segment sweep, reflection, point in rectangle

`011-geometry-helpers-for-ball-flight-segment` · ticket · stage merging · risk medium · surfaces sim · 2 rounds · spec [010-m2-shooting-and-outcomes](010-m2-shooting-and-outcomes.md)

## Issue

```text
### Body

Parent: #10

## What to build

Prefactoring for the shot physics: the geometry module gains the pure helpers that ball flight will need, each exported and tested on its own, with no change in behaviour anywhere else. A swept segment–circle test that returns the first contact (the fraction along the segment, the contact point and the outward unit normal) or nothing; a reflection of a vector about a unit normal; a point-in-rectangle test. Nothing in the tick, the renderer or the state changes; the architecture table's geometry row lists the new helpers.

## Acceptance criteria

- [ ] Segment–circle sweep tests: a segment that misses returns nothing; a segment that enters the circle from outside returns the fraction of first contact, a contact point on the circle and a normal pointing away from the centre; a segment that starts inside returns contact at fraction 0; a segment tangent to the circle counts as a hit at the tangent point.
- [ ] Reflection tests: reflecting about a normal preserves length, mirrors the component along the normal and keeps the tangential component; reflecting twice gives the original vector.
- [ ] Point-in-rectangle tests: inside, outside on each side, and on the edge (inclusive).
- [ ] No existing test or module behaviour changes; the architecture table lists the new exports.
```

## Plan

**DECISION:** ACCEPT · **RISK:** medium · **SURFACES:** sim

### Scope

Prefactoring for M2 (parent spec #10). Add three pure helpers, all exported, to
`src/sim/geometry.ts`. Nothing else in the simulation, adapters or state changes.

1. **Segment–circle sweep**: given a segment (start, end) and a circle (centre, radius), it returns
   the first contact or nothing. A contact holds the fraction `t` in [0, 1] along the segment, the
   contact point on the circle and the outward unit normal (pointing from the centre to the
   contact point). A segment that starts strictly inside the circle returns contact at `t = 0`.
   A tangent segment counts as a hit at the tangent point.
2. **Reflection**: mirrors a vector about a unit normal (`v - 2(v·n)n`).
3. **Point-in-rectangle**: tests a point against the existing `Rect` type, with edges counted as
   inside.

Update the `src/sim/geometry` row of `docs/architecture.md` to list the new exports and to drop
"(segment helpers arrive later)" or reword it. Do not edit `tick`, `state`, `tuning`, `pitch`,
the renderer, input, UI or any existing test file.

Suggested names (the builder may refine them if the architecture row matches):
`sweepSegmentCircle(from: Vec2, to: Vec2, centre: Vec2, radius: number): SegmentContact | null`,
`SegmentContact` (`t`, `point`, `normal`), `reflect(v: Vec2, normal: Vec2): Vec2`,
`insideRect(p: Vec2, rect: Rect): boolean`. A small `dot` helper may be exported too if useful.

### Acceptance criteria

- C1: A segment whose closest approach to the centre is greater than the radius returns no
  contact. A segment that ends before reaching an outside circle also returns no contact.
- C2: A segment that starts outside the circle and enters it returns a contact. Its `t` equals the
  expected first-contact fraction, computed by hand for a simple axis-aligned case (for example
  from (-5, 0) to (5, 0) against a circle at the origin with radius 1 gives `t = 0.4`). The
  contact point lies on the circle (its distance to the centre equals the radius) and on the
  segment at that fraction.
- C3: The contact normal for a hit from outside has unit length and points from the centre to the
  contact point. A non-axis-aligned case (oblique entry) covers this too.
- C4: A segment that starts strictly inside the circle returns a contact at `t = 0` whose point is
  the segment's start and whose normal has unit length.
- C5: A segment tangent to the circle returns a hit at the tangent point, with the normal
  perpendicular to the segment direction.
- C6: A segment that starts exactly on the circle and moves away from the centre returns no
  contact, so a ball that continues from a contact point after reflection is not caught again.
- C7: `reflect` preserves the length of the vector. It negates the component along the normal and
  keeps the tangential component unchanged. Check this for an oblique vector and a non-axis
  unit normal.
- C8: Reflecting a vector twice about the same normal returns the original vector, within
  `toBeCloseTo`.
- C9: The point-in-rectangle test returns true for an interior point and false for a point outside
  each of the four sides. It returns true for points exactly on each edge and on a corner.
- C10: The geometry row of `docs/architecture.md` lists each new export by name. A reviewer
  checks this; it has no test of its own.

### Seams

- Public interface: the new exports of `src/sim/geometry.ts`, documented in the geometry row of
  `docs/architecture.md`.
- Tests go in a **new** file, for example `src/sim/geometry-sweep.test.ts`, with one `describe`
  per new exported function and behaviour-named `it`s. Floats use `toBeCloseTo`. The existing
  `src/sim/geometry.test.ts` is protected (`src/**/*.test.ts` in `factory/config.json`) and must
  not be modified.

### Notes

- Purity rules (ADR 0002, CLAUDE.md): no DOM, timers or `Math.random`. The helpers must never
  throw on game input.
- Degenerate inputs that must not throw: a zero-length segment returns contact at `t = 0` if its
  point is strictly inside the circle, and nothing otherwise. When the start coincides with the
  centre, the normal is undefined; pick a deterministic unit normal (for example the reversed
  segment direction, or +y if the segment has zero length) and document it in a comment.
- C6 is not in the issue's list, but it follows from "enters the circle from outside". The next
  ticket needs it: after a post reflection the ball continues from the contact point, which is
  exactly on the grown circle. A small tolerance (like the existing `EDGE_TOLERANCE`) is
  acceptable for the inside and on-edge distinction, as long as C4 and C6 hold.
- The issue's "no existing behaviour changes" item needs no test of its own. It is satisfied by
  not touching the existing exports.
- M3 will reuse these helpers for body collisions (parent spec, user story 18), so keep them
  generic: no tuning or pitch imports in `geometry.ts`.

## Round 1

### Build

**STATUS:** READY

#### Evidence

- C1: src/sim/geometry-sweep.test.ts::`returns nothing when the closest approach is beyond the radius` — miss and short segment return null
- C2: src/sim/geometry-sweep.test.ts::`returns the first-contact fraction for an axis-aligned entry` — t = 0.4, point on circle and segment
- C3: src/sim/geometry-sweep.test.ts::`gives a unit normal pointing from the centre to the contact point on oblique entry` — unit outward normal
- C4: src/sim/geometry-sweep.test.ts::`returns contact at t = 0 for a segment starting strictly inside` — t=0, point is start
- C5: src/sim/geometry-sweep.test.ts::`hits a tangent segment at the tangent point with a perpendicular normal` — tangent hit
- C6: src/sim/geometry-sweep.test.ts::`ignores a segment starting on the circle and moving away` — no re-catch
- C7: src/sim/geometry-sweep.test.ts::`negates the normal component and keeps the tangential one` — oblique reflect
- C8: src/sim/geometry-sweep.test.ts::`returns the original vector when applied twice` — involution
- C9: src/sim/geometry-sweep.test.ts::`is true on every edge and corner` — edges inclusive
- C10: src/sim/geometry-sweep.test.ts::`lists each new geometry export in the geometry row` — architecture row names every new export

### Gate

**GATE:** PASS · **PROTECTED:** none

#### Summary

- checks.sh: OK
- Protected paths modified or deleted: 0
- Evidence problems: 0

### Review

**VERDICT:** PASS

#### Standards
No findings. The helpers are pure and documented, and geometry.ts has no tuning or pitch imports. Tests sit in a new file and the protected geometry.test.ts is untouched.

#### Spec
- C1 to C9 are met. Each is covered by a test in `src/sim/geometry-sweep.test.ts`, and the `sweepSegmentCircle` logic matches them. Degenerate inputs (zero-length segment, start at the centre) do not throw and give a deterministic normal, documented in the comment.
- C10 is met. The geometry row of `docs/architecture.md` lists `dot`, `reflect`, `insideRect`, `SegmentContact` and `sweepSegmentCircle`. The "arrive later" note is dropped.
- `src/sim/geometry-sweep.test.ts` (last `describe`) adds a test that reads `architecture.md` through `?raw`. The plan said C10 "has no test of its own". This is a small piece of extra scope. [non-blocking]
- The rest of the architecture.md diff is table-width reflow from reformatting, not content change. [non-blocking]

#### Architecture
No findings. The change touches only `src/sim/geometry` and its architecture row, which is updated in the same diff. There are no new dependencies.

### Merge

**MERGE:** CONFLICT

#### Conflicts

Merging origin/spec/010-m2-shooting-and-outcomes into factory/011-geometry-helpers-for-ball-flight-segment:

- docs/architecture.md

## Round 2

### Build

**STATUS:** READY

#### Evidence

- C1: src/sim/geometry-sweep.test.ts::`returns nothing when the closest approach is beyond the radius` — miss and short segment return null
- C2: src/sim/geometry-sweep.test.ts::`returns the first-contact fraction for an axis-aligned entry` — t = 0.4, point on circle and segment
- C3: src/sim/geometry-sweep.test.ts::`gives a unit normal pointing from the centre to the contact point on oblique entry` — unit outward normal
- C4: src/sim/geometry-sweep.test.ts::`returns contact at t = 0 for a segment starting strictly inside` — t=0, point is start
- C5: src/sim/geometry-sweep.test.ts::`hits a tangent segment at the tangent point with a perpendicular normal` — tangent hit
- C6: src/sim/geometry-sweep.test.ts::`ignores a segment starting on the circle and moving away` — no re-catch
- C7: src/sim/geometry-sweep.test.ts::`negates the normal component and keeps the tangential one` — oblique reflect
- C8: src/sim/geometry-sweep.test.ts::`returns the original vector when applied twice` — involution
- C9: src/sim/geometry-sweep.test.ts::`is true on every edge and corner` — edges inclusive
- C10: src/sim/geometry-sweep.test.ts::`lists each new geometry export in the geometry row` — architecture row names every new export

### Gate

**GATE:** PASS · **PROTECTED:** none

#### Summary

- checks.sh: OK
- Protected paths modified or deleted: 0
- Evidence problems: 0

### Review

**VERDICT:** PASS

#### Standards
No findings. Helpers are small, named clearly and documented. The degenerate-normal choice is commented as the plan asked.

#### Spec
No findings. The diff adds only `dot`, `reflect`, `insideRect`, `SegmentContact` and `sweepSegmentCircle` in `src/sim/geometry.ts`, plus a new test file `src/sim/geometry-sweep.test.ts`. The existing test files are untouched.
- C1 to C6: the sweep logic matches them. It returns null for a miss or a short segment, and the first root t for an entry. It returns t=0 with the start point and a unit normal when the start is strictly inside. A tangent segment gives disc=0, so it hits. A segment starting on the circle and moving away returns null through the `c <= EDGE_TOLERANCE` branch with `b >= 0`.
- C7 to C9: `reflect` and `insideRect` follow the plan's definitions, with inclusive edges.
- C10: the geometry row of `docs/architecture.md` lists every new export by name and drops "segment helpers arrive later".
- The rest of the `architecture.md` diff is whitespace re-padding of the table. This is non-blocking noise.
- No extra scope.

#### Architecture
No findings. `geometry.ts` has no new imports and no tuning or pitch dependency. The public interface change is documented in `docs/architecture.md` in the same diff.

## Timeline

| Time | From | To | Reason |
| --- | --- | --- | --- |
| 2026-11-10T09:44:53+01:00 | (new) | intake | created from #11 for spec 010-m2-shooting-and-outcomes |
| 2026-11-10T09:45:03+01:00 | intake | intake | start plan |
| 2026-11-10T09:45:58+01:00 | intake | build | ACCEPT risk=medium surfaces=sim |
| 2026-11-10T09:46:03+01:00 | build | build | start build |
| 2026-11-10T09:47:00+01:00 | build | build | contract failure 1: /Users/xals/Projects/AI/mini-handball-2d/factory/jobs/011-geometry-helpers-for-ball-flight-segment/build.md: evidence the gate would reject: - malformed evidence line: '- C10: docs/architecture.md geometry row lists dot, reflect, insideRect, SegmentContact, sweepSegmentCircle' - C10 — no evidence for this plan criterion |
| 2026-11-10T09:47:46+01:00 | build | gate | READY |
| 2026-11-10T09:47:50+01:00 | gate | gate | start gate |
| 2026-11-10T09:48:14+01:00 | gate | review | GATE PASS |
| 2026-11-10T09:48:23+01:00 | review | review | start review |
| 2026-11-10T09:49:01+01:00 | review | merging | PASS |
| 2026-11-10T09:49:07+01:00 | merging | merging | start merge |
| 2026-11-10T09:49:09+01:00 | merging | build | merge conflict |
| 2026-11-10T09:49:13+01:00 | build | build | start build |
| 2026-11-10T09:50:00+01:00 | build | gate | READY |
| 2026-11-10T09:50:04+01:00 | gate | gate | start gate |
| 2026-11-10T09:50:16+01:00 | gate | review | GATE PASS |
| 2026-11-10T09:50:20+01:00 | review | review | start review |
| 2026-11-10T09:50:42+01:00 | review | merging | PASS |
