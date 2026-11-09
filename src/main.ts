// Entry point. M0 only proves the toolchain: a title and an empty canvas (docs/roadmap.md).
import { createRng } from "./sim/rng";

const canvas = document.querySelector<HTMLCanvasElement>("#pitch");
if (!canvas) throw new Error("missing #pitch canvas");

const scoreboard = document.querySelector<HTMLElement>("#scoreboard");
if (scoreboard) {
  scoreboard.innerHTML = `<h1 class="text-2xl font-bold tracking-wide">Mini Handball 2D</h1>`;
}

canvas.width = 900;
canvas.height = 600;
const ctx = canvas.getContext("2d");
if (ctx) {
  const rng = createRng(Date.now());
  ctx.fillStyle = `hsl(${String(Math.floor(rng.range(190, 230)))} 40% 25%)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
