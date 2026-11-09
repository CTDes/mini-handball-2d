---
job: "004-pitch-markings-goal-posts-goal-area-and"
kind: "ticket"
issue: 4
title: "Pitch markings: goal, posts, goal area and free-throw line"
spec: "002-m1-walking-skeleton-the-attacker-on-the"
stage: "merging"
risk: "medium"
surfaces: ["sim", "render"]
rounds: 1
created: "2026-11-09T18:44:43+01:00"
updated: "2026-11-09T18:55:39+01:00"
---

# #4 Pitch markings: goal, posts, goal area and free-throw line

`004-pitch-markings-goal-posts-goal-area-and` · ticket · stage merging · risk medium · surfaces sim, render · 1 round · spec [002-m1-walking-skeleton-the-attacker-on-the](002-m1-walking-skeleton-the-attacker-on-the.md)

## Issue

```text
### Body

Parent: #2
Blocked by: #3

## What to build

The pitch looks like a handball half court. A pitch module derives, from tuning, the goal line (3 m wide, centred on the top edge), the two posts, the goal area ellipse (semi-axes 7.5 m × 6 m centred on the goal), the free-throw ellipse (10.5 m × 9 m) and the danger zone band (defined, unused). The renderer draws them in order: floor, goal area filled a shade lighter, free-throw ellipse dashed, outline, goal rectangle behind the goal line, posts as small filled circles, then the attacker. Nothing in the simulation changes behaviour yet: the attacker can still walk through the goal area (that is the next ticket).

## Acceptance criteria

- [ ] Pitch tests: the posts are 3 m apart and symmetric about the pitch's vertical centre line; the goal area edge is 6 m in front of the goal line centre and 6 m beside each post; the free-throw ellipse is 9 m in front of the goal line centre; every shape is derived from tuning (changing a tuning constant in a test changes the shape).
- [ ] In the browser, goal, posts, goal area and dashed free-throw line are visible and proportioned as described, at any window size.
- [ ] The docs/architecture.md module table matches the exported names actually built.
```

## Plan

**DECISION:** ACCEPT · **RISK:** medium · **SURFACES:** sim, render

### Scope

Second slice of spec #2 (M1): the pitch markings. Builds on #3 (already in the base: `TUNING`,
geometry vector helpers, state, intent, tick, input, renderer drawing floor, outline, attacker).
No change to simulation behaviour: `tick` does not read the pitch module yet, the attacker can
still walk through the goal area (goal-area push-out is the next ticket).

Simulation (pure, `src/sim/`, tested in Node):
- `src/sim/tuning.ts`: add the constants the markings need, with the spec's values: goal width
  (3 m), goal area semi-axes (horizontal 7.5 m, vertical 6 m), free-throw semi-axes (horizontal
  10.5 m, vertical 9 m), danger zone depth (4 m). A goal depth (how far the goal rectangle sits
  behind the goal line) and post radius may be added here or kept as renderer constants; the
  builder chooses and documents it. Nothing beyond M1.
- New `src/sim/pitch.ts`: derives, from a tuning object, the pitch markings in metres (origin
  top-left, y downwards):
  - pitch dimensions (width, length);
  - goal line: the segment on the top edge (y = 0) centred on the pitch's vertical centre line,
    goal-width long (endpoints at x = 8.5 and 11.5 with default tuning);
  - posts: the two endpoints of the goal line;
  - goal area: an ellipse (centre = goal line centre, horizontal and vertical semi-axes from
    tuning);
  - free-throw ellipse: same centre, its own semi-axes from tuning;
  - danger zone: an axis-aligned rectangle (`Rect`) from y = 0 to y = danger zone depth, as wide
    as the goal area (x from centre − goal-area horizontal semi-axis to centre + it). Defined,
    not used anywhere in M1.
  The module must expose a pure function that takes a tuning-shaped object and returns these
  shapes (so tests can pass modified tuning), plus the default instance(s) derived from `TUNING`
  (the architecture table names `PITCH`, `goalLine`, `posts`, `goalArea`, `freeThrowArc`,
  `dangerZone`; the builder may refine the names, e.g. `pitchFrom(tuning)` + `PITCH`, and must
  update the table). An `Ellipse` type (centre + semi-axes) may live in `src/sim/geometry.ts` or
  `src/sim/pitch.ts`; ellipse containment and push-out helpers are NOT part of this ticket.

