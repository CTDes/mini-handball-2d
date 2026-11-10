---
job: "015-scoreboard-with-goals-shots-and-effectiv"
kind: "ticket"
issue: 15
title: "Scoreboard with goals, shots and effectiveness, and the restart button"
spec: "010-m2-shooting-and-outcomes"
stage: "merging"
risk: "medium"
surfaces: ["ui", "api"]
rounds: 1
created: "2026-11-10T09:44:55+01:00"
updated: "2026-11-10T12:05:05+01:00"
---

# #15 Scoreboard with goals, shots and effectiveness, and the restart button

`015-scoreboard-with-goals-shots-and-effectiv` · ticket · stage merging · risk medium · surfaces ui, api · 1 round · spec [010-m2-shooting-and-outcomes](010-m2-shooting-and-outcomes.md)

## Issue

```text
### Body

Parent: #10
Blocked by: #14

## What to build

The scoreboard and the restart. The state counts shots (on release) and goals (on the goal outcome); a stats function derives effectiveness as goals over shots, 0 when there are no shots. The UI adapter renders in the header a scoreboard with goals, shots and effectiveness as a rounded percentage, with Spanish labels from the texts module, updated every frame from the state; and in the footer a restart button, labelled in Spanish. The intent gains a restart flag; a tick with restart true returns the initial state with the same seed and the current tick counter (stats zeroed, ball held, phase held). The input adapter exposes a way for the UI to raise the restart flag for exactly one tick; the entry point wires it.

## Acceptance criteria

- [ ] Tick tests: a release increments shots; a goal increments goals; out and post-hit change neither; effectiveness is goals / shots and 0 with no shots; restart returns a state equal to the initial state except for the tick counter, with the same seed, and emits no outcome.
- [ ] In the browser: the scoreboard shows goals, shots and the percentage and updates after every play; the restart button zeroes it and puts the ball back with the attacker; pressing restart mid-flight also works.
- [ ] All earlier tests pass untouched; the architecture table lists the UI adapter and the stats function.
```

## Plan

**DECISION:** ACCEPT · **RISK:** medium · **SURFACES:** ui, api

### Scope

Last piece of spec #10 (M2): session stats, the scoreboard and the restart.

Simulation (`src/sim/`, pure, tested):
- `GameState` gains `goals` and `shots` (numbers); `initialState(seed)` sets both to 0.
- New module `src/sim/stats.ts` with `recordShot`, `recordGoal` (pure, return updated
  goals/shots) and `effectiveness(stats)` = goals / shots, 0 when shots is 0. Effectiveness is
  derived, never stored in the state.
- `tick`: on release (the tick that emits `shot`) shots increases by 1; on the tick that emits
  `goal` goals increases by 1; `out` and `post-hit` change neither.
- `Intent` gains `restart: boolean`; `NO_INTENT.restart` is `false` (all existing tests build
  intents by spreading `NO_INTENT`, so they compile untouched). A tick with `restart: true`, in
  any phase, ignores the rest of the intent and returns `initialState(state.seed)` with only the
  `tick` field differing (`state.tick + 1`, the counter keeps advancing as on every tick), and
  an empty event list.

