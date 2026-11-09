import type { GameState } from "../sim/state";
import type { GameEvent } from "../sim/tick";
import { PITCH, type Ellipse } from "../sim/pitch";
import { TUNING } from "../sim/tuning";

/** Metres of space drawn around the pitch so the goal behind the goal line is visible. */
const MARGIN = 2;
const GOAL_DEPTH = 1.5;
const POST_RADIUS = 0.15;
const SURROUND = "#1a365d";
const GOAL_AREA = "#3b82c4";
const LINE = "#bee3f8";
const GOAL_FILL = "#2d3748";
const POST = "#f7fafc";
const FLOOR = "#2b6cb0";
const OUTLINE = "#f7fafc";
const ATTACKER_FILL = "#ed8936";
const ATTACKER_OUTLINE = "#1a202c";
const BALL_FILL = "#f7fafc";

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
      const k = canvas.width / (PITCH.width + 2 * MARGIN);
      const px = (m: number): number => (m + MARGIN) * k;
      const ellipse = (e: Ellipse): void => {
        ctx.beginPath();
        ctx.ellipse(px(e.centre.x), px(e.centre.y), e.rx * k, e.ry * k, 0, 0, Math.PI * 2);
      };
      ctx.fillStyle = SURROUND;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = FLOOR;
      ctx.fillRect(px(0), px(0), PITCH.width * k, PITCH.length * k);
      ctx.save();
      ctx.beginPath();
      ctx.rect(px(0), px(0), PITCH.width * k, PITCH.length * k);
      ctx.clip();
      ellipse(PITCH.goalArea);
      ctx.fillStyle = GOAL_AREA;
      ctx.fill();
      ellipse(PITCH.freeThrowArc);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = Math.max(1, k * 0.05);
      ctx.setLineDash([k * 0.4, k * 0.3]);
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = Math.max(1, k * 0.08);
      ctx.strokeRect(px(0), px(0), PITCH.width * k, PITCH.length * k);
      const [left, right] = PITCH.posts;
      ctx.fillStyle = GOAL_FILL;
      ctx.fillRect(px(left.x), px(-GOAL_DEPTH), (right.x - left.x) * k, GOAL_DEPTH * k);
      ctx.strokeRect(px(left.x), px(-GOAL_DEPTH), (right.x - left.x) * k, GOAL_DEPTH * k);
      ctx.fillStyle = POST;
      for (const post of PITCH.posts) {
        ctx.beginPath();
        ctx.arc(px(post.x), px(post.y), POST_RADIUS * k, 0, Math.PI * 2);
        ctx.fill();
      }
      const { x, y } = state.attacker.position;
      ctx.beginPath();
      ctx.arc(px(x), px(y), TUNING.attackerRadius * k, 0, Math.PI * 2);
      ctx.fillStyle = ATTACKER_FILL;
      ctx.fill();
      ctx.strokeStyle = ATTACKER_OUTLINE;
      ctx.lineWidth = Math.max(1, k * 0.04);
      ctx.stroke();
      const ball = state.ball.position;
      ctx.beginPath();
      ctx.arc(ball.x * k, ball.y * k, TUNING.ballRadius * k, 0, Math.PI * 2);
      ctx.fillStyle = BALL_FILL;
      ctx.fill();
    },
  };
}