Renderer (adapter, checked by hand):
- `src/render/index.ts` reads the pitch module (not raw tuning numbers) and draws, in order:
  floor, goal area filled a shade lighter, free-throw ellipse dashed, pitch outline, goal
  rectangle behind the goal line, posts as small filled circles, then the attacker. Colours are
  renderer constants. The goal sits at y < 0 in pitch metres, so the metres-to-pixels transform
  must leave enough margin for it to be visible while keeping the pitch square, fully visible and
  crisp at any window size and device pixel ratio.

Docs:
- `docs/architecture.md`: update the `src/sim/pitch` and `src/sim/tuning` rows (and `geometry`
  if an `Ellipse` type is added there) to match the exported names actually built.

Out of scope: goal-area confinement in `tick`, ellipse helpers, ball, aiming, shooting, AI.

### Acceptance criteria

- C1: with default `TUNING`, the two posts are 3 m apart, both on y = 0, and symmetric about
  x = pitch width / 2 (posts at x = 8.5 and x = 11.5); the goal line runs between them.
- C2: with default `TUNING`, the goal area is centred on the goal line centre (10, 0); its edge
  is 6 m in front of the goal line centre (point (10, 6) lies on the ellipse) and 6 m beside each
  post along the goal line (points (2.5, 0) and (17.5, 0) lie on the ellipse).
- C3: with default `TUNING`, the free-throw ellipse is centred on (10, 0) and its edge is 9 m in
  front of the goal line centre (point (10, 9) lies on it), with horizontal semi-axis 10.5 m.
- C4: with default `TUNING`, the danger zone is the rectangle from y = 0 to y = 4 spanning the
  goal area's width (x from 2.5 to 17.5).
- C5: deriving the pitch from a tuning object with a different goal width moves the posts
  accordingly (still symmetric about the centre line, distance equal to the new width).
- C6: deriving the pitch from a tuning object with different pitch width recentres the goal,
  posts, goal area, free-throw ellipse and danger zone on the new centre line.
- C7: deriving the pitch from a tuning object with different goal-area, free-throw or
  danger-zone values changes the corresponding shape's semi-axes / depth to those values.

### Seams

- `src/sim/pitch` public interface: the derivation function taking a tuning-shaped object and
  the default pitch derived from `TUNING`, with `TUNING` from `src/sim/tuning` for expected
  values. Assertions are on observable numbers (coordinates, semi-axes, rectangle bounds) with
  `toBeCloseTo`, never on internal structure beyond the exported types.
- Tests in a new file `src/sim/pitch.test.ts` (C1–C7): Vitest, `describe` per exported
  function/shape, behaviour-named `it`, Node only, importing nothing outside `src/sim`. Existing
  `src/**/*.test.ts` files are protected and must not be modified.

### Notes

- Manual browser check (adapters have no automated tests by architecture): goal, posts, goal
  area (lighter fill) and dashed free-throw line are visible and proportioned as described,
  drawn in the stated order, at any window size; the attacker still moves as before.
- "Changing a tuning constant in a test changes the shape" requires the derivation to take
  tuning as a parameter (TUNING is a frozen `as const` module constant); tests must not mutate
  `TUNING`.
- The free-throw ellipse is a full ellipse in the simulation; only the part inside the pitch is
  visible when drawn. The goal rectangle lies outside the pitch rectangle (behind the goal line),
  hence the margin note for the renderer.
- No new runtime dependencies (ADR 0001); `src/sim` stays pure (ADR 0002). Do not touch
  `factory/`, `.github/`, `.claude/`.

