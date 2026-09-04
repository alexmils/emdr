"use client";

import { useState } from "react";
import {
  AuthShell,
  AuthField,
  AuthError,
  AuthSuccess,
  AuthLink,
} from "@/app/components/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Request failed");
        return;
      }

      setSuccess(data.message);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle="We'll email you a reset link"
      footer={
        <p>
          Remember your password? <AuthLink href="/login">Sign in</AuthLink>
        </p>
      }
    >
      <form onSubmit={submit}>
        {error && <AuthError message={error} />}
        {success && <AuthSuccess message={success} />}
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="you@example.com"
        />
        <button
          type="submit"
          disabled={loading || Boolean(success)}
          className="btn-primary mt-2 w-full disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
