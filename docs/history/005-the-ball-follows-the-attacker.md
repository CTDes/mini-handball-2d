---
job: "005-the-ball-follows-the-attacker"
kind: "ticket"
issue: 5
title: "The ball follows the attacker"
spec: "002-m1-walking-skeleton-the-attacker-on-the"
stage: "merging"
risk: "medium"
surfaces: ["ui"]
rounds: 1
created: "2026-11-09T18:44:43+01:00"
updated: "2026-11-09T18:53:55+01:00"
---

# #5 The ball follows the attacker

`005-the-ball-follows-the-attacker` · ticket · stage merging · risk medium · surfaces ui · 1 round · spec [002-m1-walking-skeleton-the-attacker-on-the](002-m1-walking-skeleton-the-attacker-on-the.md)

## Issue

```text
### Body

Parent: #2
Blocked by: #3

## What to build

The attacker visibly holds the ball. The state gains the ball (position and a held marker, always held in M1). After movement and confinement, each tick places the ball at the carry distance (attacker radius plus ball radius, from tuning) in front of the attacker, towards the goal centre. The renderer draws the ball as a small filled circle after the attacker so it reads as held in front.

## Acceptance criteria

- [ ] State tests: the initial state has the ball held and placed at the carry distance in front of the attacker, towards the goal centre.
- [ ] Tick tests: after any movement the ball is at the carry distance from the attacker's centre, on the line from the attacker to the goal centre; with the attacker directly below the goal the ball is straight above it.
- [ ] In the browser, the ball moves with the attacker and always sits between the attacker and the goal.
```

## Plan

**DECISION:** ACCEPT · **RISK:** medium · **SURFACES:** ui

### Scope