Adapters (checked by hand):
- `src/ui/texts.ts`: Spanish labels for goals, shots, effectiveness and the restart button.
- New `src/ui/index.ts` with `createUi(header, footer, onRestart)` (or equivalent): renders the
  scoreboard in `#scoreboard` (goals, shots, effectiveness as a rounded percentage via the
  sim's `effectiveness`) and a restart button in `#controls`; `update(state, events)` each
  frame; holds no rule. It does not import `src/input` (allowed-dependencies rule).
- `src/input/index.ts`: `createInput` result gains a way to request a restart (e.g.
  `requestRestart()`); the next `current()` returns `restart: true` exactly once, then false.
- `src/main.ts`: creates the UI, wires its restart callback to the input's request, calls the
  UI update every frame.
- `docs/architecture.md`: update `state` (goals, shots), `intent` (`restart`), `stats`
  (actual interface) and `ui` (`createUi` interface) rows; `input` row gains the restart
  request.

### Acceptance criteria

- C1: `initialState(seed)` has `goals` 0 and `shots` 0.
- C2: The tick that releases a charged shot (emits `shot`) returns a state with `shots`
  incremented by 1 and `goals` unchanged.
- C3: The tick that emits `goal` returns a state with `goals` incremented by 1 and `shots`
  unchanged.
- C4: A play ending in `out`, and a tick that emits `post-hit`, leave `goals` and `shots`
  unchanged.
- C5: `effectiveness` returns goals / shots (e.g. 1 goal of 4 shots gives 0.25) and returns 0
  when shots is 0 (no NaN).
- C6: `recordShot` increments shots and `recordGoal` increments goals, without mutating their
  input.
- C7: `NO_INTENT.restart` is `false`.
- C8: From a state with non-zero stats, a moved attacker and phase `held`, a tick with
  `restart: true` returns a state equal to `{ ...initialState(seed), tick: previousTick + 1 }`
  with the original seed, and an empty event list.
- C9: Restart during `charging`, during `flight` and during `resolved` each returns the same
  initial-equivalent state (phase `held`, ball held at the carry position of the start
  position, power 0, stats zeroed) and emits no event (no `shot`, `goal`, `out`, `post-hit` or
  `play-reset`).
- C10: Restart ignores the rest of the intent: with `move`, `aim` and `shootHeld` set alongside
  `restart: true`, the result is the same as with `restart` alone.
- C11: `tick` does not mutate the input state when restarting.

### Seams

- `tick(state, intent, rng)` from `src/sim/tick.ts`, driven with intents built from
  `NO_INTENT`, for C2-C4 and C8-C11; `initialState` for C1; `effectiveness`, `recordShot`,
  `recordGoal` from `src/sim/stats.ts` for C5-C6; `NO_INTENT` for C7.
- New test files only (existing `src/**/*.test.ts` are protected): `src/sim/stats.test.ts`
  (C5, C6), `src/sim/scoreboard.test.ts` (C1-C4), `src/sim/restart.test.ts` (C7-C11). Prior
  art for driving a shot to goal/out/post: `src/sim/shot.test.ts`, `src/sim/posts-goal.test.ts`,
  `src/sim/flight.test.ts`.
- UI, input and entry-point changes are adapters, verified by hand with `npm run dev`
  (scoreboard updates after each play; restart zeroes it and returns the ball, also
  mid-flight).

### Notes

- Blocked by #14 (outcomes); the base branch already contains flight, posts, goal, out and the
  resolved pause, so the events this ticket counts on exist.
- Tick counter on restart: the spec says "the current tick counter"; this plan fixes it as
  `state.tick + 1` so the counter stays monotonic like every other tick. C8 asserts that value.
- Keep `src/ui` free of imports from `src/input` and vice versa; `main.ts` does the wiring via a
  callback.
- Rounded percentage formatting (e.g. `Math.round(effectiveness * 100)` + "%") lives in the UI
  adapter; the sim returns the 0..1 ratio.
- Escape nothing user-supplied into `innerHTML` is needed (only numbers and constant texts), but
  prefer `textContent` for the numbers.
- No tuning changes are needed.

## Round 1

### Build

**STATUS:** READY

#### Evidence

- C1: src/sim/scoreboard.test.ts::`starts with no goals and no shots` — initialState zeroes both
- C2: src/sim/scoreboard.test.ts::`counts a shot on the release tick` — shots +1, goals unchanged
- C3: src/sim/scoreboard.test.ts::`counts a goal on the goal tick, leaving shots alone` — goals +1, shots unchanged
- C4: src/sim/scoreboard.test.ts::`leaves the stats unchanged on out` — out changes nothing (post-hit covered by `leaves the stats unchanged on post-hit`)
- C5: src/sim/stats.test.ts::`is goals over shots` — 1/4 gives 0.25; `is 0 when there are no shots` covers no NaN
- C6: src/sim/stats.test.ts::`recordShot increments shots without mutating its input` — pure increments (goal twin alongside)
- C7: src/sim/restart.test.ts::`does not ask for a restart` — NO_INTENT.restart is false
- C8: src/sim/restart.test.ts::`returns the initial state with the same seed and an advanced tick` — equals initialState with tick+1, no events
- C9: src/sim/restart.test.ts::`works during %s` — charging, flight and resolved all restart cleanly with no events
- C10: src/sim/restart.test.ts::`ignores the rest of the intent` — busy intent equals restart alone
- C11: src/sim/restart.test.ts::`does not mutate the input state` — input unchanged after restart

### Gate

**GATE:** PASS · **PROTECTED:** none

#### Summary

- checks.sh: OK
- Protected paths modified or deleted: 0
- Evidence problems: 0

### Review

**VERDICT:** PASS

#### Standards
- src/ui/index.ts: the controls hint (`texts.hint`) is no longer rendered, and `texts.hint` is now unused. The old header showed it and the plan did not ask to drop it. [non-blocking]
- src/sim/intent.ts line 4: the doc comment has a stray double space before the closing `*/`. [non-blocking]

#### Spec
C1-C11 are met: the sim changes and the new tests in `stats.test.ts`, `scoreboard.test.ts` and `restart.test.ts` match each criterion.
- Restart returns `{ ...initialState(seed), tick: tick + 1 }` with no events (C8-C11).
- Shots are counted on the release tick and goals on the `goal` tick (C2-C4).
- The UI, input and `main.ts` adapters follow the plan, and `src/ui` does not import `src/input`.
- No findings on extra scope beyond the dropped hint above.

#### Architecture
No findings. `docs/architecture.md` is updated for the `state`, `intent`, `stats`, `input` and `ui` rows. `main.ts` does the wiring through a callback, and `src/sim` stays pure.

## Timeline

| Time | From | To | Reason |
| --- | --- | --- | --- |
| 2026-11-10T09:44:55+01:00 | (new) | intake | created from #15 for spec 010-m2-shooting-and-outcomes |
| 2026-11-10T12:01:46+01:00 | intake | intake | start plan |
| 2026-11-10T12:02:50+01:00 | intake | build | ACCEPT risk=medium surfaces=ui,api |
| 2026-11-10T12:02:57+01:00 | build | build | start build |
| 2026-11-10T12:04:09+01:00 | build | gate | READY |
| 2026-11-10T12:04:17+01:00 | gate | gate | start gate |
| 2026-11-10T12:04:29+01:00 | gate | review | GATE PASS |
| 2026-11-10T12:04:35+01:00 | review | review | start review |
| 2026-11-10T12:05:05+01:00 | review | merging | PASS |
