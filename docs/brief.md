# Mini Handball 2D

Mini Handball 2D is a top-down arcade handball game that runs in the browser as a single
self-contained HTML file. The player controls one attacker who moves around half a court, keeps
out of the 6-metre goal area, and shoots at a goal defended by an AI goalkeeper and an AI
defender, choosing the angle with the mouse and the power with an oscillating bar. It is for
casual players who want a quick, physical, satisfying "beat the keeper" loop with no install.

## Users and their goals

- **Casual web player:** open a link, understand the controls in seconds, and chain a few
  minutes of shots trying to raise their effectiveness percentage.
- **Project owner:** ship the MVP through the software factory, then grow it (spin, timed
  match, local two-player) milestone by milestone without rewriting the core.

## MVP

The MVP is exactly "Phase 1" of the game design document:

- Half-court top-down pitch with one goal, drawn on an HTML5 canvas at 60 FPS.
- Attacker movement with WASD or arrow keys, confined to the pitch and strictly kept out of the
  elliptical 6-metre area.
- Aiming: a dashed guide line and reticle from the attacker to the mouse cursor.
- Power: holding left click or space starts a bar that oscillates between 0 % and 100 %;
  releasing shoots the ball at a speed proportional to the power.
- Ball physics with elastic rebound on the goal posts.
- Goalkeeper AI: moves laterally along the goal line and reacts to the ball's trajectory when it
  enters the danger zone.
- Defender AI: covers horizontally around the 9-metre line and intercepts misaligned or weak
  shots.
- Outcomes: goal (ball fully crosses the goal line between the posts), save (keeper touches
  the ball), block (defender touches the ball), post (rebound, ball stays live), out (ball
  leaves the pitch). After an outcome the ball returns to the attacker and play restarts.
- Scoreboard: goals, total shots and effectiveness (%) for the current session.
- UI: restart button, mute/unmute toggle, animated overlays in Spanish (GOLAZO, PARADÓN,
  BLOQUEADO, AL POSTE, FUERA).
- Feedback: 2D particles (goal burst, post spark, save scatter) and sound effects synthesised
  with the Web Audio API (whistle, shot, goal, save/block, post), no audio files.

## Out of scope

- Ball height: the simulation is purely 2D. There is no crossbar; a goal is decided by the
  posts and the goal line only.
- Touch and mobile controls. Mouse and keyboard only.
- Dribbling, passing, team-mates, more than one defender, fouls other than the 6-metre rule.
- Persisting statistics between sessions (no localStorage, no backend, no accounts).
- Phase 2 (spin/curve by dragging during the shot), Phase 3 (timed match and rival score) and
  Phase 4 (local two-player, attacker vs keeper) are later milestones, not the MVP.
- Any runtime dependency on the network (CDNs, fonts, audio files).

## Constraints

- **Stack:** TypeScript, Vite, Tailwind CSS (compiled at build time, not from a CDN),
  Vitest, ESLint with typescript-eslint, Prettier in check mode, npm, Node 22 LTS in CI.
- **Deliverable:** a single self-contained `index.html` produced by the build
  (vite-plugin-singlefile); the source is a normal multi-module project.
- **Hosting:** GitHub Pages, deployed by a GitHub Actions workflow on every merge to `main`.
- **Architecture boundary:** the simulation (movement, 6-metre collision, ball physics, rules,
  goalkeeper and defender AI, statistics) is pure, deterministic code with no Canvas, DOM or
  AudioContext, driven by a fixed 60 Hz timestep and an injectable seeded random generator.
  Rendering, audio and particles are adapters with no rule logic. Only the simulation has
  automated tests; adapters are checked by hand.
- **Language:** code, commits, docs and module names in English; player-facing text in Spanish.
- **Licence:** MIT. Public repository.
- **Process:** every change goes through the software factory and must pass
  `factory/checks.sh` (lint, typecheck, tests, build).

## Risks and unknowns

- **Feel:** aiming, power oscillation speed, keeper reaction and defender coverage are tuning
  problems; numbers in the GDD are qualitative. The walking skeleton must expose tuning
  constants in one place so later milestones can adjust them without touching rules.
- **Elliptical 6-metre collision:** sliding along an ellipse without jitter or tunnelling at
  60 Hz is the one non-trivial piece of geometry; it is built early.
- **Canvas and audio in tests:** nothing in the simulation may import them, or tests stop
  running in Node. The architecture document and the reviewer enforce this.
- **Single-file build:** Tailwind must be purged and inlined correctly or the deliverable grows
  or breaks; verified in M0 by the build step of the checks.
- **Determinism vs. fun:** a seeded RNG makes tests reproducible, but the keeper must still
  feel unpredictable to the player; the seed is reseeded from time in the real game.

## Sources

- `docs/requirements/gdd-mini-handball-2d.md`: the game design document (in Spanish): vision,
  pillars, mechanics, AI, rules, technical architecture, UI and the four-phase roadmap.
