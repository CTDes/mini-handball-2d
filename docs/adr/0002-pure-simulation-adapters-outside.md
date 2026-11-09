# The simulation is pure and deterministic; rendering, input and audio are adapters

Everything that decides what happens in the game (movement, the 6-metre goal area, ball physics,
posts, outcomes, goalkeeper and defender AI, statistics) lives in a simulation that imports no
Canvas, DOM, timer or AudioContext, advances in fixed ticks of 1/60 s, and draws randomness only
from an injected seeded generator. Input, canvas rendering, particles, audio and the DOM
scoreboard are adapters that translate to and from the simulation and contain no rules. The
reason is testability: the simulation runs under Vitest in Node without a browser, tests are
reproducible, and the feel of the game can be tuned by changing constants without touching the
adapters. The cost is some ceremony (intents in, events out) that a quick prototype would skip.

## Consequences

- A module in the simulation may import only other simulation modules.
- Adapters may import simulation types and functions, never the reverse.
- Only the simulation has automated tests; adapters are checked by hand in the browser.
- In the real game the generator is seeded from the clock, so the goalkeeper stays unpredictable.
