import { effectiveness } from "../sim/stats";
import type { GameState } from "../sim/state";
import type { GameEvent } from "../sim/tick";
import { texts } from "./texts";

/**
 * DOM scoreboard in `header` and restart button in `footer`. Holds no rule: it shows the
 * state's counters and calls `onRestart` when the button is pressed.
 */
export function createUi(
  header: HTMLElement,
  footer: HTMLElement,
  onRestart: () => void,
): { update(state: GameState, events: readonly GameEvent[]): void } {
  const title = document.createElement("h1");
  title.className = "text-2xl font-bold tracking-wide";
  title.textContent = texts.title;
  const stats = document.createElement("p");
  stats.className = "text-slate-300";
  header.replaceChildren(title, stats);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "rounded bg-slate-700 px-4 py-2 font-semibold hover:bg-slate-600";
  button.textContent = texts.restart;
  button.addEventListener("click", () => {
    button.blur(); // keep Space for shooting
    onRestart();
  });
  footer.replaceChildren(button);

  let shown = "";
  return {
    update(state) {
      const percent = Math.round(effectiveness(state) * 100);
      const text = `${texts.goals}: ${state.goals} · ${texts.shots}: ${state.shots} · ${texts.effectiveness}: ${percent}%`;
      if (text !== shown) {
        stats.textContent = text;
        shown = text;
      }
    },
  };
}