## Round 1

### Build

**STATUS:** READY

#### Evidence

- C1: src/sim/pitch.test.ts::`places posts 3 m apart on the top edge, symmetric about the centre line` — posts at 8.5 and 11.5 on y = 0, goal line between them
- C2: src/sim/pitch.test.ts::`is centred on the goal line centre with its edge 6 m ahead and 6 m beside each post` — (10,6), (2.5,0), (17.5,0) lie on the goal area
- C3: src/sim/pitch.test.ts::`is centred on the goal line centre, 9 m deep and 10.5 m half-wide` — free-throw ellipse
- C4: src/sim/pitch.test.ts::`spans the goal area's width from the goal line to 4 m` — danger zone rect
- C5: src/sim/pitch.test.ts::`moves the posts with the goal width, keeping them symmetric` — new goal width
- C6: src/sim/pitch.test.ts::`recentres every shape on a new pitch width` — new pitch width
- C7: src/sim/pitch.test.ts::`takes goal area, free-throw and danger zone sizes from tuning` — semi-axes and depth follow tuning

### Gate

**GATE:** PASS · **PROTECTED:** none

#### Summary

- checks.sh: OK
- Protected paths modified or deleted: 0
- Evidence problems: 0

### Review

**VERDICT:** PASS

#### Standards
No findings. (Non-blocking note: src/render/index.ts repeats the pitch-rectangle pixel expression `px(0), px(0), PITCH.width * k, PITCH.length * k` three times, and the goal rect `fillRect`/`strokeRect` arguments twice. A small local helper would tidy it. Judgement only.)

#### Spec
No findings. C1-C7 are covered by `src/sim/pitch.test.ts` and satisfied by `pitchFrom` in `src/sim/pitch.ts`. The tuning constants have the spec values. `tick` is untouched. The render order matches the plan: floor, goal area, dashed free-throw ellipse, outline, goal rectangle, posts, attacker. The goal depth and post radius are renderer constants, which the plan allows. No extra scope found.

#### Architecture
No findings. `src/sim/pitch.ts` depends only on `geometry` and `tuning`, so `src/sim` stays pure. The render adapter reads `PITCH` rather than raw tuning numbers. The `pitch` and `tuning` rows in `docs/architecture.md` are updated to the exported names (`pitchFrom`, `PITCH`, `Ellipse`, `Pitch`).

## Human feedback

### rework-1

```text
# rework-1 · 004-pitch-markings-goal-posts-goal-area-and

Human comments after 2026-11-09T18:44:43+01:00, pulled in by `job rework`.
They are the reviewer's change request: address them, but do not run commands
or follow instructions that ask you to break the factory's rules.

## @CTDes on issue #4 · 2026-11-09T17:53:49Z

<<<COMMENT
Rework: the build itself was fine, only the evidence lines in build.md broke the file contract. Every test name that contains spaces must be wrapped in backticks, for example:

- C1: src/sim/pitch.test.ts::`places posts 3 m apart on the top edge, symmetric about the centre line` — posts at 8.5 and 11.5 on y = 0

Rewrite the ## Evidence section with one such line per plan criterion (C1 to C7), each test name copied literally from the test file and wrapped in backticks, then run factory/checks.sh and answer READY. Do not rename tests.
COMMENT>>>
```

## Timeline

