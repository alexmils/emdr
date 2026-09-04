"use client";

import { useCallback, useEffect, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";

type PasskeyPublic = {
  id: string;
  friendlyName: string | null;
  deviceType: string;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
};

export function PasskeySettings() {
  const [passkeys, setPasskeys] = useState<PasskeyPublic[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/passkey");
    const data = await res.json();
    if (res.ok) setPasskeys(data.passkeys ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addPasskey = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const optRes = await fetch("/api/auth/passkey/register/options", {
        method: "POST",
      });
      const optData = await optRes.json();
      if (!optRes.ok) {
        setError(optData.error ?? "Could not start passkey setup");
        return;
      }

      const attestation = await startRegistration({
        optionsJSON: optData.options,
      });

      const verifyRes = await fetch("/api/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: attestation,
          friendlyName: "This device",
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setError(verifyData.error ?? "Could not save passkey");
        return;
      }

      setMessage("Passkey added. You can use it on the sign-in page.");
      await load();
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      if (name === "NotAllowedError") {
        setError("Passkey setup was cancelled");
      } else {
        setError(err instanceof Error ? err.message : "Passkey setup failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const removePasskey = async (id: string) => {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/auth/passkey?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not remove passkey");
        return;
      }
      setPasskeys(data.passkeys ?? []);
      setMessage("Passkey removed");
    } catch {
      setError("Network error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="settings-group">
      <div className="settings-row">
        <p className="text-[13px] font-medium">Passkeys</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
          Sign in with Face ID, Touch ID, Windows Hello, or a security key —
          no password needed.
        </p>
      </div>

      {error && (
        <div className="settings-row">
          <p className="text-[13px] text-[var(--destructive)]">{error}</p>
        </div>
      )}
      {message && (
        <div className="settings-row">
          <p className="text-[13px] text-[#248a3d]">{message}</p>
        </div>
      )}

      {passkeys.length === 0 ? (
        <div className="settings-row">
          <p className="text-[13px] text-[var(--text-secondary)]">
            No passkeys yet
          </p>
        </div>
      ) : (
        passkeys.map((p) => (
          <div
            key={p.id}
            className="settings-row flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">
                {p.friendlyName ?? "Passkey"}
              </p>
              <p className="text-[12px] text-[var(--text-secondary)]">
                Added {new Date(p.createdAt).toLocaleDateString()}
                {p.backedUp ? " · synced" : ""}
              </p>
            </div>
            <button
              type="button"
              disabled={busyId === p.id}
              onClick={() => void removePasskey(p.id)}
              className="btn-ghost text-[13px] text-[var(--destructive)] disabled:opacity-60"
            >
              Remove
            </button>
          </div>
        ))
      )}

      <div className="settings-row">
        <button
          type="button"
          disabled={loading}
          onClick={() => void addPasskey()}
          className="btn-primary disabled:opacity-60"
        >
          {loading ? "Waiting for device…" : "Add passkey"}
        </button>
      </div>
    </div>
  );
}
