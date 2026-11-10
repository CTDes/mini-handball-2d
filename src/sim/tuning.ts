/** Every named number that shapes the feel. Metres, seconds and metres per second. */
const pitchWidth = 20;
const attackerRadius = 0.4;
const ballRadius = 0.15;

export const TUNING = {
  pitchWidth,
  pitchLength: 20,
  goalWidth: 3,
  goalAreaRx: 7.5,
  goalAreaRy: 6,
  freeThrowRx: 10.5,
  freeThrowRy: 9,
  dangerZoneDepth: 4,
  /** Centre of the goal line, the point the held ball points at. */
  goalCentre: { x: pitchWidth / 2, y: 0 },
  attackerRadius,
  ballRadius,
  /** Distance from the attacker's centre to the held ball's centre. */
  carryDistance: attackerRadius + ballRadius,
  attackerSpeed: 6,
  tickDuration: 1 / 60,
  attackerStart: { x: 10, y: 13 },
  /** Ball speed at power 0 and at power 1 (m/s). */
  minShotSpeed: 8,
  maxShotSpeed: 22,
  /** Seconds for a full power cycle 0 -> 1 -> 0 while the shoot control is held. */
  powerSweepDuration: 1.2,
  /** Seconds the out ball rests before the ball returns to the attacker (converted to ticks). */
  resolvedPause: 1,
  /** Power bar size and offset above the attacker's centre, in metres. */
  powerBarWidth: 1.6,
  powerBarHeight: 0.25,
  powerBarOffset: 0.9,
} as const;
