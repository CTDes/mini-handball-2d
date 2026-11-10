import type { GameState } from "../sim/state";
import type { GameEvent } from "../sim/tick";
import type { Vec2 } from "../sim/geometry";
import { PITCH, type Ellipse } from "../sim/pitch";
import { TUNING } from "../sim/tuning";

/** Metres of space drawn around the pitch so the goal behind the goal line is visible. */
const MARGIN = 2;
const GOAL_DEPTH = 1.5;
/** Pixels of window height left for the page header above the canvas. */
const HEADER_ALLOWANCE = 120;
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
const AIM_LINE = "#fbd38d";
const BAR_BACK = "#1a202c";
const BAR_FILL = "#f56565";

/** Canvas renderer: square pitch sized to the container, capped by the window height. */
export function createRenderer(canvas: HTMLCanvasElement): {
  draw(state: GameState, events: readonly GameEvent[], alpha: number): void;
  /** Mouse position (client CSS pixels) to pitch metres; the inverse of the drawing transform. */
  toPitch(clientX: number, clientY: number): Vec2;
} {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d canvas context unavailable");
  let size = 0;

  const resize = (): void => {
    const available = canvas.parentElement?.clientWidth ?? window.innerWidth;
    size = Math.max(1, Math.floor(Math.min(available, window.innerHeight - HEADER_ALLOWANCE)));
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${String(size)}px`;
    canvas.style.height = `${String(size)}px`;
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
  };
  resize();
  window.addEventListener("resize", resize);

  return {
    toPitch(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const span = PITCH.width + 2 * MARGIN;
      return {
        x: ((clientX - rect.left) * span) / rect.width - MARGIN,
        y: ((clientY - rect.top) * span) / rect.height - MARGIN,
      };
    },
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
        ctx.arc(px(post.x), px(post.y), TUNING.postRadius * k, 0, Math.PI * 2);
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
      ctx.arc(px(ball.x), px(ball.y), TUNING.ballRadius * k, 0, Math.PI * 2);
      ctx.fillStyle = BALL_FILL;
      ctx.fill();
      if (state.phase === "held" || state.phase === "charging") {
        ctx.beginPath();
        ctx.moveTo(px(x), px(y));
        ctx.lineTo(px(state.aim.x), px(state.aim.y));
        ctx.strokeStyle = AIM_LINE;
        ctx.lineWidth = Math.max(1, k * 0.05);
        ctx.setLineDash([k * TUNING.aimDash, k * TUNING.aimGap]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(px(state.aim.x), px(state.aim.y), TUNING.aimReticleRadius * k, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (state.phase === "charging") {
        const w = TUNING.powerBarWidth * k;
        const h = TUNING.powerBarHeight * k;
        const bx = px(x) - w / 2;
        const by = px(y - TUNING.powerBarOffset) - h / 2;
        ctx.fillStyle = BAR_BACK;
        ctx.fillRect(bx, by, w, h);
        ctx.fillStyle = BAR_FILL;
        ctx.fillRect(bx, by, w * state.power, h);
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = Math.max(1, k * 0.03);
        ctx.strokeRect(bx, by, w, h);
      }
    },
  };
}
