import type { Intent } from "../sim/intent";
import type { Vec2 } from "../sim/geometry";
import { NO_INTENT } from "../sim/intent";
import { TUNING } from "../sim/tuning";

const LEFT = ["a", "arrowleft"];
const RIGHT = ["d", "arrowright"];
const UP = ["w", "arrowup"];
const DOWN = ["s", "arrowdown"];
const ARROWS = ["arrowleft", "arrowright", "arrowup", "arrowdown"];

/**
 * Keyboard adapter on `window` (WASD and arrows, opposite keys cancel) plus mouse aim on the
 * canvas, converted to pitch metres by `toPitch`. Aims at the goal centre until the mouse moves.
 */
export function createInput(
  canvas: HTMLCanvasElement,
  toPitch: (clientX: number, clientY: number) => Vec2,
): { current(): Intent } {
  const held = new Set<string>();
  let mouseDown = false;
  let aim: Vec2 = { ...TUNING.goalCentre };
  canvas.addEventListener("mousemove", (e) => {
    aim = toPitch(e.clientX, e.clientY);
  });
  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0) mouseDown = true;
  });
  // On `window` so releasing outside the canvas cannot leave the flag stuck.
  window.addEventListener("mouseup", (e) => {
    if (e.button === 0) mouseDown = false;
  });
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (ARROWS.includes(key) || key === " ") e.preventDefault();
    held.add(key);
  });
  window.addEventListener("keyup", (e) => {
    held.delete(e.key.toLowerCase());
  });
  window.addEventListener("blur", () => {
    held.clear();
    mouseDown = false;
  });
  const axis = (neg: string[], pos: string[]): number =>
    (pos.some((k) => held.has(k)) ? 1 : 0) - (neg.some((k) => held.has(k)) ? 1 : 0);
  return {
    current: () => ({
      ...NO_INTENT,
      move: { x: axis(LEFT, RIGHT), y: axis(UP, DOWN) },
      aim,
      shootHeld: mouseDown || held.has(" "),
    }),
  };
}
