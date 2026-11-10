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
} as const;
