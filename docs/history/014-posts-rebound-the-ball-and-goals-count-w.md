---
job: "014-posts-rebound-the-ball-and-goals-count-w"
kind: "ticket"
issue: 14
title: "Posts rebound the ball and goals count when it fully crosses the line"
spec: "010-m2-shooting-and-outcomes"
stage: "merging"
risk: "medium"
surfaces: []
rounds: 2
created: "2026-11-10T09:44:54+01:00"
updated: "2026-11-10T12:01:04+01:00"
---

# #14 Posts rebound the ball and goals count when it fully crosses the line

`014-posts-rebound-the-ball-and-goals-count-w` · ticket · stage merging · risk medium · surfaces none · 2 rounds · spec [010-m2-shooting-and-outcomes](010-m2-shooting-and-outcomes.md)

## Issue

```text
### Body

Parent: #10
Blocked by: #13

## What to build

Posts and goals. Each post is a circle of a tuned radius at the ends of the goal line. Every tick in flight, the ball's movement segment is swept against each post circle grown by the ball radius (the geometry helpers of the prefactoring ticket); on contact the velocity is reflected about the contact normal with its speed preserved, the ball finishes the tick from the contact point along the remaining fraction, and a post-hit event is emitted; the ball stays live. After post handling, a ball whose centre has crossed the goal line with its x strictly between the inner faces of the posts is in the goal mouth and is no longer out at the top edge; the goal outcome fires when the ball's centre is at least one ball radius beyond the goal line: a goal event, then the resolved pause and the play reset as for out. The top edge outside the goal mouth stays out.

## Acceptance criteria

- [ ] Tick tests: a ball aimed straight at a post rebounds with the same speed and a mirrored velocity, emits post-hit, and at no tick overlaps the post circle, including at the maximum tuned shot speed.
- [ ] Tick tests: a ball aimed between the posts emits goal on exactly the first tick its centre is one ball radius beyond the goal line, not before, and then follows the resolved pause and play-reset sequence; a ball crossing the top edge outside the posts emits out, not goal.
- [ ] Tick tests: a ball that rebounds off a post and then leaves the pitch emits post-hit followed by out, in that order, across ticks.
- [ ] In the browser: shots at a post visibly bounce; shots between the posts stop in the goal and come back after the pause.
- [ ] All M1 tests and the previous M2 tests pass untouched.


### Comment by the factory · 2026-11-10T08:56:24Z

[factory] 014-posts-rebound-the-ball-and-goals-count-w · I need more information before building:

The protected test case `["top", 10, -5]` in `src/sim/flight.test.ts` sends the ball through the
goal mouth, so this ticket's rules turn it into a goal. How should the conflict be resolved?

- (a) A human updates that case before this ticket is built, for example to aim at (3, -5) or
  (17, -5) so it crosses the top edge outside the posts. The ticket then goes ahead unchanged,
  and its own new test covers "top edge outside the posts gives out".
- (b) For this job only, the factory lifts protection on `src/sim/flight.test.ts` so the builder
  can change that one case's aim to a point outside the posts and leave everything else in the
  file as it is.
- (c) Something else: for example, the goal rule should not apply to that path. This would
  contradict spec #10 and needs the spec to be revised.

Answer with a comment on this issue and the factory will pick it up again.

### Comment by @CTDes · 2026-11-10T10:53:15Z

Resolved with option (a). Commit 0f84ae6 on `spec/010-m2-shooting-and-outcomes` changes the protected case in `src/sim/flight.test.ts` from `["top", 10, -5]` to `["top", 3, -5]` (outside the posts), so between the posts the goal rule of this ticket applies and no existing test contradicts it. Build the plan unchanged; do not edit existing tests.
```

## Plan

### Question 1

**DECISION:** NEEDS-INFO · **RISK:** medium · **SURFACES:** none

#### Scope

Add post rebounds and the goal outcome to ball flight in `src/sim/tick.ts`. This means a new
`postRadius` in `src/sim/tuning.ts`, new `post-hit` and `goal` variants of `GameEvent`, a swept
test of each flight segment against both `PITCH.posts` circles grown by the ball radius using
`sweepSegmentCircle` and `reflect`, a goal-mouth exception to the top-edge out rule, and a goal
outcome once the ball's centre is at y <= -ballRadius. The renderer must draw the posts and the
ball in the goal, and the architecture table needs updating. The design is clear. A conflict with
a protected test stops it from being built as written.

#### Acceptance criteria

Not written yet. The plan waits for the answer below.

#### Seams

`tick(state, intent, rng)` and `GameEvent` from `src/sim/tick.ts`. The new tests would go in a
new file, `src/sim/posts-goal.test.ts`.

