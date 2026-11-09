---
job: "003-the-attacker-moves-on-an-empty-pitch-wit"
kind: "ticket"
issue: 3
title: "The attacker moves on an empty pitch with the keyboard"
spec: "002-m1-walking-skeleton-the-attacker-on-the"
stage: "merging"
risk: "medium"
surfaces: ["sim", "input", "ui"]
rounds: 1
created: "2026-11-09T18:44:42+01:00"
updated: "2026-11-09T18:48:13+01:00"
---

# #3 The attacker moves on an empty pitch with the keyboard

`003-the-attacker-moves-on-an-empty-pitch-wit` · ticket · stage merging · risk medium · surfaces sim, input, ui · 1 round · spec [002-m1-walking-skeleton-the-attacker-on-the](002-m1-walking-skeleton-the-attacker-on-the.md)

## Issue

```text
### Body

Parent: #2

## What to build

The thinnest path through every layer. Opening the page shows the pitch floor and outline (a 20 m × 20 m half court in metres, drawn to fill the container width at 1:1 aspect ratio, capped by the window height, crisp at any device pixel ratio) with the attacker on it at the start position. Holding W/A/S/D or the arrow keys moves the attacker at the tuned speed; diagonals are no faster than straight lines; the attacker stops at every pitch edge (its circle never leaves the court). The header shows a one-line Spanish hint about the keys from the UI texts module.

Underneath: the tuning module with every constant M1 needs; the geometry module with the vector helpers and the rectangle clamp; the state (attacker position, tick counter, seed) with its initial state from a seed; the intent type (movement vector, aim point, shoot-held flag, and a neutral "no intent") where only movement is used; the tick function that applies movement and the rectangle clamp and returns the new state plus an (empty) event list; the keyboard input adapter (both key sets, opposite keys cancel, arrows do not scroll the page); the canvas renderer (floor, outline, attacker); and the entry point running a fixed 60 Hz accumulator over requestAnimationFrame, capped at a quarter second per frame, with the seeded generator created from the clock and passed to every tick. The simulation imports nothing from the browser (ADR 0002; the lint rules enforce it).

## Acceptance criteria

- [ ] Geometry tests cover the vector helpers and the rectangle clamp through their exported signatures.
- [ ] State tests: the initial state puts the attacker at the tuned start position.
- [ ] Tick tests: one tick with full movement right moves the attacker by speed × tick duration; a diagonal intent moves the same distance as a straight one; a movement vector longer than 1 is normalised and components are clamped to [-1, 1]; pushing against each of the four edges leaves the attacker's circle inside the pitch; a neutral intent leaves the position unchanged.
- [ ] In the browser, the attacker moves with both WASD and the arrow keys, stops at the edges, and the arrow keys do not scroll the page.
- [ ] Resizing the window resizes the pitch, keeping it square and fully visible.
- [ ] The docs/architecture.md module table matches the exported names actually built.
```

## Plan

**DECISION:** ACCEPT · **RISK:** medium · **SURFACES:** sim, input, ui

### Scope

First slice of spec #2 (M1): the attacker moves on an empty pitch with the keyboard, through every layer. No goal area, posts, free-throw line or ball yet (later tickets of the spec).

Simulation (pure, `src/sim/`, tested in Node):
- `src/sim/tuning.ts`: `TUNING` with the constants this slice needs, using the spec's values: pitch width and length (20 m × 20 m), attacker radius (0.4 m), attacker speed (6 m/s), tick duration (1/60 s), attacker start position (x = 10, y = 13). Adding the other M1 constants from the spec (goal width, goal-area and free-throw semi-axes, ball radius) is allowed but not required; nothing speculative beyond M1.
- `src/sim/geometry.ts`: `Vec2` plus pure helpers `add`, `subtract`, `scale`, `length`, `normalize`, `clampToRect` (clamp a point into an axis-aligned rectangle). Ellipse and segment helpers are out of scope for this ticket.
- `src/sim/state.ts`: `GameState` (attacker position, tick counter, seed), `Attacker`, and `initialState(seed)` placing the attacker at `TUNING`'s start position, tick 0, seed stored. Plain immutable data.
- `src/sim/intent.ts`: `Intent` (`move: Vec2`, `aim: Vec2`, `shootHeld: boolean`) and `NO_INTENT` (zero movement, neutral aim, not shooting). Only `move` is read in M1.
- `src/sim/tick.ts`: `tick(state, intent, rng): { state, events }`. Clamps each movement component to [-1, 1], normalises the vector when longer than 1, scales by speed × tick duration, adds it to the position, then clamps to the pitch rectangle inset by the attacker radius. Increments the tick counter. Returns an empty event list. Never mutates its input, never throws on any numeric intent. A `GameEvent` type may be introduced (empty union / placeholder) only as needed to type the list.

