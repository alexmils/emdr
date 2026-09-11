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

/** Peak displacement for free wave ribbons (Canvas height ~80). */
export function waveAmplitude(
  level: number,
  mode: "listening" | "ambient" | "quiet"
): number {
  const voice = Math.min(1, Math.max(0, level));
  if (mode === "quiet") return 10;
  // Agent voice / thinking: calm low breath — distinct from listening
  if (mode === "ambient") return 12 + voice * 5;
  // Listening: quiet idle, clear punch when the mic hears speech
  return 9 + voice * 26;
}

function sampleWaveY(
  nx: number,
  mid: number,
  t: number,
  amplitude: number,
  lag: number
): number {
  // Keep tips alive (floor 0.4) so the ribbon reads across the full disk
  const envelope = 0.4 + 0.6 * Math.sin(nx * Math.PI);
  return (
    mid +
    envelope *
      (Math.sin(nx * Math.PI * 1.5 + t * 2.0 + lag) * amplitude +
        Math.sin(nx * Math.PI * 2.8 + t * 2.6 + lag * 1.1) * amplitude * 0.18)
  );
}

function pointsToCubicPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return "";
  let d = `M${pts[0]!.x.toFixed(2)} ${pts[0]!.y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/**
 * Smooth cubic stroke across the orb (full width, no jagged L segments).
 */
export function buildVoiceWavePath(
  width: number,
  height: number,
  t: number,
  amplitude: number,
  lag = 0,
  samples = 32
): string {
  const mid = height / 2;
  const n = Math.max(10, samples);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const nx = i / n;
    pts.push({
      x: nx * width,
      y: sampleWaveY(nx, mid, t, amplitude, lag),
    });
  }
  return pointsToCubicPath(pts);
}

/**
 * Filled soft ribbon (upper + lower edge) — reads as a continuous band, not a broken line.
 */
export function buildVoiceRibbonBand(
  width: number,
  height: number,
  t: number,
  amplitude: number,
  thickness: number,
  lag = 0,
  samples = 32
): string {
  const mid = height / 2;
  const n = Math.max(10, samples);
  const top: { x: number; y: number }[] = [];
  const bot: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const nx = i / n;
    const y = sampleWaveY(nx, mid, t, amplitude, lag);
    const x = nx * width;
    top.push({ x, y: y - thickness / 2 });
    bot.push({ x, y: y + thickness / 2 });
  }
  const forward = pointsToCubicPath(top);
  // reverse bottom with cubics
  bot.reverse();
  let d = forward;
  // line to first bottom point then cubic along bottom
  d += ` L${bot[0]!.x.toFixed(2)} ${bot[0]!.y.toFixed(2)}`;
  for (let i = 0; i < bot.length - 1; i++) {
    const p0 = bot[Math.max(0, i - 1)]!;
    const p1 = bot[i]!;
    const p2 = bot[i + 1]!;
    const p3 = bot[Math.min(bot.length - 1, i + 2)]!;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  d += " Z";
  return d;
}
