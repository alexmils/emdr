export const BLS_SPEED_MIN = 0.1;
export const BLS_SPEED_MAX = 5;
export const BLS_SPEED_STEP = 0.1;

/** Legacy dock defaults before the 0.1 / 1 / 5 range. */
export const LEGACY_BLS_SPEED_PRESETS: [number, number, number] = [0.5, 1, 2];
export const DEFAULT_BLS_SPEED_PRESETS: [number, number, number] = [0.1, 1, 5];

/** Clamp a preset trio; migrate exact legacy defaults to the new trio. */
export function normalizeSpeedPresets(
  presets: [number, number, number]
): [number, number, number] {
  const clamped: [number, number, number] = [
    clampBlsSpeed(presets[0]),
    clampBlsSpeed(presets[1]),
    clampBlsSpeed(presets[2]),
  ];
  if (
    clamped[0] === LEGACY_BLS_SPEED_PRESETS[0] &&
    clamped[1] === LEGACY_BLS_SPEED_PRESETS[1] &&
    clamped[2] === LEGACY_BLS_SPEED_PRESETS[2]
  ) {
    return [...DEFAULT_BLS_SPEED_PRESETS];
  }
  return clamped;
}

export function clampBlsSpeed(hz: number): number {
  return (
    Math.round(Math.min(BLS_SPEED_MAX, Math.max(BLS_SPEED_MIN, hz)) * 10) / 10
  );
}

export function adjustBlsSpeed(hz: number, direction: 1 | -1): number {
  return clampBlsSpeed(hz + direction * BLS_SPEED_STEP);
}

export function getActiveSpeedHz(bls: {
  speedPresets: [number, number, number];
  activeSpeedPreset: 0 | 1 | 2;
}): number {
  return bls.speedPresets[bls.activeSpeedPreset];
}

export function adjustSpeedPreset(
  presets: [number, number, number],
  index: 0 | 1 | 2,
  direction: 1 | -1
): [number, number, number] {
  const next: [number, number, number] = [...presets];
  next[index] = adjustBlsSpeed(presets[index], direction);
  return next;
}