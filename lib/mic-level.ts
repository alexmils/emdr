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

/** Attack/release smoothing so motion doesn’t flicker. */
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
 * Peak displacement in viewBox units — always readable, mic boosts further.
 * Idle listening still breathes; never a flat line.
 */
export function waveAmplitude(
  level: number,
  mode: "listening" | "ambient" | "quiet"
): number {
  const voice = Math.min(1, Math.max(0, level));
  if (mode === "quiet") return 10;
  if (mode === "ambient") return 16 + voice * 8;
  // Base wobble ~18 even in silence; speech can reach ~36
  return 18 + Math.max(voice, 0.12) * 22;
}

/**
 * Soft S-curve ribbon (Nura wave vernacular).
 * Uses enough vertical travel to read clearly at ~4rem tall.
 */
export function buildVoiceWavePath(
  width: number,
  height: number,
  t: number,
  amplitude: number,
  lag = 0
): string {
  const mid = height / 2;
  const step = 4;
  const parts: string[] = [];
  for (let x = 0; x <= width; x += step) {
    const nx = x / width;
    // Envelope: stronger in the middle (logo-like), soft tips
    const envelope = Math.sin(nx * Math.PI);
    const y =
      mid +
      envelope *
        (Math.sin(nx * Math.PI * 2.4 + t * 2.4 + lag) * amplitude +
          Math.sin(nx * Math.PI * 4.8 + t * 3.1 + lag * 1.3) *
            amplitude *
            0.35 +
          Math.sin(t * 1.7 + lag) * amplitude * 0.08);
    parts.push(`${x === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return parts.join(" ");
}
