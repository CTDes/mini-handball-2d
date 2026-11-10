---
job: "012-aim-with-the-mouse-the-aim-line-follows"
kind: "ticket"
issue: 12
title: "Aim with the mouse: the aim line follows the cursor"
spec: "010-m2-shooting-and-outcomes"
stage: "merging"
risk: "medium"
surfaces: ["sim", "input", "render"]
rounds: 1
created: "2026-11-10T09:44:53+01:00"
updated: "2026-11-10T09:48:18+01:00"
---

# #12 Aim with the mouse: the aim line follows the cursor

`012-aim-with-the-mouse-the-aim-line-follows` · ticket · stage merging · risk medium · surfaces sim, input, render · 1 round · spec [010-m2-shooting-and-outcomes](010-m2-shooting-and-outcomes.md)

## Issue

```text
### Body

Parent: #10

## What to build

Aiming with the mouse. Moving the mouse over the canvas moves an aim point, in pitch metres, that the intent carries; the renderer draws a dashed aim line from the attacker to that point with a small reticle at the end while the ball is held. Until the mouse has moved over the canvas, the aim point is the goal centre. The renderer exposes the mapping from canvas pixels to pitch metres (it owns the scaling) and the input adapter uses it; the entry point wires them. The ball-carry rule of M1 (towards the goal centre) does not change. No shooting yet.

## Acceptance criteria

- [ ] The input adapter reports the aim point in pitch metres for a mouse position over the canvas, using the renderer's mapping, and the goal centre before any mouse movement (checked by hand; adapters have no automated tests).
- [ ] In the browser, the dashed aim line and reticle follow the cursor across the whole pitch at any window size, and stay correct after a resize.
- [ ] The tick stores the aim point from the intent in the state so the renderer draws from the state, with a test that the stored aim equals the intent's aim and defaults to the goal centre in the initial state.
- [ ] All M1 tests pass untouched; the architecture table reflects the input and renderer signatures.
```

## Plan

**DECISION:** ACCEPT · **RISK:** medium · **SURFACES:** sim, input, render

### Scope

