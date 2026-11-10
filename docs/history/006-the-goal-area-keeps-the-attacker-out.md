---
job: "006-the-goal-area-keeps-the-attacker-out"
kind: "ticket"
issue: 6
title: "The goal area keeps the attacker out"
spec: "002-m1-walking-skeleton-the-attacker-on-the"
stage: "done"
risk: "medium"
surfaces: []
rounds: 1
created: "2026-11-09T18:44:44+01:00"
updated: "2026-11-10T09:00:42+01:00"
---

# #6 The goal area keeps the attacker out

`006-the-goal-area-keeps-the-attacker-out` · ticket · stage done · risk medium · surfaces none · 1 round · spec [002-m1-walking-skeleton-the-attacker-on-the](002-m1-walking-skeleton-the-attacker-on-the.md)

## Issue

```text
### Body

Parent: #2
Blocked by: #4

## What to build

The handball rule: the attacker can never enter the goal area, and sliding along its edge feels solid. The geometry module gains the ellipse containment test and the radial push-out (move a point along the ray from the ellipse centre until it lies on the ellipse). The tick applies, after the rectangle clamp, the push-out against the goal area ellipse grown by the attacker radius, so the attacker's circle never overlaps the area and pushing diagonally into it slides along the edge without jitter or sticking. The order is fixed: move, clamp to the pitch, push out of the goal area, then place the ball.

## Acceptance criteria

- [ ] Geometry tests: containment for points inside, outside and on the edge; push-out leaves points outside unchanged, moves inside points onto the edge along the ray from the centre, is idempotent, and handles a point at the ellipse centre deterministically.
- [ ] Tick tests: from the start position, holding "up" for many ticks stops the attacker with its circle tangent to the goal area and never inside; approaching from the left, the right and diagonally gives the same guarantee; holding "up-left" from in front of the area makes the attacker slide leftwards along the edge, its x decreasing monotonically while it never enters; a position placed inside the area by a test is pushed out in one tick.
- [ ] In the browser, walking into the goal area from any direction stops at its edge and sliding along it is smooth.


### Comment by the factory · 2026-11-09T17:59:32Z

[factory] 006-the-goal-area-keeps-the-attacker-out · I need more information before building:

The protected test `src/sim/tick.test.ts` (line 62, "keeps the attacker's circle inside the pitch
against each edge") holds "up" for 400 ticks from the start position (10, 13) and expects `y ≈
0.4`. With this ticket the goal area stops the attacker at y = 6.4, as the issue's own criterion
requires. That assertion will necessarily fail. `src/**/*.test.ts` is in `protected_paths`, so the
factory cannot change it. How should this be resolved?

- A) A human amends `src/sim/tick.test.ts` before the job runs, for example by starting the "up"
  case at x = 1 so the top edge is reached beside the goal area, or by moving that case out.
  The factory then builds the plan above unchanged.
- B) This job is explicitly allowed to edit that one assertion in `src/sim/tick.test.ts`, with
  the same change as in A.
- C) Something else, such as changing the order or rule in the spec. Not recommended: it
  contradicts parent spec #2.

Answer with a comment on this issue and the factory will pick it up again.

### Comment by @CTDes · 2026-11-10T07:55:33Z

Option A, done: the spec branch now carries commit 14be0f7, which changes the edge-confinement test in src/sim/tick.test.ts so the "up" case starts from the left edge (outside the goal area) and still expects y ≈ attacker radius. Build the plan unchanged against the updated base; do not edit any existing test.
```

## Plan

### Question 1

**DECISION:** NEEDS-INFO · **RISK:** medium · **SURFACES:** none

#### Scope

(Proposed scope. It applies once the question below is answered.)

- `src/sim/geometry.ts`: add the ellipse containment test and the radial push-out, both exported.
  Move the `Ellipse` type (`centre`, `rx`, `ry`) into geometry and re-export it from
  `src/sim/pitch.ts` so geometry does not import from pitch.
- `src/sim/tick.ts`: after the pitch-rectangle clamp, push the attacker's centre out of the goal
  area ellipse grown by the attacker radius (semi-axes `rx + r`, `ry + r`, same centre as
  `PITCH.goalArea`). Then place the ball. The order is fixed: move, clamp, push out, place ball.
- `docs/architecture.md`: update the geometry row with the new names (and `Ellipse` if it moves).
- New test files only (the existing `src/**/*.test.ts` are protected), for example
  `src/sim/ellipse.test.ts` and `src/sim/goal-area.test.ts`.

#### Acceptance criteria

