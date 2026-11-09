# Mini Handball 2D

A top-down arcade handball game for the browser: one attacker, controlled with keyboard and
mouse, moves around half a court, stays out of the elliptical goal area and shoots at a goal
defended by an AI goalkeeper and an AI defender, choosing the angle with the mouse and the power
with an oscillating bar. The build is a single self-contained `index.html` published to GitHub
Pages. The brief is `docs/brief.md`, the milestones `docs/roadmap.md`, the original design
document `docs/requirements/gdd-mini-handball-2d.md` (Spanish).

## Stack

TypeScript (strict), Vite with vite-plugin-singlefile, Tailwind CSS compiled at build time,
npm, Vitest, ESLint with typescript-eslint, Prettier (check only). Node 22 LTS in CI; no runtime
dependencies: the game uses only the browser's Canvas 2D, DOM and Web Audio APIs.

## Setup and validation

- The single source of truth for "is this change OK" is `factory/checks.sh` (CI runs it too).
- Install: `npm ci`
- Run the game locally: `npm run dev`
- Run all checks the way the gate does: `factory/checks.sh`
- Format check: `npm run format` (Prettier `--check`; fix locally with `npx prettier --write .`)
- Lint: `npm run lint` · Typecheck: `npm run typecheck` · Build: `npm run build`
- Run all tests: `npm test`
- Run a single test: `npx vitest run src/sim/geometry.test.ts` (or `-t "<test name>"`)

## Conventions

- Public interface: the simulation's exported functions and types, documented in
  `docs/architecture.md`. Adapters are internal to the browser entry point.
- Simulation code (`src/sim/`) is pure: no `window`, `document`, Canvas, timers, `Math.random`
  or `AudioContext`. It takes a state and an intent and returns a new state plus events. All
  randomness comes from the injected generator; all numbers that shape the feel live in
  `src/sim/tuning.ts`.
- Tests: Vitest, co-located as `src/**/*.test.ts`, one `describe` per exported function or
  rule, named after behaviour ("attacker slides along the goal area edge"). Only the
  simulation has tests; adapters are verified by hand with `npm run dev`. Existing tests listed
  in `factory/config.json` `protected_paths` cannot be modified by the factory; it adds new
  test files instead.
- Errors: the simulation never throws on game input; invalid intents are clamped. Adapters may
  throw on missing DOM elements at start-up only.
- Code, comments, commits and docs in English. Player-facing text in Spanish, kept in
  `src/ui/texts.ts`.
- No new runtime dependencies without an ADR in `docs/adr/`.
- Domain vocabulary: `GLOSSARY.md`. Architecture decisions: `docs/adr/`.

## Software factory

- Queue label: `ready-for-agent`. Checks: `factory/checks.sh`. Protected paths and models:
  `factory/config.json`.
- Run a single test: `npx vitest run <path/to/file.test.ts>`
