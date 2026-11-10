# Roadmap

Mini Handball 2D is a top-down arcade handball game in the browser: one attacker, controlled
with keyboard and mouse, shoots at a goal defended by an AI goalkeeper and an AI defender.
"Done" for this roadmap is the MVP in `docs/brief.md` (phase 1 of the game design document)
playable at its GitHub Pages URL, with the three later phases of the design document planned
as coarse milestones after it.

## Out of scope

- Ball height and the crossbar (the simulation is purely 2D).
- Touch and mobile controls.
- Dribbling, passing, team-mates, more than one defender, fouls other than the goal area rule.
- Persisting statistics between sessions, accounts, backend.
- Any runtime dependency on the network.

## Milestones

### M0 · Bootstrap (by hand) — status: done (PR #1)

**Stack:** TypeScript, Vite with vite-plugin-singlefile, Tailwind CSS compiled at build time,
npm, Vitest, ESLint with typescript-eslint, Prettier in check mode, Node 22 LTS in CI.

**Done when:** `factory/checks.sh` installs dependencies, runs Prettier check, ESLint, `tsc`,
Vitest and the single-file build, and passes on the base branch; CI runs it as a required
check; a GitHub Pages workflow publishes the build on every merge to `main`; `CLAUDE.md` lists
the real commands. The page shows a title and an empty canvas: no game yet.

### M1 · Walking skeleton: the attacker on the pitch — status: done (spec #2, PR #7)

**A human can test:** open the Pages URL; the pitch is drawn with its goal, posts, goal area
and free-throw line; the attacker is visible holding the ball; WASD or the arrow keys move it
smoothly; it stops at the pitch edges and slides around the goal area without ever entering it;
the ball follows the attacker.

**Scope:** the simulation's state and tick with the fixed 60 Hz loop driven by
`requestAnimationFrame`; the pitch geometry and the tuning constants in one place; the
attacker's movement intent and its confinement (pitch rectangle and elliptical goal area); the
keyboard input adapter; the canvas renderer scaling a fixed logical pitch to the window; the
seeded random generator (unused yet, but wired).

**Why here:** it fixes the simulation/adapter boundary and the loop before any rule grows on
it, and it retires the one real geometry risk (sliding along an ellipse without jitter or
tunnelling).

**Depends on:** M0.

### M2 · Shooting and outcomes — status: planned (next)

**A human can test:** the aim line and reticle follow the mouse; holding left click or space
shows the oscillating power bar; releasing shoots the ball at a speed matching the power; the
ball rebounds off the posts and stays live; a ball that fully crosses the goal line counts as a
goal, a ball that leaves the pitch counts as out; the scoreboard shows goals, shots and
effectiveness; after each outcome the ball comes back to the attacker and the next play starts.
No goalkeeper or defender yet, so every well-aimed shot scores.

**Scope:** aim intent from the mouse adapter (cursor in pitch metres) and the aim line with its
reticle; the power bar that oscillates while the shoot control is held and fixes the power on
release; the shot (ball leaves the attacker along the aim line at a speed proportional to the
power); ball flight in a straight line with elastic rebound off the posts; the goal and out
outcomes; the play cycle (the outcome is emitted as an event, a short pause, the ball returns
to the attacker, the next play starts); the stats (goals, shots, effectiveness) in the state and
the scoreboard adapter that shows them; the restart intent and its button. Events become real
in this milestone: the tick emits them and the adapters consume them.

**Lessons from M1 to apply:** every tick-level behaviour that a later milestone will change
(for example the ball returning to the attacker, which M3's saves will also trigger) should be
tested through the outcome it produces, not through a path a later rule will block; tests are
protected once merged. Tickets that touch the tuning module or the architecture table conflict
when built in parallel: order them, or keep those edits in the first ticket of the chain.

**Why here:** ball physics and the rules are the core loop; everything later (AI, feedback)
only reacts to them.

**Depends on:** M1.

### M3 · Goalkeeper and defender — status: planned

**A human can test:** a goalkeeper shadows the attacker along the goal line and lunges at the
ball when it enters the danger zone; a defender covers along the free-throw line and gets in
the way of weak or badly aligned shots; touching the ball produces a save or a block, which
count as shots without a goal; scoring now needs angle and power.

**Scope:** goalkeeper AI, defender AI, save and block outcomes, body collision with the ball,
tuning of reaction and coverage so that goals are possible but not free.

**Why here:** it is the part of the game whose feel is least predictable from the design
document; it needs the real shot physics of M2 underneath to be tuned.

**Depends on:** M2.

### M4 · Feedback: overlays, particles, sound — status: planned

**A human can test:** every outcome and post hit shows its Spanish overlay (GOLAZO, PARADÓN,
BLOQUEADO, AL POSTE, FUERA); goals burst green particles, posts spark, saves scatter; whistle,
shot, goal, save/block and post sounds are synthesised, and the mute toggle silences them; the
glassmorphism panels of the design document frame the pitch.

**Scope:** overlay adapter, particle emitter in the renderer, Web Audio synthesiser with the
five effects, mute toggle, final visual polish of the scoreboard and panels. With this the MVP
is complete.

**Why here:** pure presentation; it depends on all the events the earlier milestones emit and
changes none of the rules.

**Depends on:** M3.

### M5 · Spin (phase 2) — status: planned

Dragging the mouse while the power bar runs gives the shot a curve. Coarse; to be detailed
after M4.

### M6 · Timed match and rival score (phase 3) — status: planned

A two-minute match mode with a clock, a rival team score and a final result. Coarse.

### M7 · Local two-player (phase 4) — status: planned

Second player on the same keyboard controlling the goalkeeper or the defender. Coarse.

## Open questions

- Exact pitch proportions, goal width, actor sizes and all speeds are tuning values to be set
  in M1 and M2 by playing; the design document gives none.
- Whether M5 (spin) needs ball height; decided when M5 is detailed (see ADR 0003).

## Changes

- 2026-11-10: M0 and M1 done. M1 took four tickets, two of them needing a second round
  because parallel tickets both edited the tuning module and the architecture table, and one
  needing a human to amend a protected test from an earlier ticket that the goal-area rule
  invalidated. M2 detailed with those lessons; M3 and later unchanged.
- 2026-11-09: first version, from the setup interview and `docs/brief.md`.