(Proposed. They apply once the question is answered.)

- C1: Containment returns true for a point strictly inside (for example the centre and a point
  halfway along each semi-axis) and false for a point outside. It also returns false for points
  exactly on the edge (`centre ± rx` on x, `centre ± ry` on y). The edge counts as outside.
- C2: Push-out returns a point outside or on the edge unchanged.
- C3: Push-out moves an inside point that is not the centre onto the edge,
  `((x-cx)/rx)^2 + ((y-cy)/ry)^2` close to 1, along the ray from the centre. The result is
  collinear with the centre and the input, on the same side.
- C4: Push-out is idempotent: pushing out its own result gives the same point, within `toBeCloseTo`.
- C5: Push-out of the exact centre returns a fixed point on the edge and the same point on every
  call. Proposed: `(cx, cy + ry)`, which lies towards the pitch.
- C6: From the initial state, holding "up" for 200 ticks ends with the attacker at
  `x = 10, y ≈ ry + r` (6.4). On no tick is its centre strictly inside the grown ellipse
  (normalised value ≥ 1 − 1e-9).
- C7: Approaching from the left, from the right and diagonally (for example from (2, 10) with
  move (1, -1), from (18, 10) with move (-1, -1), and from (10, 13) with move (1, -1)) for 300
  ticks never leaves the centre strictly inside the grown ellipse on any tick.
- C8: From a position on the front of the grown ellipse (for example (10, 6.4)), holding
  "up-left" makes x never increase from one tick to the next. It strictly decreases over each of
  the first 20 ticks, and the centre is never strictly inside the grown ellipse.
- C9: A state whose attacker the test places strictly inside the goal area (for example (10, 3))
  ends one tick with `NO_INTENT` on the grown ellipse's edge, and the ball at the carry distance
  from it.

#### Seams

- `src/sim/geometry` exports: containment, for example `insideEllipse(p: Vec2, e: Ellipse):
  boolean`, and push-out, for example `pushOutOfEllipse(p: Vec2, e: Ellipse): Vec2`. Tested in a
  new `src/sim/ellipse.test.ts`.
- `tick(state, intent, rng)` from `src/sim/tick`, driven with `initialState(seed)`, states built
  by spreading `attacker.position`, and `PITCH.goalArea` plus `TUNING.attackerRadius` for the
  grown ellipse. Tested in a new `src/sim/goal-area.test.ts`.

#### Notes

- The protected test makes the ticket unbuildable as written. See the Question.
- The ellipse "grown by the radius" (semi-axes + r) is the shape the spec defines. It is not the
  exact offset curve of the goal area. Between the axes, the attacker's circle can overlap the
  real goal area by about a millimetre (at 45° the offset point lands at a normalised value of
  about 1.0006 against the grown ellipse). The criteria are therefore expressed against the
  grown ellipse, and the "tangent" check is exact only on the axis approach (C6). The builder
  should not assert `distance to the real ellipse ≥ r` off-axis.
- The radial push never moves the centre towards y < r (it scales away from y = 0). The grown
  ellipse's left and right extremes (x = 2.1 and 17.9) stay inside the pitch, so the clamp-then-
  push order cannot leave the pitch.
- The browser check (walking into the area from any direction) is manual, as the spec says.

#### Question

