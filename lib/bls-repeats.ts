import type { RepeatMode } from "@/lib/types";

export const BLS_REPEATS_MIN = 1;
export const BLS_REPEATS_MAX = 999;
export const BLS_REPEATS_DEFAULT = 24;

export function clampBlsRepeatsCount(n: number): number {
  if (!Number.isFinite(n)) return BLS_REPEATS_DEFAULT;
  return Math.min(
    BLS_REPEATS_MAX,
    Math.max(BLS_REPEATS_MIN, Math.round(n))
  );
}

/** Normalize stored / UI values into RepeatMode (`number` | `"infinity"`). */
export function parseRepeatMode(raw: unknown): RepeatMode {
  if (raw === "infinity") return "infinity";
  if (typeof raw === "number") return clampBlsRepeatsCount(raw);
  if (typeof raw === "string") {
    if (raw === "infinity") return "infinity";
    if (/^\d+$/.test(raw)) return clampBlsRepeatsCount(Number(raw));
  }
  return BLS_REPEATS_DEFAULT;
}

/** ArrowUp (+1) / ArrowDown (−1) for the dock & number inputs. */
export function adjustRepeatMode(
  current: RepeatMode,
  direction: 1 | -1
): RepeatMode {
  if (current === "infinity") {
    return direction === -1 ? BLS_REPEATS_DEFAULT : "infinity";
  }
  return clampBlsRepeatsCount(current + direction);
}

/** Pass limit for the ball canvas (Infinity when unlimited). */
export function repeatsLimit(repeats: RepeatMode): number {
  return repeats === "infinity" ? Infinity : repeats;
}

export function formatRepeatsLabel(repeats: RepeatMode): string {
  return repeats === "infinity" ? "∞" : String(repeats);
}
