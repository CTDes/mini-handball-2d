import type { Intent } from "../sim/intent";
import { NO_INTENT } from "../sim/intent";

const LEFT = ["a", "arrowleft"];
const RIGHT = ["d", "arrowright"];
const UP = ["w", "arrowup"];
const DOWN = ["s", "arrowdown"];
const ARROWS = ["arrowleft", "arrowright", "arrowup", "arrowdown"];

/** Keyboard adapter on `window`: WASD and arrows, opposite keys cancel. No mouse. */
export function createInput(): { current(): Intent } {
  const held = new Set<string>();
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (ARROWS.includes(key)) e.preventDefault();
    held.add(key);
  });
  window.addEventListener("keyup", (e) => {
    held.delete(e.key.toLowerCase());
  });
  window.addEventListener("blur", () => {
    held.clear();
  });
  const axis = (neg: string[], pos: string[]): number =>
    (pos.some((k) => held.has(k)) ? 1 : 0) - (neg.some((k) => held.has(k)) ? 1 : 0);
  return {
    current: () => ({ ...NO_INTENT, move: { x: axis(LEFT, RIGHT), y: axis(UP, DOWN) } }),
  };
}
