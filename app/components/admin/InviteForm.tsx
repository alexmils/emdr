"use client";

import { useState } from "react";
import { fetchJson } from "@/lib/fetch-json";

export function InviteForm({
  onSuccess,
  compact = false,
}: {
  onSuccess?: () => void;
  compact?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      await fetchJson("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      setEmail("");
      setName("");
      setMsg("Invitation sent.");
      onSuccess?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className={compact ? "admin-invite-form" : "admin-invite-form"}
      onSubmit={(e) => void submit(e)}
    >
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="field"
      />
      <input
        type="text"
        placeholder="Name (optional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="field"
      />
      <button type="submit" disabled={busy} className="btn-primary shrink-0">
        {busy ? "Sending…" : "Invite"}
      </button>
      {msg && <p className="admin-invite-msg w-full">{msg}</p>}
    </form>
  );
}
