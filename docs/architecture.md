# Architecture

A single Vite + TypeScript project. The **simulation** is pure and deterministic; everything
that touches the browser is an **adapter** around it; `main.ts` wires them in a fixed-timestep
loop (ADR 0002). The build inlines everything into one `index.html` (ADR 0001).

```
browser events ──► input adapter ──► Intent ──► sim.tick(state, intent, rng) ──► state + events
                                                      │                              │
                                     renderer (canvas) ◄──────────────────────────────┤
                                     ui (DOM scoreboard, overlays) ◄──────────────────┤
                                     audio (Web Audio) ◄──────────────────────────────┘
```

## Modules

| Module             | Responsibility                                                                                                                                                     | Public interface                                                                                                                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/sim/geometry` | Vectors, rectangles, ellipses, segment-circle sweep, reflection, point-in-rectangle, clamping and sliding against shapes.                                          | `Vec2`, `Rect`, `add`, `subtract`, `scale`, `length`, `normalize`, `clampToRect`, `Ellipse`, `insideEllipse`, `pushOutOfEllipse`, `dot`, `reflect`, `insideRect`, `SegmentContact`, `sweepSegmentCircle`                                                                                                                         |
| `src/sim/pitch`    | The pitch's logical dimensions: size, goal line, posts, goal area ellipse, free-throw arc, danger zone. Derived from tuning.                                       | `pitchFrom(tuning)`, `PITCH` (`width`, `length`, `goalLine`, `posts`, `goalArea`, `freeThrowArc`, `dangerZone`), `Ellipse` (re-exported from geometry), `Pitch`                                                                                                                                                                  |
| `src/sim/tuning`   | Every named number that shapes the feel: speeds, radii, oscillation rate, reaction times. The only file later milestones touch to retune.                          | `TUNING` (pitch size, goal width, goal area, free-throw and danger zone sizes, goal centre, attacker and ball radius, post radius, carry distance, attacker speed and start, tick duration, shot speeds, power sweep duration, resolved pause, power bar size and offset)                                                        |
| `src/sim/rng`      | Seeded pseudo-random generator.                                                                                                                                    | `createRng(seed)`, `Rng` (`next()`, `range(min, max)`)                                                                                                                                                                                                                                                                           |
| `src/sim/state`    | The game state types and the initial state.                                                                                                                        | `GameState` (`attacker`, `ball`, `aim`, `phase`, `power`, `chargeTicks`, `resolvedTicks`, `goals`, `shots`, `shootArmed`, `tick`, `seed`), `PlayPhase` (`held`, `charging`, `flight`, `resolved`), `Attacker`, `Ball` (`position`, `held`, `velocity`), `carriedBallPosition(attacker)`, `initialState(seed)` (AI arrives later) |
| `src/sim/intent`   | What the human asks for in a tick.                                                                                                                                 | `Intent` (`move: Vec2`, `aim: Vec2`, `shootHeld: boolean`, `restart: boolean`; a restart tick returns `initialState(seed)` with the tick advanced and no events), `NO_INTENT`                                                                                                                                                    |
| `src/sim/tick`     | Advances the state by one tick: movement, power bar, shot, ball flight, AI, outcomes, play cycle. Returns the new state and the events of that tick.               | `tick(state, intent, rng): { state, events }`, `GameEvent` (`shot`, `out`, `post-hit`, `goal`, `play-reset`)                                                                                                                                                                                                                     |
| `src/sim/rules`    | Outcome detection: goal, out, post hit, save, block.                                                                                                               | `detectOutcome`, `Outcome`, `GameEvent`                                                                                                                                                                                                                                                                                          |
| `src/sim/ai`       | Goalkeeper and defender behaviour as pure functions of state.                                                                                                      | `goalkeeperMove`, `defenderMove`                                                                                                                                                                                                                                                                                                 |
| `src/sim/stats`    | Goals, shots, effectiveness.                                                                                                                                       | `Stats` (`goals`, `shots`), `recordShot(stats)`, `recordGoal(stats)`, `effectiveness(stats)` (goals / shots, 0 without shots)                                                                                                                                                                                                    |
| `src/input`        | Keyboard and mouse listeners on the canvas, producing the current `Intent` in logical pitch coordinates.                                                           | `createInput(canvas, toPitch): { current(): Intent, requestRestart() }` (`requestRestart` makes the next `current()` carry `restart: true` once) (keyboard on `window`; mouse aim on the canvas via the renderer's `toPitch`; shoot is left mouse button on the canvas or Space, released on `window`)                           |
| `src/render`       | Draws the pitch, actors, ball, aim line, power bar and particles on the canvas; owns the logical-to-screen scaling.                                                | `createRenderer(canvas): { draw(state, events, alpha), toPitch(clientX, clientY) }` (`alpha` ignored in M1; draws the aim line while `held` or `charging`, and the power bar while `charging`)                                                                                                                                   |
| `src/ui`           | DOM scoreboard, overlays, restart and mute buttons, Spanish texts.                                                                                                 | `texts`, `createUi(header, footer, onRestart): { update(state, events) }` (scoreboard of goals, shots and rounded effectiveness; restart button)                                                                                                                                                                                 |
| `src/audio`        | Web Audio synthesiser: whistle, shot, goal, save/block, post; mute.                                                                                                | `createAudio(): { play(event), setMuted }`                                                                                                                                                                                                                                                                                       |
| `src/main`         | Entry point: fixed 60 Hz accumulator over `requestAnimationFrame`, seeds the generator from the clock, feeds intents to the simulation and events to the adapters. | none (side effects only)                                                                                                                                                                                                                                                                                                         |

Modules not yet built are listed with their intended interface; a milestone may refine names
within the module, and the reviewer checks that this table is updated when it does.

## Allowed dependencies

- `src/sim/*` may import only other `src/sim/*` modules. Never the DOM, Canvas, timers,
  `Math.random` or `AudioContext`.
- `src/input`, `src/render`, `src/ui`, `src/audio` may import `src/sim/*` types and pure
  functions. They may not import each other.
- `src/main` may import everything.
- Third-party packages at runtime: none. At build/dev time only: Vite, vite-plugin-singlefile,
  Tailwind CSS, TypeScript, Vitest, ESLint, Prettier and their plugins. Adding a runtime
  dependency needs an ADR.
- Tests (`src/**/*.test.ts`) exist only for `src/sim/*` and import nothing outside it.

## Folder ownership

| Folder                                                              | Owner             | Notes                                                  |
| ------------------------------------------------------------------- | ----------------- | ------------------------------------------------------ |
| `factory/`, `.claude/`, `.github/`                                  | factory / humans  | protected; agents must not modify                      |
| `docs/brief.md`, `docs/roadmap.md`, `docs/requirements/`            | humans            | the factory reads them, never rewrites them            |
| `docs/adr/`, `GLOSSARY.md`                                          | humans and agents | agents may add an ADR or a term when a job settles one |
| `src/sim/`                                                          | agents            | pure simulation, fully tested                          |
| `src/input/`, `src/render/`, `src/ui/`, `src/audio/`, `src/main.ts` | agents            | adapters, checked by hand                              |
