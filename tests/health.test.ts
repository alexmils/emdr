import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  coolifyChipLabel,
  coolifyIsHealthy,
  parseCoolifyStatus,
  scoreAdminHealth,
} from "../lib/health-shared.ts";
import {
  DEFAULT_COOLIFY_API_URL,
  DEFAULT_COOLIFY_APP_UUID,
  getCoolifyConfig,
} from "../lib/coolify.ts";

describe("parseCoolifyStatus", () => {
  it("splits running:healthy", () => {
    assert.deepEqual(parseCoolifyStatus("running:healthy"), {
      state: "running",
      health: "healthy",
    });
  });

  it("treats bare running as unknown health", () => {
    assert.deepEqual(parseCoolifyStatus("running"), {
      state: "running",
      health: null,
    });
  });

  it("handles empty", () => {
    assert.deepEqual(parseCoolifyStatus(""), {
      state: "unknown",
      health: null,
    });
  });
});

describe("coolifyIsHealthy", () => {
  it("skips Coolify when not configured", () => {
    assert.equal(
      coolifyIsHealthy({
        configured: false,
        reachable: false,
        state: null,
        health: null,
      }),
      true
    );
  });

  it("accepts running:healthy and running:unknown", () => {
    assert.equal(
      coolifyIsHealthy({
        configured: true,
        reachable: true,
        state: "running",
        health: "healthy",
      }),
      true
    );
    assert.equal(
      coolifyIsHealthy({
        configured: true,
        reachable: true,
        state: "running",
        health: "unknown",
      }),
      true
    );
  });

  it("rejects unhealthy or exited", () => {
    assert.equal(
      coolifyIsHealthy({
        configured: true,
        reachable: true,
        state: "running",
        health: "unhealthy",
      }),
      false
    );
    assert.equal(
      coolifyIsHealthy({
        configured: true,
        reachable: true,
        state: "exited",
        health: "unhealthy",
      }),
      false
    );
    assert.equal(
      coolifyIsHealthy({
        configured: true,
        reachable: false,
        state: null,
        health: null,
      }),
      false
    );
  });
});

describe("scoreAdminHealth", () => {
  it("is 100 when db is up and Coolify is skipped or healthy", () => {
    assert.deepEqual(
      scoreAdminHealth({
        dbOk: true,
        coolifyOk: true,
        coolifyConfigured: false,
      }),
      { ok: true, status: "ok", score: 100 }
    );
    assert.deepEqual(
      scoreAdminHealth({
        dbOk: true,
        coolifyOk: true,
        coolifyConfigured: true,
      }),
      { ok: true, status: "ok", score: 100 }
    );
  });

  it("is down when the database fails", () => {
    assert.deepEqual(
      scoreAdminHealth({
        dbOk: false,
        coolifyOk: true,
        coolifyConfigured: true,
      }),
      { ok: false, status: "down", score: 0 }
    );
  });

  it("is degraded when Coolify is configured and unhealthy", () => {
    assert.deepEqual(
      scoreAdminHealth({
        dbOk: true,
        coolifyOk: false,
        coolifyConfigured: true,
      }),
      { ok: false, status: "degraded", score: 50 }
    );
  });
});

describe("coolifyChipLabel", () => {
  it("names local, healthy, and failure states", () => {
    assert.equal(
      coolifyChipLabel({
        configured: false,
        reachable: false,
        ok: true,
        status: null,
        state: null,
        health: null,
        healthCheckEnabled: null,
        healthCheckPath: null,
      }),
      "Coolify local"
    );
    assert.equal(
      coolifyChipLabel({
        configured: true,
        reachable: true,
        ok: true,
        status: "running:healthy",
        state: "running",
        health: "healthy",
        healthCheckEnabled: true,
        healthCheckPath: "/health",
      }),
      "Coolify healthy"
    );
    assert.equal(
      coolifyChipLabel({
        configured: true,
        reachable: false,
        ok: false,
        status: null,
        state: null,
        health: null,
        healthCheckEnabled: null,
        healthCheckPath: null,
      }),
      "Coolify unreachable"
    );
  });
});

describe("getCoolifyConfig", () => {
  it("defaults uuid and API URL; configured only with a token", () => {
    const prev = {
      token: process.env.COOLIFY_TOKEN,
      url: process.env.COOLIFY_API_URL,
      uuid: process.env.COOLIFY_APP_UUID,
    };
    delete process.env.COOLIFY_TOKEN;
    delete process.env.COOLIFY_API_URL;
    delete process.env.COOLIFY_APP_UUID;
    try {
      const cfg = getCoolifyConfig();
      assert.equal(cfg.configured, false);
      assert.equal(cfg.apiUrl, DEFAULT_COOLIFY_API_URL);
      assert.equal(cfg.uuid, DEFAULT_COOLIFY_APP_UUID);
    } finally {
      if (prev.token !== undefined) process.env.COOLIFY_TOKEN = prev.token;
      if (prev.url !== undefined) process.env.COOLIFY_API_URL = prev.url;
      if (prev.uuid !== undefined) process.env.COOLIFY_APP_UUID = prev.uuid;
    }
  });
});

describe("client import boundary", () => {
  it("keeps PlatformHealthCard off the server health module", () => {
    const src = readFileSync(
      new URL("../app/components/admin/PlatformHealthCard.tsx", import.meta.url),
      "utf8"
    );
    assert.match(src, /from "@\/lib\/health-shared"/);
    assert.doesNotMatch(src, /from "@\/lib\/health["']/);
    assert.doesNotMatch(src, /@\/lib\/db/);
  });

  it("keeps health-shared free of db and pg", () => {
    const src = readFileSync(
      new URL("../lib/health-shared.ts", import.meta.url),
      "utf8"
    );
    assert.doesNotMatch(src, /lib\/db/);
    assert.doesNotMatch(src, /from ["']pg["']/);
    assert.doesNotMatch(src, /getPool/);
  });
});
