---
job: "013-charge-and-release-the-power-bar-the-sho"
kind: "ticket"
issue: 13
title: "Charge and release: the power bar, the shot, ball flight and out"
spec: "010-m2-shooting-and-outcomes"
stage: "merging"
risk: "medium"
surfaces: ["api", "ui"]
rounds: 1
created: "2026-11-10T09:44:54+01:00"
updated: "2026-11-10T09:54:52+01:00"
---

# #13 Charge and release: the power bar, the shot, ball flight and out

`013-charge-and-release-the-power-bar-the-sho` · ticket · stage merging · risk medium · surfaces api, ui · 1 round · spec [010-m2-shooting-and-outcomes](010-m2-shooting-and-outcomes.md)

## Issue

```text
### Body

Parent: #10
Blocked by: #11, #12

## What to build

Charge, release, fly, go out, come back. Holding the left mouse button over the canvas or the space bar (which must not scroll the page) sets shoot-held; while the ball is held that starts the `charging` phase with a power bar that sweeps 0 → 1 → 0 as a triangle wave at the tuned rate, drawn by the renderer above the attacker; the attacker can still move. Releasing shoots: the ball leaves from the carry position along the direction from the attacker to the aim point (towards the goal centre if they coincide) at minimum speed + power × (maximum − minimum), both tuned; the tick emits a shot event; the phase becomes `flight`. In flight the ball moves in a straight line at constant speed and the renderer draws it where it is. When the ball's centre leaves the pitch rectangle (any edge; the goal mouth is handled in the next ticket, for now the whole top edge counts as out), the out outcome fires: an out event, the `resolved` phase for the tuned pause, then a play-reset event with the ball back at the carry position and the phase `held`. Shoot-held during flight or resolved does nothing. Phases, power and the ball's velocity live in the state; speeds, sweep duration and pause are tuning.

## Acceptance criteria

- [ ] Tick tests: shoot-held while held switches to charging with power 0; the power is 1 after half the sweep duration and 0 after the full sweep; releasing at a known power gives the ball a speed equal to the tuned formula, in the aim direction, and emits one shot event; with the aim equal to the attacker's position the shot goes towards the goal centre.
- [ ] Tick tests: in flight the ball advances by speed × tick duration per tick in a straight line; the attacker can still move while charging and in flight.
- [ ] Tick tests: a ball leaving by the left, right, bottom or top edge emits out and enters resolved; after the tuned pause a play-reset event fires, the ball is at the carry position and the phase is held; shoot-held during flight or resolved changes nothing.
- [ ] In the browser: holding click or space shows the sweeping bar, releasing shoots along the aim line, the ball flies off the pitch and comes back after the pause.
- [ ] All M1 tests pass untouched; the architecture table and the tuning module list the new state fields, events and constants.
```

## Plan

**DECISION:** ACCEPT · **RISK:** medium · **SURFACES:** api, ui

### Scope

The second ticket of spec #10 (M2), built on the spec branch, where the geometry helpers
(#11: `sweepSegmentCircle`, `reflect`, `insideRect`, `dot`) and the aim (#12: `state.aim`,
the mouse mapping, the aim line) are already in place. It adds the play cycle charge, release,
flight, out, return. Posts and the goal mouth are left for the next ticket.

Simulation (`src/sim/`, pure):
- `state.ts`: `GameState` gains a play phase (`"held" | "charging" | "flight" | "resolved"`),
  the power (0..1) and the resolved countdown. `Ball` gains `velocity: Vec2`. `initialState`
  starts in `held` with power 0 and zero velocity, and the ball stays at `carriedBallPosition`.
  The existing fields keep their meaning, so M1's state tests still pass.
- `tuning.ts`: minimum and maximum shot speed, power sweep duration (about 1.2 s; a full
  0 -> 1 -> 0 cycle), resolved pause (seconds or ticks, documented), and, if the renderer needs
  them, the power bar's size and offset in metres.
- `tick.ts`: `GameEvent` becomes a discriminated union of plain objects with `type`:
  `shot` (position, power, velocity or direction), `out` (position) and `play-reset`
  (position). `post-hit` and `goal` arrive in the next ticket. The rules:
  - Attacker movement and confinement run in every phase, unchanged.
  - `held` + shoot-held: the phase becomes `charging` and the power is 0 on that tick.
  - `charging` + shoot-held: the power advances along a triangle wave between 0 and 1. A full
    sweep lasts the tuned duration, so the power is 1 at half the sweep and 0 again at the full
    sweep.
  - `charging` without shoot-held: release at the current power. The shot direction is the unit
    vector from the attacker to `aim`; if they coincide, it points towards the goal centre. The
    ball goes to attacker + carryDistance x direction. Its velocity is
    (min + power x (max - min)) x direction. One `shot` event is emitted and the phase becomes
    `flight`.
  - `held` and `charging`: the M1 carry rule applies (the ball sits at `carriedBallPosition`
    and `held` is true).
  - `flight`: position += velocity x tickDuration, in a straight line. If the ball's centre is
    then outside the pitch rectangle `[0, width] x [0, length]` (use `insideRect`; for now the
    whole top edge counts as out), emit `out`, enter `resolved` with the countdown set from the
    tuned pause, and stop the ball (zero velocity; it stays where it went out, for the renderer).
  - `resolved`: the countdown decreases each tick. On the tick it reaches zero the ball goes back
    to `carriedBallPosition(attacker)`, `held` becomes true, the phase becomes `held`, the power
    goes back to 0 and a `play-reset` event is emitted.
  - Shoot-held in `flight` or `resolved` has no effect.

