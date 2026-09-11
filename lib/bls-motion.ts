/** Axis for bilateral ball motion from viewport aspect. */

export type BlsMotionAxis = "horizontal" | "vertical";

/**
 * Sweep along the longer edge so the ball travels edge-to-edge:
 * landscape (wide) → left/right; portrait (tall) → top/bottom.
 */
export function motionAxisFromSize(
  width: number,
  height: number
): BlsMotionAxis {
  if (!Number.isFinite(width) || !Number.isFinite(height)) return "horizontal";
  if (width <= 0 || height <= 0) return "horizontal";
  return width >= height ? "horizontal" : "vertical";
}
