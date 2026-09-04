"use client";

import Link from "next/link";
import { useState } from "react";

export default function BillingPage() {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const checkout = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? "Checkout unavailable");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      setMsg("Could not start checkout.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] p-6 md:p-10">
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← Back to session
        </Link>
        <div className="admin-panel mt-5">
          <h1 className="admin-page-title">Your billing</h1>
          <p className="admin-panel-sub mt-2">
            Upgrade to Pro when Stripe is configured. Platform admins can view
            aggregate billing in the admin dashboard.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void checkout()}
            className="btn-primary mt-4"
          >
            {busy ? "Loading…" : "Upgrade to Pro"}
          </button>
          {msg && <p className="admin-invite-msg mt-3">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
