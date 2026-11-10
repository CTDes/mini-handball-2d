import {
  add,
  clampToRect,
  insideRect,
  length,
  normalize,
  subtract,
  pushOutOfEllipse,
  reflect,
  sweepSegmentCircle,
  scale,
  type Ellipse,
  type SegmentContact,
  type Vec2,
} from "./geometry";
import type { Intent } from "./intent";
import { PITCH } from "./pitch";
import type { Rng } from "./rng";
import { carriedBallPosition, initialState, type GameState } from "./state";
import { recordGoal, recordShot } from "./stats";
import { TUNING } from "./tuning";

/** What happened in a tick. */
export type GameEvent =
  | {
      readonly type: "shot";
      readonly position: Vec2;
      readonly power: number;
      readonly velocity: Vec2;
    }
  | { readonly type: "out"; readonly position: Vec2 }
  | { readonly type: "post-hit"; readonly position: Vec2 }
  | { readonly type: "goal"; readonly position: Vec2 }
  | { readonly type: "play-reset"; readonly position: Vec2 };

const pitchRect = { min: { x: 0, y: 0 }, max: { x: PITCH.width, y: PITCH.length } };
/** Cap on post contacts within one tick, so a tick always ends. */
const maxContacts = 4;
const sweepTicks = Math.max(2, Math.round(TUNING.powerSweepDuration / TUNING.tickDuration));
const pauseTicks = Math.max(1, Math.round(TUNING.resolvedPause / TUNING.tickDuration));

/** Triangle wave: 0 at 0, 1 at half the sweep, 0 at the full sweep. */
function powerAt(chargeTicks: number): number {
  const phase = (chargeTicks % sweepTicks) / sweepTicks;
  return phase <= 0.5 ? phase * 2 : (1 - phase) * 2;
}

const component = (n: number): number => (Number.isNaN(n) ? 0 : Math.min(Math.max(n, -1), 1));

/** The goal area grown by the attacker radius: where the attacker's centre may not be. */
const forbidden: Ellipse = {
  centre: PITCH.goalArea.centre,
  rx: PITCH.goalArea.rx + TUNING.attackerRadius,
  ry: PITCH.goalArea.ry + TUNING.attackerRadius,
};

/** A non-finite aim component falls back to the goal centre. */
function aimPoint(raw: Vec2): Vec2 {
  return Number.isFinite(raw.x) && Number.isFinite(raw.y)
    ? { x: raw.x, y: raw.y }
    : { ...TUNING.goalCentre };
}

function movement(raw: Vec2): Vec2 {
  const v = { x: component(raw.x), y: component(raw.y) };
  const l = length(v);
  return l > 1 ? scale(v, 1 / l) : v;
}

export function tick(
  state: GameState,
  intent: Intent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the AI will use it from a later milestone
  _rng: Rng,
): { state: GameState; events: GameEvent[] } {
  if (intent.restart) {
    return { state: { ...initialState(state.seed), tick: state.tick + 1 }, events: [] };
  }
  const step = scale(movement(intent.move), TUNING.attackerSpeed * TUNING.tickDuration);
  const moved = add(state.attacker.position, step);
  const r = TUNING.attackerRadius;
  const onPitch = clampToRect(moved, {
    min: { x: r, y: r },
    max: { x: TUNING.pitchWidth - r, y: TUNING.pitchLength - r },
  });
  const position = pushOutOfEllipse(onPitch, forbidden);
  const base = {
    ...state,
    attacker: { ...state.attacker, position },
    aim: aimPoint(intent.aim),
    tick: state.tick + 1,
  };
  const carried = (): GameState["ball"] => ({
    position: carriedBallPosition(position),
    held: true,
    velocity: { x: 0, y: 0 },
  });

  switch (state.phase) {
    case "held":
      if (intent.shootHeld && state.shootArmed) {
        return {
          state: { ...base, phase: "charging", power: 0, chargeTicks: 0, ball: carried() },
          events: [],
        };
      }
      return {
        state: { ...base, shootArmed: state.shootArmed || !intent.shootHeld, ball: carried() },
        events: [],
      };
    case "charging": {
      if (intent.shootHeld) {
        const chargeTicks = state.chargeTicks + 1;
        return {
          state: { ...base, chargeTicks, power: powerAt(chargeTicks), ball: carried() },
          events: [],
        };
      }
      // Direction from the attacker's position after this tick's movement.
      const towards = subtract(base.aim, position);
      const direction = normalize(
        length(towards) === 0 ? subtract(TUNING.goalCentre, position) : towards,
      );
      const speed = TUNING.minShotSpeed + state.power * (TUNING.maxShotSpeed - TUNING.minShotSpeed);
      const velocity = scale(direction, speed);
      const ballPosition = add(position, scale(direction, TUNING.carryDistance));
      return {
        state: {
          ...base,
          ...recordShot(state),
          phase: "flight",
          chargeTicks: 0,
          shootArmed: false,
          ball: { position: ballPosition, held: false, velocity },
        },
        events: [{ type: "shot", position: ballPosition, power: state.power, velocity }],
      };
    }
    case "flight": {
      const events: GameEvent[] = [];
      const reach = TUNING.postRadius + TUNING.ballRadius;
      let at = state.ball.position;
      let velocity = state.ball.velocity;
      let remaining = TUNING.tickDuration;
      let settled = false;
      for (let contacts = 0; contacts < maxContacts && !settled; contacts++) {
        const target = add(at, scale(velocity, remaining));
        let first: SegmentContact | null = null;
        for (const post of PITCH.posts) {
          const hit = sweepSegmentCircle(at, target, post, reach);
          if (hit && (first === null || hit.t < first.t)) first = hit;
        }
        if (first === null) {
          at = target;
          settled = true;
        } else {
          velocity = reflect(velocity, first.normal);
          remaining *= 1 - first.t;
          at = first.point;
          events.push({ type: "post-hit", position: first.point });
        }
      }
      const inMouth =
        at.y < 0 &&
        at.x > PITCH.posts[0].x + TUNING.postRadius &&
        at.x < PITCH.posts[1].x - TUNING.postRadius;
      if (inMouth && at.y <= -TUNING.ballRadius) {
        events.push({ type: "goal", position: at });
      } else if (!inMouth && !insideRect(at, pitchRect)) {
        events.push({ type: "out", position: at });
      } else {
        return {
          state: { ...base, ball: { position: at, held: false, velocity } },
          events,
        };
      }
      const scored = events.some((e) => e.type === "goal");
      return {
        state: {
          ...base,
          ...(scored ? recordGoal(state) : {}),
          phase: "resolved",
          resolvedTicks: pauseTicks,
          ball: { position: at, held: false, velocity: { x: 0, y: 0 } },
        },
        events,
      };
    }
    case "resolved": {
      const resolvedTicks = state.resolvedTicks - 1;
      if (resolvedTicks > 0) return { state: { ...base, resolvedTicks }, events: [] };
      const ball = carried();
      return {
        state: { ...base, phase: "held", power: 0, resolvedTicks: 0, ball },
        events: [{ type: "play-reset", position: ball.position }],
      };
    }
  }
}