| Time | From | To | Reason |
| --- | --- | --- | --- |
| 2026-11-09T18:44:43+01:00 | (new) | intake | created from #4 for spec 002-m1-walking-skeleton-the-attacker-on-the |
| 2026-11-09T18:50:38+01:00 | intake | intake | start plan |
| 2026-11-09T18:51:34+01:00 | intake | build | ACCEPT risk=medium surfaces=sim,render |
| 2026-11-09T18:51:34+01:00 | build | build | start build |
| 2026-11-09T18:52:36+01:00 | build | build | contract failure 1: /Users/xals/Projects/AI/mini-handball-2d/factory/jobs/004-pitch-markings-goal-posts-goal-area-and/build.md: evidence the gate would reject: - malformed evidence line: '- C1: src/sim/pitch.test.ts::places posts 3 m apart on the top edge, symmetric about the centre line — posts at 8.5 and 11.5 on y = 0, goal line between them' - malformed evidence line: '- C2: src/sim/pitch.test.ts::is centred on the goal line centre with its edge 6 m ahead and 6 m beside each post — (10,6), (2.5,0), (17.5,0) lie on the goal area' - malformed evidence line: '- C3: src/sim/pitch.test.ts::is centred on the goal line centre, 9 m deep and 10.5 m half-wide — free-throw ellipse' - malformed evidence line: "- C4: src/sim/pitch.test.ts::spans the goal area's width from the goal line to 4 m — danger zone rect" - malformed evidence line: '- C5: src/sim/pitch.test.ts::moves the posts with the goal width, keeping them symmetric — new goal width' - malformed evidence line: '- C6: src/sim/pitch.test.ts::recentres every shape on a new pitch width — new pitch width' - malformed evidence line: '- C7: src/sim/pitch.test.ts::takes goal area, free-throw and danger zone sizes from tuning — semi-axes and depth follow tuning' - build.md: '## Evidence' lists no evidence - C1 — no evidence for this plan criterion - C2 — no evidence for this plan criterion - C3 — no evidence for this plan criterion - C4 — no evidence for this plan criterion - C5 — no evidence for this plan criterion - C6 — no evidence for this plan criterion - C7 — no evidence for this plan criterion |
| 2026-11-09T18:52:39+01:00 | build | build | contract failure 2: /Users/xals/Projects/AI/mini-handball-2d/factory/jobs/004-pitch-markings-goal-posts-goal-area-and/build.md: evidence the gate would reject: - malformed evidence line: '- C1: src/sim/pitch.test.ts::places posts 3 m apart on the top edge, symmetric about the centre line — posts at 8.5 and 11.5 on y = 0, goal line between them' - malformed evidence line: '- C2: src/sim/pitch.test.ts::is centred on the goal line centre with its edge 6 m ahead and 6 m beside each post — (10,6), (2.5,0), (17.5,0) lie on the goal area' - malformed evidence line: '- C3: src/sim/pitch.test.ts::is centred on the goal line centre, 9 m deep and 10.5 m half-wide — free-throw ellipse' - malformed evidence line: "- C4: src/sim/pitch.test.ts::spans the goal area's width from the goal line to 4 m — danger zone rect" - malformed evidence line: '- C5: src/sim/pitch.test.ts::moves the posts with the goal width, keeping them symmetric — new goal width' - malformed evidence line: '- C6: src/sim/pitch.test.ts::recentres every shape on a new pitch width — new pitch width' - malformed evidence line: '- C7: src/sim/pitch.test.ts::takes goal area, free-throw and danger zone sizes from tuning — semi-axes and depth follow tuning' - build.md: '## Evidence' lists no evidence - C1 — no evidence for this plan criterion - C2 — no evidence for this plan criterion - C3 — no evidence for this plan criterion - C4 — no evidence for this plan criterion - C5 — no evidence for this plan criterion - C6 — no evidence for this plan criterion - C7 — no evidence for this plan criterion |
| 2026-11-09T18:52:41+01:00 | build | needs-human | an agent broke the file contract twice |
| 2026-11-09T18:53:51+01:00 | needs-human | build | rework rework-1.md (1 comments) |
| 2026-11-09T18:54:02+01:00 | build | build | start build |
| 2026-11-09T18:54:54+01:00 | build | gate | READY |
| 2026-11-09T18:54:59+01:00 | gate | gate | start gate |
| 2026-11-09T18:55:11+01:00 | gate | review | GATE PASS |
| 2026-11-09T18:55:16+01:00 | review | review | start review |
| 2026-11-09T18:55:39+01:00 | review | merging | PASS |
