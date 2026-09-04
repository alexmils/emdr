export const BLS_SPEED_MIN = 0.5;
export const BLS_SPEED_MAX = 2;
export const BLS_SPEED_STEP = 0.1;

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