Adapters (checked by hand):
- `src/ui/texts.ts`: Spanish texts, including the title and the hint "Muévete con WASD o las flechas".
- `src/input/`: keyboard adapter listening on `window` for `keydown`/`keyup`, W/A/S/D and arrow keys at once, opposite keys cancel, `preventDefault` on arrow keys, exposes `current(): Intent`. No mouse.
- `src/render/`: canvas renderer sizing the canvas to the container width at 1:1, capped by the window height, re-sizing on window resize, using `devicePixelRatio`; draws floor, outline and attacker (filled circle with thin outline) from the state, converting metres to pixels. Colours as renderer constants. `draw(state, events, alpha)` ignores `alpha`.
- `src/main.ts`: header shows title and hint from `texts`; fixed 60 Hz accumulator over `requestAnimationFrame`, frame delta capped at 0.25 s, `createRng(Date.now())` passed to every tick, renders once per frame. No game logic.
- `docs/architecture.md`: update the module table rows for geometry, tuning, state, intent, tick, input, render and ui so they match the exported names actually built (e.g. `subtract`, `Intent` without `restart` until M2, `createInput` signature taking no canvas if keyboard-only on window).

Out of scope: goal area and its push-out, ball, pitch module markings, mouse, aiming, shooting, AI, audio, overlays, interpolation.

### Acceptance criteria

- C1: `add`, `subtract` and `scale` return the expected component-wise results for sample vectors.
- C2: `length` returns the Euclidean length (e.g. 5 for (3, 4), 0 for the zero vector).
- C3: `normalize` returns a unit-length vector in the same direction for a non-zero vector, and returns the zero vector (no NaN) for the zero vector.
- C4: `clampToRect` leaves a point inside the rectangle unchanged, and moves a point outside on each side (and beyond a corner) onto the nearest point of the rectangle.
- C5: `initialState(seed)` places the attacker at `TUNING`'s start position (10, 13), with tick counter 0 and the given seed stored.
- C6: `NO_INTENT` has a zero movement vector and `shootHeld` false.
- C7: one `tick` with movement (1, 0) from the initial state moves the attacker right by exactly `TUNING` speed × tick duration (0.1 m) and leaves y unchanged.
- C8: one `tick` with movement (1, 1) moves the attacker the same distance as with (1, 0), at 45°.
- C9: a movement vector with components outside [-1, 1] (e.g. (5, 0), (-3, 7)) produces a displacement no longer than speed × tick duration, and (5, 0) moves exactly as (1, 0).
- C10: pushing repeatedly (enough ticks to cross the pitch) against each of the four edges leaves the attacker's centre at distance attacker radius from that edge, i.e. its circle stays inside [0, 20] × [0, 20].
- C11: a `tick` with `NO_INTENT` leaves the attacker's position unchanged.
- C12: each `tick` increments the tick counter by 1, keeps the seed, returns an empty events list and does not mutate the input state.

### Seams

- Public simulation functions only, through their exported signatures: `src/sim/geometry` (`add`, `subtract`, `scale`, `length`, `normalize`, `clampToRect`), `src/sim/state` (`initialState`), `src/sim/intent` (`NO_INTENT`), `src/sim/tick` (`tick`), with `TUNING` for expected values and `createRng` from `src/sim/rng` to build the generator.
- New test files (existing `src/sim/rng.test.ts` is protected and must not change): `src/sim/geometry.test.ts` (C1–C4), `src/sim/state.test.ts` (C5), `src/sim/intent.test.ts` or inside `tick.test.ts` (C6), `src/sim/tick.test.ts` (C7–C12). Vitest, `describe` per exported function, behaviour-named `it`, `toBeCloseTo` for floats, Node only, importing nothing outside `src/sim`.

### Notes

