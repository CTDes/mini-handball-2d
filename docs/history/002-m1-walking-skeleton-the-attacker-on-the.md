---
job: "002-m1-walking-skeleton-the-attacker-on-the"
kind: "spec"
issue: 2
title: "M1 · Walking skeleton: the attacker on the pitch"
stage: "ready"
surfaces: []
rounds: 2
created: "2026-11-09T18:44:35+01:00"
updated: "2026-11-10T09:06:04+01:00"
---

# #2 M1 · Walking skeleton: the attacker on the pitch

`002-m1-walking-skeleton-the-attacker-on-the` · spec · stage ready · surfaces none · 2 rounds

## Tickets

- [#3 The attacker moves on an empty pitch with the keyboard](003-the-attacker-moves-on-an-empty-pitch-wit.md) · done · 2 rounds
- [#4 Pitch markings: goal, posts, goal area and free-throw line](004-pitch-markings-goal-posts-goal-area-and.md) · done · 2 rounds
- [#5 The ball follows the attacker](005-the-ball-follows-the-attacker.md) · done · 1 rounds
- [#6 The goal area keeps the attacker out](006-the-goal-area-keeps-the-attacker-out.md) · done · 1 rounds

## Issue

```text
### Body

## Problem Statement

There is no game yet: the published page shows a title and an empty canvas. Nothing proves that the architecture in `docs/architecture.md` (a pure simulation advanced in fixed ticks, with input and rendering as adapters around it) actually works end to end in the browser, and the one piece of non-trivial geometry in the design, keeping the attacker out of the elliptical goal area without jitter, has not been built.

## Solution

The thinnest playable slice: the pitch is drawn, the attacker is on it holding the ball, and the player moves it with the keyboard. The attacker stops at the pitch edges and slides around the goal area without ever entering it. The ball follows the attacker. Nothing else: no aiming, no shooting, no goalkeeper, no defender, no scoreboard (those are M2 to M4 in `docs/roadmap.md`).

## User Stories

1. As a player, I want to open the page and see a handball half-court with its goal, posts, goal area and free-throw line, so that I recognise the game at a glance.
2. As a player, I want to see the attacker on the pitch holding the ball, so that I know what I control.
3. As a player, I want to move the attacker with WASD or the arrow keys, so that I can position myself for a shot (in later milestones).
4. As a player, I want diagonal movement to be as fast as straight movement, so that the controls feel fair.
5. As a player, I want the attacker to stop at the pitch edges, so that I never leave the court.
6. As a player, I want the attacker to be unable to enter the goal area, so that the handball rule holds.
7. As a player, I want the attacker to slide smoothly along the edge of the goal area when I push into it, so that the boundary feels solid, not sticky or jittery.
8. As a player, I want the ball to follow the attacker, so that it is clear the attacker holds it.
9. As a player, I want the pitch to fill the available width of the window and keep its proportions when I resize, so that it looks right on any desktop screen.
10. As a player, I want the movement to feel the same at any frame rate, so that the game is fair on fast and slow machines.
11. As a player, I want the page to work with no network after it loads, so that it is a single self-contained file.
12. As a developer, I want the simulation to be pure and tested in Node, so that every rule in later milestones can be tested the same way.
13. As a developer, I want every number that shapes the feel (speed, sizes, pitch dimensions) in one tuning module, so that later milestones retune without touching rules.
14. As a developer, I want the seeded random generator wired into the loop even though M1 does not use it, so that M3's AI can draw randomness from the simulation without a new seam.

## Implementation Decisions

- **Units.** The simulation works in metres, origin at the top-left corner of the pitch, x to the right, y downwards. The pitch is the half court: 20 m wide and 20 m long. The goal is on the top edge (y = 0), centred at x = 10, 3 m wide (posts at x = 8.5 and x = 11.5). The renderer converts metres to pixels; nothing in the simulation knows about pixels.
- **Pitch markings.** The goal area is an ellipse centred on the goal's centre with horizontal semi-axis 7.5 m and vertical semi-axis 6 m, so its edge is 6 m in front of the goal line and 6 m beside each post. The free-throw line is an ellipse with the same centre and semi-axes 10.5 m and 9 m, drawn dashed. The danger zone is defined in the pitch module (a band 4 m deep in front of the goal line, as wide as the goal area) but not used in M1. All of these derive from the tuning module.
- **Tuning.** One tuning module exports every constant: pitch size, goal width, goal area and free-throw semi-axes, attacker radius (0.4 m), attacker speed (6 m/s), ball radius (0.15 m), ball carry distance (the ball sits in front of the attacker, towards the goal, at attacker radius plus ball radius), tick duration (1/60 s), attacker start position (x = 10, y = 13).
- **State.** The game state is a plain immutable object: the attacker (position), the ball (position and a "held" marker; in M1 it is always held), the tick counter and the seed. The initial state takes a seed. Later milestones add fields; M1 adds nothing speculative.
- **Intent.** The intent is what the human asks for in a tick: a movement vector with components in [-1, 1] (clamped), an aim point in metres and a shoot-held flag. M1 reads only the movement; aim and shoot-held exist in the type with neutral defaults so that M2 does not change the seam. A "no intent" constant is exported.
- **Tick.** One exported function advances the state by one tick from a state, an intent and the random generator, and returns the new state plus a list of events (empty in M1). Movement: the movement vector is normalised when longer than 1 (diagonals are not faster), scaled by the attacker speed and the tick duration, and added to the position. Confinement is applied after movement, in this order: clamp to the pitch rectangle inset by the attacker radius; then, if the attacker's centre lies inside the goal area ellipse grown by the attacker radius, push it radially out along the ray from the ellipse centre until it is on the grown ellipse. Radial projection is deterministic and idempotent, so pushing into the boundary slides along it without jitter and no position can tunnel through at 6 m/s and 60 Hz. The ball is then placed at the carry distance in front of the attacker, towards the goal centre.
- **Geometry module.** Pure vector helpers (add, subtract, scale, length, normalise, clamp to rectangle), the ellipse containment test and the radial push-out, each exported and tested on its own. They are the building blocks of M2's collisions too.
- **Random generator.** The existing seeded generator is created in the entry point from the clock and passed to every tick. The simulation never calls `Math.random`; the lint rules already forbid it.
- **Input adapter.** Listens to `keydown`/`keyup` on the window for W/A/S/D and the arrow keys (both sets at once), and exposes the current intent. Key presses are edge-independent: holding two opposite keys cancels. It also prevents the arrow keys from scrolling the page. Mouse handling is M2.
- **Renderer.** Owns the canvas. It sizes the canvas to the width of its container with a 1:1 aspect ratio (the pitch is square), capped by the window height, re-sizing on window resize and using the device pixel ratio for crisp lines. It draws, in order: the pitch floor, the goal area (filled a shade lighter), the free-throw ellipse (dashed), the pitch outline, the goal (a rectangle behind the goal line) and the two posts (small filled circles), the ball and the attacker (a filled circle with a thin outline). Colours are constants in the renderer, not in tuning. It takes the state and the interpolation factor; M1 ignores the factor and draws the latest state.
- **Loop.** The entry point runs a fixed-timestep accumulator over `requestAnimationFrame`: it advances the simulation by as many ticks as the elapsed time covers (capped at a quarter of a second to survive tab switches) and then renders once. It wires input, simulation and renderer; it contains no game logic.
- **Page.** The existing HTML keeps its header and canvas; the header shows the title and a one-line hint in Spanish ("Muévete con WASD o las flechas"). Player-facing texts live in the UI texts module.
- **No new runtime dependencies** (ADR 0001). No changes to the factory, CI or workflows.

## Testing Decisions

- A good test exercises an exported function through its public signature and asserts observable behaviour (positions, booleans, lengths), never internal structure. Tests use plain numbers in metres and `toBeCloseTo` for floats.
- Modules tested: geometry (vector helpers, rectangle clamp, ellipse containment, radial push-out including points exactly on the edge and at the centre), pitch (derived shapes are consistent with tuning: posts 3 m apart and centred, goal area edge 6 m from the goal line), state (initial state places the attacker at the start position holding the ball), tick (speed per tick, diagonal normalisation, movement vector clamping, stopping at every pitch edge, never entering the goal area from any approach direction, sliding along the goal area edge while pushing into it, idempotence when the intent is neutral, the ball sitting at the carry distance in front of the attacker).
- Simulation tests run in Node with no DOM. Input, renderer and loop have no automated tests; they are checked by hand in the browser.
- Prior art: `src/sim/rng.test.ts` (Vitest, `describe` per exported function, behaviour-named `it`).
- The gate runs `factory/checks.sh`: format, lint (including the purity rules for the simulation), typecheck, tests and the single-file build.

## Out of Scope

- Aiming, the aim line, the power bar, shooting, ball flight, posts rebound, outcomes, the play cycle and the scoreboard (M2).
- Goalkeeper and defender (M3).
- Overlays, particles, audio, mute, visual polish (M4).
- Touch or gamepad input, mobile layout.
- Interpolated rendering between ticks (the parameter exists; using it is a later polish).

## Further Notes

- This spec builds milestone **M1** of `docs/roadmap.md`. Vocabulary follows `GLOSSARY.md` (attacker, ball, goal area, free-throw line, danger zone, tick, intent, adapter, tuning). ADR 0002 (pure simulation) and ADR 0003 (no ball height) apply.
- `docs/architecture.md` lists the intended module interfaces; a ticket may refine names inside a module and must update that table when it does.
```

## Round 1

### Gate

**GATE:** PASS · **PROTECTED:** none

#### Summary

- checks.sh: OK
- Protected paths modified or deleted: 0
- Evidence problems: 0

### Review

**VERDICT:** CHANGES

#### Standards

- src/sim/tick.test.ts:722-724: the comment says the goal area rule keeps the attacker away from the centre of the top edge, but `tick` has no goal-area rule. The test reaches the top edge from the left edge, so it passes whether or not the rule exists. The comment describes behaviour the code does not have. [non-blocking]
- src/sim/state.ts:640 / src/sim/tuning.ts:808: `TUNING.goalCentre` repeats the centre that `pitchFrom` already derives (`PITCH.goalArea.centre`, the middle of `goalLine`). The two values can drift apart if the pitch width or goal placement is retuned (Duplicated Code). [non-blocking]
- src/render/index.ts:180: the `120` px header allowance is an unnamed magic number, while the other renderer constants are named. [non-blocking]
- src/main.ts:125-126: `Date.now()` is called twice, once for the rng and once for the state seed, so the seed stored in the state may differ from the one that seeded the generator. Read the clock once and use it for both. [non-blocking]

#### Spec

- src/sim/tick.ts:771-776: the goal-area confinement is missing. The spec ("Tick") says that after the pitch clamp, an attacker whose centre lies inside the goal-area ellipse grown by the attacker radius must be pushed radially out onto the grown ellipse. `tick` only clamps to the pitch rectangle, so the attacker can walk into the goal area. User stories 6 (cannot enter the goal area) and 7 (slides smoothly along its edge) are unmet. The ball-placement ticket (#5) mentions this as ticket #6, which has not landed on this branch. [blocking]
- src/sim/geometry.ts: the "Geometry module" decision asks for an ellipse containment test and a radial push-out, each exported and tested on its own. Neither exists. [blocking]
- src/sim/geometry.test.ts, src/sim/tick.test.ts: required tests are missing (Testing Decisions): radial push-out, including points exactly on the edge and at the centre; never entering the goal area from any direction; and sliding along the goal-area edge while pushing into it. [blocking]
- docs/architecture.md (geometry row): the table says "ellipse and segment helpers arrive later". The spec puts the ellipse helpers in M1, so the table hides the gap instead of documenting a refinement. Fix it together with the item above. [non-blocking]
- Everything else in the spec is met. That covers units, tuning, the state shape with a held ball, the intent with neutral `aim`/`shootHeld` and `NO_INTENT`, movement normalisation and clamping, the pitch clamp, ball placement, pitch markings derived from tuning, the input adapter (WASD and arrows, opposite keys cancel, arrow keys don't scroll the page), the renderer (draw order, 1:1 size capped by the window height, device pixel ratio, colours as renderer constants), the accumulator loop capped at 0.25 s, the seeded rng passed to every tick, the Spanish hint in `src/ui/texts.ts`, and no new dependencies. Two small additions, the `blur` handler that clears held keys and the NaN guard on movement components, are defensive details of the specified behaviour, not extra scope.

#### Architecture

- docs/architecture.md: the module table is updated for every refined interface: `pitchFrom`, `Ellipse`, `Pitch`, `Rect`, `subtract`, `carriedBallPosition`, `GameEvent` placeholder in `tick`, `createInput()` without arguments, the renderer without `viewport`, and `texts`. Dependencies follow the documented direction: adapters import sim, and sim imports neither DOM nor adapters. See the Spec note on the geometry row. No findings beyond that.

## Round 2

### Build

**STATUS:** READY

#### Evidence

- C1: src/sim/pitch.test.ts::`is centred on the goal line centre with its edge 6 m ahead and 6 m beside each post` — the goal area, posts and free-throw ellipse the renderer draws derive from tuning with the spec's dimensions (drawing itself checked by hand in the browser)
- C2: src/sim/state.test.ts::`places the attacker at the start position with tick 0 and the seed` — the initial state puts the attacker at the start position; src/sim/ball.test.ts::`C1: the ball is held` proves it holds the ball
- C3: src/sim/tick.test.ts::`moves right by speed x tick duration` — a movement intent (what WASD and the arrows produce) moves the attacker at the tuned speed
- C4: src/sim/tick.test.ts::`moves diagonally the same distance` — diagonal movement is normalised to the straight distance
- C5: src/sim/tick.test.ts::`keeps the attacker's circle inside the pitch against each edge` — the attacker stops at every pitch edge, inset by its radius
- C6: src/sim/goal-area.test.ts::`never lets the attacker's circle enter the goal area from any approach direction` — from 32 approach directions the attacker's centre never enters the goal area grown by its radius; src/sim/ellipse.test.ts::`moves an inside point along the ray from the centre onto the edge` covers the radial push-out
- C7: src/sim/goal-area.test.ts::`slides along the goal area edge without sticking or jitter when pushing into it` — pushing diagonally into the edge keeps the attacker on the grown ellipse and progressing monotonically along it
- C8: src/sim/ball.test.ts::`C4: the ball stays at the carry distance after moving` — the ball follows the attacker at the carry distance towards the goal
- C9: src/sim/pitch.test.ts::`recentres every shape on a new pitch width` — the markings are logical metres independent of pixels, so the renderer scales them 1:1 to any canvas size (resize checked by hand)
- C10: src/sim/tick.test.ts::`moves right by speed x tick duration` — movement is per fixed tick, independent of frame rate; the loop's accumulator is checked by hand
- C11: src/sim/rng.test.ts::`produces the same sequence for the same seed` — the simulation needs no external resource; the single-file build (`dist/index.html`, everything inlined) is verified by `factory/checks.sh`
- C12: src/sim/tick.test.ts::`increments the tick, keeps the seed, emits no events and does not mutate` — the tick is pure and runs in Node without a DOM
- C13: src/sim/pitch.test.ts::`takes goal area, free-throw and danger zone sizes from tuning` — the shapes come from the tuning module
- C14: src/sim/rng.test.ts::`produces the same sequence for the same seed` — the seeded generator is deterministic; `tick(state, intent, rng)` takes it in every tick

### Gate

**GATE:** PASS · **PROTECTED:** none

#### Summary

- checks.sh: OK
- Protected paths modified or deleted: 0
- Evidence problems: 0

### Review

**VERDICT:** PASS

#### Standards

- src/sim/ellipse.test.ts:4, src/sim/goal-area.test.ts:38, src/sim/pitch.test.ts:6 — Duplicated Code: the normalised ellipse equation is written out again in three test helpers (`onEdge`, `edgeValue`, `onEllipse`), and the private `ellipseValue` in src/sim/geometry.ts:30 is a fourth copy. Tests are meant to assert observable behaviour, so keeping a local helper is defensible. **[non-blocking]**
- src/sim/tick.ts:48-51 — the pitch rectangle is built from `TUNING.pitchWidth`/`pitchLength`, but the derived `PITCH.width`/`PITCH.length` are already imported in the same file. Both give the same numbers. Using `PITCH` would keep one source for the pitch dimensions. **[non-blocking]**

#### Spec

- All behaviours in the issue are met. These are the user stories and Implementation Decisions (units, markings, tuning, state, intent, tick order clamp then radial push-out then ball placement, geometry module, RNG wired from the clock, input adapter, renderer, accumulator loop capped at 0.25 s, Spanish hint in `src/ui/texts.ts`). The Testing Decisions are covered by tests in src/sim/*.test.ts. They include the 32-direction goal-area approach, sliding along the edge, idempotence, and push-out at the edge and at the centre.
- src/render/index.ts:231-243 — the issue lists the draw order as "the ball and the attacker", but the attacker is drawn before the ball, so the ball sits on top. This is visually reasonable and does not break any behaviour. **[non-blocking]**
- .prettierignore:8 — adds `docs/history/` to the format ignore list. The issue did not ask for this. It is a tooling accommodation for files the factory writes, not a CI, workflow or factory change, and it affects no game behaviour. **[non-blocking]**

#### Architecture

No findings. `src/sim/*` imports only `src/sim/*`, and the adapters (`input`, `render`) import only sim types and values, not each other. `main.ts` wires everything. The diff refines the public interfaces (`createInput()` on `window`, `pitchFrom`, `carriedBallPosition`, `insideEllipse`, `GameEvent` placeholder), and the module table in docs/architecture.md is updated to match in the same diff. No runtime dependencies are added.

## Timeline

| Time | From | To | Reason |
| --- | --- | --- | --- |
| 2026-11-09T18:44:42+01:00 | (new) | building | spec created from #2 with 4 tickets |
| 2026-11-10T09:00:44+01:00 | building | final-review | all 4 tickets done |
| 2026-11-10T09:01:03+01:00 | final-review | final-review | start final-gate |
| 2026-11-10T09:01:19+01:00 | final-review | final-review | final gate PASS round 1 |
| 2026-11-10T09:01:27+01:00 | final-review | final-review | start final-review |
| 2026-11-10T09:02:24+01:00 | final-review | final-build | FINAL CHANGES round 1 |
| 2026-11-10T09:02:31+01:00 | final-build | final-build | start final-build |
| 2026-11-10T09:04:58+01:00 | final-build | final-review | READY |
| 2026-11-10T09:05:08+01:00 | final-review | final-review | start final-gate |
| 2026-11-10T09:05:19+01:00 | final-review | final-review | final gate PASS round 2 |
| 2026-11-10T09:05:23+01:00 | final-review | final-review | start final-review |
| 2026-11-10T09:06:04+01:00 | final-review | ready | FINAL PASS |
