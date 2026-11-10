// Entry point: wires the adapters to the simulation in a fixed 60 Hz loop. No game logic.
import { createInput } from "./input";
import { createRenderer } from "./render";
import { createRng } from "./sim/rng";
import { initialState } from "./sim/state";
import { tick } from "./sim/tick";
import { TUNING } from "./sim/tuning";
import { texts } from "./ui/texts";

const canvas = document.querySelector<HTMLCanvasElement>("#pitch");
if (!canvas) throw new Error("missing #pitch canvas");

const header = document.querySelector<HTMLElement>("#scoreboard");
if (header) {
  header.innerHTML = `<h1 class="text-2xl font-bold tracking-wide">${texts.title}</h1><p class="text-slate-300">${texts.hint}</p>`;
}

const renderer = createRenderer(canvas);
const input = createInput(canvas, (x, y) => renderer.toPitch(x, y));
const seed = Date.now();
const rng = createRng(seed);
let state = initialState(seed);
let accumulator = 0;
let last = performance.now();

function frame(now: number): void {
  accumulator += Math.min((now - last) / 1000, 0.25);
  last = now;
  let events: ReturnType<typeof tick>["events"] = [];
  while (accumulator >= TUNING.tickDuration) {
    const result = tick(state, input.current(), rng);
    state = result.state;
    events = result.events;
    accumulator -= TUNING.tickDuration;
  }
  renderer.draw(state, events, accumulator / TUNING.tickDuration);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
