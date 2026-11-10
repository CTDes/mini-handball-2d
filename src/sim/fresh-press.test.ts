import { describe, expect, it } from "vitest";
import { NO_INTENT, type Intent } from "./intent";
import { createRng } from "./rng";
import { initialState, type GameState } from "./state";
import { tick } from "./tick";

const rng = createRng(1);
const hold: Intent = { ...NO_INTENT, shootHeld: true };
const release: Intent = { ...NO_INTENT, aim: { x: 10, y: 30 } };

function run(state: GameState, intent: Intent, ticks: number): GameState {
  let s = state;
  for (let i = 0; i < ticks; i++) s = tick(s, intent, rng).state;
  return s;
}

describe("shoot press while the ball is not held", () => {
  it("does not start charging after play-reset until the control is released and pressed again", () => {
    const charging = run(initialState(1), hold, 3);
    const flying = tick(charging, release, rng).state;
    expect(flying.phase).toBe("flight");
    let s = flying;
    for (let i = 0; i < 1000 && s.phase !== "held"; i++) s = tick(s, hold, rng).state;
    expect(s.phase).toBe("held");
    const stillHeld = run(s, hold, 5);
    expect(stillHeld.phase).toBe("held");
    const released = tick(stillHeld, NO_INTENT, rng).state;
    expect(tick(released, hold, rng).state.phase).toBe("charging");
  });
});