First M2 slice (parent spec #10, user stories 1, 2 and 16, aim part only). Mouse aiming and the drawn aim line. No shooting, no power bar, no play phases.

- `src/sim/state`: `GameState` gains `aim: Vec2` (pitch metres). `initialState(seed)` sets it to a copy of `TUNING.goalCentre`. `carriedBallPosition` and the M1 ball-carry rule (towards the goal centre, not towards the aim) do not change.
- `src/sim/tick`: the new state's `aim` is the intent's `aim`. Following the CLAUDE.md "invalid intents are clamped" convention, a non-finite aim component (NaN or plus or minus Infinity) must not end up in the state: if either component is non-finite, the stored aim falls back to the goal centre. Finite aims are stored as they are, without clamping, because points beyond the goal line or the pitch edges are valid aims. Nothing else in the tick changes and no events are emitted.
- `src/sim/intent`: shape unchanged. `NO_INTENT.aim` may stay `{0,0}` or become the goal centre. The protected test only checks `move` and `shootHeld`.
- `src/render`: `createRenderer(canvas)` also returns a mapping from a mouse position to pitch metres, for example `toPitch(clientX, clientY): Vec2`. It is the exact inverse of the drawing transform (MARGIN, scale `k`). It works in CSS pixels through `canvas.getBoundingClientRect()`, so the device pixel ratio and resizes are handled because it recomputes on every call. While `state.ball.held` is true, `draw` paints a dashed line from the attacker's centre to `state.aim` with a small reticle at `state.aim`. Colours and sizes stay in the renderer.
- `src/input`: `createInput` takes the mapping, for example `createInput(toPitch)`. A `mousemove` listener on the canvas (or on `window`, filtered to the canvas) updates the aim in pitch metres. `current()` reports that aim, or the goal centre before any mouse movement. Keyboard behaviour is unchanged. `src/input` must not import `src/render` (allowed dependencies), so the mapping is passed in as a function or a canvas-plus-function pair.
- `src/main.ts`: create the renderer first, then pass its mapping to `createInput`.
- `docs/architecture.md`: update the module table rows for `src/sim/state` (`GameState` includes `aim`), `src/input` (new `createInput` signature, mouse aim), `src/render` (returned object includes the mapping, draws the aim line) and `src/sim/tick` if the wording changes.

### Acceptance criteria

- C1: `initialState(seed).aim` equals `TUNING.goalCentre` (by value) for any seed.
- C2: After one `tick` with an intent whose `aim` is a finite point (inside the pitch, behind the goal line with negative y, or outside the pitch rectangle), `state.aim` equals that point.
- C3: Across a sequence of ticks with different aims, each resulting `state.aim` equals the aim of the intent of that tick (the last intent wins; there is no smoothing).
- C4: Changing only the intent's `aim` does not change the attacker position or the ball position produced by `tick`. The ball stays at `carriedBallPosition(attacker)`, which points towards the goal centre, and stays held.
- C5: A `tick` with an intent whose `aim` has a NaN or infinite component does not throw, and stores `TUNING.goalCentre` as `state.aim`.
- C6: `tick` with an aim-carrying intent emits no events and does not mutate the input state (the original state still has its previous `aim`).

### Seams

- Public simulation interface: `initialState(seed)`, `tick(state, intent, rng)`, `Intent`, `NO_INTENT`, `TUNING.goalCentre`, `carriedBallPosition`.
- Tests: a new file `src/sim/aim.test.ts` with behaviour-named `describe` and `it` blocks. It follows the M1 prior art: an intent helper built from `{ ...NO_INTENT, aim }`, `createRng(seed)`, and `toBeCloseTo` or `toEqual` on `TUNING` values. The existing `*.test.ts` files are protected and must not be edited.
- Adapters (`src/input`, `src/render`, `src/main.ts`) are checked by hand with `npm run dev`. They have no automated tests, per CLAUDE.md and the architecture.

### Notes

- The current render transform is `px(m) = (m + MARGIN) * k` with `k = canvas.width / (PITCH.width + 2*MARGIN)` in device pixels. The inverse for a mouse event should be `m = (clientX - rect.left) * (PITCH.width + 2*MARGIN) / rect.width - MARGIN`, and the same for y with `rect.top` and `rect.height`. This avoids depending on `devicePixelRatio` or a cached `size`, so the mapping stays correct after a resize.
- Positions in the margin around the pitch map to points outside the pitch, which is intended. Do not clamp them.
- Keep the M1 tests untouched. `tick.test.ts` line 79 compares the input state with a frozen copy, which still holds if the tick does not mutate its input.
- Do not touch `src/sim/tuning.ts` in this ticket. The aim line and reticle sizes may stay as renderer constants, the same way `POST_RADIUS` is today. This keeps the ticket out of ordering conflicts with the tuning-editing tickets of the spec.
- Shoot control, the power bar, phases and the shot direction are later tickets of spec #10.

## Round 1

### Build

**STATUS:** READY

#### Evidence

- C1: src/sim/aim.test.ts::`starts aiming at the goal centre for any seed` — initialState aim equals goalCentre
- C2: src/sim/aim.test.ts::`stores a finite aim %s as it is` — inside, behind goal line and outside aims stored as-is
- C3: src/sim/aim.test.ts::`follows the aim of each tick's intent without smoothing` — last intent wins each tick
- C4: src/sim/aim.test.ts::`does not move the attacker or the ball when only the aim changes` — position and carried ball unchanged
- C5: src/sim/aim.test.ts::`falls back to the goal centre for a non-finite aim (%s)` — NaN/Infinity no throw, goal centre stored
- C6: src/sim/aim.test.ts::`emits no events and does not mutate the input state` — no events, input state intact

### Gate

**GATE:** PASS · **PROTECTED:** none

#### Summary

- checks.sh: OK
- Protected paths modified or deleted: 0
- Evidence problems: 0

### Review

**VERDICT:** PASS

#### Standards
No findings. The diff keeps colours and sizes as renderer constants, as the plan allows. It adds no smells worth noting.

#### Spec
No findings.
- C1: `initialState` copies `TUNING.goalCentre` into `aim`.
- C2, C3: `tick` stores the intent's finite aim as given, with no clamping or smoothing.
- C4: Only `aim` is added to the returned state, so the attacker and ball logic is untouched.
- C5: `aimPoint` falls back to the goal centre when a component is non-finite.
- C6: `tick` returns `events: []` and builds a new state without mutating the input.
- All six criteria have tests in `src/sim/aim.test.ts`.
- `toPitch` matches the inverse formula from the plan's Notes.
- The aim line and reticle are drawn only while the ball is held.
- `main.ts` creates the renderer before the input.
- No extra scope.

#### Architecture
No findings.
- `src/input` receives `toPitch` as a function and does not import `src/render`.
- `docs/architecture.md` is updated in the same diff for the `state`, `input` and `render` rows.

#### Security
Not applicable.

## Timeline

| Time | From | To | Reason |
| --- | --- | --- | --- |
| 2026-11-10T09:44:53+01:00 | (new) | intake | created from #12 for spec 010-m2-shooting-and-outcomes |
| 2026-11-10T09:45:05+01:00 | intake | intake | start plan |
| 2026-11-10T09:46:16+01:00 | intake | build | ACCEPT risk=medium surfaces=sim,input,render |
| 2026-11-10T09:46:20+01:00 | build | build | start build |
| 2026-11-10T09:47:21+01:00 | build | gate | READY |
| 2026-11-10T09:47:26+01:00 | gate | gate | start gate |
| 2026-11-10T09:47:38+01:00 | gate | review | GATE PASS |
| 2026-11-10T09:47:50+01:00 | review | review | start review |
| 2026-11-10T09:48:18+01:00 | review | merging | PASS |
