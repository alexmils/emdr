/**
 * Shared BLS ball travel math.
 * Legacy loop assumed 60fps fixed steps: step = (1/60) / period * 0.5
 * → velocity = 0.5 * Hz (normalized 0→1 units per second one way).
 */

export function blsBallVelocity(hz: number): number {
  const safe = Number.isFinite(hz) && hz > 0 ? hz : 1;
  return 0.5 * safe;
}

/** Advance position for one frame; `dtSec` capped by caller after tab blur. */
export function blsBallStep(hz: number, dtSec: number): number {
  return blsBallVelocity(hz) * Math.max(0, dtSec);
}

/** Cap frame delta so a backgrounded tab does not jump the ball. */
export const BLS_BALL_MAX_DT_SEC = 1 / 30;
