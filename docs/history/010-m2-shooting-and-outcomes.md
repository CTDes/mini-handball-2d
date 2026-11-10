---
job: "010-m2-shooting-and-outcomes"
kind: "spec"
issue: 10
title: "M2 · Shooting and outcomes"
stage: "ready"
surfaces: []
rounds: 3
created: "2026-11-10T09:44:46+01:00"
updated: "2026-11-10T12:14:28+01:00"
---

# #10 M2 · Shooting and outcomes

`010-m2-shooting-and-outcomes` · spec · stage ready · surfaces none · 3 rounds

## Tickets

- [#11 Geometry helpers for ball flight: segment sweep, reflection, point in rectangle](011-geometry-helpers-for-ball-flight-segment.md) · done · 2 rounds
- [#12 Aim with the mouse: the aim line follows the cursor](012-aim-with-the-mouse-the-aim-line-follows.md) · done · 1 rounds
- [#13 Charge and release: the power bar, the shot, ball flight and out](013-charge-and-release-the-power-bar-the-sho.md) · done · 1 rounds
- [#14 Posts rebound the ball and goals count when it fully crosses the line](014-posts-rebound-the-ball-and-goals-count-w.md) · done · 2 rounds
- [#15 Scoreboard with goals, shots and effectiveness, and the restart button](015-scoreboard-with-goals-shots-and-effectiv.md) · done · 1 rounds

## Issue

```text
### Body

## Problem Statement

The attacker can move around the pitch but cannot do the one thing the game is about: shoot. There is no aiming, no power, no ball flight, no goal, and the scoreboard the design document promises does not exist. Without the shot and its outcomes nothing in the game can be scored, and the goalkeeper and defender of M3 would have nothing to react to.

## Solution

The core loop of a play: aim with the mouse, hold the shoot control to run the power bar, release to shoot, watch the ball fly, rebound off a post or cross the goal line or leave the pitch, see the scoreboard count the shot and the goal, and get the ball back to play again. No goalkeeper or defender yet, so every well-aimed shot scores; that is M3's job. No overlays, particles or sound; that is M4.

## User Stories

1. As a player, I want a dashed aim line from the attacker to my cursor with a reticle at the end, so that I know where the shot will go.
2. As a player, I want the aim line to follow the mouse wherever it is over the pitch, so that aiming feels direct.
3. As a player, I want to hold the left mouse button or the space bar to start charging a shot, so that I can control its power.
4. As a player, I want a power bar that sweeps from 0 % to 100 % and back while I hold, so that timing the release is the skill.
5. As a player, I want the ball to leave at a speed proportional to the power I released at, so that a weak release is a soft shot and a full one is a rocket.
6. As a player, I want to keep moving while I charge, so that I can shoot on the run.
7. As a player, I want the ball to fly in a straight line along the aim line, so that the result is predictable.
8. As a player, I want the ball to bounce elastically off the posts and stay live, so that near misses are dramatic.
9. As a player, I want a goal to count only when the ball has fully crossed the goal line between the posts, so that the rule is fair.
10. As a player, I want a ball that leaves the pitch anywhere else to count as out, so that wild shots are punished.
11. As a player, I want the ball to come back to me shortly after every outcome, so that I can keep playing without clicking anything.
12. As a player, I want the scoreboard to show goals, shots and effectiveness for this session, so that I can try to improve.
13. As a player, I want a restart button that resets the scoreboard and the play, so that I can start fresh.
14. As a player, I want to be unable to shoot while the ball is in flight or being returned, so that the state is never confusing.
15. As a player, I want the ball to never tunnel through a post even at full power, so that physics feels solid.
16. As a player, I want a shot with no mouse movement yet to go towards the goal centre, so that a keyboard-only start still works.
17. As a developer, I want the outcomes to be emitted as events from the tick, so that M3 and M4 can react (saves, overlays, sounds) without changing the rules.
18. As a developer, I want the swept collision helpers in the geometry module and tested, so that M3's body collisions reuse them.
19. As a developer, I want every speed, rate and duration of the shot in the tuning module, so that the feel can be adjusted without touching rules.
20. As a developer, I want the tests of M1 to keep passing untouched, so that the factory's protected paths never block a ticket.

## Implementation Decisions

- **Phases of a play.** The state gains a play phase: `held` (ball with the attacker, aiming), `charging` (shoot control held, power bar running, attacker may still move), `flight` (ball in the air after release), `resolved` (an outcome happened; a pause of a tuned number of ticks, then the ball returns to the attacker and the phase is `held` again). The M1 ball-carry rule (ball at the carry distance in front of the attacker, towards the goal centre) is unchanged while the ball is held or charging; its tests are protected and must keep passing.
- **Aim.** The intent's aim point is in pitch metres. The input adapter converts mouse positions on the canvas to pitch metres through a mapping the renderer exposes (the renderer owns the logical-to-screen scaling). Until the mouse has moved over the canvas, the aim is the goal centre. The shot direction is the unit vector from the attacker's centre to the aim point; if they coincide, the direction is towards the goal centre.
- **Shoot control.** Holding the left mouse button over the canvas or the space bar sets the intent's shoot-held flag; releasing clears it. Space must not scroll the page. A press while the ball is not held is ignored.
- **Power bar.** On the first tick with shoot-held while `held`, the phase becomes `charging` and the power starts at 0. Each tick the power moves along a triangle wave between 0 and 1 at a tuned rate (a full 0 → 1 → 0 sweep in a tuned duration, around 1.2 s). On the first tick without shoot-held while `charging`, the shot is released at the current power. The power is part of the state so the renderer can draw it.
- **The shot.** Release moves the ball from the attacker to the carry position along the shot direction and gives it a velocity of (minimum shot speed + power × (maximum shot speed − minimum shot speed)) along that direction; both speeds are tuning. A shot event is emitted and the stats count a shot. The phase becomes `flight`.
- **Ball flight.** Constant velocity, integrated per tick, no drag in M2 (drag, if ever, is a tuning decision later). Each tick the ball's movement is a segment from the old to the new position; collisions are tested on that segment (swept), never only on the end position, so no tunnelling at any speed in tuning.
- **Posts.** Each post is a circle of a tuned radius at the ends of the goal line. A swept test of the ball's segment against the post circle grown by the ball radius finds the first contact; the velocity is reflected about the contact normal (elastic, speed preserved), the ball continues along the remaining fraction of the tick from the contact point, and a post-hit event is emitted. The ball stays live.
- **Goal.** After post handling, if the ball's centre has crossed the goal line (y below zero) with its x strictly between the inner faces of the posts, the ball is in the goal mouth; the goal outcome fires when the ball is fully across, that is, its centre is at least one ball radius beyond the goal line. The ball keeps moving until then and stops at the outcome.
- **Out.** If the ball's centre leaves the pitch rectangle anywhere else (left, right, bottom, or the top edge outside the goal mouth), the out outcome fires.
- **Outcomes and events.** The tick's event list carries: `shot`, `post-hit`, `goal`, `out`, `play-reset`, each as a plain object with a type and the data M4 will need (position, power). On an outcome the phase becomes `resolved` with a countdown of tuned ticks; when it reaches zero the ball returns to the carry position, a play-reset event is emitted, and the phase is `held`.
- **Stats.** The state gains goals and shots; effectiveness is derived (goals / shots, 0 when no shots) by a stats function, not stored. A shot is counted on release; a goal on the goal outcome.
- **Restart.** The intent gains a restart flag. A tick with restart true returns the initial state with the same seed and the current tick counter, keeping nothing else. The UI adapter exposes a restart button that raises the flag for one tick through the input adapter.
- **Renderer.** Draws, in addition to M1: the aim line (dashed, from the attacker to the aim point, with a small reticle at the aim point) while the ball is held or charging; the power bar (a horizontal bar above the attacker, filled proportionally to the power) while charging; the ball at its flight position while in flight or resolved. Colours stay in the renderer.
- **UI adapter.** A scoreboard in the header: goals, shots and effectiveness as a rounded percentage, with Spanish labels from the texts module; the restart button in the footer, labelled in Spanish. The adapter updates from the state each frame and reads events only to know when to re-render; it holds no rule.
- **Geometry.** New helpers: segment–circle sweep (first contact parameter and normal), reflection of a vector about a normal, a point-in-rectangle test. All exported and tested on their own.
- **Tuning additions.** Post radius, minimum and maximum shot speed, power sweep duration, resolved pause duration, aim line and power bar sizes if the renderer needs them in metres.
- **Entry point.** Wires the renderer's mapping into the input adapter and the UI's restart into the input; otherwise unchanged. No new runtime dependencies (ADR 0001); the simulation stays pure (ADR 0002); the ball has no height (ADR 0003).

## Testing Decisions

- A good test drives the exported `tick` with a sequence of intents from a known state and asserts positions, phases, stats and emitted events; it never inspects internals. Floats use `toBeCloseTo`.
- Geometry: segment–circle sweep (miss, hit from outside with the right contact fraction and normal, segment starting inside, tangent), reflection (angle of incidence equals angle of reflection, speed preserved), point-in-rectangle (inside, outside, on the edge).
- Tick: charging starts on shoot-held and the power follows the triangle wave (0 at start, 1 at half the sweep, 0 again at the full sweep); release at a known power gives a ball speed equal to the tuned formula and a shot event; the ball travels in a straight line at constant speed; a ball aimed at a post rebounds with the same speed and a mirrored velocity and emits post-hit, without ever overlapping the post; a ball aimed between the posts emits goal exactly when its centre is one radius beyond the goal line and not before; a ball aimed at a side edge, the bottom edge or the top edge outside the goal emits out; after an outcome the phase is resolved for the tuned pause and then play-reset returns the ball to the carry position; shoot-held during flight or resolved does nothing; restart returns the initial state with the seed kept; stats count shots and goals and effectiveness is goals over shots.
- Only the simulation has automated tests; input, renderer, UI and entry point are checked by hand. Prior art: the M1 tests under `src/sim/` (behaviour-named `it`, helper to build intents, `TUNING` used for expected numbers).
- M1's tests are protected and must not be modified: every new behaviour is tested in new files or new `describe` blocks in new files.

## Out of Scope

- Goalkeeper, defender, saves and blocks (M3).
- Overlays, particles, sound, mute (M4).
- Spin, drag or friction on the ball, ball height, crossbar.
- Touch input, gamepad, mobile layout.
- Interpolated rendering between ticks.
- Persisting the stats.

## Further Notes

- This spec builds milestone **M2** of `docs/roadmap.md`. Vocabulary from `GLOSSARY.md`: aim line, power bar, shot, play, outcome, goal, out, post hit, scoreboard, effectiveness, intent, tick, event, tuning.
- Lesson from M1 applied: tickets that edit the tuning module or the architecture table are ordered, not parallel, except where they touch disjoint parts (the geometry prefactor touches neither).
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

- src/sim/shot.test.ts:665 — `expect(before).toEqual(structuredClone(before))` compares a clone with a clone of itself, so it can never fail. The purity check that does something is the final `frozen` comparison. [non-blocking]
- src/render/index.ts:140 — `RETICLE_RADIUS = 0.25` is a size in metres, and the dash lengths (0.3 / 0.2 m) at lines 177 are also hard-coded in the renderer. The issue asks for aim line sizes in metres to live in tuning ("Tuning additions"). The power bar sizes were moved to tuning; these were not. [non-blocking]
- src/sim/tick.ts:750 — `pitchRect` is rebuilt from `TUNING.pitchWidth/pitchLength` even though `PITCH` already holds the pitch dimensions. This is mild Duplicated Code. [non-blocking]
- src/sim/geometry-sweep.test.ts:478 — a test that string-matches `docs/architecture.md` sits in the geometry test file. It is a documentation check mixed into a behaviour suite (Divergent Change), and it does not follow the "one describe per exported function or rule" convention. [non-blocking]
- src/sim/tuning.ts:880 — the comment says "Seconds the out ball rests". The pause applies to every outcome, not only out. [non-blocking]

#### Spec

The branch covers aim, the power bar, release, straight flight, out, the resolved pause and play-reset. Several criteria in the issue are not built:

- src/sim/tick.ts:838-855 — **Posts** (US 8, US 15, "Posts"): there are no post circles, no swept post test, no reflection and no `post-hit` event. A shot aimed at a post currently passes straight through it. `sweepSegmentCircle`/`reflect` exist but `tick` never uses them. [blocking]
- src/sim/tick.ts:840-854 — **Goal** (US 9, "Goal"): there is no goal outcome. A ball aimed between the posts fires `out` on the first tick its centre goes below y = 0. The issue requires the ball to keep moving and score `goal` once its centre is one ball radius beyond the goal line. As a result, every well-aimed shot currently counts as out instead of scoring. [blocking]
- src/sim/state.ts:689-704 — **Stats** (US 12, "Stats"): `GameState` has no `goals` or `shots`, and no stats function derives effectiveness. Release does not count a shot. [blocking]
- src/sim/intent.ts / src/sim/tick.ts — **Restart** (US 13, "Restart"): there is no `restart` flag on `Intent`, and `tick` has no path that returns the initial state with the seed and tick counter kept. [blocking]
- src/ui, src/main.ts — **UI adapter / Entry point** (US 12, US 13): there is no scoreboard in the header (goals, shots, rounded effectiveness, Spanish labels in `texts`), no restart button in the footer, and `main.ts` does not wire a restart into the input. [blocking]
- src/sim/tuning.ts — **Tuning additions**: post radius is missing. [blocking]
- src/sim/tick.ts:740-748 — **Outcomes and events** (US 17): `GameEvent` lacks `post-hit` and `goal`. [blocking]
- Testing Decisions: there are no tests for post rebound without overlap, goal timing exactly at one radius beyond the line, restart keeping the seed, or stats/effectiveness. [blocking]
- src/input/index.ts:78-84 — "A press while the ball is not held is ignored": the adapter reports `shootHeld` for as long as the button stays down. If the player is still holding the button when play-reset happens, charging starts on the first `held` tick without a fresh press. That arguably contradicts the press-ignored rule. [non-blocking]

M1 protected tests are untouched (all new tests are in new files), which meets US 20.

#### Architecture

- docs/architecture.md:32 — the `GameState` row still says "(AI and stats arrive later)". That must change when stats land in M2 (see Spec). Right now the row matches the code. [non-blocking]

Otherwise no findings. The simulation stays pure: no DOM, timers or `Math.random` in `src/sim/`. Adapters depend on the sim, not the reverse. Every changed public interface (`geometry` exports, `GameState`, `PlayPhase`, `Ball.velocity`, `GameEvent`, `createInput(canvas, toPitch)`, `renderer.toPitch`, `TUNING` additions) is reflected in the architecture table in the same diff.

## Round 2

### Build

**STATUS:** READY

#### Evidence

- C1: src/sim/aim.test.ts::`follows the aim of each tick's intent without smoothing` — Aim (US 1, 2): the aim is the intent's pitch-metre point each tick; starts at the goal centre
- C2: src/sim/shot.test.ts::`sweeps the power as a triangle wave over the tuned duration` — Power bar (US 3, 4): charging starts at 0 and follows the 0 -> 1 -> 0 triangle wave
- C3: src/sim/fresh-press.test.ts::`does not start charging after play-reset until the control is released and pressed again` — Shoot control (US 14): a press while the ball is not held is ignored, also when it is still down at play-reset
- C4: src/sim/shot.test.ts::`shoots along the aim at the speed of the current power` — The shot (US 5): release speed follows the tuned formula, a shot event fires, phase is flight
- C5: src/sim/shot.test.ts::`points towards the goal centre when the aim is on the attacker` — Aim fallback (US 16): coincident aim shoots towards the goal centre
- C6: src/sim/flight.test.ts::`advances the ball by velocity x tick duration in a straight line` — Ball flight (US 7): constant velocity, straight line
- C7: src/sim/posts-goal.test.ts::`reverses a ball aimed at a post centre, keeping speed` — Posts (US 8): elastic rebound, mirrored velocity, post-hit event
- C8: src/sim/posts-goal.test.ts::`never lets the ball closer than post plus ball radius, at max speed` — No tunnelling (US 15): the swept test keeps the ball out of the post at full power
- C9: src/sim/posts-goal.test.ts::`fires on the first tick the centre reaches y <= -ballRadius, never out` — Goal (US 9): goal exactly when the centre is one radius beyond the line
- C10: src/sim/flight.test.ts::`waits the tuned pause and then resets the play once` — Out and resolved (US 10, 11, 17): out outcome, tuned pause, play-reset back to the carry position
- C11: src/sim/shot.test.ts::`is ignored in flight and resolved` — US 14: shoot-held during flight or resolved changes nothing
- C12: src/sim/geometry-sweep.test.ts::`returns the first-contact fraction for an axis-aligned entry` — Geometry (US 18): segment-circle sweep, reflect and insideRect exported and tested
- C13: src/sim/restart.test.ts::`returns the initial state with the same seed and an advanced tick` — Restart (US 13): initial state, seed kept, tick counter advanced
- C14: src/sim/scoreboard.test.ts::`counts a goal on the goal tick, leaving shots alone` — Stats (US 12): shots on release, goals on goal
- C15: src/sim/stats.test.ts::`is goals over shots` — Effectiveness derived by a stats function, 0 with no shots
- C16: src/sim/shot.test.ts::`never mutates its input through a full cycle` — Purity (ADR 0002): tick never mutates its input state (now a real check, not a clone compared with itself)

#### Review round 1

Already satisfied by the merged tickets #14 and #15 (worktree was behind when reviewed): posts with
swept test, reflection and `post-hit`; goal outcome one ball radius beyond the line; `goals` and
`shots` in `GameState` with `effectiveness` in `src/sim/stats.ts`; `restart` on `Intent` and in
`tick`; scoreboard in the header and restart button in the footer (`src/ui`), wired in
`src/main.ts`; `postRadius` in tuning; `post-hit` and `goal` in `GameEvent`; the tests for rebound,
goal timing, restart and stats; architecture `GameState` row lists `goals` and `shots`.

Fixed in this round (non-blocking findings):
- Fresh press: `GameState.shootArmed` (documented in `docs/architecture.md`); after a release,
  charging needs a held tick without the shoot control first (C3).
- `src/sim/shot.test.ts` purity check now compares the input with its pre-tick clone.
- Aim reticle radius and dash pattern moved to `TUNING` (`aimReticleRadius`, `aimDash`, `aimGap`).
- `pitchRect` in `tick.ts` built from `PITCH.width/length`.
- Architecture-doc check moved out of the geometry suite into `src/sim/architecture-doc.test.ts`.
- `resolvedPause` comment now says it applies to every outcome.

Unit tests M1 untouched; `factory/checks.sh` green.

### Gate

**GATE:** PASS · **PROTECTED:** none

#### Summary

- checks.sh: OK
- Protected paths modified or deleted: 0
- Evidence problems: 0

### Review

**VERDICT:** CHANGES

#### Standards

- src/sim/intent.ts:3: the doc comment ends with a stray double space (`tick.  `), left over from removing "Only `move` is read in M1." Cosmetic. [non-blocking]
- src/ui/texts.ts:4 / src/main.ts:133-143: `texts.hint` ("Muévete con WASD o las flechas") is no longer rendered anywhere now that `createUi` replaces the header contents, so it is dead text. Either show it (e.g. under the title or in the footer) or remove it. [non-blocking]
- src/sim/tick.ts:1255-1385: `tick` is now one long function with a per-phase switch (Divergent Change baseline smell). Readable today, but M3 will add goalkeeper/defender contacts to the `flight` branch; extracting `flightStep` / `releaseShot` helpers would keep it manageable. Judgement only. [non-blocking]

#### Spec

- Every criterion of issue #10 is met: phases held/charging/flight/resolved with M1 carry rule unchanged (M1 tests untouched); aim in pitch metres with goal-centre default in the input adapter and goal-centre fallback for a coincident aim (src/sim/tick.ts:1307-1310); triangle-wave power over `powerSweepDuration`; release speed `min + power × (max − min)` and `shot` event; constant-velocity swept flight with post reflection over the remaining fraction of the tick and a contact cap; goal when the centre is one ball radius beyond the line strictly between the posts' inner faces; out elsewhere; resolved pause then `play-reset`; `goals`/`shots` in state with derived `effectiveness`; restart flag; renderer aim line, reticle and power bar; Spanish scoreboard and restart button; geometry helpers exported and tested; all feel numbers in `TUNING`. No findings that block.
- src/sim/tick.ts:1257: the plan says restart returns the initial state "with the same seed and the current tick counter"; the code returns `state.tick + 1`. Advancing the counter like every other tick is a reasonable reading and is documented in `docs/architecture.md`. [non-blocking]
- src/sim/state.ts:1105 (`shootArmed`): not named in the plan, but it implements "A press while the ball is not held is ignored" for a control still held through play-reset; documented in the architecture table. Accepted as part of the criterion, not extra scope. [non-blocking]
- src/sim/architecture-doc.test.ts: a test asserting the contents of `docs/architecture.md` was not asked for by the plan (Testing Decisions list only simulation behaviour). It is extra scope, and it also breaks a documented rule (see Architecture). [blocking, together with the Architecture finding]

#### Architecture

- src/sim/architecture-doc.test.ts:2: `import architecture from "../../docs/architecture.md?raw";` breaks the rule in `docs/architecture.md` "Allowed dependencies": "Tests (`src/**/*.test.ts`) exist only for `src/sim/*` and import nothing outside it." This test imports a file outside `src/sim/`. It also tests documentation, not simulation behaviour. Remove the file. Keeping the architecture table up to date is the reviewer's job, as the doc itself says. [blocking]
- docs/architecture.md:26: the `src/sim/rules` row (not built yet) still lists `GameEvent`, which now lives in and is exported from `src/sim/tick` (row 25). Two rows now claim the same type. Drop it from the rules row or note that it moved. [non-blocking]
- Otherwise the public interface changes (geometry helpers, `GameState`/`Ball`/`PlayPhase`, `Intent.restart`, `GameEvent`, `Stats` functions, `createInput(canvas, toPitch)`, `renderer.toPitch`, `createUi`) are all reflected in the table in the same diff. Adapters import only `src/sim/*` and not each other. `src/sim` stays pure, with no DOM, timers or `Math.random`. No runtime dependency was added.

## Round 3

### Build

**STATUS:** READY

#### Evidence

- C1: src/sim/aim.test.ts::`follows the aim of each tick's intent without smoothing` — Aim (US 1, 2): the aim is the intent's pitch-metre point each tick; starts at the goal centre
- C2: src/sim/shot.test.ts::`sweeps the power as a triangle wave over the tuned duration` — Power bar (US 3, 4): charging starts at 0 and follows the 0 -> 1 -> 0 triangle wave
- C3: src/sim/fresh-press.test.ts::`does not start charging after play-reset until the control is released and pressed again` — Shoot control (US 14): a press while the ball is not held is ignored, also when it is still down at play-reset
- C4: src/sim/shot.test.ts::`shoots along the aim at the speed of the current power` — The shot (US 5): release speed follows the tuned formula, a shot event fires, phase is flight
- C5: src/sim/shot.test.ts::`points towards the goal centre when the aim is on the attacker` — Aim fallback (US 16): coincident aim shoots towards the goal centre
- C6: src/sim/flight.test.ts::`advances the ball by velocity x tick duration in a straight line` — Ball flight (US 7): constant velocity, straight line
- C7: src/sim/posts-goal.test.ts::`reverses a ball aimed at a post centre, keeping speed` — Posts (US 8): elastic rebound, mirrored velocity, post-hit event
- C8: src/sim/posts-goal.test.ts::`never lets the ball closer than post plus ball radius, at max speed` — No tunnelling (US 15): the swept test keeps the ball out of the post at full power
- C9: src/sim/posts-goal.test.ts::`fires on the first tick the centre reaches y <= -ballRadius, never out` — Goal (US 9): goal exactly when the centre is one radius beyond the line
- C10: src/sim/flight.test.ts::`waits the tuned pause and then resets the play once` — Out and resolved (US 10, 11, 17): out outcome, tuned pause, play-reset back to the carry position
- C11: src/sim/shot.test.ts::`is ignored in flight and resolved` — US 14: shoot-held during flight or resolved changes nothing
- C12: src/sim/geometry-sweep.test.ts::`returns the first-contact fraction for an axis-aligned entry` — Geometry (US 18): segment-circle sweep, reflect and insideRect exported and tested
- C13: src/sim/restart.test.ts::`returns the initial state with the same seed and an advanced tick` — Restart (US 13): initial state, seed kept, tick counter advanced
- C14: src/sim/scoreboard.test.ts::`counts a goal on the goal tick, leaving shots alone` — Stats (US 12): shots on release, goals on goal
- C15: src/sim/stats.test.ts::`is goals over shots` — Effectiveness derived by a stats function, 0 with no shots
- C16: src/sim/shot.test.ts::`never mutates its input through a full cycle` — Purity (ADR 0002): tick never mutates its input state (now a real check, not a clone compared with itself)

#### Review round 1

Already satisfied by the merged tickets #14 and #15 (worktree was behind when reviewed): posts with
swept test, reflection and `post-hit`; goal outcome one ball radius beyond the line; `goals` and
`shots` in `GameState` with `effectiveness` in `src/sim/stats.ts`; `restart` on `Intent` and in
`tick`; scoreboard in the header and restart button in the footer (`src/ui`), wired in
`src/main.ts`; `postRadius` in tuning; `post-hit` and `goal` in `GameEvent`; the tests for rebound,
goal timing, restart and stats; architecture `GameState` row lists `goals` and `shots`.

Fixed in this round (non-blocking findings):
- Fresh press: `GameState.shootArmed` (documented in `docs/architecture.md`); after a release,
  charging needs a held tick without the shoot control first (C3).
- `src/sim/shot.test.ts` purity check now compares the input with its pre-tick clone.
- Aim reticle radius and dash pattern moved to `TUNING` (`aimReticleRadius`, `aimDash`, `aimGap`).
- `pitchRect` in `tick.ts` built from `PITCH.width/length`.
- Architecture-doc check removed from the geometry suite (see round 2).
- `resolvedPause` comment now says it applies to every outcome.

#### Review round 2

- Blocking: `src/sim/architecture-doc.test.ts` removed (it imported `docs/architecture.md`
  from outside `src/sim/` and tested documentation, not behaviour).
- `docs/architecture.md`: the `src/sim/rules` row no longer claims `GameEvent`; it notes the type
  lives in `src/sim/tick`.
- `src/sim/intent.ts`: stray double space removed.
- `texts.hint` is shown again, under the restart button in the footer, and now also mentions the
  aim and shoot controls.
- `tick` split: `releaseShot` and `flightStep` helpers in `src/sim/tick.ts` (internal, same
  behaviour, all tests green).
- Left as is (accepted by the reviewer): restart advances the tick counter like any tick, as
  documented in `docs/architecture.md`; `shootArmed` implements the press-ignored rule.

M1 tests untouched; `factory/checks.sh` green.

### Gate

**GATE:** PASS · **PROTECTED:** none

#### Summary

- checks.sh: OK
- Protected paths modified or deleted: 0
- Evidence problems: 0

### Review

**VERDICT:** PASS

#### Standards

- src/sim/tick.ts:71-147: `releaseShot(state, base, position)` and `flightStep(state, base)` both take the previous state and the movement-updated `base` and pick fields from each (`state.power`, `recordShot(state)`, `recordGoal(state)` against `...base`). It works because stats and power are not changed by movement, but it is easy to read the wrong one. A future cleanup could pass only `base`. Judgement only. [non-blocking]
- The round-2 findings are fixed: the stray double space in src/sim/intent.ts:3 is gone, `texts.hint` is shown again in the footer (src/ui/index.ts:30-33) and now covers aiming and shooting, and `tick` is split into the `releaseShot` and `flightStep` helpers with the same behaviour.

#### Spec

- Every criterion of issue #10 is still met (see round 2). The refactor in 97eec7d does not change behaviour. No extra scope remains now that src/sim/architecture-doc.test.ts is removed.
- The two non-blocking readings from round 2 are unchanged and still accepted: restart advances the tick counter (src/sim/tick.ts, documented in docs/architecture.md), and `shootArmed` implements "a press while the ball is not held is ignored". [non-blocking]

#### Architecture

- The blocking finding from round 2 is fixed: src/sim/architecture-doc.test.ts, which imported `docs/architecture.md` from outside `src/sim/`, has been removed.
- docs/architecture.md:26: the `src/sim/rules` row no longer claims `GameEvent` and notes that it lives in `src/sim/tick`. The public interface changes are all reflected in the table. `src/sim` stays pure, adapters depend only on `src/sim/*`, and no runtime dependency was added. No findings.

## Timeline

| Time | From | To | Reason |
| --- | --- | --- | --- |
| 2026-11-10T09:44:52+01:00 | (new) | building | spec created from #10 with 5 tickets |
| 2026-11-10T12:05:36+01:00 | building | final-review | all 5 tickets done |
| 2026-11-10T12:05:43+01:00 | final-review | final-review | start final-gate |
| 2026-11-10T12:05:55+01:00 | final-review | final-review | final gate PASS round 1 |
| 2026-11-10T12:06:16+01:00 | final-review | final-review | start final-review |
| 2026-11-10T12:07:15+01:00 | final-review | final-build | FINAL CHANGES round 1 |
| 2026-11-10T12:08:08+01:00 | final-build | final-build | start final-build |
| 2026-11-10T12:10:37+01:00 | final-build | final-review | READY |
| 2026-11-10T12:10:42+01:00 | final-review | final-review | start final-gate |
| 2026-11-10T12:10:54+01:00 | final-review | final-review | final gate PASS round 2 |
| 2026-11-10T12:10:58+01:00 | final-review | final-review | start final-review |
| 2026-11-10T12:12:01+01:00 | final-review | final-build | FINAL CHANGES round 2 |
| 2026-11-10T12:12:01+01:00 | final-build | final-build | start final-build |
| 2026-11-10T12:13:14+01:00 | final-build | final-review | READY |
| 2026-11-10T12:13:23+01:00 | final-review | final-review | start final-gate |
| 2026-11-10T12:13:35+01:00 | final-review | final-review | final gate PASS round 3 |
| 2026-11-10T12:13:50+01:00 | final-review | final-review | start final-review |
| 2026-11-10T12:14:28+01:00 | final-review | ready | FINAL PASS |
