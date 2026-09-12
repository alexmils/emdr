import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  blsPrefsStorageKey,
  clearBlsPrefs,
  isDefaultBlsSettings,
  loadBlsPrefs,
  parseBlsSettings,
  saveBlsPrefs,
  blsBackgroundIsDark,
} from "../lib/bls-prefs.ts";
import {
  DEFAULT_BLS_SPEED_PRESETS,
  normalizeSpeedPresets,
  clampBlsSpeed,
  BLS_SPEED_MAX,
  BLS_SPEED_MIN,
} from "../lib/bls-speed.ts";
import {
  adjustRepeatMode,
  clampBlsRepeatsCount,
  parseRepeatMode,
  repeatsLimit,
} from "../lib/bls-repeats.ts";
import { DEFAULT_BLS } from "../lib/types.ts";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key() {
      return null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe("blsPrefsStorageKey", () => {
  it("scopes by user id", () => {
    assert.equal(blsPrefsStorageKey(null), "emdr_bls_prefs_v1:anon");
    assert.equal(blsPrefsStorageKey("u1"), "emdr_bls_prefs_v1:u1");
  });
});

describe("speed presets range", () => {
  it("allows 0.1 through 5", () => {
    assert.equal(BLS_SPEED_MIN, 0.1);
    assert.equal(BLS_SPEED_MAX, 5);
    assert.equal(clampBlsSpeed(0.05), 0.1);
    assert.equal(clampBlsSpeed(9), 5);
    assert.equal(clampBlsSpeed(1.25), 1.3);
  });

  it("migrates legacy 0.5/1/2 defaults to 0.1/1/5", () => {
    assert.deepEqual(normalizeSpeedPresets([0.5, 1, 2]), [
      ...DEFAULT_BLS_SPEED_PRESETS,
    ]);
    assert.deepEqual(DEFAULT_BLS.speedPresets, [0.1, 1, 5]);
  });

  it("keeps custom trios inside the new range", () => {
    assert.deepEqual(normalizeSpeedPresets([0.2, 1.5, 4]), [0.2, 1.5, 4]);
  });
});

describe("repeats", () => {
  it("parses string and number counts", () => {
    assert.equal(parseRepeatMode("24"), 24);
    assert.equal(parseRepeatMode(36), 36);
    assert.equal(parseRepeatMode("infinity"), "infinity");
    assert.equal(parseRepeatMode("12"), 12);
    assert.equal(parseRepeatMode("nope"), 24);
  });

  it("clamps and adjusts with arrows", () => {
    assert.equal(clampBlsRepeatsCount(0), 1);
    assert.equal(clampBlsRepeatsCount(2000), 999);
    assert.equal(adjustRepeatMode(24, 1), 25);
    assert.equal(adjustRepeatMode(24, -1), 23);
    assert.equal(adjustRepeatMode(1, -1), 1);
    assert.equal(adjustRepeatMode(999, 1), 999);
    assert.equal(adjustRepeatMode("infinity", -1), 24);
    assert.equal(adjustRepeatMode("infinity", 1), "infinity");
    assert.equal(repeatsLimit(24), 24);
    assert.equal(repeatsLimit("infinity"), Infinity);
  });
});

describe("parseBlsSettings", () => {
  it("returns null for garbage", () => {
    assert.equal(parseBlsSettings(null), null);
    assert.equal(parseBlsSettings("x"), null);
    assert.equal(parseBlsSettings(42), null);
  });

  it("fills defaults for partial objects", () => {
    const parsed = parseBlsSettings({
      ballColor: "#00FF00",
      background: "#FF0000",
      ballSize: 48,
    });
    assert.ok(parsed);
    assert.equal(parsed!.ballColor, "#00ff00");
    assert.equal(parsed!.background, "#ff0000");
    assert.equal(parsed!.ballSize, 48);
    assert.equal(parsed!.sound, DEFAULT_BLS.sound);
    assert.equal(parsed!.animation, DEFAULT_BLS.animation);
    assert.equal(parsed!.repeats, DEFAULT_BLS.repeats);
  });

  it("clamps speed, size, and rejects bad enums/colors", () => {
    const parsed = parseBlsSettings({
      speedPresets: [0.05, 9, 1.25],
      activeSpeedPreset: 1,
      ballSize: 999,
      ballColor: "red",
      background: "#fff",
      sound: "laser",
      animation: "spin",
      repeats: "bad",
      vibration: "mega",
      setLengthSec: 3,
    });
    assert.ok(parsed);
    assert.deepEqual(parsed!.speedPresets, [0.1, 5, 1.3]);
    assert.equal(parsed!.ballSize, 80);
    assert.equal(parsed!.ballColor, DEFAULT_BLS.ballColor);
    assert.equal(parsed!.background, DEFAULT_BLS.background);
    assert.equal(parsed!.sound, DEFAULT_BLS.sound);
    assert.equal(parsed!.animation, DEFAULT_BLS.animation);
    assert.equal(parsed!.repeats, DEFAULT_BLS.repeats);
    assert.equal(parsed!.vibration, DEFAULT_BLS.vibration);
    assert.equal(parsed!.setLengthSec, 10);
  });

  it("migrates legacy speed defaults and accepts numeric repeats", () => {
    const parsed = parseBlsSettings({
      speedPresets: [0.5, 1.0, 2.0],
      activeSpeedPreset: 1,
      repeats: "36",
      setLengthSec: 38,
      sound: "click",
      animation: "dot",
      ballColor: "#22c55e",
      ballSize: 48,
      background: "#ef4444",
      vibration: "soft",
    });
    assert.ok(parsed);
    assert.deepEqual(parsed!.speedPresets, [0.1, 1, 5]);
    assert.equal(parsed!.repeats, 36);
  });

  it("accepts a full custom Look + dock prefs", () => {
    const custom = {
      speedPresets: [0.1, 1.0, 5.0] as [number, number, number],
      activeSpeedPreset: 1 as const,
      repeats: 24,
      setLengthSec: 38,
      sound: "click" as const,
      animation: "dot" as const,
      ballColor: "#22c55e",
      background: "#ef4444",
      ballSize: 48,
      vibration: "soft" as const,
    };
    const parsed = parseBlsSettings(custom);
    assert.deepEqual(parsed, {
      ...custom,
      ballColor: "#22c55e",
      background: "#ef4444",
    });
    assert.equal(isDefaultBlsSettings(parsed!), false);
  });
});

describe("load/save/clearBlsPrefs", () => {
  it("round-trips through storage and clears on reset", () => {
    const store = memoryStorage();
    const custom = {
      ...DEFAULT_BLS,
      speedPresets: [0.1, 1.0, 5.0] as [number, number, number],
      ballColor: "#22c55e",
      background: "#ef4444",
      ballSize: 48,
    };
    saveBlsPrefs("user-a", custom, store);
    const loaded = loadBlsPrefs("user-a", store);
    assert.equal(loaded.ballColor, "#22c55e");
    assert.equal(loaded.background, "#ef4444");

    clearBlsPrefs("user-a", store);
    const after = loadBlsPrefs("user-a", store);
    assert.equal(isDefaultBlsSettings(after), true);
  });

  it("keeps anon and user keys separate", () => {
    const store = memoryStorage();
    saveBlsPrefs(null, { ...DEFAULT_BLS, background: "#111111" }, store);
    saveBlsPrefs("u2", { ...DEFAULT_BLS, background: "#abcdef" }, store);
    assert.equal(loadBlsPrefs(null, store).background, "#111111");
    assert.equal(loadBlsPrefs("u2", store).background, "#abcdef");
  });
});

describe("isDefaultBlsSettings", () => {
  it("matches DEFAULT_BLS", () => {
    assert.equal(isDefaultBlsSettings(DEFAULT_BLS), true);
    assert.equal(
      isDefaultBlsSettings({ ...DEFAULT_BLS, ballColor: "#000001" }),
      false
    );
  });
});

describe("blsBackgroundIsDark", () => {
  it("classifies white/mint as light and red/black as dark", () => {
    assert.equal(blsBackgroundIsDark("#ffffff"), false);
    assert.equal(blsBackgroundIsDark("#dff5e0"), false);
    assert.equal(blsBackgroundIsDark("#ef4444"), true);
    assert.equal(blsBackgroundIsDark("#000000"), true);
    assert.equal(blsBackgroundIsDark("nope"), false);
  });
});
