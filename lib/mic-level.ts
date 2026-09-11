/** Mic level helpers for voice UI (RMS + smoothing). Browser-only capture lives in useMicLevel. */

/** 0–1 RMS from AnalyserNode time-domain bytes (128 = silence). */
export function rmsFromTimeDomain(data: Uint8Array): number {
  if (data.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = (data[i]! - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / data.length);
}

/** Map raw RMS into a UI-friendly 0–1 with a soft noise gate. */
export function normalizeMicRms(rms: number, gate = 0.02, gain = 4.2): number {
  const gated = Math.max(0, rms - gate);
  return Math.min(1, gated * gain);
}

/** Attack/release smoothing so bars don’t flicker. */
export function smoothLevel(
  prev: number,
  next: number,
  attack = 0.42,
  release = 0.14
): number {
  const t = next > prev ? attack : release;
  return prev + (next - prev) * t;
}

/**
 * Bar heights for a soft “ribbon” meter (center louder).
 * `level` 0–1; `t` is time in seconds for idle breath / speaking sway.
 */
export function ribbonBarHeights(
  level: number,
  barCount: number,
  t: number,
  mode: "listening" | "ambient" | "quiet"
): number[] {
  const n = Math.max(1, barCount);
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const center = (i - (n - 1) / 2) / ((n - 1) / 2 || 1);
    const envelope = 1 - Math.abs(center) * 0.45;
    if (mode === "quiet") {
      out.push(0.12 + envelope * 0.06);
      continue;
    }
    if (mode === "ambient") {
      const wobble =
        0.22 +
        envelope * 0.28 +
        Math.sin(t * 2.1 + i * 0.7) * 0.1 +
        Math.sin(t * 3.4 + i) * 0.05;
      out.push(Math.min(0.85, Math.max(0.12, wobble)));
      continue;
    }
    const speech =
      0.14 +
      level * envelope * 0.86 +
      Math.sin(t * 14 + i * 1.1) * level * 0.12;
    out.push(Math.min(1, Math.max(0.1, speech)));
  }
  return out;
}
