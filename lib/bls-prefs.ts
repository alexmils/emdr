/**
 * Persist Free/Guided BLS Adjustments (speed, look, sound, …) in localStorage.
 * Per-user key when signed in; anon fallback before /api/auth/me.
 * Not platform freeSessionChromeId (admin chrome theme).
 */

import { normalizeSpeedPresets } from "@/lib/bls-speed";
import { parseRepeatMode } from "@/lib/bls-repeats";
import {
  DEFAULT_BLS,
  type AnimationMode,
  type BlsSettings,
  type SoundMode,
  type SpeedPresetIndex,
  type VibrationMode,
} from "@/lib/types";

export const BLS_PREFS_STORAGE_PREFIX = "emdr_bls_prefs_v1";

const SOUND_MODES = new Set<SoundMode>(["mute", "click", "pulse", "tone"]);
const ANIMATIONS = new Set<AnimationMode>(["dot", "flash"]);
const VIBRATIONS = new Set<VibrationMode>(["none", "soft", "hard"]);

export function blsPrefsStorageKey(userId: string | null): string {
  return userId
    ? `${BLS_PREFS_STORAGE_PREFIX}:${userId}`
    : `${BLS_PREFS_STORAGE_PREFIX}:anon`;
}

function isHexColor(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
}

function clampBallSize(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_BLS.ballSize;
  return Math.min(80, Math.max(24, Math.round(n)));
}

function clampSetLengthSec(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_BLS.setLengthSec;
  return Math.min(600, Math.max(10, Math.round(n)));
}

/** Validate / normalize unknown JSON into BlsSettings, or null if unusable. */
export function parseBlsSettings(raw: unknown): BlsSettings | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;

  let speedPresets: [number, number, number] = [...DEFAULT_BLS.speedPresets];
  if (Array.isArray(o.speedPresets) && o.speedPresets.length >= 3) {
    speedPresets = normalizeSpeedPresets([
      Number(o.speedPresets[0]),
      Number(o.speedPresets[1]),
      Number(o.speedPresets[2]),
    ]);
  }

  let activeSpeedPreset: SpeedPresetIndex = DEFAULT_BLS.activeSpeedPreset;
  if (o.activeSpeedPreset === 0 || o.activeSpeedPreset === 1 || o.activeSpeedPreset === 2) {
    activeSpeedPreset = o.activeSpeedPreset;
  }

  const repeats = parseRepeatMode(o.repeats);

  const sound =
    typeof o.sound === "string" && SOUND_MODES.has(o.sound as SoundMode)
      ? (o.sound as SoundMode)
      : DEFAULT_BLS.sound;

  const animation =
    typeof o.animation === "string" && ANIMATIONS.has(o.animation as AnimationMode)
      ? (o.animation as AnimationMode)
      : DEFAULT_BLS.animation;

  const vibration =
    typeof o.vibration === "string" && VIBRATIONS.has(o.vibration as VibrationMode)
      ? (o.vibration as VibrationMode)
      : DEFAULT_BLS.vibration;

  return {
    speedPresets,
    activeSpeedPreset,
    repeats,
    setLengthSec: clampSetLengthSec(Number(o.setLengthSec)),
    sound,
    animation,
    ballColor: isHexColor(o.ballColor) ? o.ballColor.toLowerCase() : DEFAULT_BLS.ballColor,
    ballSize: clampBallSize(Number(o.ballSize)),
    background: isHexColor(o.background) ? o.background.toLowerCase() : DEFAULT_BLS.background,
    vibration,
  };
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function loadBlsPrefs(
  userId: string | null,
  storage?: StorageLike | null
): BlsSettings {
  const store =
    storage ??
    (typeof window !== "undefined" ? window.localStorage : null);
  if (!store) return { ...DEFAULT_BLS, speedPresets: [...DEFAULT_BLS.speedPresets] };

  try {
    const raw = store.getItem(blsPrefsStorageKey(userId));
    if (!raw) {
      return { ...DEFAULT_BLS, speedPresets: [...DEFAULT_BLS.speedPresets] };
    }
    const parsed = parseBlsSettings(JSON.parse(raw) as unknown);
    return parsed ?? { ...DEFAULT_BLS, speedPresets: [...DEFAULT_BLS.speedPresets] };
  } catch {
    return { ...DEFAULT_BLS, speedPresets: [...DEFAULT_BLS.speedPresets] };
  }
}

export function saveBlsPrefs(
  userId: string | null,
  bls: BlsSettings,
  storage?: StorageLike | null
): void {
  const store =
    storage ??
    (typeof window !== "undefined" ? window.localStorage : null);
  if (!store) return;
  try {
    const normalized = parseBlsSettings(bls) ?? DEFAULT_BLS;
    store.setItem(blsPrefsStorageKey(userId), JSON.stringify(normalized));
  } catch {
    // ignore quota / private mode
  }
}

export function clearBlsPrefs(
  userId: string | null,
  storage?: StorageLike | null
): void {
  const store =
    storage ??
    (typeof window !== "undefined" ? window.localStorage : null);
  if (!store) return;
  try {
    store.removeItem(blsPrefsStorageKey(userId));
  } catch {
    // ignore
  }
}

/** Relative luminance threshold for idle-hint ink vs light text on Look background. */
export function blsBackgroundIsDark(hex: string): boolean {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return L < 0.55;
}

/** True when settings match product defaults (used after Reset). */
export function isDefaultBlsSettings(bls: BlsSettings): boolean {
  const d = DEFAULT_BLS;
  return (
    bls.activeSpeedPreset === d.activeSpeedPreset &&
    bls.repeats === d.repeats &&
    bls.setLengthSec === d.setLengthSec &&
    bls.sound === d.sound &&
    bls.animation === d.animation &&
    bls.ballColor.toLowerCase() === d.ballColor.toLowerCase() &&
    bls.ballSize === d.ballSize &&
    bls.background.toLowerCase() === d.background.toLowerCase() &&
    bls.vibration === d.vibration &&
    bls.speedPresets.length === 3 &&
    bls.speedPresets[0] === d.speedPresets[0] &&
    bls.speedPresets[1] === d.speedPresets[1] &&
    bls.speedPresets[2] === d.speedPresets[2]
  );
}
