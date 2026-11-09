import type { GameState } from "../sim/state";
import type { GameEvent } from "../sim/tick";
import { TUNING } from "../sim/tuning";

const FLOOR = "#2b6cb0";
const OUTLINE = "#f7fafc";
const ATTACKER_FILL = "#ed8936";
const ATTACKER_OUTLINE = "#1a202c";

/** Canvas renderer: square pitch sized to the container, capped by the window height. */
export function createRenderer(canvas: HTMLCanvasElement): {
  draw(state: GameState, events: readonly GameEvent[], alpha: number): void;
} {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d canvas context unavailable");
  let size = 0;

  const resize = (): void => {
    const available = canvas.parentElement?.clientWidth ?? window.innerWidth;
    size = Math.max(1, Math.floor(Math.min(available, window.innerHeight - 120)));
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${String(size)}px`;
    canvas.style.height = `${String(size)}px`;
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
  };
  resize();
  window.addEventListener("resize", resize);

  return {
    draw(state) {
      const k = canvas.width / TUNING.pitchWidth;
      ctx.fillStyle = FLOOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = Math.max(1, k * 0.08);
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      const { x, y } = state.attacker.position;
      ctx.beginPath();
      ctx.arc(x * k, y * k, TUNING.attackerRadius * k, 0, Math.PI * 2);
      ctx.fillStyle = ATTACKER_FILL;
      ctx.fill();
      ctx.strokeStyle = ATTACKER_OUTLINE;
      ctx.lineWidth = Math.max(1, k * 0.04);
      ctx.stroke();
    },
  };
}