Adapters (checked by hand):
- `src/input`: the left mouse button down on the canvas, or Space down, sets `shootHeld`;
  releasing clears it (listen for `mouseup` on `window` so the flag cannot get stuck; `blur`
  clears it). Space calls `preventDefault` so the page does not scroll.
- `src/render`: a horizontal power bar above the attacker, filled in proportion to `power`,
  while `charging`. The aim line is drawn while `held` or `charging`. The ball is drawn at its
  state position in every phase. Colours stay in the renderer.
- `docs/architecture.md`: update the rows for `state` (new fields), `tick` (`GameEvent`
  variants), `tuning` (new constants), `input` (shoot control) and `render` (power bar).

Out of scope: posts, the goal outcome, stats/scoreboard, restart, and the UI adapter (later
tickets of #10).

### Acceptance criteria

- C1: From `initialState`, a tick with `shootHeld: true` gives phase `charging` and power 0. The
  ball is still held, at `carriedBallPosition(attacker)`.
- C2: While shoot-held stays true in `charging`, the power is 1 (toBeCloseTo) after half the
  tuned sweep duration of ticks and 0 again after the full sweep duration. At a quarter of the
  sweep it is 0.5.
- C3: Releasing (a tick with `shootHeld: false` in `charging`) at a known power p gives a ball
  speed equal to `minShotSpeed + p x (maxShotSpeed - minShotSpeed)` (using `TUNING`). The
  velocity is along the unit vector from the attacker to the aim point, the ball is at the carry
  distance from the attacker along that direction, the phase is `flight`, `ball.held` is false,
  and exactly one event of type `shot` is emitted on that tick, carrying the power p.
- C4: When the aim point equals the attacker's position, the released shot's velocity points
  towards `TUNING.goalCentre`.
- C5: In `flight`, each tick the ball's position advances by exactly velocity x
  `TUNING.tickDuration` (toBeCloseTo). Successive positions stay collinear and the speed stays
  constant over several ticks.
- C6: The attacker moves by the usual M1 step when given a move intent while `charging` and
  while in `flight`. In `flight` the ball's trajectory is unaffected by the attacker's movement.
- C7: Shots aimed off the left, right, bottom and top edges (the top edge anywhere, for now)
  each emit exactly one `out` event on the first tick the ball's centre is outside the pitch
  rectangle, not before, and the phase becomes `resolved`.
- C8: After an `out`, the phase stays `resolved` with no `play-reset` until the tuned pause has
  elapsed. On the tick that completes the pause, exactly one `play-reset` event is emitted, the
  phase is `held`, `ball.held` is true and the ball is at `carriedBallPosition(attacker)`.
- C9: A tick with `shootHeld: true` during `flight`, and another during `resolved`, give the
  same resulting state and events as the same tick with `shootHeld: false`.
- C10: `tick` never mutates its input state through a charge, release, flight, out and reset
  cycle.

### Seams

- Public: `tick(state, intent, rng)` from `src/sim/tick.ts`, `initialState(seed)` and
  `carriedBallPosition` from `src/sim/state.ts`, `TUNING` from `src/sim/tuning.ts`,
  `NO_INTENT` from `src/sim/intent.ts`. Tests drive `tick` with intent sequences and assert
  state fields and events, never internals. Floats use `toBeCloseTo`, and expected numbers come
  from `TUNING`.
- Tests go in new files, for example `src/sim/shot.test.ts` (C1 to C4, C9, C10) and
  `src/sim/flight.test.ts` (C5 to C8). Existing `src/**/*.test.ts` files are protected and must
  not be edited.

### Notes

- The protected M1 tests (`tick.test.ts`, `ball.test.ts`, `aim.test.ts`, `state.test.ts`)
  assert that `NO_INTENT` ticks emit no events, keep the ball held at the carry position and do
  not mutate. All of that still holds, because `NO_INTENT.shootHeld` is false and the initial
  phase is `held`.
- About the release position, the issue says "from the carry position along the direction"
  and the spec says "moves the ball ... to the carry position along the shot direction". Read
  this as carry distance along the shot direction, not the M1 position towards the goal centre.
  The return after `resolved` uses the M1 `carriedBallPosition`.
- On the release tick, compute the direction from the attacker's position after that tick's
  movement. The tests release with zero move, so either choice passes, but say which one in a
  comment.
- The issue does not say whether a shoot control still held when `play-reset` fires should
  start charging on the next tick. Any behaviour is acceptable as long as the reset tick itself
  ends in `held`. Do not add a criterion for it.
- Pick the resolved pause's units (seconds converted with `Math.round(pause / tickDuration)`,
  or ticks) and document it in `tuning.ts`. Tests derive the tick count from `TUNING`.