The protected test `src/sim/tick.test.ts` (line 62, "keeps the attacker's circle inside the pitch
against each edge") holds "up" for 400 ticks from the start position (10, 13) and expects `y ≈
0.4`. With this ticket the goal area stops the attacker at y = 6.4, as the issue's own criterion
requires. That assertion will necessarily fail. `src/**/*.test.ts` is in `protected_paths`, so the
factory cannot change it. How should this be resolved?

- A) A human amends `src/sim/tick.test.ts` before the job runs, for example by starting the "up"
  case at x = 1 so the top edge is reached beside the goal area, or by moving that case out.
  The factory then builds the plan above unchanged.
- B) This job is explicitly allowed to edit that one assertion in `src/sim/tick.test.ts`, with
  the same change as in A.
- C) Something else, such as changing the order or rule in the spec. Not recommended: it
  contradicts parent spec #2.

**DECISION:** ACCEPT · **RISK:** medium · **SURFACES:** none

### Scope

- `src/sim/geometry.ts`: add the ellipse containment test and the radial push-out, both exported.
  The push-out moves a point along the ray from the ellipse centre until it lies on the ellipse.
  Move the `Ellipse` type (`centre`, `rx`, `ry`) from `src/sim/pitch.ts` into geometry and
  re-export it from pitch, so geometry does not import from pitch and existing imports keep
  working.
- `src/sim/tick.ts`: after the pitch-rectangle clamp, push the attacker's centre out of the goal
  area ellipse grown by the attacker radius. The grown ellipse has the same centre as
  `PITCH.goalArea` and semi-axes `rx + r` and `ry + r`. Then place the ball. The order is fixed:
  move, clamp to the pitch, push out of the goal area, place the ball.
- `docs/architecture.md`: update the `src/sim/geometry` row with the new function names and
  `Ellipse` (and the pitch row if `Ellipse` is now re-exported).
- New test files only. Existing `src/**/*.test.ts` are protected and must not be edited.

### Acceptance criteria

- C1: Containment returns true for points strictly inside (the centre, and points halfway along
  each semi-axis) and false for points outside (beyond each semi-axis and off-axis outside). For
  points exactly on the edge (`centre ± rx` on x, `centre ± ry` on y) it returns false: the edge
  counts as outside.
- C2: Push-out returns a point outside the ellipse, or exactly on the edge, unchanged.
- C3: Push-out moves an inside point other than the centre onto the edge: the normalised value
  `((x-cx)/rx)^2 + ((y-cy)/ry)^2` is close to 1. It moves along the ray from the centre: the
  result is collinear with the centre and the input, on the same side, and farther from the
  centre.
- C4: Push-out is idempotent: pushing out its own result gives the same point, within
  `toBeCloseTo`.
- C5: Push-out of the exact centre returns a point on the edge, and the same point on every call.
  Chosen point: `(cx, cy + ry)`, which lies towards the pitch.
- C6: From `initialState`, holding "up" for 200 ticks leaves the attacker at `x ≈ 10` and
  `y ≈ goalArea.ry + attackerRadius` (6.4). On no tick is its centre strictly inside the grown
  ellipse (normalised value ≥ 1 − 1e-9).
- C7: The same guarantee (never strictly inside the grown ellipse on any tick) holds for 300
  ticks in each of these approaches: from the left (for example start (2, 10), move (1, -1)),
  from the right (for example start (18, 10), move (-1, -1)), and diagonally from the start
  (for example move (1, -1) and (-1, -1)).
- C8: Starting on the front of the grown ellipse at (10, 6.4) and holding "up-left" (move
  (-1, -1)), the attacker's x never increases between consecutive ticks. It strictly decreases on
  each of the first 20 ticks, and the centre is never strictly inside the grown ellipse.
- C9: A state the test places strictly inside the goal area, for example attacker at (10, 3),
  ends with `NO_INTENT` after one tick with the attacker on the edge of the grown ellipse
  (normalised value close to 1) and the ball at `carryDistance` from the attacker.

### Seams

- `src/sim/geometry` exports, with the builder free to refine the names and document them in
  `docs/architecture.md`:
  - `insideEllipse(p: Vec2, e: Ellipse): boolean`
  - `pushOutOfEllipse(p: Vec2, e: Ellipse): Vec2`
  - `Ellipse`

  Tests go in a new `src/sim/ellipse.test.ts` (C1 to C5).
- `tick(state, intent, rng)` from `src/sim/tick`, with:
  - `initialState(seed)`, and states built by spreading a chosen `attacker.position`;
  - `createRng`;
  - `PITCH.goalArea` and `TUNING.attackerRadius` to build the grown ellipse;
  - `TUNING.carryDistance`.

  Tests go in a new `src/sim/goal-area.test.ts` (C6 to C9).

### Notes

- Base: the human chose option A on the issue. Spec branch commit 14be0f7 ("Reach the top edge
  beside the goal area in the edge-confinement test") changes the protected
  `src/sim/tick.test.ts` so its "up" case no longer crosses the goal area. When this plan was
  written, the job branch `factory/006-the-goal-area-keeps-the-attacker-out` was still at
  b16af74, the parent of that commit, so the worktree still showed the old assertion
  (`push(0, -1)` from (10, 13) expecting y ≈ 0.4). The branch must be brought up to
  `origin/spec/002-m1-walking-skeleton-the-attacker-on-the` (14be0f7) before building.
  Otherwise that protected test fails. Do not edit any existing test.
- The ellipse "grown by the radius" (semi-axes + r) is the shape the spec defines. It is not the
  exact offset curve of the goal area. Off-axis, the circle can overlap the real area by about a
  millimetre (at 45° the true offset point has a normalised value of about 1.0006 against the
  grown ellipse). So the criteria are stated against the grown ellipse, and exact tangency is
  only asserted on the axis approach (C6). Tests must not assert `distance to the real
  ellipse ≥ r` off-axis.
- The radial push from (10, 0) never decreases y and moves x away from 10. The grown ellipse's
  extremes (x = 2.1 and 17.9) are inside the pitch, so pushing out after the clamp cannot leave
  the pitch. Up-left sliding ends against the top edge beside the area, with x non-increasing.
- Edge-equality tests should use points that are exact in floating point (on the axes).
  Tolerance-based checks (1e-9) should be used after a push-out.
- The browser check is manual, as the spec states: walking into the area from any direction
  stops at the edge, and sliding is smooth.

## Round 1

### Build

**STATUS:** READY

#### Evidence

- C1: src/sim/ellipse.test.ts::`is true strictly inside` — inside true; also `is false outside` and `counts the edge as outside`
- C2: src/sim/ellipse.test.ts::`leaves outside and edge points unchanged` — outside and edge points returned unchanged
- C3: src/sim/ellipse.test.ts::`moves an inside point onto the edge along the ray from the centre` — lands on the edge, collinear, farther
- C4: src/sim/ellipse.test.ts::`is idempotent` — second push-out gives the same point
- C5: src/sim/ellipse.test.ts::`sends the exact centre to the point towards the pitch, every time` — (cx, cy+ry), deterministic
- C6: src/sim/goal-area.test.ts::`stops the attacker on the front of the area when holding up` — ends at (10, 6.4), never inside
- C7: src/sim/goal-area.test.ts::`never enters the grown ellipse %s` — left, right and diagonal approaches never enter
- C8: src/sim/goal-area.test.ts::`slides left along the edge without ever moving right` — x non-increasing, strictly decreasing first 20 ticks
- C9: src/sim/goal-area.test.ts::`ejects an attacker placed inside and keeps the ball carried` — lands on the edge, ball at carryDistance

### Gate

**GATE:** PASS · **PROTECTED:** none

#### Summary

- checks.sh: OK
- Protected paths modified or deleted: 0
- Evidence problems: 0

### Review

**VERDICT:** PASS

#### Standards
No findings. (Minor, non-blocking: `tick.ts` builds the grown ellipse inline on every tick; fine at this size.)

#### Spec
No findings. C1 to C5 are covered in `src/sim/ellipse.test.ts` and match the `geometry.ts` implementation: the edge counts as outside, the centre goes to `(cx, cy+ry)`, and the push is radial. C6 to C9 are covered in `src/sim/goal-area.test.ts`. `tick.ts` applies the fixed order: move, clamp to the pitch, push out of the grown ellipse, place the ball. `Ellipse` moved to geometry and is re-exported from pitch. No existing tests were edited and there is no extra scope.

#### Architecture
No findings. `docs/architecture.md` now lists `Ellipse`, `insideEllipse` and `pushOutOfEllipse` in the geometry row, and the pitch row notes the re-export. Geometry does not import from pitch, so there is no dependency cycle.

## Timeline

| Time | From | To | Reason |
| --- | --- | --- | --- |
| 2026-11-09T18:44:44+01:00 | (new) | intake | created from #6 for spec 002-m1-walking-skeleton-the-attacker-on-the |
| 2026-11-09T18:58:10+01:00 | intake | intake | start plan |
| 2026-11-09T18:59:34+01:00 | intake | needs-info | NEEDS-INFO |
| 2026-11-10T08:55:56+01:00 | needs-info | intake | answer from @CTDes |
| 2026-11-10T08:56:05+01:00 | intake | intake | start plan |
| 2026-11-10T08:56:30+01:00 | intake | intake | contract failure 1: /Users/xals/Projects/AI/mini-handball-2d/factory/jobs/006-the-goal-area-keeps-the-attacker-out/plan.md: file not found |
| 2026-11-10T08:57:27+01:00 | intake | build | ACCEPT risk=medium surfaces=none |
| 2026-11-10T08:57:36+01:00 | build | build | start build |
| 2026-11-10T08:59:09+01:00 | build | gate | READY |
| 2026-11-10T08:59:22+01:00 | gate | gate | start gate |
| 2026-11-10T08:59:36+01:00 | gate | review | GATE PASS |
| 2026-11-10T08:59:43+01:00 | review | review | start review |
| 2026-11-10T09:00:13+01:00 | review | merging | PASS |
| 2026-11-10T09:00:23+01:00 | merging | merging | start merge |
| 2026-11-10T09:00:42+01:00 | merging | done | merged into spec/002-m1-walking-skeleton-the-attacker-on-the |