- Manual browser checks from the issue (not automated, adapters have no tests by architecture): both WASD and arrows move the attacker; arrows do not scroll the page; attacker stops at edges; resizing keeps the pitch square and fully visible; header shows the Spanish hint. The reviewer verifies the `docs/architecture.md` table against the built exports.
- The architecture table currently lists `createInput(canvas, viewport)`; for a keyboard-only adapter on `window` the builder may keep or simplify the signature, but must update the table to match. Same for `GameState` (no ball yet in this slice) and `Intent` (`restart` is not part of M1).
- ADR 0002 purity is enforced by `eslint.config.js` for `src/sim/**`; `Date.now()` belongs only in `src/main.ts`. No new runtime dependencies (ADR 0001). Do not touch `factory/`, `.github/`, `.claude/`.
- Spec order: confinement in later tickets adds the goal-area push-out after the rectangle clamp; keep the clamp as a separate step in `tick` so that can be appended.

## Round 1

### Build

**STATUS:** READY

#### Evidence

- C1: src/sim/geometry.test.ts::`add sums components` — add, subtract, scale component-wise
- C2: src/sim/geometry.test.ts::`is the Euclidean length` — length of (3,4) and zero
- C3: src/sim/geometry.test.ts::`returns the zero vector for the zero vector` — normalize unit and zero cases
- C4: src/sim/geometry.test.ts::`moves a point beyond a corner onto the corner` — clampToRect inside, sides, corners
- C5: src/sim/state.test.ts::`places the attacker at the start position with tick 0 and the seed` — initial state
- C6: src/sim/tick.test.ts::`has zero movement and is not shooting` — NO_INTENT
- C7: src/sim/tick.test.ts::`moves right by speed x tick duration` — 0.1 m right, y unchanged
- C8: src/sim/tick.test.ts::`moves diagonally the same distance` — normalised diagonal
- C9: src/sim/tick.test.ts::`clamps out-of-range movement` — (5,0) equals (1,0), bounded displacement
- C10: src/sim/tick.test.ts::`keeps the attacker's circle inside the pitch against each edge` — four edges
- C11: src/sim/tick.test.ts::`leaves the position unchanged with NO_INTENT` — no movement
- C12: src/sim/tick.test.ts::`increments the tick, keeps the seed, emits no events and does not mutate` — tick bookkeeping

### Gate

**GATE:** PASS · **PROTECTED:** none

#### Summary

- checks.sh: OK
- Protected paths modified or deleted: 0
- Evidence problems: 0

### Review

**VERDICT:** PASS

#### Standards
- src/render/index.ts:21: magic number `120` (header height reserved) in the resize calculation. [non-blocking]
- src/input/index.ts: key name lists are arrays searched with `includes`/`some`; fine at this size. [non-blocking]

#### Spec
- C1-C12 are each covered: geometry.test.ts (C1-C4), state.test.ts (C5), tick.test.ts (C6-C12). The tick pipeline (clamp components, normalise, scale, add, clamp to the inset rectangle) matches the plan, and the clamp is a separate step.
- src/input/index.ts: the `blur` listener that clears held keys is not in the plan. It is a small, harmless extra that prevents stuck keys. [non-blocking]
- NaN and Infinity movement are handled without throwing, as the plan requires.

#### Architecture
- The docs/architecture.md table was updated for geometry, tuning, state, intent, tick, input, render and ui, and it matches the built exports (`Rect`, `subtract`, `createInput()` with no arguments, `Intent` without `restart`, `texts`).
- `GameEvent` is now listed under both `tick` (as a placeholder) and `rules`; the duplicate listing is a minor ambiguity to tidy when `rules` is built. [non-blocking]
- Dependencies are respected: src/sim imports only from src/sim, and the adapters import from sim. main.ts contains no game logic, and `Date.now()` is used only there.

#### Security
Not required (no `security` surface).

## Timeline

| Time | From | To | Reason |
| --- | --- | --- | --- |
| 2026-11-09T18:44:42+01:00 | (new) | intake | created from #3 for spec 002-m1-walking-skeleton-the-attacker-on-the |
| 2026-11-09T18:44:54+01:00 | intake | intake | start plan |
| 2026-11-09T18:45:47+01:00 | intake | build | ACCEPT risk=medium surfaces=sim,input,ui |
| 2026-11-09T18:45:52+01:00 | build | build | start build |
| 2026-11-09T18:47:24+01:00 | build | gate | READY |
| 2026-11-09T18:47:32+01:00 | gate | gate | start gate |
| 2026-11-09T18:47:44+01:00 | gate | review | GATE PASS |
| 2026-11-09T18:47:49+01:00 | review | review | start review |
| 2026-11-09T18:48:13+01:00 | review | merging | PASS |