#### Notes

The conflict is in the protected test `src/sim/flight.test.ts`, which is covered by
`src/**/*.test.ts` in `factory/config.json` `protected_paths`. Its `describe("out")` table has
the case `["top", 10, -5]`. That case shoots from the attacker's start position (10, 13) straight
up at x = 10, which is the goal centre. With one tick of charge the power is 0, so the speed is
8 m/s, about 0.133 m per tick. Under this ticket's rules:

- After 94 flight ticks the ball's centre is at y ≈ -0.083. That is inside the goal mouth but
  not yet a full ball radius (0.15) past the line, so the ball stays in flight. The test's
  per-tick check `y >= 0` while in flight then fails.
- On the next tick the ball reaches y ≈ -0.217 and the outcome is `goal`, not `out`. The test's
  expectation of exactly one `out` event then fails.

So the issue's criterion "previous M2 tests pass untouched" contradicts its own goal-mouth rule
(and parent spec #10, "Goal" / "Out"). The builder cannot edit the protected file. No reading of
the rules makes a shot at the goal centre end as out without breaking the goal criterion.

The rest of the ticket is fine. The other protected tests (`shot.test.ts` aims at (0, 30) and
(0, 30) leaving the pitch, and the `resolved` case aims at (-5, 13)) do not pass through the goal
mouth and would still pass.

#### Question

The protected test case `["top", 10, -5]` in `src/sim/flight.test.ts` sends the ball through the
goal mouth, so this ticket's rules turn it into a goal. How should the conflict be resolved?

- (a) A human updates that case before this ticket is built, for example to aim at (3, -5) or
  (17, -5) so it crosses the top edge outside the posts. The ticket then goes ahead unchanged,
  and its own new test covers "top edge outside the posts gives out".
- (b) For this job only, the factory lifts protection on `src/sim/flight.test.ts` so the builder
  can change that one case's aim to a point outside the posts and leave everything else in the
  file as it is.
- (c) Something else: for example, the goal rule should not apply to that path. This would
  contradict spec #10 and needs the spec to be revised.

**DECISION:** ACCEPT · **RISK:** medium · **SURFACES:** none

### Scope

Add post rebounds and the goal outcome to the `flight` phase of `tick`.

- `src/sim/tuning.ts`: add `postRadius`, the radius of each post circle in metres. The renderer
  currently hard-codes `POST_RADIUS = 0.15`, so a value around that keeps the look.
- `src/sim/tick.ts`:
  - Add two `GameEvent` variants: `{ type: "post-hit", position }`, where `position` is the
    ball's centre at contact, and `{ type: "goal", position }`.
  - In `flight`, the tick's movement is the segment from the old to the new position. Sweep it
    against both `PITCH.posts` circles with radius `postRadius + ballRadius`, using
    `sweepSegmentCircle`, and take the earliest contact.
  - On contact, reflect the velocity about the contact normal with `reflect`, so the speed is
    kept. The ball moves from the contact point along the reflected velocity for the rest of the
    tick, emits `post-hit`, and stays in `flight`.
  - The remaining movement is swept again so a second post contact in the same tick is handled
    too. Cap the number of contacts per tick so a tick always ends. The sweep helper's
    starting-on-the-circle rule stops the ball from hitting the same post again at once.
  - After post handling, the ball is in the goal mouth when its centre has y < 0 and
    `PITCH.posts[0].x + postRadius < x < PITCH.posts[1].x - postRadius`. A ball in the goal
    mouth is not out.
  - When the ball's centre has y <= -ballRadius and it is in the goal mouth, the goal outcome
    fires: a `goal` event, phase `resolved` with the tuned pause, and velocity zero. The ball
    then returns to the attacker with `play-reset`, as for out.
  - Leaving the pitch anywhere else, including the top edge outside the goal mouth, still
    emits `out`.
- `src/render/index.ts`: draw the posts with `TUNING.postRadius` instead of the local constant.
  The ball already gets drawn at its flight or resolved position, so a ball in the goal shows
  inside the drawn net.
- `docs/architecture.md`: in the table, `GameEvent` gains `post-hit` and `goal`, and `TUNING`
  gains the post radius.
- Not in scope: stats, scoreboard, restart, goalkeeper and defender, crossbar, drag.

### Acceptance criteria

- C1: A ball in flight aimed straight at a post centre (velocity along the line to the post
  centre) emits exactly one `post-hit` event. After the rebound its velocity is the reverse of
  the incoming velocity, its speed is unchanged, and the phase stays `flight`.
- C2: A ball hitting a post at an angle leaves with the velocity reflected about the contact
  normal. The normal component is reversed, the tangential component is kept, and the speed is
  unchanged. On the hit tick, the ball's position equals the contact point plus the reflected
  velocity times the remaining fraction of the tick.
- C3: At `TUNING.maxShotSpeed`, the ball's centre is never closer than
  `postRadius + ballRadius` (within float tolerance) to either post centre at the end of any
  tick. The test must include a start position where checking only the end of the tick would
  let the ball pass through the post.
- C4: A ball aimed between the posts emits `goal` on exactly the first tick its centre has
  y <= -ballRadius. Before that it emits neither `goal` nor `out`, including on the ticks where
  0 > y > -ballRadius. On the goal tick the phase becomes `resolved` and the velocity is zero.
- C5: After a goal, the phase stays `resolved` for the tuned pause. Then exactly one
  `play-reset` event is emitted, the phase is `held`, and the ball is at
  `carriedBallPosition(attacker)`.
- C6: A ball crossing the top edge (y < 0) with x outside the inner faces of the posts emits
  `out` and never `goal`.
- C7: A ball that rebounds off a post and then leaves the pitch emits `post-hit` on one tick and
  `out` on a later tick, in that order. There is no `goal`, and the `post-hit` tick has no `out`.

### Seams

- `tick(state, intent, rng)` and `GameEvent` from `src/sim/tick.ts`, with `PITCH.posts` and
  `TUNING` for the expected numbers. Tests may build a `GameState` in `flight` directly from
  `initialState(seed)` with a chosen ball `position` and `velocity`, so shots at posts are
  exact. The attacker cannot stand inside the goal area, so a released shot cannot reach every
  angle.
- New tests go in a new file, `src/sim/posts-goal.test.ts`, with one `describe` per rule:
  post rebound, goal, out at the top edge. Protected test files must not be edited.

### Notes

- The NEEDS-INFO conflict is resolved: the base contains commit 0f84ae6, which moves the
  protected `flight.test.ts` "top" case to aim at (3, -5), outside the posts. That path crosses
  y = 0 near x ≈ 4.9, well clear of the left post at x = 8.5, so it still emits `out`. The other
  protected flight and shot tests do not pass through the goal mouth.
- "Inner faces" means the post centre ± `postRadius`. The ball radius is not subtracted: the
  issue tests the ball's centre against that interval, and the post sweep takes care of contact.
- Floats use `toBeCloseTo`. The no-overlap check in C3 should allow a small tolerance (around
  1e-9), since the contact point lies exactly on the grown circle.
- Browser check by hand: shots at a post bounce, and shots between the posts stop in the goal
  and come back after the pause.

## Round 1

### Build

**STATUS:** READY

#### Evidence

- C1: src/sim/posts-goal.test.ts::`reverses a ball aimed at a post centre, keeping speed` — one post-hit, velocity reversed, still flight
- C2: src/sim/posts-goal.test.ts::`reflects about the contact normal and advances the remaining tick` — reflection and position after contact
- C3: src/sim/posts-goal.test.ts::`never lets the ball closer than post plus ball radius, even when the tick skips over it` — max speed, tick straddles the post
- C4: src/sim/posts-goal.test.ts::`fires on the first tick the centre reaches y <= -ballRadius, never out` — goal tick, resolved, zero velocity
- C5: src/sim/posts-goal.test.ts::`resets to the attacker after the pause with one play-reset` — pause then held at carried position
- C6: src/sim/posts-goal.test.ts::`emits out, not goal, outside the posts` — top edge outside mouth is out
- C7: src/sim/posts-goal.test.ts::`emits post-hit then out after a rebound, with no goal` — post-hit before out, no goal

### Gate

**GATE:** PASS · **PROTECTED:** none

#### Summary

- checks.sh: OK
- Protected paths modified or deleted: 0
- Evidence problems: 0

### Review

**VERDICT:** CHANGES

#### Standards
- src/sim/posts-goal.test.ts, "reverses a ball aimed at a post centre": runs the same 60 ticks twice (`run(s, 60)` for the filter, then again for `log`). Reuse one log. [non-blocking]
- src/sim/posts-goal.test.ts: non-null assertion `ev!` and a loose `at` helper; fine but noisy. [non-blocking]

#### Spec
- C3 (src/sim/posts-goal.test.ts, test "never lets the ball closer than post plus ball radius, even when the tick skips over it"): the plan requires a start position where checking only the end of the tick would let the ball pass through. This test does not have one. With `reach = 0.15 + 0.15 = 0.3` and a step of 22/60 = 0.367 m, a ball aimed at the post centre from (left.x, 0.5) ends its first tick at y = 0.133, already inside the circle. An end-of-tick-only implementation would fail it anyway, so it cannot tell sweeping from no sweeping. The comment "start and end of one tick straddle the post" is false for a centre shot, since the step is smaller than 2*reach = 0.6. A real tunnelling case is off-centre: a start about 0.28 m to the side of the post centre, with the start and end of the tick both outside the grown circle but the segment crossing it. Add such a case. [blocking]
- C1, C2, C4, C5, C6, C7: implementation and tests are consistent with the plan. The contact sweep, reflection, remaining-fraction advance, contact cap, goal mouth test, `goal` at y <= -ballRadius, and `out` elsewhere are all present.
- No extra scope. The render change is the one the plan asked for.

#### Architecture
No findings. architecture.md is updated for `GameEvent` and `TUNING`. The sim stays pure and uses only the existing geometry exports. One small note: the `rules` row still lists `GameEvent`, which was already there before this change.

## Round 2

### Build

**STATUS:** READY

#### Evidence

- C1: src/sim/posts-goal.test.ts::`reverses a ball aimed at a post centre, keeping speed` — one post-hit, velocity reversed, still flight
- C2: src/sim/posts-goal.test.ts::`reflects about the contact normal and advances the remaining tick` — reflection and position after contact
- C3: src/sim/posts-goal.test.ts::`catches a post crossed within one tick whose start and end are both outside the circle` — off-centre tunnelling case, never closer than reach
- C4: src/sim/posts-goal.test.ts::`fires on the first tick the centre reaches y <= -ballRadius, never out` — goal tick, resolved, zero velocity
- C5: src/sim/posts-goal.test.ts::`resets to the attacker after the pause with one play-reset` — pause then held at carried position
- C6: src/sim/posts-goal.test.ts::`emits out, not goal, outside the posts` — top edge outside mouth is out
- C7: src/sim/posts-goal.test.ts::`emits post-hit then out after a rebound, with no goal` — post-hit before out, no goal

### Gate

**GATE:** PASS · **PROTECTED:** none

#### Summary

- checks.sh: OK
- Protected paths modified or deleted: 0
- Evidence problems: 0

### Review

**VERDICT:** PASS

#### Standards
- src/sim/posts-goal.test.ts, "reverses a ball aimed at a post centre": still runs the same 60 ticks twice. Reuse one log. [non-blocking]
- The `ev!` non-null assertion and the loose `at` helper remain. [non-blocking]

#### Spec
- C3: the round 1 blocking finding is fixed. The new "post rebound tunnelling" test starts 0.28 m to the side of the post at y = 0.2, shoots at max speed, and asserts that the start and end of the tick are both outside `postRadius + ballRadius`. It then asserts `post-hit` on tick 0 and that the distance never falls below the reach. An end-of-tick-only check would fail it, so it tells sweeping from no sweeping.
- C1, C2, C4, C5, C6, C7: implementation and tests are consistent with the plan, as in round 1.
- No extra scope.

#### Architecture
No findings. architecture.md is updated for `GameEvent` and `TUNING`. The sim stays pure.

## Timeline

| Time | From | To | Reason |
| --- | --- | --- | --- |
| 2026-11-10T09:44:54+01:00 | (new) | intake | created from #14 for spec 010-m2-shooting-and-outcomes |
| 2026-11-10T09:55:24+01:00 | intake | intake | start plan |
| 2026-11-10T09:56:26+01:00 | intake | needs-info | NEEDS-INFO |
| 2026-11-10T11:53:25+01:00 | needs-info | intake | answer from @CTDes |
| 2026-11-10T11:53:26+01:00 | intake | intake | start plan |
| 2026-11-10T11:56:03+01:00 | intake | build | ACCEPT risk=medium surfaces=none |
| 2026-11-10T11:56:09+01:00 | build | build | start build |
| 2026-11-10T11:57:52+01:00 | build | gate | READY |
| 2026-11-10T11:57:59+01:00 | gate | gate | start gate |
| 2026-11-10T11:58:11+01:00 | gate | review | GATE PASS |
| 2026-11-10T11:58:21+01:00 | review | review | start review |
| 2026-11-10T11:59:03+01:00 | review | build | CHANGES round 1 |
| 2026-11-10T11:59:13+01:00 | build | build | start build |
| 2026-11-10T12:00:02+01:00 | build | gate | READY |
| 2026-11-10T12:00:10+01:00 | gate | gate | start gate |
| 2026-11-10T12:00:23+01:00 | gate | review | GATE PASS |
| 2026-11-10T12:00:31+01:00 | review | review | start review |
| 2026-11-10T12:01:04+01:00 | review | merging | PASS |