- Shot stats, posts, goal, restart and the scoreboard belong to the next tickets. Do not add
  them here, but shape `GameEvent` and the phase so they slot in without renames.
- No new runtime dependencies (ADR 0001). The simulation stays pure (ADR 0002). The ball has no
  height (ADR 0003).

## Round 1

### Build

**STATUS:** READY

#### Evidence

- C1: src/sim/shot.test.ts::`starts charging at power 0 with the ball still held` — first shoot-held tick gives charging, power 0, ball at carry position
- C2: src/sim/shot.test.ts::`sweeps the power as a triangle wave over the tuned duration` — 0.5, 1 and 0 at quarter, half and full sweep
- C3: src/sim/shot.test.ts::`shoots along the aim at the speed of the current power` — speed, direction, carry distance, flight phase, one shot event
- C4: src/sim/shot.test.ts::`points towards the goal centre when the aim is on the attacker` — fallback direction
- C5: src/sim/flight.test.ts::`advances the ball by velocity x tick duration in a straight line` — exact step, constant speed
- C6: src/sim/flight.test.ts::`moves the attacker while the trajectory is unaffected` — attacker moves in flight, ball unchanged
- C7: src/sim/flight.test.ts::`emits one out event on the first tick outside the %s edge` — four edges, one out each, resolved
- C8: src/sim/flight.test.ts::`waits the tuned pause and then resets the play once` — pause then single play-reset, held
- C9: src/sim/shot.test.ts::`is ignored in flight and resolved` — shootHeld has no effect
- C10: src/sim/shot.test.ts::`never mutates its input through a full cycle` — input state unchanged

### Gate

**GATE:** PASS · **PROTECTED:** none

#### Summary

- checks.sh: OK
- Protected paths modified or deleted: 0
- Evidence problems: 0

### Review

**VERDICT:** PASS

#### Standards
- src/sim/shot.test.ts, purity test: `expect(before).toEqual(structuredClone(before))` compares a clone with itself, so it can never fail. It should compare `before` against `s` as it was before the tick (the input state after the call). The final frozen check after the loop does cover C10 for the last state, but not for each step. [non-blocking]
- src/sim/flight.test.ts: the pitch bounds `20` are hardcoded in the "out" test. They should come from `TUNING.pitchWidth` and `TUNING.pitchLength`. [non-blocking]
- src/sim/tick.ts imports: `subtract` sits before `pushOutOfEllipse`, so the list is not alphabetical. This is cosmetic. [non-blocking]

#### Spec
- C1 to C10 are all met by the diff.
  - C1: the `held` + shoot-held case enters `charging` with power 0 and a carried ball.
  - C2: `powerAt` is a triangle wave over `sweepTicks`.
  - C3 and C4: release builds the direction from aim, falling back to the goal centre when aim coincides with the attacker. The ball goes to carryDistance along that direction, with speed min + p x (max - min). One `shot` event carries the power.
  - C5 and C6: flight is a straight-line step, and attacker movement runs in every phase.
  - C7: `out` is emitted once via `insideRect`, and the phase becomes `resolved`.
  - C8: the pause counts down and `play-reset` fires on the tick the countdown reaches 0.
  - C9: `shootHeld` is ignored in `flight` and `resolved`.
  - C10: `tick` builds new objects and never mutates its input.
- The units of the resolved pause (seconds, converted to ticks) are documented in tuning.ts.
- The release comment about which attacker position is used is present.
- No extra scope. Posts, goal and stats are not added.

#### Architecture
- docs/architecture.md rows for state, tick, tuning, input and render are updated in the same diff, as the interface changes require.
- The simulation stays pure, with no new dependencies. Colours and drawing stay in the renderer. Input only sets `shootHeld`.
- No findings.

## Timeline

| Time | From | To | Reason |
| --- | --- | --- | --- |
| 2026-11-10T09:44:54+01:00 | (new) | intake | created from #13 for spec 010-m2-shooting-and-outcomes |
| 2026-11-10T09:51:12+01:00 | intake | intake | start plan |
| 2026-11-10T09:52:32+01:00 | intake | build | ACCEPT risk=medium surfaces=api,ui |
| 2026-11-10T09:52:36+01:00 | build | build | start build |
| 2026-11-10T09:53:58+01:00 | build | gate | READY |
| 2026-11-10T09:54:06+01:00 | gate | gate | start gate |
| 2026-11-10T09:54:18+01:00 | gate | review | GATE PASS |
| 2026-11-10T09:54:23+01:00 | review | review | start review |
| 2026-11-10T09:54:52+01:00 | review | merging | PASS |