Give the game state a ball that the attacker visibly holds (M1 of the parent spec #2, user story 8).

- `src/sim/tuning.ts`: add `ballRadius` (0.15 m) and the carry distance (attacker radius plus
  ball radius, 0.55 m). Derive the carry distance from the two radii, don't hard-code it. Add the
  goal centre (x = pitchWidth / 2, y = 0) only if no pitch module provides it yet. If
  `src/sim/pitch` exists on the base by build time (ticket #4), use its goal-centre value.
- `src/sim/state.ts`: add a `Ball` type (`position: Vec2`, `held: boolean`, always `true` in M1)
  and a `ball` field on `GameState`. `initialState(seed)` places the ball at the carry distance in
  front of the attacker's start position, towards the goal centre.
- `src/sim/tick.ts`: after movement and confinement (pitch clamp now; the goal-area push-out from
  ticket #6 also runs before this step if it has already landed), place the ball at
  `attacker + normalize(goalCentre - attacker) * carryDistance`, with `held: true`. The rest of
  `tick` stays the same: tick counter, seed, empty events, no mutation of the input state.
- A pure placement helper, such as `carriedBallPosition(attacker)` in `state.ts` or a small sim
  module, may be shared by `initialState` and `tick`. Where it lives is up to the builder.
- `src/render/index.ts`: draw the ball as a small filled circle of radius `ballRadius` at the
  ball's position, after the attacker so it is visible on top. Put its colour in a renderer
  constant, not in tuning.
- `docs/architecture.md`: update the module table. `GameState` now has `ball`, `TUNING` now
  includes the ball radius and carry distance, and any new helper should be listed.

Out of scope: aiming, shooting, ball flight, a ball that is not held, and interpolated rendering.

### Acceptance criteria

- C1: `initialState(seed).ball.held` is `true`.
- C2: In `initialState(seed)`, the ball's distance from the attacker's centre equals
  `TUNING.attackerRadius + TUNING.ballRadius` (0.55 m).
- C3: In `initialState(seed)`, the ball lies on the segment from the attacker to the goal centre.
  With the start at (10, 13) and the goal centre at (10, 0), the ball is at (10, 12.45).
- C4: After `tick` with movement in each of several directions (right, left, up, down and a
  diagonal), the ball in the new state is at the carry distance from the new attacker position.
- C5: After those same ticks, the ball lies on the ray from the new attacker position towards the
  goal centre: (ball − attacker) is parallel to and points the same way as (goalCentre −
  attacker).
- C6: When the attacker is directly below the goal centre (x = 10) after a tick, the ball has the
  same x and a y smaller by exactly the carry distance.
- C7: After many ticks pushing into a pitch edge or corner, so that confinement has moved the
  attacker, the ball is still at the carry distance towards the goal centre from the confined
  position. This shows placement runs after confinement.
- C8: The ball stays held after every tick, including a tick with `NO_INTENT`. A tick with
  `NO_INTENT` leaves the ball's position unchanged.

### Seams

- Public simulation interface: `initialState(seed)` and `tick(state, intent, rng)`, with tests
  asserting on `state.ball` and `state.attacker.position`. Use `TUNING` for the radii and the goal
  centre (or the pitch module's value if it exists).
- Tests go in new co-located files, because all existing `src/**/*.test.ts` files are protected
  and cannot be edited. Suggested files: `src/sim/ball.test.ts`, with a `describe` for
  `initialState` (C1 to C3) and one for `tick` (C4 to C8). They import only from `src/sim/*` and
  use `toBeCloseTo` for floats.
- Renderer: the ball drawing has no automated test. Check it by hand with `npm run dev`: the ball
  moves with the attacker and always sits between the attacker and the goal.

### Notes

- Ticket #5 is blocked by #3, which is already on the base: movement and pitch clamp are in
  `tick.ts`. Tickets #4 (pitch module) and #6 (goal-area confinement) are siblings and may land in
  either order. Keep the ball placement as the last step of `tick` so that #6 can put its push-out
  before it.
- The attacker centre can never coincide with the goal centre, because the pitch clamp keeps
  y >= 0.4. Even so, `normalize` returns the zero vector for a zero direction, so the placement
  must not produce NaN.
- Existing tests compare whole states only against clones of themselves, so adding the `ball`
  field does not break them.

## Round 1

### Build

**STATUS:** READY

#### Evidence

- C1: src/sim/ball.test.ts::`C1: the ball is held` — initial ball is held
- C2: src/sim/ball.test.ts::`C2: the ball sits at the carry distance` — distance equals 0.55
- C3: src/sim/ball.test.ts::`C3: the ball lies towards the goal centre` — ball at (10, 12.45)
- C4: src/sim/ball.test.ts::`C4: the ball stays at the carry distance after moving` — five directions
- C5: src/sim/ball.test.ts::`C5: the ball lies on the ray from the attacker towards the goal centre` — parallel, same direction
- C6: src/sim/ball.test.ts::`C6: directly below the goal centre the ball is straight above the attacker` — same x, y less by carry
- C7: src/sim/ball.test.ts::`C7: placement runs after confinement` — edges and corner after 600 ticks
- C8: src/sim/ball.test.ts::`C8: the ball stays held and NO_INTENT leaves it in place` — held, unchanged on NO_INTENT

### Gate

**GATE:** PASS · **PROTECTED:** none

#### Summary

- checks.sh: OK
- Protected paths modified or deleted: 0
- Evidence problems: 0

### Review

**VERDICT:** PASS

#### Standards
No findings.

#### Spec
No findings. C1 to C3 are covered by the initial state (ball held, at carry distance 0.55 derived from the two radii, at (10, 12.45)). C4 to C8 are met because `tick` places the ball last, after the clamp, through `carriedBallPosition`. The renderer draws the ball after the attacker. Tests are in the new `src/sim/ball.test.ts`. No extra scope.

#### Architecture
No findings. `docs/architecture.md` is updated for `GameState.ball`, `Ball`, `carriedBallPosition`, and the new `TUNING` entries. The goal centre is added to tuning because no pitch module is on the base, as the plan allows. Dependencies stay inside `src/sim`, and render reads `TUNING` and state only.

## Timeline

| Time | From | To | Reason |
| --- | --- | --- | --- |
| 2026-11-09T18:44:43+01:00 | (new) | intake | created from #5 for spec 002-m1-walking-skeleton-the-attacker-on-the |
| 2026-11-09T18:50:40+01:00 | intake | intake | start plan |
| 2026-11-09T18:51:49+01:00 | intake | build | ACCEPT risk=medium surfaces=ui |
| 2026-11-09T18:51:49+01:00 | build | build | start build |
| 2026-11-09T18:53:00+01:00 | build | gate | READY |
| 2026-11-09T18:53:04+01:00 | gate | gate | start gate |
| 2026-11-09T18:53:15+01:00 | gate | review | GATE PASS |
| 2026-11-09T18:53:25+01:00 | review | review | start review |
| 2026-11-09T18:53:55+01:00 | review | merging | PASS |
