import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  metaMoneyFromPlanPrice,
  trackMetaEvent,
} from "@/lib/meta-pixel";

describe("meta-pixel", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    const store = new Map<string, string>();
    // @ts-expect-error test stub
    globalThis.window = {
      dataLayer: [],
      fbq: undefined,
      sessionStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
      },
    };
  });

  afterEach(() => {
    // @ts-expect-error restore
    globalThis.window = originalWindow;
  });

  it("parses display prices", () => {
    assert.deepEqual(metaMoneyFromPlanPrice("€14.99"), {
      value: 14.99,
      currency: "EUR",
    });
    assert.deepEqual(metaMoneyFromPlanPrice("$99"), {
      value: 99,
      currency: "USD",
    });
    assert.equal(metaMoneyFromPlanPrice(undefined).currency, "USD");
  });

  it("pushes dataLayer and fbq when available", () => {
    const calls: unknown[][] = [];
    window.fbq = (...args: unknown[]) => {
      calls.push(args);
    };
    trackMetaEvent("CompleteRegistration", { status: true });
    assert.equal(window.dataLayer?.length, 1);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], [
      "track",
      "CompleteRegistration",
      { status: true },
    ]);
  });

  it("dedupes with onceKey", () => {
    const calls: unknown[][] = [];
    window.fbq = (...args: unknown[]) => {
      calls.push(args);
    };
    trackMetaEvent("StartTrial", {}, { onceKey: "start_trial" });
    trackMetaEvent("StartTrial", {}, { onceKey: "start_trial" });
    assert.equal(calls.length, 1);
  });
});
